"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect } from "react";
import {
  WagmiProvider,
  createConfig,
  http,
  useReadContract,
  useWriteContract,
  useAccount,
  useSwitchChain,
} from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { sepolia, mainnet, polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Web3AuthConnectorInstance from "./Web3AuthConnectorInstance";
import { ConnectButton } from "./ConnectButton";
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
  BirdIcon as Cricket,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Zap,
  Bell,
  Menu,
  Flame,
  Star,
  Loader2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
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

// 1. Add Sonner import at the top with other imports
import { Toaster, toast } from "sonner";

// Create a client
const queryClient = new QueryClient();

// Set up wagmi config
const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId: "3314f39613059cb687432d249f1658d2",
      showQrModal: true,
    }),
    coinbaseWallet({ appName: "Cricket Prophet" }),
    Web3AuthConnectorInstance([mainnet, sepolia, polygon]),
  ],
});

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DashBoard />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

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
}

interface Prediction {
  id: string;
  match: string;
  question: string;
  selectedOption: string;
  date: string;
  status: "pending" | "won" | "lost";
  reward?: number;
}

function DashBoard() {
  const { chains, switchChain } = useSwitchChain();
  const { chain } = useAccount();
  const { address, isConnected } = useAccount();
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedOption, setSelectedOption] = useState<{
    [key: string]: string;
  }>({});
  // 3. Update the isPlacingBet state to be an object instead of boolean
  const [isPlacingBet, setIsPlacingBet] = useState<{ [key: string]: boolean }>(
    {}
  );
  // 4. Add a loading state for questions
  const [isQuestionLoading, setIsQuestionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Mock predictions data
  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      id: "1",
      match: "India vs Australia",
      question: "Which team will win the toss?",
      selectedOption: "India",
      date: "2023-11-15T10:00:00",
      status: "won",
      reward: 120,
    },
    {
      id: "2",
      match: "England vs New Zealand",
      question: "Will there be a century scored?",
      selectedOption: "Yes",
      date: "2023-11-12T14:30:00",
      status: "lost",
    },
    {
      id: "3",
      match: "South Africa vs Pakistan",
      question: "Total sixes in the match?",
      selectedOption: "More than 10",
      date: "2023-11-18T09:15:00",
      status: "pending",
    },
  ]);

  const { data: tokenBalance, isLoading: isBalanceLoading } = useReadContract({
    abi,
    address: "0x66f8ECD191AF7F90bc4Fe82629d525e5AB9FDf4C",
    functionName: "balanceOf",
    args: [address],
  });

  // Updated to use the latest wagmi hooks correctly
  const { writeContractAsync, isPending, isError, error } = useWriteContract();

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/layout/matches");
        const data = await response.json();
        console.log(data.matches);
        setMatches(data.matches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [address]);

  useEffect(() => {
    if (isConnected && chain && chain.id !== sepolia.id) {
      setShowNetworkDialog(true);
    } else {
      setShowNetworkDialog(false);
    }
  }, [chain, isConnected]);

  // Handle network switch
  const handleSwitchToSepolia = async () => {
    try {
      switchChain({ chainId: sepolia.id });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // Format address for display
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

  // 2. Update the handleBet function to track loading state per question
  const handleBet = async (questionId: string) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedOption[questionId]) {
      toast.error("Please select an option first");
      return;
    }

    // Track loading state for this specific question
    setIsPlacingBet((prev) => ({ ...prev, [questionId]: true }));

    try {
      await writeContractAsync({
        address: "0x66f8ECD191AF7F90bc4Fe82629d525e5AB9FDf4C",
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
          };

          setPredictions((prev) => [newPrediction, ...prev]);
        }
      }

      // Reset selected option for this question
      setSelectedOption((prev) => ({
        ...prev,
        [questionId]: "",
      }));

      toast.success("Prediction placed successfully!");
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place prediction. Please try again.");
    } finally {
      setIsPlacingBet((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const getTeamLogo = (teamName: string) => {
    // This would ideally fetch actual team logos
    const teamLogos: Record<string, string> = {
      "Chennai Super Kings":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn3plcgt5OnAx_VelXAj9Z8TWBiqg6B-xgCJ__kuFeXr1ClntuhvVu0IugURU6TfyHk9qUuECEpos1E5ayEmx0fAupMIvNLQnLOwavDhBYxkIwvRv9cmm7_qHZmlcSwr3Un-hJpy92AooR9Qn77PUcr4yRgAORYwoTBjTYOmyYlHbZ0nDyaL3HWqUk/s2141/Original%20Chennai%20Super%20Fun%20Logo%20PNG%20-%20SVG%20File%20Download%20Free%20Download.png",
      "Mumbai Indians":
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcIHFJONN-c6wVsb8I0TI5u1He8Vh5aUlmZ7vPzd6paraXfCf5r-bNdOoT3rqBA5S8Yu3DwefbB4C_Utu6a4E1XUXtdo28k2ViLDYs2fDS7cG9LO0S6ESd5pEZrE1GvYAf6M0_dTs9OibYMQAwkOQZvALvo-ggMxtTh_4JINiQsYeBWtQ0APFedzCZ/s7200/Original%20Mumbai%20Indians%20PNG-SVG%20File%20Download%20Free%20Download.png",
      "Royal Challengers Bangalore":
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

    const getTeamLogo = (teamName: string): string => {
      return (
        teamLogos[teamName] ||
        `/placeholder.svg?height=40&width=40&text=${teamName
          .slice(0, 3)
          .toUpperCase()}`
      );
    };
    return (
      teamLogos[teamName] ||
      `/placeholder.svg?height=40&width=40&text=${teamName
        .slice(0, 3)
        .toUpperCase()}`
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

  // 5. Update the useEffect for fetching questions to use the loading state
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
          if(!res.ok) {
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

  // Sidebar navigation items
  const navItems = [
    { icon: <Trophy className="h-5 w-5" />, label: "Matches", active: true },
    { icon: <Users className="h-5 w-5" />, label: "Leaderboard" },
    { icon: <Zap className="h-5 w-5" />, label: "Rewards" },
    { icon: <Bell className="h-5 w-5" />, label: "Notifications" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Cricket className="h-6 w-6 text-primary" />
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
                      {chains.find((c) => c.id === chain?.id)?.name ||
                        "Unknown Network"}
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
                    <span>67% Win Rate</span>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Close Menu
                </Button>
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
                <Cricket className="h-6 w-6 text-primary" />
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
                    {chains.find((c) => c.id === chain?.id)?.name ||
                      "Unknown Network"}
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
                  <span>67% Win Rate</span>
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
              <ThemeToggle />
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
                <div className="hidden md:flex items-center gap-2">
                  <ThemeToggle />
                </div>
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
                          {chains.find((c) => c.id === chain?.id)?.name ||
                            "Unknown Network"}
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
                        <p className="text-xl font-bold">67% Win Rate</p>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>10 wins</span>
                          <span>15 total</span>
                        </div>
                        <Progress value={67} className="h-2" />
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
                        <CardTitle>Your Predictions</CardTitle>
                        <CardDescription>
                          Track your recent predictions and rewards
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          {predictions.length > 0 ? (
                            <div className="divide-y">
                              {predictions.map((prediction) => (
                                <motion.div
                                  key={prediction.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                  className="p-4 hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-medium">
                                        {prediction.match}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {prediction.question}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`${getStatusColor(
                                        prediction.status
                                      )} text-white`}
                                    >
                                      {getStatusText(prediction.status)}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">
                                        {prediction.selectedOption}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(prediction.date)}
                                      </span>
                                    </div>
                                    {prediction.reward && (
                                      <div className="flex items-center gap-1 text-green-500">
                                        <Coins className="h-3 w-3" />
                                        <span className="font-medium">
                                          +{prediction.reward} CPT
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6">
                              <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground text-center">
                                You haven&apos;t made any predictions yet.
                                <br />
                                Start predicting to earn rewards!
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Trending Matches - Desktop Only */}
                <div className="hidden lg:block mt-6">
                  <h2 className="text-xl font-bold mb-4">Trending Matches</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {!isLoading &&
                      matches.map((match, idx) => (
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
                              {questions?.length > 0} prediction questions
                              available
                            </div>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex -space-x-2">
                                      <Avatar className="border-2 border-background h-8 w-8">
                                        <AvatarFallback className="bg-primary/20 text-xs">
                                          {match.teamA.slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <Avatar className="border-2 border-background h-8 w-8">
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
                              <div className="text-sm">
                                <span className="text-primary font-medium">
                                  250+
                                </span>{" "}
                                users predicting
                              </div>
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
                      ))}
                  </div>
                </div>

                {/* Leaderboard - Desktop Only */}
                <div className="hidden lg:block mt-8">
                  <h2 className="text-xl font-bold mb-4">Top Predictors</h2>
                  <Card>
                    <CardHeader className="bg-primary/5">
                      <CardTitle>Weekly Leaderboard</CardTitle>
                      <CardDescription>
                        Top performers based on prediction accuracy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                                {i}
                              </div>
                              <Avatar className="h-10 w-10 border-2 border-primary/20">
                                <AvatarFallback>
                                  {String.fromCharCode(64 + i)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">User{i}</p>
                                <p className="text-xs text-muted-foreground">
                                  {90 - i * 5}% accuracy
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                <Flame className="h-3 w-3 mr-1 text-primary" />
                                {10 - i} streak
                              </Badge>
                              <Badge>
                                <Star className="h-3 w-3 mr-1" />
                                {1000 - i * 100} CPT
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
                      <Cricket className="h-12 w-12 text-primary" />
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
                src={selectedMatch ? getTeamLogo(selectedMatch.teamA) : ""}
                alt={selectedMatch?.teamA}
                className="h-8 w-8 rounded-full bg-primary/10"
              />
              <span>
                {selectedMatch?.teamA} vs {selectedMatch?.teamB}
              </span>
              <img
                src={selectedMatch ? getTeamLogo(selectedMatch.teamB) : ""}
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
              {/* 8. Add a loading state for the questions in the match detail modal */}
              {isQuestionLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ) : selectedMatch && questions && questions.length > 0 ? (
                questions.map((question) => (
                  <Card
                    key={question._id}
                    className="overflow-hidden border-primary/20"
                  >
                    <CardHeader className="bg-primary/5">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {question.question}
                        </CardTitle>
                        <Badge variant="outline" className="ml-2">
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
                        {question.options.map((option, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setSelectedOption({
                                ...selectedOption,
                                [question._id]: option,
                              })
                            }
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedOption[question._id] === option
                                ? "border-primary bg-primary/10"
                                : "border-muted hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-4 w-4 rounded-full border ${
                                  selectedOption[question._id] === option
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {selectedOption[question._id] === option && (
                                  <div className="h-2 w-2 m-[3px] rounded-full bg-white" />
                                )}
                              </div>
                              <span className="font-medium">{option}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                    {/* 7. Update the CardFooter in the match detail modal to use per-question loading state */}
                    <CardFooter className="bg-primary/5 p-4 flex justify-end">
                      <Button
                        onClick={() => handleBet(question._id)}
                        disabled={
                          !selectedOption[question._id] ||
                          isPlacingBet[question._id]
                        }
                        className="relative overflow-hidden"
                      >
                        {isPlacingBet[question._id] ? (
                          <>
                            <span className="opacity-0">Place Prediction</span>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          </>
                        ) : (
                          <>
                            Place Prediction
                            <Sparkles className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
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
                {chains.find((c) => c.id === chain?.id)?.name ||
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

      {/* 9. Add a modal overlay to prevent interactions during submission */}
      {Object.values(isPlacingBet).some(Boolean) && (
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

      {/* 10. Add the Sonner Toaster component at the end of the return statement, just before the closing div */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
