import { OSCClient } from './OSCClient';
import { OSCCommandBuilder } from './OSCCommandBuilder';
import { OSCResponse } from '../../shared/types/OSCMessage';

export class OSCMessageHandler {
  private client: OSCClient;
  private commandBuilder: OSCCommandBuilder;
  private messageHandlers: Map<string, (response: OSCResponse) => void> = new Map();

  constructor() {
    this.client = new OSCClient();
    this.commandBuilder = new OSCCommandBuilder(this.client);
    this.setupEventHandlers();
  }

  public getClient(): OSCClient {
    return this.client;
  }

  public getCommandBuilder(): OSCCommandBuilder {
    return this.commandBuilder;
  }

  public async connect(hostname: string, sendPort: number, receivePort: number): Promise<void> {
    await this.client.connect({ hostname, sendPort, receivePort });
  }

  public async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  public isConnected(): boolean {
    return this.client.getConnectionStatus();
  }

  public registerMessageHandler(address: string, handler: (response: OSCResponse) => void): void {
    this.messageHandlers.set(address, handler);
    this.client.addOSCListener(address, handler);
  }

  public unregisterMessageHandler(address: string): void {
    const handler = this.messageHandlers.get(address);
    if (handler) {
      this.client.removeOSCListener(address, handler);
      this.messageHandlers.delete(address);
    }
  }

  private setupEventHandlers(): void {
    this.client.on('connected', () => {
      console.log('OSC Client connected');
    });

    this.client.on('disconnected', () => {
      console.log('OSC Client disconnected');
    });

    this.client.on('error', (error: Error) => {
      console.error('OSC Client error:', error);
    });

    this.client.on('message', (response: OSCResponse) => {
      console.log('OSC Message received:', response.address, response.args);
    });
  }
}

