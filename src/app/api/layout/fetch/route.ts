import { NextRequest, NextResponse } from "next/server";
import Question from "@/lib/model/Question";
import Match from "@/lib/model/Match";
import { connectDB } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all matches
    const matches = await Match.find().sort({ matchDate: 1 });

    // Fetch all active questions
    const questions = await Question.find({});

    // Group questions by matchId
    const questionsByMatch = questions.reduce((acc, question) => {
      if (!acc[question.matchId]) {
        acc[question.matchId] = [];
      }
      acc[question.matchId].push(question);
      return acc;
    }, {} as Record<string, typeof questions>);

    const matchesWithQuestions = matches.map((match) => ({
      ...match.toObject(),
      questions: questionsByMatch[match._id.toString()] || [],
    }));

    return NextResponse.json(
      { matches: matchesWithQuestions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching matches and questions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
