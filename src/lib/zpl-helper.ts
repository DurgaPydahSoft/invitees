/**
 * Utility to generate ZPL (Zebra Programming Language) strings for Zebra ZD230.
 * Designed for 2x1 inch or 4x2 inch label stock.
 */

export const generateZPL = (guest: { name: string; uniqueId: string; area?: string }) => {
    // Basic ZPL structure
    // ^XA: Start Format
    // ^FOx,y: Field Origin
    // ^A0N,h,w: Font (Scaling)
    // ^FD: Field Data
    // ^BC: Code 128 Barcode
    // ^XZ: End Format

    const zpl = `
^XA
^CI28
^BY3,3,120
^FO50,50^BCN,150,Y,N,N^FD${guest.uniqueId}^FS
^XZ
    `.trim();

    return zpl;
};

/**
 * Sends ZPL to the printer via the browser's raw printing or local helper
 * Note: Browser-based raw printing usually requires a local printer share or a utility like QZ Tray.
 * For a direct implementation, we can provide a "Download ZPL" or copy to clipboard.
 */
export const downloadZPLFile = (guestName: string, zpl: string) => {
    const element = document.createElement("a");
    const file = new Blob([zpl], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `label_${guestName.replace(/\s+/g, '_')}.zpl`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};
