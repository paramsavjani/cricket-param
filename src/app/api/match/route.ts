import { type NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import mongoose from "mongoose";
import Match from "@/lib/model/Match";
import Bet from "@/lib/model/Bet";
import User from "@/lib/model/User";
import Question from "@/lib/model/Question";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import TOKEN_ABI from "@/abis/BettingReward.json";

// Constants
const CONTRACT_ADDRESS = "0xCC4B1B743103e5575BDcC2E032BCB3EEa91498f9";
const RPC_URL = "https://rpc.ankr.com/eth_sepolia";

/**
 * Creates a leaf node for the Merkle tree using the same encoding as the contract
 * @param address User address
 * @param amount Reward amount
 * @returns Hashed leaf node
 */
function createLeaf(address: string, amount: number): Buffer {
  try {
    // Ensure address is checksummed
    const checksummedAddress = ethers.getAddress(address);

    // Pack exactly as Solidity's abi.encodePacked(address, uint256)
    const packed = ethers.solidityPacked(
      ["address", "uint256"],
      [checksummedAddress, amount]
    );

    // Hash it with keccak256
    return keccak256(packed);
  } catch (error) {
    console.error(
      `Error creating leaf for ${address} with amount ${amount}:`,
      error
    );
    throw new Error(`Failed to create Merkle leaf: ${error}`);
  }
}

/**
 * Converts MongoDB ObjectId to uint256 for the contract
 * @param objectId MongoDB ObjectId
 * @returns String representation of uint256
 */
function convertObjectIdToUint256(objectId: string): string {
  try {
    if (!mongoose.Types.ObjectId.isValid(objectId)) {
      throw new Error("Invalid MongoDB ObjectId");
    }
    const objectIdHex = new mongoose.Types.ObjectId(objectId).toHexString();
    const hash = ethers.keccak256("0x" + objectIdHex);
    return BigInt(hash).toString();
  } catch (error) {
    console.error(`Error converting ObjectId ${objectId}:`, error);
    throw new Error(`Failed to convert ObjectId: ${error}`);
  }
}

/**
 * Handles POST requests to generate Merkle proofs for claiming rewards
 */
export async function POST(req: NextRequest) {
  try {
    console.log("=== MERKLE PROOF DEBUGGING ===");

    // Extract request data
    const { id: matchId, address } = await req.json();

    console.log(`Request params: matchId=${matchId}, address=${address}`);

    if (!matchId || !address) {
      console.error("Missing required parameters");
      return NextResponse.json(
        {
          error: "Match ID and address are required",
        },
        { status: 400 }
      );
    }

    // Normalize the address
    const normalizedAddress = address.toLowerCase();
    console.log(`Normalized address: ${normalizedAddress}`);

    // Convert match ID for contract
    const matchIdForContract = convertObjectIdToUint256(matchId);
    console.log(`Converted matchId for contract: ${matchIdForContract}`);
    console.log(`Hex format: 0x${BigInt(matchIdForContract).toString(16)}`);

    // Find match in database
    const match = await Match.findById(matchId);
    if (!match) {
      console.error(`Match not found: ${matchId}`);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    console.log(`Found match: ${match._id}`);

    // Find questions for this match
    const questions = await Question.find({ matchId });
    if (!questions || questions.length === 0) {
      console.error(`No questions found for match: ${matchId}`);
      return NextResponse.json(
        {
          error: "No questions found for this match",
          matchId,
        },
        { status: 404 }
      );
    }
    console.log(`Found ${questions.length} questions for this match`);

    // Get question IDs
    const questionIds = questions.map((q) => q._id.toString());

    // Find bets for these questions
    const bets = await Bet.find({
      question: { $in: questionIds },
    });

    if (!bets || bets.length === 0) {
      console.error(`No bets found for match: ${matchId}`);
      return NextResponse.json(
        {
          error: "No bets found for this match",
          matchId,
          questionCount: questions.length,
        },
        { status: 404 }
      );
    }
    console.log(`Found ${bets.length} bets for this match`);

    // Get unique user IDs from bets
    const userIds = [...new Set(bets.map((bet) => bet.user))];
    console.log(`Found ${userIds.length} unique users who placed bets`);

    // Find users
    const users = await User.find({
      _id: { $in: userIds },
    });
    console.log(`Retrieved ${users.length} user records`);

    // Create a map of user IDs to addresses for faster lookup
    const userAddressMap = new Map();
    users.forEach((user) => {
      if (user.address) {
        userAddressMap.set(user._id.toString(), user.address.toLowerCase());
      }
    });

    // Create a map of question IDs to answers for faster lookup
    const questionAnswerMap = new Map();
    questions.forEach((question) => {
      questionAnswerMap.set(question._id.toString(), question.answer);
    });

    // Aggregate rewards per user address
    const rewardsMap = new Map<string, number>();

    bets.forEach((bet) => {
      const correctAnswer = questionAnswerMap.get(bet.question);
      const isCorrect = correctAnswer === bet.option;

      if (isCorrect) {
        const userAddress = userAddressMap.get(bet.user);
        if (userAddress) {
          rewardsMap.set(userAddress, (rewardsMap.get(userAddress) || 0) + 2);
        }
      }
    });

    // Convert to array for Merkle tree
    const rewards = Array.from(rewardsMap, ([user, reward]) => ({
      user,
      reward,
    }));

    console.log(`Generated ${rewards.length} reward entries`);

    // If no rewards, return empty data
    if (rewards.length === 0) {
      console.error("No rewards found for this match");
      return NextResponse.json({
        merkleRoot:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        rewards: [],
        proof: [],
        message: "No rewards found for this match",
      });
    }

    // Generate Merkle Tree
    console.log("Generating Merkle tree...");
    const leaves = rewards.map(({ user, reward }) => {
      const leaf = createLeaf(user, reward);
      console.log(`Leaf for ${user} (${reward}): 0x${leaf.toString("hex")}`);
      return leaf;
    });

    const tree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false, // Don't hash leaves again, we already did that
    });

    const merkleRoot = tree.getHexRoot();
    console.log(`Generated Merkle root: ${merkleRoot}`);

    // Find user's reward
    const userReward = rewards.find(
      (r) => r.user.toLowerCase() === normalizedAddress
    );

    if (userReward) {
      console.log(`Found reward for user: ${userReward.reward} tokens`);
    } else {
      console.warn(`No reward found for address: ${normalizedAddress}`);
    }

    let proof: string[] = [];
    let leaf: Buffer | null = null;

    if (userReward) {
      // Create the leaf for this specific user
      leaf = createLeaf(userReward.user, userReward.reward);
      console.log(`User leaf hash: 0x${leaf.toString("hex")}`);

      // Get the proof
      proof = tree.getHexProof(leaf);
      console.log(`Generated proof with ${proof.length} elements:`, proof);

      // Verify the proof locally
      const isValid = tree.verify(proof, leaf, merkleRoot);
      console.log(
        `Local proof verification: ${isValid ? "SUCCESS" : "FAILED"}`
      );

      if (!isValid) {
        console.error("WARNING: Proof verification failed locally!");
      }
    }

    // Connect to the contract to check if the root is set
    try {
      console.log("Connecting to contract for verification...");
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TOKEN_ABI,
        provider
      );

      // Check if the Merkle root is set in the contract
      const contractRoot = await contract.merkleRoots(matchIdForContract);
      console.log(`Contract Merkle root: ${contractRoot}`);

      // If the root is not set or doesn't match, log a warning
      if (
        contractRoot ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        console.error(
          `ERROR: Merkle root not set in contract for match ID ${matchId}`
        );
        console.error(
          "You need to update the Merkle root in the contract first!"
        );
      } else if (contractRoot !== merkleRoot) {
        console.error(
          `ERROR: Contract root (${contractRoot}) doesn't match generated root (${merkleRoot})`
        );
        console.error(
          "The Merkle root in the contract is different from what we're generating now!"
        );
      } else {
        console.log("✅ Contract root matches generated root");
      }

      // Check if the user has already claimed
      if (userReward) {
        const hasClaimed = await contract.hasClaimed(
          matchIdForContract,
          userReward.user
        );
        if (hasClaimed) {
          console.warn(
            `WARNING: User ${userReward.user} has already claimed rewards for match ${matchId}`
          );
        } else {
          console.log("✅ User has not claimed rewards yet");
        }

        // Check if the user can claim using the contract's canClaim function
        try {
          const canClaim = await contract.canClaim(
            matchIdForContract,
            userReward.user,
            userReward.reward,
            proof
          );
          console.log(
            `Contract canClaim check: ${canClaim ? "SUCCESS" : "FAILED"}`
          );

          if (!canClaim) {
            console.error(
              "ERROR: Contract says this user cannot claim rewards!"
            );

            // Check leaf hash calculation
            const contractLeafHash = await contract.computeLeafHash(
              userReward.user,
              userReward.reward
            );
            const ourLeafHash = leaf ? "0x" + leaf.toString("hex") : null;

            console.log(`Contract leaf hash: ${contractLeafHash}`);
            console.log(`Our leaf hash:      ${ourLeafHash}`);

            if (contractLeafHash !== ourLeafHash) {
              console.error(
                "ERROR: Leaf hash calculation is different between contract and backend!"
              );
            } else {
              console.log(
                "✅ Leaf hash calculation matches between contract and backend"
              );
            }
          }
        } catch (error) {
          console.error("Error checking canClaim:", error);
        }
      }
    } catch (error) {
      console.error("Error checking contract state:", error);
    }

    console.log("=== END DEBUGGING ===");

    // Return the data
    return NextResponse.json({
      merkleRoot,
      rewards,
      proof,
      matchIdForContract,
      userReward: userReward || null,
      totalRewards: rewards.length,
      singleWinner: rewards.length === 1,
      debug: {
        leaf: leaf ? "0x" + leaf.toString("hex") : null,
        merkleRoot,
        proofLength: proof.length,
        matchIdHex: "0x" + BigInt(matchIdForContract).toString(16),
      },
    });
  } catch (error) {
    console.error("Error generating Merkle proof:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error,
      },
      { status: 500 }
    );
  }
}
