const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const web3 = new Web3(process.env.RPC_URL || 'http://127.0.0.1:8545');

let contractABI = [];
let contractAddress = '';
let votingContract = null;
let adminAddress = '';

async function initialize() {
  const artifactPath = path.join(
    __dirname,
    '../ignition/deployments/chain-31337/artifacts/VotingSystemModule#VotingSystem.json'
  );

  try {
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      contractABI = artifact.abi;
    } else {
      console.warn('⚠️  Contract artifact not found');
    }
  } catch (error) {
    console.error('Error loading ABI:', error.message);
  }

  const addressesPath = path.join(
    __dirname,
    '../ignition/deployments/chain-31337/deployed_addresses.json'
  );

  try {
    if (fs.existsSync(addressesPath)) {
      const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
      contractAddress = addresses['VotingSystemModule#VotingSystem'] || '';
    } else {
      console.warn('⚠️  Deployment addresses not found');
    }
  } catch (error) {
    console.error('Error loading contract address:', error.message);
  }

  try {
    votingContract = new web3.eth.Contract(contractABI, contractAddress);
  } catch (error) {
    console.error('Error creating contract instance:', error.message);
  }

  try {
    const accounts = await web3.eth.getAccounts();
    adminAddress = accounts[0];
  } catch (error) {
    console.error('Failed to get accounts:', error.message);
  }

  if (votingContract && contractAddress) {
    try {
      const contractAdmin = await votingContract.methods.admin().call();
      adminAddress = contractAdmin;
    } catch (error) {
      console.warn('⚠️  Could not get admin from contract');
    }
  }
}

initialize();

module.exports = {
  web3,
  votingContract,
  adminAddress
};
