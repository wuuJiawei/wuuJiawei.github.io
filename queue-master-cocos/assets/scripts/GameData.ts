import {
    JudgeResult,
    LevelConfig,
    ObjectiveType,
    PersonData,
    PlayerProfile,
    QueueRule,
    Side,
} from './GameTypes';

export const CHAPTER_NAMES = ['公司前台', '早高峰地铁', '互联网公司', '会议室', '周五下班前'];
export const CHAPTER_ICONS = ['前', '铁', '码', '会', '跑'];
export const TIER_NAMES = [
    '实习排队员', '正式排队员', '资深排队员', '排队主管',
    '秩序经理', '分类总监', '首席判断官', '人类观察大师',
];
export const COLLECTION_NAMES = [
    '咖啡续命程序员',
    '手机焊手摸鱼王',
    '背包常驻通勤侠',
    '疲惫眼镜打工人',
    '神秘空手实习生',
    '下班前提需求的人',
    '全副武装项目经理',
    '精神离职观察员',
];

const NAMES = ['小林', '阿杰', '小周', '老王', 'Mia', '大壮', '可乐', 'Tony'];
const COLORS: PersonData['clothesColor'][] = ['red', 'blue', 'black', 'cream', 'green'];

export function seededRandom(seed: number): number {
    const value = Math.sin(seed * 999) * 43758.5453;
    return value - Math.floor(value);
}

export function createPerson(seed: number, index = 0): PersonData {
    const id = seed * 97 + index * 13 + 7;
    const yes = (salt: number, chance = 0.5): boolean => seededRandom(id * 13 + salt) < chance;
    const hasHat = yes(1, 0.35);
    const hasGlasses = yes(2, 0.42);
    const hasCoffee = yes(3, 0.46);
    const hasLaptop = yes(4);
    const hasBag = yes(5, 0.52);
    const checkingPhone = yes(6, 0.42);
    const tired = yes(7, 0.48);
    const sneaky = yes(8, 0.35);
    const clothesColor = COLORS[Math.floor(seededRandom(id + 2) * COLORS.length)];

    return {
        id,
        name: NAMES[Math.floor(seededRandom(id + 4) * NAMES.length)],
        clothesColor,
        hasHat,
        hasGlasses,
        hasCoffee,
        hasLaptop,
        hasBag,
        checkingPhone,
        tired,
        sneaky,
        programmerScore:
            (hasLaptop ? 28 : 0) +
            (hasCoffee ? 16 : 0) +
            (hasGlasses ? 12 : 0) +
            (tired ? 12 : 0) +
            (clothesColor === 'black' ? 8 : 0) +
            Math.floor(seededRandom(id + 21) * 12),
        slackingScore:
            (checkingPhone ? 30 : 0) +
            (sneaky ? 25 : 0) +
            (hasCoffee && !hasLaptop ? 10 : 0) +
            (!hasBag ? 8 : 0) +
            Math.floor(seededRandom(id + 31) * 25),
        quittingScore:
            (hasBag ? 22 : 0) +
            (hasLaptop ? 18 : 0) +
            (tired ? 22 : 0) +
            (!hasCoffee ? 8 : 0) +
            Math.floor(seededRandom(id + 41) * 24),
    };
}

export const RULES: QueueRule[] = [
    {
        id: 'hat', title: '戴帽子的去右边', hint: '包可不算帽子',
        leftLabel: '没戴帽子', rightLabel: '戴了帽子', stage: '明确规则',
        kind: 'boolean', field: 'hasHat',
    },
    {
        id: 'coffee', title: '拿咖啡的去右边', hint: '工牌能忘，咖啡不能',
        leftLabel: '空手上班', rightLabel: '咖啡续命', stage: '明确规则',
        kind: 'boolean', field: 'hasCoffee',
    },
    {
        id: 'glasses', title: '戴眼镜的去右边', hint: '看清鼻梁上的线索',
        leftLabel: '视力真好', rightLabel: '眼镜一族', stage: '明确规则',
        kind: 'boolean', field: 'hasGlasses',
    },
    {
        id: 'bag', title: '背包的人去右边', hint: '背后的方包最显眼',
        leftLabel: '轻装上阵', rightLabel: '背包通勤', stage: '明确规则',
        kind: 'boolean', field: 'hasBag',
    },
    {
        id: 'red', title: '红衣服去右边', hint: '只看上衣颜色',
        leftLabel: '其他颜色', rightLabel: '红衣员工', stage: '明确规则',
        kind: 'compound', evaluate: (person) => person.clothesColor === 'red',
    },
    {
        id: 'ready', title: '背电脑并拿咖啡', hint: '两个条件必须同时满足',
        leftLabel: '准备不足', rightLabel: '装备齐全', stage: '组合条件',
        kind: 'compound', evaluate: (person) => person.hasLaptop && person.hasCoffee,
    },
    {
        id: 'redNoGlasses', title: '红衣但没有眼镜', hint: '红衣 AND NOT 眼镜',
        leftLabel: '不符合', rightLabel: '完全符合', stage: '组合条件',
        kind: 'compound', evaluate: (person) => person.clothesColor === 'red' && !person.hasGlasses,
    },
    {
        id: 'hatOrBag', title: '戴帽子或者背包', hint: '满足任意一项就行',
        leftLabel: '都没有', rightLabel: '至少一项', stage: '组合条件',
        kind: 'compound', evaluate: (person) => person.hasHat || person.hasBag,
    },
    {
        id: 'programmer', title: '看起来像程序员', hint: '电脑、咖啡、眼镜和疲惫脸是线索',
        leftLabel: '不太像', rightLabel: '像程序员', stage: '推测判断',
        kind: 'score', scoreField: 'programmerScore', threshold: 60, ambiguityRange: [45, 69],
    },
    {
        id: 'slacking', title: '有一种偷偷摸鱼的感觉', hint: '手机、眼神和姿势不会说谎……吧？',
        leftLabel: '认真工作', rightLabel: '偷偷摸鱼', stage: '全民争议',
        kind: 'score', scoreField: 'slackingScore', threshold: 60, ambiguityRange: [41, 69],
    },
    {
        id: 'quitting', title: '好像马上要提离职', hint: '抱着电脑、背好包，还面无表情',
        leftLabel: '还能再熬', rightLabel: '准备跑路', stage: '全民争议',
        kind: 'score', scoreField: 'quittingScore', threshold: 62, ambiguityRange: [43, 72],
    },
];

