import { generateReceiptData } from './escpos';

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }
  
  interface BluetoothLEScanFilter {
    name?: string;
    namePrefix?: string;
    services?: BluetoothServiceUUID[];
  }
  
  type BluetoothServiceUUID = string;
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }
  
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }
  
  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    properties: BluetoothCharacteristicProperties;
    writeValue(value: BufferSource): Promise<void>;
  }
  
  interface BluetoothCharacteristicProperties {
    write: boolean;
    writeWithoutResponse: boolean;
  }
}

interface BluetoothPrinter {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  connected: boolean;
}

class BluetoothPrinterManager {
  private printer: BluetoothPrinter | null = null;
  
  async scanForPrinters(): Promise<BluetoothDevice[]> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported in this browser');
    }
    
    try {
      // Request device with thermal printer service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: 'Printer' },
          { namePrefix: 'POS' },
          { namePrefix: 'BluePrinter' },
          { namePrefix: 'MTP' },
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Thermal printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Another common service
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Generic service
        ]
      });
      
      return [device];
    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw new Error('Failed to scan for Bluetooth printers. Make sure Bluetooth is enabled and the printer is in pairing mode.');
    }
  }
  
  async connectToPrinter(device: BluetoothDevice): Promise<void> {
    try {
      console.log('Connecting to printer:', device.name);
      
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }
      
      // Try different service UUIDs
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ffe0-0000-1000-8000-00805f9b34fb'
      ];
      
      let service = null;
      let characteristic = null;
      
      for (const serviceUUID of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(serviceUUID);
          break;
        } catch (e) {
          console.log(`Service ${serviceUUID} not found, trying next...`);
        }
      }
      
      if (!service) {
        // Try to get all services and find a write characteristic
        const services = await server.getPrimaryServices();
        for (const srv of services) {
          try {
            const characteristics = await srv.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                service = srv;
                characteristic = char;
                break;
              }
            }
            if (characteristic) break;
          } catch (e) {
            console.log('Error checking service:', e);
          }
        }
      }
      
      if (!characteristic && service) {
        // Try common characteristic UUIDs
        const charUUIDs = [
          '00002af1-0000-1000-8000-00805f9b34fb',
          '49535343-1e4d-4bd9-ba61-23c647249616',
          '0000ffe1-0000-1000-8000-00805f9b34fb'
        ];
        
        for (const charUUID of charUUIDs) {
          try {
            characteristic = await service.getCharacteristic(charUUID);
            break;
          } catch (e) {
            console.log(`Characteristic ${charUUID} not found, trying next...`);
          }
        }
      }
      
      if (!characteristic) {
        throw new Error('No writable characteristic found on the printer');
      }
      
      this.printer = {
        device,
        characteristic,
        connected: true
      };
      
      console.log('Successfully connected to printer');
    } catch (error) {
      console.error('Connection error:', error);
      throw new Error(`Failed to connect to printer: ${error}`);
    }
  }
  
  async printReceipt(billData: any, businessInfo: any, t?: (key: string) => string): Promise<void> {
    if (!this.printer || !this.printer.connected || !this.printer.characteristic) {
      throw new Error('No printer connected. Please connect to a printer first.');
    }
    
    try {
      const receiptData = generateReceiptData(billData, businessInfo, t);
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      
      // Split data into chunks if needed (some printers have MTU limits)
      const chunkSize = 20; // Conservative chunk size
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.printer.characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log('Receipt printed successfully');
    } catch (error) {
      console.error('Print error:', error);
      throw new Error(`Failed to print receipt: ${error}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.printer?.device?.gatt?.connected) {
      await this.printer.device.gatt.disconnect();
    }
    this.printer = null;
  }
  
  isConnected(): boolean {
    return this.printer?.connected && this.printer?.device?.gatt?.connected || false;
  }
  
  getConnectedPrinter(): BluetoothDevice | null {
    return this.printer?.device || null;
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterManager();