/**
 * To strictly type all accessors and writers, remove
 *
 * [messageID: string]: any
 *
 * And replace with your entire state shape after codecs have decoded them.
 */
declare global {
  interface ElectricUIDeveloperState {
    [messageID: string]: any

    force: number
    disp: number
  }
  interface ElectricUIDeviceMetadataState {
    name: string
  }
}

// Export custom struct types for use in both codecs and the application
export type LEDSettings = {
  glow_time: number
  enable: number
}

// This exports these types into the dependency tree.
export {}
