/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import mongoose from "mongoose";
import { useState, useEffect, useMemo } from "react";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  ArrowRight,
  AlertTriangle,
  Wallet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  Menu,
  Loader2,
  Check,
  X,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  TrophyIcon as CricketBall,
} from "lucide-react";
import abi from "../abis/Vote.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster, toast } from "sonner";
import { ConnectButton } from "@/app/ConnectButton";
import DashboardSignupIntegration from "@/components/dashboard-signup-integration";
import { cn } from "@/lib/utils";

import { ethers } from "ethers";

interface Match {
  _id: string;
  teamA: string;
  teamB: string;
  matchDate: string;
}

interface Question {
  _id: string;
  question: string;
  options: string[];
  isActive: boolean;
  closedAt: string;
  answer?: string;
  matchId: string;
}

interface Bet {
  _id: string;
  question: Question;
  match: Match;
  option: string;
  createdAt: string;
  updatedAt: string;
}

interface Prediction {
  teamA: string | undefined;
  teamB: string | undefined;
  id: string;
  match: string;
  question: string;
  selectedOption: string;
  date: string;
  status: "pending" | "won" | "lost";
  reward?: number;
  matchId?: string;
  questionId?: string;
  claimed?: boolean;
  isClaimLoading?: boolean;
  correctOption?: string;
}

interface RewardData {
  user: string;
  reward: number;
}

