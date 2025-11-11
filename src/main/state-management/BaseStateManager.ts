import { OSCMessageHandler } from '../osc-client/OSCMessageHandler';
import { VisualizationWindowManager } from '../windows/VisualizationWindowManager';
import { MonitoredItemInfo, MonitoredItemStateData, MonitoredItemType } from '../../shared/types/MonitoredItem';
import { BaseStateMachine } from './BaseStateMachine';

interface MonitoredItem<T extends BaseStateMachine> {
  info: MonitoredItemInfo;
  stateMachine: T;
  lastUpdate: number;
}

/**
 * Abstract base class for state managers
 * Provides common monitoring logic for both loopers and clips
 */
export abstract class BaseStateManager<T extends BaseStateMachine> {
  protected monitoredItems: Map<string, MonitoredItem<T>> = new Map();
  protected updateInterval: NodeJS.Timeout | null = null;
  protected readonly UPDATE_RATE_MS = 50; // 20fps

  constructor(
    protected oscHandler: OSCMessageHandler,
    protected windowManager: VisualizationWindowManager,
    protected itemType: MonitoredItemType
  ) {}

  /**
   * Start monitoring an item
   */
  public async startMonitoring(item: MonitoredItemInfo): Promise<void> {
    console.log(`\n🎬 === Starting monitoring for ${this.itemType}: ${item.displayName} ===`);
    console.log(`   Item ID: ${item.id}`);
    
    if (this.monitoredItems.has(item.id)) {
      console.log(`⚠️ Already monitoring item ${item.id}`);
      return;
    }

    const stateMachine = this.createStateMachine();

    const monitoredItem: MonitoredItem<T> = {
      info: item,
      stateMachine,
      lastUpdate: Date.now(),
    };

    this.monitoredItems.set(item.id, monitoredItem);

    // Subscribe to updates (implemented by subclass)
    console.log('🔔 Subscribing to updates...');
    await this.subscribeToUpdates(item, stateMachine);

    // Start update loop if not already running
    if (!this.updateInterval) {
      console.log('🔄 Starting update loop...');
      this.startUpdateLoop();
    }

    console.log(`✅ Successfully started monitoring ${this.itemType}: ${item.displayName}\n`);
  }

  /**
   * Stop monitoring an item
   */
  public stopMonitoring(itemId: string): void {
    const monitored = this.monitoredItems.get(itemId);
    if (!monitored) {
      return;
    }

    // Unsubscribe from updates
    this.unsubscribeFromUpdates(monitored.info);

    this.monitoredItems.delete(itemId);

    // Stop update loop if no more items
    if (this.monitoredItems.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log(`Stopped monitoring ${this.itemType}: ${itemId}`);
  }

  /**
   * Stop all monitoring
   */
  public stopAllMonitoring(): void {
    for (const itemId of this.monitoredItems.keys()) {
      this.stopMonitoring(itemId);
    }
  }

  /**
   * Get list of monitored item IDs
   */
  public getMonitoredItems(): string[] {
    return Array.from(this.monitoredItems.keys());
  }

  /**
   * Create a state machine instance (implemented by subclass)
   */
  protected abstract createStateMachine(): T;

  /**
   * Subscribe to updates for an item (implemented by subclass)
   */
  protected abstract subscribeToUpdates(item: MonitoredItemInfo, stateMachine: T): Promise<void>;

  /**
   * Unsubscribe from updates for an item (implemented by subclass)
   */
  protected abstract unsubscribeFromUpdates(item: MonitoredItemInfo): void;

  /**
   * Whether this item type has position data
   */
  protected abstract hasPositionData(): boolean;

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
    for (const [itemId, monitored] of this.monitoredItems) {
      const window = this.windowManager.getWindow(itemId);
      if (!window) {
        console.warn(`⚠️ Window not found for item ${itemId}`);
        continue;
      }

      const stateData: MonitoredItemStateData = {
        itemId,
        type: this.itemType,
        state: monitored.stateMachine.getState(),
        position: monitored.stateMachine.getPosition() || 0,
        length: monitored.stateMachine.getLength() || 0,
        hasPosition: this.hasPositionData(),
      };

      // Send state update to the visualization window
      window.webContents.send('item-state-update', stateData);
    }
  }
}

