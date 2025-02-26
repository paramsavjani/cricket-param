"use client"

import { useState, useEffect } from "react"
import { getContract } from "@/utils/contract"
import { Coins } from "lucide-react"

interface TokenInfoProps {
  provider: any | null
  address: string | null
}

export default function TokenInfo({ provider, address }: TokenInfoProps) {
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && address) {
        try {
          setIsLoading(true)
          const contract = await getContract(provider)
          const balance = await contract.balanceOf(address)
          setBalance(balance.toString())
        } catch (error) {
          console.error("Error fetching balance:", error)
          setBalance("Error")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchBalance()
  }, [provider, address])

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
        <Coins className="mr-2" />
        Your Token Balance
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : (
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{balance} CVT</p>
      )}
    </div>
  )
}

