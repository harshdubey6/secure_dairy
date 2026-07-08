import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.dubey.securejournal",
  appName: "Secure Journal",
  webDir: "dist",
  server: {
    url: "https://secure-dairy.vercel.app/",
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: "secure-journal.keystore",
      keystoreAlias: "secure-journal",
      keystorePassword: "journal123",
      keystoreAliasPassword: "journal123",
    },
  },
};

export default config;
