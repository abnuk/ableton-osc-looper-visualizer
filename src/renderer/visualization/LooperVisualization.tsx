import React, { useEffect, useRef, useState } from 'react';
import { LooperStateData } from '../../shared/types/LooperState';
import { MonitoredItemStateData, MonitoredItemType, MonitoredItemState } from '../../shared/types/MonitoredItem';
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

// Parse item info from command line arguments (works for both loopers and clips)
function getItemInfo() {
  const args = process.argv;
  const itemId = args.find(arg => arg.startsWith('--item-id='))?.split('=')[1] || args.find(arg => arg.startsWith('--looper-id='))?.split('=')[1] || '';
  const itemTypeStr = args.find(arg => arg.startsWith('--item-type='))?.split('=')[1];
  const itemType = itemTypeStr === MonitoredItemType.CLIP ? MonitoredItemType.CLIP : MonitoredItemType.LOOPER;
  const trackName = args.find(arg => arg.startsWith('--track-name='))?.split('=')[1] || 'Item';
  const trackIndex = parseInt(args.find(arg => arg.startsWith('--track-index='))?.split('=')[1] || '0');
  const trackColor = parseInt(args.find(arg => arg.startsWith('--track-color='))?.split('=')[1] || '0');
  const clipIndex = parseInt(args.find(arg => arg.startsWith('--clip-index='))?.split('=')[1] || '0');
  const alwaysOnTop = args.find(arg => arg.startsWith('--always-on-top='))?.split('=')[1] === 'true';

  // Build display name
  let displayName = trackName;
  if (itemType === MonitoredItemType.CLIP) {
    displayName = `${trackName} - Scene ${clipIndex + 1}`;
  }

  return { itemId, itemType, trackName, displayName, trackIndex, trackColor, clipIndex, alwaysOnTop };
}

// Format state for display
function formatStateForDisplay(state: MonitoredItemState): string {
  const stateNames: { [key in MonitoredItemState]: string } = {
    [MonitoredItemState.EMPTY]: 'EMPTY',
    [MonitoredItemState.STOPPED]: 'STOPPED',
    [MonitoredItemState.ARMED_RECORDING]: 'ARMED REC',
    [MonitoredItemState.RECORDING]: 'RECORDING',
    [MonitoredItemState.ARMED_STOPPING]: 'ARMED STOP',
    [MonitoredItemState.PLAYING]: 'PLAYING',
    [MonitoredItemState.ARMED_OVERDUB]: 'ARMED OD',
    [MonitoredItemState.OVERDUBBING]: 'OVERDUBBING',
  };
  return stateNames[state] || state.replace(/_/g, ' ');
}

const LooperVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circularCanvasRef = useRef<CircularCanvas | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  
  const [itemInfo] = useState(getItemInfo());
  const [state, setState] = useState<MonitoredItemState>(MonitoredItemState.EMPTY);
  const [position, setPosition] = useState<number>(0);
  const [hasPosition, setHasPosition] = useState<boolean>(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(itemInfo.alwaysOnTop); // Initialize from saved state
  
  // Use ref to hold current state for animation callback
  const stateRef = useRef<MonitoredItemState>(state);
  const positionRef = useRef<number>(position);
  const hasPositionRef = useRef<boolean>(hasPosition);
  
  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
    positionRef.current = position;
    hasPositionRef.current = hasPosition;
  }, [state, position, hasPosition]);

  // Apply track color to title bar and state label
  useEffect(() => {
    const trackColor = abletonColorToRgb(itemInfo.trackColor);
    const textColor = getContrastTextColor(itemInfo.trackColor);
    
    // Apply color to title bar and state label
    const titleBar = document.querySelector('.title-bar') as HTMLElement;
    const stateLabel = document.querySelector('.state-label') as HTMLElement;
    const trackName = document.querySelector('.track-name') as HTMLElement;
    
    if (titleBar) {
      titleBar.style.backgroundColor = trackColor;
      // Apply text color to track name
      if (trackName) {
        trackName.style.color = textColor;
      }
      // Apply to control buttons (but not close button - it has dark background)
      const controlButtons = titleBar.querySelectorAll('.control-btn:not(.close-btn)') as NodeListOf<HTMLElement>;
      controlButtons.forEach(btn => {
        btn.style.color = textColor;
      });
    }
    if (stateLabel) {
      stateLabel.style.backgroundColor = trackColor;
      stateLabel.style.color = textColor;
    }
  }, [itemInfo.trackColor]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize canvas
    circularCanvasRef.current = new CircularCanvas(canvasRef.current);

    // Initialize animation controller with position support
    animationControllerRef.current = new AnimationController((timestamp: number) => {
      if (circularCanvasRef.current) {
        const currentState = stateRef.current;
        const currentPosition = positionRef.current;
        const currentHasPosition = hasPositionRef.current;
        circularCanvasRef.current.render(currentState, timestamp, {
          position: currentPosition,
          hasPosition: currentHasPosition,
        });
      }
    });

    // Start animation
    animationControllerRef.current.start();

    // Listen for unified item state updates
    const handleItemStateUpdate = (_event: any, stateData: MonitoredItemStateData) => {
      if (stateData.itemId === itemInfo.itemId) {
        setState(stateData.state);
        setPosition(stateData.position);
        setHasPosition(stateData.hasPosition);
      }
    };

    // Also listen for legacy looper-state-update for backward compatibility
    const handleLooperStateUpdate = (_event: any, stateData: LooperStateData) => {
      if (stateData.looperId === itemInfo.itemId) {
        // Convert LooperState to MonitoredItemState
        const looperState = stateData.state;
        // Map enum value
        const monitoredState = looperState as unknown as MonitoredItemState;
        setState(monitoredState);
      }
    };

    ipcRenderer.on('item-state-update', handleItemStateUpdate);
    ipcRenderer.on('looper-state-update', handleLooperStateUpdate);

    // Handle window resize
    const handleResize = () => {
      if (circularCanvasRef.current) {
        circularCanvasRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ipcRenderer.removeListener('item-state-update', handleItemStateUpdate);
      ipcRenderer.removeListener('looper-state-update', handleLooperStateUpdate);
      window.removeEventListener('resize', handleResize);
      
      if (animationControllerRef.current) {
        animationControllerRef.current.stop();
      }
      
      if (circularCanvasRef.current) {
        circularCanvasRef.current.destroy();
      }
    };
  }, [itemInfo.itemId]);


  const handleClose = () => {
    ipcRenderer.invoke('stop-monitoring-looper', itemInfo.itemId);
    window.close();
  };

  const handleToggleAlwaysOnTop = () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    ipcRenderer.invoke('set-always-on-top', itemInfo.itemId, newValue);
  };

  return (
    <div className="visualization-window">
      <div className="title-bar">
        <span className="track-name">{itemInfo.displayName}</span>
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
        {formatStateForDisplay(state)}
      </div>
    </div>
  );
};

export default LooperVisualization;

