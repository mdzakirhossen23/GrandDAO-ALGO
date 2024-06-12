// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;
import "./lib/IWormhole.sol";

contract CrossChain {
    IWormhole public immutable wormhole;
    struct Vote {
        bytes _ideas_votes_id;
        uint64 _goal_id;
        uint64 _ideas_id;
        string _wallet;
    }

    constructor(address _wormhole) {
        wormhole = IWormhole(_wormhole);
    }

    function sendVAA(
        bytes memory _ideas_votes_id,
        uint64 _goal_id,
        uint64 _ideas_id,
        string memory _wallet
    ) public payable returns (    uint64 messageSequence) {
        uint256 wormholeFee = wormhole.messageFee();

        Vote memory parsedMessage = Vote({
            _ideas_votes_id: _ideas_votes_id,
            _goal_id: _goal_id,
            _ideas_id: _ideas_id,
            _wallet: _wallet
        });

        // encode the Vote struct into bytes
        bytes memory encodedMessage = abi.encode(parsedMessage);
        // Send the Vote message by calling publishMessage on the
        // Wormhole core contract and paying the Wormhole protocol fee.
        messageSequence = wormhole.publishMessage{value: wormholeFee}(
            0, // batchID
            encodedMessage,
            0
        );
    }

    
    function getMessageFee() public view returns (    uint256) {
       return wormhole.messageFee();

    }

}
