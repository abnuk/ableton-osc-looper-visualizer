import { MonitoredItemType, ClipItemInfo } from './MonitoredItem';

// Clip-specific state information
export interface ClipInfo {
  trackIndex: number;
  clipIndex: number; // Scene index
  trackName: string;
  trackColor: number;
  id: string; // Format: `clip-${trackIndex}-${clipIndex}`
}

// Convert ClipInfo to MonitoredItemInfo
export function clipInfoToMonitoredItem(clipInfo: ClipInfo): ClipItemInfo {
  return {
    type: MonitoredItemType.CLIP,
    trackIndex: clipInfo.trackIndex,
    clipIndex: clipInfo.clipIndex,
    trackName: clipInfo.trackName,
    trackColor: clipInfo.trackColor,
    id: clipInfo.id,
    displayName: `${clipInfo.trackName} - Scene ${clipInfo.clipIndex + 1}`,
  };
}

// Helper to create clip ID
export function createClipId(trackIndex: number, clipIndex: number): string {
  return `clip-${trackIndex}-${clipIndex}`;
}

