// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IVotingSystem.sol";

/// @title Voting System
/// @notice A decentralized voting system where users can vote for candidates
/// @dev Only the contract owner can add candidates, and users can vote only once
contract VotingSystem is IVotingSystem {
    /// @notice The address of the contract owner/admin
    address public immutable override admin;

    /// @notice Array of all candidates
    Candidate[] public candidates;

    /// @notice Mapping to track if an address has already voted
    mapping(address => bool) public hasVoted;

    /// @notice Mapping to track which candidate an address voted for
    mapping(address => uint256) public voterToCandidate;

    /// @notice Restricts function access to only the admin
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    /// @notice Initializes the contract and sets the deployer as admin
    constructor() {
        admin = msg.sender;
    }

    /// @inheritdoc IVotingSystem
    function addCandidate(string memory name) external override onlyAdmin {
        if (bytes(name).length == 0) revert EmptyCandidateName();
        candidates.push(Candidate({name: name, voteCount: 0}));
        emit CandidateAdded(candidates.length - 1, name);
    }

    /// @inheritdoc IVotingSystem
    function vote(uint256 candidateIndex) external override {
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (candidateIndex >= candidates.length) {
            revert InvalidCandidateIndex(candidateIndex);
        }

        hasVoted[msg.sender] = true;
        voterToCandidate[msg.sender] = candidateIndex;
        candidates[candidateIndex].voteCount++;

        emit VoteCast(msg.sender, candidateIndex);
    }

    /// @inheritdoc IVotingSystem
    function getCandidates() external view override returns (Candidate[] memory) {
        return candidates;
    }

    /// @inheritdoc IVotingSystem
    function getWinner() external view override returns (string memory name) {
        if (candidates.length == 0) revert NoCandidates();

        uint256 maxVotes = 0;
        uint256 winnerIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }

        return candidates[winnerIndex].name;
    }

    /// @inheritdoc IVotingSystem
    function getCandidateCount() external view override returns (uint256) {
        return candidates.length;
    }

    /// @inheritdoc IVotingSystem
    function hasAddressVoted(address _voter) external view override returns (bool) {
        return hasVoted[_voter];
    }
}
