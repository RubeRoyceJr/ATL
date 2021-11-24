// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

interface IAtlantisStaking {
    function stake( uint _amount, address _recipient ) external returns ( bool );
    function claim ( address _recipient ) external;
}
