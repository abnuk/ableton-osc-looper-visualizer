declare module 'osc' {
  export interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    broadcast?: boolean;
    multicastTTL?: number;
    multicastMembership?: string[];
    metadata?: boolean;
  }

  export interface OSCMessage {
    address: string;
    args: Array<{
      type: string;
      value: any;
    }>;
  }

  export class UDPPort {
    constructor(options: UDPPortOptions);
    open(): void;
    close(): void;
    send(message: OSCMessage | any): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }
}

