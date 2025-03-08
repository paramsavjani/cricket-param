import { type NextRequest, NextResponse } from "next/server"
import Bet from "@/lib/model/Bet"
import { connectDB } from "@/lib/db"
import Question from "@/lib/model/Question"
import Match from "@/lib/model/Match"
import User from "@/lib/model/User"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id")

    await connectDB()

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // First check if the user exists in the database
    const user = await User.findOne({ address: userId });

    // If user doesn't exist, we'll need to create them
    if (!user) {
      return NextResponse.json({ message: "Please complete your profile" }, { status: 404 })
    }

    // Get all bets for this user
    const bets = await Bet.find({ user: user._id })

    console.log(bets)

    if (bets.length === 0) {
      return NextResponse.json({ bets: [] }, { status: 200 })
    }

    // Get all questions referenced in the bets
    const questionIds = bets.map((bet) => bet.question)
    const questions = await Question.find({ _id: { $in: questionIds } })

    // Get all matches referenced by the questions
    const matchIds = questions.map((question) => question.matchId)
    const matches = await Match.find({ _id: { $in: matchIds } })

    // Create a fully detailed response with all related information
    const betsWithDetails = bets.map((bet) => {
      const question = questions.find((q) => q._id.toString() === bet.question.toString())
      const match = question ? matches.find((m) => m._id.toString() === question.matchId.toString()) : null

      return {
        _id: bet._id,
        question: question,
        match: match,
        option: bet.option,
        createdAt: bet.createdAt,
        updatedAt: bet.updatedAt,
      }
    })

    console.log(betsWithDetails)

    return NextResponse.json({ bets: betsWithDetails }, { status: 200 })
  } catch (error) {
    console.error("Error fetching bets:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const data = await req.json()
    const { address, questionId, option } = data

    if (!address || !questionId || !option) {
      return NextResponse.json({ message: "Address, questionId, and option are required" }, { status: 400 })
    }

    // Verify the question exists and is still active
    const question = await Question.findById(questionId)

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 })
    }

    if (!question.isActive) {
      return NextResponse.json({ message: "This question is no longer active" }, { status: 400 })
    }

    // Check if user already has a bet for this question
    const existingBet = await Bet.findOne({
      user: address,
      question: questionId,
    })

    if (existingBet) {
      // Update the existing bet
      existingBet.option = option
      await existingBet.save()

      return NextResponse.json(
        {
          bet: existingBet,
          message: "Prediction updated successfully",
        },
        { status: 200 },
      )
    }

    // Create a new bet
    const newBet = await Bet.create({
      user: address,
      question: questionId,
      option,
    })

    return NextResponse.json(
      {
        bet: newBet,
        message: "Prediction placed successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating bet:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

