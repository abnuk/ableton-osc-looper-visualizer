import * as osc from 'osc';
import { OSCMessage, OSCResponse, OSCArgument } from '../../shared/types/OSCMessage';
import { EventEmitter } from 'events';

export interface OSCClientConfig {
  hostname: string;
  sendPort: number;
  receivePort: number;
}

export class OSCClient extends EventEmitter {
  private udpPort: osc.UDPPort | null = null;
  private isConnected: boolean = false;
  private responseCallbacks: Map<string, Array<(response: OSCResponse) => void>> = new Map();
  private oscListeners: Map<string, Array<(response: OSCResponse) => void>> = new Map();

  constructor() {
    super();
  }

  public async connect(config: OSCClientConfig): Promise<void> {
    console.log('🔌 OSCClient.connect() called with:', config);
    if (this.isConnected) {
      console.log('⚠️ Already connected, disconnecting first...');
      await this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Creating UDPPort...');
        this.udpPort = new osc.UDPPort({
          localAddress: '0.0.0.0',
          localPort: config.receivePort,
          remoteAddress: config.hostname,
          remotePort: config.sendPort,
          metadata: true,
        });

        this.udpPort.on('ready', () => {
          console.log('✅ OSC Client ready on port', config.receivePort);
          this.isConnected = true;
          this.emit('connected');
          resolve();
        });

        this.udpPort.on('message', (oscMsg: any) => {
          console.log('📨 OSC message received:', oscMsg.address);
          this.handleMessage(oscMsg);
        });

        this.udpPort.on('error', (err: Error) => {
          console.error('💥 OSC Client error:', err);
          this.emit('error', err);
          reject(err);
        });

        console.log('🔓 Opening UDP port...');
        this.udpPort.open();
      } catch (error) {
        console.error('💥 Failed to create OSC client:', error);
        reject(error);
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.udpPort) {
      return new Promise((resolve) => {
        this.udpPort!.close();
        this.udpPort = null;
        this.isConnected = false;
        this.responseCallbacks.clear();
        this.oscListeners.clear();
        this.emit('disconnected');
        resolve();
      });
    }
  }

  public send(address: string, ...args: OSCArgument[]): void {
    if (!this.isConnected || !this.udpPort) {
      throw new Error('OSC Client not connected');
    }

    const message: OSCMessage = {
      address,
      args,
    };

    this.udpPort.send({
      address: message.address,
      args: message.args.map(arg => ({ type: this.getOSCType(arg), value: arg })),
    });
  }

  public async sendAndWaitForResponse(
    address: string,
    responseAddress: string,
    timeout: number = 5000,
    ...args: OSCArgument[]
  ): Promise<OSCResponse> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeResponseCallback(responseAddress, callback);
        reject(new Error(`OSC request timeout: ${address}`));
      }, timeout);

      const callback = (response: OSCResponse) => {
        clearTimeout(timeoutId);
        this.removeResponseCallback(responseAddress, callback);
        resolve(response);
      };

      this.addResponseCallback(responseAddress, callback);
      this.send(address, ...args);
    });
  }

  public addOSCListener(address: string, callback: (response: OSCResponse) => void): void {
    if (!this.oscListeners.has(address)) {
      this.oscListeners.set(address, []);
    }
    this.oscListeners.get(address)!.push(callback);
  }

  public removeOSCListener(address: string, callback: (response: OSCResponse) => void): void {
    const callbacks = this.oscListeners.get(address);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.oscListeners.delete(address);
      }
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleMessage(oscMsg: any): void {
    const response: OSCResponse = {
      address: oscMsg.address,
      args: oscMsg.args.map((arg: any) => arg.value),
      timestamp: Date.now(),
    };

    // Handle response callbacks (one-time requests)
    const responseCallbacks = this.responseCallbacks.get(response.address);
    if (responseCallbacks && responseCallbacks.length > 0) {
      responseCallbacks.forEach(callback => callback(response));
    }

    // Handle persistent listeners
    const listeners = this.oscListeners.get(response.address);
    if (listeners && listeners.length > 0) {
      listeners.forEach(callback => callback(response));
    }

    // Emit general message event
    this.emit('message', response);
  }

  private addResponseCallback(address: string, callback: (response: OSCResponse) => void): void {
    if (!this.responseCallbacks.has(address)) {
      this.responseCallbacks.set(address, []);
    }
    this.responseCallbacks.get(address)!.push(callback);
  }

  private removeResponseCallback(address: string, callback: (response: OSCResponse) => void): void {
    const callbacks = this.responseCallbacks.get(address);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.responseCallbacks.delete(address);
      }
    }
  }

  private getOSCType(arg: OSCArgument): string {
    if (typeof arg === 'number') {
      return Number.isInteger(arg) ? 'i' : 'f';
    } else if (typeof arg === 'string') {
      return 's';
    } else if (typeof arg === 'boolean') {
      return arg ? 'T' : 'F';
    } else if (arg === null) {
      return 'N';
    }
    return 's'; // Default to string
  }
}

