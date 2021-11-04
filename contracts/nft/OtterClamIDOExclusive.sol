// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

contract OtterClamIDOExclusive is ERC721, ERC721URIStorage, Ownable {
    constructor() ERC721('OtterClam IDO Exclusive', 'OTTERIDO') {
        // Stream Otter
        _mint(msg.sender, 1);
        _setTokenURI(
            1,
            'ipfs://QmfX3AoM1jAMXGhyW9Zu5uRp5kUffpPAKentcqeLF9BEHV'
        );

        // Ocean Otter
        _mint(msg.sender, 2);
        _setTokenURI(
            2,
            'ipfs://QmSmcSnYHNNKoxEGKYJ47Q78j2i48EHJ8aHd39pQ4xCwBQ'
        );

        // Otter of the Clam
        _mint(msg.sender, 3);
        _setTokenURI(
            3,
            'ipfs://QmdVbuf1moQLz54GzwwqzfdVtD4dqT5KoeJT33gn1fc5hE'
        );
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
