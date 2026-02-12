import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Guest from '@/lib/db/models/Guest';
import { processExcelFile, generateGuestId } from '@/lib/excel-processor';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const rawData = await processExcelFile(buffer);

        if (rawData.length === 0) {
            return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
        }

        // Batch processing for performance
        const batchSize = 1000;
        let importedCount = 0;

        for (let i = 0; i < rawData.length; i += batchSize) {
            const batch = rawData.slice(i, i + batchSize);
            const guestPromises = batch.map(data => {
                return {
                    ...data,
                    uniqueId: generateGuestId(),
                    invitedStatus: 'NOT INVITED',
                    attendanceStatus: 'NOT ATTENDED',
                };
            });

            // Use bulkWrite for high performance
            await Guest.insertMany(guestPromises, { ordered: false });
            importedCount += batch.length;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${importedCount} guests.`,
            count: importedCount
        });

    } catch (error: any) {
        console.error('Import Error:', error);
        return NextResponse.json({
            error: 'Failed to process file',
            details: error.message
        }, { status: 500 });
    }
}
