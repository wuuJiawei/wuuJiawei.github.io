export type Side = "LEFT" | "RIGHT";
export type Mode = "campaign" | "ranked" | "challenge";
export type ObjectiveType = "COUNT" | "SURVIVAL" | "PERFECT" | "COMBO" | "TARGET";

export type Person = {
  id: number;
  name: string;
  color: string;
  hat: boolean;
  glasses: boolean;
  coffee: boolean;
  laptop: boolean;
  bag: boolean;
  phone: boolean;
  tired: boolean;
  sneaky: boolean;
  programmer: number;
  slacking: number;
  quitting: number;
};

export type Rule = {
  id: string;
  title: string;
  hint: string;
  left: string;
  right: string;
  stage: string;
  subjective?: boolean;
  test: (person: Person) => boolean | number;
  threshold?: number;
  ambiguous?: [number, number];
};

export type Level = {
  id: number;
  chapter: number;
  title: string;
  subtitle: string;
  objective: ObjectiveType;
  target: number;
  duration: number;
  ruleIds: string[];
};

export type Profile = {
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
};

export const chapterNames = ["公司前台", "早高峰地铁", "互联网公司", "会议室", "周五下班前"];
export const chapterIcons = ["🏢", "🚇", "💻", "📊", "🏃"];
export const tierNames = ["实习排队员", "正式排队员", "资深排队员", "排队主管", "秩序经理", "分类总监", "首席判断官", "人类观察大师"];
export const collectionNames = [
  "咖啡续命程序员", "手机焊手摸鱼王", "背包常驻通勤侠", "疲惫眼镜打工人",
  "神秘空手实习生", "下班前提需求的人", "全副武装项目经理", "精神离职观察员",
];

const names = ["小林", "阿杰", "小周", "老王", "Mia", "大壮", "可乐", "Tony"];
const colors = ["red", "blue", "black", "cream", "green"];

export const seeded = (seed: number) => {
  const x = Math.sin(seed * 999) * 43758.5453;
  return x - Math.floor(x);
};

export function makePerson(seed: number, index = 0): Person {
  const id = seed * 97 + index * 13 + 7;
  const yes = (n: number, chance = .5) => seeded(id * 13 + n) < chance;
  const hat = yes(1, .35), glasses = yes(2, .42), coffee = yes(3, .46);
  const laptop = yes(4), bag = yes(5, .52), phone = yes(6, .42);
  const tired = yes(7, .48), sneaky = yes(8, .35);
  const color = colors[Math.floor(seeded(id + 2) * colors.length)];
  return {
    id,
    name: names[Math.floor(seeded(id + 4) * names.length)],
    color, hat, glasses, coffee, laptop, bag, phone, tired, sneaky,
    programmer: (laptop ? 28 : 0) + (coffee ? 16 : 0) + (glasses ? 12 : 0) + (tired ? 12 : 0) + (color === "black" ? 8 : 0) + Math.floor(seeded(id + 21) * 12),
    slacking: (phone ? 30 : 0) + (sneaky ? 25 : 0) + (coffee && !laptop ? 10 : 0) + (!bag ? 8 : 0) + Math.floor(seeded(id + 31) * 25),
    quitting: (bag ? 22 : 0) + (laptop ? 18 : 0) + (tired ? 22 : 0) + (!coffee ? 8 : 0) + Math.floor(seeded(id + 41) * 24),
  };
}

