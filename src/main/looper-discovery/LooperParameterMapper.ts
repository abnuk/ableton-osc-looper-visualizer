import { OSCMessageHandler } from '../osc-client/OSCMessageHandler';
import { LooperInfo } from '../../shared/types/LooperState';

export class LooperParameterMapper {
  private parameterMappings: Map<string, { [key: string]: number }> = new Map();

  constructor(private oscHandler: OSCMessageHandler) {}

  public async researchLooperParameters(looper: LooperInfo): Promise<void> {
    const commandBuilder = this.oscHandler.getCommandBuilder();
    
    try {
      console.log(`\n🔬 === Researching Looper Parameters for "${looper.trackName}" ===`);
      console.log(`   Track index: ${looper.trackIndex}, Device index: ${looper.deviceIndex}`);
      
      // Get all parameter names
      console.log('   📥 Requesting parameter names...');
      const paramNames = await commandBuilder.getParameterNames(
        looper.trackIndex,
        looper.deviceIndex
      );
      
      console.log(`\n✅ Found ${paramNames.length} parameters:`);
      paramNames.forEach((name, index) => {
        console.log(`     [${index}] "${name}"`);
      });

      // Get all parameter values
      console.log('\n   📥 Requesting parameter values...');
      const paramValues = await commandBuilder.getParameterValues(
        looper.trackIndex,
        looper.deviceIndex
      );

      console.log(`\n📊 Current parameter values:`);
      paramNames.forEach((name, index) => {
        console.log(`     [${index}] "${name}": ${paramValues[index]}`);
      });

      // Create a mapping of parameter names to indices
      const mapping: { [key: string]: number } = {};
      paramNames.forEach((name, index) => {
        mapping[name] = index;
      });

      this.parameterMappings.set(looper.id, mapping);

      console.log(`\n✅ === Research Complete ===`);
      console.log(`   Stored ${Object.keys(mapping).length} parameter mappings\n`);
    } catch (error) {
      console.error('❌ Error researching looper parameters:', error);
      throw error;
    }
  }

  public getParameterIndex(looperId: string, parameterName: string): number | undefined {
    const mapping = this.parameterMappings.get(looperId);
    return mapping ? mapping[parameterName] : undefined;
  }

  public getParameterMappings(looperId: string): { [key: string]: number } | undefined {
    return this.parameterMappings.get(looperId);
  }

  public async getAllParameterMappings(loopers: LooperInfo[]): Promise<void> {
    for (const looper of loopers) {
      await this.researchLooperParameters(looper);
    }
  }
}

