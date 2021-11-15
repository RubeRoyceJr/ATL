// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

interface IOtterTreasury {
    function excessReserves() external view returns ( uint );
    function deposit( uint _amount, address _token, uint _profit ) external returns ( uint sent_ );
    function valueOfToken( address _token, uint _amount ) external view returns ( uint value_ );
    function mintRewards( address _recipient, uint _amount ) external;
    function manage( address _token, uint _amount ) external;
    function withdraw( uint _amount, address _token ) external;
}
