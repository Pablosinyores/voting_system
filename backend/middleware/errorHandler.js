/**
 * Error handling middleware
 * Catches and formats errors from routes
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.message.includes('revert')) {
    status = 400;
    // Extract revert reason from error message
    const revertMatch = err.message.match(/revert (.+?)(?:"|$)/);
    if (revertMatch) {
      message = `Transaction reverted: ${revertMatch[1]}`;
    } else {
      message = 'Transaction reverted';
    }
  } else if (err.message.includes('insufficient funds')) {
    status = 400;
    message = 'Insufficient funds for transaction';
  } else if (err.message.includes('invalid address')) {
    status = 400;
    message = 'Invalid Ethereum address';
  } else if (err.message.includes('Contract address not found')) {
    status = 503;
    message = 'Contract not deployed. Please deploy the contract first.';
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;

