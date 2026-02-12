import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Guest from '@/lib/db/models/Guest';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const rawId = body.uniqueId;

        if (!rawId) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const idString = String(rawId).toUpperCase().trim();
        console.log('Check-in attempt for ID:', idString);

        const guest = await Guest.findOne({ uniqueId: idString });

        if (!guest) {
            console.warn('Guest not found for ID:', idString);
            return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
        }

        if (guest.attendanceStatus === 'ATTENDED') {
            return NextResponse.json({
                success: false,
                error: 'Already Checked In',
                guest
            });
        }

        guest.attendanceStatus = 'ATTENDED';
        guest.checkInTime = new Date();
        await guest.save();

        console.log('Check-in success for:', guest.name);

        return NextResponse.json({
            success: true,
            message: 'Check-in successful',
            guest
        });

    } catch (error: any) {
        console.error('Check-in error:', error);
        return NextResponse.json({
            error: 'Server error',
            details: error.message
        }, { status: 500 });
    }
}
