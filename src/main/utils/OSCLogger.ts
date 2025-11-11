import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * Logger for OSC messages to file
 */
export class OSCLogger {
  private logFilePath: string;
  private stream: fs.WriteStream | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    const logDir = path.join(userDataPath, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = path.join(logDir, `osc-events-${timestamp}.log`);
    
    console.log(`📝 OSC Logger initialized: ${this.logFilePath}`);
  }

  /**
   * Start logging to file
   */
  public start(): void {
    if (this.stream) {
      console.warn('⚠️  OSC Logger already started');
      return;
    }

    this.stream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    this.log('=== OSC EVENT LOG STARTED ===');
    this.log(`Timestamp: ${new Date().toISOString()}`);
    this.log('================================\n');
  }

  /**
   * Log an OSC message
   */
  public logMessage(address: string, args: any[], direction: 'SEND' | 'RECEIVE' = 'RECEIVE'): void {
    if (!this.stream) {
      return;
    }

    const timestamp = new Date().toISOString();
    const argsStr = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return String(arg);
    }).join(', ');

    const directionSymbol = direction === 'SEND' ? '▶️' : '◀️';
    const logLine = `[${timestamp}] ${directionSymbol} ${direction} | ${address} | ${argsStr}\n`;
    this.stream.write(logLine);
  }

  /**
   * Log a text message
   */
  public log(message: string): void {
    if (!this.stream) {
      return;
    }

    const timestamp = new Date().toISOString();
    this.stream.write(`[${timestamp}] ${message}\n`);
  }

  /**
   * Stop logging and close file
   */
  public stop(): void {
    if (!this.stream) {
      return;
    }

    this.log('\n=== OSC EVENT LOG STOPPED ===\n');
    this.stream.end();
    this.stream = null;
    console.log(`📝 OSC Logger stopped. Log saved to: ${this.logFilePath}`);
  }

  /**
   * Get the log file path
   */
  public getLogFilePath(): string {
    return this.logFilePath;
  }
}

