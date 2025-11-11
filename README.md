# Ableton Looper Visualizer

Real-time visualization of Ableton Live Looper devices using OSC communication.

## Features

- Connect to Ableton Live via AbletonOSC
- Discover Looper devices on all tracks
- Visualize looper state with circular Loopy Pro-style displays
- Monitor multiple loopers simultaneously in separate windows
- Always-on-top windows for easy monitoring during performance
- System tray integration for background operation

## Prerequisites

- macOS (initial version)
- Ableton Live 11 or later
- [AbletonOSC](https://github.com/ideoforms/AbletonOSC) installed and configured in Ableton Live

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run in development mode:
```bash
npm run dev
```

In a separate terminal, start Electron:
```bash
npm start
```

## Building

Build the application:
```bash
npm run build
npm run package
```

## Usage

1. Ensure AbletonOSC is running in Ableton Live (default ports: 11000/11001)
2. Launch the application
3. Configure connection settings (hostname, ports)
4. Click "Find Loopers" to discover Looper devices
5. Select which loopers to visualize
6. Monitor looper states in real-time

## Architecture

The application follows clean architecture principles with feature-based organization:

- `src/main/` - Electron main process (OSC communication, window management)
- `src/renderer/` - UI components (React + Canvas)
- `src/shared/` - Shared types and constants

## License

MIT

