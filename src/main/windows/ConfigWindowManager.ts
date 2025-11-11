import { BrowserWindow } from 'electron';
import * as path from 'path';

export class ConfigWindowManager {
  private window: BrowserWindow | null = null;

  public createWindow(): BrowserWindow {
    if (this.window) {
      this.window.focus();
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      backgroundColor: '#1a1a1a',
      titleBarStyle: 'hiddenInset',
      title: 'Ableton Looper Visualizer',
    });

    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:3000/config.html');
      this.window.webContents.openDevTools();
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/config.html'));
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public show(): void {
    if (this.window) {
      this.window.show();
      this.window.focus();
    } else {
      this.createWindow();
    }
  }

  public hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }

  public close(): void {
    if (this.window) {
      this.window.close();
    }
  }
}

