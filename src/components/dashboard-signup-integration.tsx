/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { UserPlus, Check } from "lucide-react"
import { toast } from "sonner"
import SignupModal from "./signup-modal"

interface DashboardSignupIntegrationProps {
  className?: string
}

export default function DashboardSignupIntegration({ className }: DashboardSignupIntegrationProps) {
  const { address, isConnected } = useAccount()
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Check if the user is already registered
  useEffect(() => {
    async function checkUserRegistration() {
      if (!address) return

      setIsChecking(true)
      try {
        const response = await fetch(`/api/users/check`, {
          method: 'POST',
          body: JSON.stringify({ address })
        })
        const data = await response.json()

        if(!response.ok)
        {
          setIsRegistered(false)
        }
        else
        {
          setIsRegistered(true)
        }
        
      } catch (error) {
        console.error("Error checking user registration:", error)
        // Default to not registered if there's an error
        setIsRegistered(false)
      } finally {
        setIsChecking(false)
      }
    }

    if (isConnected && address) {
      checkUserRegistration()
    } else {
      setIsRegistered(null)
    }
  }, [address, isConnected])

  // If not connected, don't show anything
  if (!isConnected) return null

  // If checking status, show loading state
  if (isChecking) {
    return (
      <Button variant="outline" className={`gap-2 ${className}`} disabled>
        <UserPlus className="h-4 w-4 animate-pulse" />
        Checking...
      </Button>
    )
  }

  // If registered, show registered status
  if (isRegistered) {
    return (
      <Button variant="ghost" className={`gap-2 ${className}`} disabled>
        <Check className="h-4 w-4 text-green-500" />
        Registered
      </Button>
    )
  }

  // If not registered, show signup button
  return (
    <SignupModal
      trigger={
        <Button
          variant="default"
          className={`gap-2 ${className}`}
          onClick={() => toast.info("Complete registration to unlock all features")}
        >
          <UserPlus className="h-4 w-4" />
          Complete Sign Up
        </Button>
      }
    />
  )
}

