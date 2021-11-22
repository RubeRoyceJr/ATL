// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import 'hardhat/console.sol';

import '../interfaces/IERC20.sol';
import '../interfaces/IOtterTreasury.sol';

import '../types/Ownable.sol';
import '../types/ERC20.sol';

import '../libraries/SafeMath.sol';
import '../libraries/SafeERC20.sol';

interface IUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 lpMaiAmountDesired,
        uint256 lpOldClamAmountDesired,
        uint256 lpMaiAmountMin,
        uint256 lpOldClamAmountMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 lpMaiAmount,
            uint256 lpOldClamAmount,
            uint256 liquidity
        );

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 lpMaiAmountMin,
        uint256 lpOldClamAmountMin,
        address to,
        uint256 deadline
    ) external returns (uint256 lpMaiAmount, uint256 lpOldClamAmount);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB)
        external
        view
        returns (address pair);
}

contract ClamTokenMigrator is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public immutable oldCLAM;
    IERC20 public immutable newCLAM;
    IERC20 public immutable mai;
    IOtterTreasury public immutable oldTreasury;
    IOtterTreasury public immutable newTreasury;
    IUniswapV2Router public immutable quickRouter;
    IUniswapV2Factory public immutable quickFactory;

    uint8 public immutable convertRatio = 5;
    bool public clamMigrated;
    uint256 public oldSupply;

    constructor(
        address _oldCLAM,
        address _oldTreasury,
        address _quickRouter,
        address _quickFactory,
        address _newCLAM,
        address _newTreasury,
        address _mai
    ) {
        require(_oldCLAM != address(0));
        oldCLAM = IERC20(_oldCLAM);
        require(_oldTreasury != address(0));
        oldTreasury = IOtterTreasury(_oldTreasury);
        require(_quickRouter != address(0));
        quickRouter = IUniswapV2Router(_quickRouter);
        require(_quickFactory != address(0));
        quickFactory = IUniswapV2Factory(_quickFactory);
        require(_newCLAM != address(0));
        newCLAM = IERC20(_newCLAM);
        require(_newTreasury != address(0));
        newTreasury = IOtterTreasury(_newTreasury);
        require(_mai != address(0));
        mai = IERC20(_mai);
    }

    // /* ========== MIGRATION ========== */
    function migrate() external {
        require(clamMigrated);
        uint256 oldCLAMAmount = oldCLAM.balanceOf(msg.sender);

        require(oldCLAMAmount > 0);
        oldCLAM.transferFrom(msg.sender, address(this), oldCLAMAmount);

        uint256 maiAmount = oldCLAMAmount.mul(1e9);
        uint256 newCLAMAmountInLP = oldCLAMAmount.div(convertRatio);

        oldCLAM.safeApprove(address(oldTreasury), oldCLAMAmount);
        oldTreasury.withdraw(maiAmount, address(mai));

        mai.safeApprove(address(newTreasury), maiAmount);
        uint256 valueOfMai = oldTreasury.valueOfToken(address(mai), maiAmount);
        newTreasury.deposit(maiAmount, address(mai), valueOfMai);

        newCLAM.transfer(msg.sender, newCLAMAmountInLP);
    }

    /* ========== OWNABLE ========== */

    // migrate contracts
    function migrateContracts() external onlyOwner {
        clamMigrated = true;

        oldSupply = oldCLAM.totalSupply(); // log total supply at time of migration

        uint256 newCLAMTotalSupply = oldSupply.div(convertRatio);

        // withdraw old LP
        address oldPair = quickFactory.getPair(address(oldCLAM), address(mai));
        uint256 oldLPAmount = IERC20(oldPair).balanceOf(address(oldTreasury));
        oldTreasury.manage(oldPair, oldLPAmount);

        IERC20(oldPair).safeApprove(address(quickRouter), oldLPAmount);
        (uint256 lpMaiAmount, uint256 lpOldClamAmount) = quickRouter
            .removeLiquidity(
                address(mai),
                address(oldCLAM),
                oldLPAmount,
                0,
                0,
                address(this),
                1000000000000
            );

        // burn old clams
        oldCLAM.safeApprove(address(oldTreasury), lpOldClamAmount);
        uint256 extraMaiAmount = lpOldClamAmount * 1e9;
        oldTreasury.withdraw(extraMaiAmount, address(mai));

        // deposit mai from burned clams to the new treasury
        mai.safeApprove(address(newTreasury), extraMaiAmount);
        newTreasury.deposit(
            extraMaiAmount,
            address(mai),
            newTreasury.valueOfToken(address(mai), extraMaiAmount)
        );

        // mint new CLAMs from new treasury
        uint256 newCLAMAmountInLP = lpOldClamAmount.div(convertRatio);
        newTreasury.mintRewards(address(this), newCLAMAmountInLP);

        mai.safeApprove(address(quickRouter), lpMaiAmount);
        newCLAM.safeApprove(address(quickRouter), newCLAMAmountInLP);
        quickRouter.addLiquidity(
            address(mai),
            address(newCLAM),
            lpMaiAmount,
            newCLAMAmountInLP,
            lpMaiAmount,
            newCLAMAmountInLP,
            address(newTreasury),
            100000000000
        );

        // Move mai reserve to new treasury
        uint256 excessReserves = oldTreasury.excessReserves().mul(1e9);
        oldTreasury.manage(address(mai), excessReserves);

        uint256 valueOfMai = oldTreasury.valueOfToken(
            address(mai),
            excessReserves
        );

        // Mint new CLAM to migrator for migration
        mai.safeApprove(address(newTreasury), excessReserves);
        uint256 newCLAMMinted = newCLAMTotalSupply.sub(newCLAMAmountInLP).sub(1);
        uint256 profit = valueOfMai.sub(newCLAMMinted);
        newTreasury.deposit(excessReserves, address(mai), profit);
    }

    // Failsafe function to allow owner to withdraw funds sent directly to contract in case someone sends non-ohm tokens to the contract
    function withdrawToken(
        address tokenAddress,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        require(tokenAddress != address(0), 'Token address cannot be 0x0');
        require(tokenAddress != address(oldCLAM), 'Cannot withdraw: old-CLAM');
        require(amount > 0, 'Withdraw value must be greater than 0');
        if (recipient == address(0)) {
            recipient = msg.sender; // if no address is specified the value will will be withdrawn to Owner
        }

        IERC20 tokenContract = IERC20(tokenAddress);
        uint256 contractBalance = tokenContract.balanceOf(address(this));
        if (amount > contractBalance) {
            amount = contractBalance; // set the withdrawal amount equal to balance within the account.
        }
        // transfer the token from address of this contract
        tokenContract.safeTransfer(recipient, amount);
    }
}
