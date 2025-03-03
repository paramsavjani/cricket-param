import { type NextRequest, NextResponse } from "next/server";
import Question from "@/lib/model/Question";
import { connectDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, options } = body;

    if (
      !question ||
      !options ||
      !Array.isArray(options) ||
      options.length === 0
    ) {
      return NextResponse.json(
        { error: "Question and options are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const newQuestion = await Question.create({ question, options });
    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
