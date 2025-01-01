import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.burgerpizza.app',
  appName: 'Burger-Pizza',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    icon: 'icons/icon192.png'
  },
  ios: {
    icon: 'icons/icon192.png'
  }
};

export default config;