const OBJECTIVE_CYCLE: ObjectiveType[] = ['COUNT', 'SURVIVAL', 'PERFECT', 'COMBO', 'TARGET', 'COUNT'];
const OBJECTIVE_NAMES: Record<ObjectiveType, string> = {
    COUNT: '限时分类',
    SURVIVAL: '秩序生存',
    PERFECT: '零失误',
    COMBO: '连击挑战',
    TARGET: '指定对象',
};

export const LEVELS: LevelConfig[] = Array.from({ length: 30 }, (_, index) => {
    const id = index + 1;
    const chapter = Math.floor(index / 6) + 1;
    const slot = index % 6;
    const objective = OBJECTIVE_CYCLE[slot];
    const rulePools = [
        ['hat', 'coffee', 'glasses', 'bag', 'red'],
        ['coffee', 'bag', 'hatOrBag', 'glasses'],
        ['ready', 'redNoGlasses', 'hatOrBag', 'programmer'],
        ['ready', 'programmer', 'slacking'],
        ['programmer', 'slacking', 'quitting'],
    ];
    const targets: Record<ObjectiveType, number> = {
        COUNT: 12 + chapter * 2,
        SURVIVAL: 0,
        PERFECT: 8 + chapter,
        COMBO: 7 + chapter * 2,
        TARGET: 4 + chapter,
    };

    return {
        id,
        chapter,
        title: `${OBJECTIVE_NAMES[objective]} · ${slot + 1}`,
        subtitle: ['前台登记', '高峰分流', '需求鉴别', '会议观察', '下班审查'][chapter - 1],
        objective,
        target: targets[objective],
        duration: objective === 'SURVIVAL' ? 35 + chapter * 3 : 32 + chapter * 2,
        ruleIds: rulePools[chapter - 1],
    };
});

export function getRule(ruleId: string): QueueRule {
    return RULES.find((rule) => rule.id === ruleId) ?? RULES[0];
}

export function judgePerson(person: PersonData, rule: QueueRule, selectedSide: Side): JudgeResult {
    let expectedSide: Side;
    let ambiguous = false;

    if (rule.kind === 'score' && rule.scoreField) {
        const value = person[rule.scoreField];
        const [low, high] = rule.ambiguityRange ?? [45, 65];
        ambiguous = value >= low && value <= high;
        expectedSide = value >= (rule.threshold ?? 60) ? 'RIGHT' : 'LEFT';
    } else if (rule.kind === 'boolean' && rule.field) {
        expectedSide = Boolean(person[rule.field]) ? 'RIGHT' : 'LEFT';
    } else {
        expectedSide = rule.evaluate?.(person) ? 'RIGHT' : 'LEFT';
    }

    const voteRight = 52 + Math.floor(seededRandom(person.id + rule.title.length) * 18);
    return {
        result: ambiguous ? 'AMBIGUOUS' : selectedSide === expectedSide ? 'CORRECT' : 'WRONG',
        expectedSide,
        voteRight,
    };
}

export function objectiveText(level: LevelConfig): string {
    switch (level.objective) {
        case 'COUNT': return `限时正确分类 ${level.target} 人`;
        case 'SURVIVAL': return `守住秩序 ${level.duration} 秒`;
        case 'PERFECT': return `零失误连续分类 ${level.target} 人`;
        case 'COMBO': return `达成一次 ${level.target} 连击`;
        case 'TARGET': return `找出 ${level.target} 名右队目标`;
    }
}

export function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function tierIndex(points: number): number {
    return Math.min(TIER_NAMES.length - 1, Math.floor(points / 100));
}

export function collectionFor(person: PersonData): string {
    if (person.hasLaptop && person.hasCoffee) return COLLECTION_NAMES[0];
    if (person.checkingPhone && person.sneaky) return COLLECTION_NAMES[1];
    if (person.hasBag && !person.hasLaptop) return COLLECTION_NAMES[2];
    if (person.tired && person.hasGlasses) return COLLECTION_NAMES[3];
    if (!person.hasBag && !person.hasCoffee && !person.hasLaptop) return COLLECTION_NAMES[4];
    if (person.hasLaptop && person.checkingPhone) return COLLECTION_NAMES[5];
    if (person.hasBag && person.hasLaptop && person.hasCoffee) return COLLECTION_NAMES[6];
    return COLLECTION_NAMES[7];
}

export const DEFAULT_PROFILE: PlayerProfile = {
    coins: 120,
    stars: {},
    bestScores: {},
    rankPoints: 80,
    tickets: 5,
    ticketDay: todayKey(),
    officeLevel: 1,
    collection: [],
    daily: {},
    totalGames: 0,
};
