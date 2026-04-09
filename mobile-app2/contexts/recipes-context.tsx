import React, { createContext, useContext, useMemo, useState } from 'react';

import type { Recipe } from '@/lib/types/recipe';

type RecipesContextValue = {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const value = useMemo(() => ({ recipes, setRecipes }), [recipes]);
  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) {
    throw new Error('useRecipes must be used within RecipesProvider');
  }
  return ctx;
}
