const NOTO='https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/';
const words=[
{id:'cat',word:'cat',phonetic:'/kæt/',meaning:'猫',emoji:'🐱',cp:'1f431',cat:'动物'},
{id:'dog',word:'dog',phonetic:'/dɒɡ/',meaning:'狗',emoji:'🐶',cp:'1f436',cat:'动物'},
{id:'rabbit',word:'rabbit',phonetic:'/ˈræb.ɪt/',meaning:'兔子',emoji:'🐰',cp:'1f430',cat:'动物'},
{id:'panda',word:'panda',phonetic:'/ˈpæn.də/',meaning:'熊猫',emoji:'🐼',cp:'1f43c',cat:'动物'},
{id:'bird',word:'bird',phonetic:'/bɜːd/',meaning:'鸟',emoji:'🐦',cp:'1f426',cat:'动物'},
{id:'fish',word:'fish',phonetic:'/fɪʃ/',meaning:'鱼',emoji:'🐟',cp:'1f41f',cat:'动物'},
{id:'lion',word:'lion',phonetic:'/ˈlaɪ.ən/',meaning:'狮子',emoji:'🦁',cp:'1f981',cat:'动物'},
{id:'monkey',word:'monkey',phonetic:'/ˈmʌŋ.ki/',meaning:'猴子',emoji:'🐒',cp:'1f412',cat:'动物'},
{id:'red',word:'red',phonetic:'/red/',meaning:'红色',emoji:'🔴',cp:'1f534',cat:'颜色'},
{id:'blue',word:'blue',phonetic:'/bluː/',meaning:'蓝色',emoji:'🔵',cp:'1f535',cat:'颜色'},
{id:'green',word:'green',phonetic:'/ɡriːn/',meaning:'绿色',emoji:'🟢',cp:'1f7e2',cat:'颜色'},
{id:'yellow',word:'yellow',phonetic:'/ˈjel.əʊ/',meaning:'黄色',emoji:'🟡',cp:'1f7e1',cat:'颜色'},
{id:'apple',word:'apple',phonetic:'/ˈæp.əl/',meaning:'苹果',emoji:'🍎',cp:'1f34e',cat:'食物'},
{id:'banana',word:'banana',phonetic:'/bəˈnɑː.nə/',meaning:'香蕉',emoji:'🍌',cp:'1f34c',cat:'食物'},
{id:'orange',word:'orange',phonetic:'/ˈɒr.ɪndʒ/',meaning:'橙子',emoji:'🍊',cp:'1f34a',cat:'食物'},
{id:'grape',word:'grape',phonetic:'/ɡreɪp/',meaning:'葡萄',emoji:'🍇',cp:'1f347',cat:'食物'},
{id:'strawberry',word:'strawberry',phonetic:'/ˈstrɔː.bər.i/',meaning:'草莓',emoji:'🍓',cp:'1f353',cat:'食物'},
{id:'watermelon',word:'watermelon',phonetic:'/ˈwɔː.təˌmel.ən/',meaning:'西瓜',emoji:'🍉',cp:'1f349',cat:'食物'},
{id:'bread',word:'bread',phonetic:'/bred/',meaning:'面包',emoji:'🍞',cp:'1f35e',cat:'食物'},
{id:'milk',word:'milk',phonetic:'/mɪlk/',meaning:'牛奶',emoji:'🥛',cp:'1f95b',cat:'食物'},
{id:'book',word:'book',phonetic:'/bʊk/',meaning:'书',emoji:'📖',cp:'1f4d6',cat:'生活'},
{id:'pencil',word:'pencil',phonetic:'/ˈpen.səl/',meaning:'铅笔',emoji:'✏️',cp:'270f',cat:'生活'},
{id:'school',word:'school',phonetic:'/skuːl/',meaning:'学校',emoji:'🏫',cp:'1f3eb',cat:'生活'},
{id:'house',word:'house',phonetic:'/haʊs/',meaning:'房子',emoji:'🏠',cp:'1f3e0',cat:'生活'},
{id:'key',word:'key',phonetic:'/kiː/',meaning:'钥匙',emoji:'🔑',cp:'1f511',cat:'生活'},
{id:'phone',word:'phone',phonetic:'/fəʊn/',meaning:'手机',emoji:'📱',cp:'1f4f1',cat:'生活'},
{id:'clock',word:'clock',phonetic:'/klɒk/',meaning:'时钟',emoji:'⏰',cp:'23f0',cat:'生活'},
{id:'bag',word:'bag',phonetic:'/bæɡ/',meaning:'书包',emoji:'🎒',cp:'1f392',cat:'生活'},
{id:'car',word:'car',phonetic:'/kɑːr/',meaning:'汽车',emoji:'🚗',cp:'1f697',cat:'出行'},
{id:'bus',word:'bus',phonetic:'/bʌs/',meaning:'公交车',emoji:'🚌',cp:'1f68c',cat:'出行'},
{id:'bicycle',word:'bicycle',phonetic:'/ˈbaɪ.sɪ.kəl/',meaning:'自行车',emoji:'🚲',cp:'1f6b2',cat:'出行'},
{id:'train',word:'train',phonetic:'/treɪn/',meaning:'火车',emoji:'🚆',cp:'1f686',cat:'出行'},
{id:'plane',word:'plane',phonetic:'/pleɪn/',meaning:'飞机',emoji:'✈️',cp:'2708',cat:'出行'},
{id:'ship',word:'ship',phonetic:'/ʃɪp/',meaning:'轮船',emoji:'🚢',cp:'1f6a2',cat:'出行'},
{id:'sun',word:'sun',phonetic:'/sʌn/',meaning:'太阳',emoji:'☀️',cp:'2600',cat:'自然'},
{id:'moon',word:'moon',phonetic:'/muːn/',meaning:'月亮',emoji:'🌙',cp:'1f319',cat:'自然'},
{id:'tree',word:'tree',phonetic:'/triː/',meaning:'树',emoji:'🌳',cp:'1f333',cat:'自然'},
{id:'flower',word:'flower',phonetic:'/ˈflaʊ.ər/',meaning:'花',emoji:'🌼',cp:'1f33c',cat:'自然'},
{id:'cloud',word:'cloud',phonetic:'/klaʊd/',meaning:'云',emoji:'☁️',cp:'2601',cat:'自然'},
{id:'star',word:'star',phonetic:'/stɑːr/',meaning:'星星',emoji:'⭐',cp:'2b50',cat:'自然'},
{id:'mountain',word:'mountain',phonetic:'/ˈmaʊn.tɪn/',meaning:'山',emoji:'⛰️',cp:'26f0',cat:'自然'},
{id:'umbrella',word:'umbrella',phonetic:'/ʌmˈbrel.ə/',meaning:'雨伞',emoji:'☂️',cp:'2614',cat:'自然'}
];
const chapters=[
{id:0,name:'第1章 · 动物与颜色',short:'启蒙',desc:'用图片、英文和中文建立最直观的词义联想。',cats:['动物','颜色'],icon:'🐱'},
{id:1,name:'第2章 · 食物与生活',short:'生活',desc:'加入更多长单词，并开始混入音标卡。',cats:['食物','生活'],icon:'🍎'},
{id:2,name:'第3章 · 出行与自然',short:'探索',desc:'增加卡牌数量、层级和遮挡，训练快速识别。',cats:['出行','自然'],icon:'🚗'},
{id:3,name:'第4章 · 综合挑战',short:'挑战',desc:'跨主题混合，音标、释义和图片随机组合。',cats:['动物','颜色','食物','生活','出行','自然'],icon:'🏆'}
];
const diffNames=['入门','简单','进阶','困难','挑战'];
const levelConfigs=[
[3,1,0],[3,2,0],[4,2,1],[4,3,1],
[4,2,1],[4,3,1],[5,3,2],[5,3,2],
[5,2,2],[5,3,2],[6,3,3],[6,4,3],
[6,3,3],[6,4,4],[6,4,4],[6,4,4]
].map((x,i)=>({id:i+1,chapter:Math.floor(i/4),groups:x[0],layers:x[1],difficulty:x[2],seed:20260916+i*97}));