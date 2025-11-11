import React, { useEffect, useRef, useState } from 'react';
import { LooperState, LooperStateData } from '../../shared/types/LooperState';
import { CircularCanvas } from './CircularCanvas';
import { AnimationController } from './AnimationController';
import './styles.css';

const { ipcRenderer } = window.require('electron');

// Convert Ableton color integer to RGB hex string
function abletonColorToRgb(abletonColor: number): string {
  // Ableton colors are stored as integers
  // We need to extract RGB components
  const r = (abletonColor >> 16) & 0xFF;
  const g = (abletonColor >> 8) & 0xFF;
  const b = abletonColor & 0xFF;
  return `rgb(${r}, ${g}, ${b})`;
}

// Calculate relative luminance and return contrasting text color
// Using WCAG formula for accessibility
function getContrastTextColor(abletonColor: number): string {
  const r = (abletonColor >> 16) & 0xFF;
  const g = (abletonColor >> 8) & 0xFF;
  const b = abletonColor & 0xFF;
  
  // Convert to relative luminance (0-1 range)
  // First normalize RGB values
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  // Apply gamma correction
  const rLinear = rNorm <= 0.03928 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
  const gLinear = gNorm <= 0.03928 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
  const bLinear = bNorm <= 0.03928 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance using WCAG formula
  const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  
  // Return black text for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Parse looper info from command line arguments
function getLooperInfo() {
  const args = process.argv;
  const looperId = args.find(arg => arg.startsWith('--looper-id='))?.split('=')[1] || '';
  const trackName = args.find(arg => arg.startsWith('--track-name='))?.split('=')[1] || 'Looper';
  const trackIndex = parseInt(args.find(arg => arg.startsWith('--track-index='))?.split('=')[1] || '0');
  const deviceIndex = parseInt(args.find(arg => arg.startsWith('--device-index='))?.split('=')[1] || '0');
  const trackColor = parseInt(args.find(arg => arg.startsWith('--track-color='))?.split('=')[1] || '0');
  const alwaysOnTop = args.find(arg => arg.startsWith('--always-on-top='))?.split('=')[1] === 'true';

  return { looperId, trackName, trackIndex, deviceIndex, trackColor, alwaysOnTop };
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

  // Apply track color to title bar and state label
  useEffect(() => {
    const trackColor = abletonColorToRgb(looperInfo.trackColor);
    const textColor = getContrastTextColor(looperInfo.trackColor);
    
    // Apply color to title bar and state label
    const titleBar = document.querySelector('.title-bar') as HTMLElement;
    const stateLabel = document.querySelector('.state-label') as HTMLElement;
    const trackName = document.querySelector('.track-name') as HTMLElement;
    
    if (titleBar) {
      titleBar.style.backgroundColor = trackColor;
      // Apply text color to all text elements in title bar
      if (trackName) {
        trackName.style.color = textColor;
      }
      // Apply to control buttons too
      const controlButtons = titleBar.querySelectorAll('.control-btn') as NodeListOf<HTMLElement>;
      controlButtons.forEach(btn => {
        btn.style.color = textColor;
      });
    }
    if (stateLabel) {
      stateLabel.style.backgroundColor = trackColor;
      stateLabel.style.color = textColor;
    }
  }, [looperInfo.trackColor]);

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

