import { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';
import { ConfigWindowManager } from './windows/ConfigWindowManager';
import { VisualizationWindowManager } from './windows/VisualizationWindowManager';
import { OSCMessageHandler } from './osc-client/OSCMessageHandler';
import { LooperDiscovery } from './looper-discovery/LooperDiscovery';
import { LooperParameterMapper } from './looper-discovery/LooperParameterMapper';
import { LooperStateManager } from './looper-state/LooperStateManager';
import { ClipStateManager } from './state-management/ClipStateManager';
import { TrackListProvider } from './discovery/TrackListProvider';
import { TrayManager } from './tray/TrayManager';
import { AppConfig, DEFAULT_CONFIG } from '../shared/types/AppConfig';
import { LooperInfo } from '../shared/types/LooperState';
import { ClipInfo } from '../shared/types/ClipState';
import { MonitoredItemType } from '../shared/types/MonitoredItem';

// Initialize electron-store for config persistence
const store = new Store();

// Managers
let configWindowManager: ConfigWindowManager;
let visualizationWindowManager: VisualizationWindowManager;
let oscHandler: OSCMessageHandler;
let looperDiscovery: LooperDiscovery;
let looperParameterMapper: LooperParameterMapper;
let looperStateManager: LooperStateManager;
let clipStateManager: ClipStateManager;
let trackListProvider: TrackListProvider;
let trayManager: TrayManager | undefined;

function initializeApp() {
  configWindowManager = new ConfigWindowManager();
  visualizationWindowManager = new VisualizationWindowManager();
  oscHandler = new OSCMessageHandler();
  looperDiscovery = new LooperDiscovery(oscHandler);
  looperParameterMapper = new LooperParameterMapper(oscHandler);
  looperStateManager = new LooperStateManager(oscHandler, visualizationWindowManager);
  clipStateManager = new ClipStateManager(oscHandler, visualizationWindowManager);
  trayManager = new TrayManager(configWindowManager, visualizationWindowManager);

  // Update tray menu when windows change
  setInterval(() => {
    if (trayManager) {
      trayManager.updateTrayMenu();
    }
  }, 5000);

  setupIPCHandlers();
}

function setupIPCHandlers() {
  console.log('🚀 Setting up IPC handlers...');
  
  // Get saved config
  ipcMain.handle('get-config', async () => {
    console.log('📥 IPC: get-config called');
    return store.get('config', DEFAULT_CONFIG);
  });

  // Save config
  ipcMain.handle('save-config', async (_event, config: AppConfig) => {
    store.set('config', config);
    return true;
  });

  // Connect to OSC
  ipcMain.handle('connect-osc', async (_event, config: AppConfig) => {
    console.log('📥 IPC: connect-osc received', config);
    try {
      console.log('🔌 Connecting to OSC...', config);
      await oscHandler.connect(config.hostname, config.sendPort, config.receivePort);
      console.log('✅ OSC connected');
      
      // Enable OSC logging to file for debugging
      oscHandler.enableLogging();
      const logPath = oscHandler.getLogFilePath();
      console.log('📝 OSC event logging enabled:', logPath);
      
      // Test the connection
      console.log('🧪 Testing connection...');
      const success = await oscHandler.getCommandBuilder().testConnection();
      console.log('📡 Test result:', success);
      
      if (success) {
        console.log('✅ Connection test passed');
        const configWindow = configWindowManager.getWindow();
        if (configWindow) {
          configWindow.webContents.send('connection-status', {
            connected: true,
            testing: false,
            error: null,
          });
        }
      } else {
        console.log('❌ Connection test failed');
      }
      
      return success;
    } catch (error: any) {
      console.error('💥 Failed to connect:', error);
      return false;
    }
  });

  // Disconnect from OSC
  ipcMain.handle('disconnect-osc', async () => {
    await oscHandler.disconnect();
    looperStateManager.stopAllMonitoring();
    clipStateManager.stopAllMonitoring();
    return true;
  });

  // Find loopers
  ipcMain.handle('find-loopers', async () => {
    try {
      const loopers = await looperDiscovery.findLoopers();
      return loopers;
    } catch (error: any) {
      console.error('Failed to find loopers:', error);
      throw error;
    }
  });

  // Get track list for clip selection
  ipcMain.handle('get-track-list', async () => {
    try {
      // Initialize track list provider if not already done
      if (!trackListProvider) {
        trackListProvider = new TrackListProvider(oscHandler.getCommandBuilder());
      }
      
      const tracks = await trackListProvider.getTrackList();
      const numScenes = await trackListProvider.getNumScenes();
      
      return { tracks, numScenes };
    } catch (error: any) {
      console.error('Failed to get track list:', error);
      throw error;
    }
  });

  // Research looper parameters (for debugging)
  ipcMain.handle('research-looper', async (_event, looper: LooperInfo) => {
    try {
      await looperParameterMapper.researchLooperParameters(looper);
      return looperParameterMapper.getParameterMappings(looper.id);
    } catch (error: any) {
      console.error('Failed to research looper:', error);
      throw error;
    }
  });

  // Start monitoring loopers
  ipcMain.handle('start-monitoring-loopers', async (_event, loopers: LooperInfo[]) => {
    try {
      // Research parameters for all loopers first
      await looperParameterMapper.getAllParameterMappings(loopers);

      // Create visualization windows and start monitoring
      for (const looper of loopers) {
        visualizationWindowManager.createWindow(looper, MonitoredItemType.LOOPER);
        looperStateManager.startMonitoring(looper, looperParameterMapper);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  });

  // Start monitoring clips
  ipcMain.handle('start-monitoring-clips', async (_event, clips: ClipInfo[]) => {
    try {
      // Create visualization windows and start monitoring
      for (const clip of clips) {
        visualizationWindowManager.createWindow(clip, MonitoredItemType.CLIP);
        clipStateManager.startMonitoring(clip);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to start monitoring clips:', error);
      throw error;
    }
  });

  // Stop monitoring a looper or clip
  ipcMain.handle('stop-monitoring-looper', async (_event, itemId: string) => {
    // Try to stop as looper first
    looperStateManager.stopMonitoring(itemId);
    // Also try as clip
    clipStateManager.stopMonitoring(itemId);
    visualizationWindowManager.closeWindow(itemId);
    return true;
  });

  // Set always on top for visualization window (works for both loopers and clips)
  ipcMain.handle('set-always-on-top', async (_event, itemId: string, alwaysOnTop: boolean) => {
    visualizationWindowManager.setAlwaysOnTop(itemId, alwaysOnTop);
    return true;
  });

  // Duplicate visualization window
  ipcMain.handle('duplicate-window', async (_event, itemId: string) => {
    const duplicatedWindow = visualizationWindowManager.duplicateWindow(itemId);
    
    if (duplicatedWindow) {
      // The duplicate window will automatically receive state updates
      // because the state managers broadcast to all windows matching the original item ID pattern
      return true;
    }
    
    return false;
  });
}

app.whenReady().then(() => {
  console.log('🎬 Electron app is ready');
  initializeApp();
  console.log('✅ App initialized');
  configWindowManager.createWindow();
  console.log('🪟 Config window created');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      configWindowManager.createWindow();
    }
  });
});

// On macOS, keep app running when all windows are closed
app.on('window-all-closed', () => {
  // Don't quit on macOS - app runs in tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup - stop monitoring BEFORE disconnecting OSC
  if (looperStateManager) {
    looperStateManager.stopAllMonitoring();
  }
  if (clipStateManager) {
    clipStateManager.stopAllMonitoring();
  }
  if (oscHandler) {
    oscHandler.disableLogging();
    oscHandler.disconnect();
  }
});

