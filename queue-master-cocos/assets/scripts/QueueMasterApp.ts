import {
    _decorator,
    Camera,
    Canvas,
    Color,
    Component,
    EventTouch,
    Node,
    ResolutionPolicy,
    UITransform,
    Vec3,
    view,
    tween,
} from 'cc';
import {
    CHAPTER_ICONS,
    CHAPTER_NAMES,
    COLLECTION_NAMES,
    createPerson,
    getRule,
    judgePerson,
    LEVELS,
    objectiveText,
    seededRandom,
    tierIndex,
    TIER_NAMES,
    todayKey,
    collectionFor,
} from './GameData';
import {
    GameSession,
    LevelConfig,
    PersonData,
    PlayerProfile,
    QueueRule,
    RunResult,
    Side,
} from './GameTypes';
import { PlatformService } from './PlatformService';
import { StorageService } from './StorageService';
import { PALETTE, UIFactory } from './UIFactory';

const { ccclass } = _decorator;

type Screen = 'home' | 'map' | 'daily' | 'pk' | 'rank' | 'office' | 'play' | 'result';

const DAILY_PROMPTS = [
    { title: '他是在认真工作，还是在假装认真？', left: '认真工作', right: '假装认真' },
    { title: '他真想加班，还是在等老板先走？', left: '真心加班', right: '等老板走' },
    { title: '他会默默解决，还是把问题甩给同事？', left: '默默解决', right: '准备甩锅' },
];

@ccclass('QueueMasterApp')
export class QueueMasterApp extends Component {
    private readonly ui = new UIFactory();
    private readonly storage = new StorageService();
    private readonly platform = new PlatformService();

    private content!: Node;
    private profile!: PlayerProfile;
    private screen: Screen = 'home';
    private chapterIndex = 0;
    private dailyIndex = 0;
    private session: GameSession | null = null;
    private runResult: RunResult | null = null;
    private challenge: { seed: number; score: number } | null = null;

    private time = 0;
    private score = 0;
    private combo = 0;
    private bestCombo = 0;
    private order = 100;
    private personIndex = 0;
    private correct = 0;
    private errors = 0;
    private targetHits = 0;
    private currentPerson!: PersonData;
    private currentRule!: QueueRule;
    private personNode: Node | null = null;
    private touchStartX = 0;
    private acceptingInput = false;
    private lastDispute: RunResult['lastDispute'];

    protected onLoad(): void {
        view.setDesignResolutionSize(720, 1280, ResolutionPolicy.FIXED_WIDTH);
        this.createRuntimeCanvas();
        this.profile = this.storage.loadProfile();
        this.challenge = this.platform.getChallenge();
        this.platform.initializeShareMenu();
    }

    protected start(): void {
        if (this.challenge) {
            this.screen = 'pk';
            this.renderPk();
        } else {
            this.renderHome();
        }
    }

    protected onDestroy(): void {
        this.unschedule(this.tick);
    }

    private createRuntimeCanvas(): void {
        const canvasNode = new Node('GameCanvas');
        this.node.addChild(canvasNode);
        canvasNode.addComponent(UITransform).setContentSize(720, 1280);

        const cameraNode = new Node('UICamera');
        canvasNode.addChild(cameraNode);
        cameraNode.setPosition(0, 0, 1000);
        const camera = cameraNode.addComponent(Camera);
        camera.projection = Camera.ProjectionType.ORTHO;
        camera.orthoHeight = 640;

        const canvas = canvasNode.addComponent(Canvas);
        canvas.cameraComponent = camera;

        this.content = new Node('Content');
        canvasNode.addChild(this.content);
        this.content.addComponent(UITransform).setContentSize(720, 1280);
    }

    private switchScreen(screen: Screen): void {
        this.unschedule(this.tick);
        this.screen = screen;
        switch (screen) {
            case 'home': this.renderHome(); break;
            case 'map': this.renderMap(); break;
            case 'daily': this.renderDaily(); break;
            case 'pk': this.renderPk(); break;
            case 'rank': this.renderRank(); break;
            case 'office': this.renderOffice(); break;
            case 'play': this.renderPlay(); break;
            case 'result': this.renderResult(); break;
        }
    }

    private background(color = PALETTE.cream): void {
        this.ui.clear(this.content);
        this.ui.panel(this.content, 'Background', 720, 1280, color, 0, 0, 0);
    }

    private topBar(title = '排队大师'): void {
        this.ui.panel(this.content, 'TopBar', 720, 92, new Color(255, 244, 210), 0, 594, 0, 4);
        this.ui.button(this.content, '排', 66, 66, PALETTE.yellow, -310, 594, () => this.switchScreen('home'));
        this.ui.text(this.content, title, 29, PALETTE.ink, -165, 608, 220, 42, true);
        this.ui.text(
            this.content,
            TIER_NAMES[tierIndex(this.profile.rankPoints)],
            15,
            PALETTE.muted,
            -165,
            578,
            220,
            30,
        );
        const stars = Object.values(this.profile.stars).reduce((sum, value) => sum + value, 0);
        this.ui.text(this.content, `★ ${stars}　币 ${this.profile.coins}`, 18, PALETTE.ink, 235, 594, 210, 42, true);
    }

