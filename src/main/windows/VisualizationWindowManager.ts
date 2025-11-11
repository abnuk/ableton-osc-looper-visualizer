import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import { LooperInfo } from '../../shared/types/LooperState';
import { ClipInfo } from '../../shared/types/ClipState';
import { MonitoredItemType } from '../../shared/types/MonitoredItem';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  alwaysOnTop: boolean;
}

interface WindowInfo {
  window: BrowserWindow;
  item: MonitoredItem;
  itemType: MonitoredItemType;
}

type MonitoredItem = LooperInfo | ClipInfo;

export class VisualizationWindowManager {
  private windows: Map<string, WindowInfo> = new Map();
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'window-states',
    });
  }

  // Generic create window that works for both loopers and clips
  public createWindow(item: MonitoredItem, itemType: MonitoredItemType = MonitoredItemType.LOOPER): BrowserWindow {
    const displayName = this.getDisplayName(item, itemType);
    const itemId = item.id;
    
    console.log(`🪟 Creating visualization window for ${displayName} (${itemId})`);
    
    const existingWindowInfo = this.windows.get(itemId);
    if (existingWindowInfo) {
      console.log(`⚠️ Window already exists for ${itemId}, focusing...`);
      existingWindowInfo.window.focus();
      return existingWindowInfo.window;
    }

    // Load saved window state or use defaults
    const savedState = this.store.get(`window-${itemId}`) as WindowState | undefined;
    const windowState: WindowState = savedState || {
      width: 300,
      height: 350,
      alwaysOnTop: false,
    };

    const window = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 150,
      minHeight: 150,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        additionalArguments: this.buildCommandLineArgs(item, itemType, windowState.alwaysOnTop),
      },
      backgroundColor: '#1a1a1a',
      frame: false, // Completely frameless - no system buttons at all
      transparent: false,
      hasShadow: true, // Add shadow for better visibility
      title: displayName,
      alwaysOnTop: windowState.alwaysOnTop,
      skipTaskbar: false, // Keep in taskbar/dock
      ...(process.platform === 'darwin' ? {
        // macOS specific: explicitly hide traffic lights
        titleBarStyle: 'customButtonsOnHover' as const,
        trafficLightPosition: { x: -200, y: -200 }, // Move traffic lights off-screen
      } : {}),
    });

    // Keep window square (1:1 aspect ratio) for circular visualization
    // Calculate aspect ratio so that canvas area (excluding title bar and state label) is square
    // Title bar: ~40px, State label: ~29px = ~69px total
    // For canvas to be square, if width is W, height should be W + 69
    // Aspect ratio = W / (W + 69)
    const titleBarHeight = 40;
    const stateLabelHeight = 29;
    const extraHeight = titleBarHeight + stateLabelHeight;
    
    // Set aspect ratio so canvas is square
    const aspectRatio = windowState.width / (windowState.width + extraHeight);
    window.setAspectRatio(aspectRatio);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📂 Loading visualization from development server...`);
      window.loadURL('http://localhost:3000/visualization.html');
    } else {
      const htmlPath = path.join(__dirname, '../renderer/visualization.html');
      console.log(`📂 Loading visualization from file: ${htmlPath}`);
      window.loadFile(htmlPath);
    }

    // Save window state on move or resize
    const saveWindowState = () => {
      const bounds = window.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        alwaysOnTop: window.isAlwaysOnTop(),
      };
      this.store.set(`window-${itemId}`, state);
    };

    window.on('move', saveWindowState);
    window.on('resize', saveWindowState);

    window.on('closed', () => {
      console.log(`🗑️ Visualization window closed for ${itemId}`);
      this.windows.delete(itemId);
    });

    this.windows.set(itemId, { window, item, itemType });
    console.log(`✅ Visualization window created successfully for ${displayName}`);
    return window;
  }

  // Helper to get display name
  private getDisplayName(item: MonitoredItem, itemType: MonitoredItemType): string {
    if (itemType === MonitoredItemType.LOOPER) {
      return `Looper - ${item.trackName}`;
    } else {
      const clipItem = item as ClipInfo;
      return `Clip - ${item.trackName} - Scene ${clipItem.clipIndex + 1}`;
    }
  }

  // Helper to build command line arguments
  private buildCommandLineArgs(item: MonitoredItem, itemType: MonitoredItemType, alwaysOnTop: boolean): string[] {
    const baseArgs = [
      `--item-id=${item.id}`,
      `--item-type=${itemType}`,
      `--track-name=${item.trackName}`,
      `--track-index=${item.trackIndex}`,
      `--track-color=${item.trackColor}`,
      `--always-on-top=${alwaysOnTop}`,
    ];

    if (itemType === MonitoredItemType.LOOPER) {
      const looperItem = item as LooperInfo;
      baseArgs.push(`--device-index=${looperItem.deviceIndex}`);
    } else {
      const clipItem = item as ClipInfo;
      baseArgs.push(`--clip-index=${clipItem.clipIndex}`);
    }

    return baseArgs;
  }

  public getWindow(itemId: string): BrowserWindow | undefined {
    return this.windows.get(itemId)?.window;
  }

  public getAllWindows(): Map<string, BrowserWindow> {
    const result = new Map<string, BrowserWindow>();
    for (const [id, info] of this.windows) {
      result.set(id, info.window);
    }
    return result;
  }

  public closeWindow(itemId: string): void {
    const windowInfo = this.windows.get(itemId);
    if (windowInfo) {
      windowInfo.window.close();
    }
  }

  public closeAllWindows(): void {
    this.windows.forEach(info => info.window.close());
    this.windows.clear();
  }

  public setAlwaysOnTop(itemId: string, alwaysOnTop: boolean): void {
    const windowInfo = this.windows.get(itemId);
    if (windowInfo) {
      windowInfo.window.setAlwaysOnTop(alwaysOnTop);
      
      // Save the state immediately
      const bounds = windowInfo.window.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        alwaysOnTop,
      };
      this.store.set(`window-${itemId}`, state);
    }
  }

  // Duplicate a window - creates a new window with a unique ID but same data
  public duplicateWindow(originalItemId: string): BrowserWindow | null {
    const originalWindowInfo = this.windows.get(originalItemId);
    if (!originalWindowInfo) {
      console.log(`⚠️ Cannot duplicate: window ${originalItemId} not found`);
      return null;
    }

    const originalWindow = originalWindowInfo.window;
    const originalItem = originalWindowInfo.item;
    const itemType = originalWindowInfo.itemType;

    // Create a duplicate ID by appending a timestamp and random number
    const duplicateId = `${originalItemId}-dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Recreate the item object with the new ID
    let item: MonitoredItem;
    if (itemType === MonitoredItemType.CLIP) {
      const clipItem = originalItem as ClipInfo;
      item = {
        id: duplicateId,
        trackName: clipItem.trackName,
        trackIndex: clipItem.trackIndex,
        trackColor: clipItem.trackColor,
        clipIndex: clipItem.clipIndex,
      } as ClipInfo;
    } else {
      const looperItem = originalItem as LooperInfo;
      item = {
        id: duplicateId,
        trackName: looperItem.trackName,
        trackIndex: looperItem.trackIndex,
        trackColor: looperItem.trackColor,
        deviceIndex: looperItem.deviceIndex,
      } as LooperInfo;
    }

    console.log(`🪟 Creating duplicate window for ${originalItemId} -> ${duplicateId}`);

    // Get the bounds of the original window and offset the duplicate
    const originalBounds = originalWindow.getBounds();
    const savedState = this.store.get(`window-${originalItemId}`) as WindowState | undefined;
    
    const windowState: WindowState = {
      x: originalBounds.x + 30, // Offset by 30 pixels
      y: originalBounds.y + 30,
      width: originalBounds.width,
      height: originalBounds.height,
      alwaysOnTop: savedState?.alwaysOnTop || originalWindow.isAlwaysOnTop(),
    };

    const displayName = this.getDisplayName(item, itemType);
    const window = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 150,
      minHeight: 150,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        additionalArguments: this.buildCommandLineArgs(item, itemType, windowState.alwaysOnTop),
      },
      backgroundColor: '#1a1a1a',
      frame: false,
      transparent: false,
      hasShadow: true,
      title: displayName,
      alwaysOnTop: windowState.alwaysOnTop,
      skipTaskbar: false,
      ...(process.platform === 'darwin' ? {
        titleBarStyle: 'customButtonsOnHover' as const,
        trafficLightPosition: { x: -200, y: -200 },
      } : {}),
    });

    // Set aspect ratio
    const titleBarHeight = 40;
    const stateLabelHeight = 29;
    const extraHeight = titleBarHeight + stateLabelHeight;
    const aspectRatio = windowState.width / (windowState.width + extraHeight);
    window.setAspectRatio(aspectRatio);

    if (process.env.NODE_ENV === 'development') {
      window.loadURL('http://localhost:3000/visualization.html');
    } else {
      const htmlPath = path.join(__dirname, '../renderer/visualization.html');
      window.loadFile(htmlPath);
    }

    // Save window state on move or resize
    const saveWindowState = () => {
      const bounds = window.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        alwaysOnTop: window.isAlwaysOnTop(),
      };
      this.store.set(`window-${duplicateId}`, state);
    };

    window.on('move', saveWindowState);
    window.on('resize', saveWindowState);

    window.on('closed', () => {
      console.log(`🗑️ Duplicate visualization window closed for ${duplicateId}`);
      this.windows.delete(duplicateId);
    });

    this.windows.set(duplicateId, { window, item, itemType });
    console.log(`✅ Duplicate visualization window created successfully for ${displayName}`);
    
    return window;
  }
}

