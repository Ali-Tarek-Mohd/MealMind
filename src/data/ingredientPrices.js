const ingredientPriceData = {
  kuwait: {
    currency: "KWD",
    ingredients: {
      Chicken: { price: 1.25, package: "500g" },
      Beef: { price: 1.75, package: "500g" },
      "Ground Beef": { price: 1.6, package: "500g" },
      Salmon: { price: 2.75, package: "250g" },
      Shrimp: { price: 2.25, package: "300g" },
      Tuna: { price: 0.45, package: "1 can" },

      Rice: { price: 0.65, package: "1kg" },
      Pasta: { price: 0.45, package: "500g" },
      Noodles: { price: 0.55, package: "1 pack" },
      Bread: { price: 0.35, package: "1 pack" },
      Wraps: { price: 0.55, package: "1 pack" },
      Tortillas: { price: 0.6, package: "1 pack" },
      Oats: { price: 0.75, package: "500g" },
      Cereal: { price: 1.2, package: "1 box" },
      Flour: { price: 0.45, package: "1kg" },

      Eggs: { price: 0.85, package: "12 pieces" },
      Milk: { price: 0.45, package: "1 litre" },
      "Greek Yogurt": { price: 0.75, package: "500g" },
      Yogurt: { price: 0.45, package: "500g" },
      Cheese: { price: 0.7, package: "1 pack" },
      Butter: { price: 0.75, package: "200g" },
      Cream: { price: 0.55, package: "250ml" },

      Tomatoes: { price: 0.35, package: "500g" },
      Onion: { price: 0.25, package: "500g" },
      Garlic: { price: 0.2, package: "1 bulb" },
      Lettuce: { price: 0.35, package: "1 head" },
      Cucumber: { price: 0.25, package: "500g" },
      "Bell Pepper": { price: 0.45, package: "3 pieces" },
      Carrots: { price: 0.35, package: "500g" },
      Broccoli: { price: 0.75, package: "500g" },
      Spinach: { price: 0.55, package: "1 bunch" },
      Potatoes: { price: 0.45, package: "1kg" },
      Corn: { price: 0.35, package: "1 can" },
      Beans: { price: 0.35, package: "1 can" },
      Lentils: { price: 0.45, package: "500g" },
      Chickpeas: { price: 0.35, package: "1 can" },
      Falafel: { price: 0.8, package: "1 pack" },
      Pickles: { price: 0.45, package: "1 jar" },
      Avocado: { price: 0.45, package: "1 piece" },

      Banana: { price: 0.3, package: "1 bunch" },
      Apple: { price: 0.35, package: "500g" },
      Orange: { price: 0.35, package: "500g" },
      Berries: { price: 0.95, package: "250g" },
      Honey: { price: 0.8, package: "1 bottle" },
      Nuts: { price: 0.95, package: "200g" },
      Sugar: { price: 0.3, package: "1kg" },
      "Peanut Butter": { price: 0.95, package: "1 jar" },

      "Olive Oil": { price: 1.1, package: "250ml" },
      "Sesame Oil": { price: 0.95, package: "150ml" },
      "Soy Sauce": { price: 0.75, package: "1 bottle" },
      "Caesar Sauce": { price: 0.85, package: "1 bottle" },
      "Tahini Sauce": { price: 0.75, package: "1 jar" },
      Lemon: { price: 0.25, package: "3 pieces" },
      Lime: { price: 0.25, package: "3 pieces" },
      Vinegar: { price: 0.35, package: "1 bottle" },

      "Black Pepper": { price: 0.55, package: "1 jar" },
      Paprika: { price: 0.45, package: "1 jar" },
      Cinnamon: { price: 0.45, package: "1 jar" },
      Cumin: { price: 0.45, package: "1 jar" },
      "Curry Powder": { price: 0.55, package: "1 jar" },
      "Garam Masala": { price: 0.6, package: "1 jar" },
      "Kabsa Spice": { price: 0.65, package: "1 jar" },
      "Biryani Spice": { price: 0.65, package: "1 jar" },
      "Taco Seasoning": { price: 0.45, package: "1 pack" },
      "Italian Herbs": { price: 0.55, package: "1 jar" },
      Cardamom: { price: 0.75, package: "1 jar" },
      Ginger: { price: 0.25, package: "100g" },
      Mint: { price: 0.3, package: "1 bunch" },
      Parsley: { price: 0.25, package: "1 bunch" },
      "Sesame Seeds": { price: 0.55, package: "1 pack" },
      "Spring Onion": { price: 0.25, package: "1 bunch" },

      "Frozen Fries": { price: 0.95, package: "750g" },
    },
  },
};

