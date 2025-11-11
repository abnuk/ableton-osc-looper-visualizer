// Unified types for both Looper and Clip monitoring

export enum MonitoredItemType {
  LOOPER = 'LOOPER',
  CLIP = 'CLIP',
}

// Unified state enum covering both loopers and clips
export enum MonitoredItemState {
  EMPTY = 'EMPTY',
  STOPPED = 'STOPPED',
  ARMED_RECORDING = 'ARMED_RECORDING',
  RECORDING = 'RECORDING',
  ARMED_STOPPING = 'ARMED_STOPPING',
  PLAYING = 'PLAYING',
  ARMED_OVERDUB = 'ARMED_OVERDUB',
  OVERDUBBING = 'OVERDUBBING',
}

// Base interface for monitored items (looper or clip)
export interface MonitoredItemInfo {
  type: MonitoredItemType;
  trackIndex: number;
  trackName: string;
  trackColor: number;
  id: string; // Unique identifier
  displayName: string; // Human-readable name for display
}

// Extended for loopers
export interface LooperItemInfo extends MonitoredItemInfo {
  type: MonitoredItemType.LOOPER;
  deviceIndex: number;
}

// Extended for clips
export interface ClipItemInfo extends MonitoredItemInfo {
  type: MonitoredItemType.CLIP;
  clipIndex: number; // Scene index
}

// State data sent to visualization windows
export interface MonitoredItemStateData {
  itemId: string;
  type: MonitoredItemType;
  state: MonitoredItemState;
  position: number; // 0.0 to 1.0 (for clips with playback position, or loopers if available)
  length: number; // In beats
  hasPosition: boolean; // Whether position data is available/relevant
}

