const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("VotingSystem", function () {
  async function deployVotingSystemFixture() {
    const [admin, voter1, voter2, voter3, voter4, nonAdmin] = await ethers.getSigners();
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const votingSystem = await VotingSystem.deploy();
    return { votingSystem, admin, voter1, voter2, voter3, voter4, nonAdmin };
  }

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const [admin] = await ethers.getSigners();
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      expect(await votingSystem.admin()).to.equal(admin.address);
    });

    it("Should have zero candidates initially", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      expect(await votingSystem.getCandidateCount()).to.equal(0);
    });
  });

  describe("Add Candidate", function () {
    it("Should allow admin to add a candidate", async function () {
      const { votingSystem, admin } = await loadFixture(deployVotingSystemFixture);

      await expect(votingSystem.connect(admin).addCandidate("Alice"))
        .to.emit(votingSystem, "CandidateAdded")
        .withArgs(0, "Alice");

      const candidates = await votingSystem.getCandidates();
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[0].voteCount).to.equal(0);
    });

    it("Should allow admin to add multiple candidates", async function () {
      const { votingSystem, admin } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");
      await votingSystem.connect(admin).addCandidate("Charlie");

      const candidates = await votingSystem.getCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
      expect(candidates[2].name).to.equal("Charlie");
    });

    it("Should revert when non-admin tries to add candidate", async function () {
      const { votingSystem, nonAdmin } = await loadFixture(deployVotingSystemFixture);

      await expect(
        votingSystem.connect(nonAdmin).addCandidate("Alice")
      ).to.be.revertedWithCustomError(votingSystem, "Unauthorized");
    });

    it("Should revert when trying to add candidate with empty name", async function () {
      const { votingSystem, admin } = await loadFixture(deployVotingSystemFixture);

      await expect(
        votingSystem.connect(admin).addCandidate("")
      ).to.be.revertedWithCustomError(votingSystem, "EmptyCandidateName");
    });

    it("Should emit CandidateAdded event with correct parameters", async function () {
      const { votingSystem, admin } = await loadFixture(deployVotingSystemFixture);

      await expect(votingSystem.connect(admin).addCandidate("Alice"))
        .to.emit(votingSystem, "CandidateAdded")
        .withArgs(0, "Alice");

      await expect(votingSystem.connect(admin).addCandidate("Bob"))
        .to.emit(votingSystem, "CandidateAdded")
        .withArgs(1, "Bob");
    });
  });

  describe("Vote", function () {
    async function deployWithCandidatesFixture() {
      const fixture = await deployVotingSystemFixture();
      await fixture.votingSystem.connect(fixture.admin).addCandidate("Alice");
      await fixture.votingSystem.connect(fixture.admin).addCandidate("Bob");
      await fixture.votingSystem.connect(fixture.admin).addCandidate("Charlie");
      return fixture;
    }

    it("Should allow a user to vote for a candidate", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      await expect(votingSystem.connect(voter1).vote(0))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(voter1.address, 0);

      const candidates = await votingSystem.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
      expect(await votingSystem.hasVoted(voter1.address)).to.be.true;
      expect(await votingSystem.voterToCandidate(voter1.address)).to.equal(0);
    });

    it("Should increment vote count correctly", async function () {
      const { votingSystem, voter1, voter2, voter3 } = await loadFixture(deployWithCandidatesFixture);

      await votingSystem.connect(voter1).vote(0);
      await votingSystem.connect(voter2).vote(0);
      await votingSystem.connect(voter3).vote(1);

      const candidates = await votingSystem.getCandidates();
      expect(candidates[0].voteCount).to.equal(2);
      expect(candidates[1].voteCount).to.equal(1);
      expect(candidates[2].voteCount).to.equal(0);
    });

    it("Should revert when user tries to vote twice", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      await votingSystem.connect(voter1).vote(0);

      await expect(
        votingSystem.connect(voter1).vote(1)
      ).to.be.revertedWithCustomError(votingSystem, "AlreadyVoted");
    });

    it("Should revert when voting for invalid candidate index", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      await expect(
        votingSystem.connect(voter1).vote(10)
      ).to.be.revertedWithCustomError(votingSystem, "InvalidCandidateIndex")
        .withArgs(10);
    });

    it("Should revert when voting with index equal to candidates length", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      await expect(
        votingSystem.connect(voter1).vote(3)
      ).to.be.revertedWithCustomError(votingSystem, "InvalidCandidateIndex")
        .withArgs(3);
    });

    it("Should emit VoteCast event with correct parameters", async function () {
      const { votingSystem, voter1, voter2 } = await loadFixture(deployWithCandidatesFixture);

      await expect(votingSystem.connect(voter1).vote(0))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(voter1.address, 0);

      await expect(votingSystem.connect(voter2).vote(1))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(voter2.address, 1);
    });

    it("Should track which candidate each voter voted for", async function () {
      const { votingSystem, voter1, voter2, voter3 } = await loadFixture(deployWithCandidatesFixture);

      await votingSystem.connect(voter1).vote(0);
      await votingSystem.connect(voter2).vote(1);
      await votingSystem.connect(voter3).vote(2);

      expect(await votingSystem.voterToCandidate(voter1.address)).to.equal(0);
      expect(await votingSystem.voterToCandidate(voter2.address)).to.equal(1);
      expect(await votingSystem.voterToCandidate(voter3.address)).to.equal(2);
    });
  });

  describe("Get Candidates", function () {
    it("Should return empty array when no candidates exist", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      const candidates = await votingSystem.getCandidates();
      expect(candidates.length).to.equal(0);
    });

    it("Should return all candidates with correct vote counts", async function () {
      const { votingSystem, admin, voter1, voter2 } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");
      await votingSystem.connect(voter1).vote(0);
      await votingSystem.connect(voter2).vote(0);

      const candidates = await votingSystem.getCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[0].voteCount).to.equal(2);
      expect(candidates[1].name).to.equal("Bob");
      expect(candidates[1].voteCount).to.equal(0);
    });
  });

  describe("Get Winner", function () {
    it("Should revert when no candidates exist", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      await expect(
        votingSystem.getWinner()
      ).to.be.revertedWithCustomError(votingSystem, "NoCandidates");
    });

    it("Should return the candidate with most votes", async function () {
      const { votingSystem, admin, voter1, voter2, voter3 } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");
      await votingSystem.connect(admin).addCandidate("Charlie");

      await votingSystem.connect(voter1).vote(0);
      await votingSystem.connect(voter2).vote(0);
      await votingSystem.connect(voter3).vote(1);

      expect(await votingSystem.getWinner()).to.equal("Alice");
    });

    it("Should return first candidate in case of tie", async function () {
      const { votingSystem, admin, voter1, voter2 } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");

      await votingSystem.connect(voter1).vote(0);
      await votingSystem.connect(voter2).vote(1);

      expect(await votingSystem.getWinner()).to.equal("Alice");
    });

    it("Should return correct winner after multiple votes", async function () {
      const { votingSystem, admin, voter1, voter2, voter3 } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");
      await votingSystem.connect(admin).addCandidate("Charlie");

      await votingSystem.connect(voter1).vote(2);
      await votingSystem.connect(voter2).vote(2);
      await votingSystem.connect(voter3).vote(2);

      expect(await votingSystem.getWinner()).to.equal("Charlie");
    });
  });

  describe("Get Candidate Count", function () {
    it("Should return zero initially", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      expect(await votingSystem.getCandidateCount()).to.equal(0);
    });

    it("Should return correct count after adding candidates", async function () {
      const { votingSystem, admin } = await loadFixture(deployVotingSystemFixture);

      await votingSystem.connect(admin).addCandidate("Alice");
      expect(await votingSystem.getCandidateCount()).to.equal(1);

      await votingSystem.connect(admin).addCandidate("Bob");
      expect(await votingSystem.getCandidateCount()).to.equal(2);

      await votingSystem.connect(admin).addCandidate("Charlie");
      expect(await votingSystem.getCandidateCount()).to.equal(3);
    });
  });

  describe("Has Address Voted", function () {
    async function deployWithCandidatesFixture() {
      const fixture = await deployVotingSystemFixture();
      await fixture.votingSystem.connect(fixture.admin).addCandidate("Alice");
      return fixture;
    }

    it("Should return false for address that hasn't voted", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      expect(await votingSystem.hasAddressVoted(voter1.address)).to.be.false;
      expect(await votingSystem.hasVoted(voter1.address)).to.be.false;
    });

    it("Should return true for address that has voted", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployWithCandidatesFixture);

      await votingSystem.connect(voter1).vote(0);

      expect(await votingSystem.hasAddressVoted(voter1.address)).to.be.true;
      expect(await votingSystem.hasVoted(voter1.address)).to.be.true;
    });

    it("Should return false for different addresses", async function () {
      const { votingSystem, voter1, voter2 } = await loadFixture(deployWithCandidatesFixture);

      await votingSystem.connect(voter1).vote(0);

      expect(await votingSystem.hasAddressVoted(voter1.address)).to.be.true;
      expect(await votingSystem.hasAddressVoted(voter2.address)).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete voting scenario", async function () {
      const { votingSystem, admin, voter1, voter2, voter3, voter4 } = await loadFixture(deployVotingSystemFixture);

      // Add candidates
      await votingSystem.connect(admin).addCandidate("Alice");
      await votingSystem.connect(admin).addCandidate("Bob");
      await votingSystem.connect(admin).addCandidate("Charlie");

      // Vote
      await votingSystem.connect(voter1).vote(0); // Alice
      await votingSystem.connect(voter2).vote(0); // Alice
      await votingSystem.connect(voter3).vote(1); // Bob
      await votingSystem.connect(voter4).vote(2); // Charlie

      // Check results
      const candidates = await votingSystem.getCandidates();
      expect(candidates[0].voteCount).to.equal(2);
      expect(candidates[1].voteCount).to.equal(1);
      expect(candidates[2].voteCount).to.equal(1);

      // Check winner (should be Alice, first in case of tie)
      expect(await votingSystem.getWinner()).to.equal("Alice");

      // Verify all voters have voted
      expect(await votingSystem.hasAddressVoted(voter1.address)).to.be.true;
      expect(await votingSystem.hasAddressVoted(voter2.address)).to.be.true;
      expect(await votingSystem.hasAddressVoted(voter3.address)).to.be.true;
      expect(await votingSystem.hasAddressVoted(voter4.address)).to.be.true;
    });

    it("Should maintain state correctly across multiple operations", async function () {
      const { votingSystem, admin, voter1, voter2 } = await loadFixture(deployVotingSystemFixture);

      // Add candidate
      await votingSystem.connect(admin).addCandidate("Alice");
      expect(await votingSystem.getCandidateCount()).to.equal(1);

      // Vote
      await votingSystem.connect(voter1).vote(0);
      let candidates = await votingSystem.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);

      // Add another candidate
      await votingSystem.connect(admin).addCandidate("Bob");
      expect(await votingSystem.getCandidateCount()).to.equal(2);

      // Vote for new candidate
      await votingSystem.connect(voter2).vote(1);
      candidates = await votingSystem.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
      expect(candidates[1].voteCount).to.equal(1);

      // Check winner
      expect(await votingSystem.getWinner()).to.equal("Alice");
    });
  });
});
