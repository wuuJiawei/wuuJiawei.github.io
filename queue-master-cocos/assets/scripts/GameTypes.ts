export type Side = 'LEFT' | 'RIGHT';
export type GameMode = 'campaign' | 'ranked' | 'challenge';
export type ObjectiveType = 'COUNT' | 'SURVIVAL' | 'PERFECT' | 'COMBO' | 'TARGET';
export type RuleKind = 'boolean' | 'compound' | 'score';

export interface PersonData {
    id: number;
    name: string;
    clothesColor: 'red' | 'blue' | 'black' | 'cream' | 'green';
    hasHat: boolean;
    hasGlasses: boolean;
    hasCoffee: boolean;
    hasLaptop: boolean;
    hasBag: boolean;
    checkingPhone: boolean;
    tired: boolean;
    sneaky: boolean;
    programmerScore: number;
    slackingScore: number;
    quittingScore: number;
}

export interface QueueRule {
    id: string;
    title: string;
    hint: string;
    leftLabel: string;
    rightLabel: string;
    stage: string;
    kind: RuleKind;
    field?: keyof PersonData;
    scoreField?: 'programmerScore' | 'slackingScore' | 'quittingScore';
    threshold?: number;
    ambiguityRange?: [number, number];
    evaluate?: (person: PersonData) => boolean;
}

export interface LevelConfig {
    id: number;
    chapter: number;
    title: string;
    subtitle: string;
    objective: ObjectiveType;
    target: number;
    duration: number;
    ruleIds: string[];
}

export interface PlayerProfile {
    coins: number;
    stars: Record<number, number>;
    bestScores: Record<number, number>;
    rankPoints: number;
    tickets: number;
    ticketDay: string;
    officeLevel: number;
    collection: string[];
    daily: Record<string, Side[]>;
    totalGames: number;
}

export interface GameSession {
    mode: GameMode;
    level: LevelConfig;
    seed: number;
    opponentScore?: number;
}

export interface JudgeResult {
    result: 'CORRECT' | 'WRONG' | 'AMBIGUOUS';
    expectedSide: Side;
    voteRight: number;
}

export interface RunResult {
    session: GameSession;
    score: number;
    correct: number;
    errors: number;
    bestCombo: number;
    targetHits: number;
    stars: number;
    won: boolean;
    lastDispute?: {
        person: PersonData;
        rule: QueueRule;
        side: Side;
        agreePercent: number;
    };
}
