const express = require('express');
const router = express.Router();
const { web3, votingContract, adminAddress } = require('../web3Client');
const { validateContract, validateAddCandidate, validateVote } = require('../middleware/validator');

const GAS_LIMIT = process.env.GAS_LIMIT || 500000;

/**
 * POST /api/candidates
 * Add a new candidate (admin only)
 * Body: { name: string }
 */
router.post('/candidates', validateContract, validateAddCandidate, async (req, res, next) => {
  try {
    const { name } = req.body;

    // Get admin address dynamically
    let adminAddr = adminAddress;
    if (!adminAddr) {
      try {
        adminAddr = await votingContract.methods.admin().call();
      } catch (error) {
        const accounts = await web3.eth.getAccounts();
        adminAddr = accounts[0];
      }
    }

    if (!adminAddr) {
      return res.status(500).json({
        success: false,
        error: { message: 'Admin address not available' }
      });
    }

    // Call addCandidate function
    const receipt = await votingContract.methods.addCandidate(name).send({
      from: adminAddr,
      gas: GAS_LIMIT
    });

    // Get the candidate index from the event
    let candidateIndex = null;
    
    if (receipt.events && receipt.events.CandidateAdded) {
      candidateIndex = Number(receipt.events.CandidateAdded.returnValues.candidateIndex);
    } else if (receipt.logs && receipt.logs.length > 0) {
      try {
        const event = votingContract._jsonInterface.find(e => e.name === 'CandidateAdded' && e.type === 'event');
        if (event) {
          const decoded = web3.eth.abi.decodeLog(
            event.inputs,
            receipt.logs[0].data,
            receipt.logs[0].topics.slice(1)
          );
          candidateIndex = Number(decoded.candidateIndex);
        }
      } catch (e) {
        // Fallback to getCandidateCount
      }
    }
    
    // Fallback: use getCandidateCount
    if (candidateIndex === null) {
      const count = await votingContract.methods.getCandidateCount().call();
      candidateIndex = Number(count) - 1;
    }

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      data: {
        name,
        candidateIndex,
        transactionHash: receipt.transactionHash
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/candidates
 * Get all candidates with their vote counts
 */
router.get('/candidates', validateContract, async (req, res, next) => {
  try {
    const candidates = await votingContract.methods.getCandidates().call();

    const formattedCandidates = candidates.map((candidate, index) => ({
      index,
      name: candidate.name,
      voteCount: Number(candidate.voteCount)
    }));

    res.json({
      success: true,
      data: {
        candidates: formattedCandidates,
        totalCandidates: formattedCandidates.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vote
 * Cast a vote for a candidate
 * Body: { voterAddress: string, candidateIndex: number }
 */
router.post('/vote', validateContract, validateVote, async (req, res, next) => {
  try {
    const { voterAddress, candidateIndex } = req.body;
    const index = parseInt(candidateIndex);

    // Cast vote
    const receipt = await votingContract.methods.vote(index).send({
      from: voterAddress,
      gas: GAS_LIMIT
    });

    // Get the candidate name
    const candidates = await votingContract.methods.getCandidates().call();
    const candidateName = candidates[index].name;

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        voterAddress,
        candidateIndex: index,
        candidateName,
        transactionHash: receipt.transactionHash
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/winner
 * Get the current winner
 */
router.get('/winner', validateContract, async (req, res, next) => {
  try {
    const winnerName = await votingContract.methods.getWinner().call();

    if (!winnerName || winnerName === '') {
      return res.json({
        success: true,
        message: 'No winner yet (no votes cast)',
        data: {
          winner: null
        }
      });
    }

    // Get all candidates to find winner details
    const candidates = await votingContract.methods.getCandidates().call();
    const winnerCandidate = candidates.find(c => c.name === winnerName);

    res.json({
      success: true,
      data: {
        winner: {
          name: winnerName,
          voteCount: winnerCandidate ? Number(winnerCandidate.voteCount) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

