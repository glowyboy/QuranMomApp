// Dummy file for EAS Build compatibility
// This project uses Vite + Capacitor, not Expo's Metro bundler
// The actual app is built with Vite and lives in android/app/src/main/assets/public

import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>This is a Capacitor app. Use the native build.</Text>
    </View>
  );
}
