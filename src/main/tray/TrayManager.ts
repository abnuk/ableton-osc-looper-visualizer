import { app, Tray, Menu, nativeImage, NativeImage } from 'electron';
import { ConfigWindowManager } from '../windows/ConfigWindowManager';
import { VisualizationWindowManager } from '../windows/VisualizationWindowManager';

export class TrayManager {
  private tray: Tray | null = null;

  constructor(
    private configWindowManager: ConfigWindowManager,
    private visualizationWindowManager: VisualizationWindowManager
  ) {
    this.createTray();
  }

  private createTray(): void {
    // Create a simple tray icon (we'll use a text-based icon for now)
    // In production, you'd want to use actual icon files
    const icon = this.createTrayIcon();
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Ableton Looper Visualizer');
    
    this.updateTrayMenu();

    // Show config window on tray click (macOS)
    this.tray.on('click', () => {
      this.configWindowManager.show();
    });
  }

  private createTrayIcon(): NativeImage {
    // Create a simple 16x16 icon with a circle - template style for macOS
    // Using raw RGBA buffer to draw a filled circle
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    
    // Draw a simple filled circle in the center
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 5;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const index = (y * size + x) * 4;
        if (distance <= radius) {
          // White circle (will be inverted in template mode)
          canvas[index] = 255;     // R
          canvas[index + 1] = 255; // G
          canvas[index + 2] = 255; // B
          canvas[index + 3] = 255; // A
        } else {
          // Transparent
          canvas[index] = 0;
          canvas[index + 1] = 0;
          canvas[index + 2] = 0;
          canvas[index + 3] = 0;
        }
      }
    }
    
    const icon = nativeImage.createFromBuffer(canvas, {
      width: size,
      height: size,
    });
    icon.setTemplateImage(true); // Use template mode on macOS
    return icon;
  }

  public updateTrayMenu(): void {
    if (!this.tray) return;

    const visualizationWindows = this.visualizationWindowManager.getAllWindows();
    const windowMenuItems: Electron.MenuItemConstructorOptions[] = [];

    // Add menu items for each visualization window
    if (visualizationWindows.size > 0) {
      visualizationWindows.forEach((window) => {
        windowMenuItems.push({
          label: window.getTitle(),
          click: () => {
            window.show();
            window.focus();
          },
        });
      });

      windowMenuItems.push({ type: 'separator' });
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Configuration',
        click: () => {
          this.configWindowManager.show();
        },
      },
      { type: 'separator' },
      ...windowMenuItems,
      {
        label: `Active Visualizations: ${visualizationWindows.size}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
