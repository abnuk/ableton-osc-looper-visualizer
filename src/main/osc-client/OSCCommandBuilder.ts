import { OSCClient } from './OSCClient';
import { OSCCommands } from '../../shared/constants/OSCCommands';
import { OSCResponse } from '../../shared/types/OSCMessage';

export class OSCCommandBuilder {
  constructor(private client: OSCClient) {}

  // Test connection
  public async testConnection(): Promise<boolean> {
    console.log('🧪 Testing OSC connection...');
    try {
      console.log('📤 Sending /live/test message...');
      const response = await this.client.sendAndWaitForResponse(
        OSCCommands.TEST,
        OSCCommands.TEST,
        3000
      );
      console.log('✅ Received response:', response);
      return true;
    } catch (error) {
      console.error('❌ Test connection failed:', error);
      return false;
    }
  }

  // Get number of tracks
  public async getNumTracks(): Promise<number> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_NUM_TRACKS,
      OSCCommands.GET_NUM_TRACKS,
      5000
    );
    return response.args[0] as number;
  }

  // Get track name
  public async getTrackName(trackIndex: number): Promise<string> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_TRACK_NAME,
      OSCCommands.GET_TRACK_NAME,
      5000,
      trackIndex
    );
    return response.args[1] as string;
  }

  // Get device class names for a track
  public async getDeviceClassNames(trackIndex: number): Promise<string[]> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_DEVICE_CLASS_NAMES,
      OSCCommands.GET_DEVICE_CLASS_NAMES,
      5000,
      trackIndex
    );
    // Response format: [trackIndex, className1, className2, ...]
    return response.args.slice(1) as string[];
  }

  // Get device name
  public async getDeviceName(trackIndex: number, deviceIndex: number): Promise<string> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_DEVICE_NAME,
      OSCCommands.GET_DEVICE_NAME,
      5000,
      trackIndex,
      deviceIndex
    );
    return response.args[2] as string;
  }

  // Get all parameter names for a device
  public async getParameterNames(trackIndex: number, deviceIndex: number): Promise<string[]> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_PARAMETERS_NAME,
      OSCCommands.GET_PARAMETERS_NAME,
      5000,
      trackIndex,
      deviceIndex
    );
    // Response format: [trackIndex, deviceIndex, param1, param2, ...]
    return response.args.slice(2) as string[];
  }

  // Get all parameter values for a device
  public async getParameterValues(trackIndex: number, deviceIndex: number): Promise<number[]> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_PARAMETERS_VALUE,
      OSCCommands.GET_PARAMETERS_VALUE,
      5000,
      trackIndex,
      deviceIndex
    );
    // Response format: [trackIndex, deviceIndex, value1, value2, ...]
    return response.args.slice(2) as number[];
  }

  // Get single parameter value
  public async getParameterValue(
    trackIndex: number,
    deviceIndex: number,
    parameterIndex: number
  ): Promise<number> {
    const response = await this.client.sendAndWaitForResponse(
      OSCCommands.GET_PARAMETER_VALUE,
      OSCCommands.GET_PARAMETER_VALUE,
      5000,
      trackIndex,
      deviceIndex,
      parameterIndex
    );
    // Response format: [trackIndex, deviceIndex, parameterIndex, value]
    return response.args[3] as number;
  }

  // Set parameter value
  public setParameterValue(
    trackIndex: number,
    deviceIndex: number,
    parameterIndex: number,
    value: number
  ): void {
    this.client.send(
      OSCCommands.SET_PARAMETER_VALUE,
      trackIndex,
      deviceIndex,
      parameterIndex,
      value
    );
  }

  // Start listening to parameter changes
  public startListenParameter(
    trackIndex: number,
    deviceIndex: number,
    parameterIndex: number,
    callback: (value: number | string) => void
  ): void {
    const listenAddress = OSCCommands.GET_PARAMETER_VALUE;
    const listenAddressString = '/live/device/get/parameter/value_string';
    
    const listener = (response: OSCResponse) => {
      // Check if this response is for our specific parameter
      if (
        response.args[0] === trackIndex &&
        response.args[1] === deviceIndex &&
        response.args[2] === parameterIndex
      ) {
        const value = response.args[3] as number | string;
        console.log(`✅ Matched parameter ${parameterIndex}! value: ${value} (type: ${typeof value})`);
        callback(value);
      }
    };

    // Listen for both numeric and string values
    console.log(`📡 Setting up listeners for parameter ${parameterIndex} on track ${trackIndex}, device ${deviceIndex}`);
    this.client.addOSCListener(listenAddress, listener);
    this.client.addOSCListener(listenAddressString, listener);
    
    // Send the start listen command
    console.log(`📤 Sending START_LISTEN command for parameter ${parameterIndex}`);
    this.client.send(
      OSCCommands.START_LISTEN_PARAMETER,
      trackIndex,
      deviceIndex,
      parameterIndex
    );
  }

  // Stop listening to parameter changes
  public stopListenParameter(
    trackIndex: number,
    deviceIndex: number,
    parameterIndex: number
  ): void {
    this.client.send(
      OSCCommands.STOP_LISTEN_PARAMETER,
      trackIndex,
      deviceIndex,
      parameterIndex
    );
    
    // Note: We don't remove the listener here because it's filtered by parameters
    // In a production app, we'd want better listener management
  }
}

