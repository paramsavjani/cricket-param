"use client"

import { useState, useEffect } from "react"
import TokenInfo from "@/components/TokenInfo"
import VoteButton from "@/components/VoteButton"
import ClaimButton from "@/components/ClaimButton"
import { connectWallet } from "@/utils/wallet"
import { Moon, Sun } from "lucide-react"

export default function Home() {
  const [provider, setProvider] = useState<any | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { provider, address, error } = await connectWallet()
        if (provider && address) {
          setProvider(provider);
          setAddress(address)
        } else if (error) {
          setError(error)
        }
      } catch (error) {
        console.error("Error checking connection:", error)
        setError("Failed to check wallet connection. Please try connecting manually.")
      }
    }

    checkConnection()
  }, [])

  const handleConnectWallet = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    setError(null)
    try {
      const { provider, address, error } = await connectWallet()
      if (provider && address) {
        setProvider(provider)
        setAddress(address)
      } else if (error) {
        setError(error)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-8 transition-colors duration-300 ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-100 to-purple-100"}`}
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
      <div className="w-full max-w-4xl">
        <h1 className="text-5xl font-bold mb-8 text-center text-gray-800 dark:text-white">CricketVoteToken</h1>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
          {!address ? (
            <div className="space-y-6 text-center">
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Connect Wallet"
                )}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Make sure MetaMask is installed and unlocked. If you don't see the MetaMask popup, click on the MetaMask
                extension icon in your browser.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xl text-center text-gray-700 dark:text-gray-300">
                Connected:{" "}
                <span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </p>
              <TokenInfo provider={provider} address={address} />
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <ClaimButton provider={provider} address={address} />
                <VoteButton provider={provider} address={address} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

