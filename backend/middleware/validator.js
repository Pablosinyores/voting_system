const { web3, votingContract } = require('../web3Client');

const validateContract = (req, res, next) => {
  if (!votingContract) {
    return res.status(503).json({
      success: false,
      error: { message: 'Contract not initialized. Please deploy the contract first.' }
    });
  }
  next();
};

const validateAddCandidate = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
      return res.status(400).json({
          success: false,
          error: { message: 'Candidate name is required and must be a string' }
      });
  }
  
  if (name.trim().length === 0) {
      return res.status(400).json({
          success: false,
          error: { message: 'Candidate name cannot be empty' }
      });
  }
  
  if (name.length > 100) {
      return res.status(400).json({
          success: false,
          error: { message: 'Candidate name too long (max 100 characters)' }
      });
  }
  
  next();
};

const validateVote = async (req, res, next) => {
  const { voterAddress, candidateIndex } = req.body;
  
  if (!voterAddress) {
      return res.status(400).json({
          success: false,
          error: { message: 'Voter address is required' }
      });
  }
  
  if (!web3.utils.isAddress(voterAddress)) {
      return res.status(400).json({
          success: false,
          error: { message: 'Invalid Ethereum address format' }
      });
  }
  
  if (candidateIndex === undefined || candidateIndex === null) {
      return res.status(400).json({
          success: false,
          error: { message: 'Candidate index is required' }
      });
  }
  
  const index = parseInt(candidateIndex);
  if (isNaN(index) || index < 0) {
      return res.status(400).json({
          success: false,
          error: { message: 'Candidate index must be a non-negative number' }
      });
  }
  
  // Check if user has already voted
  try {
    const hasVoted = await votingContract.methods.hasVoted(voterAddress).call();
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        error: { message: 'This address has already voted' }
      });
    }
  } catch (error) {
    return next(error);
  }
  
  next();
};

module.exports = {
  validateContract,
  validateAddCandidate,
  validateVote
};

