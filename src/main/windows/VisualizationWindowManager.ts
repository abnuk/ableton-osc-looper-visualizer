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

type MonitoredItem = LooperInfo | ClipInfo;

export class VisualizationWindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
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
    
    const existingWindow = this.windows.get(itemId);
    if (existingWindow) {
      console.log(`⚠️ Window already exists for ${itemId}, focusing...`);
      existingWindow.focus();
      return existingWindow;
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
        titleBarStyle: 'customButtonsOnHover' as any,
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

    this.windows.set(itemId, window);
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
    return this.windows.get(itemId);
  }

  public getAllWindows(): Map<string, BrowserWindow> {
    return this.windows;
  }

  public closeWindow(itemId: string): void {
    const window = this.windows.get(itemId);
    if (window) {
      window.close();
    }
  }

  public closeAllWindows(): void {
    this.windows.forEach(window => window.close());
    this.windows.clear();
  }

  public setAlwaysOnTop(itemId: string, alwaysOnTop: boolean): void {
    const window = this.windows.get(itemId);
    if (window) {
      window.setAlwaysOnTop(alwaysOnTop);
      
      // Save the state immediately
      const bounds = window.getBounds();
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
}

