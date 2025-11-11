import { OSCMessageHandler } from '../osc-client/OSCMessageHandler';
import { VisualizationWindowManager } from '../windows/VisualizationWindowManager';
import { LooperInfo, LooperStateData } from '../../shared/types/LooperState';
import { LooperParameterMapper } from '../looper-discovery/LooperParameterMapper';
import { LooperStateMachine } from './LooperStateMachine';

interface MonitoredLooper {
  info: LooperInfo;
  stateMachine: LooperStateMachine;
  parameterIndices: number[];
  currentParameters: { [key: string]: number | string }; // Track all current parameter values (can be number or string)
  lastUpdate: number;
}

export class LooperStateManager {
  private monitoredLoopers: Map<string, MonitoredLooper> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_RATE_MS = 50; // 20fps

  constructor(
    private oscHandler: OSCMessageHandler,
    private windowManager: VisualizationWindowManager
  ) {}

  public async startMonitoring(
    looper: LooperInfo,
    parameterMapper: LooperParameterMapper
  ): Promise<void> {
    console.log(`\n🎬 === Starting monitoring for looper: ${looper.trackName} ===`);
    console.log(`   Looper ID: ${looper.id}`);
    console.log(`   Track: ${looper.trackIndex}, Device: ${looper.deviceIndex}`);
    
    if (this.monitoredLoopers.has(looper.id)) {
      console.log(`⚠️ Already monitoring looper ${looper.id}`);
      return;
    }

    const parameterMappings = parameterMapper.getParameterMappings(looper.id);
    if (!parameterMappings) {
      console.error(`❌ No parameter mappings found for looper ${looper.id}`);
      return;
    }

    console.log(`📋 Found ${Object.keys(parameterMappings).length} parameter mappings`);
    console.log(`   Parameters:`, Object.keys(parameterMappings));

    const stateMachine = new LooperStateMachine();
    const parameterIndices = Object.values(parameterMappings);

    const monitoredLooper: MonitoredLooper = {
      info: looper,
      stateMachine,
      parameterIndices,
      currentParameters: {}, // Initialize empty parameters
      lastUpdate: Date.now(),
    };

    this.monitoredLoopers.set(looper.id, monitoredLooper);

    // Subscribe to parameter changes
    console.log('🔔 Subscribing to parameter changes...');
    await this.subscribeToParameters(looper, parameterMappings);

    // Start update loop if not already running
    if (!this.updateInterval) {
      console.log('🔄 Starting update loop...');
      this.startUpdateLoop();
    }

    console.log(`✅ Successfully started monitoring looper: ${looper.trackName}\n`);
  }

  public stopMonitoring(looperId: string): void {
    const monitored = this.monitoredLoopers.get(looperId);
    if (!monitored) {
      return;
    }

    // Unsubscribe from parameters
    this.unsubscribeFromParameters(monitored.info, monitored.parameterIndices);

    this.monitoredLoopers.delete(looperId);

    // Stop update loop if no more loopers
    if (this.monitoredLoopers.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log(`Stopped monitoring looper: ${looperId}`);
  }

  public stopAllMonitoring(): void {
    for (const looperId of this.monitoredLoopers.keys()) {
      this.stopMonitoring(looperId);
    }
  }

  private async subscribeToParameters(
    looper: LooperInfo,
    parameterMappings: { [key: string]: number }
  ): Promise<void> {
    const commandBuilder = this.oscHandler.getCommandBuilder();

    console.log(`   Subscribing to ${Object.keys(parameterMappings).length} parameters...`);

    // Subscribe to each parameter
    for (const [paramName, paramIndex] of Object.entries(parameterMappings)) {
      console.log(`      - "${paramName}" (index ${paramIndex})`);
      commandBuilder.startListenParameter(
        looper.trackIndex,
        looper.deviceIndex,
        paramIndex,
        (value: number | string) => {
          this.handleParameterUpdate(looper.id, paramName, value);
        }
      );
    }
    
    console.log(`   ✅ Subscribed to all parameters`);
  }

  private unsubscribeFromParameters(
    looper: LooperInfo,
    parameterIndices: number[]
  ): void {
    const commandBuilder = this.oscHandler.getCommandBuilder();

    for (const paramIndex of parameterIndices) {
      commandBuilder.stopListenParameter(
        looper.trackIndex,
        looper.deviceIndex,
        paramIndex
      );
    }
  }

  private handleParameterUpdate(
    looperId: string,
    paramName: string,
    value: number | string
  ): void {
    const monitored = this.monitoredLoopers.get(looperId);
    if (!monitored) {
      return;
    }

    // Update the current parameter value
    monitored.currentParameters[paramName] = value;
    
    console.log(`📊 Parameter update: ${paramName} = ${value} (type: ${typeof value})`);

    // Update the state machine with ALL current parameters
    const changed = monitored.stateMachine.updateFromParameters(monitored.currentParameters);

    if (changed) {
      monitored.lastUpdate = Date.now();
    }
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.updateVisualizationWindows();
    }, this.UPDATE_RATE_MS);
  }

  private updateVisualizationWindows(): void {
    for (const [looperId, monitored] of this.monitoredLoopers) {
      const window = this.windowManager.getWindow(looperId);
      if (!window) {
        console.warn(`⚠️ Window not found for looper ${looperId}`);
        continue;
      }

      const stateData: LooperStateData = {
        looperId,
        state: monitored.stateMachine.getLooperState(),
        position: monitored.stateMachine.getStateData().position || 0,
        loopLength: monitored.stateMachine.getStateData().loopLength || 0,
        isQuantized: monitored.stateMachine.getStateData().isQuantized || true,
      };

      // Send state update to the visualization window
      window.webContents.send('looper-state-update', stateData);
    }
  }

  public getMonitoredLoopers(): string[] {
    return Array.from(this.monitoredLoopers.keys());
  }
}

