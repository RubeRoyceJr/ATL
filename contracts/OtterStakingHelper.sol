// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IERC20.sol';
import './interfaces/IOtterStaking.sol';

contract OtterStakingHelper {
    address public immutable staking;
    address public immutable CLAM;

    constructor(address _staking, address _CLAM) {
        require(_staking != address(0));
        staking = _staking;
        require(_CLAM != address(0));
        CLAM = _CLAM;
    }

    function stake(uint256 _amount, address _recipient) external {
        IERC20(CLAM).transferFrom(msg.sender, address(this), _amount);
        IERC20(CLAM).approve(staking, _amount);
        IOtterStaking(staking).stake(_amount, _recipient);
        IOtterStaking(staking).claim(_recipient);
    }
}
