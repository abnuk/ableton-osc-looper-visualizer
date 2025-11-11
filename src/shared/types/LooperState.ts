export enum LooperState {
  EMPTY = 'EMPTY',
  STOPPED = 'STOPPED',
  ARMED_RECORDING = 'ARMED_RECORDING',
  RECORDING = 'RECORDING',
  ARMED_STOPPING = 'ARMED_STOPPING',
  PLAYING = 'PLAYING',
  ARMED_OVERDUB = 'ARMED_OVERDUB',
  OVERDUBBING = 'OVERDUBBING',
}

export interface LooperInfo {
  trackIndex: number;
  deviceIndex: number;
  trackName: string;
  id: string; // Unique identifier: `${trackIndex}-${deviceIndex}`
}

export interface LooperStateData {
  looperId: string;
  state: LooperState;
  position: number; // 0.0 to 1.0
  loopLength: number; // In beats
  isQuantized: boolean;
}

export interface LooperParameters {
  stateParam: number;
  positionParam: number;
  lengthParam: number;
  // Additional parameters will be mapped during research phase
}

