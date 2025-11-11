# Usage Guide

## Quick Start

### Prerequisites

1. **Ableton Live 11+** with AbletonOSC installed
2. **macOS** (Windows/Linux support coming later)
3. **Node.js 18+** and npm

### Installation

```bash
# Clone or navigate to the project directory
cd ableton-osc-looper-visualizer

# Install dependencies
npm install

# Start development mode
npm run dev

# In another terminal:
npm start
```

### First Time Setup

1. **Start Ableton Live**
   - Ensure AbletonOSC is enabled in Preferences > Link/Tempo/MIDI
   - You should see "AbletonOSC: Listening for OSC on port 11000" in Live's status bar

2. **Launch the Application**
   - The configuration window will open automatically
   - Default settings should work if AbletonOSC is running locally

3. **Connect**
   - Click "Connect" button
   - Wait for "✓ Connected to AbletonOSC" message
   - If connection fails, verify:
     - Ableton Live is running
     - AbletonOSC is enabled
     - Firewall isn't blocking ports 11000/11001

4. **Find Loopers**
   - Click "Find Loopers" button
   - The app will scan all tracks for Looper devices
   - Found loopers will appear in the list

5. **Start Monitoring**
   - Check the boxes next to loopers you want to visualize
   - Click "Start Monitoring" button
   - A visualization window opens for each selected looper

## Using Visualization Windows

### Window Features

- **Circular Progress Ring**: Shows loop playback position
- **Color-Coded States**:
  - Gray: Empty or stopped
  - Red: Recording (pulsing when armed)
  - Green: Playing
  - Yellow: Overdubbing (pulsing when armed)
- **Central Icon**: Play/Stop/Record indicator
- **Track Name**: Shown in title bar
- **Always on Top Button**: Pin button (📌) in top-right
- **Close Button**: ✕ in top-right

### Window Management

- **Resize**: Drag window edges (maintains aspect ratio)
- **Move**: Drag title bar area
- **Always on Top**: Click pin button to keep window above others
- **Close**: Click ✕ or close from system tray menu

### Window State Persistence

The app remembers:
- Window positions
- Window sizes
- "Always on Top" preference

These settings are saved per-looper and restored when you monitor that looper again.

## System Tray

When you close all windows, the app continues running in the system tray:

- **Click tray icon**: Opens configuration window
- **Right-click tray icon**: Shows menu with:
  - Show Configuration
  - List of active visualizations (click to focus)
  - Active visualization count
  - Quit option

## Workflow Tips

### Live Performance Setup

1. Before your set:
   - Connect to Ableton
   - Find and select all loopers you'll use
   - Start monitoring
   - Arrange visualization windows on your display(s)
   - Enable "Always on Top" for critical loopers

2. During performance:
   - Visualizations update in real-time
   - Use tray menu to quickly focus specific loopers
   - Windows persist if you need to restart the app

### Studio Production

1. Monitor specific loopers while recording
2. Keep visualizations visible on a second monitor
3. Close visualizations you don't need
4. Re-open as needed without losing window positions

### Multi-Looper Projects

- Monitor different loopers for different instruments
- Arrange visualization windows in a grid
- Use color coding to quickly identify state
- Focus important loopers with "Always on Top"

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to AbletonOSC

**Solutions**:
- Verify Ableton Live is running
- Check AbletonOSC is enabled in Preferences
- Try changing hostname to `127.0.0.1` instead of `localhost`
- Check firewall settings
- Restart Ableton Live

### No Loopers Found

**Problem**: "Find Loopers" returns empty list

**Solutions**:
- Add a Looper device to at least one track
- Ensure track is not hidden/grouped
- Try reloading the Ableton project
- Check AbletonOSC logs in Ableton's User Library folder

### Visualization Not Updating

**Problem**: Looper window shows but doesn't update

**Solutions**:
- Check OSC connection is still active
- Verify the looper is actually changing state in Live
- Look at DevTools console for errors (development mode)
- Try stopping and restarting monitoring for that looper

### Performance Issues

**Problem**: App feels sluggish or laggy

**Solutions**:
- Close unused visualization windows
- Reduce number of monitored loopers
- Check system resources (Activity Monitor)
- Ensure Ableton isn't overloading your CPU

## Keyboard Shortcuts

Currently no keyboard shortcuts are implemented. Control via:
- Mouse clicks in UI
- System tray menu
- Window controls

## Configuration Files

The app stores data in:

**macOS**:
- Config: `~/Library/Application Support/ableton-looper-visualizer/config.json`
- Window States: `~/Library/Application Support/ableton-looper-visualizer/window-states.json`

To reset all settings:
1. Quit the application
2. Delete these files
3. Restart the application

## Advanced Usage

### Custom OSC Ports

If you've configured AbletonOSC to use different ports:

1. Open configuration window
2. Update "Send Port" (default: 11000)
3. Update "Receive Port" (default: 11001)
4. Click "Connect"

### Remote Connection

To connect to Ableton running on another computer:

1. Configure AbletonOSC to accept remote connections
2. In the app, set hostname to the remote computer's IP address
3. Ensure firewall allows UDP traffic on ports 11000/11001
4. Click "Connect"

### Research Mode

To investigate looper parameters (advanced):

1. Open DevTools (development mode)
2. Find and select a looper
3. Start monitoring
4. Console will show all parameter names and values
5. See `docs/looper-parameters.md` for details

## Building for Production

```bash
# Build the application
npm run build

# Package for macOS
npm run package

# Packaged app will be in release/ directory
```

## Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Enable DevTools and check console for errors
3. Check AbletonOSC logs in Ableton's User Library
4. Review `docs/looper-parameters.md` for parameter mapping help
5. File an issue with:
   - Ableton Live version
   - macOS version
   - Error messages or console output
   - Steps to reproduce

## Tips for Best Experience

1. **Use a second monitor** for visualizations during live performance
2. **Test your setup** before live performance
3. **Keep Ableton and the app on the same machine** for best latency
4. **Pin critical loopers** with "Always on Top"
5. **Close unused visualizations** to save resources
6. **Save your Ableton project** after adding loopers for faster setup next time

