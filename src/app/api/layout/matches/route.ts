import { NextResponse } from "next/server";
import Match from "@/lib/model/Match";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();

    const matches = await Match.find({});

    return NextResponse.json({ matches }, { status: 200 });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
