import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  chapterIcons, chapterNames, collectionFor, collectionNames, defaultProfile, Level, levels,
  loadProfile, makePerson, Mode, objectiveText, Person, Profile, Rule, rules, saveProfile,
  seeded, Side, tierIndex, tierNames, todayKey,
} from "./game";

type Screen = "home" | "map" | "play" | "result" | "daily" | "pk" | "rank" | "office";
type Session = { mode: Mode; level: Level; seed: number; opponent?: number };
type RunResult = {
  session: Session; score: number; correct: number; errors: number; bestCombo: number;
  targetHits: number; stars: number; won: boolean; last?: { person: Person; rule: Rule; side: Side; percent: number };
};

function PersonArt({ person, mini = false }: { person: Person; mini?: boolean }) {
  return <div className={`person ${mini ? "mini" : ""}`}>
    <div className="shadow" />
    {person.bag && <div className="bag">▦</div>}
    <div className="legs"><i /><i /></div>
    <div className={`body shirt-${person.color}`}>{person.laptop && <span className="laptop">⌁</span>}</div>
    <div className="arm left-arm">{person.coffee && <span className="coffee">☕</span>}</div>
    <div className="arm right-arm">{person.phone && <span className="phone">▣</span>}</div>
    <div className="head">
      <span className="hair" />{person.hat && <span className="hat" />}
      {person.glasses && <span className="glasses"><i /><i /></span>}
      <span className={`mouth ${person.tired ? "tired" : ""}`} />{person.sneaky && <span className="sneaky">›</span>}
    </div>
    {!mini && <div className="name">{person.name}</div>}
  </div>;
}

function TopBar({ profile, onHome, title }: { profile: Profile; onHome?: () => void; title?: string }) {
  return <header className="brandbar">
    <button className="logo" onClick={onHome} aria-label="返回首页">排</button>
    <div><strong>{title || "排队大师"}</strong><small>{tierNames[tierIndex(profile.rankPoints)]}</small></div>
    <div className="wallet"><span>⭐ {Object.values(profile.stars).reduce((a, b) => a + b, 0)}</span><span>🪙 {profile.coins}</span></div>
  </header>;
}

function HomeScreen({ profile, go }: { profile: Profile; go: (screen: Screen) => void }) {
  const stars = Object.values(profile.stars).reduce((a, b) => a + b, 0);
  return <div className="home-screen scroll">
    <section className="hero">
      <div><span className="eyebrow">今日待办 · 还有很多人没排</span><h1>凭你的职场直觉，<br /><em>把他们安排明白。</em></h1></div>
      <div className="hero-art"><PersonArt person={makePerson(26)} /><i>领导，<br />我该去哪队？</i></div>
      <button className="primary big" onClick={() => go("map")}><b>开始排队</b><small>主线进度 {Object.keys(profile.stars).length}/30 · {stars} 星</small></button>
    </section>
    <section className="entry-grid">
      <button className="entry daily-entry" onClick={() => go("daily")}><span>🗳️</span><div><b>今日判断</b><small>3 个全民争议题</small></div><i>{profile.daily[todayKey()]?.filter(Boolean).length || 0}/3</i></button>
      <button className="entry" onClick={() => go("pk")}><span>⚔️</span><div><b>好友 PK</b><small>同题挑战 · 输了复仇</small></div><i>去挑战</i></button>
      <button className="entry" onClick={() => go("rank")}><span>🏆</span><div><b>排位赛</b><small>{tierNames[tierIndex(profile.rankPoints)]}</small></div><i>{profile.rankPoints} 分</i></button>
      <button className="entry office-entry" onClick={() => go("office")}><span>🏢</span><div><b>我的办公室</b><small>Lv.{profile.officeLevel} · 图鉴 {profile.collection.length}/{collectionNames.length}</small></div><i>装修</i></button>
    </section>
    <div className="return-hook"><b>昨日真相</b><span>“他不是摸鱼，是在看线上报警。”</span><button onClick={() => go("daily")}>查看少数派翻盘 →</button></div>
  </div>;
}

