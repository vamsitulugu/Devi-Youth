import type { CapacitorConfig } from '@capacitor/cli';

// Same pattern as Twin Hearts: the native shell points at the live
// deployment instead of bundling a built copy of the web app. That
// means every time you push to Vercel, everyone with the installed
// app gets the update immediately, the next time they open it — no
// rebuilding the APK, no re-submitting to the Play Store, for
// anything except icon/permission/native-plugin changes.
const config: CapacitorConfig = {
  appId: 'com.deviyouth.app',
  appName: 'Devi Youth',
  webDir: 'dist',
  server: {
    url: 'https://deviyouth.vercel.app',
    androidScheme: 'https',
    // Allows navigation to stay inside the app when someone taps a
    // link that goes to deviyouth.vercel.app (which is everything —
    // this app only ever links to itself and to WhatsApp).
    cleartext: false,
  },
  android: {
    backgroundColor: '#C22B1F', // matches the vermillion splash background
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // the web app's own <Splash/> component handles this instead
      backgroundColor: '#C22B1F',
    },
  },
};

export default config;
