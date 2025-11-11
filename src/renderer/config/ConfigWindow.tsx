import React, { useState, useEffect } from 'react';
import { DEFAULT_CONFIG } from '../../shared/types/AppConfig';
import LooperList from './LooperList';
import ClipSelector from './ClipSelector';
import './styles.css';

const { ipcRenderer } = window.require('electron');

interface ConnectionStatus {
  connected: boolean;
  testing: boolean;
  error: string | null;
}

const ConfigWindow: React.FC = () => {
  const [hostname, setHostname] = useState(DEFAULT_CONFIG.hostname);
  const [sendPort, setSendPort] = useState(DEFAULT_CONFIG.sendPort);
  const [receivePort, setReceivePort] = useState(DEFAULT_CONFIG.receivePort);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    testing: false,
    error: null,
  });
  const [showLooperList, setShowLooperList] = useState(false);

  useEffect(() => {
    // Load saved config
    ipcRenderer.invoke('get-config').then((config: any) => {
      if (config) {
        setHostname(config.hostname || DEFAULT_CONFIG.hostname);
        setSendPort(config.sendPort || DEFAULT_CONFIG.sendPort);
        setReceivePort(config.receivePort || DEFAULT_CONFIG.receivePort);
      }
    });

    // Listen for connection status updates
    ipcRenderer.on('connection-status', (_event: any, status: ConnectionStatus) => {
      setConnectionStatus(status);
      if (status.connected) {
        setShowLooperList(true);
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('connection-status');
    };
  }, []);

  const handleConnect = async () => {
    console.log('🔌 Attempting to connect...', { hostname, sendPort, receivePort });
    setConnectionStatus({ connected: false, testing: true, error: null });
    
    try {
      const config = { hostname, sendPort, receivePort };
      console.log('💾 Saving config...', config);
      await ipcRenderer.invoke('save-config', config);
      console.log('✅ Config saved');
      
      console.log('🔗 Invoking connect-osc...');
      const success = await ipcRenderer.invoke('connect-osc', config);
      console.log('📡 Connection result:', success);
      
      if (success) {
        console.log('✅ Connected successfully!');
        setConnectionStatus({ connected: true, testing: false, error: null });
        setShowLooperList(true);
      } else {
        console.log('❌ Connection returned false');
        setConnectionStatus({
          connected: false,
          testing: false,
          error: 'Connection failed. Is Ableton running with AbletonOSC?',
        });
      }
    } catch (error: any) {
      console.error('💥 Connection error:', error);
      setConnectionStatus({
        connected: false,
        testing: false,
        error: error.message || 'Connection error',
      });
    }
  };

  const handleDisconnect = async () => {
    await ipcRenderer.invoke('disconnect-osc');
    setConnectionStatus({ connected: false, testing: false, error: null });
    setShowLooperList(false);
  };

  return (
    <div className="config-window">
      <div className="config-header">
        <h1>Ableton Looper Visualizer</h1>
        <p>Connect to AbletonOSC to visualize your loopers</p>
      </div>

      <div className="config-content">
        <div className="connection-section">
          <h2>Connection Settings</h2>
          
          <div className="form-group">
            <label htmlFor="hostname">Hostname</label>
            <input
              id="hostname"
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              disabled={connectionStatus.connected}
              placeholder="localhost"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sendPort">Send Port</label>
              <input
                id="sendPort"
                type="number"
                value={sendPort}
                onChange={(e) => setSendPort(parseInt(e.target.value))}
                disabled={connectionStatus.connected}
                placeholder="11000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="receivePort">Receive Port</label>
              <input
                id="receivePort"
                type="number"
                value={receivePort}
                onChange={(e) => setReceivePort(parseInt(e.target.value))}
                disabled={connectionStatus.connected}
                placeholder="11001"
              />
            </div>
          </div>

          <div className="button-group">
            {!connectionStatus.connected ? (
              <button
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={connectionStatus.testing}
              >
                {connectionStatus.testing ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>

          {connectionStatus.error && (
            <div className="error-message">{connectionStatus.error}</div>
          )}

          {connectionStatus.connected && (
            <div className="success-message">
              ✓ Connected to AbletonOSC
            </div>
          )}
        </div>

        {showLooperList && connectionStatus.connected && (
          <>
            <LooperList />
            <ClipSelector />
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigWindow;

