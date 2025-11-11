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
    // Create a simple template icon for macOS
    // Template icons are monochrome and adapt to light/dark mode
    // For a production app, use proper icon files in assets/
    
    // Create a 16x16 PNG with a simple circle design
    const iconData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFJSURBVDiNpZMxTsNAEEVnbCe2kxBCQoEEBR0lF+AKXIArgBQKCgoKLkABBQUSEhISEhISEiKROMnac1jbGAwkQbxqV7Mz7/3Z2dU/RURQVTyfz2g2m+h0OjgcDtB1HYZhYLfbYb1eY7VaodfrYTgcwvM8EBEAYFVV1el0qu12W+V5ruq6Vr7vq8PhoDB4nucKgEJVVTabjcpisfg1wHEc5bquCoLgZ4AoinC9XrHf72FZFizLguu6sG0bhmEgDEPcbjecTidcLhdcr1dYloXRaATXdaHrOgRARGg0GhiPx5hMJphOp5jNZpjP51itVlgsFhiNRuj3+xiGYQiAiGC323F5vd7p+Xzm8/kkxpg4jqfL5ZJOp1N6Pp/peDzydrvlfD6n5XJJy+WSXq8XnU4neh/v9zudzycxxtRqtdLhcKBfnufZb7fb3W+3W/Z/3wB+Rt/X9QAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const icon = nativeImage.createFromBuffer(iconData);
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

