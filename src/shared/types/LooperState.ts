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
  trackColor: number; // Ableton track color (integer)
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

// Import unified state types
import { MonitoredItemState, MonitoredItemType, LooperItemInfo } from './MonitoredItem';

// Convert LooperState to MonitoredItemState
export function looperStateToMonitoredState(looperState: LooperState): MonitoredItemState {
  switch (looperState) {
    case LooperState.EMPTY:
      return MonitoredItemState.EMPTY;
    case LooperState.STOPPED:
      return MonitoredItemState.STOPPED;
    case LooperState.ARMED_RECORDING:
      return MonitoredItemState.ARMED_RECORDING;
    case LooperState.RECORDING:
      return MonitoredItemState.RECORDING;
    case LooperState.ARMED_STOPPING:
      return MonitoredItemState.ARMED_STOPPING;
    case LooperState.PLAYING:
      return MonitoredItemState.PLAYING;
    case LooperState.ARMED_OVERDUB:
      return MonitoredItemState.ARMED_OVERDUB;
    case LooperState.OVERDUBBING:
      return MonitoredItemState.OVERDUBBING;
    default:
      return MonitoredItemState.STOPPED;
  }
}

// Convert MonitoredItemState to LooperState
export function monitoredStateToLooperState(monitoredState: MonitoredItemState): LooperState {
  switch (monitoredState) {
    case MonitoredItemState.EMPTY:
      return LooperState.EMPTY;
    case MonitoredItemState.STOPPED:
      return LooperState.STOPPED;
    case MonitoredItemState.ARMED_RECORDING:
      return LooperState.ARMED_RECORDING;
    case MonitoredItemState.RECORDING:
      return LooperState.RECORDING;
    case MonitoredItemState.ARMED_STOPPING:
      return LooperState.ARMED_STOPPING;
    case MonitoredItemState.PLAYING:
      return LooperState.PLAYING;
    case MonitoredItemState.ARMED_OVERDUB:
      return LooperState.ARMED_OVERDUB;
    case MonitoredItemState.OVERDUBBING:
      return LooperState.OVERDUBBING;
    default:
      return LooperState.STOPPED;
  }
}

// Convert LooperInfo to MonitoredItemInfo
export function looperInfoToMonitoredItem(looperInfo: LooperInfo): LooperItemInfo {
  return {
    type: MonitoredItemType.LOOPER,
    trackIndex: looperInfo.trackIndex,
    deviceIndex: looperInfo.deviceIndex,
    trackName: looperInfo.trackName,
    trackColor: looperInfo.trackColor,
    id: looperInfo.id,
    displayName: looperInfo.trackName,
  };
}

