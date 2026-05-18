export const expiringItems = [
  { name: "Chicken", days: 3, tag: "Use first" },
  { name: "Tomatoes", days: 4, tag: "Good for dinner" },
];

export const smartPicks = [
  {
    name: "Egg Cheese Toast",
    score: 82,
    time: "10 min",
    note: "Quick and low effort",
  },
  {
    name: "Potato Omelette",
    score: 77,
    time: "20 min",
    note: "Cheap comfort meal",
  },
  {
    name: "Chicken Wrap",
    score: 74,
    time: "15 min",
    note: "Uses chicken soon",
  },
];

export const weeklyStats = [
  {
    label: "Meals cooked",
    value: "4 this week",
    type: "meals",
  },
  {
    label: "Money saved",
    value: "2.500 KWD",
    type: "money",
  },
  {
    label: "Food rescued",
    value: "3 items",
    type: "rescue",
  },
];

export const pantryItems = [
  {
    name: "Chicken",
    category: "Protein",
    quantity: "500g",
    location: "Fridge",
    daysLeft: 3,
    status: "Use soon",
  },
  {
    name: "Tomatoes",
    category: "Vegetable",
    quantity: "4 pieces",
    location: "Fridge",
    daysLeft: 4,
    status: "Use soon",
  },
  {
    name: "Eggs",
    category: "Protein",
    quantity: "8 pieces",
    location: "Fridge",
    daysLeft: 10,
    status: "Fresh",
  },
  {
    name: "Rice",
    category: "Carbs",
    quantity: "1kg",
    location: "Pantry",
    daysLeft: null,
    status: "Stocked",
  },
  {
    name: "Bread",
    category: "Carbs",
    quantity: "1 pack",
    location: "Pantry",
    daysLeft: 2,
    status: "Use soon",
  },
  {
    name: "Frozen Fries",
    category: "Carbs",
    quantity: "750g",
    location: "Freezer",
    daysLeft: 60,
    status: "Fresh",
  },
  {
    name: "Black Pepper",
    category: "Spice",
    quantity: "1 jar",
    location: "Spices",
    daysLeft: null,
    status: "Stocked",
  },
  {
    name: "Tuna",
    category: "Protein",
    quantity: "0 cans",
    location: "Out of Stock",
    daysLeft: null,
    status: "Out of stock",
  },
];

export const mealRecommendations = [
  {
    name: "Chicken Rice Bowl",
    score: 91,
    time: "25 min",
    difficulty: "Easy",
    mood: "High Protein",
    cost: "0.400 KWD extra",
    reason: [
      "Uses chicken before it expires",
      "You already have most ingredients",
      "Fits your high-protein preference",
      "Low extra cost",
    ],
    ingredients: ["Chicken", "Rice", "Tomatoes", "Black Pepper"],
  },
  {
    name: "Egg Cheese Toast",
    score: 82,
    time: "10 min",
    difficulty: "Very Easy",
    mood: "Lazy",
    cost: "0.200 KWD extra",
    reason: [
      "Very quick to make",
      "Low cleanup",
      "Uses ingredients you already have",
      "Good when you do not want to cook much",
    ],
    ingredients: ["Eggs", "Bread", "Cheese"],
  },
  {
    name: "Potato Omelette",
    score: 77,
    time: "20 min",
    difficulty: "Easy",
    mood: "Cheap",
    cost: "0.100 KWD extra",
    reason: [
      "Very low cost",
      "Simple ingredients",
      "Good comfort meal",
      "Beginner friendly",
    ],
    ingredients: ["Eggs", "Potatoes", "Black Pepper"],
  },
];

export const rescueItems = [
  {
    name: "Bread",
    daysLeft: 2,
    quantity: "1 pack",
    location: "Pantry",
    urgency: "Urgent",
  },
  {
    name: "Chicken",
    daysLeft: 3,
    quantity: "500g",
    location: "Fridge",
    urgency: "Use soon",
  },
  {
    name: "Tomatoes",
    daysLeft: 4,
    quantity: "4 pieces",
    location: "Fridge",
    urgency: "Use soon",
  },
];

