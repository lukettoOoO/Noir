"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are the Game Master of a hard-boiled Noir murder mystery.

Your Rules:

1. **Dynamic Case Generation**: At the start of a new game, you MUST generate a unique, random murder mystery.
   - Choose a unique Victim, Location, and 3 distinct Suspects (one is the killer).
   - Do NOT use the same case twice. Invent new names, motives, and settings.

2. **State Tracking**: You must track the killer, the victim, and the location internally.

3. **The Output**: You must ALWAYS reply in strictly valid JSON format: 
{ 
  "narrative": "...", 
  "visual_prompt": "...", 
  "location": "...", 
  "time": "...", 
  "evidence": ["item 1", "item 2"],
  "suspects": [
    { "name": "...", "status": "alive/dead/arrested", "notes": "..." }
  ],
  "current_objective": "...",
  "case_summary": "...",
  "game_over": boolean 
}.

4. **The Style**: Be cynical, descriptive, and atmospheric. Use short, punchy sentences.

5. **The Game**:
   - **Start**: When the history is empty or the user says "START_GAME", introduce the case. Describe the initial scene, the body, and the atmosphere.
   - **Investigation**: If the player asks to 'look' at something, describe it and update the 'visual_prompt'.
   - **Evidence**: If the player finds a clue, add it to the "evidence" array.
   - **Suspects**: As the player meets or learns about suspects, add/update them in the "suspects" array.
   - **Objective**: Update 'current_objective' to be a suggestive, noir-style hint (e.g., "The bartender knows more than he's saying," or "Find out where the gun came from"). Do NOT be too explicit.
   - **Summary**: Update 'case_summary' with a concise, running log of key events and discoveries.
   - **End**: If the player accuses the correct suspect with evidence, set 'game_over' to true.

6. **Visuals**: ALWAYS provide a 'visual_prompt'. It must describe the current scene vividly for an image generator.

7. **Context**: ALWAYS include 'location' and 'time' in the output. Update them as the story progresses.

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

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function saveGame(caseState: any) {
    const user = await currentUser();
    if (!user) return;

    await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || "unknown",
        },
    });

    // We use the case ID from the state if it exists, otherwise we create a new one?
    // The user plan says: "Use prisma.case.upsert to save the game state (store the entire JSON object in the state field)."
    // But how do we know the case ID?
    // If the game state doesn't have an ID, we might need to generate one or rely on the DB.
    // But upsert needs a unique identifier.
    // If `caseState` has an `id`, we use it. If not, we might be creating a new case every time?
    // The plan says: "Case: (id String @id @default(cuid()) ...)"
    // And "Use prisma.case.upsert".
    // If we don't have an ID, we can't upsert easily unless we use a different unique constraint.
    // But `id` is the only unique field usually.
    // Maybe we should pass the caseId separately or check if it's in the state.
    // For now, I'll assume `caseState` might have an ID or we create a new one.
    // Actually, if it's a new game, we create. If existing, we update.
    // But `saveGame` is called automatically.
    // Let's assume the frontend tracks the `caseId`.
    // If `caseState` doesn't have an ID, we create.
    // But `upsert` requires a `where` clause.
    // If we don't have an ID, we can't use `upsert` on ID.
    // We should probably use `create` if no ID, or `update` if ID exists.
    // Or just `upsert` if we have an ID.
    // I'll check if `caseState.id` exists.

    // Wait, the user plan says: "Use prisma.case.upsert".
    // This implies we should have an ID.
    // I'll assume the frontend will pass the ID or it's part of the state.
    // If not, I'll generate one and return it?
    // The `processGameTurn` returns a JSON. I should probably inject the ID there or handle it.
    // For now, I'll try to find an ID in `caseState` or create a new case if missing.

    let caseId = caseState.id;

    if (caseId) {
        await prisma.case.upsert({
            where: { id: caseId },
            update: {
                state: caseState,
                status: caseState.game_over ? "solved" : "active",
            },
            create: {
                id: caseId,
                userId: user.id,
                state: caseState,
                status: caseState.game_over ? "solved" : "active",
            },
        });
    } else {
        // Create new case
        const newCase = await prisma.case.create({
            data: {
                userId: user.id,
                state: caseState,
                status: caseState.game_over ? "solved" : "active",
            }
        });
        return newCase.id; // Return ID so frontend can track it
    }
}

export async function getMyCases() {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.case.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getCase(caseId: string) {
    const { userId } = await auth();
    if (!userId) return null;

    return await prisma.case.findUnique({
        where: { id: caseId, userId },
    });
}
