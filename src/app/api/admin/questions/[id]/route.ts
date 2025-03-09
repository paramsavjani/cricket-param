import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Question from "@/lib/model/Question"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const data = await req.json()
    const questionId = data.id

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        question: data.question,
        options: data.options,
        isActive: data.isActive,
        closedAt: data?.closedAt,
      },
      { new: true },
    )

    if (!updatedQuestion) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Question updated successfully", question: updatedQuestion }, { status: 200 })
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

