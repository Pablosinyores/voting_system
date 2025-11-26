/**
 * API Testing Script
 * Tests all endpoints of the Voting System API
 * 
 * Requirements:
 * - Node.js 18+ (for native fetch support)
 * - Backend server running on http://localhost:3000
 * - Hardhat node running on http://127.0.0.1:8545
 * - Contract deployed
 */

const BASE_URL = 'http://localhost:3000/api';
const { web3, adminAddress } = require('./web3Client');

// Helper function to handle API responses
async function handleResponse(res, testName) {
  const data = await res.json();
  
  if (!res.ok) {
    const errorMsg = typeof data.error === 'object' ? data.error.message : data.error;
    throw new Error(`${testName} failed: ${errorMsg || res.statusText}`);
  }
  
  if (!data.success) {
    const errorMsg = typeof data.error === 'object' ? data.error.message : data.error;
    throw new Error(`${testName} failed: ${errorMsg || 'Unknown error'}`);
  }
  
  return data;
}

async function testAPI() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Voting System API');
  console.log('='.repeat(60));

  try {
    // Wait for web3Client to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const availableAccounts = await web3.eth.getAccounts();
    
    if (availableAccounts.length < 4) {
      throw new Error('Not enough accounts available. Need at least 4 accounts.');
    }
    
    const voterAddresses = availableAccounts.slice(1, 4);
    console.log(`✅ Found ${availableAccounts.length} account(s)`);
    console.log(`   Admin: ${adminAddress || availableAccounts[0]}`);
    console.log(`   Voters: ${voterAddresses.length} accounts`);

    // Test 1: Add candidates
    console.log('\n📋 Test 1: Adding candidates...');
    const candidates = ['Alice', 'Bob', 'Charlie'];
    
    for (const name of candidates) {
      const res = await fetch(`${BASE_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await handleResponse(res, `Add candidate: ${name}`);
      console.log(`✅ Added candidate: ${name} (index: ${data.data.candidateIndex})`);
    }

    // Test 2: Get all candidates
    console.log('\n📋 Test 2: Getting all candidates...');
    const candidatesRes = await fetch(`${BASE_URL}/candidates`);
    const candidatesData = await handleResponse(candidatesRes, 'Get candidates');
    console.log(`✅ Found ${candidatesData.data.totalCandidates} candidate(s):`);
    candidatesData.data.candidates.forEach(c => {
      console.log(`   - ${c.name}: ${c.voteCount} votes`);
    });

    // Test 3: Cast votes
    console.log('\n📋 Test 3: Casting votes...');
    
    // Vote for Alice from voter 1
    let voteRes = await fetch(`${BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress: voterAddresses[0],
        candidateIndex: 0
      })
    });
    let voteData = await handleResponse(voteRes, 'Vote 1 (Alice)');
    console.log(`✅ Vote 1: ${voteData.data.voterAddress} voted for ${voteData.data.candidateName}`);

    // Vote for Alice from voter 2
    voteRes = await fetch(`${BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress: voterAddresses[1],
        candidateIndex: 0
      })
    });
    voteData = await handleResponse(voteRes, 'Vote 2 (Alice)');
    console.log(`✅ Vote 2: ${voteData.data.voterAddress} voted for ${voteData.data.candidateName}`);

    // Vote for Bob from voter 3
    voteRes = await fetch(`${BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress: voterAddresses[2],
        candidateIndex: 1
      })
    });
    voteData = await handleResponse(voteRes, 'Vote 3 (Bob)');
    console.log(`✅ Vote 3: ${voteData.data.voterAddress} voted for ${voteData.data.candidateName}`);

    // Test 4: Try to vote twice (should fail)
    console.log('\n📋 Test 4: Testing double vote prevention...');
    voteRes = await fetch(`${BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress: voterAddresses[0],
        candidateIndex: 1
      })
    });
    
    const voteDataError = await voteRes.json();
    if (!voteDataError.success && voteRes.status === 400) {
      const errorMsg = typeof voteDataError.error === 'object' 
        ? voteDataError.error.message 
        : voteDataError.error;
      console.log(`✅ Double vote correctly prevented: ${errorMsg}`);
    } else {
      throw new Error('Double vote should have been prevented but was allowed!');
    }

    // Test 5: Get updated candidates
    console.log('\n📋 Test 5: Getting updated vote counts...');
    const updatedCandidatesRes = await fetch(`${BASE_URL}/candidates`);
    const updatedCandidatesData = await handleResponse(updatedCandidatesRes, 'Get updated candidates');
    console.log('✅ Updated vote counts:');
    updatedCandidatesData.data.candidates.forEach(c => {
      console.log(`   - ${c.name}: ${c.voteCount} votes`);
    });

    // Test 6: Get winner
    console.log('\n📋 Test 6: Getting winner...');
    const winnerRes = await fetch(`${BASE_URL}/winner`);
    const winnerData = await handleResponse(winnerRes, 'Get winner');
    if (winnerData.data.winner) {
      console.log(`✅ Winner: ${winnerData.data.winner.name} with ${winnerData.data.winner.voteCount} votes`);
    } else {
      console.log('✅ No winner yet (no votes cast)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error.message);
    console.error('='.repeat(60));
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testAPI();

