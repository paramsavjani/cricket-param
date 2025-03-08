import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Question from "@/lib/model/Question"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const data = await req.json()
    const questionId = params.id

    if (!data.answer) {
      return NextResponse.json({ message: "Answer is required" }, { status: 400 })
    }

    const question = await Question.findById(questionId)

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 })
    }

    if (!question.options.includes(data.answer)) {
      return NextResponse.json({ message: "Answer must be one of the question options" }, { status: 400 })
    }

    question.answer = data.answer
    await question.save()

    return NextResponse.json({ message: "Answer set successfully", question }, { status: 200 })
  } catch (error: unknown) {
    console.error("Error setting answer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

