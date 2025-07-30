
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedIdeas } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const generateDishIdeas = async (ingredients: string, cuisine: string): Promise<GeneratedIdeas> => {
  const prompt = `
    Je suis un cuisinier amateur sur une plateforme nommée "Gamelle" qui permet de vendre des plats faits maison.
    Aide-moi à trouver des idées pour mon plat.
    
    Ingrédients principaux: ${ingredients}
    Type de cuisine: ${cuisine}
    
    Génère 3 suggestions créatives et vendeuses. Pour chaque suggestion, fournis un nom de plat et une courte description (2 phrases maximum).
    La réponse doit être exclusivement en français.
  `;

  try {
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
        throw new Error("API returned an empty response.");
    }

    const parsedJson = JSON.parse(jsonText);
    return parsedJson as GeneratedIdeas;

  } catch (error) {
    console.error("Error generating dish ideas:", error);
    throw new Error("Failed to generate ideas from Gemini API.");
  }
};
