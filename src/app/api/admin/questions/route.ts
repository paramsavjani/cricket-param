import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Question from "@/lib/model/Question"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const data = await req.json()

    // Validate required fields
    if (!data.question || !data.matchId || !data.options || data.options.length < 2) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Create new question
    const newQuestion = await Question.create({
      question: data.question,
      matchId: data.matchId,
      options: data.options,
      isActive: data.isActive !== undefined ? data.isActive : true,
      closedAt: data?.closedAt,
    })

    return NextResponse.json({ message: "Question created successfully", question: newQuestion }, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

