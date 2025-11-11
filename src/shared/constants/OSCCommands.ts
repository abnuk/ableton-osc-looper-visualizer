export const OSCCommands = {
  // Application
  TEST: '/live/test',
  
  // Song
  GET_NUM_TRACKS: '/live/song/get/num_tracks',
  
  // Track
  GET_TRACK_NAME: '/live/track/get/name',
  GET_NUM_DEVICES: '/live/track/get/num_devices',
  GET_DEVICE_NAMES: '/live/track/get/devices/name',
  GET_DEVICE_TYPES: '/live/track/get/devices/type',
  GET_DEVICE_CLASS_NAMES: '/live/track/get/devices/class_name',
  
  // Device
  GET_DEVICE_NAME: '/live/device/get/name',
  GET_DEVICE_CLASS_NAME: '/live/device/get/class_name',
  GET_NUM_PARAMETERS: '/live/device/get/num_parameters',
  GET_PARAMETERS_NAME: '/live/device/get/parameters/name',
  GET_PARAMETERS_VALUE: '/live/device/get/parameters/value',
  GET_PARAMETER_VALUE: '/live/device/get/parameter/value',
  SET_PARAMETER_VALUE: '/live/device/set/parameter/value',
  START_LISTEN_PARAMETER: '/live/device/start_listen/parameter/value',
  STOP_LISTEN_PARAMETER: '/live/device/stop_listen/parameter/value',
} as const;

export const LOOPER_CLASS_NAME = 'Looper';

