export interface Story {
    id: string;
    title: string;
    description: string;
    systemPromptAddon: string;
}

export const STORIES: Story[] = [
    {
        id: "story_express",
        title: "The Midnight Express",
        description: "A wealthy tycoon is found dead in his private cabin on a luxury train speeding through the night. 15 minutes to find the killer before the next stop.",
        systemPromptAddon: `
    STORY MODE: "The Midnight Express"
    
    THE PLOT:
    - VICTIM: Silas Vane, railroad tycoon. Poisoned (Cyanide in scotch).
    - LOCATION: Private Cabin, The Midnight Express Train.
    - SUSPECT 1 (KILLER): Julian Vane (Nephew). Motive: Inheritance. Nervous, sweating. Has a small vial in his pocket.
    - SUSPECT 2: Lady Eleanor. Motive: Blackmail. Haughty, defensive.
    - SUSPECT 3: Conductor Thomas. Motive: Disgruntled employee. Helpful but secretive.
    
    YOUR GOAL:
    - Guide the player to investigate the body, interview the nephew, and find the vial.
    - DO NOT deviate from this plot.
    - REVEAL CLUES QUICKLY. The game should take about 10-15 turns.
    - If the player accuses Julian with the vial as evidence, they WIN.
    `
    },
    {
        id: "story_studio",
        title: "The Silent Screen",
        description: "A rising starlet collapses on the set of 'Shadows of Tomorrow'. Was it an accident, or a final scene written in blood?",
        systemPromptAddon: `
    STORY MODE: "The Silent Screen"
    
    THE PLOT:
    - VICTIM: Clara Bowden, actress. Bludgeoned with a prop statue.
    - LOCATION: Film Set, Soundstage 4.
    - SUSPECT 1: The Director (Marcus Thorne). Motive: She was quitting. Arrogant, intense.
    - SUSPECT 2 (KILLER): The Understudy (Lila Grace). Motive: Jealousy. Feigns grief, but has blood on her costume cuffs.
    - SUSPECT 3: The Ex-Husband. Motive: Passion. Drunk, aggressive.
    
    YOUR GOAL:
    - Guide the player to find the bloody prop and notice Lila's cuffs.
    - DO NOT deviate from this plot.
    - REVEAL CLUES QUICKLY. The game should take about 10-15 turns.
    - If the player accuses Lila with the blood evidence, they WIN.
    `
    },
    {
        id: "story_docks",
        title: "The Dockyard Deal",
        description: "A smuggler's deal goes wrong in the fog. A body floats between the hulls, silence is the only witness.",
        systemPromptAddon: `
    STORY MODE: "The Dockyard Deal"
    
    THE PLOT:
    - VICTIM: "Slippery" Jack, informant. Shot in the back.
    - LOCATION: Pier 13, The Docks. Foggy.
    - SUSPECT 1 (KILLER): Vinny "The Fist". Motive: Jack was a rat. Cleaning his gun nearby.
    - SUSPECT 2: The Dockmaster. Motive: Bribes. Nervous, looking at watch.
    - SUSPECT 3: Madame Rouge. Motive: Debt. Cool, smoking a cigarette.
    
    YOUR GOAL:
    - Guide the player to find the gun oil and the bullet casing matching Vinny's gun.
    - DO NOT deviate from this plot.
    - REVEAL CLUES QUICKLY. The game should take about 10-15 turns.
    - If the player accuses Vinny with the gun evidence, they WIN.
    `
    }
];