export const rules: Rule[] = [
  { id: "hat", title: "戴帽子的去右边", hint: "包可不算帽子", left: "没戴帽子", right: "戴了帽子", stage: "明确规则", test: p => p.hat },
  { id: "coffee", title: "拿咖啡的去右边", hint: "工牌能忘，咖啡不能", left: "空手上班", right: "咖啡续命", stage: "明确规则", test: p => p.coffee },
  { id: "glasses", title: "戴眼镜的去右边", hint: "看清鼻梁上的线索", left: "视力真好", right: "眼镜一族", stage: "明确规则", test: p => p.glasses },
  { id: "bag", title: "背包的人去右边", hint: "背后的方包最显眼", left: "轻装上阵", right: "背包通勤", stage: "明确规则", test: p => p.bag },
  { id: "red", title: "红衣服去右边", hint: "只看上衣颜色", left: "其他颜色", right: "红衣员工", stage: "明确规则", test: p => p.color === "red" },
  { id: "ready", title: "背电脑并拿咖啡", hint: "两个条件必须同时满足", left: "准备不足", right: "装备齐全", stage: "组合条件", test: p => p.laptop && p.coffee },
  { id: "redNoGlasses", title: "红衣但没有眼镜", hint: "红衣 AND NOT 眼镜", left: "不符合", right: "完全符合", stage: "组合条件", test: p => p.color === "red" && !p.glasses },
  { id: "hatOrBag", title: "戴帽子或者背包", hint: "满足任意一项就行", left: "都没有", right: "至少一项", stage: "组合条件", test: p => p.hat || p.bag },
  { id: "programmer", title: "看起来像程序员", hint: "电脑、咖啡、眼镜和疲惫脸是线索", left: "不太像", right: "像程序员", stage: "推测判断", subjective: true, test: p => p.programmer, threshold: 60, ambiguous: [45, 69] },
  { id: "slacking", title: "有一种偷偷摸鱼的感觉", hint: "手机、眼神和姿势不会说谎……吧？", left: "认真工作", right: "偷偷摸鱼", stage: "全民争议", subjective: true, test: p => p.slacking, threshold: 60, ambiguous: [41, 69] },
  { id: "quitting", title: "好像马上要提离职", hint: "抱着电脑、背好包，还面无表情", left: "还能再熬", right: "准备跑路", stage: "全民争议", subjective: true, test: p => p.quitting, threshold: 62, ambiguous: [43, 72] },
];

const objectiveCycle: ObjectiveType[] = ["COUNT", "SURVIVAL", "PERFECT", "COMBO", "TARGET", "COUNT"];
const objectiveNames: Record<ObjectiveType, string> = {
  COUNT: "限时分类", SURVIVAL: "秩序生存", PERFECT: "零失误", COMBO: "连击挑战", TARGET: "指定对象",
};

export const levels: Level[] = Array.from({ length: 30 }, (_, index) => {
  const id = index + 1;
  const chapter = Math.floor(index / 6) + 1;
  const slot = index % 6;
  const objective = objectiveCycle[slot];
  const pools = [
    ["hat", "coffee", "glasses", "bag", "red"],
    ["coffee", "bag", "hatOrBag", "glasses"],
    ["ready", "redNoGlasses", "hatOrBag", "programmer"],
    ["ready", "programmer", "slacking"],
    ["programmer", "slacking", "quitting"],
  ];
  const targets: Record<ObjectiveType, number> = {
    COUNT: 12 + chapter * 2,
    SURVIVAL: 0,
    PERFECT: 8 + chapter,
    COMBO: 7 + chapter * 2,
    TARGET: 4 + chapter,
  };
  return {
    id, chapter,
    title: `${objectiveNames[objective]} · ${slot + 1}`,
    subtitle: slot === 5 ? "章节考核" : [`前台登记`, `高峰分流`, `需求鉴别`, `会议观察`, `下班审查`][chapter - 1],
    objective, target: targets[objective],
    duration: objective === "SURVIVAL" ? 35 + chapter * 3 : 32 + chapter * 2,
    ruleIds: pools[chapter - 1],
  };
});

export function objectiveText(level: Level) {
  if (level.objective === "COUNT") return `限时正确分类 ${level.target} 人`;
  if (level.objective === "SURVIVAL") return `守住秩序 ${level.duration} 秒`;
  if (level.objective === "PERFECT") return `零失误连续分类 ${level.target} 人`;
  if (level.objective === "COMBO") return `达成一次 ${level.target} 连击`;
  return `找出 ${level.target} 名右队目标`;
}

export function collectionFor(person: Person) {
  if (person.laptop && person.coffee) return collectionNames[0];
  if (person.phone && person.sneaky) return collectionNames[1];
  if (person.bag && !person.laptop) return collectionNames[2];
  if (person.tired && person.glasses) return collectionNames[3];
  if (!person.bag && !person.coffee && !person.laptop) return collectionNames[4];
  if (person.laptop && person.phone) return collectionNames[5];
  if (person.bag && person.laptop && person.coffee) return collectionNames[6];
  return collectionNames[7];
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const defaultProfile: Profile = {
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

export function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem("queue-master-profile-v2") || "{}") as Partial<Profile>;
    const merged = { ...defaultProfile, ...saved };
    if (merged.ticketDay !== todayKey()) {
      merged.tickets = 5;
      merged.ticketDay = todayKey();
    }
    return merged;
  } catch {
    return { ...defaultProfile };
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem("queue-master-profile-v2", JSON.stringify(profile));
}

export function tierIndex(points: number) {
  return Math.min(tierNames.length - 1, Math.floor(points / 100));
}
