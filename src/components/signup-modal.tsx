"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import SignupForm from "@/components/signup-form"

interface SignupModalProps {
  trigger?: React.ReactNode
}

export default function SignupModal({ trigger }: SignupModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Sign Up
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>Sign up to start making predictions on cricket matches</DialogDescription>
        </DialogHeader>
        <SignupForm />
      </DialogContent>
    </Dialog>
  )
}

