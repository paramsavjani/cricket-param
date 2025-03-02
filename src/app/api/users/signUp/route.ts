import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/model/User';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest) {

    const { email, name, profilePicture, provider } = await request.json();

    await connectDB();

    const user = await User.findOne({ email }); 

    if (user) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    await User.create({ email, name, profilePicture, provider });

    const finalUser = await User.findOne({ email }).select('name email profilePicture balance');

    if (!finalUser) {
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }

    return NextResponse.json({ user: finalUser }, { status: 201 });
}

