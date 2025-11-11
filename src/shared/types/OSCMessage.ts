export interface OSCMessage {
  address: string;
  args: OSCArgument[];
}

export type OSCArgument = number | string | boolean | null;

export interface OSCResponse {
  address: string;
  args: OSCArgument[];
  timestamp: number;
}

