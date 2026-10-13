// Included only in the Capacitor build. The public PWA has no native dependencies.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

window.EinsatzNative = {
  isNative: () => Capacitor.isNativePlatform(),
  haptic: () => Haptics.impact({ style: ImpactStyle.Medium }),
  async appearance(dark) {
    const operations = [StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })];
    // Background-color changes are not supported on iOS.
    if (Capacitor.getPlatform() === 'android') operations.push(StatusBar.setBackgroundColor({ color: dark ? '#0e1622' : '#f3f5f9' }));
    await Promise.allSettled(operations);
  },
  hideSplash: () => SplashScreen.hide()
};
