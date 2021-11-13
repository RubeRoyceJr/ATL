// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";
import "../interfaces/IOtterTreasury.sol";

import "../libraries/Ownable.sol";
import "../libraries/SafeMath.sol";
import "../libraries/ERC20.sol";

interface IUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);
}

interface IStakingV1 {
    function unstake(uint256 _amount, bool _trigger) external;

    function index() external view returns (uint256);
}

contract ClamTokenMigrator is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public immutable oldCLAM;
    IOtterTreasury public immutable oldTreasury;
    IUniswapV2Router public immutable quickRouter;

    IOtterTreasury public newTreasury;
    IERC20 public newCLAM;

    bool public clamMigrated;
    uint256 public oldSupply;

    constructor(
        address _oldCLAM,
        address _oldTreasury,
        address _quick
    ) {
        require(_oldCLAM != address(0));
        oldCLAM = IERC20(_oldCLAM);
        require(_oldTreasury != address(0));
        oldTreasury = IOtterTreasury(_oldTreasury);
        require(_quick != address(0));
        quickRouter = IUniswapV2Router(_quick);
    }

    // /* ========== MIGRATION ========== */
    // // migrate OHMv1, sOHMv1, or wsOHM for OHMv2, sOHMv2, or gOHM
    // function migrate(
    //     uint256 _amount,
    //     TYPE _from,
    //     TYPE _to
    // ) external {
    //     uint256 sAmount = _amount;
    //     uint256 wAmount = oldwsOHM.sOHMTowOHM(_amount);

    //     if (_from == TYPE.UNSTAKED) {
    //         oldCLAM.safeTransferFrom(msg.sender, address(this), _amount);
    //     } else if (_from == TYPE.STAKED) {
    //         oldsOHM.safeTransferFrom(msg.sender, address(this), _amount);
    //     } else if (_from == TYPE.WRAPPED) {
    //         oldwsOHM.safeTransferFrom(msg.sender, address(this), _amount);
    //         wAmount = _amount;
    //         sAmount = oldwsOHM.wOHMTosOHM(_amount);
    //     }

    //     if (clamMigrated) {
    //         require(oldSupply >= oldCLAM.totalSupply(), "OHMv1 minted");
    //         _send(wAmount, _to);
    //     } else {
    //         gOHM.mint(msg.sender, wAmount);
    //     }
    // }

    // migrate all olympus tokens held
    // function migrateAll(TYPE _to) external {
    //     uint256 ohmBal = oldCLAM.balanceOf(msg.sender);
    //     uint256 sOHMBal = oldsOHM.balanceOf(msg.sender);
    //     uint256 wsOHMBal = oldwsOHM.balanceOf(msg.sender);

    //     if (ohmBal > 0) {
    //         oldCLAM.safeTransferFrom(msg.sender, address(this), ohmBal);
    //     }
    //     if (sOHMBal > 0) {
    //         oldsOHM.safeTransferFrom(msg.sender, address(this), sOHMBal);
    //     }
    //     if (wsOHMBal > 0) {
    //         oldwsOHM.safeTransferFrom(msg.sender, address(this), wsOHMBal);
    //     }

    //     uint256 wAmount = wsOHMBal.add(oldwsOHM.sOHMTowOHM(ohmBal.add(sOHMBal)));
    //     if (clamMigrated) {
    //         require(oldSupply >= oldCLAM.totalSupply(), "OHMv1 minted");
    //         _send(wAmount, _to);
    //     } else {
    //         gOHM.mint(msg.sender, wAmount);
    //     }
    // }

    // send preferred token
    // function _send(uint256 wAmount, TYPE _to) internal {
    //     if (_to == TYPE.WRAPPED) {
    //         gOHM.safeTransfer(msg.sender, wAmount);
    //     } else if (_to == TYPE.STAKED) {
    //         newStaking.unwrap(msg.sender, wAmount);
    //     } else if (_to == TYPE.UNSTAKED) {
    //         newStaking.unstake(msg.sender, wAmount, false, false);
    //     }
    // }

    // bridge back to CLAM
    // function bridgeBack(uint256 _amount, TYPE _to) external {
    //     if (!clamMigrated) {
    //         gOHM.burn(msg.sender, _amount);
    //     } else {
    //         gOHM.safeTransferFrom(msg.sender, address(this), _amount);
    //     }

    //     uint256 amount = oldwsOHM.wOHMTosOHM(_amount);
    //     // error throws if contract does not have enough of type to send
    //     if (_to == TYPE.UNSTAKED) {
    //         oldCLAM.safeTransfer(msg.sender, amount);
    //     } else if (_to == TYPE.STAKED) {
    //         oldsOHM.safeTransfer(msg.sender, amount);
    //     } else if (_to == TYPE.WRAPPED) {
    //         oldwsOHM.transfer(msg.sender, _amount);
    //     }
    // }

    /* ========== OWNABLE ========== */

    // withdraw backing of migrated OHM
    // function defund(address reserve) external onlyOwner {
    //     require(clamMigrated && timelockEnd < block.number && timelockEnd != 0);
    //     oldwsOHM.unwrap(oldwsOHM.balanceOf(address(this)));

    //     uint256 amountToUnstake = oldsOHM.balanceOf(address(this));
    //     oldsOHM.approve(address(oldStaking), amountToUnstake);
    //     oldStaking.unstake(amountToUnstake, false);

    //     uint256 balance = oldCLAM.balanceOf(address(this));

    //     oldSupply = oldSupply.sub(balance);

    //     uint256 amountToWithdraw = balance.mul(1e9);
    //     oldCLAM.approve(address(oldTreasury), amountToWithdraw);
    //     oldTreasury.withdraw(amountToWithdraw, reserve);
    //     IERC20(reserve).safeTransfer(address(newTreasury), IERC20(reserve).balanceOf(address(this)));

    //     emit Defunded(balance);
    // }

    // call internal migrate token function
    // function migrateToken(address token) external onlyOwner {
    //     _migrateToken(token, false);
    // }

    /**
     *   @notice Migrate LP and pair with new CLAM
     */
    function migrateLP(
        address pair,
        address mai
    ) external onlyOwner {
        require(clamMigrated, "Need migrate contracts");

        uint256 oldLPAmount = IERC20(pair).balanceOf(address(oldTreasury));
        oldTreasury.manage(pair, oldLPAmount);

        IERC20(pair).approve(address(quickRouter), oldLPAmount);
        (uint256 amountA, uint256 amountB) = quickRouter.removeLiquidity(mai, address(oldCLAM), oldLPAmount, 0, 0, address(this), 1000000000000);

        uint newCLAMAmount = amountB / 5;
        newTreasury.mintRewards(address(this), newCLAMAmount);

        IERC20(mai).approve(address(quickRouter), amountA);
        newCLAM.approve(address(quickRouter), newCLAMAmount);

        quickRouter.addLiquidity(mai, address(newCLAM), amountA, newCLAMAmount, amountA, newCLAMAmount, address(newTreasury), 100000000000);
    }

    // Failsafe function to allow owner to withdraw funds sent directly to contract in case someone sends non-ohm tokens to the contract
    function withdrawToken(
        address tokenAddress,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0x0");
        require(tokenAddress != address(oldCLAM), "Cannot withdraw: old-OHM");
        require(amount > 0, "Withdraw value must be greater than 0");
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

    // migrate contracts
    function migrateContracts(
        address _newTreasury,
        address _newCLAM,
        address _mai
    ) external onlyOwner {
        clamMigrated = true;

        require(_newTreasury != address(0));
        newTreasury = IOtterTreasury(_newTreasury);
        require(_newCLAM != address(0));
        newCLAM = IERC20(_newCLAM);

        oldSupply = oldCLAM.totalSupply(); // log total supply at time of migration

        _migrateToken(_mai, true); // deposit excess mai into new treasury so reserves can be accounted for
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
     *   @notice Migrate token from old treasury to new treasury
     */
    function _migrateToken(address token, bool deposit) internal {
        uint256 balance = IERC20(token).balanceOf(address(oldTreasury));

        uint256 excessReserves = oldTreasury.excessReserves();
        uint256 tokenValue = newTreasury.valueOfToken(token, balance);

        if (tokenValue > excessReserves) {
            tokenValue = excessReserves;
            balance = excessReserves * 10**9;
        }

        oldTreasury.manage(token, balance);

        if (deposit) {
            IERC20(token).safeApprove(address(newTreasury), balance);
            newTreasury.deposit(balance, token, tokenValue);
        } else {
            IERC20(token).transfer(address(newTreasury), balance);
        }
    }
}
