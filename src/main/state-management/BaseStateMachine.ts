import { MonitoredItemState } from '../../shared/types/MonitoredItem';

/**
 * Abstract base class for state machines
 * Provides common state management logic for both loopers and clips
 */
export abstract class BaseStateMachine {
  protected currentState: MonitoredItemState = MonitoredItemState.EMPTY;
  protected position: number = 0;
  protected length: number = 0;

  /**
   * Abstract method to update state based on incoming data
   * Must be implemented by subclasses
   */
  public abstract updateState(data: any): boolean;

  /**
   * Get the current state
   */
  public getState(): MonitoredItemState {
    return this.currentState;
  }

  /**
   * Get the current position (0.0 to 1.0)
   */
  public getPosition(): number {
    return this.position;
  }

  /**
   * Get the current length (in beats or seconds)
   */
  public getLength(): number {
    return this.length;
  }

  /**
   * Set the state (protected, for subclass use)
   */
  protected setState(state: MonitoredItemState): void {
    this.currentState = state;
  }

  /**
   * Set the position (protected, for subclass use)
   */
  protected setPosition(position: number): void {
    this.position = position;
  }

  /**
   * Set the length (protected, for subclass use)
   */
  protected setLength(length: number): void {
    this.length = length;
  }
}

