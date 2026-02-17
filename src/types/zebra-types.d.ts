export { };

declare global {
    interface ZebraDevice {
        name: string;
        deviceType: string;
        connection: string;
        uid: string;
        version: number;
        provider: string;
        manufacturer: string;
        send: (data: string, successCallback?: (res: any) => void, errorCallback?: (err: any) => void) => void;
        read: (successCallback: (res: any) => void, errorCallback: (err: any) => void) => void;
    }

    interface BrowserPrintStatic {
        getDefaultDevice: (type: string, successCallback: (device: ZebraDevice) => void, errorCallback?: (err: any) => void) => void;
        getLocalDevices: (successCallback: (devices: ZebraDevice[]) => void, errorCallback?: (err: any) => void, type?: string) => void;
    }

    interface Window {
        BrowserPrint?: BrowserPrintStatic;
    }
}