    private renderHome(): void {
        this.background(new Color(255, 248, 231));
        this.topBar();

        this.ui.text(this.content, '今日待办 · 还有很多人没排', 16, PALETTE.orange, -150, 510, 380, 34, true);
        this.ui.text(this.content, '凭你的职场直觉，', 42, PALETTE.ink, -80, 456, 520, 58, true);
        this.ui.text(this.content, '把他们安排明白。', 45, PALETTE.orange, -55, 405, 560, 62, true);
        this.ui.person(this.content, createPerson(26), 205, 285, 0.72);
        const bubble = this.ui.panel(this.content, 'Bubble', 185, 90, PALETTE.white, 210, 468, 40, 4);
        this.ui.text(bubble, '领导，\n我该去哪队？', 19, PALETTE.ink, 0, 0, 150, 70, true);

        this.ui.button(
            this.content,
            '开始排队',
            620,
            104,
            PALETTE.yellow,
            0,
            205,
            () => this.switchScreen('map'),
            `主线进度 ${Object.keys(this.profile.stars).length}/30`,
        );

        const key = todayKey();
        const dailyCount = (this.profile.daily[key] ?? []).filter(Boolean).length;
        this.homeEntry(-165, 69, '今日判断', `${dailyCount}/3 个争议题`, PALETTE.orange, () => this.switchScreen('daily'));
        this.homeEntry(165, 69, '好友 PK', '同题挑战 · 输了复仇', PALETTE.blue, () => this.switchScreen('pk'));
        this.homeEntry(-165, -80, '排位赛', `${TIER_NAMES[tierIndex(this.profile.rankPoints)]} · ${this.profile.rankPoints}分`, PALETTE.yellow, () => this.switchScreen('rank'));
        this.homeEntry(165, -80, '我的办公室', `Lv.${this.profile.officeLevel} · 图鉴 ${this.profile.collection.length}/8`, PALETTE.mint, () => this.switchScreen('office'));

        const hook = this.ui.panel(this.content, 'ReturnHook', 620, 104, PALETTE.white, 0, -224, 14, 3);
        this.ui.text(hook, '昨日真相', 20, PALETTE.orange, -225, 21, 130, 30, true);
        this.ui.text(hook, '“他不是摸鱼，是在看线上报警。”', 17, PALETTE.ink, 65, 20, 430, 30);
        this.ui.text(hook, '查看少数派翻盘 →', 15, PALETTE.blue, 120, -23, 320, 28, true);
        hook.on(Node.EventType.TOUCH_END, () => this.switchScreen('daily'));

        this.ui.text(this.content, `运行平台：${this.platform.platform}`, 14, PALETTE.muted, 0, -318, 320, 28);
    }

    private homeEntry(
        x: number,
        y: number,
        title: string,
        subtitle: string,
        color: Color,
        onTap: () => void,
    ): void {
        const node = this.ui.panel(this.content, `Entry-${title}`, 300, 128, PALETTE.white, x, y, 16, 4);
        this.ui.panel(node, 'Accent', 12, 124, color, -144, 0, 5);
        this.ui.text(node, title, 26, PALETTE.ink, -5, 21, 240, 38, true);
        this.ui.text(node, subtitle, 14, PALETTE.muted, -5, -22, 250, 32);
        node.on(Node.EventType.TOUCH_END, onTap);
    }

    private renderMap(): void {
        this.background();
        this.topBar('主线闯关');
        const chapter = this.chapterIndex + 1;
        const chapterLevels = LEVELS.filter((level) => level.chapter === chapter);
        const stars = chapterLevels.reduce((sum, level) => sum + (this.profile.stars[level.id] ?? 0), 0);
        const previousStars = LEVELS
            .filter((level) => level.chapter < chapter)
            .reduce((sum, level) => sum + (this.profile.stars[level.id] ?? 0), 0);
        const chapterUnlocked = chapter === 1 || previousStars >= this.chapterIndex * 11;

        this.ui.text(this.content, `${CHAPTER_ICONS[this.chapterIndex]}　第 ${chapter} 章`, 21, PALETTE.orange, 0, 506, 320, 36, true);
        this.ui.text(this.content, CHAPTER_NAMES[this.chapterIndex], 40, PALETTE.ink, 0, 456, 460, 58, true);
        this.ui.text(this.content, `${stars}/18 星 · ${chapterUnlocked ? '已解锁' : `需要 ${this.chapterIndex * 11} 星`}`, 17, PALETTE.muted, 0, 412, 380, 34);

        if (this.chapterIndex > 0) {
            this.ui.button(this.content, '‹', 72, 65, PALETTE.white, -300, 462, () => {
                this.chapterIndex -= 1;
                this.renderMap();
            });
        }
        if (this.chapterIndex < 4) {
            this.ui.button(this.content, '›', 72, 65, PALETTE.white, 300, 462, () => {
                this.chapterIndex += 1;
                this.renderMap();
            });
        }

        chapterLevels.forEach((level, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = col === 0 ? -160 : 160;
            const y = 290 - row * 185;
            const previousPassed = level.id === 1 || Boolean(this.profile.stars[level.id - 1]) || level.id % 6 === 1;
            const available = chapterUnlocked && previousPassed;
            this.levelCard(level, x, y, available);
        });

        this.ui.text(this.content, '通关即可继续，不要求每关三星', 15, PALETTE.muted, 0, -315, 500, 30);
    }

