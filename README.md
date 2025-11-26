# Decentralized Voting System

A decentralized voting system built with Ethereum smart contracts and a Node.js backend. This system allows users to vote for candidates in a transparent, secure, and immutable manner on the blockchain.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Smart Contract Logic](#smart-contract-logic)
- [Backend Architecture](#backend-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

## 🎯 Overview

This project implements a complete decentralized voting system with:

- **Smart Contract**: Solidity contract deployed on Ethereum (local Hardhat network)
- **Backend API**: Node.js/Express REST API that interacts with the smart contract using Web3.js
- **Testing**: Comprehensive test suite for both smart contract and backend integration

## ✨ Features

### Smart Contract Features
- ✅ Only contract owner (admin) can add candidates
- ✅ One vote per Ethereum address
- ✅ View all candidates with vote counts
- ✅ Declare winner (candidate with most votes)
- ✅ Gas-efficient custom errors
- ✅ Event emissions for transparency
- ✅ Interface-based design for better code organization

### Backend Features
- ✅ RESTful API endpoints
- ✅ Input validation middleware
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Rate limiting
- ✅ CORS support
- ✅ Automatic contract initialization from deployment artifacts

## 🔐 Smart Contract Logic

### Contract: `VotingSystem.sol`

The `VotingSystem` contract implements a decentralized voting mechanism with the following key components:

#### **State Variables**

```solidity
address public immutable admin;              // Contract owner (set at deployment)
Candidate[] public candidates;              // Array of all candidates
mapping(address => bool) public hasVoted;   // Tracks if an address has voted
mapping(address => uint256) public voterToCandidate; // Maps voter to their chosen candidate
```

#### **Core Functions**

1. **`addCandidate(string memory name)`** (Admin Only)
   - Adds a new candidate to the voting system
   - Protected by `onlyAdmin` modifier
   - Validates that name is not empty
   - Emits `CandidateAdded` event
   - **Reverts with**: `EmptyCandidateName` if name is empty, `Unauthorized` if caller is not admin

2. **`vote(uint256 candidateIndex)`**
   - Allows an address to cast a vote for a candidate
   - Enforces one-vote-per-address rule
   - Validates candidate index exists
   - Updates vote count and tracking mappings
   - Emits `VoteCast` event
   - **Reverts with**: `AlreadyVoted` if address already voted, `InvalidCandidateIndex` if index is invalid

3. **`getCandidates()`** (View)
   - Returns array of all candidates with their vote counts
   - No gas cost (view function)

4. **`getWinner()`** (View)
   - Returns the name of the candidate with the most votes
   - In case of a tie, returns the first candidate with max votes
   - **Reverts with**: `NoCandidates` if no candidates exist

5. **`getCandidateCount()`** (View)
   - Returns the total number of candidates

6. **`hasAddressVoted(address _voter)`** (View)
   - Checks if a specific address has already voted

#### **Security Features**

- **Access Control**: `onlyAdmin` modifier ensures only the contract owner can add candidates
- **Vote Protection**: `hasVoted` mapping prevents double voting
- **Input Validation**: Custom errors for invalid inputs (gas-efficient)
- **Immutable Admin**: Admin address cannot be changed after deployment

#### **Gas Optimization**

- Uses custom errors instead of `require` statements (saves gas)
- Efficient storage patterns (mappings for O(1) lookups)
- Events for off-chain tracking instead of storing redundant data

## 🏗️ Backend Architecture

### **Structure**

```
backend/
├── server.js              # Express app setup and middleware configuration
├── web3Client.js          # Web3 initialization and contract instance creation
├── routes/
│   └── voting.js          # API route handlers for voting operations
├── middleware/
│   ├── validator.js       # Input validation middleware
│   ├── errorHandler.js    # Centralized error handling
│   └── logger.js          # Request logging middleware
└── test-api.js            # Integration test script
```

### **Components**

#### **1. Web3 Client (`web3Client.js`)**
- Initializes Web3 connection to Hardhat local node
- Loads contract ABI from Hardhat Ignition deployment artifacts
- Loads deployed contract address from `deployed_addresses.json`
- Creates contract instance for interaction
- Auto-initializes on module load

#### **2. Routes (`routes/voting.js`)**
- **POST `/api/candidates`**: Add a new candidate (admin only)
- **GET `/api/candidates`**: Get all candidates with vote counts
- **POST `/api/vote`**: Cast a vote for a candidate
- **GET `/api/winner`**: Get the current winner

#### **3. Middleware**

**Validator (`middleware/validator.js`)**:
- `validateContract`: Ensures contract is initialized
- `validateAddCandidate`: Validates candidate name (type, length, non-empty)
- `validateVote`: Validates voter address format and checks if already voted

**Error Handler (`middleware/errorHandler.js`)**:
- Centralized error handling
- Parses blockchain-specific errors (revert, insufficient funds, etc.)
- Returns consistent error response format

**Logger (`middleware/logger.js`)**:
- Logs all incoming requests with status codes

#### **4. Server Configuration (`server.js`)**
- Express app setup
- CORS enabled
- Rate limiting (100 requests per minute)
- JSON body parsing
- Request logging with Morgan
- Error handling middleware

## 📦 Prerequisites

- **Node.js** 18+ (for native fetch support)
- **npm** or **yarn**
- Basic understanding of Ethereum and Solidity

## 🚀 Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
```bash
npm install
```

3. **Environment Setup** (Optional):
Create a `.env` file in the root directory:
```env
RPC_URL=http://127.0.0.1:8545
PORT=3000
GAS_LIMIT=500000
```

## 💻 Usage

### **Step 1: Start Hardhat Local Node**

In a terminal, start the Hardhat local blockchain:

```bash
npm run node
# or
npx hardhat node
```

This will:
- Start a local Ethereum node on `http://127.0.0.1:8545`
- Provide 20 test accounts with pre-funded ETH
- Keep running until you stop it (Ctrl+C)

### **Step 2: Deploy the Contract**

In a **new terminal**, deploy the contract to the local network:

```bash
npx hardhat ignition deploy ignition/modules/VotingSystem.js --network localhost
```

This will:
- Deploy the `VotingSystem` contract
- Save the deployment address to `ignition/deployments/chain-31337/deployed_addresses.json`
- Save the contract artifact to `ignition/deployments/chain-31337/artifacts/`

**Note**: The contract address will be displayed in the terminal. The backend automatically loads this address.

### **Step 3: Start the Backend Server**

In a **new terminal**, start the Express backend:

```bash
npm run backend
```

The server will:
- Start on `http://localhost:3000` (or PORT from .env)
- Initialize Web3 connection
- Load contract ABI and address
- Be ready to accept API requests

### **Step 4: Test the API** (Optional)

In a **new terminal**, run the integration tests:

```bash
node backend/test-api.js
```

This script will:
- Add candidates (Alice, Bob, Charlie)
- Cast votes from different addresses
- Test double-vote prevention
- Get updated vote counts
- Declare the winner

## 🧪 Testing

### **Smart Contract Tests**

Run the Hardhat test suite:

```bash
npm test
# or
npx hardhat test
```

This runs all tests in `test/VotingSystem.js`, including:
- Deployment tests
- Add candidate tests (admin and non-admin)
- Vote functionality tests
- Double-vote prevention tests
- Winner declaration tests
- Custom error tests
- Event emission tests
- Integration scenarios

### **Backend Integration Tests**

Run the API integration test script:

```bash
node backend/test-api.js
```

**Prerequisites**:
- Hardhat node running (`npm run node`)
- Contract deployed (`npx hardhat ignition deploy ignition/modules/VotingSystem.js --network localhost`)
- Backend server running (`npm run backend`)

The test script will:
1. Get available accounts from Web3
2. Add 3 candidates (Alice, Bob, Charlie)
3. Get all candidates
4. Cast votes from different addresses
5. Test double-vote prevention
6. Get updated vote counts
7. Get the winner

## 📡 API Endpoints

### **Base URL**: `http://localhost:3000/api`

### **1. Add Candidate**
```http
POST /api/candidates
Content-Type: application/json

{
  "name": "Alice"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Candidate added successfully",
  "data": {
    "name": "Alice",
    "candidateIndex": 0,
    "transactionHash": "0x..."
  }
}
```

**Errors**:
- `400`: Invalid input (empty name, wrong type, etc.)
- `500`: Admin address not available
- `503`: Contract not initialized

### **2. Get All Candidates**
```http
GET /api/candidates
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "index": 0,
        "name": "Alice",
        "voteCount": 2
      },
      {
        "index": 1,
        "name": "Bob",
        "voteCount": 1
      }
    ],
    "totalCandidates": 2
  }
}
```

### **3. Cast a Vote**
```http
POST /api/vote
Content-Type: application/json

{
  "voterAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "candidateIndex": 0
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "voterAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "candidateIndex": 0,
    "candidateName": "Alice",
    "transactionHash": "0x..."
  }
}
```

**Errors**:
- `400`: Invalid address, invalid index, already voted
- `500`: Transaction failed

### **4. Get Winner**
```http
GET /api/winner
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "winner": {
      "name": "Alice",
      "voteCount": 2
    }
  }
}
```

**Response** (No votes cast):
```json
{
  "success": true,
  "message": "No winner yet (no votes cast)",
  "data": {
    "winner": null
  }
}
```

### **Health Check**
```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "message": "Voting System API is running"
}
```

## 📁 Project Structure

```
voting_system/
├── contracts/
│   ├── VotingSystem.sol      # Main voting contract
│   └── IVotingSystem.sol      # Contract interface
├── test/
│   └── VotingSystem.js        # Smart contract tests
├── backend/
│   ├── server.js              # Express server
│   ├── web3Client.js          # Web3 initialization
│   ├── test-api.js            # API integration tests
│   ├── routes/
│   │   └── voting.js          # API routes
│   └── middleware/
│       ├── validator.js       # Input validation
│       ├── errorHandler.js    # Error handling
│       └── logger.js          # Request logging
├── ignition/
│   └── modules/
│       └── VotingSystem.js    # Deployment module
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🔄 Complete Workflow

Here's the complete workflow to get started:

```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contract
npx hardhat ignition deploy ignition/modules/VotingSystem.js --network localhost

# Terminal 3: Start backend
npm run backend

# Terminal 4: Run integration tests
node backend/test-api.js
```

## 🛠️ Development

### **Available Scripts**

- `npm run node` - Start Hardhat local node
- `npm test` - Run smart contract tests
- `npm run backend` - Start the backend server

### **Contract Deployment**

The contract is deployed using Hardhat Ignition. The deployment artifacts are automatically saved to:
- `ignition/deployments/chain-31337/deployed_addresses.json` - Contract address
- `ignition/deployments/chain-31337/artifacts/` - Contract ABI and bytecode

The backend automatically loads these artifacts on startup.

## 📝 Notes

- The Hardhat local node maintains state across restarts unless you reset it
- If you restart the Hardhat node, you need to redeploy the contract
- The backend server must be restarted after redeployment to load the new contract address
- All transactions on the local Hardhat node are instant and free (no real gas costs)

## 🐛 Troubleshooting

### **Contract not initialized error**
- Ensure the contract is deployed: `npx hardhat ignition deploy ignition/modules/VotingSystem.js --network localhost`
- Check that `ignition/deployments/chain-31337/deployed_addresses.json` exists
- Restart the backend server after deployment

### **Port already in use**
- Kill existing processes: `lsof -ti :8545 | xargs kill -9` (Hardhat node)
- Kill existing processes: `lsof -ti :3000 | xargs kill -9` (Backend server)

### **Double vote not prevented**
- Ensure the Hardhat node is running
- Check that the backend middleware is checking `hasVoted` before allowing votes
- Restart the Hardhat node and redeploy if state is corrupted

## 📄 License

**Built with**: Solidity, Hardhat, Node.js, Express, Web3.js

