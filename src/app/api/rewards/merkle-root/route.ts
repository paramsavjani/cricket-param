import Match from "@/lib/model/Match"
import Bet from "@/lib/model/Bet"
import User from "@/lib/model/User"
import Question from "@/lib/model/Question"
import { type NextRequest, NextResponse } from "next/server"
import { MerkleTree } from "merkletreejs"
import keccak256 from "keccak256"
import { ethers } from "ethers"
import mongoose from "mongoose"
import TOKEN_ABI from "@/abis/BettingReward.json"

// Constants
const CONTRACT_ADDRESS = "0xCC4B1B743103e5575BDcC2E032BCB3EEa91498f9"
const RPC_URL = "https://rpc.ankr.com/eth_sepolia"
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

// Helper function to create a leaf node exactly as the contract does
function createLeaf(address: string, amount: number): Buffer {
  // Ensure address is checksummed
  const checksummedAddress = ethers.getAddress(address)

  // Pack exactly as Solidity's abi.encodePacked(address, uint256)
  const packed = ethers.solidityPacked(["address", "uint256"], [checksummedAddress, amount])

  // Hash it with keccak256
  return keccak256(packed)
}

// Convert MongoDB ObjectId to uint256 for the contract
function convertObjectIdToUint256(objectId: string): string {
  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    throw new Error("Invalid MongoDB ObjectId")
  }
  const objectIdHex = new mongoose.Types.ObjectId(objectId).toHexString()
  const hash = ethers.keccak256("0x" + objectIdHex)
  return BigInt(hash).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json()

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Find match
    const match = await Match.findById(matchId)
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Find questions for this match
    const questions = await Question.find({ matchId })
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this match" }, { status: 404 })
    }

    // Find bets and users
    const bets = await Bet.find({
      question: { $in: questions.map((question) => question._id.toString()) },
    })

    if (!bets || bets.length === 0) {
      return NextResponse.json({ error: "No bets found for this match" }, { status: 404 })
    }

    const users = await User.find({
      _id: { $in: bets.map((bet) => bet.user) },
    })

    // Aggregate rewards per user
    const rewardsMap = new Map<string, number>()

    bets.forEach((bet) => {
      const question = questions.find((q) => q._id.toString() === bet.question)
      const correct = question?.answer === bet.option

      if (correct) {
        const user = users.find((u) => u._id.toString() === bet.user)
        if (user?.address) {
          // Normalize address to lowercase for map keys
          const normalizedAddress = user.address.toLowerCase()
          rewardsMap.set(normalizedAddress, (rewardsMap.get(normalizedAddress) || 0) + 2)
        }
      }
    })

    const rewards = Array.from(rewardsMap, ([user, reward]) => ({
      user,
      reward,
    }))

    if (rewards.length === 0) {
      return NextResponse.json({ error: "No winners found for this match" }, { status: 400 })
    }

    // Generate Merkle Tree using our consistent leaf creation function
    const leaves = rewards.map(({ user, reward }) => createLeaf(user, reward))

    // Create the Merkle tree with the same configuration as in the proof generation
    const tree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: false, // Don't hash leaves again, we already did that
    })

    const root = tree.getHexRoot()

    // Log information for debugging
    console.log(`Updating Merkle root for match ${matchId}`)
    console.log(`Number of winners: ${rewards.length}`)
    console.log(`Merkle root: ${root}`)

    // Sample verification for the first reward (for debugging)
    if (rewards.length > 0) {
      const sampleReward = rewards[0]
      const sampleLeaf = createLeaf(sampleReward.user, sampleReward.reward)
      const sampleProof = tree.getHexProof(sampleLeaf)
      const isValid = tree.verify(sampleProof, sampleLeaf, root)

      console.log(`Sample verification for ${sampleReward.user}:`)
      console.log(`- Reward: ${sampleReward.reward}`)
      console.log(`- Leaf: 0x${sampleLeaf.toString("hex")}`)
      console.log(`- Proof: ${sampleProof}`)
      console.log(`- Verification result: ${isValid}`)
    }

    // Update the contract
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_ABI, wallet)

      // Convert matchId to uint256 format for the contract
      const matchIdForContract = convertObjectIdToUint256(matchId)

      console.log(`Sending transaction to update Merkle root:`)
      console.log(`- Contract address: ${CONTRACT_ADDRESS}`)
      console.log(`- Match ID for contract: ${matchIdForContract}`)

      const tx = await contract.updateMerkleRoot(matchIdForContract, root)
      console.log(`Transaction sent: ${tx.hash}`)

      const receipt = await tx.wait()
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

      // Update the match in the database
      match.merkleRoot = root
      match.rewardsCount = rewards.length
      await match.save()

      console.log(`Match updated in database with new Merkle root`)

      return NextResponse.json({
        success: true,
        merkleRoot: root,
        rewardsCount: rewards.length,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      })
    } catch (contractError) {
      console.error("Contract interaction error:", contractError)
      return NextResponse.json(
        {
          error: "Failed to update Merkle root in contract",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error updating Merkle root:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}

