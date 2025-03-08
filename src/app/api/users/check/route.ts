import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/model/User';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest) {

    const { address } = await request.json();

    await connectDB();

    const user = await User.findOne({ address });

    if(user){
        return NextResponse.json({ message: 'User found' }, { status: 200 });
    }

    return NextResponse.json({ message: 'User not found' }, { status: 404 });
}

