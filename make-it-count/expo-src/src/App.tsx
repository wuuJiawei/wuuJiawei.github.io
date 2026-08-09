import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, Vibration, View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { WorkshopScene } from './components/WorkshopScene';
import { RewardArt } from './components/RewardArt';
import { Confetti } from './components/Confetti';
import { colors } from './theme/colors';

const celebration = require('../assets/open-doodles/moshing.png');
type Stage = 'setup' | 'focus' | 'result' | 'reveal' | 'room';
type Duration = { label: string; seconds: number; detail: string };
const DURATIONS: Duration[] = [
  { label: '25', seconds: 1500, detail: '短冲刺' },
  { label: '50', seconds: 3000, detail: '深度专注' },
  { label: '90', seconds: 5400, detail: '沉浸创作' },
  { label: '10s', seconds: 10, detail: '快速演示' },
];

export default function App() {
  const [stage, setStage] = useState<Stage>('setup');
  const [task, setTask] = useState('写完第 12 章');
  const [goal, setGoal] = useState('完成至少 2000 字初稿');
  const [result, setResult] = useState('完成第 12 章初稿，共 2,371 字');
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [remaining, setRemaining] = useState(duration.seconds);
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const start = () => {
    if (!task.trim() || !goal.trim()) return;
    stop(); setRemaining(duration.seconds); setPaused(false); setRevealed(false); setStage('focus');
  };
  const finish = () => {
    stop(); setFinishedAt(new Date()); setPaused(false); setStage('result');
    if (Platform.OS !== 'web') Vibration.vibrate(35);
  };
  const reveal = () => {
    if (!result.trim()) return;
    setStage('reveal'); setRevealed(false);
    if (Platform.OS !== 'web') Vibration.vibrate([0, 28, 45, 65]);
    setTimeout(() => setRevealed(true), 760);
  };

  useEffect(() => {
    if (stage !== 'focus') return;
    stop();
    timer.current = setInterval(() => {
      if (paused) return;
      setRemaining(v => { if (v <= 1) { setTimeout(finish, 0); return 0; } return v - 1; });
    }, 1000);
    return stop;
  }, [stage, paused]);

  const progress = stage === 'focus' ? Math.min(1, Math.max(0, 1 - remaining / duration.seconds)) : stage === 'room' || stage === 'reveal' ? 1 : 0;
  const time = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`, [remaining]);

  return <View style={s.root}>
    <StatusBar barStyle="dark-content" />
    <SafeAreaView style={s.safe}><View style={s.phone}>
      {stage === 'setup' && <Setup task={task} goal={goal} duration={duration} onTask={setTask} onGoal={setGoal} onDuration={setDuration} onStart={start} />}
      {stage === 'focus' && <Focus task={task} goal={goal} time={time} progress={progress} paused={paused} onPause={() => setPaused(x => !x)} onDone={finish} />}
      {stage === 'result' && <Result task={task} goal={goal} result={result} onResult={setResult} onReveal={reveal} />}
      {stage === 'reveal' && <Reveal revealed={revealed} task={task} result={result} onPlace={() => setStage('room')} />}
      {stage === 'room' && <Room task={task} result={result} duration={duration} finishedAt={finishedAt} onReward={() => setMemoryOpen(true)} onAgain={() => setStage('setup')} />}
      <Memory open={memoryOpen} task={task} result={result} duration={duration} finishedAt={finishedAt} onClose={() => setMemoryOpen(false)} />
    </View></SafeAreaView>
  </View>;
}

function Setup(p: any) {
  const valid = p.task.trim() && p.goal.trim();
  return <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
    <Top step="01 / DEFINE" />
    <Animated.View entering={FadeInDown.duration(420)}><Text style={s.hero}>今天，{`\n`}做成一件事。</Text><Text style={s.sub}>别记录你坐了多久。先说清楚，结束时你要带走什么。</Text></Animated.View>
    <Field label="我要完成"><TextInput value={p.task} onChangeText={p.onTask} placeholder="例如：写完第 12 章" placeholderTextColor={colors.faint} style={s.input} selectionColor={colors.terracotta} /></Field>
    <Field label="完成标准"><TextInput value={p.goal} onChangeText={p.onGoal} placeholder="结束时，我希望得到……" placeholderTextColor={colors.faint} style={[s.input,s.multi]} multiline selectionColor={colors.terracotta} /></Field>
    <Field label="给自己一点时间"><View style={s.durations}>{DURATIONS.map((d: Duration) => <Pressable key={d.label} onPress={() => p.onDuration(d)} style={({pressed}) => [s.duration,d.seconds===p.duration.seconds&&s.durationOn,pressed&&s.pressed]}><Text style={[s.durationValue,d.seconds===p.duration.seconds&&s.durationValueOn]}>{d.label}</Text><Text style={[s.durationDetail,d.seconds===p.duration.seconds&&s.durationDetailOn]}>{d.detail}</Text></Pressable>)}</View></Field>
    <View style={s.previewHead}><View style={{flex:1}}><Text style={s.eyebrow}>今晚的工坊</Text><Text style={s.previewTitle}>有件东西，会和你一起慢慢完成。</Text></View><Text style={s.discovery}>待发现</Text></View>
    <WorkshopScene progress={0.18} previewMode />
    <Button label="开始创造" onPress={p.onStart} disabled={!valid} /><Text style={s.slogan}>DON'T COUNT TIME. MAKE IT COUNT.</Text>
  </ScrollView>;
}

function Focus(p: any) {
  const pct = Math.round(p.progress * 100);
  return <View style={s.fixed}><Top step={`02 / FOCUS · ${pct}%`} /><View style={{marginTop:12}}><WorkshopScene progress={p.progress} paused={p.paused} /></View>
    <View style={s.focusHead}><View style={{flex:1}}><Text style={s.focusTitle}>{p.task}</Text><Text style={s.focusGoal}>{p.goal}</Text></View><Text style={s.timer}>{p.time}</Text></View>
    <View style={s.track}><View style={[s.fill,{width:`${pct}%`}]} /></View><View style={s.meta}><Text style={s.metaText}>{stageCopy(p.progress)}</Text><Text style={s.metaText}>{p.paused?'时间停住了':'现实里的事才是主线'}</Text></View>
    <View style={{flex:1}}/><View style={s.actions}><Button secondary label={p.paused?'继续':'暂停'} onPress={p.onPause}/><Button label="我做完了" onPress={p.onDone}/></View>
  </View>;
}

function Result(p: any) {
  return <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"><Top step="03 / CLAIM"/><Text style={[s.eyebrow,{marginTop:28}]}>先把真实成果留下。</Text><Text style={s.hero}>这段时间，{`\n`}你做成了什么？</Text><Text style={s.sub}>写一句就够。它会成为这件收藏品真正的来历。</Text>
    <View style={s.context}><Text style={s.contextLabel}>原本想完成</Text><Text style={s.contextTask}>{p.task}</Text><Text style={s.contextGoal}>{p.goal}</Text></View>
    <Field label="实际成果"><TextInput value={p.result} onChangeText={p.onResult} multiline style={s.resultInput} selectionColor={colors.terracotta}/><Text style={s.helper}>不要评价“专注得好不好”，只留下发生过的事实。</Text></Field>
    <View style={{flex:1,minHeight:60}}/><Button label="领取这次成果" onPress={p.onReveal} disabled={!p.result.trim()}/>
  </ScrollView>;
}

function Reveal(p: any) {
  return <View style={s.reveal}><Confetti active={p.revealed}/><Text style={[s.brand,s.revealBrand]}>MAKE IT COUNT</Text>{!p.revealed ? <Animated.View entering={FadeIn} style={s.seal}><View style={s.sealInner}/><Text style={s.sealCopy}>把这段努力，做成一件东西。</Text></Animated.View> : <Animated.View entering={FadeInDown.duration(420)} style={s.revealContent}><View style={s.rewardStage}><RewardArt revealed/><Image source={celebration} resizeMode="contain" style={s.celebration}/></View><Text style={s.eyebrow}>RARE CREATION · 01</Text><Text style={s.rewardName}>雨夜书灯</Text><Text style={s.rewardStory}>它不记录你坐了多久。它只记得，那天晚上你真的把一件事做完了。</Text><View style={s.receipt}><Text style={s.receiptMark}>刻印</Text><Text style={s.receiptText}>{p.result}</Text></View><View style={s.roomProgress}><Text style={s.metaText}>房间正在变成你的</Text><View style={[s.track,{flex:1,marginTop:0}]}><View style={[s.fill,{width:'12%'}]}/></View><Text style={s.metaText}>1 / 24</Text></View></Animated.View>}
    {p.revealed && <View style={s.bottom}><Button label="把它放进房间" onPress={p.onPlace}/></View>}
  </View>;
}

function Room(p: any) {
  return <ScrollView contentContainerStyle={s.scroll}><Top step="04 / ROOM"/><Text style={s.roomHero}>这是你{`\n`}一件件做出来的。</Text><Text style={s.sub}>轻点房间里的物件，记住它来自哪一次真实完成。</Text><View style={s.roomScene}><WorkshopScene progress={1} roomMode onRewardPress={p.onReward}/><Text style={s.tapHint}>轻点书灯，查看它的来历</Text></View>
    <View style={s.sectionHead}><Text style={s.sectionTitle}>雨夜收藏</Text><Text style={s.metaText}>1 / 6</Text></View><View style={s.collection}><Pressable onPress={p.onReward} style={s.owned}><RewardArt compact/><Text style={s.ownedName}>雨夜书灯</Text></Pressable>{[1,2,3,4,5].map(i=><View key={i} style={s.empty}><View style={s.emptyShape}/><Text style={s.emptyText}>未发现</Text></View>)}</View>
    <View style={s.sectionHead}><Text style={s.sectionTitle}>成果档案</Text><Text style={s.metaText}>今天</Text></View><Pressable onPress={p.onReward} style={s.archive}><View style={s.archiveRule}/><View style={{flex:1}}><Text style={s.archiveResult}>{p.result}</Text><Text style={s.archiveMeta}>{p.task} · {durationLabel(p.duration)}</Text></View><Text style={s.arrow}>›</Text></Pressable>
    <Button label="再做成一件事" onPress={p.onAgain}/>
  </ScrollView>;
}

function Memory(p: any) {
  return <Modal visible={p.open} transparent animationType="fade" onRequestClose={p.onClose}><Pressable style={s.backdrop} onPress={p.onClose}><Animated.View entering={SlideInDown.springify().damping(18)} style={s.sheet} onStartShouldSetResponder={()=>true}><View style={s.handle}/><View style={{alignSelf:'center',marginTop:14}}><RewardArt compact/></View><Text style={[s.eyebrow,{textAlign:'center'}]}>CREATION · 01</Text><Text style={s.sheetTitle}>雨夜书灯</Text><Text style={s.sheetResult}>{p.result}</Text><View style={s.divider}/><Meta label="来自" value={p.task}/><Meta label="专注" value={durationLabel(p.duration)}/><Meta label="完成于" value={formatDate(p.finishedAt)}/><Button secondary label="收好" onPress={p.onClose}/></Animated.View></Pressable></Modal>;
}

function Top({step}:{step:string}) { return <View style={s.top}><Text style={s.brand}>MAKE IT COUNT</Text><Text style={s.topRight}>{step}</Text></View>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>; }
function Meta({label,value}:{label:string;value:string}) { return <View style={s.metaRow}><Text style={s.metaText}>{label}</Text><Text style={s.metaValue}>{value}</Text></View>; }
function Button({label,onPress,disabled,secondary}:{label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[secondary?s.secondary:s.primary,disabled&&s.disabled,pressed&&s.pressed]}><Text style={secondary?s.secondaryText:s.primaryText}>{label}</Text></Pressable>; }
function stageCopy(p:number){return p<.25?'正在准备材料':p<.5?'轮廓慢慢出现':p<.75?'它快要完成了':'最后一点点';}
function durationLabel(d:Duration){return d.seconds===10?'10 秒演示':`${Math.round(d.seconds/60)} 分钟`;}
function formatDate(d:Date|null){return d?d.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'刚刚';}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.bg,alignItems:'center'},safe:{flex:1,width:'100%',alignItems:'center'},phone:{flex:1,width:'100%',maxWidth:430,backgroundColor:colors.bg},scroll:{paddingHorizontal:22,paddingTop:18,paddingBottom:28,flexGrow:1},fixed:{flex:1,paddingHorizontal:22,paddingTop:18,paddingBottom:22},
  top:{minHeight:30,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{color:colors.ink,fontSize:10.5,fontWeight:'900',letterSpacing:2.1},topRight:{color:colors.muted,fontSize:10,fontWeight:'700',letterSpacing:1.2},hero:{color:colors.ink,fontSize:42,lineHeight:44,fontWeight:'800',letterSpacing:-2,marginTop:26},roomHero:{color:colors.ink,fontSize:37,lineHeight:40,fontWeight:'800',letterSpacing:-1.7,marginTop:24},sub:{color:colors.muted,fontSize:14.5,lineHeight:22,marginTop:10,maxWidth:360},eyebrow:{color:colors.terracottaDeep,fontSize:9.5,fontWeight:'800',letterSpacing:1.25},
  field:{marginTop:27},label:{color:colors.muted,fontSize:11.5,fontWeight:'700',marginBottom:5},input:{color:colors.ink,fontSize:22,paddingVertical:11,borderBottomWidth:1,borderBottomColor:colors.line},multi:{minHeight:72,fontSize:16,lineHeight:23,textAlignVertical:'top'},durations:{flexDirection:'row',gap:7},duration:{flex:1,minWidth:0,minHeight:63,borderWidth:1,borderColor:colors.line,borderRadius:14,paddingVertical:11,paddingHorizontal:9,backgroundColor:'rgba(255,249,238,.42)'},durationOn:{backgroundColor:colors.ink,borderColor:colors.ink},durationValue:{color:colors.ink,fontSize:17,fontWeight:'800'},durationValueOn:{color:colors.white},durationDetail:{color:colors.muted,fontSize:8.5,marginTop:4},durationDetailOn:{color:'#CFC6B9'},
  previewHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:30,marginBottom:11,gap:16},previewTitle:{color:colors.ink,fontSize:17,fontWeight:'700',marginTop:5,maxWidth:280},discovery:{color:colors.muted,fontSize:9.5,fontWeight:'700',borderWidth:1,borderColor:colors.line,borderRadius:13,paddingHorizontal:10,paddingVertical:6},slogan:{color:colors.faint,textAlign:'center',fontSize:8.5,letterSpacing:1.55,marginTop:12},
  primary:{minHeight:54,flex:1,borderRadius:16,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:18},primaryText:{color:colors.white,fontSize:15.5,fontWeight:'800'},secondary:{minHeight:54,flex:1,borderRadius:16,borderWidth:1,borderColor:colors.line,backgroundColor:'rgba(255,249,238,.5)',alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:18},secondaryText:{color:colors.ink,fontSize:15,fontWeight:'700'},disabled:{backgroundColor:'#D4CCBE'},pressed:{transform:[{scale:.985}],opacity:.82},
  focusHead:{flexDirection:'row',gap:12,alignItems:'flex-end',marginTop:18},focusTitle:{color:colors.ink,fontSize:20,fontWeight:'800'},focusGoal:{color:colors.muted,fontSize:11.5,lineHeight:17,marginTop:5},timer:{color:colors.ink,fontSize:36,fontWeight:'800',letterSpacing:-1.7},track:{height:4,backgroundColor:colors.line,borderRadius:3,overflow:'hidden',marginTop:15},fill:{height:'100%',backgroundColor:colors.terracotta,borderRadius:3},meta:{flexDirection:'row',justifyContent:'space-between',marginTop:8},metaText:{color:colors.muted,fontSize:9.5},actions:{flexDirection:'row',gap:9},
  context:{marginTop:30,paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.line},contextLabel:{color:colors.faint,fontSize:10,fontWeight:'700'},contextTask:{color:colors.ink,fontSize:18,fontWeight:'800',marginTop:6},contextGoal:{color:colors.muted,fontSize:12,marginTop:4},resultInput:{minHeight:116,color:colors.ink,fontSize:22,fontWeight:'600',lineHeight:31,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.ink,textAlignVertical:'top'},helper:{color:colors.faint,fontSize:10.5,lineHeight:16,marginTop:9},
  reveal:{flex:1,paddingHorizontal:22,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center',overflow:'hidden'},revealBrand:{position:'absolute',left:22,top:25},seal:{alignItems:'center'},sealInner:{width:116,height:116,borderRadius:58,borderWidth:13,borderColor:'rgba(211,113,82,.14)',backgroundColor:'rgba(211,113,82,.08)'},sealCopy:{color:colors.muted,fontSize:12,marginTop:18},revealContent:{alignItems:'center',width:'100%',paddingBottom:70},rewardStage:{width:'100%',height:245,alignItems:'center',justifyContent:'center'},celebration:{position:'absolute',width:130,height:155,right:-8,bottom:4,opacity:.72},rewardName:{color:colors.ink,fontSize:36,fontWeight:'800',letterSpacing:-1.7,marginTop:7},rewardStory:{color:colors.muted,textAlign:'center',maxWidth:330,fontSize:12.5,lineHeight:20,marginTop:9},receipt:{width:'100%',marginTop:22,flexDirection:'row',gap:12,paddingVertical:14,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.line},receiptMark:{color:colors.terracottaDeep,fontSize:10,fontWeight:'800',letterSpacing:1.1},receiptText:{flex:1,color:colors.ink,fontSize:14,lineHeight:20,fontWeight:'700'},roomProgress:{width:'100%',flexDirection:'row',alignItems:'center',gap:9,marginTop:14},bottom:{position:'absolute',left:22,right:22,bottom:24},
  roomScene:{marginTop:22,position:'relative'},tapHint:{position:'absolute',left:14,bottom:13,color:colors.ink,backgroundColor:'rgba(255,249,238,.88)',borderRadius:13,paddingHorizontal:10,paddingVertical:6,fontSize:9.5,fontWeight:'700'},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:25,paddingBottom:10,borderBottomWidth:1,borderBottomColor:colors.line},sectionTitle:{color:colors.ink,fontSize:14,fontWeight:'800'},collection:{flexDirection:'row',gap:7,marginTop:11},owned:{flex:1,minHeight:100,alignItems:'center',justifyContent:'center',borderBottomWidth:2,borderBottomColor:colors.terracotta},ownedName:{color:colors.ink,fontSize:9.5,fontWeight:'700',marginTop:-5},empty:{flex:1,minHeight:100,alignItems:'center',justifyContent:'center',borderBottomWidth:1,borderBottomColor:colors.line},emptyShape:{width:38,height:49,borderRadius:11,borderWidth:1,borderStyle:'dashed',borderColor:colors.line},emptyText:{color:colors.faint,fontSize:8.5,marginTop:8},archive:{minHeight:82,flexDirection:'row',alignItems:'center',paddingVertical:14},archiveRule:{width:3,alignSelf:'stretch',backgroundColor:colors.terracotta,borderRadius:2,marginRight:12},archiveResult:{color:colors.ink,fontSize:14.5,lineHeight:20,fontWeight:'700'},archiveMeta:{color:colors.muted,fontSize:9.5,marginTop:5},arrow:{color:colors.muted,fontSize:25,fontWeight:'300',marginLeft:10},
  backdrop:{flex:1,backgroundColor:'rgba(42,40,35,.28)',justifyContent:'flex-end'},sheet:{width:'100%',maxWidth:430,alignSelf:'center',backgroundColor:colors.paper,borderTopLeftRadius:26,borderTopRightRadius:26,paddingHorizontal:22,paddingTop:10,paddingBottom:28},handle:{width:38,height:4,borderRadius:2,backgroundColor:colors.line,alignSelf:'center'},sheetTitle:{color:colors.ink,fontSize:29,fontWeight:'800',textAlign:'center',marginTop:5},sheetResult:{color:colors.ink,fontSize:15,lineHeight:22,fontWeight:'600',textAlign:'center',marginTop:10,paddingHorizontal:14},divider:{height:1,backgroundColor:colors.line,marginVertical:19},metaRow:{flexDirection:'row',justifyContent:'space-between',gap:20,paddingVertical:7},metaValue:{flex:1,color:colors.ink,fontSize:11.5,fontWeight:'700',textAlign:'right'},
});
