import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Guest from '@/lib/db/models/Guest';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const guests = await Guest.find().sort({ createdAt: -1 });

        const attended = guests.filter(g => g.attendanceStatus === 'ATTENDED');
        const unattended = guests.filter(g => g.attendanceStatus !== 'ATTENDED');

        const stats = [
            { Metric: 'Total Guests', Value: guests.length },
            { Metric: 'Attended', Value: attended.length },
            { Metric: 'Unattended', Value: unattended.length },
            { Metric: 'Attendance Rate', Value: `${((attended.length / (guests.length || 1)) * 100).toFixed(2)}%` }
        ];

        const formatDate = (date?: Date) => {
            if (!date) return '-';
            return new Date(date).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        };

        const attendedData = attended.map(g => ({
            'Guest Name': g.name,
            'Contact No': g.phoneNumber || '-',
            'Area': g.area || '-',
            'Remarks': g.remarks || '-',
            'Check-in Time': formatDate(g.checkInTime),
            'Unique ID': g.uniqueId
        }));

        const unattendedData = unattended.map(g => ({
            'Guest Name': g.name,
            'Contact No': g.phoneNumber || '-',
            'Area': g.area || '-',
            'Remarks': g.remarks || '-',
            'Unique ID': g.uniqueId
        }));

        // Create Workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Analytics
        const wsStats = XLSX.utils.json_to_sheet(stats);
        XLSX.utils.book_append_sheet(wb, wsStats, 'Analytics');

        // Sheet 2: Attended
        const wsAttended = XLSX.utils.json_to_sheet(attendedData);
        XLSX.utils.book_append_sheet(wb, wsAttended, 'Attended');

        // Sheet 3: Unattended
        const wsUnattended = XLSX.utils.json_to_sheet(unattendedData);
        XLSX.utils.book_append_sheet(wb, wsUnattended, 'Unattended');

        // Generate Buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="InviteQR_Export.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error: any) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Export failed', details: error.message }, { status: 500 });
    }
}
