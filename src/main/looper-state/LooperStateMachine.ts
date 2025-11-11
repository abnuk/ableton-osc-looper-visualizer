import { LooperState, LooperStateData, looperStateToMonitoredState } from '../../shared/types/LooperState';
import { BaseStateMachine } from '../state-management/BaseStateMachine';

export class LooperStateMachine extends BaseStateMachine {
  private looperState: LooperState = LooperState.EMPTY;
  private isQuantized: boolean = true;

  // Common parameter names found in Ableton Looper
  // These will be discovered during the research phase

  public updateFromParameters(params: { [key: string]: number | string }): boolean {
    let changed = false;

    // Log all parameters for debugging (but only occasionally to avoid spam)
    if (Math.random() < 0.1) { // 10% of updates
      console.log('🔍 Current Looper parameters:', JSON.stringify(params, null, 2));
    }

    // Try to detect state from various parameter combinations
    const newLooperState = this.detectLooperState(params);
    if (newLooperState !== this.looperState) {
      console.log(`🎯 State changed: ${LooperState[this.looperState]} -> ${LooperState[newLooperState]}`);
      this.looperState = newLooperState;
      // Update the base class state
      this.currentState = looperStateToMonitoredState(newLooperState);
      changed = true;
    }

    // Update position if available
    if ('Song Pos' in params) {
      const newPosition = params['Song Pos'];
      if (typeof newPosition === 'number' && Math.abs(newPosition - this.position) > 0.01) { // Only update if changed significantly
        this.position = newPosition;
        changed = true;
      }
    }

    // Update loop length if available
    if ('Length' in params) {
      const newLength = params['Length'];
      if (typeof newLength === 'number' && Math.abs(newLength - this.length) > 0.01) {
        this.length = newLength;
        changed = true;
      }
    }

    return changed;
  }

  /**
   * Implementation of abstract updateState method
   */
  public updateState(params: { [key: string]: number | string }): boolean {
    return this.updateFromParameters(params);
  }

  private detectLooperState(params: { [key: string]: number | string }): LooperState {
    // Simplified state detection based on what Looper actually provides
    // No ARMED states - Looper doesn't expose this information
    // No EMPTY vs STOPPED distinction - we don't know if loop has content

    // Check if we have an explicit state parameter (can be number or string)
    if ('State' in params) {
      const state = params['State'];
      console.log(`📊 State parameter value: ${state} (type: ${typeof state})`);

      // If state is a string (from value_string), map directly
      if (typeof state === 'string') {
        const stateStr = state.toLowerCase();
        console.log(`📝 State string: "${stateStr}"`);

        if (stateStr === 'stop' || stateStr === 'stopped') {
          return LooperState.STOPPED;
        }
        if (stateStr === 'record' || stateStr === 'recording') {
          return LooperState.RECORDING;
        }
        if (stateStr === 'play' || stateStr === 'playing') {
          return LooperState.PLAYING;
        }
        if (stateStr === 'overdub' || stateStr === 'overdubbing') {
          return LooperState.OVERDUBBING;
        }
        // Add other string states as needed
        console.warn(`⚠️ Unknown state string: "${stateStr}"`);
      }

      // If state is numeric, map numeric values (no armed states)
      if (typeof state === 'number') {
        console.log(`🔢 State number: ${state}`);

        if (state === 0) return LooperState.STOPPED;
        if (state === 1) return LooperState.RECORDING;
        if (state === 2) return LooperState.PLAYING;
        if (state === 3) return LooperState.OVERDUBBING;
      }
    }

    // Fallback: assume stopped if we can't determine state
    return LooperState.STOPPED;
  }

  public getLooperState(): LooperState {
    return this.looperState;
  }

  public getStateData(): Partial<LooperStateData> {
    return {
      state: this.looperState,
      position: this.position,
      loopLength: this.length,
      isQuantized: this.isQuantized,
    };
  }

  public updatePosition(position: number): void {
    this.position = position;
  }

  public updateLoopLength(length: number): void {
    this.length = length;
  }

  public setLooperState(state: LooperState): void {
    this.looperState = state;
    this.currentState = looperStateToMonitoredState(state);
  }
}

