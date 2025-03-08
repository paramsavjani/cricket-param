import { NextRequest, NextResponse } from "next/server";
import Bet from "@/lib/model/Bet";
import { connectDB } from "@/lib/db";
import Question from "@/lib/model/Question";
import User from "@/lib/model/User";

export async function POST(request: NextRequest) {
  try {
    const { questionId, option, address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { message: "User address is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let user = await User.findOne({ address });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    user = await User.findOne({
      address,
    });
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    const existBet = await Bet.find({question:question._id,user:user._id});

    if(existBet && existBet.length>=1)
    {
      return NextResponse.json(
        { message: "Already bet" },
        { status: 402 }
      );
    }

    const bet = await Bet.create({
      question: question._id,
      user: user._id,
      option,
    });

    return NextResponse.json({ bet, message: "Bet created" }, { status: 201 });
  } catch (error) {
    console.error("Error creating bet:", error);
    return NextResponse.json(
      { message: "Error creating bet" },
      { status: 500 }
    );
  }
}
