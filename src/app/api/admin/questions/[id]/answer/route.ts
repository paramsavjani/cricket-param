import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/model/Question";


export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const requestBody = await req.json();
    const questionId = requestBody.id;

    if (!requestBody.answer) {
      return NextResponse.json({ message: "Answer is required" }, { status: 400 });
    }

    const existingQuestion = await Question.findById(questionId);

    if (!existingQuestion) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    if (!existingQuestion.options.includes(requestBody.answer)) {
      return NextResponse.json({ message: "Answer must be one of the question options" }, { status: 400 });
    }

    existingQuestion.answer = requestBody.answer;
    await existingQuestion.save();

    return NextResponse.json({ message: "Answer updated successfully", question: existingQuestion }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating answer:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}