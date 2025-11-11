import { OSCCommandBuilder } from '../osc-client/OSCCommandBuilder';

export interface TrackInfo {
  trackIndex: number;
  trackName: string;
  trackColor: number;
}

/**
 * Helper class to get list of tracks for clip selection
 * Users manually select which track + scene to monitor
 */
export class TrackListProvider {
  constructor(private commandBuilder: OSCCommandBuilder) {}

  /**
   * Get list of all tracks
   */
  public async getTrackList(): Promise<TrackInfo[]> {
    console.log('🔍 Fetching track list...');
    const tracks: TrackInfo[] = [];

    try {
      const numTracks = await this.commandBuilder.getNumTracks();
      console.log(`Found ${numTracks} tracks`);

      for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
        try {
          const trackName = await this.commandBuilder.getTrackName(trackIndex);
          const trackColor = await this.commandBuilder.getTrackColor(trackIndex);

          tracks.push({
            trackIndex,
            trackName,
            trackColor,
          });
        } catch (error) {
          console.error(`Error fetching track ${trackIndex}:`, error);
          // Add track with default values
          tracks.push({
            trackIndex,
            trackName: `Track ${trackIndex}`,
            trackColor: 0,
          });
        }
      }

      console.log(`✅ Fetched ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      console.error('Error getting track list:', error);
      // Return empty array instead of crashing
      return [];
    }
  }

  /**
   * Get number of scenes (clip slots per track)
   */
  public async getNumScenes(): Promise<number> {
    try {
      return await this.commandBuilder.getNumScenes();
    } catch (error) {
      console.error('Error getting number of scenes:', error);
      return 8; // Default fallback
    }
  }
}

