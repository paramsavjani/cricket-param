"use client"

import { useState } from "react"
import { getContract } from "@/utils/contract"
import { Vote } from "lucide-react"

interface VoteButtonProps {
  provider: any | null
  address: string | null
}

export default function VoteButton({ provider, address }: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)

  const vote = async () => {
    if (!provider || !address) {
      alert("Please connect your wallet first")
      return
    }

    setIsVoting(true)
    try {
      const contract = await getContract(provider)
      const tx = await contract.vote()
      await tx.wait()
      alert("Vote cast successfully!")
    } catch (error) {
      console.error("Error casting vote:", error)
      alert("Failed to cast vote. Make sure you have enough tokens.")
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <button
      onClick={vote}
      disabled={isVoting || !provider || !address}
      className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {isVoting ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Voting...
        </span>
      ) : (
        <>
          <Vote className="mr-2" />
          Cast Vote
        </>
      )}
    </button>
  )
}

