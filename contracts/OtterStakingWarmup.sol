// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;


import "./interfaces/IERC20.sol";


contract OtterStakingWarmup {

    address public immutable staking;
    address public immutable sCLAM;

    constructor ( address _staking, address _sCLAM ) {
        require( _staking != address(0) );
        staking = _staking;
        require( _sCLAM != address(0) );
        sCLAM = _sCLAM;
    }

    function retrieve( address _staker, uint _amount ) external {
        require( msg.sender == staking );
        IERC20( sCLAM ).transfer( _staker, _amount );
    }
}
