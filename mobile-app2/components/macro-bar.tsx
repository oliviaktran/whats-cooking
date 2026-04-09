import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Macros = { protein: number; carbs: number; fat: number };

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function MacroBar({ macros }: { macros: Macros }) {
  const stroke = useThemeColor({ light: '#E5E7EB', dark: '#2C2C2E' }, 'icon');
  const p = clamp(macros.protein);
  const c = clamp(macros.carbs);
  const f = clamp(macros.fat);
  const total = p + c + f || 1;

  const wP = (p / total) * 100;
  const wC = (c / total) * 100;
  const wF = (f / total) * 100;

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { borderColor: stroke }]}>
        <View style={[styles.segP, { width: `${wP}%` }]} />
        <View style={[styles.segC, { width: `${wC}%` }]} />
        <View style={[styles.segF, { width: `${wF}%` }]} />
      </View>
      <View style={styles.legend}>
        <ThemedText style={styles.legendItem}>P {p}%</ThemedText>
        <ThemedText style={styles.legendItem}>C {c}%</ThemedText>
        <ThemedText style={styles.legendItem}>F {f}%</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  segP: { backgroundColor: '#60A5FA', height: '100%' },
  segC: { backgroundColor: '#34D399', height: '100%' },
  segF: { backgroundColor: '#F59E0B', height: '100%' },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { fontSize: 13, opacity: 0.85 },
});