    private levelCard(level: LevelConfig, x: number, y: number, available: boolean): void {
        const earned = this.profile.stars[level.id] ?? 0;
        const color = earned > 0 ? new Color(255, 240, 168) : available ? PALETTE.white : new Color(220, 214, 202);
        const card = this.ui.panel(this.content, `Level-${level.id}`, 285, 155, color, x, y, 16, 4);
        this.ui.text(card, `${level.id}`, 31, PALETTE.ink, -92, 39, 65, 46, true);
        this.ui.text(card, level.title, 21, PALETTE.ink, 30, 40, 185, 40, true);
        this.ui.text(card, objectiveText(level), 14, PALETTE.muted, 0, -3, 245, 32);
        this.ui.text(card, '★'.repeat(earned) + '☆'.repeat(3 - earned), 22, PALETTE.orange, 0, -45, 200, 32, true);
        if (available) {
            card.on(Node.EventType.TOUCH_END, () => {
                this.startSession({
                    mode: 'campaign',
                    level,
                    seed: level.id * 2027 + 17,
                });
            });
        } else {
            this.ui.text(card, '锁定', 15, PALETTE.red, 100, 58, 60, 28, true);
        }
    }

    private renderDaily(): void {
        this.background(new Color(255, 248, 231));
        this.topBar('今日判断');
        const key = todayKey();
        const choices = this.profile.daily[key] ?? [];
        const completedCount = choices.filter(Boolean).length;
        this.dailyIndex = Math.min(this.dailyIndex, Math.min(completedCount, 2));
        const prompt = DAILY_PROMPTS[this.dailyIndex];
        const person = createPerson(Number(key.replace(/-/g, '')) % 10000, this.dailyIndex + 40);
        const selected = choices[this.dailyIndex];
        const voteRight = 55 + Math.floor(seededRandom(person.id + this.dailyIndex) * 16);

        this.ui.text(this.content, '每日 3 题 · 先选择再看比例', 17, PALETTE.orange, 0, 505, 520, 34, true);
        this.ui.text(this.content, '今日全民判断', 39, PALETTE.ink, 0, 458, 520, 54, true);
        for (let index = 0; index < 3; index += 1) {
            const enabled = index <= completedCount;
            const color = index === this.dailyIndex ? PALETTE.yellow : PALETTE.white;
            const dot = this.ui.panel(this.content, `DailyDot-${index}`, 54, 54, color, (index - 1) * 72, 397, 27, 3);
            this.ui.text(dot, choices[index] ? '✓' : `${index + 1}`, 20, PALETTE.ink, 0, 0, 40, 34, true);
            if (enabled) dot.on(Node.EventType.TOUCH_END, () => {
                this.dailyIndex = index;
                this.renderDaily();
            });
        }

        const card = this.ui.panel(this.content, 'DailyCard', 620, 695, PALETTE.white, 0, 0, 20, 5);
        this.ui.text(card, `第 ${this.dailyIndex + 1} 题 · 荒诞职场观察`, 16, PALETTE.orange, 0, 302, 470, 32, true);
        this.ui.text(card, prompt.title, 29, PALETTE.ink, 0, 245, 540, 76, true);
        this.ui.person(card, person, 0, 40, 0.9);

        if (!selected) {
            this.ui.button(card, prompt.left, 260, 76, new Color(220, 229, 255), -142, -268, () => this.chooseDaily('LEFT'));
            this.ui.button(card, prompt.right, 260, 76, new Color(255, 216, 174), 142, -268, () => this.chooseDaily('RIGHT'));
        } else {
            const chosenText = selected === 'LEFT' ? prompt.left : prompt.right;
            this.ui.text(card, `你选择了：${chosenText}`, 20, PALETTE.ink, 0, -210, 500, 34, true);
            this.voteBar(card, prompt.left, 100 - voteRight, -252);
            this.voteBar(card, prompt.right, voteRight, -302, PALETTE.orange);
            const samePercent = selected === 'RIGHT' ? voteRight : 100 - voteRight;
            this.ui.text(
                this.content,
                samePercent < 35 ? '你站在少数派一边，明天也许会翻盘。' : '你的直觉与今天的多数玩家一致。',
                16,
                samePercent < 35 ? PALETTE.orange : PALETTE.muted,
                0,
                -388,
                580,
                34,
                true,
            );
            if (this.dailyIndex < 2) {
                this.ui.button(this.content, '下一道判断', 420, 78, PALETTE.yellow, 0, -463, () => {
                    this.dailyIndex += 1;
                    this.renderDaily();
                });
            } else if (completedCount >= 3) {
                const personality = this.ui.panel(this.content, 'Personality', 560, 106, PALETTE.mint, 0, -477, 15, 3);
                this.ui.text(personality, '今日判断人格：清醒的摸鱼侦探', 21, PALETTE.ink, 0, 18, 510, 36, true);
                this.ui.text(personality, '善于从动作里找线索，也敢站在少数派一边。', 14, PALETTE.muted, 0, -21, 500, 30);
            }
        }
    }