function MapScreen({ profile, onPlay }: { profile: Profile; onPlay: (level: Level) => void }) {
  return <div className="map-screen scroll">
    <div className="page-heading"><span>30 个主线关卡</span><h1>职场众生排队图</h1><p>通关即可继续，累计约 60% 星星就能进入下一章。</p></div>
    {chapterNames.map((name, ci) => {
      const chapterLevels = levels.filter(l => l.chapter === ci + 1);
      const chapterStars = chapterLevels.reduce((sum, l) => sum + (profile.stars[l.id] || 0), 0);
      const priorStars = levels.filter(l => l.chapter < ci + 1).reduce((sum, l) => sum + (profile.stars[l.id] || 0), 0);
      const unlocked = ci === 0 || priorStars >= ci * 11;
      return <section className={`chapter ${unlocked ? "" : "locked"}`} key={name}>
        <div className="chapter-title"><i>{chapterIcons[ci]}</i><div><small>第 {ci + 1} 章 · {chapterStars}/18 星</small><h2>{name}</h2></div>{!unlocked && <b>🔒 需 {ci * 11} 星</b>}</div>
        <div className="level-row">
          {chapterLevels.map(level => {
            const previousPassed = level.id === 1 || !!profile.stars[level.id - 1] || level.id % 6 === 1;
            const available = unlocked && previousPassed;
            return <button key={level.id} className={`level-node ${profile.stars[level.id] ? "passed" : ""}`} disabled={!available} onClick={() => onPlay(level)}>
              <b>{level.id}</b><span>{"★".repeat(profile.stars[level.id] || 0)}{"☆".repeat(3 - (profile.stars[level.id] || 0))}</span>
              <small>{level.objective === "SURVIVAL" ? "生存" : level.objective === "PERFECT" ? "无错" : level.objective === "COMBO" ? "连击" : level.objective === "TARGET" ? "找人" : "数量"}</small>
            </button>;
          })}
        </div>
      </section>;
    })}
  </div>;
}

