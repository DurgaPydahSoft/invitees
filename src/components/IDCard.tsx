"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IGuest } from '@/lib/db/models/Guest';
import Barcode from './Barcode';

interface IDCardProps {
    guest: Partial<IGuest>;
    id?: string;
}

const IDCard: React.FC<IDCardProps> = ({ guest, id }) => {
    return (
        <div
            id={id}
            className="relative w-[350px] h-[500px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center justify-between p-8 text-white font-sans"
        >
            {/* Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"></div>

            {/* Header */}
            <div className="relative z-10 w-full text-center">
                <h3 className="text-xl font-bold tracking-widest uppercase text-indigo-300">Party Guest Pass</h3>
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mt-2"></div>
            </div>

            {/* QR Code Container */}
            <div className="relative z-10 group">
                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                    <QRCodeSVG
                        value={guest.uniqueId || 'GUEST-ID'}
                        size={180}
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            {/* Guest Details */}
            <div className="relative z-10 w-full text-center space-y-2 mb-4">
                <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-[0.2em]">Guest Name</p>
                <h2 className="text-2xl font-bold truncate px-2">{guest.name || 'Sample Guest'}</h2>

                <div className="mt-4 pt-4 border-t border-white/5 w-full flex flex-col items-center">
                    {guest.phoneNumber ? (
                        <div className="space-y-1 text-center">
                            <p className="text-indigo-200/60 text-[10px] uppercase tracking-wider">Contact Number</p>
                            <p className="text-lg font-black text-indigo-100">{guest.phoneNumber}</p>
                        </div>
                    ) : (
                        <div className="space-y-1 opacity-20 text-center">
                            <p className="text-indigo-200/60 text-[10px] uppercase tracking-wider">Identity Verified</p>
                            <p className="text-sm font-medium">Guest Pass</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Barcode Section (New) */}
            <div className="relative z-10 w-full flex flex-col items-center gap-1 mb-2">
                <div className="bg-white/90 p-2 rounded-lg shadow-inner">
                    <Barcode
                        value={guest.uniqueId || 'GUEST-ID'}
                        height={35}
                        width={1.2}
                        fontSize={8}
                        displayValue={false}
                        background="transparent"
                        lineColor="#000000"
                    />
                </div>
                <p className="text-[8px] font-black tracking-[0.4em] text-indigo-300 opacity-50 uppercase">Security Barcode</p>
            </div>

            {/* Footer / ID */}
            <div className="relative z-10 w-full flex justify-between items-center px-2 py-2 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 font-mono tracking-tighter">ID: {guest.uniqueId || 'XXXXXXXX'}</span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                    <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                    <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                </div>
            </div>
        </div>
    );
};

export default IDCard;
