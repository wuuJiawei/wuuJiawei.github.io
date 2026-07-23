"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Side = "LEFT" | "RIGHT";
type Person = {
  id: number; name: string; color: string; hat: boolean; glasses: boolean;
  coffee: boolean; laptop: boolean; bag: boolean; phone: boolean;
  tired: boolean; sneaky: boolean; programmer: number; slacking: number; quitting: number;
};
type Rule = {
  title: string; hint: string; left: string; right: string; stage: string;
  subjective?: boolean; test: (p: Person) => boolean | number;
  threshold?: number; ambiguous?: [number, number];
};

const names = ["小林", "阿杰", "小周", "老王", "Mia", "大壮", "可乐", "Tony"];
const colors = ["red", "blue", "black", "cream", "green"];
const rand = (seed: number) => {
  const x = Math.sin(seed * 999) * 43758.5453;
  return x - Math.floor(x);
};
function makePerson(id: number): Person {
  const yes = (n: number, chance = .5) => rand(id * 13 + n) < chance;
  const hat = yes(1, .35), glasses = yes(2, .42), coffee = yes(3, .46);
  const laptop = yes(4), bag = yes(5, .52), phone = yes(6, .42);
  const tired = yes(7, .48), sneaky = yes(8, .35);
  const color = colors[Math.floor(rand(id + 2) * colors.length)];
  return {
    id, name: names[id % names.length], color, hat, glasses, coffee, laptop, bag, phone, tired, sneaky,
    programmer: (laptop ? 28 : 0) + (coffee ? 16 : 0) + (glasses ? 12 : 0) + (tired ? 12 : 0) + (color === "black" ? 8 : 0) + Math.floor(rand(id + 21) * 12),
    slacking: (phone ? 30 : 0) + (sneaky ? 25 : 0) + (coffee && !laptop ? 10 : 0) + (!bag ? 8 : 0) + Math.floor(rand(id + 31) * 25),
    quitting: (bag ? 22 : 0) + (laptop ? 18 : 0) + (tired ? 22 : 0) + (!coffee ? 8 : 0) + Math.floor(rand(id + 41) * 24),
  };
}

const rules: Rule[] = [
  { title: "戴帽子的去右边", hint: "看清楚，包可不算帽子", left: "没戴帽子", right: "戴了帽子", stage: "热身题", test: p => p.hat },
  { title: "拿咖啡的去右边", hint: "工牌可以不带，咖啡不能不带", left: "空手上班", right: "咖啡续命", stage: "热身题", test: p => p.coffee },
  { title: "戴眼镜的去右边", hint: "墨镜也算，主打一个公平", left: "视力真好", right: "眼镜一族", stage: "热身题", test: p => p.glasses },
  { title: "背电脑包并拿咖啡", hint: "两个条件必须同时满足", left: "准备不足", right: "装备齐全", stage: "组合条件", test: p => p.laptop && p.coffee },
  { title: "穿红衣，但没有戴眼镜", hint: "红衣服 AND NOT 眼镜", left: "不符合", right: "完全符合", stage: "组合条件", test: p => p.color === "red" && !p.glasses },
  { title: "看起来像程序员", hint: "电脑、咖啡、眼镜和疲惫脸都是线索", left: "不太像", right: "像程序员", stage: "推测判断", subjective: true, test: p => p.programmer, threshold: 60, ambiguous: [45, 69] },
  { title: "有一种偷偷摸鱼的感觉", hint: "手机、眼神和姿势不会说谎……吧？", left: "认真工作", right: "偷偷摸鱼", stage: "全民争议", subjective: true, test: p => p.slacking, threshold: 60, ambiguous: [41, 69] },
  { title: "好像马上要提离职", hint: "抱着电脑、背好包，还面无表情", left: "还能再熬", right: "准备跑路", stage: "全民争议", subjective: true, test: p => p.quitting, threshold: 62, ambiguous: [43, 72] },
];
function getRule(elapsed: number) {
  if (elapsed < 12) return rules[Math.floor(elapsed / 6) % 3];
  if (elapsed < 30) return rules[3 + Math.floor((elapsed - 12) / 9) % 2];
  if (elapsed < 44) return rules[5];
  return rules[6 + Math.floor((elapsed - 44) / 8) % 2];
}

