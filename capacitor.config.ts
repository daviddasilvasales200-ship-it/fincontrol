import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fincontrol.app",
  appName: "FinControl",
  webDir: "capacitor-web",

  server: {
    url: "https://fincontrol-sigma-jet.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },

  android: {
    allowMixedContent: false,
    backgroundColor: "#000000",
  },
};

export default config;