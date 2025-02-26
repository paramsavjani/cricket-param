"use client"

import { useState, useEffect, useCallback } from "react"
import { getContract } from "@/utils/contract"
import { Gift } from "lucide-react"

interface ClaimButtonProps {
  provider: any | null
  address: string | null
}

export default function ClaimButton({ provider, address }: ClaimButtonProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)

  const checkClaimStatus = useCallback(async () => {
    if (!provider || !address) return

    try {
      const contract = await getContract(provider)
      const balance = await contract.balanceOf(address)
      setHasClaimed(balance.gt(0))
    } catch (error) {
      console.error("Error checking claim status:", error)
    }
  }, [provider, address])

  useEffect(() => {
    checkClaimStatus()
  }, [checkClaimStatus])

  const claimTokens = async () => {
    if (!provider || !address) {
      alert("Please connect your wallet first")
      return
    }

    setIsClaiming(true)
    try {
      const contract = await getContract(provider)
      const tx = await contract.claimInitialTokens()
      await tx.wait()
      alert("Tokens claimed successfully!")
      setHasClaimed(true)
    } catch (error: any) {
      console.error("Error claiming tokens:", error)
      if (error.code === "CALL_EXCEPTION") {
        if (
          error.reason === "Already claimed initial tokens" ||
          (error.error && error.error.message && error.error.message.includes("Already claimed initial tokens"))
        ) {
          alert("You have already claimed your initial tokens.")
          setHasClaimed(true)
        } else if (
          error.reason === "Max supply reached" ||
          (error.error && error.error.message && error.error.message.includes("Max supply reached"))
        ) {
          alert("Sorry, the maximum token supply has been reached.")
        } else {
          alert(`Failed to claim tokens: ${error.reason || error.message}`)
        }
      } else {
        alert("Failed to claim tokens. Please try again.")
      }
    } finally {
      setIsClaiming(false)
    }
  }

  if (hasClaimed) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white font-bold py-3 px-6 rounded-full opacity-50 cursor-not-allowed flex items-center justify-center"
      >
        <Gift className="mr-2" />
        Tokens Claimed
      </button>
    )
  }

  return (
    <button
      onClick={claimTokens}
      disabled={isClaiming}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {isClaiming ? (
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
          Claiming...
        </span>
      ) : (
        <>
          <Gift className="mr-2" />
          Claim Tokens
        </>
      )}
    </button>
  )
}

