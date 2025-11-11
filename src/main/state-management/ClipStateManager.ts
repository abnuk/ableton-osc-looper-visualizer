import { OSCMessageHandler } from '../osc-client/OSCMessageHandler';
import { VisualizationWindowManager } from '../windows/VisualizationWindowManager';
import { ClipInfo } from '../../shared/types/ClipState';
import { ClipStateMachine } from './ClipStateMachine';
import { MonitoredItemStateData, MonitoredItemType } from '../../shared/types/MonitoredItem';

interface MonitoredClip {
  info: ClipInfo;
  stateMachine: ClipStateMachine;
  lastUpdate: number;
  pendingUpdates: Partial<{
    hasClip: boolean;
    isPlaying: boolean;
    isRecording: boolean;
    position: number;
    length: number;
  }>;
  statePollingInterval?: NodeJS.Timeout; // For polling is_playing/is_recording (100ms)
  positionPollingInterval?: NodeJS.Timeout; // For polling playing_position (25ms)
  isCurrentlyPlaying?: boolean; // Track playing state for position polling
}

/**
 * Manager for clip state monitoring
 * Subscribes to clip OSC properties and updates visualization windows
 */
export class ClipStateManager {
  private monitoredClips: Map<string, MonitoredClip> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_RATE_MS = 50; // 20fps

  constructor(
    private oscHandler: OSCMessageHandler,
    private windowManager: VisualizationWindowManager
  ) {}

  /**
   * Start monitoring a clip
   */
  public async startMonitoring(clip: ClipInfo): Promise<void> {
    console.log(`\n🎬 === Starting monitoring for clip: ${clip.trackName} - Scene ${clip.clipIndex + 1} ===`);
    console.log(`   Clip ID: ${clip.id}`);
    console.log(`   Track: ${clip.trackIndex}, Clip Slot: ${clip.clipIndex}`);
    
    if (this.monitoredClips.has(clip.id)) {
      console.log(`⚠️ Already monitoring clip ${clip.id}`);
      return;
    }

    const stateMachine = new ClipStateMachine();

    const monitoredClip: MonitoredClip = {
      info: clip,
      stateMachine,
      lastUpdate: Date.now(),
      pendingUpdates: {}, // Initialize empty pending updates
    };

    this.monitoredClips.set(clip.id, monitoredClip);

    // Subscribe to clip properties
    console.log('🔔 Subscribing to clip properties...');
    await this.subscribeToClipProperties(clip);

    // Start polling for state properties (is_playing, is_recording)
    this.startStatePolling(monitoredClip);

    // Query initial state
    await this.queryInitialState(clip, stateMachine);

    // Start update loop if not already running
    if (!this.updateInterval) {
      console.log('🔄 Starting update loop...');
      this.startUpdateLoop();
    }

    console.log(`✅ Successfully started monitoring clip: ${clip.trackName} - Scene ${clip.clipIndex + 1}\n`);
  }

