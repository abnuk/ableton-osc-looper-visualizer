import { OSCClient } from './OSCClient';
import { OSCCommandBuilder } from './OSCCommandBuilder';
import { OSCResponse } from '../../shared/types/OSCMessage';
import { OSCLogger } from '../utils/OSCLogger';

export class OSCMessageHandler {
  private client: OSCClient;
  private commandBuilder: OSCCommandBuilder;
  private messageHandlers: Map<string, (response: OSCResponse) => void> = new Map();
  private oscLogger: OSCLogger | null = null;

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

  /**
   * Enable OSC event logging to file
   */
  public enableLogging(): void {
    if (!this.oscLogger) {
      this.oscLogger = new OSCLogger();
      this.oscLogger.start();
      console.log('📝 OSC logging enabled. File:', this.oscLogger.getLogFilePath());
    }
  }

  /**
   * Disable OSC event logging
   */
  public disableLogging(): void {
    if (this.oscLogger) {
      this.oscLogger.stop();
      this.oscLogger = null;
    }
  }

  /**
   * Get the current log file path
   */
  public getLogFilePath(): string | null {
    return this.oscLogger ? this.oscLogger.getLogFilePath() : null;
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

    this.client.on('send', (message: any) => {
      console.log('OSC Message sent:', message.address, message.args);
      
      // Log to file if logging is enabled
      if (this.oscLogger) {
        this.oscLogger.logMessage(message.address, message.args, 'SEND');
      }
    });

    this.client.on('message', (response: OSCResponse) => {
      console.log('OSC Message received:', response.address, response.args);
      
      // Log to file if logging is enabled
      if (this.oscLogger) {
        this.oscLogger.logMessage(response.address, response.args, 'RECEIVE');
      }
    });
  }
}

