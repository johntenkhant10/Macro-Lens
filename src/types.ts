export interface FoodItem {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  confidence: string;
  notes: string;
  imageUrl: string;
  timestamp: number;
}

export interface PreBuiltFood {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
}
