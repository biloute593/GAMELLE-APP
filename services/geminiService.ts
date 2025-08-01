
import { GoogleGenAI, Type } from "@google/genai";
import { Dish, GeneratedIdeas, GroundingChunk } from '../types';

// Lazy initialization for the AI client to prevent app crash on load
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    // Safely access the API key to prevent a crash in browser environments where 'process' is not defined.
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

    if (!apiKey) {
        // This error will be caught by the calling functions and displayed as a user-facing error.
        // It prevents the entire application from crashing if the API_KEY is not set.
        throw new Error("La clé API Gemini n'est pas configurée ou accessible.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
};


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
    const geminiAi = getAiClient();
    const response = await geminiAi.models.generateContent({
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
        throw new Error("L'API a retourné une réponse vide.");
    }

    const parsedJson = JSON.parse(jsonText);
    return parsedJson as GeneratedIdeas;

  } catch (error) {
    console.error("Error generating dish ideas:", error);
    // Re-throw the original error to propagate the specific message to the UI.
    throw error;
  }
};

export const searchDishes = async (query: string, dishes: Dish[]): Promise<{ matchedIds: number[], groundingChunks: GroundingChunk[] }> => {
    const dishListForPrompt = dishes.map(d => `- ID ${d.id}: ${d.name} (${d.cuisine}) - ${d.description}`).join('\n');

    const prompt = `
        You are a smart search assistant for a homemade food platform called "Gamelle".
        A user is searching for: "${query}".

        Here is the list of available dishes:
        ${dishListForPrompt}

        Analyze the user's query and the list of dishes.
        Your main goal is to identify which dishes from the list are the best match for the user's query.
        Consider dish names, descriptions, and cuisine types. The query can be conversational (e.g., "I want something cheesy and italian").

        You MUST return a list of matching dish IDs.
        Format your response as follows, AND NOTHING ELSE:
        MATCHING_IDS: [id1, id2, id3]

        If no dishes match, return an empty array:
        MATCHING_IDS: []

        Use the provided search tool if the user's query is about general food trends, popular dishes, or something that requires current information from the web. If you use the search tool, the information might help you decide which of the available dishes are relevant.
    `;

    try {
        const geminiAi = getAiClient();
        const response = await geminiAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.2,
            },
        });

        const text = response.text;
        let matchedIds: number[] = [];
        
        const match = text.match(/MATCHING_IDS:\s*\[(.*?)\]/);
        if (match && match[1]) {
            if(match[1].trim() === '') {
                matchedIds = [];
            } else {
                matchedIds = match[1].split(',')
                    .map(id => parseInt(id.trim(), 10))
                    .filter(id => !isNaN(id));
            }
        }

        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const groundingChunks: GroundingChunk[] = (rawChunks || [])
            .filter((c: any): c is GroundingChunk => c.web && c.web.uri);
        
        return { matchedIds, groundingChunks };

    } catch (error) {
        console.error("Error searching dishes:", error);
        // Re-throw the original error to propagate the specific message to the UI.
        throw error;
    }
}