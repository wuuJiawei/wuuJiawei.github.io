const powers = {
  "九皋宗": {
    kind: "超级宗门", subtitle: "东洲 · 两超之一", color: "#3f6758",
    summary: "以高度集中的本宗体系控制东洲，人口、资源、动员与战略纵深冠绝天下；综合实力略逊于天镜宫。",
    traits: ["观山正法", "镇岳印控制者", "九府与三十六附宗"],
    relation: "对外宣称维护传统秩序，内部围绕镇岳代价逐步分裂。",
    story: "沈青、顾天行与苏清漪的师门；终局山门建于镇岳主枢之上。"
  },
  "天镜宫": {
    kind: "超级宗门", subtitle: "西洲 · 两超之一", color: "#506680",
    summary: "高端修士、法器、贸易与情报网络更强，以核心宫门、自治属宗和跨洲盟友构成天下第一体系。",
    traits: ["十二属宗", "海路与灵票", "玄阴一脉"],
    relation: "以开放和反垄断为名争夺镇岳规则，但强硬派只想改变牺牲方向。",
    story: "阿阮与温九出身其边地体系；第三卷与九皋宗共同追夺阵图。"
  },
  "列宿盟": {
    kind: "大型联盟", subtitle: "中洲 · 第三极", color: "#9a7441",
    summary: "十二个独立大宗共同组成。总量接近两超，却没有永久共主，统一行动能力远弱于账面实力。",
    traits: ["共同议席", "灵票结算", "防御盟约"],
    relation: "两超长期争取其成员与表决，是舆论、贸易和情报交锋中心。",
    story: "顾天行原计划在列宿大会公开镇岳事故名单。"
  },
  "朔风盟": {
    kind: "区域联盟", subtitle: "北境 · 边塞群宗", color: "#6f7880",
    summary: "北境宗门为抵御兽潮与代理战争结成的战盟，人数不多，实战经验极强。",
    traits: ["重甲与骑战", "寒铁矿脉", "立场反复"],
    relation: "军需依赖九皋宗，矿石贸易却由天镜宫掌握。",
    story: "第二卷边境血案的军械来源之一，也是双方互相嫁祸的灰区。"
  },
  "苍梧会": {
    kind: "区域联盟", subtitle: "南境 · 药商联合", color: "#738858",
    summary: "药门、商会和山中小宗共同维持的松散联合，掌握灵药、医者与南方商路。",
    traits: ["药谷", "商路", "中立医契"],
    relation: "避免明确站队，以医药与贸易同时制衡两超。",
    story: "阿阮曾借苍梧商路转移流民与证据。"
  },
  "听潮盟": {
    kind: "区域联盟", subtitle: "东南海域 · 海宗", color: "#477a7c",
    summary: "由沿海与岛屿宗门组成，控制远洋航路、盐铁运输与地下走私网络。",
    traits: ["海运", "岛屿据点", "走私情报"],
    relation: "名义亲近天镜宫，实际以航路独立为最高利益。",
    story: "第三卷中，阵图副本经听潮盟船队送往民间。"
  },
  "大泽七门": {
    kind: "小型联盟", subtitle: "东、西夹缝 · 缓冲地", color: "#7f715b",
    summary: "七个弱小宗门为避免被吞并而抱团，缺少强者，却熟悉湿地、旧阵与边境暗道。",
    traits: ["湿地旧阵", "流民聚居", "无固定盟主"],
    relation: "是两超代理冲突最频繁的地区，也是最先承担阵势代价的人。",
    story: "温九查出的镇岳暗道由大泽旧工匠后人保存。"
  }
};

const pins = document.querySelectorAll(".map-pin");
const panel = document.querySelector(".power-panel");

function selectPower(pin) {
  const name = pin.getAttribute("aria-label").replace("查看", "");
  const power = powers[name];
  if (!power || !panel) return;
  pins.forEach((item) => item.classList.remove("active"));
  pin.classList.add("active");
  panel.style.setProperty("--accent", power.color);
  panel.querySelector("small").textContent = power.kind;
  panel.querySelector("h2").textContent = name;
  panel.querySelector(".power-panel-head p").textContent = power.subtitle;
  panel.querySelector(".power-summary").textContent = power.summary;
  panel.querySelector(".trait-list").innerHTML = power.traits.map((trait) => `<span>◇ ${trait}</span>`).join("");
  const details = panel.querySelectorAll("dd");
  details[0].textContent = power.relation;
  details[1].textContent = power.story;
}

pins.forEach((pin) => {
  pin.addEventListener("click", () => selectPower(pin));
  pin.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPower(pin);
    }
  });
});
