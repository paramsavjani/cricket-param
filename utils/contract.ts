import { ethers } from "ethers"

const contractABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function claimInitialTokens()",
  "function vote()",
]

export async function getContract(provider: any) {
  const signer = await provider.getSigner()
  return new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, contractABI, signer)
}

