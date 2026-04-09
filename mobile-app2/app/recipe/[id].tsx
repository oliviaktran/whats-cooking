import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MacroBar } from '@/components/macro-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRecipes } from '@/contexts/recipes-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useRecipes();
  const navigation = useNavigation();
  const muted = useThemeColor({}, 'icon');
  const ingredientDivider = useThemeColor(
    { light: '#C9C2B6', dark: '#3D3D3F' },
    'icon',
  );
  const pageBg = useThemeColor({ light: '#F3EEE5', dark: '#151718' }, 'background');
  const accent = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({ light: '#F7F2EA', dark: '#1C1C1E' }, 'background');

  const recipe = useMemo(
    () => recipes.find((r) => r.id === decodeURIComponent(id ?? '')),
    [recipes, id],
  );

  useEffect(() => {
    if (recipe?.title) {
      navigation.setOptions({ title: recipe.title });
    }
  }, [navigation, recipe?.title]);

  if (!recipe) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Recipe not found</ThemedText>
        <ThemedText style={{ color: muted, marginTop: 8 }}>
          Generate ideas on the Home tab first, then open a card from the list.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: pageBg }]}>
      <ThemedView style={[styles.hero, { backgroundColor: pageBg }]}>
        <View style={styles.heroTopRow}>
          <ThemedText style={styles.emoji}>{recipe.emoji}</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {}}
            style={[styles.exportBtn, { borderColor: muted }]}>
            <ThemedText style={[styles.exportText, { color: muted }]}>
              ↑ Export ingredients
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText type="title" style={styles.title}>
          {recipe.title}
        </ThemedText>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <ThemedText style={styles.badgeText}>⏱ {recipe.cookTime}</ThemedText>
          </View>
          <View style={[styles.badgeOutline, { borderColor: muted }]}>
            <ThemedText style={[styles.badgeText, { color: muted }]}>
              {recipe.difficulty}
            </ThemedText>
          </View>
          <View style={[styles.badgeOutline, { borderColor: muted }]}>
            <ThemedText style={[styles.badgeText, { color: muted }]}>
              🔥 {recipe.calories} kcal
            </ThemedText>
          </View>
        </View>
        <MacroBar macros={recipe.macros} />
        <ThemedText style={{ color: muted, marginTop: 6 }}>{recipe.description}</ThemedText>
      </ThemedView>

      <ThemedView style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: muted }]}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText type="subtitle">Ingredients</ThemedText>
          <ThemedText style={[styles.smallMuted, { color: muted }]}>swap or remove</ThemedText>
        </View>
        {recipe.ingredients.map((ing, index) => (
          <View
            key={ing.id}
            style={[
              styles.ingRow,
              index < recipe.ingredients.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: ingredientDivider,
              },
            ]}>
            <ThemedText style={styles.line}>
              {ing.quantity} {ing.name}
            </ThemedText>
            <View style={styles.ingActions}>
              <View style={[styles.iconBtn, { backgroundColor: accent }]}>
                <ThemedText style={styles.iconText}>⇄</ThemedText>
              </View>
              <View style={[styles.iconBtn, { borderColor: muted }]}>
                <ThemedText style={[styles.iconText, { color: muted }]}>×</ThemedText>
              </View>
            </View>
          </View>
        ))}
      </ThemedView>

      <ThemedView style={[styles.section, { backgroundColor: pageBg }]}>
        <ThemedText type="subtitle">Method</ThemedText>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: accent }]}>
              <ThemedText style={styles.stepDotText}>{i + 1}</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>{step}</ThemedText>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  title: {
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeOutline: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },
  sectionCard: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  smallMuted: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  ingRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  ingActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  line: {
    fontSize: 16,
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
