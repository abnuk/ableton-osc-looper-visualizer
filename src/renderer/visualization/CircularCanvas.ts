import { LooperState } from '../../shared/types/LooperState';

export interface CircularCanvasConfig {
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
}

export class CircularCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  // Colors for different states
  private readonly colors = {
    [LooperState.EMPTY]: '#666666',
    [LooperState.STOPPED]: '#666666',
    [LooperState.ARMED_RECORDING]: '#ff4444',
    [LooperState.RECORDING]: '#ff4444',
    [LooperState.ARMED_STOPPING]: '#ff8844',
    [LooperState.PLAYING]: '#44ff44',
    [LooperState.ARMED_OVERDUB]: '#ffcc00',
    [LooperState.OVERDUBBING]: '#ffcc00',
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    // Set canvas size to match display size
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
  }

  public render(state: LooperState, timestamp: DOMHighResTimeStamp): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate canvas dimensions
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const size = Math.min(width, height);
    const radius = (size * 0.35);

    const config: CircularCanvasConfig = {
      centerX: width / 2,
      centerY: height / 2,
      radius,
      lineWidth: size * 0.08,
    };

    // Render based on state
    this.renderBackgroundCircle(config);
    this.renderPulsingGlow(config, state, timestamp); // Pulsing glow effect
    this.renderStateCircle(config, state); // Main state circle
    this.renderCenterIcon(config, state);
  }

  private renderBackgroundCircle(config: CircularCanvasConfig): void {
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, config.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = config.lineWidth;
    this.ctx.stroke();
  }

  private renderPulsingGlow(
    config: CircularCanvasConfig,
    state: LooperState,
    timestamp: number
  ): void {
    // Add very subtle pulsing glow for RECORDING and PLAYING states
    if (
      state === LooperState.RECORDING ||
      state === LooperState.PLAYING ||
      state === LooperState.OVERDUBBING
    ) {
      const color = this.colors[state] || '#666666';
      const pulseSpeed = 1.0; // Hz - slow gentle pulse
      const pulse = Math.sin(timestamp * 0.001 * Math.PI * 2 * pulseSpeed);
      const glowAlpha = 0.05 + (pulse * 0.08); // Very subtle glow (0.05 to 0.13)
      const glowRadius = config.radius + config.lineWidth * 0.6;

      // Render outer glow
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, glowRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.withAlpha(color, glowAlpha);
      this.ctx.lineWidth = config.lineWidth * 1.2;
      this.ctx.stroke();
    }
  }

  private renderStateCircle(
    config: CircularCanvasConfig,
    state: LooperState
  ): void {
    let color = this.colors[state];

    // Fallback color if state is not mapped
    if (!color) {
      console.warn(`⚠️ No color defined for state: ${LooperState[state]} (${state}), using default gray`);
      color = '#666666';
    }

    // Render main circle based on state
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, config.radius, 0, Math.PI * 2);
    
    if (state === LooperState.STOPPED || state === LooperState.EMPTY) {
      // Dim circle for stopped/empty
      this.ctx.strokeStyle = this.withAlpha(color, 0.4);
      this.ctx.lineWidth = config.lineWidth * 0.6;
    } else {
      // Full brightness for active states
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = config.lineWidth;
    }
    
    this.ctx.stroke();
  }


  private renderCenterIcon(config: CircularCanvasConfig, state: LooperState): void {
    const iconSize = config.radius * 0.4;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;

    if (state === LooperState.PLAYING) {
      // Play triangle
      this.ctx.beginPath();
      this.ctx.moveTo(config.centerX - iconSize * 0.3, config.centerY - iconSize * 0.5);
      this.ctx.lineTo(config.centerX - iconSize * 0.3, config.centerY + iconSize * 0.5);
      this.ctx.lineTo(config.centerX + iconSize * 0.5, config.centerY);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (state === LooperState.RECORDING || state === LooperState.ARMED_RECORDING) {
      // Record circle
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fill();
    } else if (state === LooperState.OVERDUBBING || state === LooperState.ARMED_OVERDUB) {
      // Overdub double circle
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.4, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.25, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fill();
    } else if (state === LooperState.STOPPED || state === LooperState.ARMED_STOPPING) {
      // Stop square
      const squareSize = iconSize * 0.6;
      this.ctx.fillRect(
        config.centerX - squareSize / 2,
        config.centerY - squareSize / 2,
        squareSize,
        squareSize
      );
    }
  }

  private withAlpha(color: string, alpha: number): string {
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  public resize(): void {
    this.setupCanvas();
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