const ingredientAliases = {
  tomato: "Tomatoes",
  tomatoes: "Tomatoes",
  onion: "Onion",
  onions: "Onion",
  garlic: "Garlic",
  lettuce: "Lettuce",
  cucumber: "Cucumber",
  cucumbers: "Cucumber",
  pepper: "Bell Pepper",
  peppers: "Bell Pepper",
  "bell pepper": "Bell Pepper",
  "bell peppers": "Bell Pepper",
  carrot: "Carrots",
  carrots: "Carrots",
  potato: "Potatoes",
  potatoes: "Potatoes",
  egg: "Eggs",
  eggs: "Eggs",
  wrap: "Wraps",
  wraps: "Wraps",
  tortilla: "Tortillas",
  tortillas: "Tortillas",
  tuna: "Tuna",
  chicken: "Chicken",
  beef: "Beef",
  "ground beef": "Ground Beef",
  salmon: "Salmon",
  shrimp: "Shrimp",
  rice: "Rice",
  pasta: "Pasta",
  noodles: "Noodles",
  bread: "Bread",
  oats: "Oats",
  cereal: "Cereal",
  flour: "Flour",
  milk: "Milk",
  cheese: "Cheese",
  butter: "Butter",
  cream: "Cream",
  yogurt: "Yogurt",
  "greek yogurt": "Greek Yogurt",
  broccoli: "Broccoli",
  spinach: "Spinach",
  corn: "Corn",
  beans: "Beans",
  lentils: "Lentils",
  chickpeas: "Chickpeas",
  falafel: "Falafel",
  pickles: "Pickles",
  avocado: "Avocado",
  banana: "Banana",
  apple: "Apple",
  orange: "Orange",
  berries: "Berries",
  honey: "Honey",
  nuts: "Nuts",
  sugar: "Sugar",
  "peanut butter": "Peanut Butter",
  oil: "Olive Oil",
  "olive oil": "Olive Oil",
  "sesame oil": "Sesame Oil",
  "soy sauce": "Soy Sauce",
  "caesar sauce": "Caesar Sauce",
  "tahini sauce": "Tahini Sauce",
  lemon: "Lemon",
  lime: "Lime",
  vinegar: "Vinegar",
  "black pepper": "Black Pepper",
  paprika: "Paprika",
  cinnamon: "Cinnamon",
  cumin: "Cumin",
  curry: "Curry Powder",
  "curry powder": "Curry Powder",
  "garam masala": "Garam Masala",
  "kabsa spice": "Kabsa Spice",
  "biryani spice": "Biryani Spice",
  "taco seasoning": "Taco Seasoning",
  "italian herbs": "Italian Herbs",
  cardamom: "Cardamom",
  ginger: "Ginger",
  mint: "Mint",
  parsley: "Parsley",
  "sesame seeds": "Sesame Seeds",
  "spring onion": "Spring Onion",
  "spring onions": "Spring Onion",
  fries: "Frozen Fries",
  "frozen fries": "Frozen Fries",
};

