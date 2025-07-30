import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// Définition du schéma de réponse de l'IA
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      description: "Liste de 3 à 5 suggestions de noms et descriptions de plats.",
      items: {
        type: Type.OBJECT,
        properties: {
          nom_plat: {
            type: Type.STRING,
            description: "Nom créatif et appétissant pour le plat."
          },
          description_plat: {
            type: Type.STRING,
            description: "Description courte et alléchante du plat (2-3 phrases max)."
          }
        },
        required: ["nom_plat", "description_plat"]
      }
    }
  },
  required: ["suggestions"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // On autorise uniquement les requêtes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed.' });
    }

    try {
        const { ingredients, cuisine } = req.body;

        // Validation simple des entrées
        if (!ingredients || !cuisine) {
            return res.status(400).json({ error: 'Missing ingredients or cuisine in request body.' });
        }

        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set on the server.");
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `Je suis un cuisinier amateur sur une plateforme nommée "Gamelle" qui permet de vendre des plats faits maison.
        Aide-moi à trouver des idées pour mon plat.
        
        Ingrédients principaux: ${ingredients}
        Type de cuisine: ${cuisine}
        
        Génère 3 suggestions créatives et vendeuses. Pour chaque suggestion, fournis un nom de plat et une courte description (2 phrases maximum).
        La réponse doit être exclusivement en français.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            return res.status(500).json({ error: "API returned an empty response." });
        }

        const parsedJson = JSON.parse(jsonText);
        // On renvoie la réponse de l'IA au navigateur
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("Error in generate-ideas function:", error);
        return res.status(500).json({ error: 'Failed to generate ideas.' });
    }
}
