"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { STORIES } from "./stories";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are the Game Master of a hard-boiled Noir murder mystery.

Your Rules:

1. **Dynamic Case Generation**: At the start of a new game, you MUST generate a unique, random murder mystery UNLESS a specific story is provided.
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
   - **Suspect Status**: You are FREE to kill off suspects if the investigation drags on or if they get too close to the truth. Change their status to "dead" and describe the scene.
   - **Objective**: Update 'current_objective' to be a suggestive, noir-style hint.
   - **Summary**: Update 'case_summary' with a concise, running log of key events.
   - **End**: The game MUST end. If the player accuses the correct suspect with evidence, set 'game_over' to true. If the player fails or dies, set 'game_over' to true.

6. **Visuals**: ALWAYS provide a 'visual_prompt'. It must describe the current scene vividly for an image generator.

7. **Context**: ALWAYS include 'location' and 'time' in the output. Update them as the story progresses.

Keep the mystery solvable but not obvious. Raise the stakes.
`;

export async function processGameTurn(history: string[], userInput: string, storyId?: string) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        let finalPrompt = SYSTEM_PROMPT;

        if (storyId) {
            const story = STORIES.find(s => s.id === storyId);
            if (story) {
                finalPrompt += `\n\n${story.systemPromptAddon}`;
            }
        }

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: finalPrompt }],
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

        // Retry logic with exponential backoff
        let retries = 0;
        const maxRetries = 5;
        let lastError;

        while (retries < maxRetries) {
            try {
                const result = await chat.sendMessage(message);
                const response = result.response;
                const text = response.text();
                return JSON.parse(text);
            } catch (error: any) {
                lastError = error;
                console.warn(`Gemini API attempt ${retries + 1} failed:`, error.message);

                // Check if it's a 503 or 429 (Service Unavailable or Too Many Requests)
                if (error.message?.includes("503") || error.message?.includes("429")) {
                    retries++;
                    if (retries < maxRetries) {
                        const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
                        console.log(`Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }
                // If it's not a retryable error or we ran out of retries, break
                break;
            }
        }

        throw lastError;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            narrative: `The connection to the precinct is fuzzy... I can't make out what you're saying, Detective. (System Error: ${error instanceof Error ? error.message : String(error)})`,
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
    console.log("Starting saveGame...", { caseId: caseState.id, userId: (await auth()).userId });
    const { userId } = await auth();
    if (!userId) {
        console.error("saveGame: No userId found.");
        return null;
    }

    try {
        const user = await currentUser();
        if (!user) {
            console.error("saveGame: No currentUser found.");
            return null;
        }

        const email = user.emailAddresses[0]?.emailAddress;
        console.log("saveGame: Found user", { userId, email });

        // Ensure user exists in DB
        await prisma.user.upsert({
            where: { id: userId },
            update: { email: email },
            create: {
                id: userId,
                email: email,
            },
        });

        let caseId = caseState.id;

        // Generate a title from the summary or objective if available, or use a default
        // Generate a title from the summary or objective if available, or use a default
        let title = caseState.title || "Untitled Case";
        const summary = caseState.caseSummary || caseState.case_summary;

        if (!caseState.title && summary) {
            // Take the first sentence or first 50 chars of the summary
            title = summary.split('.')[0].substring(0, 50) + "...";
        }

        if (caseId) {
            console.log("saveGame: Updating existing case", caseId);
            await prisma.case.update({
                where: { id: caseId },
                data: {
                    state: caseState as any,
                    status: (caseState.gameOver || caseState.game_over) ? "solved" : "active",
                    title: title,
                },
            });
        } else {
            console.log("saveGame: Creating new case");
            const newCase = await prisma.case.create({
                data: {
                    userId: userId,
                    state: caseState as any,
                    status: "active",
                    title: title,
                },
            });
            caseId = newCase.id;
        }

        console.log("saveGame: Successfully saved case", caseId);
        return caseId;
    } catch (error) {
        console.error("Failed to save game:", error);
        throw error;
    }
}

export async function getMyCases() {
    console.log("Starting getMyCases...");
    const { userId } = await auth();
    console.log("getMyCases: userId", userId);

    if (!userId) return [];

    try {
        const cases = await prisma.case.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' },
        });
        console.log("getMyCases: Found cases", cases.length);
        return cases;
    } catch (error) {
        console.error("getMyCases: Error fetching cases", error);
        return [];
    }
}

export async function getCase(caseId: string) {
    const { userId } = await auth();
    if (!userId) return null;

    return await prisma.case.findUnique({
        where: { id: caseId, userId },
    });
}

export async function deleteCase(caseId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.case.delete({
            where: {
                id: caseId,
                userId: userId, // Ensure user owns the case
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete case:", error);
        return { success: false, error: "Failed to delete case" };
    }
}
