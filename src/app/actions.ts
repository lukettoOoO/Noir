"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are the Game Master of a hard-boiled Noir murder mystery.

Your Rules:

The State: You must track the killer, the victim, and the location internally.

The Output: You must ALWAYS reply in strictly valid JSON format: 
{ 
  "narrative": "...", 
  "visual_prompt": "...", 
  "location": "...", 
  "time": "...", 
  "game_over": boolean 
}.

The Style: Be cynical, descriptive, and atmospheric. Use short, punchy sentences.

The Game:

Start the game by describing a murder scene (e.g., a body in a rainy alley).

The player is the detective.

If the player asks to 'look' at something, describe it and update the 'visual_prompt' to match that specific object.

If the player accuses the correct suspect with evidence, set 'game_over' to true.

ALWAYS provide a 'visual_prompt'. It must describe the current scene vividly for an image generator. Even if the scene hasn't changed much, describe the atmosphere, lighting, or a specific detail to ensure a fresh image.

ALWAYS include 'location' and 'time' in the output. Update them as the story progresses.

Keep the mystery solvable but not obvious.
`;

export async function processGameTurn(history: string[], userInput: string) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to begin the investigation." }],
                },
                // In a real app, we'd pass the full structured history here. 
                // For this simplified version, we'll just append the context.
            ],
        });

        // Construct the turn message
        const message = `
    Game History:
    ${history.join("\n")}
    
    User Input: "${userInput}"
    
    Respond in JSON.
    `;

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            narrative: "The connection to the precinct is fuzzy... I can't make out what you're saying, Detective. (System Error: Check API Key)",
            visual_prompt: "A static-filled screen with a disconnect symbol.",
            game_over: false
        };
    }
}
