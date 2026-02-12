import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

export interface RawGuestData {
    name: string;
    phoneNumber?: string;
    remarks?: string;
    area?: string;
}

export const processExcelFile = async (buffer: Buffer): Promise<RawGuestData[]> => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const allGuestData: RawGuestData[] = [];

    workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) return;

        // Identify headers
        const headers = jsonData[0].map((h: any) => h?.toString().toLowerCase().trim() || "");

        const nameIdx = headers.indexOf('name');
        const phoneIdx = headers.findIndex((h: string) => h && (h.includes('phone') || h.includes('mobile') || h.includes('number') || h.includes('contact')));
        const remarksIdx = headers.indexOf('remarks');
        const areaIdx = headers.indexOf('area');

        if (nameIdx === -1) {
            console.warn(`Sheet "${sheetName}" is missing a "name" column.`);
            return;
        }

        // Skip header row
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[nameIdx]) continue;

            allGuestData.push({
                name: row[nameIdx].toString().trim(),
                phoneNumber: phoneIdx !== -1 ? row[phoneIdx]?.toString().trim() : undefined,
                remarks: remarksIdx !== -1 ? row[remarksIdx]?.toString().trim() : undefined,
                area: areaIdx !== -1 ? row[areaIdx]?.toString().trim() : undefined,
            });
        }
    });

    return allGuestData;
};

export const formatGuestName = (name: string): string => {
    return name
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const generateGuestId = (): string => {
    return randomUUID().split('-')[0].toUpperCase(); // Short readable ID like 'A1B2C3D4'
};
