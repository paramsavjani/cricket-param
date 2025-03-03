import { NextRequest, NextResponse } from "next/server";
import Question from "@/lib/model/Question";
import { connectDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { questionId, answer } = await request.json();

    await connectDB();

    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    question.answer = answer;

    await question.save();
  } catch (error) {
    console.error("Error saving answer:", error);
    return NextResponse.json(
      { message: "Error saving answer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Answer saved" }, { status: 200 });
}
