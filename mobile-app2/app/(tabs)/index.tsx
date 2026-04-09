import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { MacroBar } from '@/components/macro-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRecipes } from '@/contexts/recipes-context';
import { generateMeals, getWfdtApiBaseUrl } from '@/lib/api/wfdtGenerate';
import { useThemeColor } from '@/hooks/use-theme-color';

import { carbTabs, cuisineOptions, proteinTabs, vegetableTabs } from '@/wfdt-web/src/data/taxonomy';
import { MACRO_PRESETS } from '@/wfdt-web/src/data/macroPresets';

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function HomeScreen() {
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({ light: '#E5E7EB', dark: '#2C2C2E' }, 'icon');
  const inputBg = useThemeColor({ light: '#F9FAFB', dark: '#1C1C1E' }, 'background');
  const placeholderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const pageBg = useThemeColor({ light: '#F3EEE5', dark: '#151718' }, 'background');
  const accent = tint;
  const cardBg = useThemeColor({ light: '#F7F2EA', dark: '#1C1C1E' }, 'background');

  const { recipes, setRecipes } = useRecipes();
  const [freeText, setFreeText] = useState('');
  const [servings, setServings] = useState(2);
  const [calories, setCalories] = useState(500);
  const [cuisine, setCuisine] = useState<string>('Any');
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedCarbs, setSelectedCarbs] = useState<string[]>([]);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);
  const [macroPreset, setMacroPreset] = useState(MACRO_PRESETS[0]?.id ?? 'balanced');
  const activePreset = MACRO_PRESETS.find((p) => p.id === macroPreset) ?? MACRO_PRESETS[0]!;
  const macros = activePreset.macros;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const cuisineValue =
        (cuisineOptions as readonly string[]).includes(cuisine) ? cuisine : 'Any';
      const recipes = await generateMeals({
        servings,
        selectedProteins,
        selectedCarbs,
        selectedVegetables,
        calories,
        macros,
        freeText: freeText.trim(),
        cuisine: cuisineValue.toLowerCase() === 'any' ? 'any' : cuisineValue,
      });
      setRecipes(recipes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [
    calories,
    freeText,
    macros,
    selectedCarbs,
    selectedProteins,
    selectedVegetables,
    servings,
    setRecipes,
    cuisine,
  ]);

  const apiHint = getWfdtApiBaseUrl() || '(set EXPO_PUBLIC_WFDT_API_URL)';

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <ThemedView style={styles.header}>
        <ThemedText
          type="title"
          lightColor="#690507"
          darkColor="#690507"
          style={{ fontFamily: 'Schoolbell_400Regular' }}>
          🍴 What’s Cooking?
        </ThemedText>
        <ThemedText style={styles.sub}>
          Calls your wfdt-web `/api/generate` endpoint. Dev default: {apiHint}
        </ThemedText>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Basics</ThemedText>
        <View style={styles.row}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Servings</ThemedText>
            <TextInput
              value={String(servings)}
              onChangeText={(t) => setServings(Math.min(12, Math.max(1, Number(t.replace(/[^\d]/g, '')) || 1)))}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              style={[styles.smallInput, { borderColor: border, backgroundColor: inputBg, color: textColor }]}
            />
          </View>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Calories / serving</ThemedText>
            <TextInput
              value={String(calories)}
              onChangeText={(t) => setCalories(Math.min(1500, Math.max(200, Number(t.replace(/[^\d]/g, '')) || 500)))}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              style={[styles.smallInput, { borderColor: border, backgroundColor: inputBg, color: textColor }]}
            />
          </View>
        </View>

        <ThemedText style={styles.label}>Cuisine</ThemedText>
        <View style={styles.chips}>
          {cuisineOptions.map((c) => {
            const selected = c === cuisine;
            return (
              <Pressable
                key={c}
                onPress={() => setCuisine(c)}
                style={[
                  styles.chip,
                  {
                    borderColor: border,
                    backgroundColor: selected ? tint : 'transparent',
                  },
                ]}>
                <ThemedText style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                  {c}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Macros</ThemedText>
        <View style={styles.chips}>
          {MACRO_PRESETS.map((p) => {
            const selected = p.id === macroPreset;
            return (
              <Pressable
                key={p.id}
                onPress={() => setMacroPreset(p.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: border,
                    backgroundColor: selected ? tint : 'transparent',
                  },
                ]}>
                <ThemedText style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                  {p.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText style={styles.metaLine}>
          Using {macros.protein}/{macros.carbs}/{macros.fat} (P/C/F)
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Ingredients</ThemedText>

        <View style={[styles.ingredientGroup, styles.ingredientGroupFirst]}>
          <ThemedText style={styles.label}>Proteins</ThemedText>
          <View style={styles.chips}>
            {proteinTabs.flatMap((t) => t.items).slice(0, 14).map((item) => {
              const selected = selectedProteins.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedProteins((cur) => toggleItem(cur, item))}
                  style={[
                    styles.chip,
                    { borderColor: border, backgroundColor: selected ? tint : 'transparent' },
                  ]}>
                  <ThemedText style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                    {item}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.ingredientGroup}>
          <ThemedText style={styles.label}>Carbs</ThemedText>
          <View style={styles.chips}>
            {carbTabs.flatMap((t) => t.items).slice(0, 14).map((item) => {
              const selected = selectedCarbs.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedCarbs((cur) => toggleItem(cur, item))}
                  style={[
                    styles.chip,
                    { borderColor: border, backgroundColor: selected ? tint : 'transparent' },
                  ]}>
                  <ThemedText style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                    {item}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.ingredientGroup}>
          <ThemedText style={styles.label}>Veggies</ThemedText>
          <View style={styles.chips}>
            {vegetableTabs.flatMap((t) => t.items).slice(0, 18).map((item) => {
              const selected = selectedVegetables.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedVegetables((cur) => toggleItem(cur, item))}
                  style={[
                    styles.chip,
                    { borderColor: border, backgroundColor: selected ? tint : 'transparent' },
                  ]}>
                  <ThemedText style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                    {item}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ThemedText style={[styles.metaLine, styles.ingredientsMetaLine]}>
          Selected: {selectedProteins.length} proteins · {selectedCarbs.length} carbs · {selectedVegetables.length} veg
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Notes for the chef (optional)</ThemedText>
        <TextInput
          value={freeText}
          onChangeText={setFreeText}
          placeholder="Allergies, preferences, what’s in the fridge…"
          placeholderTextColor={placeholderColor}
          multiline
          style={[
            styles.input,
            {
              borderColor: border,
              backgroundColor: inputBg,
              color: textColor,
            },
          ]}
        />
      </ThemedView>

      <Pressable
        onPress={() => void onGenerate()}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tint, opacity: loading ? 0.6 : pressed ? 0.85 : 1 },
        ]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonLabel}>Generate meal</ThemedText>
        )}
      </Pressable>

      {error ? (
        <ThemedText style={styles.error} accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      {recipes.length > 0 ? (
        <ThemedView style={styles.results}>
          <ThemedText type="subtitle" style={styles.resultsHeading}>
            Here’s what you can make
          </ThemedText>
          {recipes.map((r) => (
            <Link
              key={r.id}
              href={{ pathname: '/recipe/[id]', params: { id: r.id } }}
              asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${r.title}, view recipe`}
                accessibilityHint="Opens full recipe"
                style={({ pressed }) => [
                  styles.card,
                  {
                    borderColor: r.isTopPick ? accent : border,
                    borderWidth: r.isTopPick ? 2 : 1,
                    opacity: pressed ? 0.9 : 1,
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  {r.isTopPick ? (
                    <View style={[styles.topPickPill, { backgroundColor: accent }]}>
                      <ThemedText style={styles.topPickPillText}>Top pick</ThemedText>
                    </View>
                  ) : (
                    <View />
                  )}
                  <View style={[styles.cardArrow, { backgroundColor: accent }]}>
                    <ThemedText style={styles.cardArrowText}>→</ThemedText>
                  </View>
                </View>

                <View style={styles.cardTitleRow}>
                  <ThemedText style={styles.cardEmoji}>{r.emoji}</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {r.title}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardDesc} numberOfLines={3}>
                  {r.description}
                </ThemedText>
                <View style={styles.cardMetaRow}>
                  <ThemedText style={[styles.cardMeta, { color: placeholderColor }]}>
                    ⏱ {r.cookTime}
                  </ThemedText>
                  <ThemedText style={[styles.cardMeta, { color: placeholderColor }]}>
                    {r.difficulty}
                  </ThemedText>
                  <ThemedText style={[styles.cardMeta, { color: placeholderColor }]}>
                    🔥 {r.calories} kcal
                  </ThemedText>
                </View>
                <MacroBar macros={r.macros} />
                <ThemedText style={[styles.viewRecipe, { color: textColor }]}>
                  View recipe →
                </ThemedText>
              </Pressable>
            </Link>
          ))}
        </ThemedView>
      ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    marginBottom: 20,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  block: {
    gap: 10,
    marginBottom: 20,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.85,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientGroup: {
    gap: 8,
    marginTop: 24,
  },
  ingredientGroupFirst: {
    marginTop: 0,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    marginBottom: 16,
    fontSize: 15,
  },
  metaLine: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  ingredientsMetaLine: {
    marginTop: 24,
  },
  results: {
    gap: 16,
    marginTop: 8,
  },
  resultsHeading: {
    marginBottom: 4,
  },
  card: {
    gap: 12,
    borderRadius: 14,
    padding: 16,
    alignItems: 'stretch',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  cardEmoji: {
    fontSize: 36,
    lineHeight: 40,
    flexShrink: 0,
  },
  topPickPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  topPickPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#faf8f5',
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#faf8f5',
  },
  cardTitleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardMeta: {
    fontSize: 13,
  },
  viewRecipe: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
});
