import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.dubey.securejournal",
  appName: "Secure Journal",
  webDir: "dist",
  server: {
    url: "http://192.168.1.102:3000",
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
