# Testing Checklist

## Manual Testing Checklist

Use this checklist to verify all features are working correctly.

### Prerequisites
- [ ] Ableton Live 11+ installed
- [ ] AbletonOSC installed and enabled
- [ ] At least one track with a Looper device
- [ ] Application built and ready to run

---

## 1. Connection & Configuration

### Initial Launch
- [ ] Application launches without errors
- [ ] Configuration window appears
- [ ] Default values are shown (localhost, 11000, 11001)
- [ ] UI is responsive

### Connection Testing
- [ ] "Connect" button responds
- [ ] Connection succeeds with valid settings
- [ ] Success message appears
- [ ] "Disconnect" button appears after connection
- [ ] Connection fails gracefully with invalid settings
- [ ] Error message displays for failed connection
- [ ] Can disconnect and reconnect

### Configuration Persistence
- [ ] Close app and restart
- [ ] Previous connection settings are loaded
- [ ] Can update settings and they persist

---

## 2. Looper Discovery

### Finding Loopers
- [ ] "Find Loopers" button appears after connection
- [ ] Button shows "Searching..." during search
- [ ] Found loopers display in list
- [ ] Track names are shown correctly
- [ ] Track and device indices are shown
- [ ] No loopers found message appears when appropriate
- [ ] Can search multiple times

### Looper Selection
- [ ] Can select individual loopers by clicking
- [ ] Checkboxes update correctly
- [ ] Multiple loopers can be selected
- [ ] Selection persists if searching again
- [ ] "Start Monitoring" button appears when loopers selected
- [ ] Button shows count of selected loopers

---

## 3. Visualization Windows

### Window Creation
- [ ] Clicking "Start Monitoring" creates visualization windows
- [ ] One window per selected looper
- [ ] Windows open at reasonable positions
- [ ] Track name shown in title bar
- [ ] Canvas renders without errors

### Window Features
- [ ] Title bar is draggable
- [ ] Window can be moved
- [ ] Window can be resized
- [ ] Maintains minimum size (150x150)
- [ ] Circular visualization scales properly
- [ ] Pin button (📌) is visible and clickable
- [ ] Close button (✕) is visible and clickable

### Always on Top
- [ ] Clicking pin button toggles "Always on Top"
- [ ] Button shows active state when enabled
- [ ] Window stays on top of other windows when enabled
- [ ] Window can be placed behind when disabled
- [ ] Setting persists if window is closed and reopened

### Window Persistence
- [ ] Close and reopen a visualization window
- [ ] Position is restored
- [ ] Size is restored
- [ ] "Always on Top" setting is restored

---

## 4. Visualization States

Test each looper state by performing actions in Ableton:

### Empty State
- [ ] New/cleared looper shows gray circle
- [ ] No progress indicator
- [ ] State label shows "EMPTY"

### Recording State
- [ ] Recording looper shows red circle
- [ ] Circle pulses/animates
- [ ] Red dot icon in center
- [ ] State label shows "RECORDING"

### Armed Recording (with quantization)
- [ ] Shows pulsing red circle
- [ ] State label shows "ARMED RECORDING"
- [ ] Transitions to recording at quantization point

### Playing State
- [ ] Shows green progress ring
- [ ] Progress indicator rotates
- [ ] Play triangle icon in center
- [ ] State label shows "PLAYING"
- [ ] Progress resets at loop end

### Stopped State
- [ ] Shows dim gray circle
- [ ] No animation
- [ ] Stop square icon in center
- [ ] State label shows "STOPPED"

### Overdubbing State
- [ ] Shows yellow progress ring
- [ ] Progress indicator rotates
- [ ] Double circle icon in center
- [ ] State label shows "OVERDUBBING"
- [ ] Position matches playback

### Armed Overdub (with quantization)
- [ ] Shows pulsing yellow circle
- [ ] State label shows "ARMED OVERDUB"
- [ ] Transitions to overdubbing at quantization point

---

## 5. Real-time Updates

### Parameter Updates
- [ ] State changes reflect immediately (<100ms delay)
- [ ] Position updates smoothly (no jitter)
- [ ] Multiple windows update independently
- [ ] Updates continue when app is in background

### Performance
- [ ] Animations run at smooth 60fps
- [ ] No noticeable lag in UI
- [ ] CPU usage is reasonable (<5% with 3-4 visualizations)
- [ ] Memory usage is stable (no leaks over time)

---

## 6. Multi-Window Management

