import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/model/Question";
import Match from "@/lib/model/Match";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { id: questionId, answer } = await req.json();

    if (!answer) {
      return NextResponse.json(
        { message: "Answer is required" },
        { status: 400 }
      );
    }

    const existingQuestion = await Question.findById(questionId);
    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    if (!existingQuestion.options.includes(answer)) {
      return NextResponse.json(
        { message: "Invalid answer. Must be one of the provided options." },
        { status: 400 }
      );
    }

    const match = await Match.findById(existingQuestion.matchId);
    if (!match) {
      return NextResponse.json({ message: "Match not found" }, { status: 404 });
    }

    if (match.merkleRoot) {
      return NextResponse.json(
        {
          message:
            "Merkle tree is already generated. Answer cannot be changed.",
        },
        { status: 403 }
      );
    }

    existingQuestion.answer = answer;
    existingQuestion.isActive = false;
    await existingQuestion.save();

    return NextResponse.json(
      { message: "Answer updated successfully", question: existingQuestion },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating answer:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
