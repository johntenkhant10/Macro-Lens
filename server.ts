import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Needed to parse large JSON payloads (specifically images in base64)
  app.use(express.json({ limit: "50mb" }));

  // API Route for scanning food
  app.post("/api/scan", async (req, res) => {
    try {
      const { image, prompt, mode } = req.body; // image should be base64 data URI

      if (!image) {
        return res.status(400).json({ error: "Missing image" });
      }

      // Extract base64 part
      const base64EncodeString = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];

      const parts: any[] = [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64EncodeString,
          },
        },
      ];

      const textPrompt = mode === "barcode"
        ? `You are an expert nutritionist scanning a barcode or product nutrition label from an image. 
Please carefully read the image and identify the EXACT product name, along with its nutritional info (Calories and Protein in grams).
${prompt ? `Additional context from user: ${prompt}` : ""}`
        : `You are an expert nutritionist identifying food from an image. 
Given the image of this food, estimate its nutritional info (Calories and Protein in grams).
${prompt ? `Additional context from user: ${prompt}` : "Please be as accurate as possible."}`;

      parts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: {
                type: Type.STRING,
                description: "The name of the food or product in the image.",
              },
              calories: {
                type: Type.NUMBER,
                description: "Estimated calories (kcal).",
              },
              protein: {
                type: Type.NUMBER,
                description: "Estimated protein (g).",
              },
              confidence: {
                type: Type.STRING,
                description: "How confident you are in this estimation (e.g., 'High', 'Medium', 'Low').",
              },
              notes: {
                type: Type.STRING,
                description: "Any extra notes about the food (portion size assumed, ingredients to watch, etc).",
              }
            },
            required: ["foodName", "calories", "protein", "confidence", "notes"],
          },
        },
      });

      const jsonStr = response.text?.trim() || "{}";
      const result = JSON.parse(jsonStr);

      res.json(result);
    } catch (error: any) {
      console.error("Scan error:", error);
      res.status(500).json({ error: error.message || "Failed to scan food" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production setup
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Fallback logic inside Express v4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