const nutritionData = {
  Chicken: { calories: 330, protein: 62, carbs: 0, fat: 7 },
  Beef: { calories: 420, protein: 48, carbs: 0, fat: 24 },
  "Ground Beef": { calories: 430, protein: 42, carbs: 0, fat: 28 },
  Salmon: { calories: 360, protein: 39, carbs: 0, fat: 22 },
  Shrimp: { calories: 180, protein: 38, carbs: 2, fat: 2 },
  Tuna: { calories: 130, protein: 28, carbs: 0, fat: 1 },

  Rice: { calories: 260, protein: 5, carbs: 57, fat: 1 },
  Pasta: { calories: 330, protein: 12, carbs: 65, fat: 2 },
  Noodles: { calories: 350, protein: 10, carbs: 65, fat: 6 },
  Bread: { calories: 180, protein: 6, carbs: 32, fat: 3 },
  Wraps: { calories: 190, protein: 6, carbs: 32, fat: 5 },
  Tortillas: { calories: 190, protein: 5, carbs: 31, fat: 5 },
  Oats: { calories: 230, protein: 8, carbs: 40, fat: 5 },
  Cereal: { calories: 180, protein: 4, carbs: 38, fat: 2 },
  Flour: { calories: 180, protein: 5, carbs: 38, fat: 1 },

  Eggs: { calories: 155, protein: 13, carbs: 1, fat: 11 },
  Milk: { calories: 120, protein: 8, carbs: 12, fat: 5 },
  "Greek Yogurt": { calories: 140, protein: 18, carbs: 8, fat: 4 },
  Yogurt: { calories: 130, protein: 9, carbs: 15, fat: 4 },
  Cheese: { calories: 160, protein: 10, carbs: 2, fat: 13 },
  Butter: { calories: 100, protein: 0, carbs: 0, fat: 11 },
  Cream: { calories: 160, protein: 2, carbs: 3, fat: 16 },

  Tomatoes: { calories: 35, protein: 2, carbs: 7, fat: 0 },
  Onion: { calories: 40, protein: 1, carbs: 9, fat: 0 },
  Garlic: { calories: 15, protein: 1, carbs: 3, fat: 0 },
  Lettuce: { calories: 10, protein: 1, carbs: 2, fat: 0 },
  Cucumber: { calories: 15, protein: 1, carbs: 3, fat: 0 },
  "Bell Pepper": { calories: 25, protein: 1, carbs: 6, fat: 0 },
  Carrots: { calories: 45, protein: 1, carbs: 10, fat: 0 },
  Broccoli: { calories: 45, protein: 4, carbs: 9, fat: 1 },
  Spinach: { calories: 25, protein: 3, carbs: 4, fat: 0 },
  Potatoes: { calories: 160, protein: 4, carbs: 37, fat: 0 },
  Corn: { calories: 90, protein: 3, carbs: 20, fat: 1 },
  Beans: { calories: 170, protein: 10, carbs: 30, fat: 1 },
  Lentils: { calories: 230, protein: 18, carbs: 40, fat: 1 },
  Chickpeas: { calories: 210, protein: 11, carbs: 35, fat: 4 },
  Falafel: { calories: 260, protein: 10, carbs: 28, fat: 13 },
  Pickles: { calories: 10, protein: 0, carbs: 2, fat: 0 },
  Avocado: { calories: 160, protein: 2, carbs: 9, fat: 15 },

  Banana: { calories: 105, protein: 1, carbs: 27, fat: 0 },
  Apple: { calories: 95, protein: 0, carbs: 25, fat: 0 },
  Orange: { calories: 62, protein: 1, carbs: 15, fat: 0 },
  Berries: { calories: 70, protein: 1, carbs: 17, fat: 0 },
  Honey: { calories: 60, protein: 0, carbs: 17, fat: 0 },
  Nuts: { calories: 180, protein: 6, carbs: 6, fat: 16 },
  Sugar: { calories: 50, protein: 0, carbs: 13, fat: 0 },
  "Peanut Butter": { calories: 190, protein: 8, carbs: 7, fat: 16 },

  "Olive Oil": { calories: 120, protein: 0, carbs: 0, fat: 14 },
  "Sesame Oil": { calories: 120, protein: 0, carbs: 0, fat: 14 },
  "Soy Sauce": { calories: 10, protein: 1, carbs: 1, fat: 0 },
  "Caesar Sauce": { calories: 90, protein: 1, carbs: 2, fat: 9 },
  "Tahini Sauce": { calories: 90, protein: 3, carbs: 3, fat: 8 },
  Lemon: { calories: 10, protein: 0, carbs: 3, fat: 0 },
  Lime: { calories: 10, protein: 0, carbs: 3, fat: 0 },
  Vinegar: { calories: 5, protein: 0, carbs: 0, fat: 0 },

  "Black Pepper": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Paprika: { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Cinnamon: { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Cumin: { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Curry Powder": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Garam Masala": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Kabsa Spice": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Biryani Spice": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Taco Seasoning": { calories: 10, protein: 0, carbs: 2, fat: 0 },
  "Italian Herbs": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Cardamom: { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Ginger: { calories: 5, protein: 0, carbs: 1, fat: 0 },
  Mint: { calories: 2, protein: 0, carbs: 0, fat: 0 },
  Parsley: { calories: 2, protein: 0, carbs: 0, fat: 0 },
  "Sesame Seeds": { calories: 50, protein: 2, carbs: 2, fat: 4 },
  "Spring Onion": { calories: 5, protein: 0, carbs: 1, fat: 0 },

  "Frozen Fries": { calories: 260, protein: 4, carbs: 35, fat: 12 },
};

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function titleCaseIngredient(value) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function normalizeIngredientName(ingredientName) {
  const rawName =
    typeof ingredientName === "string"
      ? ingredientName
      : ingredientName?.ingredient ||
        ingredientName?.name ||
        ingredientName?.itemName ||
        ingredientName?.label ||
        ingredientName?.title ||
        ingredientName?.food ||
        "";

  const cleanName = String(rawName).trim();

  if (!cleanName) {
    return "Unknown Ingredient";
  }

  const normalized = normalizeText(cleanName);

  if (ingredientAliases[normalized]) {
    return ingredientAliases[normalized];
  }

  const regionIngredients = ingredientPriceData.kuwait.ingredients;
  const exactMatch = Object.keys(regionIngredients).find(
    (ingredient) => normalizeText(ingredient) === normalized
  );

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = Object.keys(regionIngredients).find((ingredient) => {
    const normalizedIngredient = normalizeText(ingredient);
    return (
      normalized.includes(normalizedIngredient) ||
      normalizedIngredient.includes(normalized)
    );
  });

  if (partialMatch) {
    return partialMatch;
  }

  return titleCaseIngredient(cleanName);
}

export function getIngredientPrice(ingredientName, region = "kuwait") {
  const regionData = ingredientPriceData[region] ?? ingredientPriceData.kuwait;
  const cleanIngredientName = normalizeIngredientName(ingredientName);
  const item = regionData.ingredients[cleanIngredientName];

  if (!item) {
    return {
      ingredient: cleanIngredientName,
      name: cleanIngredientName,
      itemName: cleanIngredientName,
      price: 0.35,
      package: "1 item",
      quantity: "1 item",
      currency: regionData.currency,
      estimated: true,
    };
  }

  return {
    ingredient: cleanIngredientName,
    name: cleanIngredientName,
    itemName: cleanIngredientName,
    price: item.price,
    package: item.package,
    quantity: item.package,
    currency: regionData.currency,
    estimated: false,
  };
}

export function calculateMissingIngredientCost(ingredients, region = "kuwait") {
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

  const pricedItems = safeIngredients.map((ingredient) =>
    getIngredientPrice(ingredient, region)
  );

  const total = pricedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const currency = ingredientPriceData[region]?.currency ?? "KWD";

  return {
    items: pricedItems,
    total,
    currency,
    label: `${total.toFixed(3)} ${currency} extra`,
  };
}

export function estimateMealNutrition(ingredients) {
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

  const totals = safeIngredients.reduce(
    (sum, ingredient) => {
      const cleanIngredientName = normalizeIngredientName(ingredient);
      const nutrition = nutritionData[cleanIngredientName];

      if (!nutrition) {
        return sum;
      }

      return {
        calories: sum.calories + nutrition.calories,
        protein: sum.protein + nutrition.protein,
        carbs: sum.carbs + nutrition.carbs,
        fat: sum.fat + nutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}