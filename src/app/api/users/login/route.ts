import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/model/User';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest) {

    const { email, password } = await request.json();

    await connectDB();

    const user = await User.findOne({ email });



    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.password !== password) {
        return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }
    

    return NextResponse.json({ user });
}
