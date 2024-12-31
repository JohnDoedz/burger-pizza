import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.burgerpizza.app',
  appName: 'Burger-Pizza',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
