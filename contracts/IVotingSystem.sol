// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IVotingSystem
/// @notice Interface for the Voting System contract
/// @dev Defines the structure and events for the voting system
interface IVotingSystem {
    /// @notice Represents a candidate in the voting system
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    /// @notice Emitted when a new candidate is added
    /// @param candidateIndex The index of the newly added candidate
    /// @param name The name of the candidate
    event CandidateAdded(uint256 indexed candidateIndex, string name);

    /// @notice Emitted when a vote is cast
    /// @param voter The address of the voter
    /// @param candidateIndex The index of the candidate voted for
    event VoteCast(address indexed voter, uint256 indexed candidateIndex);

    /// @notice Thrown when a non-admin tries to perform an admin-only action
    error Unauthorized();

    /// @notice Thrown when trying to add a candidate with an empty name
    error EmptyCandidateName();

    /// @notice Thrown when an address tries to vote more than once
    error AlreadyVoted();

    /// @notice Thrown when an invalid candidate index is provided
    /// @param index The invalid candidate index
    error InvalidCandidateIndex(uint256 index);

    /// @notice Thrown when trying to get winner with no candidates
    error NoCandidates();

    /// @notice Returns the address of the contract admin
    /// @return The admin address
    function admin() external view returns (address);

    /// @notice Adds a new candidate to the voting system
    /// @param name The name of the candidate
    /// @dev Only the admin can add candidates
    function addCandidate(string memory name) external;

    /// @notice Casts a vote for a candidate
    /// @param candidateIndex The index of the candidate to vote for
    /// @dev Each address can only vote once
    function vote(uint256 candidateIndex) external;

    /// @notice Returns all candidates with their vote counts
    /// @return An array of all candidates
    function getCandidates() external view returns (Candidate[] memory);

    /// @notice Returns the name of the candidate with the most votes
    /// @return name The name of the winning candidate
    /// @dev Returns the first candidate in case of a tie
    function getWinner() external view returns (string memory name);

    /// @notice Returns the total number of candidates
    /// @return The number of candidates
    function getCandidateCount() external view returns (uint256);

    /// @notice Checks if a specific address has voted
    /// @param _voter The address to check
    /// @return Whether the address has voted
    function hasAddressVoted(address _voter) external view returns (bool);
}

