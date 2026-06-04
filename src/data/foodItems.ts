import { FoodItem } from "@/types";

// Nutritional values refer exactly to the selected servingLabel (100 g or 1 Stück).
// carbsPer100g = net carbs (EU standard, dietary fiber excluded). fiberPer100g is always a separate field.
export const foodItems: FoodItem[] = [
  {
    id: "haehnchenbrust",
    name: "Hähnchenbrust",
    category: "Protein",
    servingLabel: "100 g",
    kcalPer100g: 110, proteinPer100g: 23.0, carbsPer100g: 0.0, fatPer100g: 1.5, fiberPer100g: 0.0, saltPer100g: 0.2,
    defaultAmount: 100,
  },
  {
    id: "banane",
    name: "Banane",
    category: "Obst",
    servingLabel: "1 Stück",
    kcalPer100g: 105, proteinPer100g: 1.3, carbsPer100g: 24.0, fatPer100g: 0.3, fiberPer100g: 2.6, saltPer100g: 0.0,
    defaultAmount: 1,
  },
  {
    id: "haferflocken",
    name: "Haferflocken",
    category: "Kohlenhydrate",
    servingLabel: "100 g",
    kcalPer100g: 370, proteinPer100g: 13.0, carbsPer100g: 58.0, fatPer100g: 7.0, fiberPer100g: 10.0, saltPer100g: 0.0,
    defaultAmount: 80,
  },
  {
    id: "magerquark",
    name: "Magerquark",
    category: "Protein",
    servingLabel: "100 g",
    kcalPer100g: 67, proteinPer100g: 12.0, carbsPer100g: 4.0, fatPer100g: 0.3, fiberPer100g: 0.0, saltPer100g: 0.1,
    defaultAmount: 200,
  },
  {
    id: "chiasamen",
    name: "Chiasamen",
    category: "Fettquelle",
    servingLabel: "100 g",
    kcalPer100g: 486, proteinPer100g: 17.0, carbsPer100g: 8.0, fatPer100g: 31.0, fiberPer100g: 34.0, saltPer100g: 0.1,
    defaultAmount: 15,
  },
  {
    id: "olivenoel",
    name: "Olivenöl",
    category: "Fettquelle",
    servingLabel: "100 g",
    kcalPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, fiberPer100g: 0.0, saltPer100g: 0.0,
    defaultAmount: 10,
  },
  {
    id: "whey_protein",
    name: "Whey Protein",
    category: "Protein",
    servingLabel: "100 g",
    kcalPer100g: 380, proteinPer100g: 75.0, carbsPer100g: 8.0, fatPer100g: 4.0, fiberPer100g: 0.0, saltPer100g: 0.5,
    defaultAmount: 30,
  },
];