  /**
   * Stop monitoring a clip
   */
  public stopMonitoring(clipId: string): void {
    const monitored = this.monitoredClips.get(clipId);
    if (!monitored) {
      return;
    }

    // Stop state polling
    if (monitored.statePollingInterval) {
      clearInterval(monitored.statePollingInterval);
    }
    
    // Stop position polling
    if (monitored.positionPollingInterval) {
      clearInterval(monitored.positionPollingInterval);
    }

    // Unsubscribe from clip properties
    this.unsubscribeFromClipProperties(monitored.info);

    this.monitoredClips.delete(clipId);

    // Stop update loop if no more clips
    if (this.monitoredClips.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log(`Stopped monitoring clip: ${clipId}`);
  }

  /**
   * Stop all clip monitoring
   */
  public stopAllMonitoring(): void {
    for (const clipId of this.monitoredClips.keys()) {
      this.stopMonitoring(clipId);
    }
  }

  /**
   * Get list of monitored clip IDs
   */
  public getMonitoredClips(): string[] {
    return Array.from(this.monitoredClips.keys());
  }

  /**
   * Subscribe to clip property updates via OSC listeners
   */
  private async subscribeToClipProperties(
    clip: ClipInfo
  ): Promise<void> {
    const commandBuilder = this.oscHandler.getCommandBuilder();
    const monitored = this.monitoredClips.get(clip.id);
    
    if (!monitored) {
      console.error(`❌ Cannot subscribe: Clip ${clip.id} not found in monitored clips`);
      return;
    }

    console.log(`📡 Setting up OSC listeners for clip ${clip.trackIndex}:${clip.clipIndex}`);

    // Subscribe to has_clip - this one HAS listener support
    commandBuilder.startListenClipProperty(
      clip.trackIndex,
      clip.clipIndex,
      'has_clip',
      (value: any) => {
        console.log(`📦 RECEIVED has_clip event for clip ${clip.id}: ${value}`);
        monitored.pendingUpdates.hasClip = Boolean(value);
      }
    );

    // NOTE: is_playing, is_recording, and playing_position DON'T have reliable listener support in Live API!
    // They will be polled instead (see startStatePolling)

    console.log(`   ✅ Subscribed to clip properties (listener for has_clip only, rest will be polled)`);
  }

  /**
   * Query initial clip state
   */
  private async queryInitialState(
    clip: ClipInfo,
    stateMachine: ClipStateMachine
  ): Promise<void> {
    const commandBuilder = this.oscHandler.getCommandBuilder();

    try {
      // Check if clip exists
      const hasClip = await commandBuilder.hasClip(clip.trackIndex, clip.clipIndex);
      console.log(`   📋 Initial state: hasClip=${hasClip}`);
      stateMachine.updateState({ hasClip });

      if (hasClip) {
        // Query initial playing state
        const isPlaying = await commandBuilder.getClipIsPlaying(clip.trackIndex, clip.clipIndex);
        console.log(`   📋 Initial state: isPlaying=${isPlaying}`);
        stateMachine.updateState({ isPlaying });

        // Query initial recording state
        const isRecording = await commandBuilder.getClipIsRecording(clip.trackIndex, clip.clipIndex);
        console.log(`   📋 Initial state: isRecording=${isRecording}`);
        stateMachine.updateState({ isRecording });

        // Query clip length
        const length = await commandBuilder.getClipLength(clip.trackIndex, clip.clipIndex);
        console.log(`   📋 Initial state: length=${length}`);
        stateMachine.updateState({ length });

        // Query initial position if playing
        if (isPlaying) {
          const position = await commandBuilder.getClipPlayingPosition(clip.trackIndex, clip.clipIndex);
          console.log(`   📋 Initial state: position=${position}`);
          stateMachine.updateState({ position });
        }
      }

      console.log(`   ✅ Queried initial clip state`);
    } catch (error) {
      console.error(`❌ Failed to query initial state for clip ${clip.id}:`, error);
    }
  }

  /**
   * Start polling for clip state and position
   * - State (is_playing, is_recording): polled every 100ms
   * - Position: polled every 25ms when playing for smooth animation
   */
  private startStatePolling(monitoredClip: MonitoredClip): void {
    const clip = monitoredClip.info;
    const commandBuilder = this.oscHandler.getCommandBuilder();
    
    // Track previous state to detect transitions
    let previousIsPlaying = false;
    let previousIsRecording = false;
    
    // Poll state every 100ms (10 times per second)
    monitoredClip.statePollingInterval = setInterval(async () => {
      try {
        // Only poll if clip exists
        if (monitoredClip.pendingUpdates.hasClip !== false) {
          // Query states in parallel for better performance
          const [isPlaying, isRecording] = await Promise.all([
            commandBuilder.getClipIsPlaying(clip.trackIndex, clip.clipIndex),
            commandBuilder.getClipIsRecording(clip.trackIndex, clip.clipIndex)
          ]);
          
          // Detect state transitions
          const startedPlaying = isPlaying && !previousIsPlaying;
          const stoppedPlaying = !isPlaying && previousIsPlaying;
          const stoppedRecording = !isRecording && previousIsRecording;
          
          // Update length when clip starts playing or stops recording
          if (startedPlaying || stoppedRecording) {
            const length = await commandBuilder.getClipLength(clip.trackIndex, clip.clipIndex);
            monitoredClip.pendingUpdates.length = length;
          }
          
          // Start/stop position polling based on playing state
          if (startedPlaying) {
            this.startPositionPolling(monitoredClip);
          } else if (stoppedPlaying) {
            this.stopPositionPolling(monitoredClip);
          }
          
          monitoredClip.pendingUpdates.isPlaying = isPlaying;
          monitoredClip.pendingUpdates.isRecording = isRecording;
          monitoredClip.isCurrentlyPlaying = isPlaying;
          
          // Update previous state
          previousIsPlaying = isPlaying;
          previousIsRecording = isRecording;
        }
      } catch (error) {
        // Clip might not exist yet, ignore errors
      }
    }, 100); // 100ms = 10 updates per second for state
  }
  
  /**
   * Start high-frequency polling for playing_position (only when playing)
   */
  private startPositionPolling(monitoredClip: MonitoredClip): void {
    // Don't start if already running
    if (monitoredClip.positionPollingInterval) {
      return;
    }
    
    const clip = monitoredClip.info;
    const commandBuilder = this.oscHandler.getCommandBuilder();
    
    // Poll position every 25ms (40 times per second) for smooth animation
    monitoredClip.positionPollingInterval = setInterval(async () => {
      try {
        // Only poll if clip is still playing
        if (monitoredClip.isCurrentlyPlaying) {
          const position = await commandBuilder.getClipPlayingPosition(clip.trackIndex, clip.clipIndex);
          monitoredClip.pendingUpdates.position = position;
        }
      } catch (error) {
        // Ignore errors
      }
    }, 25); // 25ms = 40 updates per second for position
  }
  
  /**
   * Stop position polling
   */
  private stopPositionPolling(monitoredClip: MonitoredClip): void {
    if (monitoredClip.positionPollingInterval) {
      clearInterval(monitoredClip.positionPollingInterval);
      monitoredClip.positionPollingInterval = undefined;
    }
  }

  /**
   * Unsubscribe from clip property updates
   */
  private unsubscribeFromClipProperties(clip: ClipInfo): void {
    // Only unsubscribe if OSC is still connected
    if (!this.oscHandler.isConnected()) {
      return;
    }

    const commandBuilder = this.oscHandler.getCommandBuilder();

    // Only stop listening for properties that have listener support
    commandBuilder.stopListenClipProperty(clip.trackIndex, clip.clipIndex, 'has_clip');
    // NOTE: We don't stop_listen for is_playing/is_recording/playing_position because they're polled, not listened
  }

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.updateVisualizationWindows();
    }, this.UPDATE_RATE_MS);
  }

  /**
   * Update all visualization windows
   */
  private updateVisualizationWindows(): void {
    for (const [clipId, monitored] of this.monitoredClips) {
      // Apply any pending updates to the state machine (batched)
      if (Object.keys(monitored.pendingUpdates).length > 0) {
        monitored.stateMachine.updateState(monitored.pendingUpdates);
        // Clear pending updates after applying
        monitored.pendingUpdates = {};
      }

      const window = this.windowManager.getWindow(clipId);
      if (!window) {
        console.warn(`⚠️ Window not found for clip ${clipId}`);
        continue;
      }

      const stateData: MonitoredItemStateData = {
        itemId: clipId,
        type: MonitoredItemType.CLIP,
        state: monitored.stateMachine.getState(),
        position: monitored.stateMachine.getPosition(),
        length: monitored.stateMachine.getLength(),
        hasPosition: true, // Clips have position data
      };

      // Send state update to the visualization window
      window.webContents.send('item-state-update', stateData);
    }
  }
}