export const rescueMeals = [
  {
    name: "Chicken Tomato Toast Melt",
    score: 94,
    time: "15 min",
    uses: ["Bread", "Chicken", "Tomatoes"],
    saved: "1.700 KWD",
    reason:
      "This meal uses your most urgent item first and combines it with chicken and tomatoes before they lose freshness.",
  },
  {
    name: "Chicken Tomato Rice",
    score: 88,
    time: "25 min",
    uses: ["Chicken", "Tomatoes", "Rice"],
    saved: "1.300 KWD",
    reason:
      "Good dinner option that uses two expiring fridge items and keeps the meal filling.",
  },
  {
    name: "Tomato Egg Toast",
    score: 79,
    time: "10 min",
    uses: ["Bread", "Tomatoes", "Eggs"],
    saved: "0.900 KWD",
    reason:
      "Fast breakfast or snack option that rescues bread and tomatoes with very low effort.",
  },
];

export const plannedMeals = [
  {
    name: "Chicken Wrap",
    ingredients: ["Chicken", "Wraps", "Lettuce", "Cheese"],
  },
  {
    name: "Egg Fried Rice",
    ingredients: ["Eggs", "Rice", "Black Pepper"],
  },
  {
    name: "Tuna Sandwich",
    ingredients: ["Tuna", "Bread", "Lettuce"],
  },
];

export const alreadyHaveItems = [
  {
    name: "Chicken",
    amount: "500g",
    location: "Fridge",
  },
  {
    name: "Eggs",
    amount: "8 pieces",
    location: "Fridge",
  },
  {
    name: "Rice",
    amount: "1kg",
    location: "Pantry",
  },
  {
    name: "Bread",
    amount: "1 pack",
    location: "Pantry",
  },
  {
    name: "Black Pepper",
    amount: "1 jar",
    location: "Spices",
  },
];

export const groceryItems = [
  {
    name: "Wraps",
    category: "Carbs",
    priority: "Needed",
    forMeals: ["Chicken Wrap"],
  },
  {
    name: "Lettuce",
    category: "Vegetable",
    priority: "Needed",
    forMeals: ["Chicken Wrap", "Tuna Sandwich"],
  },
  {
    name: "Cheese",
    category: "Dairy",
    priority: "Optional",
    forMeals: ["Chicken Wrap"],
  },
  {
    name: "Tuna",
    category: "Protein",
    priority: "Needed",
    forMeals: ["Tuna Sandwich"],
  },
];

export const doNotBuyItems = [
  {
    name: "Rice",
    reason: "You already have 1kg in your pantry.",
  },
  {
    name: "Eggs",
    reason: "You still have 8 pieces in the fridge.",
  },
  {
    name: "Bread",
    reason: "Use your current pack before buying more.",
  },
];

export const analyticsSummary = [
  {
    label: "Meals cooked",
    value: "18",
    detail: "This month",
    type: "meals",
  },
  {
    label: "Money saved",
    value: "15.400 KWD",
    detail: "Compared to takeaway",
    type: "money",
  },
  {
    label: "Food rescued",
    value: "9 items",
    detail: "Used before expiry",
    type: "rescue",
  },
  {
    label: "Takeaways avoided",
    value: "6",
    detail: "Better home choices",
    type: "takeaway",
  },
];

export const weeklyCookingData = [
  { week: "Week 1", meals: 3, saved: 2.4 },
  { week: "Week 2", meals: 5, saved: 4.1 },
  { week: "Week 3", meals: 4, saved: 3.2 },
  { week: "Week 4", meals: 6, saved: 5.7 },
];

export const favoriteCategories = [
  {
    name: "High Protein",
    percentage: 42,
    meals: 8,
  },
  {
    name: "Quick Meals",
    percentage: 31,
    meals: 6,
  },
  {
    name: "Cheap Meals",
    percentage: 17,
    meals: 3,
  },
  {
    name: "Comfort Food",
    percentage: 10,
    meals: 1,
  },
];

export const achievements = [
  {
    title: "Best cooking week",
    description: "You cooked 6 meals in Week 4.",
  },
  {
    title: "Top saved ingredient",
    description: "Chicken was rescued 3 times this month.",
  },
  {
    title: "Favorite meal",
    description: "Chicken Rice Bowl was cooked 5 times.",
  },
];

export const foodPreferences = [
  "High Protein",
  "Quick Meals",
  "Cheap Meals",
  "Comfort Food",
  "Healthy",
  "Low Cleanup",
];

export const reminderOptions = [
  {
    title: "Expiry reminders",
    description: "Warn me before food expires.",
    enabled: true,
  },
  {
    title: "Weekly cooking goal",
    description: "Remind me to cook enough meals this week.",
    enabled: true,
  },
  {
    title: "Grocery check",
    description: "Remind me to check pantry before shopping.",
    enabled: false,
  },
];