    private chooseDaily(side: Side): void {
        const key = todayKey();
        const choices = [...(this.profile.daily[key] ?? [])];
        if (choices[this.dailyIndex]) return;
        choices[this.dailyIndex] = side;
        this.profile.coins += 10;
        this.profile.daily = { ...this.profile.daily, [key]: choices };
        this.save();
        this.platform.vibrate(true);
        this.renderDaily();
    }

    private voteBar(parent: Node, title: string, percent: number, y: number, color = PALETTE.blue): void {
        this.ui.progress(parent, 500, 34, percent / 100, 0, y, color);
        this.ui.text(parent, `${title}　${percent}%`, 15, PALETTE.ink, 0, y, 470, 30, true);
    }

    private renderPk(): void {
        this.background(new Color(255, 248, 231));
        this.topBar('好友 PK');
        this.ui.text(this.content, '同题 · 同序列 · 固定种子', 17, PALETTE.orange, 0, 510, 480, 32, true);
        this.ui.text(this.content, this.challenge ? '朋友向你发起挑战' : '异步好友 PK', 40, PALETTE.ink, 0, 455, 560, 58, true);
        this.ui.text(
            this.content,
            '不用同时在线。双方遇到完全相同的小人和规则，\n先比得分，再比连击。',
            16,
            PALETTE.muted,
            0,
            390,
            580,
            60,
        );

        if (this.challenge) {
            const ticket = this.ui.panel(this.content, 'ChallengeTicket', 580, 520, PALETTE.white, 0, 45, 22, 5);
            this.ui.text(ticket, '好友成绩', 20, PALETTE.muted, 0, 182, 240, 36);
            this.ui.text(ticket, `${this.challenge.score}`, 72, PALETTE.orange, 0, 102, 360, 90, true);
            this.ui.text(ticket, `同一局种子 #${this.challenge.seed}`, 17, PALETTE.muted, 0, 33, 380, 34);
            this.ui.button(ticket, '接受挑战', 440, 92, PALETTE.yellow, 0, -124, () => {
                this.startSession({
                    mode: 'challenge',
                    level: LEVELS[14],
                    seed: this.challenge!.seed,
                    opponentScore: this.challenge!.score,
                });
            }, `挑战券 ${this.profile.tickets}/5`);
        } else {
            this.ui.person(this.content, createPerson(88), -165, 115, 0.76);
            this.ui.text(this.content, 'VS', 45, PALETTE.orange, 0, 130, 100, 60, true);
            this.ui.person(this.content, createPerson(99), 165, 115, 0.76);
            this.ui.text(this.content, '你', 18, PALETTE.ink, -165, -60, 100, 30, true);
            this.ui.text(this.content, '幽灵对手', 18, PALETTE.ink, 165, -60, 130, 30, true);

            const rules = this.ui.panel(this.content, 'PkRules', 590, 110, PALETTE.white, 0, -145, 14, 3);
            this.ui.text(rules, '胜负顺序：① 得分　② 最大连击　③ 准确率', 17, PALETTE.ink, 0, 19, 540, 34, true);
            this.ui.text(rules, '幽灵对手来自模拟历史成绩，不需要等待匹配。', 14, PALETTE.muted, 0, -22, 520, 28);

            this.ui.button(this.content, this.profile.tickets > 0 ? '快速匹配' : '今日挑战券用完', 580, 96, PALETTE.yellow, 0, -280, () => {
                if (this.profile.tickets <= 0) return;
                this.startSession({
                    mode: 'ranked',
                    level: LEVELS[14],
                    seed: Date.now() % 99991,
                    opponentScore: 1350 + Math.floor(Math.random() * 1150),
                });
            }, `剩余挑战券 ${this.profile.tickets}/5`);
            this.ui.button(this.content, '试玩好友挑战', 400, 72, PALETTE.white, 0, -385, () => {
                this.startSession({
                    mode: 'challenge',
                    level: LEVELS[14],
                    seed: Date.now() % 99991,
                    opponentScore: 1880,
                });
            });
        }
    }

