"use client"

import { useState } from "react"
import { useAccount, useWriteContract } from "wagmi"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, ArrowRight} from "lucide-react"
import { toast } from "sonner"
import abi from "@/abis/Vote.json"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

const signupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type SignupFormValues = z.infer<typeof signupFormSchema>

export default function SignupForm() {
  const { address, isConnected } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [tokensClaimed, setTokensClaimed] = useState(false)
  const { isPending, writeContractAsync } = useWriteContract()
  const [signupProgress, setSignupProgress] = useState(0)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", username: "", email: "" },
  })

  function handleInitialSignUp() {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    setShowClaimDialog(true)
    setSignupProgress(25)
  }

  async function handleClaimTokens() {
    try {
      await writeContractAsync({
        address: "0x66f8ECD191AF7F90bc4Fe82629d525e5AB9FDf4C",
        abi: abi,
        functionName: "claimInitialTokens",
      })
      toast.success("Successfully claimed 10 CPT tokens!")
      setTokensClaimed(true)
      setShowClaimDialog(false)
      setSignupProgress(50)
    } catch (error) {
      console.error("Error claiming tokens:", error)
      toast.error("Failed to claim tokens. Please try again.")
    }
  }

  async function handleAlreadyClaimed() {
    setTokensClaimed(true)
    setShowClaimDialog(false)
    setSignupProgress(50)
  }

  async function onSubmit(data: SignupFormValues) {
    if (!tokensClaimed) {
      toast.error("Please claim your tokens before signing up")
      return
    }

    setIsSubmitting(true)
    setSignupProgress(75)

    try {
      const response = await fetch("/api/users/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, address }),
      })

      if (!response.ok) {
        throw new Error("Failed to create account")
      }

      toast.success("Account created successfully!")
      setSignupProgress(100)
      setTimeout(() => window.location.reload(), 3000)
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("Failed to create account. Please try again.")
      setSignupProgress(50)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md bg-black border-gray-800">
        <div className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-white">Create Your Account</h1>
            <p className="text-gray-400">Claim your tokens and sign up to start making predictions</p>
          </div>

          <Progress value={signupProgress} className="bg-green-950 [&>div]:bg-[#00FF66]" />

          <AnimatePresence mode="wait">
            {!tokensClaimed ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  onClick={handleInitialSignUp}
                  className="w-full py-6 text-lg bg-[#00FF66] hover:bg-[#00DD66] text-black"
                >
                  Start Sign Up Process
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {["name", "username", "email"].map((field) => (
                      <FormField
                        key={field}
                        control={form.control}
                        name={field as keyof SignupFormValues}
                        render={({ field: fieldProps }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-gray-300">
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-800 text-white"
                                placeholder={`Enter your ${field}`}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    ))}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 text-lg bg-[#00FF66] hover:bg-[#00DD66] text-black"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        >
                          Creating Account...
                        </motion.div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="bg-black border-gray-800 p-6 sm:max-w-md">

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Claim Your Welcome Bonus</h2>
            <p className="text-gray-400">
              Is this your first time claiming tokens? You&apos;ll receive 10 CPT tokens as a welcome bonus.
            </p>
          </div>

          <div className="flex justify-center my-12">
            <div className="rounded-full bg-green-900/30 p-8">
              <Clock className="h-12 w-12 text-[#00FF66]" />
            </div>
          </div>

          <div className="bg-[#2A1800] rounded-lg p-4 mb-6">
            <p className="text-amber-500">
              Warning: If you don&apos;t claim your tokens now, you won&apos;t be able to claim them later.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleClaimTokens}
              disabled={isPending}
              className="flex-1 py-3 bg-[#00FF66] hover:bg-[#00DD66] text-black font-medium"
            >
              {isPending ? (
                <motion.div
                  className="flex items-center justify-center gap-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Clock className="h-5 w-5 animate-spin" />
                  <span>Claiming...</span>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Claim 10 CPT Tokens</span>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleAlreadyClaimed}
              className="flex-1 py-3 border-gray-800 bg-transparent text-white hover:bg-gray-900"
            >
              Already Claimed Tokens
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

