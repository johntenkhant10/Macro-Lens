import { useState, useEffect } from "react";
import { FoodItem, PreBuiltFood } from "./types";

export function useFoodLog() {
  const [logs, setLogs] = useState<FoodItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("macrolens_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLogs(parsed);
      } catch (e) {
        console.error("Failed to parse logs");
      }
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("macrolens_logs", JSON.stringify(logs));
    }
  }, [logs, initialized]);

  const addLog = (item: Omit<FoodItem, "id" | "timestamp">) => {
    const newItem: FoodItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setLogs((prev) => [newItem, ...prev]);
  };

  const removeLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const updateLog = (id: string, updatedData: Partial<FoodItem>) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, ...updatedData } : log))
    );
  };

  return { logs, addLog, removeLog, updateLog };
}

export function usePreBuiltFoods() {
  const [foods, setFoods] = useState<PreBuiltFood[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("macrolens_prebuilt");
    if (saved) {
      try {
        setFoods(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse prebuilt foods");
      }
    } else {
      setFoods([
        { id: "def-1", foodName: "Chicken Breast (100g)", calories: 165, protein: 31 },
        { id: "def-2", foodName: "White Rice (1 cup)", calories: 205, protein: 4 },
        { id: "def-3", foodName: "Egg (Large)", calories: 72, protein: 6 }
      ]);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("macrolens_prebuilt", JSON.stringify(foods));
    }
  }, [foods, initialized]);

  const addFood = (item: Omit<PreBuiltFood, "id">) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setFoods((prev) => [newItem, ...prev]);
  };

  const removeFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  return { foods, addFood, removeFood };
}
