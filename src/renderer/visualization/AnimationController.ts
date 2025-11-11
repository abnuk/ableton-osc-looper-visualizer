import { LooperState } from '../../shared/types/LooperState';

export class AnimationController {
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private callback: (timestamp: number) => void;

  constructor(callback: (timestamp: number) => void) {
    this.callback = callback;
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) {
      return;
    }

    const timestamp = performance.now();
    this.callback(timestamp);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  public isAnimating(): boolean {
    return this.isRunning;
  }
}

export function shouldPulse(state: LooperState): boolean {
  return (
    state === LooperState.ARMED_RECORDING ||
    state === LooperState.ARMED_STOPPING ||
    state === LooperState.ARMED_OVERDUB
  );
}

export function shouldAnimate(state: LooperState): boolean {
  return (
    state === LooperState.PLAYING ||
    state === LooperState.RECORDING ||
    state === LooperState.OVERDUBBING ||
    shouldPulse(state)
  );
}

