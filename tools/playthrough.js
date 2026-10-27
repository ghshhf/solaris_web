/* 索拉丽斯炼成计划 · 网页版 —— 全流程通关模拟
   目的：真把 30 天跑完，验证每一场战斗、商店、探索、结局都不崩。
   跟 selftest.js 的区别：selftest 查契约，这个查「能不能通关」。

   跑法：node tools/playthrough.js
*/
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scriptStart = html.indexOf("<script>", html.indexOf('id="stage"'));
const scriptEnd = html.indexOf("</script>", scriptStart);
const code = html.slice(scriptStart + 8, scriptEnd);

/* ── 最小 DOM ── */
function CL() {
  const set = new Set();
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    contains: c => set.has(c),
    toggle: (c, on) => { if (on === undefined) set.has(c) ? set.delete(c) : set.add(c); else on ? set.add(c) : set.delete(c); },
    _set: set
  };
}
function El(id) {
  const el = {
    id, tagName: "DIV", children: [], listeners: {}, style: {}, dataset: {},
    textContent: "", src: "", className: "", disabled: false, onclick: null,
    _html: "", parentNode: null, classList: CL(),
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); },
    dispatch(t, ev) {
      const e = ev || {};
      e.preventDefault = e.preventDefault || function () { };
      e.stopPropagation = e.stopPropagation || function () { };
      e.target = e.target || el;
      (this.listeners[t] || []).forEach(f => f(e));
    },
    closest() { return null; },
    getBoundingClientRect() { return { width: 520, height: 900, left: 0, top: 0 }; }
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return el._html; },
    set(v) { el._html = v; el.children = []; }
  });
  Object.defineProperty(el, "firstChild", {
    get() { if (!el._first) el._first = { nodeValue: "", textContent: "" }; return el._first; }
  });
  return el;
}
const registry = new Map();
[...new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]))].forEach(id => registry.set(id, El(id)));
const document = {
  getElementById: id => { if (!registry.has(id)) registry.set(id, El(id)); return registry.get(id); },
  createElement: tag => El("_" + tag),
  addEventListener() { }, body: El("body")
};

/* ── fake timer：把动画/延迟压成同步 ── */
const TQ = [];
const errs = [];
function drain(max = 800) {
  let n = 0;
  while (TQ.length && n++ < max) {
    const t = TQ.shift();
    try { t.fn(); } catch (e) { errs.push(e.message + " @ " + (e.stack || "").split("\n")[1]); }
  }
  if (TQ.length) errs.push("定时器队列没跑空，剩余 " + TQ.length);
  TQ.length = 0;
}

/* ── 沙箱 ── */
const sandbox = {
  console, document,
  window: null,
  location: { search: "", reload() { } },
  Image: function () { return {}; },
  Audio: function () { return { play() { }, pause() { }, cloneNode() { return this; }, addEventListener() { } }; },
  requestAnimationFrame() { return 0; },
  setTimeout(fn) { TQ.push({ fn }); return TQ.length; },
  clearTimeout() { },
  setInterval() { return 0; },   /* 打字机不跑，剧情统一走 skipStory */
  clearInterval() { },
  navigator: { userAgent: "node" },
  localStorage: { getItem() { return null; }, setItem() { }, removeItem() { } }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* index.html 里 <script src="data/story.js"> 是外部文件，得先喂进去 */
const storySrc = fs.readFileSync(path.join(ROOT, "data/story.js"), "utf8");
try {
  vm.runInContext(storySrc, sandbox, { filename: "data/story.js" });
} catch (e) {
  console.error("!! 剧情文件加载失败：", e.message);
  process.exit(1);
}
try {
  vm.runInContext(code, sandbox, { filename: "index.html" });
} catch (e) {
  console.error("!! 脚本加载就炸了：", e.message);
  console.error(e.stack);
  process.exit(1);
}
const G = sandbox.__T__;
if (!G) { console.error("!! 没拿到 __T__ 测试钩子"); process.exit(1); }

const $ = id => registry.get(id);
const S = () => G.S();
const B = () => G.B();

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.log("  ✗ " + msg); }
}

/* 打完当前这场：一直出剑系卡，直到分出胜负 */
function fight(limit = 60) {
  const tree = G.TREE.find(t => t.kind === "atk");
  let rounds = 0;
  while (rounds++ < limit) {
    const b = B();
    if (!b || b.foe.hp <= 0 || S().hp <= 0) break;
    b.busy = false;
    b.hand = [tree, tree, tree];
    G.renderSkills();
    G.useCard(tree);
    drain();
  }
  drain();
  return rounds;
}

