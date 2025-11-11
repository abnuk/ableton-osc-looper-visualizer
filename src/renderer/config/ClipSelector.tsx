import React, { useState } from 'react';
import { ClipInfo, createClipId } from '../../shared/types/ClipState';

const { ipcRenderer } = window.require('electron');

interface TrackInfo {
  trackIndex: number;
  trackName: string;
  trackColor: number;
}

interface SelectedClipEntry {
  trackIndex: number;
  clipIndex: number;
  trackName: string;
  trackColor: number;
  id: string;
}

const ClipSelector: React.FC = () => {
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [numScenes, setNumScenes] = useState<number>(8);
  const [selectedClips, setSelectedClips] = useState<SelectedClipEntry[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New selection state
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number>(0);

  const handleGetTracks = async () => {
    setIsLoadingTracks(true);
    setError(null);
    
    try {
      const result = await ipcRenderer.invoke('get-track-list');
      setTracks(result.tracks);
      setNumScenes(result.numScenes);
      
      if (result.tracks.length === 0) {
        setError('No tracks found in Ableton Live.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get track list');
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleAddClip = () => {
    if (selectedTrackIndex < 0) {
      return;
    }

    const track = tracks[selectedTrackIndex];
    const clipId = createClipId(track.trackIndex, selectedClipIndex);

    // Check if already added
    if (selectedClips.some(c => c.id === clipId)) {
      setError('This clip is already in the list.');
      return;
    }

    const newEntry: SelectedClipEntry = {
      trackIndex: track.trackIndex,
      clipIndex: selectedClipIndex,
      trackName: track.trackName,
      trackColor: track.trackColor,
      id: clipId,
    };

    setSelectedClips([...selectedClips, newEntry]);
    setError(null);
  };

  const handleRemoveClip = (id: string) => {
    setSelectedClips(selectedClips.filter(c => c.id !== id));
  };

  const handleStartMonitoring = async () => {
    if (selectedClips.length === 0) {
      return;
    }

    // Convert to ClipInfo format
    const clipsToMonitor: ClipInfo[] = selectedClips.map(entry => ({
      trackIndex: entry.trackIndex,
      clipIndex: entry.clipIndex,
      trackName: entry.trackName,
      trackColor: entry.trackColor,
      id: entry.id,
    }));

    await ipcRenderer.invoke('start-monitoring-clips', clipsToMonitor);
  };

  return (
    <div className="looper-list-section">
      <h2>Clip Slots</h2>
      
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleGetTracks}
          disabled={isLoadingTracks}
        >
          {isLoadingTracks ? 'Loading...' : 'Get Tracks'}
        </button>
        
        {selectedClips.length > 0 && (
          <button
            className="btn btn-success"
            onClick={handleStartMonitoring}
          >
            Start Monitoring ({selectedClips.length})
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {tracks.length > 0 && (
        <div className="clip-selector-container">
          <p className="help-text">
            Select a track and clip slot to monitor:
          </p>
          
          <div className="clip-selection-form">
            <div className="form-group">
              <label htmlFor="track-select">Track</label>
              <select
                id="track-select"
                value={selectedTrackIndex}
                onChange={(e) => setSelectedTrackIndex(parseInt(e.target.value))}
                className="track-select"
              >
                <option value="-1">-- Select Track --</option>
                {tracks.map((track, idx) => (
                  <option key={track.trackIndex} value={idx}>
                    {track.trackName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="scene-select">Scene</label>
              <select
                id="scene-select"
                value={selectedClipIndex}
                onChange={(e) => setSelectedClipIndex(parseInt(e.target.value))}
                className="scene-select"
              >
                {Array.from({ length: numScenes }, (_, i) => (
                  <option key={i} value={i}>
                    Scene {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleAddClip}
              disabled={selectedTrackIndex < 0}
            >
              Add to Monitor
            </button>
          </div>

          {selectedClips.length > 0 && (
            <div className="selected-clips-list">
              <h3>Selected Clips:</h3>
              <div className="clip-items">
                {selectedClips.map((clip) => (
                  <div key={clip.id} className="clip-item">
                    <div className="clip-info">
                      <div className="clip-name">
                        {clip.trackName} - Scene {clip.clipIndex + 1}
                      </div>
                      <div className="clip-details">
                        Track {clip.trackIndex} • Clip {clip.clipIndex}
                      </div>
                    </div>
                    <button
                      className="btn btn-remove"
                      onClick={() => handleRemoveClip(clip.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClipSelector;

