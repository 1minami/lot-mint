// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract Lottery is ERC721, VRFConsumerBase, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;

    bytes32 internal keyHash; // identifies which Chainlink oracle to use
    uint internal fee; // fee to get random number
    uint public randomResult;

    address[] public players;
    uint public lotteryId;
    mapping(uint => address) public lotteryHistory;

    constructor()
        ERC721("Lottery-dapp", "LOT")
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF coordinator
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709 // LINK token address
        )
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
        fee = 0.1 * 10**18; // 0.1 LINK

        lotteryId = 1;
    }

    function enter() public {
        players.push(msg.sender);
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function pickWinner() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(players.length > 1);
        getRandomNumber();
    }

    function getRandomNumber() public returns (bytes32 requestId) {
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint randomness)
        internal
        override
    {
        randomResult = randomness % players.length;
        _grantRole(MINTER_ROLE, players[randomResult]);
    }

    function getWinnerByLottery(uint lottery) public view returns (address) {
        return lotteryHistory[lottery];
    }

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://ipfs.io/ipfs/QmWspTzWbeg7W9HyvFquigV5uPAQSwqoBmr86H6oum1Upt/";
    }

    function mintWinner() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(players[randomResult], tokenId);
        _setTokenURI(tokenId, _baseURI());

        lotteryHistory[lotteryId] = players[randomResult];
        lotteryId++;

        _revokeRole(MINTER_ROLE, players[randomResult]);
        players = new address[](0);
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
