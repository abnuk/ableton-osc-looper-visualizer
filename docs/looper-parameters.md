# Looper Parameters Research

This document describes how to research and understand the parameters exposed by Ableton's Looper device through OSC.

## Overview

When you first connect to a Looper device, the application will automatically query all available parameters. However, the exact mapping between parameter values and looper states may vary depending on the Ableton Live version.

## How to Research Looper Parameters

### Automatic Research Mode

The application includes a built-in research mode that will:

1. Connect to your Ableton Live instance
2. Find all Looper devices on your tracks
3. Query all parameter names and current values
4. Log this information to the console

### Steps to Perform Research

1. **Setup in Ableton Live:**
   - Create a track with a Looper device
   - Put the looper in different states (empty, recording, playing, overdubbing)
   - Observe which parameters change

2. **Use the Application:**
   - Open DevTools (View > Toggle Developer Tools in development mode)
   - Click "Find Loopers" in the configuration window
   - Select a looper and start monitoring
   - Watch the console for parameter updates

3. **Document Your Findings:**
   - Note which parameters indicate recording state
   - Note which parameters indicate playback state
   - Note which parameters show position/progress
   - Note which parameters control quantization

## Common Looper Parameters

Based on typical Ableton Looper devices, you may find parameters like:

### State Control Parameters
- **State** - Main state indicator (may be numeric: 0=empty, 1=recording, 2=playing, etc.)
- **Record** - Recording on/off (0.0 or 1.0)
- **Playback** - Playback on/off (0.0 or 1.0)
- **Overdub** - Overdub on/off (0.0 or 1.0)

### Position Parameters
- **Song Pos** - Current playback position (0.0 to 1.0 or in beats)
- **Length** - Loop length in beats

### Quantization Parameters
- **Quantization** - Quantization setting (None, Bar, Beat, etc.)
- **Tempo Control** - Tempo tracking mode

### Audio Parameters
- **Feedback** - Overdub feedback amount
- **Reverse** - Reverse playback mode
- **Speed** - Playback speed multiplier

## Mapping Parameters to States

Once you've identified the parameters, update the state machine logic in:
`src/main/looper-state/LooperStateMachine.ts`

The `detectState()` method should be updated with the correct parameter names and value ranges.

## Example Research Output

```
=== Researching Looper Parameters for Track 1 ===

Found 24 parameters:
  [0] Device On
  [1] State
  [2] Speed
  [3] Reverse
  [4] Quantization
  [5] Song Control
  [6] Tempo Control
  [7] Record
  [8] Overdub
  [9] Playback
  [10] Clear
  [11] Feedback
  [12] Length
  [13] Song Pos
  ...

Current parameter values:
  [0] Device On: 1.0
  [1] State: 2.0
  [7] Record: 0.0
  [8] Overdub: 0.0
  [9] Playback: 1.0
  [12] Length: 16.0
  [13] Song Pos: 8.5
  ...

=== Research Complete ===
```

## Tips

1. **Test All States:** Put the looper through all possible states and observe which parameters change
2. **Note Value Ranges:** Some parameters are 0.0-1.0, others may be 0-127 (MIDI range), or specific numeric values
3. **Check Quantization:** Test with quantization on/off to understand armed states
4. **Multiple Loopers:** Different looper instances should have the same parameter structure

## Updating the State Machine

After research, update the parameter detection logic:

```typescript
private detectState(params: { [key: string]: number }): LooperState {
  // Update with your discovered parameter names
  if ('State' in params) {
    const state = params['State'];
    // Map based on your findings
    if (state === 0) return LooperState.EMPTY;
    if (state === 1) return LooperState.RECORDING;
    if (state === 2) return LooperState.PLAYING;
    // ... etc
  }
  
  // Add additional detection logic based on your findings
}
```

## Need Help?

If you're having trouble identifying the correct parameters:

1. Check the console logs when monitoring a looper
2. Try toggling different buttons in the Looper UI and watch which parameters change
3. Compare parameter values across different looper states
4. Consult the AbletonOSC documentation for device parameter querying

## Contributing

If you successfully map all Looper parameters for your Ableton Live version, please consider:

1. Documenting your findings
2. Creating a configuration profile for that version
3. Sharing with the community

---

**Note:** The exact parameter structure may vary between Ableton Live versions. Always verify parameters match your specific version.

