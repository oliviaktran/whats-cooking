import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Schoolbell_400Regular, useFonts } from '@expo-google-fonts/schoolbell';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { RecipesProvider } from '@/contexts/recipes-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Schoolbell_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <RecipesProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </RecipesProvider>
  );
}
