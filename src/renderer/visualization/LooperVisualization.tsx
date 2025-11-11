import React, { useEffect, useRef, useState } from 'react';
import { LooperState, LooperStateData } from '../../shared/types/LooperState';
import { CircularCanvas } from './CircularCanvas';
import { AnimationController } from './AnimationController';
import './styles.css';

const { ipcRenderer } = window.require('electron');

// Parse looper info from command line arguments
function getLooperInfo() {
  const args = process.argv;
  const looperId = args.find(arg => arg.startsWith('--looper-id='))?.split('=')[1] || '';
  const trackName = args.find(arg => arg.startsWith('--track-name='))?.split('=')[1] || 'Looper';
  const trackIndex = parseInt(args.find(arg => arg.startsWith('--track-index='))?.split('=')[1] || '0');
  const deviceIndex = parseInt(args.find(arg => arg.startsWith('--device-index='))?.split('=')[1] || '0');
  const alwaysOnTop = args.find(arg => arg.startsWith('--always-on-top='))?.split('=')[1] === 'true';

  return { looperId, trackName, trackIndex, deviceIndex, alwaysOnTop };
}

const LooperVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circularCanvasRef = useRef<CircularCanvas | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  
  const [looperInfo] = useState(getLooperInfo());
  const [state, setState] = useState<LooperState>(LooperState.EMPTY);
  const [alwaysOnTop, setAlwaysOnTop] = useState(looperInfo.alwaysOnTop); // Initialize from saved state
  
  // Use ref to hold current state for animation callback
  const stateRef = useRef<LooperState>(state);
  
  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize canvas
    circularCanvasRef.current = new CircularCanvas(canvasRef.current);

    // Initialize animation controller - simplified (no position)
    animationControllerRef.current = new AnimationController((timestamp: number) => {
      if (circularCanvasRef.current) {
        const currentState = stateRef.current;
        circularCanvasRef.current.render(currentState, timestamp);
      }
    });

    // Start animation
    animationControllerRef.current.start();

    // Listen for state updates
        const handleStateUpdate = (_event: any, stateData: LooperStateData) => {
          console.log('🎨 Renderer received state update:', {
            looperId: stateData.looperId,
            state: LooperState[stateData.state]
          });

          if (stateData.looperId === looperInfo.looperId) {
            setState(stateData.state);
          }
        };

    ipcRenderer.on('looper-state-update', handleStateUpdate);

    // Handle window resize
    const handleResize = () => {
      if (circularCanvasRef.current) {
        circularCanvasRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ipcRenderer.removeListener('looper-state-update', handleStateUpdate);
      window.removeEventListener('resize', handleResize);
      
      if (animationControllerRef.current) {
        animationControllerRef.current.stop();
      }
      
      if (circularCanvasRef.current) {
        circularCanvasRef.current.destroy();
      }
    };
  }, [looperInfo.looperId]);


  const handleClose = () => {
    ipcRenderer.invoke('stop-monitoring-looper', looperInfo.looperId);
    window.close();
  };

  const handleToggleAlwaysOnTop = () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    ipcRenderer.invoke('set-always-on-top', looperInfo.looperId, newValue);
  };

  return (
    <div className="visualization-window">
      <div className="title-bar">
        <span className="track-name">{looperInfo.trackName}</span>
        <div className="window-controls">
          <button
            className={`control-btn ${alwaysOnTop ? 'active' : ''}`}
            onClick={handleToggleAlwaysOnTop}
            title="Always on Top"
          >
            📌
          </button>
          <button
            className="control-btn close-btn"
            onClick={handleClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} className="looper-canvas" />
      </div>
      <div className="state-label">
        {state.replace(/_/g, ' ')}
      </div>
    </div>
  );
};

export default LooperVisualization;

