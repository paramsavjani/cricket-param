/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/model/User"
import Bet from "@/lib/model/Bet"
import Question from "@/lib/model/Question"
import Match from "@/lib/model/Match"
// import { verifyAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    // const isAdmin = await verifyAdmin(req)
    // if (!isAdmin) {
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    // }

    await connectDB()

    // Get total users count
    const totalUsers = await User.countDocuments()

    // Get total predictions/bets count
    const totalPredictions = await Bet.countDocuments()

    // Get total questions count
    const totalQuestions = await Question.countDocuments()

    // Get answered questions count
    const answeredQuestions = await Question.countDocuments({ answer: { $exists: true, $ne: null } })

    // Get active questions count
    const activeQuestions = await Question.countDocuments({ isActive: true })

    // Get total matches count
    const totalMatches = await Match.countDocuments()

    // Get upcoming matches count (matches with date in the future)
    const currentDate = new Date()
    const upcomingMatches = await Match.countDocuments({ matchDate: { $gt: currentDate } })

    // Calculate average predictions per user
    const avgPredictionsPerUser = totalUsers > 0 ? (totalPredictions / totalUsers).toFixed(1) : "0"

    // Get recent activity - last 5 bets
    const recentActivity = await Bet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "question",
        select: "question",
      })
      .populate({
        path: "user",
        select: "username address",
      })
      .lean()

    // Format recent activity
    const formattedActivity = recentActivity.map((bet) => ({
      id: bet._id,
      user: bet.user?.username || bet.user?.address?.substring(0, 8) || "Unknown",
      question: bet.question?.question || "Unknown question",
      option: bet.option,
      timestamp: bet.createdAt,
    }))

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalPredictions,
          totalQuestions,
          answeredQuestions,
          activeQuestions,
          totalMatches,
          upcomingMatches,
          avgPredictionsPerUser,
        },
        recentActivity: formattedActivity,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

