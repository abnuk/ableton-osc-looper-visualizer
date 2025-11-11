export interface AppConfig {
  hostname: string;
  sendPort: number;
  receivePort: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  hostname: 'localhost',
  sendPort: 11000,
  receivePort: 11001,
};

