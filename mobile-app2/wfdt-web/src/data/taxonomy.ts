export interface TaxonomyTab {
  id: string;
  label: string;
  items: string[];
}

export const proteinTabs: TaxonomyTab[] = [
  {
    id: "chicken",
    label: "🐔 Chicken",
    items: [
      "Chicken breast",
      "Chicken thighs",
      "Chicken mince",
      "Chicken drumsticks",
      "Chicken wings",
      "Turkey mince",
      "Turkey breast",
      "Duck",
      "Duck breast",
    ],
  },
  {
    id: "vegetarian",
    label: "🥬 Vegetarian",
    items: [
      "Tofu",
      "Tempeh",
      "Lentils",
      "Chickpeas",
      "Black beans",
      "Kidney beans",
      "Edamame",
      "Halloumi",
      "Eggs",
      "Paneer",
    ],
  },
  {
    id: "beef-lamb",
    label: "🥩 Beef & Lamb",
    items: [
      "Beef mince",
      "Beef strips",
      "Lamb mince",
      "Lamb chops",
      "Ribeye steak",
      "Sirloin",
      "Lamb shoulder",
      "Beef brisket",
    ],
  },
  {
    id: "seafood",
    label: "🐟 Seafood",
    items: [
      "Salmon fillets",
      "Tuna",
      "Prawns",
      "Cod",
      "Haddock",
      "Scallops",
      "Mussels",
      "Squid",
      "Sardines",
    ],
  },
];

export const carbTabs: TaxonomyTab[] = [
  {
    id: "pasta",
    label: "🍝 Pasta & Noodles",
    items: [
      "Pasta",
      "Spaghetti",
      "Penne",
      "Fettuccine",
      "Gnocchi",
      "Orzo",
      "Noodles",
      "Udon",
      "Soba",
      "Rice noodles",
      "Glass noodles",
      "Couscous",
      "Polenta",
    ],
  },
  {
    id: "rice",
    label: "🍚 Rice & Grains",
    items: [
      "Basmati rice",
      "Jasmine rice",
      "Brown rice",
      "Wild rice",
      "Quinoa",
      "Bulgur wheat",
      "Freekeh",
      "Pearl barley",
      "Millet",
    ],
  },
  {
    id: "bread",
    label: "🍞 Bread",
    items: [
      "Sourdough",
      "Pita",
      "Flatbread",
      "Naan",
      "Baguette",
      "Ciabatta",
      "Wraps",
      "Tortilla",
    ],
  },
];

export const vegetableTabs: TaxonomyTab[] = [
  {
    id: "all-year",
    label: "🥕 All year",
    items: [
      "Onion",
      "Red onion",
      "Garlic",
      "Celery",
      "Capsicum",
      "Spinach",
      "Baby spinach",
      "Broccoli",
      "Courgette",
      "Carrot",
      "Mushrooms",
      "Tomato",
      "Cherry tomatoes",
      "Cucumber",
      "Avocado",
    ],
  },
  {
    id: "summer",
    label: "☀️ Summer",
    items: [
      "Corn",
      "Zucchini",
      "Eggplant",
      "Asparagus",
      "Peas",
      "Broad beans",
      "Fennel",
    ],
  },
  {
    id: "autumn",
    label: "🍂 Autumn",
    items: [
      "Sweet potato",
      "Kumara",
      "Pumpkin",
      "Butternut squash",
      "Beetroot",
      "Parsnip",
      "Green beans",
      "Leek",
    ],
  },
  {
    id: "winter",
    label: "❄️ Winter",
    items: [
      "Kale",
      "Cavolo nero",
      "Brussels sprouts",
      "Celeriac",
      "Turnip",
      "Swede",
      "Cauliflower",
    ],
  },
];

export const cuisineOptions = [
  "Any",
  "Italian",
  "Asian",
  "Mexican",
  "Middle Eastern",
  "Indian",
  "Japanese",
  "French",
  "American",
  "Mediterranean",
] as const;