function PlayScreen({ session, onFinish }: { session: Session; onFinish: (result: RunResult) => void }) {
  const [time, setTime] = useState(session.level.duration);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [order, setOrder] = useState(100);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [targetHits, setTargetHits] = useState(0);
  const [flight, setFlight] = useState<Side | null>(null);
  const [feedback, setFeedback] = useState<{ kind: string; text: string } | null>(null);
  const [last, setLast] = useState<RunResult["last"]>();
  const dragX = useRef<number | null>(null);
  const finished = useRef(false);
  const person = useMemo(() => makePerson(session.seed, index), [session.seed, index]);
  const availableRules = useMemo(() => rules.filter(r => session.level.ruleIds.includes(r.id)), [session.level.ruleIds]);
  const rule = availableRules[Math.floor(index / 4) % availableRules.length];
  const accuracy = correct + errors ? correct / (correct + errors) : 1;

  const finish = useCallback((forcedWon?: boolean) => {
    if (finished.current) return;
    finished.current = true;
    let won = forcedWon ?? true;
    if (session.level.objective === "COUNT") won = correct >= session.level.target;
    if (session.level.objective === "SURVIVAL") won = order > 0;
    if (session.level.objective === "PERFECT") won = errors === 0 && correct >= session.level.target;
    if (session.level.objective === "COMBO") won = best >= session.level.target;
    if (session.level.objective === "TARGET") won = targetHits >= session.level.target;
    const stars = won ? 1 + (accuracy >= .9 ? 1 : 0) + (errors === 0 || best >= 12 ? 1 : 0) : 0;
    onFinish({ session, score, correct, errors, bestCombo: best, targetHits, stars, won, last });
  }, [accuracy, best, correct, errors, last, onFinish, order, score, session, targetHits]);

  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    const timer = window.setInterval(() => setTime(value => {
      if (value <= 1) {
        window.clearInterval(timer);
        window.setTimeout(() => finishRef.current(), 0);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [session.seed]);

  useEffect(() => {
    const level = session.level;
    if (level.objective === "COUNT" && correct >= level.target) finish(true);
    if (level.objective === "PERFECT" && correct >= level.target) finish(true);
    if (level.objective === "COMBO" && best >= level.target) finish(true);
    if (level.objective === "TARGET" && targetHits >= level.target) finish(true);
  }, [best, correct, finish, session.level, targetHits]);
  useEffect(() => {
    if (order <= 0) finish(false);
  }, [finish, order]);

  const classify = useCallback((side: Side) => {
    if (flight || finished.current) return;
    const value = rule.test(person);
    let result: "correct" | "wrong" | "ambiguous";
    let expected: Side;
    if (rule.subjective && typeof value === "number") {
      const [low, high] = rule.ambiguous || [45, 65];
      expected = value >= (rule.threshold || 60) ? "RIGHT" : "LEFT";
      result = value >= low && value <= high ? "ambiguous" : expected === side ? "correct" : "wrong";
    } else {
      expected = value ? "RIGHT" : "LEFT";
      result = expected === side ? "correct" : "wrong";
    }
    setFlight(side);
    if (result === "correct") {
      const nextCombo = combo + 1;
      setCorrect(v => v + 1); setCombo(nextCombo); setBest(v => Math.max(v, nextCombo));
      if (side === "RIGHT") setTargetHits(v => v + 1);
      setScore(v => v + 100 * (nextCombo >= 10 ? 3 : nextCombo >= 5 ? 2 : 1));
      setOrder(v => Math.min(100, v + 3));
      setFeedback({ kind: result, text: nextCombo >= 10 ? "狂热分类 ×3" : "判断正确" });
    } else if (result === "wrong") {
      setErrors(v => v + 1); setCombo(0); setOrder(v => Math.max(0, v - 22));
      setFeedback({ kind: result, text: session.level.objective === "PERFECT" ? "零失误失败！" : "队伍乱了 −22" });
      if (session.level.objective === "PERFECT") window.setTimeout(() => finish(false), 390);
    } else {
      const percent = 52 + Math.floor(seeded(person.id + rule.title.length) * 18);
      setCorrect(v => v + 1); setScore(v => v + 50);
      setLast({ person, rule, side, percent: side === "RIGHT" ? percent : 100 - percent });
      setFeedback({ kind: result, text: `存在争议 · ${percent}% 选右边` });
    }
    window.setTimeout(() => { setIndex(v => v + 1); setFlight(null); setFeedback(null); }, 420);
  }, [combo, finish, flight, person, rule, session.level.objective]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") classify("LEFT");
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") classify("RIGHT");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [classify]);

  const progress = session.level.objective === "COUNT" || session.level.objective === "PERFECT" ? correct
    : session.level.objective === "COMBO" ? best : session.level.objective === "TARGET" ? targetHits : session.level.duration - time;
  const target = session.level.objective === "SURVIVAL" ? session.level.duration : session.level.target;
  const opponentProgress = session.opponent ? Math.min(99, Math.floor((session.level.duration - time) / session.level.duration * 100 + seeded(session.seed) * 9)) : 0;

  return <div className="play-screen">
    <div className="play-top">
      <div><small>{session.mode === "campaign" ? `第 ${session.level.id} 关` : session.mode === "ranked" ? "排位幽灵赛" : "好友挑战"}</small><b>{objectiveText(session.level)}</b></div>
      <div className="timer"><b>{time}</b><small>秒</small></div>
      <div className="scorebox"><small>得分</small><b>{score}</b></div>
    </div>
    {session.opponent && <div className="versus-progress"><span>你 <b>{Math.round(progress / Math.max(1, target) * 100)}%</b></span><i><em style={{ width: `${Math.min(100, progress / Math.max(1, target) * 100)}%` }} /></i><span>对手 <b>{opponentProgress}%</b></span></div>}
    <div className={`rule-card ${rule.subjective ? "subjective" : ""}`}><span>{rule.stage}</span><h2>{rule.title}</h2><p>{rule.hint}</p></div>
    <div className="work-zone">
      <div className="order-meter"><small>秩序</small><i><em style={{ width: `${order}%` }} /></i></div>
      {combo >= 2 && <div className="combo"><b>{combo}</b> 连击 <i>×{combo >= 10 ? 3 : combo >= 5 ? 2 : 1}</i></div>}
      <div className={`person-card ${flight === "LEFT" ? "fly-left" : flight === "RIGHT" ? "fly-right" : ""}`}
        onPointerDown={e => { dragX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={e => { if (dragX.current === null) return; const d = e.clientX - dragX.current; dragX.current = null; if (Math.abs(d) > 34) classify(d > 0 ? "RIGHT" : "LEFT"); }}>
        <PersonArt person={person} />
        <div className="clues">{person.hat && <span>帽子</span>}{person.glasses && <span>眼镜</span>}{person.coffee && <span>咖啡</span>}{person.laptop && <span>电脑</span>}{person.phone && <span>手机</span>}</div>
        <small>按住人物，向左或向右滑</small>
      </div>
      {feedback && <div className={`feedback ${feedback.kind}`}>{feedback.text}</div>}
      <div className="goal-progress"><i style={{ width: `${Math.min(100, progress / Math.max(1, target) * 100)}%` }} /><span>{Math.min(progress, target)} / {target}</span></div>
    </div>
    <div className="queues">
      <button className="queue left" onClick={() => classify("LEFT")}><span>←</span><small>左队</small><b>{rule.left}</b></button>
      <button className="queue right" onClick={() => classify("RIGHT")}><span>→</span><small>右队</small><b>{rule.right}</b></button>
    </div>
  </div>;
}

function ResultScreen({ result, profile, onAgain, onExit }: { result: RunResult; profile: Profile; onAgain: () => void; onExit: () => void }) {
  const [shareState, setShareState] = useState("生成挑战链接");
  const accuracy = Math.round(result.correct / Math.max(1, result.correct + result.errors) * 100);
  const opponent = result.session.opponent;
  const opponentScore = opponent || 0;
  const wonPk = !opponent || result.score >= opponentScore;
  const share = async () => {
    const url = new URL(location.href);
    url.search = `?mode=challenge&seed=${result.session.seed}&score=${result.score}`;
    const text = `我在《排队大师》拿到 ${result.score} 分、${result.bestCombo} 连击。用同一批打工人来挑战我：`;
    try {
      if (navigator.share) await navigator.share({ title: "排队大师 · 好友挑战", text, url: url.toString() });
      else await navigator.clipboard.writeText(`${text} ${url}`);
      setShareState("链接已复制，等好友来战");
    } catch { setShareState("分享取消"); }
  };
  return <div className="result-screen scroll">
    <div className={`result-badge ${result.won ? "win" : "lose"}`}>{result.won ? "通关" : "再试一次"}</div>
    <h1>{opponent ? (wonPk ? "你把对手安排明白了" : "对手暂时领先") : result.won ? "这队排得有点水平" : "队伍还需要抢救"}</h1>
    <div className="stars-earned">{"★".repeat(result.stars)}{"☆".repeat(3 - result.stars)}</div>
    <div className="result-grid">
      <div><b>{result.score}</b><small>本局得分</small></div><div><b>{accuracy}%</b><small>准确率</small></div><div><b>{result.bestCombo}</b><small>最高连击</small></div>
    </div>
    {opponent && <div className="duel-card"><div><small>你的成绩</small><b>{result.score}</b></div><strong>VS</strong><div><small>对手成绩</small><b>{opponentScore}</b></div></div>}
    {result.last && <div className="dispute-card">
      <div className="mini-person"><PersonArt person={result.last.person} mini /></div>
      <div><small>本局争议最大</small><h2>{result.last.rule.title}</h2><p>你和 <b>{result.last.percent}%</b> 的玩家想法一致</p></div>
    </div>}
    <div className="reward-strip"><span>本局奖励</span><b>🪙 {result.won ? 30 + result.stars * 10 : 10}</b><small>办公室和图鉴进度已保存</small></div>
    <button className="primary" onClick={share}>{shareState}</button>
    <div className="result-actions"><button onClick={onAgain}>{opponent && !wonPk ? "立即复仇" : "再来一局"}</button><button onClick={onExit}>返回首页</button></div>
    <small className="storage-note">当前为 H5 验证版：成绩保存在本机浏览器。</small>
  </div>;
}

const dailyPrompts = [
  { title: "他是在认真工作，还是在假装认真？", left: "认真工作", right: "假装认真", rule: rules[9] },
  { title: "他真想加班，还是在等老板先走？", left: "真心加班", right: "等老板走", rule: rules[10] },
  { title: "他会默默解决，还是把问题甩给同事？", left: "默默解决", right: "准备甩锅", rule: rules[8] },
];

function DailyScreen({ profile, update }: { profile: Profile; update: (next: Profile) => void }) {
  const key = todayKey();
  const choices = profile.daily[key] || [];
  const [active, setActive] = useState(Math.min(choices.length, 2));
  const person = makePerson(Number(key.replaceAll("-", "")) % 10000, active + 40);
  const prompt = dailyPrompts[active];
  const selected = choices[active];
  const voteRight = 55 + Math.floor(seeded(person.id + active) * 16);
  const choose = (side: Side) => {
    if (selected) return;
    const nextChoices = [...choices]; nextChoices[active] = side;
    update({ ...profile, coins: profile.coins + 10, daily: { ...profile.daily, [key]: nextChoices } });
  };
  const completedCount = choices.filter(Boolean).length;
  const completed = completedCount >= 3;
  return <div className="daily-screen scroll">
    <div className="page-heading"><span>每日 3 题 · {key}</span><h1>今日全民判断</h1><p>先做选择，才能看到“全服”倾向。没有标准答案，只有不同直觉。</p></div>
    <div className="daily-dots">{dailyPrompts.map((_, i) => <button key={i} disabled={i > completedCount} className={i === active ? "active" : ""} onClick={() => setActive(i)}>{choices[i] ? "✓" : i + 1}</button>)}</div>
    <div className="daily-card">
      <div className="question-tag">第 {active + 1} 题 · 荒诞职场观察</div>
      <h2>{prompt.title}</h2>
      <div className="daily-person"><PersonArt person={person} /></div>
      {!selected ? <div className="daily-options"><button onClick={() => choose("LEFT")}>{prompt.left}</button><button onClick={() => choose("RIGHT")}>{prompt.right}</button></div>
        : <div className="vote-result">
          <b>你选择了：{selected === "LEFT" ? prompt.left : prompt.right}</b>
          <div><i style={{ width: `${100 - voteRight}%` }} /><span>{prompt.left} {100 - voteRight}%</span></div>
          <div className="right-vote"><i style={{ width: `${voteRight}%` }} /><span>{prompt.right} {voteRight}%</span></div>
          <p>{(selected === "RIGHT" ? voteRight : 100 - voteRight) < 35 ? "你站在少数派一边。明天回来，也许新线索会让你翻盘。" : "你的直觉与今天的多数玩家一致。"}</p>
        </div>}
    </div>
    {selected && active < 2 && <button className="primary" onClick={() => setActive(active + 1)}>下一道判断</button>}
    {completed && <div className="personality"><span>今日判断人格</span><h2>清醒的摸鱼侦探</h2><p>你善于从动作里找线索，也愿意在关键时刻站到少数派一边。</p></div>}
  </div>;
}

function PkScreen({ profile, challenge, start }: { profile: Profile; challenge?: { seed: number; score: number }; start: (session: Session) => void }) {
  const level = levels[14];
  const quick = () => start({ mode: "ranked", level, seed: Date.now() % 99991, opponent: 1350 + Math.floor(Math.random() * 1150) });
  const friend = () => start({ mode: "challenge", level, seed: challenge?.seed || Date.now() % 99991, opponent: challenge?.score || 1880 });
  return <div className="pk-screen scroll">
    <div className="page-heading"><span>同题 · 同序列 · 固定种子</span><h1>{challenge ? "朋友向你发起挑战" : "异步好友 PK"}</h1><p>不用同时在线。双方面对完全相同的小人和规则，先比得分，再比连击。</p></div>
    {challenge ? <div className="challenge-ticket"><span>好友成绩</span><b>{challenge.score}</b><small>接受后将使用种子 #{challenge.seed}</small><button className="primary" onClick={friend}>接受挑战</button></div>
      : <>
        <div className="pk-visual"><div><PersonArt person={makePerson(88)} /><b>你</b></div><strong>VS</strong><div><PersonArt person={makePerson(99)} /><b>幽灵对手</b></div></div>
        <div className="pk-rules"><b>胜负顺序</b><span>① 得分　② 最大连击　③ 准确率</span><small>幽灵对手来自模拟历史成绩，无需等待匹配。</small></div>
        <button className="primary" onClick={quick} disabled={profile.tickets <= 0}><b>{profile.tickets > 0 ? "快速匹配" : "今日挑战券用完"}</b><small>剩余挑战券 {profile.tickets}/5</small></button>
        <button className="secondary" onClick={friend}>试玩好友挑战</button>
      </>}
  </div>;
}

function RankScreen({ profile, start }: { profile: Profile; start: () => void }) {
  const tier = tierIndex(profile.rankPoints);
  const progress = profile.rankPoints % 100;
  return <div className="rank-screen scroll">
    <div className="rank-emblem">🏆<i>{tier + 1}</i></div><span className="season-tag">第一赛季 · 互联网大厂</span>
    <h1>{tierNames[tier]}</h1><p>本周再赢 <b>{Math.ceil((100 - progress) / 24)}</b> 局即可晋级</p>
    <div className="rank-progress"><i style={{ width: `${progress}%` }} /><span>{profile.rankPoints} / {(tier + 1) * 100}</span></div>
    <div className="season-list">
      <div><span>本周目标</span><b>赢得 3 场幽灵赛</b><i>1/3</i></div>
      <div><span>晋级奖励</span><b>“秩序主管”头像框</b><i>🎁</i></div>
      <div><span>赛季剩余</span><b>18 天 07 小时</b><i>⏳</i></div>
    </div>
    <button className="primary" disabled={!profile.tickets} onClick={start}><b>开始排位</b><small>消耗 1 张挑战券 · 剩余 {profile.tickets}</small></button>
    <p className="fair-note">竞技题目完全一致，装饰和办公室等级不会影响胜负。</p>
  </div>;
}

function OfficeScreen({ profile, update }: { profile: Profile; update: (next: Profile) => void }) {
  const costs = [0, 180, 360, 720, 1200];
  const max = profile.officeLevel >= 5;
  const upgrade = () => {
    const cost = costs[profile.officeLevel];
    if (!max && profile.coins >= cost) update({ ...profile, coins: profile.coins - cost, officeLevel: profile.officeLevel + 1 });
  };
  return <div className="office-screen scroll">
    <div className="page-heading"><span>视觉成长 · 不加竞技数值</span><h1>我的排队管理中心</h1><p>通关赚金币，把破旧前台慢慢改成首席判断官办公室。</p></div>
    <div className={`office-view level-${profile.officeLevel}`}>
      <div className="office-window">☁️</div><div className="desk">▤<i>☕</i></div><div className="chair">♟</div>
      {profile.officeLevel >= 2 && <div className="plant">🌿</div>}
      {profile.officeLevel >= 3 && <div className="gate">智能<br />闸机</div>}
      {profile.officeLevel >= 4 && <div className="screen">排队<br />数据</div>}
      {profile.officeLevel >= 5 && <div className="trophy">🏆</div>}
      <span>办公室 Lv.{profile.officeLevel}</span>
    </div>
    <button className="primary" disabled={max || profile.coins < costs[profile.officeLevel]} onClick={upgrade}>
      <b>{max ? "已达到最高等级" : "升级办公室"}</b>
      <small>{max ? "首席判断官已就位" : `需要 ${costs[profile.officeLevel]} 金币 · 当前 ${profile.coins}`}</small>
    </button>
    <div className="collection-title"><div><span>人物图鉴</span><h2>{profile.collection.length}/{collectionNames.length} 已发现</h2></div><small>正确分类时随机解锁</small></div>
    <div className="collection-grid">{collectionNames.map((name, i) => {
      const found = profile.collection.includes(name);
      return <div className={found ? "found" : ""} key={name}><i>{found ? ["☕", "📱", "🎒", "🤓", "👤", "💻", "🧳", "😶"][i] : "?"}</i><b>{found ? name : "尚未发现"}</b><small>{found ? `全服误判率 ${38 + i * 5}%` : "继续主线寻找"}</small></div>;
    })}</div>
  </div>;
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => typeof localStorage === "undefined" ? defaultProfile : loadProfile());
  const [screen, setScreen] = useState<Screen>("home");
  const [session, setSession] = useState<Session>();
  const [result, setResult] = useState<RunResult>();
  const [challenge, setChallenge] = useState<{ seed: number; score: number }>();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("mode") === "challenge") {
      const seed = Number(query.get("seed")), score = Number(query.get("score"));
      if (seed && score) { setChallenge({ seed, score }); setScreen("pk"); }
    }
  }, []);
  const updateProfile = useCallback((next: Profile) => { setProfile(next); saveProfile(next); }, []);
  const go = (next: Screen) => { setScreen(next); if (next === "home") history.replaceState({}, "", location.pathname); };
  const begin = (next: Session) => {
    if ((next.mode === "ranked" || next.mode === "challenge") && profile.tickets > 0) updateProfile({ ...profile, tickets: profile.tickets - 1 });
    setSession(next); setResult(undefined); setScreen("play");
  };
  const complete = (run: RunResult) => {
    const reward = run.won ? 30 + run.stars * 10 : 10;
    const currentStars = profile.stars[run.session.level.id] || 0;
    const person = makePerson(run.session.seed, run.correct + run.errors);
    const collectible = collectionFor(person);
    const collection = profile.collection.includes(collectible) ? profile.collection : [...profile.collection, collectible];
    const rankedWin = !!run.session.opponent && run.score >= run.session.opponent;
    const next: Profile = {
      ...profile,
      coins: profile.coins + reward,
      totalGames: profile.totalGames + 1,
      collection,
      stars: run.session.mode === "campaign" ? { ...profile.stars, [run.session.level.id]: Math.max(currentStars, run.stars) } : profile.stars,
      bestScores: { ...profile.bestScores, [run.session.level.id]: Math.max(profile.bestScores[run.session.level.id] || 0, run.score) },
      rankPoints: run.session.mode === "campaign" ? profile.rankPoints : Math.max(0, profile.rankPoints + (rankedWin ? 24 : -8)),
    };
    updateProfile(next); setResult(run); setScreen("result");
  };

  return <main className="game-shell">
    <div className="scenery" aria-hidden="true"><i /><i /><i /></div>
    <section className="phone-stage">
      {screen !== "play" && <TopBar profile={profile} onHome={() => go("home")} title={screen === "home" ? undefined : screen === "map" ? "主线闯关" : screen === "daily" ? "今日判断" : screen === "pk" ? "好友 PK" : screen === "rank" ? "排位赛" : screen === "office" ? "我的办公室" : "结算中心"} />}
      {screen === "home" && <HomeScreen profile={profile} go={go} />}
      {screen === "map" && <MapScreen profile={profile} onPlay={level => begin({ mode: "campaign", level, seed: level.id * 2027 + 17 })} />}
      {screen === "play" && session && <PlayScreen key={`${session.seed}-${profile.totalGames}`} session={session} onFinish={complete} />}
      {screen === "result" && result && <ResultScreen result={result} profile={profile} onAgain={() => begin(result.session)} onExit={() => go(result.session.mode === "campaign" ? "map" : "home")} />}
      {screen === "daily" && <DailyScreen profile={profile} update={updateProfile} />}
      {screen === "pk" && <PkScreen profile={profile} challenge={challenge} start={begin} />}
      {screen === "rank" && <RankScreen profile={profile} start={() => begin({ mode: "ranked", level: levels[20], seed: Date.now() % 99991, opponent: 1500 + Math.floor(Math.random() * 1200) })} />}
      {screen === "office" && <OfficeScreen profile={profile} update={updateProfile} />}
    </section>
    <p className="desktop-tip">电脑端可用 A / D 或 ← / → 快速分类</p>
  </main>;
}
