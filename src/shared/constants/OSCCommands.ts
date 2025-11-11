export const OSCCommands = {
  // Application
  TEST: '/live/test',
  
  // Song
  GET_NUM_TRACKS: '/live/song/get/num_tracks',
  GET_NUM_SCENES: '/live/song/get/num_scenes',
  
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
  
  // Clip Slot
  GET_HAS_CLIP: '/live/clip_slot/get/has_clip',
  START_LISTEN_HAS_CLIP: '/live/clip_slot/start_listen/has_clip',
  STOP_LISTEN_HAS_CLIP: '/live/clip_slot/stop_listen/has_clip',
  
  // Clip
  GET_CLIP_IS_PLAYING: '/live/clip/get/is_playing',
  GET_CLIP_IS_RECORDING: '/live/clip/get/is_recording',
  GET_CLIP_PLAYING_POSITION: '/live/clip/get/playing_position',
  GET_CLIP_LENGTH: '/live/clip/get/length',
  START_LISTEN_CLIP_IS_PLAYING: '/live/clip/start_listen/is_playing',
  STOP_LISTEN_CLIP_IS_PLAYING: '/live/clip/stop_listen/is_playing',
  START_LISTEN_CLIP_IS_RECORDING: '/live/clip/start_listen/is_recording',
  STOP_LISTEN_CLIP_IS_RECORDING: '/live/clip/stop_listen/is_recording',
  START_LISTEN_CLIP_PLAYING_POSITION: '/live/clip/start_listen/playing_position',
  STOP_LISTEN_CLIP_PLAYING_POSITION: '/live/clip/stop_listen/playing_position',
} as const;

export const LOOPER_CLASS_NAME = 'Looper';

