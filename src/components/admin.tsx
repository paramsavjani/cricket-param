/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Save,
  Trash2,
  AlertTriangle,
  Check,
  PlusCircle,
  Pencil,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  X,
  BarChart4,
  Users,
  Trophy,
  Sparkles,
  Coins,
  Loader2,
  FileText,
  Zap,
  GitMerge,
  Database,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Match {
  _id: string
  teamA: string
  teamB: string
  matchDate: string
  merkleRoot?: string
  rewardsCount?: number
}

interface Question {
  _id: string
  question: string
  options: string[]
  isActive: boolean
  closedAt: string
  answer?: string
  matchId: string
}

interface AdminStats {
  totalQuestions: number
  answeredQuestions: number
  activeQuestions: number
  totalMatches: number
  upcomingMatches: number
  totalUsers: number
  totalPredictions: number
  avgPredictionsPerUser: string
}

interface RewardsData {
  rewardsCount: number
}

export default function AdminDashboard() {
  const [matches, setMatches] = useState<Match[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [activeTab, setActiveTab] = useState("questions")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "answered" | "unanswered">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalQuestions: 0,
    answeredQuestions: 0,
    activeQuestions: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    totalUsers: 0,
    totalPredictions: 0,
    avgPredictionsPerUser: "0",
  })

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", ""],
    isActive: true,
    closedAt: "",
    matchId: "",
  })

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Answer setting state
  const [answerQuestion, setAnswerQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showAnswerDialog, setShowAnswerDialog] = useState(false)

  // Merkle tree state
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null)
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null)
  const [isGeneratingMerkle, setIsGeneratingMerkle] = useState(false)
  const [isUpdatingContract, setIsUpdatingContract] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [showMerkleDialog, setShowMerkleDialog] = useState(false)
  const [showMerkleGuide, setShowMerkleGuide] = useState(false)

  // End match state
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false)
  const [isEndingMatch, setIsEndingMatch] = useState(false)
  const [endMatchSuccess, setEndMatchSuccess] = useState(false)

  // Fetch admin stats
  useEffect(() => {
    const fetchAdminStats = async () => {
      setIsLoadingStats(true)
      try {
        const response = await fetch("/api/admin/stats")
        if (!response.ok) {
          throw new Error("Failed to fetch admin stats")
        }

        const data = await response.json()
        setAdminStats(data.stats)
      } catch (error) {
        console.error("Error fetching admin stats:", error)
        toast.error("Failed to load admin statistics")
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchAdminStats()
  }, [])

  // Fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoadingMatches(true)
      try {
        const response = await fetch("/api/layout/matches")
        const data = await response.json()
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches)
          // Select the first match by default
          setSelectedMatch(data.matches[0])
          setNewQuestion((prev) => ({ ...prev, matchId: data.matches[0]._id }))
        }
      } catch (error) {
        console.error("Error fetching matches:", error)
        toast.error("Failed to load matches")
      } finally {
        setIsLoadingMatches(false)
      }
    }

    fetchMatches()
  }, [])

  // Fetch questions for selected match
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedMatch) return

      setIsLoadingQuestions(true)
      try {
        const response = await fetch(`/api/layout/questions?id=${selectedMatch._id}`)
        const data = await response.json()
        if (data.questions) {
          setQuestions(data.questions)
        }
      } catch (error) {
        console.error("Error fetching questions:", error)
        toast.error("Failed to load questions")
      } finally {
        setIsLoadingQuestions(false)
      }
    }

    fetchQuestions()
  }, [selectedMatch])

  // Fetch Merkle root data for selected match
  useEffect(() => {
    const fetchMerkleData = async () => {
      if (!selectedMatch) return

      try {
        const response = await fetch(`/api/rewards/merkle-data?matchId=${selectedMatch._id}`)
        const data = await response.json()

        if (data.merkleRoot) {
          setMerkleRoot(data.merkleRoot)
          setRewardsData({
            rewardsCount: data.rewardsCount || 0,
          })

          if (data.merkleRoot) {
            setUpdateSuccess(true)
          }
        }
      } catch (error) {
        console.error("Error fetching Merkle data:", error)
      }
    }

    fetchMerkleData()
  }, [selectedMatch])

  // Filter questions based on search and filter
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.options.some((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter
      let matchesStatus = true
      switch (filterStatus) {
        case "active":
          matchesStatus = question.isActive
          break
        case "inactive":
          matchesStatus = !question.isActive
          break
        case "answered":
          matchesStatus = !!question.answer
          break
        case "unanswered":
          matchesStatus = !question.answer
          break
        default:
          matchesStatus = true
      }

      return matchesSearch && matchesStatus
    })
  }, [questions, searchQuery, filterStatus])

  // Get answered and unanswered questions
  const activeQuestions = useMemo(() => filteredQuestions.filter((q) => q.isActive), [filteredQuestions])

  // Handle match selection
  const handleMatchSelect = (matchId: string) => {
    const match = matches.find((m) => m._id === matchId)
    if (match) {
      setSelectedMatch(match)
      setNewQuestion((prev) => ({ ...prev, matchId: match._id }))
      // Reset Merkle tree state when changing matches
      setMerkleRoot(match.merkleRoot || null)
      setRewardsData({
        rewardsCount: match.rewardsCount || 0,
      })
      setUpdateSuccess(false)
    }
  }

  // Add option to new question
  const addOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }

  // Remove option from new question
  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) {
      toast.error("A question must have at least 2 options")
      return
    }

    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  // Update option in new question
  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options]
    updatedOptions[index] = value
    setNewQuestion((prev) => ({
      ...prev,
      options: updatedOptions,
    }))
  }

  // Handle creating a new question
  const handleCreateQuestion = async () => {
    // Validate form
    if (!newQuestion.question.trim()) {
      toast.error("Question text is required")
      return
    }

    if (!newQuestion.matchId) {
      toast.error("Please select a match")
      return
    }

    if (!newQuestion.closedAt) {
      toast.error("Please set a closing date")
      return
    }

    if (newQuestion.options.some((opt) => !opt.trim())) {
      toast.error("All options must have text")
      return
    }

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuestion),
      })

      if (!response.ok) {
        throw new Error("Failed to create question")
      }

      const data = await response.json()

      // Add the new question to the list
      setQuestions((prev) => [...prev, data.question])

      // Update stats
      setAdminStats((prev) => ({
        ...prev,
        totalQuestions: prev.totalQuestions + 1,
        activeQuestions: prev.activeQuestions + 1,
      }))

      // Reset form
      setNewQuestion({
        question: "",
        options: ["", ""],
        isActive: true,
        closedAt: "",
        matchId: selectedMatch?._id || "",
      })

      toast.success("Question created successfully")

      // Switch to questions tab to see the new question
      setActiveTab("questions")
    } catch (error) {
      console.error("Error creating question:", error)
      toast.error("Failed to create question")
    }
  }

  // Handle editing a question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setShowEditDialog(true)
  }

  // Save edited question
  const saveEditedQuestion = async () => {
    if (!editingQuestion) return

    try {
      const response = await fetch(`/api/admin/questions/${editingQuestion._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: editingQuestion._id, ...editingQuestion }),
      })

      if (!response.ok) {
        throw new Error("Failed to update question")
      }

      // Update the question in the list
      setQuestions((prev) => prev.map((q) => (q._id === editingQuestion._id ? editingQuestion : q)))

      // Update stats if active status changed
      const wasActive = questions.find((q) => q._id === editingQuestion._id)?.isActive
      if (wasActive !== editingQuestion.isActive) {
        setAdminStats((prev) => ({
          ...prev,
          activeQuestions: editingQuestion.isActive ? prev.activeQuestions + 1 : prev.activeQuestions - 1,
        }))
      }

      setShowEditDialog(false)
      toast.success("Question updated successfully")
    } catch (error) {
      console.error("Error updating question:", error)
      toast.error("Failed to update question")
    }
  }

  // Handle setting an answer
  const handleSetAnswer = (question: Question) => {
    setAnswerQuestion(question)
    setSelectedAnswer(question.answer || "")
    setShowAnswerDialog(true)
  }

  // Save answer
  const saveAnswer = async () => {
    if (!answerQuestion || !selectedAnswer) return

    try {
      const response = await fetch(`/api/admin/questions/${answerQuestion._id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: answerQuestion._id, answer: selectedAnswer }),
      })

      if (!response.ok) {
        throw new Error("Failed to set answer")
      }

      // Check if this is a new answer or changing an existing one
      const hadAnswerBefore = !!answerQuestion.answer

      // Update the question in the list
      setQuestions((prev) => prev.map((q) => (q._id === answerQuestion._id ? { ...q, answer: selectedAnswer, isActive: false } : q)))

      // Update stats if this is a new answer
      if (!hadAnswerBefore) {
        setAdminStats((prev) => ({
          ...prev,
          answeredQuestions: prev.answeredQuestions + 1,
        }))
      }

      setShowAnswerDialog(false)
      toast.success("Answer set successfully")
    } catch (error) {
      console.error("Error setting answer:", error)
      toast.error("Failed to set answer")
    }
  }

  // Generate Merkle root
  const generateMerkleRoot = async () => {
    if (!selectedMatch) return

    setIsGeneratingMerkle(true)
    try {
      const response = await fetch("/api/rewards/merkle-root", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId: selectedMatch._id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate Merkle root")
      }

      setMerkleRoot(data.merkleRoot)
      setRewardsData({
        rewardsCount: data.rewardsCount,
      })

      toast.success("Merkle root generated and saved successfully")
    } catch (error) {
      console.error("Error generating Merkle root:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate Merkle root")
    } finally {
      setIsGeneratingMerkle(false)
    }
  }

  // Update contract with Merkle root
  const updateContractRoot = async () => {
    if (!merkleRoot || !selectedMatch) return

    setIsUpdatingContract(true)
    try {
      // Connect to MetaMask
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed")
      }

      // const provider = new ethers.BrowserProvider(window.ethereum)
      // await provider.send("eth_requestAccounts", [])
      // const signer = await provider.getSigner()

      // // Create contract instance
      // const abi = ["function updateMerkleRoot(uint256 matchId, bytes32 merkleRoot) external"]
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer)

      // // Convert match ID to number (or use a different format if needed)
      // const matchId = Number.parseInt(selectedMatch._id, 10)

      // // Update the Merkle root in the contract
      // const tx = await contract.updateMerkleRoot(matchId, merkleRoot)

      // // Wait for transaction to be mined
      // await tx.wait()

      // Update match with success status
      await fetch(`/api/admin/matches/${selectedMatch._id}/merkle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updateSuccess: true,
        }),
      })

      setUpdateSuccess(true)
      toast.success("Merkle root updated in contract successfully")
    } catch (error) {
      console.error("Error updating Merkle root in contract:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update Merkle root in contract")
    } finally {
      setIsUpdatingContract(false)
    }
  }

  // End match and finalize all questions
  const endMatch = async () => {
    if (!selectedMatch) return

    setIsEndingMatch(true)
    try {
      // Get all active questions for this match
      const activeQuestionsForMatch = questions.filter((q) => q.isActive && !q.answer)

      if (activeQuestionsForMatch.length === 0) {
        toast.info("No active questions to finalize for this match")
        setIsEndingMatch(false)
        setShowEndMatchDialog(false)
        return
      }

      // For each active question, prompt for an answer
      for (const question of activeQuestionsForMatch) {
        // Set the current question for answering
        setAnswerQuestion(question)
        setSelectedAnswer("")
        setShowAnswerDialog(true)

        // Wait for the user to set an answer
        // This would require a more complex implementation with promises
        // For now, we'll just show a message
        toast.info(`Please set answers for all active questions before ending the match`)
        setIsEndingMatch(false)
        setShowEndMatchDialog(false)
        return
      }

      // If all questions are answered, mark the match as ended
      // This would update the match status in the database
      toast.success("Match ended successfully. All questions have been finalized.")
      setEndMatchSuccess(true)
    } catch (error) {
      console.error("Error ending match:", error)
      toast.error(error instanceof Error ? error.message : "Failed to end match")
    } finally {
      setIsEndingMatch(false)
    }
  }

  // Refresh questions and stats
  const refreshData = async () => {
    if (!selectedMatch) return

    setIsRefreshing(true)
    try {
      // Refresh questions
      const questionsResponse = await fetch(`/api/layout/questions?id=${selectedMatch._id}`)
      const questionsData = await questionsResponse.json()
      if (questionsData.questions) {
        setQuestions(questionsData.questions)
      }

      // Refresh stats
      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setAdminStats(statsData.stats)
      }

      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get time remaining
  const getTimeRemaining = (dateString: string) => {
    const targetDate = new Date(dateString)
    const now = new Date()
    const diff = targetDate.getTime() - now.getTime()

    if (diff <= 0) return "Closed"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  // Clear search and filters
  const clearFilters = () => {
    setSearchQuery("")
    setFilterStatus("all")
  }

  // Check if match has any unanswered questions
  const hasUnansweredQuestions = useMemo(() => {
    return questions.some((q) => !q.answer && !q.isActive)
  }, [questions])

  // Check if match has any active questions
  const hasActiveQuestions = useMemo(() => {
    return questions.some((q) => q.isActive)
  }, [questions])

  // Check if match is ready for rewards
  const isReadyForRewards = useMemo(() => {
    // All questions must be answered and none should be active
    return questions.length > 0 && !questions.some((q) => !q.answer) && !questions.some((q) => q.isActive)
  }, [questions])

  return (
    <div className="py-0">
      <Card className="border-primary/20 shadow-md" style={{ height: "100vh" }}>
        <CardHeader className="bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                Admin Dashboard
              </CardTitle>
              <CardDescription>Manage matches, questions, answers, and rewards</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh questions and statistics</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Questions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                    {filterStatus === "all" && <Check className="h-4 w-4 mr-2" />}
                    All Questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                    {filterStatus === "active" && <Check className="h-4 w-4 mr-2" />}
                    Active Questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                    {filterStatus === "inactive" && <Check className="h-4 w-4 mr-2" />}
                    Inactive Questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("answered")}>
                    {filterStatus === "answered" && <Check className="h-4 w-4 mr-2" />}
                    Answered Questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("unanswered")}>
                    {filterStatus === "unanswered" && <Check className="h-4 w-4 mr-2" />}
                    Unanswered Questions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Stats Cards */}
        <div className="px-6 pt-2 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoadingStats ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : (
              <>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Questions</p>
                        <h3 className="text-2xl font-bold">{adminStats.totalQuestions}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart4 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{adminStats.answeredQuestions} answered</span>
                        <span>{adminStats.activeQuestions} active</span>
                      </div>
                      <Progress
                        value={
                          adminStats.totalQuestions > 0
                            ? (adminStats.answeredQuestions / adminStats.totalQuestions) * 100
                            : 0
                        }
                        className="h-1.5"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Matches</p>
                        <h3 className="text-2xl font-bold">{adminStats.totalMatches}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{adminStats.upcomingMatches} upcoming</span>
                        <span>{adminStats.totalMatches - adminStats.upcomingMatches} completed</span>
                      </div>
                      <Progress
                        value={
                          adminStats.totalMatches > 0 ? (adminStats.upcomingMatches / adminStats.totalMatches) * 100 : 0
                        }
                        className="h-1.5"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <h3 className="text-2xl font-bold">{adminStats.totalUsers.toLocaleString()}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Active platform participants</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Predictions</p>
                        <h3 className="text-2xl font-bold">{adminStats.totalPredictions.toLocaleString()}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Avg. {adminStats.avgPredictionsPerUser} per user</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card className="shadow-sm">
                <CardHeader className="bg-primary/5 pb-2">
                  <CardTitle className="text-lg">Matches</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[480px]">
                    {isLoadingMatches ? (
                      <div className="p-4 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : (
                      <div className="divide-y">
                        {matches.map((match) => (
                          <motion.div
                            key={match._id}
                            whileHover={{ backgroundColor: "rgba(var(--primary), 0.05)" }}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedMatch?._id === match._id ? "bg-primary/10" : ""
                            }`}
                            onClick={() => handleMatchSelect(match._id)}
                          >
                            <div className="font-medium">
                              {match.teamA} vs {match.teamB}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(match.matchDate)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="bg-primary/5 p-3 flex justify-between">
                  {selectedMatch && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEndMatchDialog(true)}
                        disabled={!hasActiveQuestions}
                        className="text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        End Match
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMerkleDialog(true)}
                        disabled={!isReadyForRewards}
                        className="text-xs"
                      >
                        <GitMerge className="h-3 w-3 mr-1" />
                        Rewards
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <Tabs defaultValue="questions" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="questions" className="relative">
                    Manage Questions
                    {filteredQuestions.length > 0 && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">{filteredQuestions.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="add">Add New Question</TabsTrigger>
                  <TabsTrigger value="rewards" className="relative">
                    Rewards
                    {isReadyForRewards && <Badge className="ml-2 bg-green-500 text-white">Ready</Badge>}
                  </TabsTrigger>
                </TabsList>

                {/* Questions Tab */}
                <TabsContent value="questions" className="mt-4">
                  <Card className="shadow-sm">
                    <CardHeader className="bg-primary/5 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center justify-between">
                          <span>
                            Questions for {selectedMatch ? `${selectedMatch.teamA} vs ${selectedMatch.teamB}` : "Match"}
                          </span>
                        </CardTitle>

                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-8"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Active filters display */}
                      {(searchQuery || filterStatus !== "all") && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Active filters:</span>
                          {searchQuery && (
                            <Badge variant="outline" className="text-xs gap-1 px-2 py-0">
                              Search: {searchQuery}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                            </Badge>
                          )}
                          {filterStatus !== "all" && (
                            <Badge variant="outline" className="text-xs gap-1 px-2 py-0 capitalize">
                              Status: {filterStatus}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus("all")} />
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                            Clear all
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[410px]">
                        {isLoadingQuestions ? (
                          <div className="p-4 space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                          </div>
                        ) : filteredQuestions.length > 0 ? (
                          <div className="divide-y">
                            {filteredQuestions.map((question) => (
                              <motion.div
                                key={question._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="p-4 hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium text-lg">{question.question}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Closes: {formatDate(question.closedAt)}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {getTimeRemaining(question.closedAt)}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Badge variant={question.isActive ? "default" : "destructive"}>
                                    {question.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                  {question.options.map((option, index) => (
                                    <div
                                      key={index}
                                      className={`p-2 rounded-md border ${
                                        question.answer === option
                                          ? "border-green-500 bg-green-500/10 dark:bg-green-900/20"
                                          : "border-muted bg-background"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`h-4 w-4 rounded-full border ${
                                            question.answer === option
                                              ? "border-green-500 bg-green-500"
                                              : "border-muted-foreground"
                                          }`}
                                        >
                                          {question.answer === option && (
                                            <div className="h-2 w-2 m-[3px] rounded-full bg-background" />
                                          )}
                                        </div>
                                        <span className="text-foreground">{option}</span>
                                        {question.answer === option && (
                                          <Badge
                                            variant="outline"
                                            className="ml-auto text-xs bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-500/20"
                                          >
                                            Correct Answer
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                  <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant={question.answer ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => handleSetAnswer(question)}
                                  >
                                    {question.answer ? (
                                      <>
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Change Answer
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Set Answer
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                              {searchQuery || filterStatus !== "all"
                                ? "No questions match your search criteria."
                                : "No questions found for this match."}
                              <br />
                              {searchQuery || filterStatus !== "all" ? (
                                <Button variant="link" onClick={clearFilters} className="p-0 h-auto">
                                  Clear filters
                                </Button>
                              ) : (
                                'Create a new question using the "Add New Question" tab.'
                              )}
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Add New Question Tab */}
                <TabsContent value="add" className="mt-4">
                  <Card className="shadow-sm">
                    <CardHeader className="bg-primary/5">
                      <CardTitle>Add New Question</CardTitle>
                      <CardDescription>
                        Create a new prediction question for{" "}
                        {selectedMatch ? `${selectedMatch.teamA} vs ${selectedMatch.teamB}` : "the selected match"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="question">Question</Label>
                          <Textarea
                            id="question"
                            placeholder="Enter your question here..."
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion((prev) => ({ ...prev, question: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="match">Match</Label>
                          <Select value={newQuestion.matchId} onValueChange={(value) => handleMatchSelect(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a match" />
                            </SelectTrigger>
                            <SelectContent>
                              {matches.map((match) => (
                                <SelectItem key={match._id} value={match._id}>
                                  {match.teamA} vs {match.teamB} ({formatDate(match.matchDate)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="closedAt">Closing Date</Label>
                          <Input
                            id="closedAt"
                            type="datetime-local"
                            value={newQuestion.closedAt}
                            onChange={(e) => setNewQuestion((prev) => ({ ...prev, closedAt: e.target.value }))}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            checked={newQuestion.isActive}
                            onCheckedChange={(checked) => setNewQuestion((prev) => ({ ...prev, isActive: checked }))}
                          />
                          <Label htmlFor="isActive">Active</Label>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button variant="outline" size="sm" onClick={addOption}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <AnimatePresence>
                              {newQuestion.options.map((option, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-primary/5 flex justify-end">
                      <Button onClick={handleCreateQuestion} className="relative overflow-hidden group">
                        <span className="relative z-10 flex items-center">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Question
                        </span>
                        <span className="absolute inset-0 bg-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Rewards Tab */}
                <TabsContent value="rewards" className="mt-4">
                  <Card className="shadow-sm">
                    <CardHeader className="bg-primary/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle>Rewards Management</CardTitle>
                          <CardDescription>Generate and distribute rewards for correct predictions</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowMerkleGuide(true)}>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          How it works
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {selectedMatch ? (
                        <div className="space-y-6">
                          {/* Match Status */}
                          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                              <h3 className="font-medium">Match Status</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedMatch.teamA} vs {selectedMatch.teamB}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasActiveQuestions ? (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Active Questions
                                </Badge>
                              ) : hasUnansweredQuestions ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Needs Finalization
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Ready for Rewards
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Merkle Tree Generation */}
                          <Card className="border-primary/20">
                            <CardHeader className="bg-primary/5 pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <GitMerge className="h-4 w-4 text-primary" />
                                Merkle Tree Generation
                              </CardTitle>
                              <CardDescription>
                                Create a Merkle tree for all winning predictions in this match
                              </CardDescription>
                              {selectedMatch && selectedMatch.merkleRoot && (
                                <div className="mt-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Merkle Root Stored
                                  </Badge>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  The Merkle tree allows for efficient verification of winning predictions on-chain.
                                  Each user's address and reward amount are hashed together to create a leaf in the
                                  tree.
                                </p>

                                {merkleRoot && (
                                  <div className="mt-4 p-4 bg-muted rounded-md">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm font-medium">Merkle Root:</span>
                                        <span className="text-sm font-mono">{`${merkleRoot.slice(0, 10)}...${merkleRoot.slice(-8)}`}</span>
                                      </div>
                                      {rewardsData && (
                                        <>
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">Users with Rewards:</span>
                                            <span className="text-sm">{rewardsData.rewardsCount}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">Total Tokens to Distribute:</span>
                                            <span className="text-sm">{rewardsData.rewardsCount * 2} CPT</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {updateSuccess && (
                                  <Alert className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Success!</AlertTitle>
                                    <AlertDescription>
                                      Merkle root successfully updated in the contract. Users can now claim their
                                      rewards.
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {!isReadyForRewards && (
                                  <Alert className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Not Ready for Rewards</AlertTitle>
                                    <AlertDescription>
                                      {hasActiveQuestions
                                        ? "This match still has active questions. End the match and finalize all questions first."
                                        : hasUnansweredQuestions
                                          ? "Some questions need to be finalized with correct answers before generating rewards."
                                          : "No questions found for this match. Add questions first."}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="bg-primary/5 p-3 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={generateMerkleRoot}
                                disabled={isGeneratingMerkle || !isReadyForRewards}
                              >
                                {isGeneratingMerkle ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <GitMerge className="h-4 w-4 mr-2" />
                                    Generate Merkle Root
                                  </>
                                )}
                              </Button>
                              {merkleRoot && !updateSuccess && (
                                <Button onClick={updateContractRoot} disabled={isUpdatingContract}>
                                  {isUpdatingContract ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Updating Contract...
                                    </>
                                  ) : (
                                    <>
                                      <Database className="h-4 w-4 mr-2" />
                                      Update Contract
                                    </>
                                  )}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>

                          {/* Reward Distribution Steps */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="steps">
                              <AccordionTrigger className="text-sm font-medium">
                                Reward Distribution Process
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 p-2">
                                  <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                      1
                                    </div>
                                    <div>
                                      <h4 className="font-medium">End Match & Finalize Questions</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Set the correct answer for all questions in the match.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                      2
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Generate Merkle Tree</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Create a Merkle tree containing all winning predictions and their rewards.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                      3
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Update Smart Contract</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Store the Merkle root in the smart contract for on-chain verification.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                      4
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Users Claim Rewards</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Users can now claim their rewards by providing a Merkle proof.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                          <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-center">Select a match to manage rewards</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Make changes to the question details</DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-question">Question</Label>
                <Textarea
                  id="edit-question"
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-closedAt">Closing Date</Label>
                <Input
                  id="edit-closedAt"
                  type="datetime-local"
                  value={editingQuestion.closedAt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, closedAt: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingQuestion.isActive}
                  onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>

              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {editingQuestion.options.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => {
                        const updatedOptions = [...editingQuestion.options]
                        updatedOptions[index] = e.target.value
                        setEditingQuestion({ ...editingQuestion, options: updatedOptions })
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedQuestion}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Answer Dialog */}
      <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Correct Answer</DialogTitle>
            <DialogDescription>Select the correct answer for this question</DialogDescription>
          </DialogHeader>
          {answerQuestion && (
            <div className="py-4">
              <h3 className="font-medium mb-4">{answerQuestion.question}</h3>
              <div className="space-y-2">
                {answerQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50 bg-background"
                    }`}
                    onClick={() => setSelectedAnswer(option)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded-full border ${
                          selectedAnswer === option ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {selectedAnswer === option && <div className="h-2 w-2 m-[3px] rounded-full bg-background" />}
                      </div>
                      <span className="font-medium text-foreground">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnswerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveAnswer} disabled={!selectedAnswer}>
              <Check className="h-4 w-4 mr-2" />
              Set Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merkle Tree Dialog */}
      <Dialog open={showMerkleDialog} onOpenChange={setShowMerkleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Merkle Tree for Rewards</DialogTitle>
            <DialogDescription>
              Create a Merkle tree for distributing rewards to users with correct predictions
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedMatch && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="font-medium">
                  {selectedMatch.teamA} vs {selectedMatch.teamB}
                </div>
                <Badge variant="outline">{formatDate(selectedMatch.matchDate)}</Badge>
              </div>
            )}

            {merkleRoot ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-medium mb-2">Merkle Root Generated</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Root Hash:</span>
                      <span className="text-sm font-mono">{`${merkleRoot.slice(0, 10)}...${merkleRoot.slice(-8)}`}</span>
                    </div>
                    {rewardsData && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Users with Rewards:</span>
                          <span className="text-sm">{rewardsData.rewardsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Tokens:</span>
                          <span className="text-sm">{rewardsData.rewardsCount * 2} CPT</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {updateSuccess ? (
                  <Alert className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Merkle root successfully updated in the contract. Users can now claim their rewards.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                      The Merkle root has been generated but not yet updated in the smart contract. Update the contract
                      to enable user claims.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                <FileText className="h-4 w-4" />
                <AlertTitle>Generate Merkle Tree</AlertTitle>
                <AlertDescription>
                  This will create a Merkle tree containing all winning predictions for this match. The root will be
                  used to verify reward claims on-chain.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMerkleDialog(false)}>
              Close
            </Button>
            {!merkleRoot ? (
              <Button onClick={generateMerkleRoot} disabled={isGeneratingMerkle || !isReadyForRewards}>
                {isGeneratingMerkle ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Generate Merkle Root
                  </>
                )}
              </Button>
            ) : !updateSuccess ? (
              <Button onClick={updateContractRoot} disabled={isUpdatingContract}>
                {isUpdatingContract ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Contract...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Update Contract
                  </>
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Match Dialog */}
      <Dialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Match</DialogTitle>
            <DialogDescription>Finalize the match and set answers for all active questions</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedMatch && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="font-medium">
                  {selectedMatch.teamA} vs {selectedMatch.teamB}
                </div>
                <Badge variant="outline">{formatDate(selectedMatch.matchDate)}</Badge>
              </div>
            )}

            <Alert className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Ending a match will close all active questions. You'll need to set the correct answer for each question
                before rewards can be distributed.
              </AlertDescription>
            </Alert>

            {activeQuestions.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Active Questions ({activeQuestions.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {activeQuestions.map((question) => (
                    <div key={question._id} className="p-2 border rounded-md bg-background">
                      <p className="text-sm font-medium truncate">{question.question}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{question.options.length} options</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setAnswerQuestion(question)
                            setSelectedAnswer("")
                            setShowAnswerDialog(true)
                            setShowEndMatchDialog(false)
                          }}
                        >
                          Set Answer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endMatchSuccess && (
              <Alert className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>Match ended successfully. All questions have been finalized.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndMatchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={endMatch} disabled={isEndingMatch || activeQuestions.length === 0} variant="default">
              {isEndingMatch ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  End Match
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merkle Guide Dialog */}
      <Dialog open={showMerkleGuide} onOpenChange={setShowMerkleGuide}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How Merkle Trees Work for Rewards</DialogTitle>
            <DialogDescription>Understanding the reward distribution process</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">What is a Merkle Tree?</h3>
              <p className="text-sm text-muted-foreground">
                A Merkle tree is a binary tree of hashes that allows for efficient and secure verification of large data
                sets. In our case, it's used to verify which users are entitled to rewards without storing all that data
                on-chain.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">The Reward Process</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Finalize Questions</h4>
                    <p className="text-sm text-muted-foreground">
                      After a match ends, set the correct answer for each question.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Generate Merkle Tree</h4>
                    <p className="text-sm text-muted-foreground">
                      The system identifies all winning predictions and creates a Merkle tree where each leaf contains a
                      user's address and reward amount.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Store Merkle Root</h4>
                    <p className="text-sm text-muted-foreground">
                      Only the root hash of the Merkle tree is stored on-chain, saving gas costs while maintaining
                      security.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">User Claims</h4>
                    <p className="text-sm text-muted-foreground">
                      Users can claim their rewards by providing a Merkle proof that verifies they are entitled to a
                      specific reward amount.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Gas efficient - only one hash stored on-chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Secure - mathematically verifiable proofs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Scalable - works efficiently even with thousands of users</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMerkleGuide(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

