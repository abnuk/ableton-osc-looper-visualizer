# Development Guide

## Project Structure

```
ableton-osc-looper-visualizer/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts              # Main entry point
│   │   ├── osc-client/           # OSC communication layer
│   │   ├── looper-discovery/     # Looper device discovery
│   │   ├── looper-state/         # State management
│   │   ├── windows/              # Window management
│   │   └── tray/                 # System tray
│   ├── renderer/                  # Electron renderer processes
│   │   ├── config/               # Configuration window
│   │   └── visualization/        # Visualization windows
│   └── shared/                    # Shared types and constants
│       ├── types/
│       └── constants/
├── docs/                          # Documentation
├── dist/                          # Build output
└── release/                       # Packaged applications
```

## Architecture

### Main Process (Node.js)

The main process handles:
- OSC communication with Ableton Live
- Looper discovery and parameter research
- State management and distribution
- Window lifecycle management
- System tray integration

**Key Classes:**
- `OSCClient`: Low-level OSC communication
- `OSCCommandBuilder`: High-level OSC commands
- `LooperDiscovery`: Finding Looper devices
- `LooperStateManager`: Managing looper state subscriptions
- `VisualizationWindowManager`: Managing visualization windows
- `TrayManager`: System tray menu

### Renderer Process (Browser)

Two separate renderer processes:
1. **Config Window**: Connection setup and looper selection
2. **Visualization Window**: Real-time looper visualization (one per looper)

**Key Components:**
- `ConfigWindow`: Connection form and looper list
- `LooperVisualization`: Circular canvas visualization
- `CircularCanvas`: Canvas rendering engine
- `AnimationController`: Animation loop management

### Communication Flow

```
Ableton Live (OSC)
       ↕
OSCClient (Main Process)
       ↕
LooperStateManager (Main Process)
       ↕
IPC (Electron)
       ↕
LooperVisualization (Renderer)
       ↕
CircularCanvas (Canvas API)
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

Terminal 1 - Build and watch:
```bash
npm run dev
```

Terminal 2 - Run Electron:
```bash
npm start
```

The renderer will hot-reload, but main process changes require a restart.

### Build for Production

```bash
npm run build
npm run package
```

## Code Standards

### TypeScript

- Use strict mode
- Avoid `any` types (use `unknown` if needed)
- Define interfaces for all data structures
- Use enum for state values
- Prefix unused parameters with `_`

### Naming Conventions

- `PascalCase` for classes and interfaces
- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for constants
- Descriptive names (no abbreviations)

### File Organization

- One class per file
- File name matches class name
- Group related files in directories
- Index files for public API

### Comments

- JSDoc for public methods
- Inline comments for complex logic
- TODO comments for future work

## Common Tasks

### Adding a New OSC Command

1. Add command to `src/shared/constants/OSCCommands.ts`
2. Add method to `src/main/osc-client/OSCCommandBuilder.ts`
3. Use in appropriate manager/handler

### Adding a New Looper State

1. Add to `LooperState` enum in `src/shared/types/LooperState.ts`
2. Add detection logic in `LooperStateMachine.detectState()`
3. Add color in `CircularCanvas.colors`
4. Add rendering logic in `CircularCanvas.renderStateIndicator()`
5. Add icon in `CircularCanvas.renderCenterIcon()`

### Adding a New Window

1. Create HTML template in `src/renderer/*/index.html`
2. Create React entry point in `src/renderer/*/index.tsx`
3. Add webpack entry in `webpack.renderer.config.js`
4. Create window manager in `src/main/windows/`
5. Add IPC handlers in `src/main/index.ts`

## Debugging

### Main Process

Use console.log or Node.js debugger:

```bash
# Add to package.json scripts:
"debug": "electron --inspect=5858 ."
```

Then attach Chrome DevTools to `chrome://inspect`

### Renderer Process

Open DevTools from menu: View > Toggle Developer Tools

Console logs, React DevTools, and Network tab available.

### OSC Communication

Enable verbose logging:

```typescript
// In OSCMessageHandler constructor
this.client.on('message', (response) => {
  console.log('OSC:', response);
});
```

## Testing

### Manual Testing

Use the testing checklist in `docs/testing-checklist.md`

### Automated Testing (Future)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Performance Optimization

### Current Optimizations

1. **Canvas Rendering**: Only redraws on state changes
2. **OSC Throttling**: State manager updates at 20fps max
3. **IPC Batching**: State updates sent in batches
4. **Window Persistence**: Saves state on change, not on interval

### Monitoring Performance

```typescript
// Add to visualization window
console.time('render');
circularCanvas.render(state, position, isPulse);
console.timeEnd('render');
```

### Known Bottlenecks

1. **Many Loopers**: 10+ visualizations may impact performance
2. **Parameter Updates**: High-frequency parameter changes can flood IPC
3. **Window Movement**: Saving state on every move event

## Troubleshooting Development Issues

### Webpack Build Errors

```bash
# Clear dist folder
rm -rf dist/

# Reinstall dependencies
rm -rf node_modules/
npm install
```

### Electron Won't Start

- Check `dist/main/index.js` exists
- Verify no TypeScript errors
- Check console for errors

### Hot Reload Not Working

- Verify webpack-dev-server is running (port 3000)
- Check webpack config entry points
- Restart both terminals

### OSC Connection Issues

- Ensure Ableton is running
- Check AbletonOSC is enabled
- Verify ports aren't blocked
- Try 127.0.0.1 instead of localhost

## Contributing

### Before Submitting

1. Test all features (use checklist)
2. Run linter: `npm run lint` (if configured)
3. Update documentation if needed
4. Verify build works: `npm run build`

### Code Review Checklist

- [ ] Code follows style guide
- [ ] No console.log in production code
- [ ] Error handling present
- [ ] Types are explicit
- [ ] Comments explain why, not what
- [ ] Performance considered
- [ ] Documentation updated

## Deployment

### Version Bumping

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### Building Release

```bash
npm run build
npm run package

# Output in release/ directory
```

### Distribution

- Upload .dmg to release platform
- Update changelog
- Tag release in git

## Future Enhancements

### High Priority

- [ ] Auto-reconnect on connection loss
- [ ] Better error notifications (native)
- [ ] Looper parameter preset system
- [ ] Multiple Ableton Live versions support

### Medium Priority

- [ ] Windows/Linux support
- [ ] Custom color schemes
- [ ] Keyboard shortcuts
- [ ] Multiple visualization styles

### Low Priority

- [ ] Plugin system for custom visualizations
- [ ] Recording session history
- [ ] Integration with other DAWs
- [ ] Mobile companion app (iOS)

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [AbletonOSC GitHub](https://github.com/ideoforms/AbletonOSC)
- [OSC Protocol](http://opensoundcontrol.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Getting Help

- Check documentation in `docs/`
- Review this development guide
- Check GitHub issues
- Open a new issue with details

## License

MIT - See LICENSE file

