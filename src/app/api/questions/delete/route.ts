// if some users bet on the question, we should not delete the question
// we should only delete the question if no users have bet on it

import { NextRequest, NextResponse } from "next/server";
import Question from "@/lib/model/Question";
import Bet from "@/lib/model/Bet";
import { connectDB } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const { questionId } = await request.json();

    await connectDB();

    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    const bets = await Bet.find({ question: questionId });

    if (bets.length > 0) {
      return NextResponse.json(
        { message: "Question has bets" },
        { status: 400 }
      );
    }

    await Question.findByIdAndDelete(questionId);
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { message: "Error deleting question" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Question deleted" }, { status: 200 });
}