### Multiple Loopers
- [ ] Can monitor 2+ loopers simultaneously
- [ ] Each window updates independently
- [ ] Windows don't interfere with each other
- [ ] Can close individual windows
- [ ] Closing one doesn't affect others

### Window Arrangement
- [ ] Can arrange windows in custom layout
- [ ] Positions persist across sessions
- [ ] Windows don't overlap by default (cascade)
- [ ] Can manually overlap if desired

---

## 7. System Tray

### Tray Icon
- [ ] Tray icon appears after launch
- [ ] Icon is visible in macOS menu bar
- [ ] Icon is appropriate size
- [ ] Tooltip shows "Ableton Looper Visualizer"

### Tray Menu
- [ ] Right-clicking tray icon shows menu
- [ ] "Show Configuration" option present
- [ ] Active visualizations are listed
- [ ] Clicking visualization name focuses that window
- [ ] Active count is shown
- [ ] "Quit" option present
- [ ] Clicking "Quit" closes app completely

### Background Operation
- [ ] Closing all windows keeps app running
- [ ] Tray icon remains
- [ ] Can reopen configuration from tray
- [ ] Visualizations continue updating in background

---

## 8. Error Handling

### Connection Errors
- [ ] Shows error if Ableton not running
- [ ] Shows error if ports are wrong
- [ ] Shows error if hostname is invalid
- [ ] Error messages are user-friendly
- [ ] Can retry after error

### Disconnection Handling
- [ ] Graceful behavior if Ableton closes
- [ ] Shows disconnection notification
- [ ] Can reconnect after Ableton restarts
- [ ] Visualization windows indicate lost connection

### Invalid Operations
- [ ] Can't find loopers when disconnected
- [ ] Can't start monitoring when disconnected
- [ ] Appropriate errors for each case

---

## 9. Resource Cleanup

### Window Closing
- [ ] Closing visualization stops monitoring
- [ ] OSC subscriptions are cleaned up
- [ ] No memory leaks after closing
- [ ] Can reopen same looper

### Application Quit
- [ ] Quitting disconnects from OSC
- [ ] All windows close
- [ ] All resources are released
- [ ] App quits cleanly without hanging

---

## 10. Edge Cases

### Unusual Scenarios
- [ ] Works with looper on master track
- [ ] Works with looper in group track
- [ ] Handles track name with special characters
- [ ] Handles >10 loopers being monitored
- [ ] Works with very fast loop (< 1 beat)
- [ ] Works with very long loop (> 64 beats)

### Ableton Operations
- [ ] Continues working if track is renamed
- [ ] Continues working if track is moved
- [ ] Handles looper being deleted (graceful failure)
- [ ] Handles Ableton project change

---

## 11. Development Mode Testing

### DevTools
- [ ] Can open DevTools
- [ ] Console shows parameter research data
- [ ] No errors in console during normal operation
- [ ] Network activity is reasonable

### Hot Reload (if applicable)
- [ ] Changes to renderer code hot reload
- [ ] Changes to main process require restart
- [ ] State persists across hot reloads

---

## Platform-Specific Tests

### macOS
- [ ] App icon appears in Dock
- [ ] App name correct in menu bar
- [ ] Standard macOS shortcuts work (Cmd+Q, Cmd+W)
- [ ] Window management follows macOS conventions
- [ ] "Always on Top" works correctly
- [ ] Tray icon matches macOS style

---

## Performance Benchmarks

### Baseline
- [ ] App launches in < 3 seconds
- [ ] Connection establishes in < 1 second
- [ ] Looper discovery completes in < 5 seconds
- [ ] Window opens in < 500ms
- [ ] State updates appear in < 100ms

### Load Testing
- [ ] 5 visualizations running smoothly
- [ ] 10 visualizations running acceptably
- [ ] Memory usage stable over 30 minutes
- [ ] No performance degradation over time

---

## Regression Testing

After any code changes, verify:
- [ ] All basic workflows still function
- [ ] No new errors in console
- [ ] Performance hasn't degraded
- [ ] Window persistence still works
- [ ] OSC communication still reliable

---

## Production Build Testing

### Built Application
- [ ] Builds without errors
- [ ] Packaged .dmg opens correctly
- [ ] App installs correctly
- [ ] App runs from Applications folder
- [ ] All features work in production build
- [ ] DevTools not accessible in production
- [ ] File paths resolve correctly

---

## Sign-Off

- [ ] All critical tests passing
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Ready for release

**Tester Name:** ________________
**Date:** ________________
**Version:** ________________
**Notes:**


