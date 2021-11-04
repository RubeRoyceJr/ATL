// SPDX-License-Identifier: AGPL-3.0-or-later\
pragma solidity 0.7.5;

import "../interfaces/IERC20.sol";

import "../libraries/SafeMath.sol";

contract ClamCirculatingSupply {
    using SafeMath for uint;

    bool public isInitialized;

    address public CLAM;
    address public owner;
    address[] public nonCirculatingCLAMAddresses;

    constructor( address _owner ) {
        owner = _owner;
    }

    function initialize( address _clam ) external returns ( bool ) {
        require( msg.sender == owner, "caller is not owner" );
        require( isInitialized == false );

        CLAM = _clam;

        isInitialized = true;

        return true;
    }

    function CLAMCirculatingSupply() external view returns ( uint ) {
        uint _totalSupply = IERC20( CLAM ).totalSupply();

        uint _circulatingSupply = _totalSupply.sub( getNonCirculatingCLAM() );

        return _circulatingSupply;
    }

    function getNonCirculatingCLAM() public view returns ( uint ) {
        uint _nonCirculatingCLAM;

        for( uint i=0; i < nonCirculatingCLAMAddresses.length; i = i.add( 1 ) ) {
            _nonCirculatingCLAM = _nonCirculatingCLAM.add( IERC20( CLAM ).balanceOf( nonCirculatingCLAMAddresses[i] ) );
        }

        return _nonCirculatingCLAM;
    }

    function setNonCirculatingCLAMAddresses( address[] calldata _nonCirculatingAddresses ) external returns ( bool ) {
        require( msg.sender == owner, "Sender is not owner" );
        nonCirculatingCLAMAddresses = _nonCirculatingAddresses;

        return true;
    }

    function transferOwnership( address _owner ) external returns ( bool ) {
        require( msg.sender == owner, "Sender is not owner" );

        owner = _owner;

        return true;
    }
}