    private renderRank(): void {
        this.background(new Color(255, 248, 231));
        this.topBar('排位赛');
        const tier = tierIndex(this.profile.rankPoints);
        const progress = this.profile.rankPoints % 100;
        const emblem = this.ui.panel(this.content, 'RankEmblem', 210, 210, PALETTE.yellow, 0, 388, 105, 6);
        this.ui.text(emblem, '冠', 83, PALETTE.ink, 0, 10, 150, 100, true);
        this.ui.text(emblem, `${tier + 1}`, 26, PALETTE.orange, 62, -68, 48, 40, true);
        this.ui.text(this.content, '第一赛季 · 互联网大厂', 17, PALETTE.orange, 0, 244, 420, 34, true);
        this.ui.text(this.content, TIER_NAMES[tier], 43, PALETTE.ink, 0, 191, 500, 58, true);
        this.ui.text(this.content, `本周再赢 ${Math.ceil((100 - progress) / 24)} 局即可晋级`, 17, PALETTE.muted, 0, 144, 420, 32);
        this.ui.progress(this.content, 560, 38, progress / 100, 0, 92, PALETTE.mint);
        this.ui.text(this.content, `${this.profile.rankPoints} / ${(tier + 1) * 100}`, 16, PALETTE.ink, 0, 92, 300, 30, true);

        this.rankRow(5, '本周目标', '赢得 3 场幽灵赛', '1/3');
        this.rankRow(-80, '晋级奖励', '秩序主管头像框', '奖');
        this.rankRow(-165, '赛季剩余', '18 天 07 小时', '时');

        this.ui.button(this.content, '开始排位', 580, 100, PALETTE.yellow, 0, -300, () => {
            if (this.profile.tickets <= 0) return;
            this.startSession({
                mode: 'ranked',
                level: LEVELS[20],
                seed: Date.now() % 99991,
                opponentScore: 1500 + Math.floor(Math.random() * 1200),
            });
        }, `消耗 1 张挑战券 · 剩余 ${this.profile.tickets}`);
        this.ui.text(this.content, '办公室等级和装饰不会影响竞技胜负', 15, PALETTE.muted, 0, -385, 500, 30);
    }

    private rankRow(y: number, label: string, value: string, badge: string): void {
        const row = this.ui.panel(this.content, `Rank-${label}`, 560, 70, PALETTE.white, 0, y, 10, 3);
        this.ui.text(row, label, 15, PALETTE.muted, -185, 0, 130, 30);
        this.ui.text(row, value, 19, PALETTE.ink, 15, 0, 300, 34, true);
        this.ui.text(row, badge, 17, PALETTE.orange, 225, 0, 60, 32, true);
    }

    private renderOffice(): void {
        this.background(new Color(255, 248, 231));
        this.topBar('我的办公室');
        this.ui.text(this.content, '视觉成长 · 不增加竞技数值', 16, PALETTE.orange, 0, 508, 450, 32, true);
        this.ui.text(this.content, '排队管理中心', 38, PALETTE.ink, 0, 460, 480, 52, true);
        this.renderOfficeRoom();

        const costs = [0, 180, 360, 720, 1200];
        const maxLevel = this.profile.officeLevel >= 5;
        const cost = costs[this.profile.officeLevel] ?? 0;
        this.ui.button(
            this.content,
            maxLevel ? '已达到最高等级' : '升级办公室',
            580,
            90,
            PALETTE.yellow,
            0,
            95,
            () => {
                if (maxLevel || this.profile.coins < cost) return;
                this.profile.coins -= cost;
                this.profile.officeLevel += 1;
                this.save();
                this.renderOffice();
            },
            maxLevel ? '首席判断官已就位' : `需要 ${cost} 金币 · 当前 ${this.profile.coins}`,
        );

        this.ui.text(this.content, `人物图鉴　${this.profile.collection.length}/${COLLECTION_NAMES.length}`, 26, PALETTE.ink, 0, 15, 500, 40, true);
        COLLECTION_NAMES.forEach((name, index) => {
            const found = this.profile.collection.includes(name);
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = col === 0 ? -160 : 160;
            const y = -72 - row * 105;
            const card = this.ui.panel(this.content, `Collection-${index}`, 292, 86, found ? PALETTE.white : new Color(232, 226, 214), x, y, 12, found ? 3 : 1);
            this.ui.text(card, found ? ['咖', '机', '包', '镜', '谜', '需', '全', '离'][index] : '?', 28, found ? PALETTE.orange : PALETTE.muted, -105, 0, 45, 40, true);
            this.ui.text(card, found ? name : '尚未发现', 16, found ? PALETTE.ink : PALETTE.muted, 25, 13, 190, 28, true);
            this.ui.text(card, found ? `误判率 ${38 + index * 5}%` : '继续主线寻找', 12, PALETTE.muted, 25, -17, 180, 24);
        });
    }

