import { LooperState } from '../../shared/types/LooperState';
import { MonitoredItemState } from '../../shared/types/MonitoredItem';

export interface CircularCanvasConfig {
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
}

export interface RenderOptions {
  position?: number; // 0.0 to 1.0 for clip progress
  hasPosition: boolean; // Whether to show position-based progress
}

export class CircularCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  // Colors for different states (unified for both loopers and clips)
  private readonly colors = {
    [MonitoredItemState.EMPTY]: '#999999', // Lighter gray for empty state
    [MonitoredItemState.STOPPED]: '#666666',
    [MonitoredItemState.ARMED_RECORDING]: '#ff4444',
    [MonitoredItemState.RECORDING]: '#ff4444',
    [MonitoredItemState.ARMED_STOPPING]: '#ff8844',
    [MonitoredItemState.PLAYING]: '#44ff44',
    [MonitoredItemState.ARMED_OVERDUB]: '#ffcc00',
    [MonitoredItemState.OVERDUBBING]: '#ffcc00',
  };

  // Backward compatibility: map LooperState to MonitoredItemState
  private readonly looperStateMap: { [key in LooperState]: MonitoredItemState } = {
    [LooperState.EMPTY]: MonitoredItemState.EMPTY,
    [LooperState.STOPPED]: MonitoredItemState.STOPPED,
    [LooperState.ARMED_RECORDING]: MonitoredItemState.ARMED_RECORDING,
    [LooperState.RECORDING]: MonitoredItemState.RECORDING,
    [LooperState.ARMED_STOPPING]: MonitoredItemState.ARMED_STOPPING,
    [LooperState.PLAYING]: MonitoredItemState.PLAYING,
    [LooperState.ARMED_OVERDUB]: MonitoredItemState.ARMED_OVERDUB,
    [LooperState.OVERDUBBING]: MonitoredItemState.OVERDUBBING,
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

  // Main render method (supports both looper and unified states)
  public render(
    state: LooperState | MonitoredItemState,
    timestamp: DOMHighResTimeStamp,
    options: RenderOptions = { hasPosition: false }
  ): void {
    // Convert LooperState to MonitoredItemState if needed
    const unifiedState = typeof state === 'string' && state in this.looperStateMap
      ? this.looperStateMap[state as LooperState]
      : state as MonitoredItemState;

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

    // Render based on state (order matters - last rendered is on top)
    this.renderBackgroundCircle(config);
    
    // Render glow BEFORE progress fill so it's underneath
    this.renderPulsingGlow(config, unifiedState, timestamp);
    
    // Render position-based progress fill for clips if applicable
    if (options.hasPosition && options.position !== undefined && unifiedState === MonitoredItemState.PLAYING) {
      this.renderProgressFill(config, options.position);
    }
    
    // For clips with position, don't render the full state circle (it would cover the progress)
    if (!options.hasPosition || unifiedState !== MonitoredItemState.PLAYING) {
      this.renderStateCircle(config, unifiedState); // Main state circle
    }
    
    this.renderCenterIcon(config, unifiedState);
  }

  private renderBackgroundCircle(config: CircularCanvasConfig): void {
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, config.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = config.lineWidth;
    this.ctx.stroke();
  }

  /**
   * Render position-based progress fill for clips
   * Position 0.0 = starting, 1.0 = completed full cycle
   */
  private renderProgressFill(config: CircularCanvasConfig, position: number): void {
    // Normalize position to 0-1 range
    const normalizedPosition = position % 1.0;
    
    // Start angle at top (12 o'clock = -90 degrees = -PI/2)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (normalizedPosition * 2 * Math.PI);

    // Draw remaining portion (dark murky green) first so it's behind
    if (normalizedPosition < 1.0) {
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, config.radius, endAngle, startAngle + Math.PI * 2);
      this.ctx.strokeStyle = '#2d4a2d'; // Dark murky green for remaining (not yet played)
      this.ctx.lineWidth = config.lineWidth;
      this.ctx.stroke();
    }

    // Draw completed portion (bright green) on top
    if (normalizedPosition > 0) {
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, config.radius, startAngle, endAngle);
      this.ctx.strokeStyle = '#00ff00'; // Bright green for completed (already played)
      this.ctx.lineWidth = config.lineWidth;
      this.ctx.stroke();
    }
  }

  private renderPulsingGlow(
    config: CircularCanvasConfig,
    state: MonitoredItemState,
    timestamp: number
  ): void {
    // Add very subtle pulsing glow for RECORDING and PLAYING states
    if (
      state === MonitoredItemState.RECORDING ||
      state === MonitoredItemState.PLAYING ||
      state === MonitoredItemState.OVERDUBBING
    ) {
      const color = this.colors[state] || '#666666';
      const pulseSpeed = 1.0; // Hz - slow gentle pulse
      const pulse = Math.sin(timestamp * 0.001 * Math.PI * 2 * pulseSpeed);
      const glowAlpha = 0.05 + (pulse * 0.08); // Very subtle glow (0.05 to 0.13)
      
      // Glow should extend beyond the main circle
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
    state: MonitoredItemState
  ): void {
    let color = this.colors[state];

    // Fallback color if state is not mapped
    if (!color) {
      console.warn(`⚠️ No color defined for state: ${MonitoredItemState[state]} (${state}), using default gray`);
      color = '#666666';
    }

    // Render main circle based on state
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, config.radius, 0, Math.PI * 2);
    
    if (state === MonitoredItemState.STOPPED || state === MonitoredItemState.EMPTY) {
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

  private renderCenterIcon(config: CircularCanvasConfig, state: MonitoredItemState): void {
    const iconSize = config.radius * 0.4;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;

    if (state === MonitoredItemState.PLAYING) {
      // Play triangle
      this.ctx.beginPath();
      this.ctx.moveTo(config.centerX - iconSize * 0.3, config.centerY - iconSize * 0.5);
      this.ctx.lineTo(config.centerX - iconSize * 0.3, config.centerY + iconSize * 0.5);
      this.ctx.lineTo(config.centerX + iconSize * 0.5, config.centerY);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (state === MonitoredItemState.RECORDING || state === MonitoredItemState.ARMED_RECORDING) {
      // Record circle
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff4444';
      this.ctx.fill();
    } else if (state === MonitoredItemState.OVERDUBBING || state === MonitoredItemState.ARMED_OVERDUB) {
      // Overdub double circle
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.4, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(config.centerX, config.centerY, iconSize * 0.25, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fill();
    } else if (state === MonitoredItemState.STOPPED || state === MonitoredItemState.ARMED_STOPPING) {
      // Stop square
      const squareSize = iconSize * 0.6;
      this.ctx.fillRect(
        config.centerX - squareSize / 2,
        config.centerY - squareSize / 2,
        squareSize,
        squareSize
      );
    }
    // No icon for EMPTY state - just show the lighter gray circle
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

