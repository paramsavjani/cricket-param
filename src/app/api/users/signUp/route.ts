import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/model/User";
import { connectDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, address, email, username } = await request.json();

    await connectDB();

    const user = await User.findOne({ address });

    const userByUsername = await User.findOne({ username });

    const userByEmail = await User.findOne({ email });

    if (user) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }     
      );
    }

    if (userByUsername) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    if (userByEmail) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    await User.create({ name, address, email, username });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "User creation failed" },
      { status: 500 }
    );
  }
}