/* 推进剧情（打字机被禁了，只能跳过） */
function settle(limit = 12) {
  for (let i = 0; i < limit; i++) {
    if ($("dlg").classList.contains("hide")) return;
    G.skipStory();
    drain();
  }
}

console.log("════════ 全流程通关模拟 ════════\n");

G.newGame();
Object.assign(S(), { hp: 999999, maxHp: 999999, pow: 900, bond: 3 });

const seenFoes = new Set();
const dayLog = [];
let diedOn = null;

for (let d = 1; d <= 30; d++) {
  S().day = d;
  const bossIdx = G.BOSS_DAY[d];
  /* 普通日只从非首领池里挑，跟真实流程一致 */
  const pool = G.FOES.map((f, i) => i).filter(i => !G.FOES[i].boss);
  const foeIdx = bossIdx !== undefined ? bossIdx : pool[d % pool.length];
  const foe = G.FOES[foeIdx];
  seenFoes.add(foe.nm);

  try {
    G.startBattle(foeIdx, null);
    drain();
    const rounds = fight();
    settle();
    dayLog.push(`D${String(d).padStart(2)} ${foe.nm.padEnd(8)} ${rounds} 回合  HP ${Math.round(S().hp)}`);
  } catch (e) {
    errs.push(`第 ${d} 天「${foe.nm}」崩了：${e.message}`);
    dayLog.push(`D${String(d).padStart(2)} ${foe.nm} 崩了：${e.message}`);
    break;
  }

  if (S().hp <= 0) { diedOn = d; break; }
}

console.log(dayLog.join("\n"));

/* ── 断言 ── */
console.log("\n[1] 30 天逐日推进");
ok(S().day === 30, "走到第 30 天，实得 " + S().day);
ok(diedOn === null, "没有中途倒下（倒下于第 " + diedOn + " 天）");
ok(dayLog.length === 30, "30 天全部跑完，实得 " + dayLog.length);
ok(seenFoes.size >= 9, `敌人覆盖 ${seenFoes.size} 种（普通池 + 首领）`);
const mainBosses = [...new Set(Object.values(G.BOSS_DAY))].map(i => G.FOES[i].nm);
const missBoss = mainBosses.filter(n => !seenFoes.has(n));
ok(missBoss.length === 0, "主线 5 个首领都打过了，缺：" + missBoss.join(","));

console.log("\n[2] 五个首领节点");
[6, 12, 18, 24, 30].forEach(d => {
  const okDay = dayLog[d - 1] && !/崩了/.test(dayLog[d - 1]);
  ok(okDay, `第 ${d} 天首领战正常结束`);
});
ok(Object.keys(G.BOSS_DAY).length === 5, "首领节点 5 个");

console.log("\n[3] 商店 / 行装 / 探索");
try {
  S().gold = 5000;
  G.openShop();
  drain();
  const stock = G.STOCK();
  ok(stock.length === 3, "货架 3 件，实得 " + stock.length);
  ok(stock.some(x => /书/.test(x.nm)), "货架里必定有招式书");
  G.buyItem(0); drain();
  ok(S().gold < 5000, "买了一件，钱少了");
  G.leaveShop(); drain();
  settle();
  ok(true, "商店进出正常");
} catch (e) { ok(false, "商店崩了：" + e.message); }

try {
  S().day = 10;
  G.openGear(null);
  drain();
  const gear = G.GEAR && G.GEAR[0];
  if (gear) { G.equipGear(gear.id); drain(); ok(true, "能穿装备"); }
  else ok(false, "没有装备数据");
} catch (e) { ok(false, "行装崩了：" + e.message); }

console.log("\n[4] 结局分支（走真实的 nextDay 路径）");
try {
  S().day = 30;
  G.nextDay();          /* day 31 > MAXDAY → endGame(true) */
  drain(); settle(); drain();
  ok(!$("end").classList.contains("hide"), "结局页显示出来了");
  ok(($("endTitle").textContent || "").length > 0, "结局标题非空：" + $("endTitle").textContent);
  ok(/羁绊/.test($("endLines").innerHTML || ""), "结局统计里带羁绊");
  console.log("  结局：" + $("endTitle").textContent + " / " + ($("endLines").innerHTML || "").split("<br")[0]);
} catch (e) { ok(false, "结局崩了：" + e.message); }

console.log("\n[5] 运行时错误");
if (errs.length) {
  [...new Set(errs)].slice(0, 10).forEach(e => console.log("  ! " + e));
}
ok(errs.length === 0, "全程零运行时异常，实得 " + errs.length + " 条");

console.log("\n════════════════════════");
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
process.exit(fail ? 1 : 0);
