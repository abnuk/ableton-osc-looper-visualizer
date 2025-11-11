import { OSCMessageHandler } from '../osc-client/OSCMessageHandler';
import { LooperInfo } from '../../shared/types/LooperState';
import { LOOPER_CLASS_NAME } from '../../shared/constants/OSCCommands';

export class LooperDiscovery {
  constructor(private oscHandler: OSCMessageHandler) {}

  public async findLoopers(): Promise<LooperInfo[]> {
    const commandBuilder = this.oscHandler.getCommandBuilder();
    const loopers: LooperInfo[] = [];

    try {
      // Get number of tracks
      const numTracks = await commandBuilder.getNumTracks();
      console.log(`Found ${numTracks} tracks`);

      // Check each track for Looper devices
      for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
        try {
          // Get device class names for this track
          const deviceClassNames = await commandBuilder.getDeviceClassNames(trackIndex);
          
          // Find Looper devices
          deviceClassNames.forEach((className, deviceIndex) => {
            if (className === LOOPER_CLASS_NAME) {
              console.log(`Found Looper on track ${trackIndex}, device ${deviceIndex}`);
              // We'll get the track name in the next step
              loopers.push({
                trackIndex,
                deviceIndex,
                trackName: '', // Will be filled below
                id: `${trackIndex}-${deviceIndex}`,
              });
            }
          });
        } catch (error) {
          console.error(`Error checking track ${trackIndex}:`, error);
        }
      }

      // Get track names for found loopers
      for (const looper of loopers) {
        try {
          const trackName = await commandBuilder.getTrackName(looper.trackIndex);
          looper.trackName = trackName;
        } catch (error) {
          console.error(`Error getting name for track ${looper.trackIndex}:`, error);
          looper.trackName = `Track ${looper.trackIndex}`;
        }
      }

      console.log(`Total loopers found: ${loopers.length}`);
      return loopers;
    } catch (error) {
      console.error('Error finding loopers:', error);
      throw error;
    }
  }
}

