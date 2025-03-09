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

interface Match {
  _id: string
  teamA: string
  teamB: string
  matchDate: string
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

  // Handle match selection
  const handleMatchSelect = (matchId: string) => {
    const match = matches.find((m) => m._id === matchId)
    if (match) {
      setSelectedMatch(match)
      setNewQuestion((prev) => ({ ...prev, matchId: match._id }))
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
      setQuestions((prev) => prev.map((q) => (q._id === answerQuestion._id ? { ...q, answer: selectedAnswer } : q)))

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
              <CardDescription>Manage matches, questions, and answers</CardDescription>
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
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <Tabs defaultValue="questions" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="questions" className="relative">
                    Manage Questions
                    {filteredQuestions.length > 0 && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">{filteredQuestions.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="add">Add New Question</TabsTrigger>
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
    </div>
  )
}

