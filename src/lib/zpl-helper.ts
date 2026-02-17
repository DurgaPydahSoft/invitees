/**
 * Utility to generate ZPL (Zebra Programming Language) strings for Zebra ZD230.
 * Designed for 20mm x 45mm label orientation.
 * DPI: 203 (8 dots/mm)
 * Width: 20mm (160 dots)
 * Height: 45mm (360 dots)
 */

export const generateBarcodeZPL = (uniqueId: string) => {
    return `
^XA
^PW160
^LL360
^LH0,0
^FO10,40
^BY2,2,80
^BCN,80,Y,N,N
^FD${uniqueId}^FS
^XZ
`.trim();
};

export const generateQRZPL = (uniqueId: string) => {
    return `
^XA
^PW160
^LL360
^LH0,0
^FO20,50
^BQN,2,6
^FDQA,${uniqueId}^FS
^XZ
`.trim();
};

/**
 * Downloads ZPL as a file (Legacy support)
 */
export const downloadZPLFile = (guestName: string, zpl: string) => {
    const blob = new Blob([zpl], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `label_${guestName.replace(/\s+/g, '_')}.lbl`;
    a.click();

    URL.revokeObjectURL(url);
};