    private renderOfficeRoom(): void {
        const room = this.ui.panel(this.content, 'OfficeRoom', 620, 300, new Color(191, 225, 242), 0, 275, 18, 4);
        this.ui.panel(room, 'Floor', 612, 95, new Color(197, 157, 107), 0, -99, 0);
        this.ui.panel(room, 'Window', 180, 90, new Color(131, 200, 232), 180, 73, 2, 5);
        this.ui.text(room, '云', 28, PALETTE.white, 180, 73, 100, 40, true);
        this.ui.panel(room, 'Desk', 290, 90, new Color(187, 123, 73), 0, -25, 5, 5);
        this.ui.text(room, '▤　　　☕', 35, PALETTE.ink, 0, -15, 250, 55);
        this.ui.text(room, `办公室 Lv.${this.profile.officeLevel}`, 17, PALETTE.ink, -210, 118, 170, 30, true);
        if (this.profile.officeLevel >= 2) this.ui.text(room, '草', 44, new Color(60, 145, 90), 245, -82, 70, 60, true);
        if (this.profile.officeLevel >= 3) {
            const gate = this.ui.panel(room, 'Gate', 105, 90, new Color(154, 171, 182), -230, -47, 6, 4);
            this.ui.text(gate, '智能\n闸机', 16, PALETTE.ink, 0, 0, 80, 60, true);
        }
        if (this.profile.officeLevel >= 4) {
            const screen = this.ui.panel(room, 'DataScreen', 120, 78, PALETTE.dark, -55, 83, 4, 4);
            this.ui.text(screen, '排队\n数据', 17, PALETTE.mint, 0, 0, 90, 56, true);
        }
        if (this.profile.officeLevel >= 5) this.ui.text(room, '冠', 42, PALETTE.orange, 258, 113, 55, 55, true);
    }

    private startSession(session: GameSession): void {
        if ((session.mode === 'ranked' || session.mode === 'challenge') && this.profile.tickets > 0) {
            this.profile.tickets -= 1;
            this.save();
        }
        this.session = session;
        this.time = session.level.duration;
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.order = 100;
        this.personIndex = 0;
        this.correct = 0;
        this.errors = 0;
        this.targetHits = 0;
        this.lastDispute = undefined;
        this.switchScreen('play');
    }