export default function DashBoard() {
  // Contract address for token claiming
  const CONTRACT_ADDRESS = "0xCC4B1B743103e5575BDcC2E032BCB3EEa91498f9";

  // Chain and account hooks
  const { chains, switchChain } = useSwitchChain();
  const { chain } = useAccount();
  const { address, isConnected } = useAccount();

  // UI state
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedOption, setSelectedOption] = useState<{
    [key: string]: string;
  }>({});
  const [isPlacingBet, setIsPlacingBet] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isQuestionLoading, setIsQuestionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(false);
  const [winRate, setWinRate] = useState(0);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(
    null
  );
  const [selectedMatchDetails, setSelectedMatchDetails] = useState<{
    matchId: string;
    match: string;
    predictions: Prediction[];
    teamA?: string;
    teamB?: string;
  } | null>(null);
  const [predictionFilter, setPredictionFilter] = useState<
    "all" | "won" | "lost" | "pending"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  // Read token balance
  const { data: tokenBalance, isLoading: isBalanceLoading } = useReadContract({
    abi,
    address: "0x16B81D58b7312B452d8198C57629586260Db0ee0",
    functionName: "balanceOf",
    args: [address],
  });

  // Write contract hook
  const { writeContractAsync, isPending, isError, error } = useWriteContract();

  // Fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/layout/matches");
        const data = await response.json();
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
        toast.error("Failed to load matches");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Fetch user bets
  useEffect(() => {
    const fetchUserBets = async () => {
      if (!address) return;

      setIsLoadingBets(true);
      try {
        const response = await fetch(`/api/layout/bet?id=${address}`);
        const data = await response.json();

        if (response.ok && data.bets) {
          setUserBets(data.bets);

          // Transform bets to predictions format
          const userPredictions = data.bets.map((bet: Bet) => {
            const matchTeams = `${bet.match?.teamA} vs ${bet.match?.teamB}`;
            let status: "pending" | "won" | "lost" = "pending";
            let reward = 0;

            // Determine status based on question answer
            if (bet.question.answer) {
              status = bet.option === bet.question.answer ? "won" : "lost";
              reward = status === "won" ? 2 : 0; // Basic reward calculation - set to 2 tokens
            }

            return {
              id: bet._id,
              match: matchTeams,
              question: bet.question.question,
              selectedOption: bet.option,
              date: bet.createdAt,
              status,
              reward: status === "won" ? reward : undefined,
              matchId: bet.match?._id,
              questionId: bet.question?._id,
              correctOption: bet.question.answer,
              teamA: bet.match?.teamA,
              teamB: bet.match?.teamB,
            };
          });

          setPredictions(userPredictions);

          // Calculate win rate
          if (userPredictions.length > 0) {
            const wonPredictions = userPredictions.filter(
              (p: { status: string }) => p.status === "won"
            ).length;
            const answeredPredictions = userPredictions.filter(
              (p: { status: string }) => p.status !== "pending"
            ).length;

            if (answeredPredictions > 0) {
              setWinRate(
                Math.round((wonPredictions / answeredPredictions) * 100)
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user bets:", error);
      } finally {
        setIsLoadingBets(false);
      }
    };

    fetchUserBets();
  }, [address, refreshing]);

  // Check network
  useEffect(() => {
    if (isConnected && chain && chain.id !== sepolia.id) {
      setShowNetworkDialog(true);
    } else {
      setShowNetworkDialog(false);
    }
  }, [chain, isConnected]);

  // Fetch questions for selected match
  useEffect(() => {
    async function fetchQuestions() {
      if (selectedMatch) {
        setIsQuestionLoading(true);
        try {
          const res = await fetch(
            `/api/layout/questions?id=${selectedMatch._id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.message);
            return;
          }
          setQuestions(data.questions);
        } catch (error) {
          console.error("Error fetching questions:", error);
          toast.error("Failed to load match questions");
        } finally {
          setIsQuestionLoading(false);
        }
      } else {
        setQuestions([]);
      }
    }
    fetchQuestions();
  }, [selectedMatch]);

  // Handle network switch
  const handleSwitchToSepolia = async () => {
    try {
      switchChain({ chainId: sepolia.id });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // User verification
  const verifyUser = async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();

      if (response.ok) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error verifying user:", error);
      toast.error("Failed to verify user status");
      return false;
    }
  };

  // Check if a question is closed
  const isQuestionClosed = (closedAt: string): boolean => {
    const now = new Date();
    const closingDate = new Date(closedAt);
    return now > closingDate;
  };

  // Handle bet placement
  const handleBet = async (questionId: string) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedOption[questionId]) {
      toast.error("Please select an option first");
      return;
    }

    // Find the question
    const question = questions.find((q) => q._id === questionId);
    if (!question) {
      toast.error("Question not found");
      return;
    }

    // Check if the question is closed
    if (isQuestionClosed(question.closedAt)) {
      toast.error("This prediction window has closed");
      return;
    }

    // Set pending question ID for verification flow
    setPendingQuestionId(questionId);

    // Start verification process
    try {
      const isVerified = await verifyUser(address);

      if (!isVerified) {
        setShowVerificationDialog(true);
        return;
      }

      // If verified, proceed with placing bet
      await placeBet(questionId);
    } catch (error) {
      console.error("Error during verification:", error);
      toast.error("Verification failed. Please try again.");
    }
  };

  // Actual bet placement logic
  const placeBet = async (questionId: string) => {
    // Find the question again to double-check if it's closed
    const question = questions.find((q) => q._id === questionId);
    if (!question || isQuestionClosed(question.closedAt)) {
      toast.error("This prediction window has closed");
      setPendingQuestionId(null);
      return;
    }

    // Track loading state for this specific question
    setIsPlacingBet((prev) => ({ ...prev, [questionId]: true }));

    try {
      // Call smart contract
      await writeContractAsync({
        address: "0x16B81D58b7312B452d8198C57629586260Db0ee0",
        abi: abi,
        functionName: "vote",
      });

      // Call the backend API to create a betting instance
      const response = await fetch("/api/bet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          questionId,
          option: selectedOption[questionId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create betting instance");
      }

      // Add to predictions
      if (selectedMatch) {
        const question = questions.find((q) => q._id === questionId);
        if (question) {
          const newPrediction: Prediction = {
            id: Date.now().toString(),
            match: `${selectedMatch.teamA} vs ${selectedMatch.teamB}`,
            question: question.question,
            selectedOption: selectedOption[questionId],
            date: new Date().toISOString(),
            status: "pending",
            matchId: selectedMatch._id,
            questionId,
            teamA: selectedMatch.teamA,
            teamB: selectedMatch.teamB,
          };

          setPredictions((prev) => [newPrediction, ...prev]);
        }
      }

      // Reset selected option for this question
      setSelectedOption((prev) => ({
        ...prev,
        [questionId]: selectedOption[questionId], // Keep the selection to show user's choice
      }));

      toast.success("Prediction placed successfully!");
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place prediction. Please try again.");
    } finally {
      setIsPlacingBet((prev) => ({ ...prev, [questionId]: false }));
      setPendingQuestionId(null);
    }
  };

  // Handle verification completion
  const handleVerificationComplete = async (success: boolean) => {
    setShowVerificationDialog(false);

    if (success && pendingQuestionId) {
      await placeBet(pendingQuestionId);
    } else {
      setPendingQuestionId(null);
      toast.error(
        "Please complete the sign-up process before making predictions."
      );
    }
  };

  // Convert MongoDB ObjectId to uint256 for the contract
  function convertObjectIdToUint256(objectId: string): string {
    if (!mongoose.Types.ObjectId.isValid(objectId)) {
      throw new Error("Invalid MongoDB ObjectId");
    }
    const objectIdHex = new mongoose.Types.ObjectId(objectId).toHexString();
    const hash = ethers.keccak256("0x" + objectIdHex);
    return BigInt(hash).toString();
  }

  // IMPROVED: Claim rewards function with better error handling and direct transaction approach
  async function handleClaimAllRewards(
    matchId: string,
    predictions: Prediction[]
  ) {
    // Show "coming soon" dialog instead of attempting to claim
    const claimableTokens = getClaimableTokens(predictions);

    // Create a dialog to show the "coming soon" message
    toast.custom(
      (t) => (
        <div className="max-w-md w-full bg-card border border-primary/20 shadow-lg rounded-lg pointer-events-auto flex flex-col">
          <div className="p-4 bg-primary/5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Feature Coming Soon
              </h3>
              <button
                onClick={() =>
                  toast.dismiss((t as unknown as { id: string }).id)
                }
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center mb-2">
              Token claiming will be available soon!
            </p>
            <p className="text-sm text-muted-foreground text-center">
              We&apos;re working on implementing this feature. You have{" "}
              {claimableTokens} CPT tokens waiting to be claimed.
            </p>
          </div>
          <div className="p-3 bg-primary/5 rounded-b-lg flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss((t as unknown as { id: string }).id)}
            >
              Close
            </Button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  }

  // IMPROVED: Better error handling for claim function
  function handleClaimError(error: unknown) {
    console.error("Full error object:", error);
  }

  // Helper functions
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) return "Closed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getTeamLogo = (teamName: string) => {
    const teamLogos: Record<string, string> = {
      "Chennai Super Kings":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn3plcgt5OnAx_VelXAj9Z8TWBiqg6B-xgCJ__kuFeXr1ClntuhvVu0IugURU6TfyHk9qUuECEpos1E5ayEmx0fAupMIvNLQnLOwavDhBYxkIwvRv9cmm7_qHZmlcSwr3Un-hJpy92AooR9Qn77PUcr4yRgAORYwoTBjTYOmyYlHbZ0nDyaL3HWqUk/s2141/Original%20Chennai%20Super%20Fun%20Logo%20PNG%20-%20SVG%20File%20Download%20Free%20Download.png",
      "Mumbai Indians":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcIHFJONN-c6wVsb8I0TI5u1He8Vh5aUlmZ7vPzd6paraXfCf5r-bNdOoT3rqBA5S8Yu3DwefbB4C_Utu6a4E1XUXtdo28k2ViLDYs2fDS7cG9LO0S6ESd5pEZrE1GvYAf6M0_dTs9OibYMQAwkOQZvALvo-ggMxtTh_4JINiQsYeBWtQ0APFedzCZ/s7200/Original%20Mumbai%20Indians%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Royal Challengers Bengaluru":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgEMirAmSelGzQqwMqkzMifgCNy9asa4lGjk7tFe7WlVAQ3NU7eGj8nP0c-NRXNY6ZN5FgrDJV0k_UjOLa8rUHJDfEzFsj9qxgL_DxfB0y4RlFli0AnCxNqWXZ9wCATAZ1FBoZafwsUWddYNpVOyBEAxK7yIdLy4OkVjkUMEDErfWKE_54Rt2WW9iXL/s1178/Original%20Royal%20Challengers%20Bangalore%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Kolkata Knight Riders":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhw4FPuHDf0g4n2Gaf_prBrTXdS7GO6zGVcS-Lx4ioHzH-HUUGm5gY7Sj2vmy_6HwxtSZ2fojvZrXqCUIljlZy_aenyml7DLwx3mRXTS-qWBHsBFpt85nq8Y7__HB6uK3JystxJDwx0KoLubgsAIWIH6xXoh2nxjLDM2bNV08uHlBj3zy6SQmfSIUuZ/s1024/Original%20Kolkata%20Knight%20Riders%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Sunrisers Hyderabad":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFNUOHxX-5sofC3Iioht3A6_naxWEImhNUKs6eU6xqjxYJjOa1OLc_hxKRkckg_F6bnG2XzSrAsKQpgYpeXPzFkwNLHQwS5xVrYaL7aKn155nR2J0dPCunLn4LrR8d-bLjqfaLhpAG2tGRZF4RuWgblEy_1DhbmszchchOWOs3ZwAZ_Lj-1bT535Ye/s7200/Original%20Sunrisers%20Hyderabad%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Delhi Capitals":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEixNFCNIFm0aH1xUBTkbrLQdE__aSNP32JP1zsee3iJW5va96W_r3qyl486fHQilJQjaVBJt0Fl0xAawdBD4duYEg6Sj-MgCNvVfWuA3UpO4oXBr4qt8WeaaS2Fhtbac8mfzE_euPhJ9hQUVxAgWQDLG1WgrJaSv1I2L4XgNGvFoxrdWQq_LUi82XIw/s944/Original%20Delhi%20Capitals%20Logo%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Rajasthan Royals":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHxGVAL3asVmq-N8vAbTJ0Wk1C7WQNO4yr_O-7dIDgrszmr7L1ODXPuc5IzB8VGr941igDjeEX8OSZ1db2sDpn5uziRk1BVYAVRZBltH4A5FJGhfjmn8PzDLcP7qxCXVyuYQr1uaLktAqoNefxAgjVGXGXIcec8WYXBO4lB-4vtCCmcu2C9RhG5XXm/s1024/Original%20Rajasthan%20Royals%20Logo%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Punjab Kings":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjWofXDOj6B3eYR3eBKQaPeJjTsblyohHrqK1JO4BEojD0u_Izr_2kIxmrI7Oli8_EvW9tNxB4Qi_OotqkyIWTkOsg6xIroj5U39vvmbGDPSJJXkSn5mzAF58_Mz5Fg8uIrXfJnXWlWrqSig2uxfuUGCrV3wPlZwuZ1OtWVXZUhWYeIzJyrH7klLVer/s1540/Original%20Punjab%20Kings%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Gujarat Titans":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhAviPjlBbeRYz6ny9-HOVtr9VmyQJ3FXOw60rSy8ye_U_nMy9gPWtgEPpPMAO7va36UX6nyw9BNvWVrC5kwShXJT3V7FtA5HmDO9aAwsBS4iGQWFRQWOX_ltiBkSajurq-ulo_Mu82VYsIMDkIme9jCuqMxKTt0P1fO9bv_tdXBzYj51QgTcD7pz-2/s1024/Original%20Gujarat%20Titans%20Logo%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Lucknow Super Giants":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijb28SNOESbzSkJ5J8-YuxEweSWpHRLhF_uQ5Ceah9b61K8ytbL8fwmK9oMKbM2-ZZxlualj5wlNPlriod0mdrFFXBSx0dj0-_4DQIXwZmGkleqqiIpr0GmV7V8dkYbLXisxjWUPtf4joGikLHSiExgCpaO477APLpjA8_pGhnlvUEAJM4_TvabF85/s7201/Original%20Lucknow%20Super%20Giants%20PNG-SVG%20File%20Download%20Free%20Download.png",
    };

    return (
      teamLogos[teamName] ||
      `/placeholder.svg?height=40&width=40&text=${
        teamName?.slice(0, 3).toUpperCase() || "TEAM"
      }`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-500";
      case "lost":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "won":
        return "Won";
      case "lost":
        return "Lost";
      default:
        return "Pending";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <Check className="h-3 w-3" />;
      case "lost":
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Simplified navigation items - removed non-functional sections
  const navItems = [
    { icon: <Trophy className="h-5 w-5" />, label: "Matches", active: true },
  ];

  const getClaimableTokens = (predictions: Prediction[]) => {
    return predictions
      .filter((p) => p.status === "won" && p.reward && !p.claimed)
      .reduce((total, p) => total + (p.reward || 0), 0);
  };

  const getMatchStats = (predictions: Prediction[]) => {
    const total = predictions.length;
    const won = predictions.filter((p) => p.status === "won").length;
    const lost = predictions.filter((p) => p.status === "lost").length;
    const pending = predictions.filter((p) => p.status === "pending").length;

    return { total, won, lost, pending };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // This will trigger the useEffect that fetches user bets
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Group predictions by match
  const matchGroups = useMemo(() => {
    return predictions.reduce((groups, prediction) => {
      const matchId = prediction.matchId || "unknown";
      if (!groups[matchId]) {
        groups[matchId] = {
          match: prediction.match,
          teamA: prediction.teamA,
          teamB: prediction.teamB,
          predictions: [],
        };
      }
      groups[matchId].predictions.push(prediction);
      return groups;
    }, {} as Record<string, { match: string; teamA?: string; teamB?: string; predictions: Prediction[] }>);
  }, [predictions]);

  // Filter predictions based on selected filter
  const filteredMatchGroups = useMemo(() => {
    if (predictionFilter === "all") return matchGroups;

    return Object.entries(matchGroups).reduce((filtered, [matchId, group]) => {
      const filteredPredictions = group.predictions.filter(
        (p) => p.status === predictionFilter
      );
      if (filteredPredictions.length > 0) {
        filtered[matchId] = {
          ...group,
          predictions: filteredPredictions,
        };
      }
      return filtered;
    }, {} as Record<string, { match: string; teamA?: string; teamB?: string; predictions: Prediction[] }>);
  }, [matchGroups, predictionFilter]);

  // View transaction on Etherscan
  const viewTransaction = (txHash: string) => {
    if (!txHash) return;

    // Show "coming soon" dialog instead of redirecting to Etherscan
    toast.custom(
      (t) => (
        <div className="max-w-md w-full bg-card border border-primary/20 shadow-lg rounded-lg pointer-events-auto flex flex-col">
          <div className="p-4 bg-primary/5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Feature Coming Soon
              </h3>
              <button
                onClick={() =>
                  toast.dismiss((t as unknown as { id: string }).id)
                }
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center mb-2">
              Transaction viewing will be available soon!
            </p>
            <p className="text-sm text-muted-foreground text-center">
              We&apos;re working on implementing this feature. Thank you for
              your patience.
            </p>
          </div>
          <div className="p-3 bg-primary/5 rounded-b-lg flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss((t as unknown as { id: string }).id)}
            >
              Close
            </Button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <CricketBall className="h-6 w-6 text-primary" />
              <span>Cricket Prophet</span>
            </SheetTitle>
            <SheetDescription>
              Make predictions on cricket matches
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {isConnected && (
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarFallback>{address?.slice(2, 4)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{formatAddress(address)}</p>
                    <Badge
                      variant={
                        chain?.id === sepolia.id ? "default" : "destructive"
                      }
                      className="mt-1"
                    >
                      {chains.find((c: { id: any }) => c.id === chain?.id)
                        ?.name || "Unknown Network"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <span>
                      {tokenBalance ? tokenBalance.toString() : "0"} CPT
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>{winRate}% Win Rate</span>
                  </div>
                </div>
              </div>
            )}
            <nav className="px-2 py-4">
              <ul className="space-y-1">
                {navItems.map((item, i) => (
                  <li key={i}>
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="px-6 pt-4 mt-4 border-t">
              {!isConnected ? (
                <ConnectButton />
              ) : (
                <>
                  <DashboardSignupIntegration className="w-full mb-2" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Close Menu
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Sidebar - Desktop only */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 backdrop-blur-sm">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  duration: 1.5,
                }}
              >
                <CricketBall className="h-6 w-6 text-primary" />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Cricket Prophet
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Predict & win with blockchain
            </p>
          </div>

          {isConnected && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback>{address?.slice(2, 4)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{formatAddress(address)}</p>
                  <Badge
                    variant={
                      chain?.id === sepolia.id ? "default" : "destructive"
                    }
                    className="mt-1"
                  >
                    {chains.find((c: { id: any }) => c.id === chain?.id)
                      ?.name || "Unknown Network"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>
                    {tokenBalance ? tokenBalance.toString() : "0"} CPT
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>{winRate}% Win Rate</span>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item, i) => (
                <li key={i}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t mt-auto">
            <div className="flex items-center justify-between">
              {!isConnected && <ConnectButton />}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
            <div className="container flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Cricket Prophet
                </h1>
              </div>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold">Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <DashboardSignupIntegration className="hidden md:flex" />
                <ConnectButton />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 container px-4 py-6">
            {isConnected ? (
              <>
                {/* Account overview - Mobile only */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="lg:hidden grid gap-4 md:grid-cols-3 mb-6"
                >
                  <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors duration-300">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        Wallet
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback>
                            {address?.slice(2, 4)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xl font-bold">
                          {formatAddress(address)}
                        </p>
                      </div>
                      {chain && (
                        <Badge
                          variant={
                            chain?.id === sepolia.id ? "default" : "destructive"
                          }
                          className="mt-2"
                        >
                          {chains.find((c: { id: any }) => c.id === chain?.id)
                            ?.name || "Unknown Network"}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors duration-300">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        Token Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {isBalanceLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                            <div className="relative h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center">
                              <Coins className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <p className="text-xl font-bold">
                            {tokenBalance ? tokenBalance.toString() : "0"}
                            <span className="text-primary ml-1">CPT</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors duration-300">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Prediction Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-xl font-bold">{winRate}% Win Rate</p>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>
                            {
                              predictions.filter((p) => p.status === "won")
                                .length
                            }{" "}
                            wins
                          </span>
                          <span>
                            {
                              predictions.filter((p) => p.status !== "pending")
                                .length
                            }{" "}
                            total
                          </span>
                        </div>
                        <Progress value={winRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tabs for Upcoming Matches and Your Predictions */}
                <Tabs
                  defaultValue="upcoming"
                  className="mb-6"
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="upcoming"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Upcoming Matches
                    </TabsTrigger>
                    <TabsTrigger
                      value="predictions"
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Your Predictions
                    </TabsTrigger>
                  </TabsList>

                  {/* Upcoming Matches Tab */}
                  <TabsContent value="upcoming" className="mt-4">
                    <Card className="overflow-hidden border-primary/20">
                      <CardHeader className="bg-primary/5">
                        <CardTitle>Upcoming Matches</CardTitle>
                        <CardDescription>
                          Swipe or use arrows to navigate matches
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative p-0">
                        {isLoading ? (
                          <div className="p-6">
                            <Skeleton className="h-64 w-full" />
                          </div>
                        ) : matches.length === 0 ? (
                          <div className="p-6 flex flex-col items-center justify-center">
                            <CricketBall className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                              No upcoming matches found
                            </p>
                          </div>
                        ) : (
                          <div className="relative min-h-[300px]">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={currentMatchIndex}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="p-6"
                              >
                                <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border border-primary/20 dark:bg-card/50 dark:backdrop-blur-sm">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                      <img
                                        src={
                                          getTeamLogo(
                                            matches[currentMatchIndex]?.teamA
                                          ) || "/placeholder.svg"
                                        }
                                        alt={matches[currentMatchIndex].teamA}
                                        className="h-auto max-h-20"
                                      />
                                      <span className="text-xl font-bold">
                                        {matches[currentMatchIndex].teamA}
                                      </span>
                                    </div>
                                    <span className="text-xl font-bold">
                                      vs
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xl font-bold">
                                        {matches[currentMatchIndex].teamB}
                                      </span>
                                      <img
                                        src={
                                          getTeamLogo(
                                            matches[currentMatchIndex].teamB
                                          ) || "/placeholder.svg"
                                        }
                                        alt={matches[currentMatchIndex].teamB}
                                        className="h-auto max-h-20"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {formatDate(
                                        matches[currentMatchIndex].matchDate
                                      )}
                                    </span>
                                    <Clock className="h-4 w-4 ml-2" />
                                    <span>
                                      {getTimeRemaining(
                                        matches[currentMatchIndex].matchDate
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex justify-center">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium flex items-center gap-2"
                                      onClick={() =>
                                        setSelectedMatch(
                                          matches[currentMatchIndex]
                                        )
                                      }
                                    >
                                      View Details & Predict
                                      <ArrowRight className="h-4 w-4" />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>

                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full h-10 w-10 bg-background/80 backdrop-blur-sm"
                              onClick={() =>
                                setCurrentMatchIndex((prev) =>
                                  prev > 0 ? prev - 1 : matches.length - 1
                                )
                              }
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full h-10 w-10 bg-background/80 backdrop-blur-sm"
                              onClick={() =>
                                setCurrentMatchIndex((prev) =>
                                  prev < matches.length - 1 ? prev + 1 : 0
                                )
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-primary/5 py-3 px-6">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm text-muted-foreground">
                            {!isLoading &&
                              matches.length > 0 &&
                              `${currentMatchIndex + 1} of ${
                                matches.length
                              } matches`}
                          </span>
                          <div className="flex gap-1">
                            {!isLoading &&
                              matches.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`h-2 w-2 rounded-full cursor-pointer ${
                                    idx === currentMatchIndex
                                      ? "bg-primary"
                                      : "bg-primary/30"
                                  }`}
                                  onClick={() => setCurrentMatchIndex(idx)}
                                />
                              ))}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  {/* Your Predictions Tab */}
                  <TabsContent value="predictions" className="mt-4">
                    <Card className="overflow-hidden border-primary/20">
                      <CardHeader className="bg-primary/5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle>Your Predictions</CardTitle>
                            <CardDescription>
                              Track your recent predictions and rewards
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={handleRefresh}
                              disabled={refreshing}
                            >
                              <RefreshCw
                                className={cn(
                                  "h-3 w-3",
                                  refreshing && "animate-spin"
                                )}
                              />
                              {refreshing ? "Refreshing..." : "Refresh"}
                            </Button>
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <Button
                                variant={
                                  predictionFilter === "all"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                className="h-8 rounded-none"
                                onClick={() => setPredictionFilter("all")}
                              >
                                All
                              </Button>
                              <Button
                                variant={
                                  predictionFilter === "won"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                className="h-8 rounded-none"
                                onClick={() => setPredictionFilter("won")}
                              >
                                Won
                              </Button>
                              <Button
                                variant={
                                  predictionFilter === "lost"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                className="h-8 rounded-none"
                                onClick={() => setPredictionFilter("lost")}
                              >
                                Lost
                              </Button>
                              <Button
                                variant={
                                  predictionFilter === "pending"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                className="h-8 rounded-none"
                                onClick={() => setPredictionFilter("pending")}
                              >
                                Pending
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          {isLoadingBets ? (
                            <div className="p-4 space-y-4">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-20 w-full" />
                            </div>
                          ) : Object.keys(filteredMatchGroups).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                              {Object.entries(filteredMatchGroups).map(
                                ([matchId, group]) => {
                                  const claimableTokens = getClaimableTokens(
                                    group.predictions
                                  );
                                  const stats = getMatchStats(
                                    group.predictions
                                  );

                                  return (
                                    <Card
                                      key={matchId}
                                      className="overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300"
                                    >
                                      <CardHeader className="bg-primary/5 pb-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                              <Avatar className="border-2 border-background h-8 w-8">
                                                <AvatarImage
                                                  src={getTeamLogo(
                                                    group.teamA || ""
                                                  )}
                                                  alt={group.teamA || "Team A"}
                                                />
                                                <AvatarFallback className="bg-primary/20 text-xs">
                                                  {group.teamA?.slice(0, 2) ||
                                                    "TA"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <Avatar className="border-2 border-background h-8 w-8">
                                                <AvatarImage
                                                  src={getTeamLogo(
                                                    group.teamB || ""
                                                  )}
                                                  alt={group.teamB || "Team B"}
                                                />
                                                <AvatarFallback className="bg-primary/20 text-xs">
                                                  {group.teamB?.slice(0, 2) ||
                                                    "TB"}
                                                </AvatarFallback>
                                              </Avatar>
                                            </div>
                                            <CardTitle className="text-base">
                                              {group.match}
                                            </CardTitle>
                                          </div>
                                        </div>
                                        <CardDescription className="flex items-center gap-2 mt-2">
                                          <div className="flex items-center gap-1">
                                            <Trophy className="h-3 w-3 text-green-500" />
                                            <span>{stats.won} won</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <X className="h-3 w-3 text-red-500" />
                                            <span>{stats.lost} lost</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-yellow-500" />
                                            <span>{stats.pending} pending</span>
                                          </div>
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="text-sm text-muted-foreground">
                                            {group.predictions.length}{" "}
                                            prediction
                                            {group.predictions.length !== 1
                                              ? "s"
                                              : ""}
                                          </div>
                                          {claimableTokens > 0 && (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                              <Coins className="h-4 w-4" />
                                              <span>
                                                {claimableTokens} CPT available
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          {group.predictions
                                            .slice(0, 3)
                                            .map((prediction) => (
                                              <Badge
                                                key={prediction.id}
                                                variant="outline"
                                                className={`${
                                                  prediction.status === "won"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
                                                    : prediction.status ===
                                                      "lost"
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800"
                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                                                }`}
                                              >
                                                {prediction.status === "won" ? (
                                                  <Check className="h-3 w-3 mr-1" />
                                                ) : prediction.status ===
                                                  "lost" ? (
                                                  <X className="h-3 w-3 mr-1" />
                                                ) : (
                                                  <Clock className="h-3 w-3 mr-1" />
                                                )}
                                                {prediction.selectedOption}
                                              </Badge>
                                            ))}
                                          {group.predictions.length > 3 && (
                                            <Badge
                                              variant="outline"
                                              className="bg-muted/50"
                                            >
                                              +{group.predictions.length - 3}{" "}
                                              more
                                            </Badge>
                                          )}
                                        </div>
                                      </CardContent>
                                      <CardFooter className="bg-muted/20 p-3 flex justify-between">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            setSelectedMatchDetails({
                                              matchId,
                                              match: group.match,
                                              predictions: group.predictions,
                                              teamA: group.teamA,
                                              teamB: group.teamB,
                                            })
                                          }
                                          className="gap-1"
                                        >
                                          <Bookmark className="h-3 w-3" />
                                          View Details
                                        </Button>
                                        {claimableTokens > 0 && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-primary/10 hover:bg-primary/20 gap-1"
                                            disabled={
                                              group.predictions.some(
                                                (p) => p.isClaimLoading
                                              ) || isClaimingRewards
                                            }
                                            onClick={() =>
                                              handleClaimAllRewards(
                                                matchId,
                                                group.predictions
                                              )
                                            }
                                          >
                                            {group.predictions.some(
                                              (p) => p.isClaimLoading
                                            ) || isClaimingRewards ? (
                                              <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Claiming...
                                              </>
                                            ) : (
                                              <>
                                                <Coins className="h-3 w-3 text-primary" />
                                                Claim {claimableTokens} CPT
                                              </>
                                            )}
                                          </Button>
                                        )}
                                      </CardFooter>
                                    </Card>
                                  );
                                }
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6">
                              <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground text-center">
                                {predictions.length === 0 ? (
                                  <>
                                    You haven&apos;t made any predictions yet.
                                    <br />
                                    Start predicting to earn rewards!
                                  </>
                                ) : (
                                  <>
                                    No{" "}
                                    {predictionFilter !== "all"
                                      ? `${predictionFilter} `
                                      : ""}
                                    predictions found.
                                    <br />
                                    Try changing the filter or make more
                                    predictions!
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Matches Grid - Desktop Only */}
                <div className="hidden lg:block mt-6">
                  <h2 className="text-xl font-bold mb-4">All Matches</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {!isLoading && matches.length > 0
                      ? matches.map((match, idx) => (
                          <Card
                            key={idx}
                            className="overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                          >
                            <CardHeader className="bg-primary/5 pb-2">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>
                                  {match.teamA} vs {match.teamB}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {getTimeRemaining(match.matchDate)}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(match.matchDate)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="text-sm text-muted-foreground mb-2">
                                {match._id === selectedMatch?._id &&
                                questions.length > 0
                                  ? `${questions.length} prediction questions available`
                                  : "Prediction questions available"}
                              </div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex -space-x-2">
                                        <Avatar className="border-2 border-background h-8 w-8">
                                          <AvatarImage
                                            src={getTeamLogo(match.teamA)}
                                            alt={match.teamA}
                                          />
                                          <AvatarFallback className="bg-primary/20 text-xs">
                                            {match.teamA.slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <Avatar className="border-2 border-background h-8 w-8">
                                          <AvatarImage
                                            src={getTeamLogo(match.teamB)}
                                            alt={match.teamB}
                                          />
                                          <AvatarFallback className="bg-primary/20 text-xs">
                                            {match.teamB.slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {match.teamA} vs {match.teamB}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </CardContent>
                            <CardFooter className="bg-muted/20 p-3">
                              <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setSelectedMatch(match)}
                              >
                                View Details
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                      : !isLoading && (
                          <div className="col-span-3 flex flex-col items-center justify-center p-8">
                            <CricketBall className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                              No matches available at the moment.
                            </p>
                          </div>
                        )}
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Card className="w-full max-w-md overflow-hidden border-primary/20">
                  <CardHeader className="bg-primary/5 text-center">
                    <motion.div
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 10 }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        duration: 1.5,
                      }}
                      className="mx-auto mb-4"
                    >
                      <CricketBall className="h-12 w-12 text-primary" />
                    </motion.div>
                    <CardTitle className="text-2xl">
                      Welcome to Cricket Prophet
                    </CardTitle>
                    <CardDescription>
                      Connect your wallet to start making predictions on cricket
                      matches and earn rewards.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Make Predictions</h3>
                          <p className="text-sm text-muted-foreground">
                            Predict outcomes of cricket matches
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Coins className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Earn Rewards</h3>
                          <p className="text-sm text-muted-foreground">
                            Win CPT tokens for correct predictions
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Track Performance</h3>
                          <p className="text-sm text-muted-foreground">
                            Monitor your prediction history and stats
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center p-6 bg-primary/5">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ConnectButton />
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Match Detail Modal */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent className="max-w-4xl overflow-hidden">
          <DialogHeader className="bg-primary/5 p-4 rounded-t-lg">
            <DialogTitle className="text-2xl flex items-center justify-center gap-4">
              <img
                src={
                  selectedMatch
                    ? getTeamLogo(selectedMatch.teamA)
                    : "/placeholder.svg"
                }
                alt={selectedMatch?.teamA}
                className="h-8 w-8 rounded-full bg-primary/10"
              />
              <span>
                {selectedMatch?.teamA} vs {selectedMatch?.teamB}
              </span>
              <img
                src={
                  selectedMatch
                    ? getTeamLogo(selectedMatch.teamB)
                    : "/placeholder.svg"
                }
                alt={selectedMatch?.teamB}
                className="h-8 w-8 rounded-full bg-primary/10"
              />
            </DialogTitle>
            <DialogDescription className="text-center flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              {selectedMatch && formatDate(selectedMatch.matchDate)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-6">
              {isQuestionLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ) : selectedMatch && questions && questions.length > 0 ? (
                questions.map((question) => {
                  // Check if question is closed
                  const questionClosed = isQuestionClosed(question.closedAt);

                  return (
                    <Card
                      key={question._id}
                      className="overflow-hidden border-primary/20"
                    >
                      <CardHeader className="bg-primary/5">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {question.question}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${
                              questionClosed
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : ""
                            }`}
                          >
                            {getTimeRemaining(question.closedAt)}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Closes: {formatDate(question.closedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {question.options.map((option, index) => {
                            // Check if this is the user's previous selection
                            const isUserPreviousSelection = userBets.some(
                              (bet) =>
                                bet.question._id === question._id &&
                                bet.option === option
                            );

                            return (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  // Only allow selection if question is still active and not closed
                                  if (question.isActive && !questionClosed) {
                                    setSelectedOption({
                                      ...selectedOption,
                                      [question._id]: option,
                                    });
                                  }
                                }}
                                className={`p-3 rounded-lg border-2 ${
                                  question.isActive && !questionClosed
                                    ? "cursor-pointer"
                                    : "cursor-not-allowed opacity-70"
                                } transition-all ${
                                  selectedOption[question._id] === option
                                    ? "border-primary bg-primary/10"
                                    : isUserPreviousSelection
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-muted hover:border-primary/50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-4 w-4 rounded-full border ${
                                      selectedOption[question._id] === option
                                        ? "border-primary bg-primary"
                                        : isUserPreviousSelection
                                        ? "border-green-500 bg-green-500"
                                        : "border-muted-foreground"
                                    }`}
                                  >
                                    {(selectedOption[question._id] === option ||
                                      isUserPreviousSelection) && (
                                      <div className="h-2 w-2 m-[3px] rounded-full bg-white" />
                                    )}
                                  </div>
                                  <span className="font-medium">{option}</span>
                                  {isUserPreviousSelection && (
                                    <Badge
                                      variant="outline"
                                      className="ml-auto text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    >
                                      Your Pick
                                    </Badge>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        {/* Show if question has an answer already */}
                        {question.answer && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="font-medium">
                                Correct Answer: {question.answer}
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Show if question is closed but no answer yet */}
                        {questionClosed && !question.answer && (
                          <div className="mt-4 p-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">
                                Prediction window has closed. Results will be
                                available soon.
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-primary/5 p-4 flex justify-end">
                        {userBets.some(
                          (bet) => bet.question._id === question._id
                        ) ? (
                          <Button
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            disabled
                          >
                            Prediction Submitted
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBet(question._id)}
                            disabled={
                              !selectedOption[question._id] ||
                              isPlacingBet[question._id] ||
                              !question.isActive ||
                              !!question.answer ||
                              questionClosed // Disable if question is closed
                            }
                            className="relative overflow-hidden"
                          >
                            {isPlacingBet[question._id] ? (
                              <>
                                <span className="opacity-0">
                                  Place Prediction
                                </span>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                              </>
                            ) : question.answer || questionClosed ? (
                              <>
                                Prediction Closed
                                <AlertTriangle className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Place Prediction
                                <Sparkles className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    No prediction questions available for this match yet.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="bg-primary/5 p-4 rounded-b-lg">
            <Button variant="outline" onClick={() => setSelectedMatch(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Network switch dialog */}
      <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Network Change Required
            </DialogTitle>
            <DialogDescription>
              Cricket Prophet requires the Sepolia test network. Please switch
              your network to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-4 w-full">
              <Badge
                variant="outline"
                className="text-muted-foreground flex-1 justify-center py-2"
              >
                Current:{" "}
                {chains.find((c: { id: any }) => c.id === chain?.id)?.name ||
                  "Unknown Network"}
              </Badge>
              <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />
              <Badge className="flex-1 justify-center py-2 bg-primary">
                Required: Sepolia
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Switching networks will allow you to interact with the Cricket
              Prophet platform and place predictions.
            </div>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center gap-2">
            <Button
              onClick={handleSwitchToSepolia}
              className="w-full sm:w-auto"
            >
              Switch to Sepolia
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Account Verification Required
            </DialogTitle>
            <DialogDescription>
              You need to complete the sign-up process before making
              predictions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Card className="p-4 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg w-full">
              <p className="text-sm">
                To ensure fair play and prevent abuse, we require all users to
                complete a simple verification process before making
                predictions.
              </p>
            </Card>
          </div>
          <DialogFooter className="flex justify-between sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowVerificationDialog(false);
                handleVerificationComplete(false);
              }}
            >
              Cancel
            </Button>
            <DashboardSignupIntegration className="w-full" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Dialog */}
      <Dialog
        open={!!claimTxHash}
        onOpenChange={(open) => !open && setClaimTxHash(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Transaction Submitted
            </DialogTitle>
            <DialogDescription>
              Your claim transaction has been submitted to the blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-medium">Transaction Hash</p>
              <p className="text-sm text-muted-foreground break-all mt-1">
                {claimTxHash}
              </p>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              The transaction is being processed. This may take a few minutes to
              complete.
            </div>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setClaimTxHash(null)}>
              Close
            </Button>
            <Button
              onClick={() => claimTxHash && viewTransaction(claimTxHash)}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              View on Etherscan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Details Dialog */}
      <Dialog
        open={!!selectedMatchDetails}
        onOpenChange={(open) => !open && setSelectedMatchDetails(null)}
      >
        <DialogContent className="max-w-4xl overflow-hidden">
          <DialogHeader className="bg-primary/5 p-4 rounded-t-lg">
            <DialogTitle className="text-2xl flex items-center justify-center gap-4">
              <img
                src={
                  selectedMatchDetails?.teamA
                    ? getTeamLogo(selectedMatchDetails.teamA)
                    : "/placeholder.svg"
                }
                alt={selectedMatchDetails?.teamA || "Team A"}
                className="h-8 w-8 rounded-full bg-primary/10"
              />
              <span>{selectedMatchDetails?.match}</span>
              <img
                src={
                  selectedMatchDetails?.teamB
                    ? getTeamLogo(selectedMatchDetails.teamB)
                    : "/placeholder.svg"
                }
                alt={selectedMatchDetails?.teamB || "Team B"}
                className="h-8 w-8 rounded-full bg-primary/10"
              />
            </DialogTitle>
            <DialogDescription className="text-center flex items-center justify-center gap-2">
              Your predictions and results
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-6">
              {selectedMatchDetails && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Match Summary</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedMatchDetails.predictions.length} prediction
                          {selectedMatchDetails.predictions.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-800 dark:text-green-300 font-bold">
                            {
                              selectedMatchDetails.predictions.filter(
                                (p) => p.status === "won"
                              ).length
                            }
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Won</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (selectedMatchDetails.predictions.filter(
                                  (p) => p.status === "won"
                                ).length /
                                  selectedMatchDetails.predictions.filter(
                                    (p) => p.status !== "pending"
                                  ).length) *
                                  100
                              ) || 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-800 dark:text-red-300 font-bold">
                            {
                              selectedMatchDetails.predictions.filter(
                                (p) => p.status === "lost"
                              ).length
                            }
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Lost</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (selectedMatchDetails.predictions.filter(
                                  (p) => p.status === "lost"
                                ).length /
                                  selectedMatchDetails.predictions.filter(
                                    (p) => p.status !== "pending"
                                  ).length) *
                                  100
                              ) || 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-800 dark:text-yellow-300 font-bold">
                            {
                              selectedMatchDetails.predictions.filter(
                                (p) => p.status === "pending"
                              ).length
                            }
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Pending</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (selectedMatchDetails.predictions.filter(
                                  (p) => p.status === "pending"
                                ).length /
                                  selectedMatchDetails.predictions.length) *
                                  100
                              )}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedMatchDetails.predictions.map((prediction) => (
                      <Card
                        key={prediction.id}
                        className={`overflow-hidden border-l-4 ${
                          prediction.status === "won"
                            ? "border-l-green-500"
                            : prediction.status === "lost"
                            ? "border-l-red-500"
                            : "border-l-yellow-500"
                        }`}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {prediction.question}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(
                                prediction.status
                              )} text-white flex items-center gap-1`}
                            >
                              {getStatusIcon(prediction.status)}
                              {getStatusText(prediction.status)}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(prediction.date)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-medium">Your prediction:</div>
                            <Badge variant="secondary">
                              {prediction.selectedOption}
                            </Badge>
                          </div>

                          {prediction.status === "won" && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <Check className="h-4 w-4" />
                              <span className="font-medium">
                                Correct prediction!
                              </span>
                            </div>
                          )}

                          {prediction.status === "lost" &&
                            prediction.correctOption && (
                              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <X className="h-4 w-4" />
                                <span className="font-medium">
                                  Incorrect prediction. Correct answer:{" "}
                                  {prediction.correctOption}
                                </span>
                              </div>
                            )}

                          {prediction.status === "pending" && (
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                Waiting for match results
                              </span>
                            </div>
                          )}
                        </CardContent>
                        {prediction.status === "won" && prediction.reward && (
                          <CardFooter className="bg-muted/20 p-3 flex justify-between">
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {prediction.reward} CPT reward
                              </span>
                            </div>

                            {prediction.claimed ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Claimed
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-primary/10 hover:bg-primary/20"
                                disabled={
                                  prediction.isClaimLoading || isClaimingRewards
                                }
                                onClick={() =>
                                  handleClaimAllRewards(
                                    selectedMatchDetails.matchId,
                                    [prediction]
                                  )
                                }
                              >
                                {prediction.isClaimLoading ||
                                isClaimingRewards ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <Coins className="h-3 w-3 mr-1 text-primary" />
                                    Claim Reward
                                  </>
                                )}
                              </Button>
                            )}
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>

                  {getClaimableTokens(selectedMatchDetails.predictions) > 0 && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-full">
                          <Coins className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Total Rewards Available
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            You have{" "}
                            {getClaimableTokens(
                              selectedMatchDetails.predictions
                            )}{" "}
                            CPT tokens to claim
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleClaimAllRewards(
                            selectedMatchDetails.matchId,
                            selectedMatchDetails.predictions
                          )
                        }
                        disabled={
                          selectedMatchDetails.predictions.some(
                            (p) => p.isClaimLoading
                          ) || isClaimingRewards
                        }
                        className="bg-primary/90 hover:bg-primary w-full sm:w-auto"
                      >
                        {selectedMatchDetails.predictions.some(
                          (p) => p.isClaimLoading
                        ) || isClaimingRewards ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Claiming All...
                          </>
                        ) : (
                          <>
                            <Coins className="h-4 w-4 mr-2" />
                            Claim All Rewards
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setSelectedMatchDetails(null)}
                    >
                      <BookmarkCheck className="h-4 w-4" />
                      Close Details
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal overlay during submission */}
      {(Object.values(isPlacingBet).some(Boolean) || isPending) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle className="text-center">
                Processing Prediction
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Please wait while we process your prediction...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}
