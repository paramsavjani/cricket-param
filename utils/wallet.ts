import { ethers } from "ethers"

let isConnecting = false
let connectionPromise: Promise<{ provider: any | null; address: string | null; error: string | null }> | null = null

export async function connectWallet() {
  if (isConnecting) {
    console.log("Connection already in progress. Waiting for it to complete...")
    return connectionPromise!
  }

  if (typeof window.ethereum !== "undefined") {
    isConnecting = true
    connectionPromise = new Promise(async (resolve) => {
      try {
        // First, check if we're already connected
        let accounts = await window.ethereum.request({ method: "eth_accounts" })

        // If not connected, explicitly request connection
        if (accounts.length === 0) {
          try {
            accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
          } catch (requestError: any) {
            if (requestError.code === 4001) {
              throw new Error("User denied account access")
            }
            throw requestError
          }
        }

        if (accounts.length === 0) {
          throw new Error("No accounts found. Please connect to MetaMask.")
        }

        const provider = new ethers.BrowserProvider(window.ethereum)
        const address = accounts[0]
        resolve({ provider, address, error: null })
      } catch (error: any) {
        console.error("Error connecting wallet:", error)
        console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

        let errorMessage = "Failed to connect wallet. "
        if (error.message === "User denied account access") {
          errorMessage += "You rejected the connection request. Please try again and approve the connection."
        } else if (error.message === "No accounts found. Please connect to MetaMask.") {
          errorMessage += "Please unlock your MetaMask and connect an account."
        } else if (error.code === -32002) {
          errorMessage +=
            "Wallet connection request already pending. Please check your wallet and approve the connection."
        } else {
          errorMessage += "An unexpected error occurred. Please try again."
        }

        resolve({ provider: null, address: null, error: errorMessage })
      } finally {
        isConnecting = false
        connectionPromise = null
      }
    })

    return connectionPromise
  } else {
    console.error("Metamask not detected")
    return {
      provider: null,
      address: null,
      error: "Please install MetaMask or another Ethereum wallet extension to use this app.",
    }
  }
}