function PersonArt({ person, mini = false }: { person: Person; mini?: boolean }) {
  return <div className={`person ${mini ? "mini" : ""}`} aria-label={`${person.name}${person.hat ? "，戴帽子" : ""}${person.glasses ? "，戴眼镜" : ""}${person.coffee ? "，拿咖啡" : ""}`}>
    <div className="shadow" />
    {person.bag && <div className="bag">▦</div>}
    <div className="legs"><i/><i/></div>
    <div className={`body shirt-${person.color}`}>{person.laptop && <span className="laptop">⌁</span>}</div>
    <div className="arm left-arm">{person.coffee && <span className="coffee">☕</span>}</div>
    <div className="arm right-arm">{person.phone && <span className="phone">▣</span>}</div>
    <div className="head"><span className="hair"/>{person.hat && <span className="hat"/>}{person.glasses && <span className="glasses"><i/><i/></span>}<span className={`mouth ${person.tired ? "tired" : ""}`}/>{person.sneaky && <span className="sneaky">›</span>}</div>
    {!mini && <div className="name">{person.name}</div>}
  </div>;
}

export default function Home() {
  const [screen, setScreen] = useState<"intro"|"play"|"result">("intro");
  const [time, setTime] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [order, setOrder] = useState(100);
  const [id, setId] = useState(7);
  const [flight, setFlight] = useState<Side|null>(null);
  const [feedback, setFeedback] = useState<{kind:string;text:string}|null>(null);
  const [counts, setCounts] = useState([0,0]);
  const [judged, setJudged] = useState(0);
  const [disputed, setDisputed] = useState(0);
  const [last, setLast] = useState<{person:Person;rule:Rule;side:Side;percent:number}|null>(null);
  const [shareText, setShareText] = useState("分享我的判断");
  const dragX = useRef<number|null>(null);
  const person = useMemo(() => makePerson(id), [id]);
  const rule = getRule(60-time);

  const start = useCallback(() => {
    setTime(60); setScore(0); setCombo(0); setBest(0); setOrder(100);
    setId(Date.now()%1000+7); setFlight(null); setFeedback(null); setCounts([0,0]);
    setJudged(0); setDisputed(0); setLast(null); setShareText("分享我的判断"); setScreen("play");
  }, []);
  useEffect(() => {
    if (screen !== "play") return;
    const timer = window.setInterval(() => setTime(v => {
      if (v <= 1) { window.clearInterval(timer); setScreen("result"); return 0; }
      return v-1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  const classify = useCallback((side: Side) => {
    if (screen !== "play" || flight) return;
    const value = rule.test(person);
    let result: "correct"|"wrong"|"ambiguous";
    if (rule.subjective && typeof value === "number") {
      const [low,high] = rule.ambiguous ?? [45,65];
      if (value >= low && value <= high) result = "ambiguous";
      else result = (value >= (rule.threshold ?? 60) ? "RIGHT" : "LEFT") === side ? "correct" : "wrong";
    } else result = (value ? "RIGHT" : "LEFT") === side ? "correct" : "wrong";
    setFlight(side); setJudged(v=>v+1); setCounts(v => side === "LEFT" ? [v[0]+1,v[1]] : [v[0],v[1]+1]);
    if (result === "correct") {
      const c = combo+1; setCombo(c); setBest(v=>Math.max(v,c));
      setScore(v=>v+100*(c>=10?3:c>=5?2:1)); setOrder(v=>Math.min(100,v+3));
      setFeedback({kind:result,text:c>=10?"漂亮！×3":"判断正确"});
    } else if (result === "wrong") {
      setCombo(0); setFeedback({kind:result,text:"队伍乱了！−18"});
      setOrder(v => { const next=Math.max(0,v-18); if(!next) window.setTimeout(()=>setScreen("result"),440); return next; });
    } else {
      const percent=52+Math.floor(rand(person.id+rule.title.length)*18);
      setDisputed(v=>v+1); setScore(v=>v+50); setLast({person,rule,side,percent:side==="RIGHT"?percent:100-percent});
      setFeedback({kind:result,text:`存在争议 · ${percent}% 选右边`});
    }
    window.setTimeout(()=>{ setId(v=>v+1); setFlight(null); setFeedback(null); },430);
  }, [combo,flight,person,rule,screen]);
  useEffect(() => {
    if (screen !== "play") return;
    const key=(e:KeyboardEvent)=>{ if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a") classify("LEFT"); if(e.key==="ArrowRight"||e.key.toLowerCase()==="d") classify("RIGHT"); };
    window.addEventListener("keydown",key); return()=>window.removeEventListener("keydown",key);
  },[classify,screen]);

  const share = async () => {
    const text=last?`《排队大师》问我：${last.rule.title}。我把${last.person.name}分到了${last.side==="RIGHT"?"右边":"左边"}，和${last.percent}%的玩家想法一致。你怎么判断？`:`我在《排队大师》判断了 ${judged} 名打工人，最高 ${best} 连击。`;
    try { if(navigator.share) await navigator.share({title:"排队大师",text,url:location.href}); else await navigator.clipboard.writeText(`${text} ${location.href}`); setShareText("已复制，发给朋友吧"); } catch { setShareText("分享取消"); }
  };

  return <main className="game-shell">
    <div className="scenery" aria-hidden="true"><i/><i/><i/></div>
    <section className="phone-stage">
      <header className="brandbar"><div className="logo">排</div><div><strong>排队大师</strong><small>荒诞职场分类中心</small></div><button aria-label="音效已开启">♫</button></header>
      {screen==="intro" && <div className="intro">
        <div className="stamp">今日上岗</div>
        <div className="intro-art"><PersonArt person={makePerson(26)}/><div className="bubble">领导，这人<br/>该去哪队？</div></div>
        <h1>别想太久，<br/><em>凭感觉排！</em></h1>
        <p>前半局看帽子和咖啡，后半局判断谁在摸鱼。模糊题不扣分，只看大家怎么选。</p>
        <div className="howto"><span>← 左滑</span><i>拖动人物</i><span>右滑 →</span></div>
        <button className="primary" onClick={start}><b>立即上岗</b><small>一局 60 秒</small></button>
        <div className="daily"><b>今日全民判断</b> 他是在认真工作，还是假装认真？</div>
      </div>}
      {screen==="play" && <div className="play">
        <div className="stats"><div><small>秩序值</small><div className="bar"><i style={{width:`${order}%`}}/></div></div><div className="timer"><b>{time}</b><small>秒</small></div><div className="score"><small>得分</small><b>{score.toLocaleString()}</b></div></div>
        <div className={`rule ${rule.subjective?"subjective":""}`}><span>{rule.stage}</span><h2>{rule.title}</h2><p>{rule.hint}</p></div>
        <div className="work-zone">
          {combo>=2&&<div className="combo"><b>{combo}</b> 连击 <i>×{combo>=10?3:combo>=5?2:1}</i></div>}
          <div className={`person-card ${flight==="LEFT"?"fly-left":flight==="RIGHT"?"fly-right":""}`}
            onPointerDown={e=>{dragX.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}
            onPointerUp={e=>{if(dragX.current===null)return;const d=e.clientX-dragX.current;dragX.current=null;if(Math.abs(d)>36)classify(d>0?"RIGHT":"LEFT");}}>
            <PersonArt person={person}/>
            <div className="clues">{person.hat&&<span>帽子</span>}{person.glasses&&<span>眼镜</span>}{person.coffee&&<span>咖啡</span>}{person.laptop&&<span>电脑</span>}{person.phone&&<span>手机</span>}</div>
            <small>按住我，向左或向右滑</small>
          </div>
          {feedback&&<div className={`feedback ${feedback.kind}`}>{feedback.text}</div>}
        </div>
        <div className="queues">
          <button className="queue left" onClick={()=>classify("LEFT")} aria-label={`分到左边：${rule.left}`}><span>←</span><small>左队 · {counts[0]}人</small><b>{rule.left}</b></button>
          <button className="queue right" onClick={()=>classify("RIGHT")} aria-label={`分到右边：${rule.right}`}><span>→</span><small>右队 · {counts[1]}人</small><b>{rule.right}</b></button>
        </div>
      </div>}
      {screen==="result" && <div className="result">
        <div className="result-title"><span>下班结算单</span><h1>{order>0?"今天队伍还算整齐":"分类中心乱成一锅粥"}</h1></div>
        <div className="grade">{score>=2800?"S":score>=1800?"A":score>=900?"B":"C"}<small>分类专员</small></div>
        <div className="result-stats"><div><b>{score}</b><small>本局得分</small></div><div><b>{judged}</b><small>判断人数</small></div><div><b>{best}</b><small>最高连击</small></div></div>
        {last?<div className="dispute"><i className="tape"/><div className="mini-person"><PersonArt person={last.person} mini/></div><div><small>本局争议判断</small><h2>{last.rule.title}</h2><p>你选择：<b>{last.side==="RIGHT"?last.rule.right:last.rule.left}</b></p></div><div className="vote"><i style={{width:`${last.percent}%`}}/><b>{last.percent}%</b><span>玩家和你想法一致</span></div></div>:<div className="dispute empty"><b>你下班得太早了</b><span>坚持到后半局，就会遇到全民争议题。</span></div>}
        <p className="note">{disputed?`遇到 ${disputed} 次争议：没有标准答案，只有不同的打工人直觉。`:"再坚持一会儿，后半局的问题会逐渐离谱。"}</p>
        <button className="primary share" onClick={share}>{shareText}</button><button className="again" onClick={start}>再排一局</button>
      </div>}
    </section>
    <p className="desktop-tip">电脑端可用 A / D 或 ← / → 快速分类</p>
  </main>;
}
