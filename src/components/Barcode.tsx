"use client";
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
    value: string;
    width?: number;
    height?: number;
    fontSize?: number;
    displayValue?: boolean;
    className?: string;
    background?: string;
    lineColor?: string;
}

const Barcode: React.FC<BarcodeProps> = ({
    value,
    width = 2,
    height = 50,
    fontSize = 14,
    displayValue = true,
    className = "",
    background = "transparent",
    lineColor = "#000000"
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: "CODE128",
                    width,
                    height,
                    displayValue,
                    fontSize,
                    background,
                    lineColor,
                    margin: 0
                });
            } catch (err) {
                console.error("Barcode generation failed", err);
            }
        }
    }, [value, width, height, fontSize, displayValue, background, lineColor]);

    return (
        <svg ref={svgRef} className={className}></svg>
    );
};

export default Barcode;