    private renderPlay(): void {
        if (!this.session) return;
        this.background();
        this.ui.panel(this.content, 'GameTop', 720, 100, PALETTE.paper, 0, 590, 0, 4);
        this.ui.text(
            this.content,
            this.session.mode === 'campaign' ? `第 ${this.session.level.id} 关` : this.session.mode === 'ranked' ? '排位幽灵赛' : '好友挑战',
            15,
            PALETTE.orange,
            -235,
            611,
            190,
            28,
            true,
        );
        this.ui.text(this.content, objectiveText(this.session.level), 18, PALETTE.ink, -170, 578, 330, 34, true);
        this.ui.text(this.content, `${this.time}`, 38, PALETTE.ink, 70, 592, 90, 55, true);
        this.ui.text(this.content, `${this.score}`, 25, PALETTE.ink, 265, 592, 150, 46, true);

        this.currentPerson = createPerson(this.session.seed, this.personIndex);
        const ruleIds = this.session.level.ruleIds;
        this.currentRule = getRule(ruleIds[Math.floor(this.personIndex / 4) % ruleIds.length]);
        const subjective = this.currentRule.kind === 'score';
        const ruleCard = this.ui.panel(this.content, 'RuleCard', 720, 140, subjective ? PALETTE.orange : PALETTE.blue, 0, 470, 0, 4);
        this.ui.text(ruleCard, this.currentRule.stage, 15, PALETTE.white, 0, 44, 240, 28, true);
        this.ui.text(ruleCard, this.currentRule.title, 31, PALETTE.white, 0, 4, 610, 46, true);
        this.ui.text(ruleCard, this.currentRule.hint, 15, PALETTE.white, 0, -39, 590, 28);

        const target = this.session.level.objective === 'SURVIVAL' ? this.session.level.duration : this.session.level.target;
        const progress = this.getProgress();
        this.ui.progress(this.content, 500, 30, progress / Math.max(1, target), 0, 365, PALETTE.mint);
        this.ui.text(this.content, `${Math.min(progress, target)} / ${target}`, 15, PALETTE.ink, 0, 365, 180, 28, true);
        this.ui.text(this.content, `秩序 ${this.order}`, 15, PALETTE.muted, -250, 325, 120, 28, true);
        this.ui.progress(this.content, 150, 22, this.order / 100, -210, 298, PALETTE.mint);
        if (this.combo >= 2) this.ui.text(this.content, `${this.combo} 连击 ×${this.combo >= 10 ? 3 : this.combo >= 5 ? 2 : 1}`, 23, PALETTE.orange, 220, 315, 190, 36, true);

        const personCard = this.ui.panel(this.content, 'PersonCard', 380, 470, new Color(255, 255, 255, 235), 0, 50, 24, 5);
        this.personNode = this.ui.person(personCard, this.currentPerson, 0, 28, 0.92);
        this.ui.text(personCard, this.clueText(this.currentPerson), 14, PALETTE.muted, 0, -186, 330, 30);
        this.ui.text(personCard, '按住人物，向左或向右滑', 14, PALETTE.muted, 0, -214, 320, 26);
        personCard.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            this.touchStartX = event.getUILocation().x;
        });
        personCard.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            const distance = event.getUILocation().x - this.touchStartX;
            if (Math.abs(distance) >= 45) this.classify(distance > 0 ? 'RIGHT' : 'LEFT');
        });

        this.ui.button(this.content, this.currentRule.leftLabel, 348, 160, new Color(203, 215, 250), -179, -458, () => this.classify('LEFT'), '← 左队');
        this.ui.button(this.content, this.currentRule.rightLabel, 348, 160, new Color(255, 211, 158), 179, -458, () => this.classify('RIGHT'), '右队 →');
        this.acceptingInput = true;
        this.schedule(this.tick, 1);
    }

    private readonly tick = (): void => {
        if (this.screen !== 'play' || !this.session) return;
        this.time -= 1;
        if (this.time <= 0) {
            this.finishRun();
            return;
        }
        this.refreshPlayNumbers();
    };

    private refreshPlayNumbers(): void {
        if (this.screen !== 'play') return;
        // 每秒重绘一次顶部数字，结构简单且不会积累节点。
        this.unschedule(this.tick);
        this.renderPlay();
    }

    private classify(side: Side): void {
        if (!this.acceptingInput || !this.session || !this.personNode) return;
        this.acceptingInput = false;
        this.unschedule(this.tick);
        const judged = judgePerson(this.currentPerson, this.currentRule, side);
        const targetX = side === 'LEFT' ? -560 : 560;
        tween(this.personNode)
            .to(0.22, { position: new Vec3(targetX, -80, 0) })
            .start();

        let feedback = '';
        let feedbackColor = PALETTE.mint;
        if (judged.result === 'CORRECT') {
            this.correct += 1;
            this.combo += 1;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            if (side === 'RIGHT') this.targetHits += 1;
            const multiplier = this.combo >= 10 ? 3 : this.combo >= 5 ? 2 : 1;
            this.score += 100 * multiplier;
            this.order = Math.min(100, this.order + 3);
            feedback = this.combo >= 10 ? '狂热分类 ×3' : '判断正确';
            this.platform.vibrate(true);
        } else if (judged.result === 'WRONG') {
            this.errors += 1;
            this.combo = 0;
            this.order = Math.max(0, this.order - 22);
            feedback = this.session.level.objective === 'PERFECT' ? '零失误失败！' : '队伍乱了 −22';
            feedbackColor = PALETTE.red;
            this.platform.vibrate(false);
        } else {
            this.correct += 1;
            this.score += 50;
            const agreePercent = side === 'RIGHT' ? judged.voteRight : 100 - judged.voteRight;
            this.lastDispute = {
                person: this.currentPerson,
                rule: this.currentRule,
                side,
                agreePercent,
            };
            feedback = `存在争议 · ${judged.voteRight}% 选右边`;
            feedbackColor = PALETTE.yellow;
        }
        const badge = this.ui.panel(this.content, 'Feedback', 370, 72, feedbackColor, 0, 95, 14, 4);
        this.ui.text(badge, feedback, 23, judged.result === 'WRONG' ? PALETTE.white : PALETTE.ink, 0, 0, 330, 40, true);

        this.scheduleOnce(() => {
            if (!this.session) return;
            if (this.order <= 0 || (this.session.level.objective === 'PERFECT' && this.errors > 0)) {
                this.finishRun(false);
                return;
            }
            if (this.hasReachedGoal()) {
                this.finishRun(true);
                return;
            }
            this.personIndex += 1;
            this.switchScreen('play');
        }, 0.36);
    }

    private getProgress(): number {
        if (!this.session) return 0;
        switch (this.session.level.objective) {
            case 'COUNT':
            case 'PERFECT': return this.correct;
            case 'COMBO': return this.bestCombo;
            case 'TARGET': return this.targetHits;
            case 'SURVIVAL': return this.session.level.duration - this.time;
        }
    }

    private hasReachedGoal(): boolean {
        if (!this.session) return false;
        const level = this.session.level;
        switch (level.objective) {
            case 'COUNT': return this.correct >= level.target;
            case 'PERFECT': return this.errors === 0 && this.correct >= level.target;
            case 'COMBO': return this.bestCombo >= level.target;
            case 'TARGET': return this.targetHits >= level.target;
            case 'SURVIVAL': return false;
        }
    }

    private finishRun(forcedWon?: boolean): void {
        if (!this.session || this.screen !== 'play') return;
        this.acceptingInput = false;
        this.unschedule(this.tick);
        const level = this.session.level;
        let won = forcedWon ?? (
            level.objective === 'SURVIVAL'
                ? this.order > 0
                : this.hasReachedGoal()
        );
        if (this.order <= 0) won = false;
        const attempts = this.correct + this.errors;
        const accuracy = attempts > 0 ? this.correct / attempts : 0;
        const stars = won ? 1 + (accuracy >= 0.9 ? 1 : 0) + (this.errors === 0 || this.bestCombo >= 12 ? 1 : 0) : 0;
        this.runResult = {
            session: this.session,
            score: this.score,
            correct: this.correct,
            errors: this.errors,
            bestCombo: this.bestCombo,
            targetHits: this.targetHits,
            stars,
            won,
            lastDispute: this.lastDispute,
        };
        this.applyRunResult(this.runResult);
        this.switchScreen('result');
    }

    private applyRunResult(result: RunResult): void {
        const reward = result.won ? 30 + result.stars * 10 : 10;
        const currentStars = this.profile.stars[result.session.level.id] ?? 0;
        const person = createPerson(result.session.seed, result.correct + result.errors);
        const collectible = collectionFor(person);
        if (!this.profile.collection.includes(collectible)) {
            this.profile.collection.push(collectible);
        }
        this.profile.coins += reward;
        this.profile.totalGames += 1;
        this.profile.bestScores[result.session.level.id] = Math.max(
            this.profile.bestScores[result.session.level.id] ?? 0,
            result.score,
        );
        if (result.session.mode === 'campaign') {
            this.profile.stars[result.session.level.id] = Math.max(currentStars, result.stars);
        } else if (result.session.opponentScore) {
            this.profile.rankPoints = Math.max(
                0,
                this.profile.rankPoints + (result.score >= result.session.opponentScore ? 24 : -8),
            );
        }
        this.save();
    }

    private renderResult(): void {
        if (!this.runResult) return;
        const result = this.runResult;
        this.background(new Color(255, 244, 211));
        this.topBar('结算中心');
        const badgeColor = result.won ? PALETTE.mint : PALETTE.red;
        const badge = this.ui.panel(this.content, 'ResultBadge', 180, 52, badgeColor, 0, 500, 10, 3);
        this.ui.text(badge, result.won ? '通关' : '再试一次', 20, result.won ? PALETTE.ink : PALETTE.white, 0, 0, 150, 34, true);
        this.ui.text(this.content, result.won ? '这队排得有点水平' : '队伍还需要抢救', 37, PALETTE.ink, 0, 440, 580, 54, true);
        this.ui.text(this.content, '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars), 48, PALETTE.orange, 0, 375, 330, 60, true);

        const accuracy = Math.round(result.correct / Math.max(1, result.correct + result.errors) * 100);
        this.resultStat(-205, 280, `${result.score}`, '本局得分');
        this.resultStat(0, 280, `${accuracy}%`, '准确率');
        this.resultStat(205, 280, `${result.bestCombo}`, '最高连击');

        if (result.session.opponentScore) {
            const duel = this.ui.panel(this.content, 'Duel', 580, 100, PALETTE.dark, 0, 167, 14, 3);
            this.ui.text(duel, `你 ${result.score}`, 25, PALETTE.white, -165, 0, 190, 40, true);
            this.ui.text(duel, 'VS', 25, PALETTE.yellow, 0, 0, 80, 40, true);
            this.ui.text(duel, `对手 ${result.session.opponentScore}`, 25, PALETTE.white, 165, 0, 220, 40, true);
        }

        if (result.lastDispute) {
            const dispute = this.ui.panel(this.content, 'Dispute', 580, 175, PALETTE.white, 0, result.session.opponentScore ? 20 : 105, 15, 4);
            this.ui.person(dispute, result.lastDispute.person, -205, -15, 0.38);
            this.ui.text(dispute, '本局争议最大', 14, PALETTE.orange, 85, 50, 290, 28, true);
            this.ui.text(dispute, result.lastDispute.rule.title, 22, PALETTE.ink, 90, 10, 330, 42, true);
            this.ui.text(dispute, `你和 ${result.lastDispute.agreePercent}% 的玩家想法一致`, 15, PALETTE.muted, 90, -42, 340, 30);
        }

        const rewardY = result.lastDispute ? -104 : 22;
        this.ui.text(this.content, `本局奖励　币 ${result.won ? 30 + result.stars * 10 : 10}`, 20, PALETTE.orange, 0, rewardY, 460, 36, true);
        this.ui.button(this.content, '生成挑战', 580, 90, PALETTE.yellow, 0, -210, () => {
            this.platform.shareChallenge(result.session.seed, result.score);
        }, '分享同一批人物和规则');
        this.ui.button(this.content, result.session.opponentScore && result.score < result.session.opponentScore ? '立即复仇' : '再来一局', 275, 76, PALETTE.white, -150, -320, () => {
            this.startSession(result.session);
        });
        this.ui.button(this.content, '返回首页', 275, 76, PALETTE.white, 150, -320, () => this.switchScreen('home'));
        this.ui.text(this.content, '当前为前端验证版，成绩保存在本机。', 14, PALETTE.muted, 0, -405, 500, 28);
    }

    private resultStat(x: number, y: number, value: string, title: string): void {
        const card = this.ui.panel(this.content, `Stat-${title}`, 190, 110, PALETTE.white, x, y, 12, 3);
        this.ui.text(card, value, 30, PALETTE.ink, 0, 18, 150, 42, true);
        this.ui.text(card, title, 14, PALETTE.muted, 0, -24, 140, 28);
    }

    private clueText(person: PersonData): string {
        const clues: string[] = [];
        if (person.hasHat) clues.push('帽子');
        if (person.hasGlasses) clues.push('眼镜');
        if (person.hasCoffee) clues.push('咖啡');
        if (person.hasLaptop) clues.push('电脑');
        if (person.checkingPhone) clues.push('手机');
        return clues.length ? clues.join(' · ') : '没有明显配饰';
    }

    private save(): void {
        this.storage.saveProfile(this.profile);
    }
}
