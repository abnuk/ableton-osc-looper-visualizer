import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import { LooperInfo } from '../../shared/types/LooperState';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  alwaysOnTop: boolean;
}

export class VisualizationWindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'window-states',
    });
  }

  public createWindow(looper: LooperInfo): BrowserWindow {
    console.log(`🪟 Creating visualization window for ${looper.trackName} (${looper.id})`);
    
    const existingWindow = this.windows.get(looper.id);
    if (existingWindow) {
      console.log(`⚠️ Window already exists for ${looper.id}, focusing...`);
      existingWindow.focus();
      return existingWindow;
    }

    // Load saved window state or use defaults
    const savedState = this.store.get(`window-${looper.id}`) as WindowState | undefined;
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
        additionalArguments: [
          `--looper-id=${looper.id}`,
          `--track-name=${looper.trackName}`,
          `--track-index=${looper.trackIndex}`,
          `--device-index=${looper.deviceIndex}`,
        ],
      },
      backgroundColor: '#1a1a1a',
      frame: false, // Completely frameless - no system buttons at all
      transparent: false,
      hasShadow: true, // Add shadow for better visibility
      title: `Looper - ${looper.trackName}`,
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
    // If we want canvas width = canvas height, then:
    // width / (height - extraHeight) = 1
    // width = height - extraHeight
    // width / height = (height - extraHeight) / height = 1 - (extraHeight / height)
    // For a 300px width, we want 300 / (300 + 69) ≈ 0.813
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
      this.store.set(`window-${looper.id}`, state);
    };

    window.on('move', saveWindowState);
    window.on('resize', saveWindowState);

    window.on('closed', () => {
      console.log(`🗑️ Visualization window closed for ${looper.id}`);
      this.windows.delete(looper.id);
    });

    this.windows.set(looper.id, window);
    console.log(`✅ Visualization window created successfully for ${looper.trackName}`);
    return window;
  }

  public getWindow(looperId: string): BrowserWindow | undefined {
    return this.windows.get(looperId);
  }

  public getAllWindows(): Map<string, BrowserWindow> {
    return this.windows;
  }

  public closeWindow(looperId: string): void {
    const window = this.windows.get(looperId);
    if (window) {
      window.close();
    }
  }

  public closeAllWindows(): void {
    this.windows.forEach(window => window.close());
    this.windows.clear();
  }

  public setAlwaysOnTop(looperId: string, alwaysOnTop: boolean): void {
    const window = this.windows.get(looperId);
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
      this.store.set(`window-${looperId}`, state);
    }
  }
}

