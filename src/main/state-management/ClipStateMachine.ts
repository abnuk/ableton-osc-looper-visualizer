import { MonitoredItemState } from '../../shared/types/MonitoredItem';
import { BaseStateMachine } from './BaseStateMachine';

interface ClipProperties {
  hasClip: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  position: number;
  length: number;
}

/**
 * State machine for clip monitoring
 * Determines clip state based on OSC properties
 */
export class ClipStateMachine extends BaseStateMachine {
  private clipProperties: Partial<ClipProperties> = {};

  /**
   * Update state based on clip properties
   */
  public updateState(properties: Partial<ClipProperties>): boolean {
    let changed = false;

    // Update stored properties
    if (properties.hasClip !== undefined && properties.hasClip !== this.clipProperties.hasClip) {
      this.clipProperties.hasClip = properties.hasClip;
      changed = true;
    }
    
    if (properties.isPlaying !== undefined && properties.isPlaying !== this.clipProperties.isPlaying) {
      this.clipProperties.isPlaying = properties.isPlaying;
      changed = true;
    }
    
    if (properties.isRecording !== undefined && properties.isRecording !== this.clipProperties.isRecording) {
      this.clipProperties.isRecording = properties.isRecording;
      changed = true;
    }
    
    // Update length first (needed for position calculation)
    if (properties.length !== undefined && Math.abs(properties.length - (this.clipProperties.length || 0)) > 0.01) {
      this.clipProperties.length = properties.length;
      this.length = properties.length;
      changed = true;
    }
    
    // Update position (convert from beats to 0.0-1.0 range)
    if (properties.position !== undefined && Math.abs(properties.position - (this.clipProperties.position || 0)) > 0.001) {
      this.clipProperties.position = properties.position;
      
      // Convert position from beats to normalized 0.0-1.0
      // playing_position is in beats, length is in beats
      if (this.length > 0) {
        this.position = properties.position / this.length;
        // Clamp to 0.0-1.0 range
        this.position = Math.max(0, Math.min(1, this.position));
      } else {
        this.position = 0;
      }
      
      changed = true;
    }

    // Determine state from properties
    const newState = this.determineState();
    if (newState !== this.currentState) {
      this.currentState = newState;
      changed = true;
    }

    return changed;
  }

  /**
   * Determine the current state based on clip properties
   */
  private determineState(): MonitoredItemState {

    // Check if slot is empty (no clip)
    if (this.clipProperties.hasClip === false) {
      return MonitoredItemState.EMPTY;
    }

    // If we have a clip, check its playback state
    // Recording takes priority over playing
    if (this.clipProperties.isRecording) {
      return MonitoredItemState.RECORDING;
    }

    if (this.clipProperties.isPlaying) {
      return MonitoredItemState.PLAYING;
    }

    // Clip exists but is not playing or recording
    return MonitoredItemState.STOPPED;
  }

  /**
   * Get all clip properties
   */
  public getClipProperties(): Partial<ClipProperties> {
    return { ...this.clipProperties };
  }
}

