import React, { useState } from 'react';
import { LooperInfo } from '../../shared/types/LooperState';

const { ipcRenderer } = window.require('electron');

const LooperList: React.FC = () => {
  const [loopers, setLoopers] = useState<LooperInfo[]>([]);
  const [selectedLoopers, setSelectedLoopers] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleFindLoopers = async () => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const foundLoopers: LooperInfo[] = await ipcRenderer.invoke('find-loopers');
      setLoopers(foundLoopers);
      
      if (foundLoopers.length === 0) {
        setSearchError('No Looper devices found. Add a Looper to a track in Ableton Live.');
      }
    } catch (error: any) {
      setSearchError(error.message || 'Failed to find loopers');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLooperSelection = (looperId: string) => {
    const newSelection = new Set(selectedLoopers);
    if (newSelection.has(looperId)) {
      newSelection.delete(looperId);
    } else {
      newSelection.add(looperId);
    }
    setSelectedLoopers(newSelection);
  };

  const handleStartMonitoring = async () => {
    if (selectedLoopers.size === 0) {
      return;
    }

    const loopersToMonitor = loopers.filter(looper => 
      selectedLoopers.has(looper.id)
    );

    await ipcRenderer.invoke('start-monitoring-loopers', loopersToMonitor);
  };

  return (
    <div className="looper-list-section">
      <h2>Looper Devices</h2>
      
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleFindLoopers}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Find Loopers'}
        </button>
        
        {loopers.length > 0 && selectedLoopers.size > 0 && (
          <button
            className="btn btn-success"
            onClick={handleStartMonitoring}
          >
            Start Monitoring ({selectedLoopers.size})
          </button>
        )}
      </div>

      {searchError && (
        <div className="info-message">{searchError}</div>
      )}

      {loopers.length > 0 && (
        <div className="loopers-container">
          <p className="help-text">
            Select the loopers you want to visualize:
          </p>
          <div className="looper-items">
            {loopers.map((looper) => (
              <div
                key={looper.id}
                className={`looper-item ${selectedLoopers.has(looper.id) ? 'selected' : ''}`}
                onClick={() => toggleLooperSelection(looper.id)}
              >
                <div className="looper-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedLoopers.has(looper.id)}
                    onChange={() => {}}
                  />
                </div>
                <div className="looper-info">
                  <div className="looper-name">{looper.trackName}</div>
                  <div className="looper-details">
                    Track {looper.trackIndex} • Device {looper.deviceIndex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LooperList;

