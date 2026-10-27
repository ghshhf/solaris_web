/* 索拉丽斯炼成计划 · 网页版 —— 无头回归测试
   最小 DOM 桩 + vm 沙箱跑通主流程：
   开场（可跳过）→ 首战 → 点卡即结算 → 每日 → 结局分支
   跑法：node tools/selftest.js
*/
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; fails.push(msg); console.log("  ✗ " + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

/* 游戏已经不用 rAF 了，留个空桩免得将来加回特效时报 undefined */
function requestAnimationFrame(fn) { setTimeout(() => fn(Date.now()), 16); }

const sandbox = {
  document, console,
  setTimeout, setInterval, clearInterval, clearTimeout,
  requestAnimationFrame,
  performance: { now: () => Date.now() },
  AudioContext: function () {
    return {
      currentTime: 0, destination: {},
      createOscillator: () => ({ type: "", frequency: { setValueAtTime() { }, exponentialRampToValueAtTime() { } }, connect() { }, start() { }, stop() { } }),
      createGain: () => ({ gain: { setValueAtTime() { }, exponentialRampToValueAtTime() { } }, connect() { } })
    };
  },
  Image: function () { this.onload = null; this.onerror = null; Object.defineProperty(this, "src", { set(v) { if (this.onload) this.onload(); } }); },
  location: { reload() { } }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

vm.runInContext(fs.readFileSync(path.join(ROOT, "data/story.js"), "utf8"), ctx, { filename: "story.js" });
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
vm.runInContext(inline, ctx, { filename: "game.js" });

const $ = id => registry.get(id);
const G = sandbox.__T__;
const dlgOpen = () => !$("dlg").classList.contains("hide");

(async function main() {

  console.log("\n[1] 素材完整性");
  const story = sandbox.window.STORY;
  const need = new Set();
  Object.values(story).forEach(list => list.forEach(l => need.add(l.w + "_" + l.e)));
  (sandbox.window.IDLE_LINES || []).forEach(l => need.add(l.w + "_" + l.e));
  const missing = [...need].filter(k => !fs.existsSync(path.join(ROOT, "assets/portrait", k + ".png")));
  ok(need.size > 0, "剧情表情引用非空");
  ok(missing.length === 0, "立绘全部存在，缺：" + missing.join(","));
  console.log(`  引用表情 ${need.size} 种，缺失 ${missing.length} 种`);

  const bgs = ["morning", "day", "night", "opening", "clear", "shop", "battle", "boss"];
  const missBg = bgs.filter(b => !fs.existsSync(path.join(ROOT, "assets/bg", b + ".png")));
  ok(missBg.length === 0, "背景齐全，缺：" + missBg.join(","));

  /* 11 只敌人 × 五套帧动画，逐帧点验 */
  const foes = ["clawbird", "scissorbug", "scale_beast", "vine_beast", "slime_golem",
    "hi_golem", "red_dragon", "balthasar", "tetia", "croise", "homukuro"];
  const FA_N = { idle: 8, warn: 4, hit: 8, down: 6, buff: 6 };
  const NOBUFF = ["scale_beast"];
  let frames = 0;
  const missFoe = [];
  foes.forEach(a => {
    Object.keys(FA_N).forEach(m => {
      if (m === "buff" && NOBUFF.includes(a)) return;
      for (let i = 0; i < FA_N[m]; i++) {
        const p = path.join(ROOT, "assets/foe_anim", a, `${m}_${i}.webp`);
        if (fs.existsSync(p)) frames++; else missFoe.push(`${a}/${m}_${i}`);
      }
    });
  });
  ok(missFoe.length === 0, "敌人动画帧齐全，缺：" + missFoe.slice(0, 6).join(","));
  ok(frames >= 340, `动画帧总量 ${frames} 张（应为 346）`);
  console.log(`  敌人 ${foes.length} 种 × 5 套动作，共 ${frames} 帧`);

  /* 招式特效与场景 */
  const fxSets = ["slash1", "slash2", "slash3", "slash_big", "punch", "combo", "fall", "pierce"];
  const missFx = [];
  fxSets.forEach(s => { for (let i = 0; i < 6; i++) if (!fs.existsSync(path.join(ROOT, "assets/fx", s, `${i}.webp`))) missFx.push(s + "/" + i); });
  ok(missFx.length === 0, "招式特效齐全，缺：" + missFx.slice(0, 4).join(","));
  const zones = ["wasteland", "forest", "forest_cave", "trial", "volcano", "sea_cave"];
  const missZone = zones.filter(z => !fs.existsSync(path.join(ROOT, "assets/zone", z, "0.webp")));
  ok(missZone.length === 0, "6 个区域场景齐全，缺：" + missZone.join(","));
  const missSt = ["poison", "burn", "wound", "soften", "armor", "strength"].filter(s => !fs.existsSync(path.join(ROOT, "assets/status", s + ".webp")));
  ok(missSt.length === 0, "状态图标齐全，缺：" + missSt.join(","));
  ok(fs.existsSync(path.join(ROOT, "assets/bgm", "battle.mp3")), "战斗 BGM 在");

  console.log("\n[2] 开场剧情 · 跳过按钮");
  $("btnStart").onclick();
  ok(dlgOpen(), "开战后对话框显示");
  await sleep(40);
  ok($("dlgTxt").textContent.length > 0, "首句已开始打字，实得长度 " + $("dlgTxt").textContent.length);
  const firstWho = $("dlgWho").firstChild.nodeValue;
  ok(firstWho === "索拉丽斯", "第一句说话人是索拉丽斯，实得：" + firstWho);
  ok(html.indexOf('id="dlgSkip"') > -1, "对话框里挂了跳过按钮");

  /* 正常推进 3 句，确认没跳过时对话是能走的 */
  const poke = () => $("dlg").onclick({ preventDefault() { }, stopPropagation() { } });
  for (let i = 0; i < 3; i++) { poke(); poke(); await sleep(2); }
  ok(dlgOpen(), "手动能一句句推进");
  ok(story.opening[3].t.startsWith($("dlgTxt").textContent.slice(0, 12)),
     "推进到第 4 句（共 " + story.opening.length + " 句）");

  /* 点跳过：整段直接收尾，进入首战（跳过有 110ms 延迟，防点击穿透到战斗页） */
  let bubbled = false;
  $("dlgSkip").onclick({ preventDefault() { }, stopPropagation() { bubbled = true; } });
  ok(bubbled, "跳过按钮拦住冒泡，不会顺带把对话再翻一页");
  await sleep(180);
  ok(!dlgOpen(), "点跳过 → 对话框立刻关闭");
  ok(!$("battle").classList.contains("hide"), "跳过剧情直接进首战，不用再点 13 下");

  console.log("\n[3] 首战进入 · 手牌");
  ok(!$("battle").classList.contains("hide"), "进入战斗页");
  ok($("foeName").textContent.indexOf("爪鸟") === 0, "首战敌人是爪鸟，实得：" + $("foeName").textContent);
  ok(/assets\/foe_anim\/clawbird\/idle_0\.webp/.test($("foeSprite").style.backgroundImage),
     "对手帧动画指到 clawbird 待机首帧");
  ok($("skills").children.length === 3, "手牌 3 张，实得：" + $("skills").children.length);
  ok(/Lv\.1/.test($("skills").children[0].innerHTML), "卡面显示等级");
  ok(/class="nm"/.test($("skills").children[0].innerHTML), "卡面显示招式名");

  console.log("\n[3b] 七系 × 11 级");
  ok(G.TREE.length === 7, "七系招式树，实得：" + (G.TREE || []).length);
  ok(G.TREE.every(t => t.nm.length === 11), "每系 11 级，全齐");
  ok(G.TREE.reduce((a, t) => a + t.nm.length, 0) === 77, "共 77 条招式名（原作 7 系 77 招）");
  ok(G.TREE[0].nm[0] === "攻击" && G.TREE[0].nm[10] === "碎剑", "剑系 攻击 → 碎剑");
  ok(G.TREE[4].nm[10] === "准备万全", "蓄力系 Lv11 = 准备万全");
  ok(G.TREE[3].nm[10] === "祈祷拳", "治愈拳系 Lv11 = 祈祷拳");
  ok(G.valOf(G.TREE[0], 11) > G.valOf(G.TREE[0], 1) * 3, "剑系满级伤害 > Lv1 的 3 倍");
  ok(G.NEED.length === 10, "10 档升级门槛");

  console.log("\n[4] 点卡即结算（无判定条）");
  G.setHand([G.TREE[0], G.TREE[1], G.TREE[3]]);
  G.renderSkills();
  const hpBefore = parseInt($("foeHpTx").textContent);
  $("skills").children[0].onclick();
  await sleep(260);
  ok(html.indexOf('id="qte"') === -1 && !/qteTrack/.test(html), "页面里已没有判定条节点");
  ok(inline.indexOf("openQTE") === -1, "判定逻辑（openQTE）已整体移除");
  ok($("blog").textContent.indexOf("攻击") > -1, "点一下卡就出招并写日志，实得：" + $("blog").textContent.slice(0, 30));
  const hpAfter = parseInt($("foeHpTx").textContent);
  ok(hpAfter < hpBefore, `敌人掉血：${hpBefore} → ${hpAfter}`);
  ok(G.S().lv.slash === 2, "剑系升到 Lv.2，实得 Lv." + G.S().lv.slash);
  ok(G.S().exp.slash === 0, "升级后熟练度清零，实得 " + G.S().exp.slash);
  ok(/斩击/.test($("blog").textContent), "升级日志出现新招名，实得：" + $("blog").textContent.slice(0, 40));

  console.log("\n[4b] 随机浮动");
  const N = 4000, bucket = { crit: 0, slip: 0, normal: 0 }, muls = [];
  for (let i = 0; i < N; i++) {
    const r = G.rollHit();
    muls.push(r.mul);
    bucket[r.tag === "crit" ? "crit" : r.tag === "slip" ? "slip" : "normal"]++;
  }
  const pc = v => v / N;
  ok(Math.abs(pc(bucket.crit) - G.ROLL.crit) < 0.035, `会心占比≈${G.ROLL.crit}，实测 ${pc(bucket.crit).toFixed(3)}`);
  ok(Math.abs(pc(bucket.slip) - (G.ROLL.slip - G.ROLL.crit)) < 0.035,
     `手滑占比≈${(G.ROLL.slip - G.ROLL.crit).toFixed(2)}，实测 ${pc(bucket.slip).toFixed(3)}`);
  ok(Math.abs(pc(bucket.normal) - (1 - G.ROLL.slip)) < 0.035, `平常占比≈${1 - G.ROLL.slip}，实测 ${pc(bucket.normal).toFixed(3)}`);
  ok(muls.every(m => m > 0 && m <= G.ROLL.mulCrit), "倍率恒为正且不超过会心上限");
  ok(Math.abs(muls.reduce((a, b) => a + b, 0) / N - 1.07) < 0.06,
     "平均倍率落在 1.07 附近，" + (muls.reduce((a, b) => a + b, 0) / N).toFixed(3));

  console.log("\n[5] 羁绊替代判定区");
  ok(Math.abs(G.bondMul() - 1) < 1e-9, "羁绊 1 时无加成");
  G.S().bond = 5;
  ok(Math.abs(G.bondMul() - 1.2) < 1e-9, "羁绊 5 时倍率 1.20，实得 " + G.bondMul());
  G.B().busy = false;
  G.setHand([G.TREE[1], G.TREE[0], G.TREE[3]]);
  G.renderSkills();
  const shieldBefore = G.B().shield;
  $("skills").children[0].onclick();
  await sleep(260);
  ok(G.B().shield > shieldBefore, `防御卡直接加护盾 ${shieldBefore} → ${G.B().shield}`);
  await sleep(1600);
  ok(G.B().busy === false, "敌人回合结束后可以继续出牌");

  console.log("\n[6] 结局分支");
  ["endBad", "endNormal", "endBond"].forEach(k => {
    ok(Array.isArray(story[k]) && story[k].length >= 4, k + " 剧情数据（" + (story[k] || []).length + " 句）");
  });

  console.log("\n[7] 商店");
  ok(html.indexOf('id="shop"') > -1 && html.indexOf('id="shopList"') > -1, "商店面板已挂上");
  ok(inline.indexOf("doShop") === -1, "旧的「开店」一次性结算已删");
  G.newGame();
  G.openShop();
  ok(!$("shop").classList.contains("hide"), "打开商店后进入商店页");
  const stock = G.STOCK();
  ok(stock.length === 3, "货架 3 件，实得 " + stock.length);
  ok(stock.some(x => x.ic === "✦"), "货架里必有 1 本招式书");
  ok(stock.every(x => x.price > 0 && x.ds), "每件都有价格和说明");
  ok($("shopList").children.length === 3, "列表渲染 3 行");

  ok(G.S().gold === 0, "开局没钱");
  ok($("btnWork").disabled === false, "可以帮工");
  const g0 = G.S().gold;
  G.workShop();
  const g1 = G.S().gold;
  ok(g1 > g0, `帮工赚到金币 ${g0} → ${g1}`);
  ok($("btnWork").disabled === true, "帮工一天只能一次");
  G.workShop();
  ok(G.S().gold === g1, "再点帮工不再加钱");

  /* 钱不够时买不动（sitem 里只有一个 button 子节点） */
  const bookIdx = stock.findIndex(x => x.ic === "✦");
  const buyBtn = () => $("shopList").children[bookIdx].children[0];
  G.S().gold = 0;
  G.renderShop();
  ok(buyBtn().disabled === true, "钱不够时购买键禁用");

  /* 有钱就能买，且真的加熟练度 */
  G.S().gold = 999;
  G.renderShop();
  ok(buyBtn().disabled === false, "钱够时购买键可用");
  const price = stock[bookIdx].price;
  G.buyItem(bookIdx);
  ok(G.S().gold === 999 - price, `买书扣钱 ${999} → ${G.S().gold}`);
  ok(stock[bookIdx].bought === true, "买过的标记已购入");
  ok(G.TREE.some(t => G.S().lv[t.id] > 1), "招式书确实涨了熟练度（有系升级）");
  ok(buyBtn().disabled === true && buyBtn().textContent === "已购入", "买完按钮变已购入");
  const before = G.S().gold;
  G.buyItem(bookIdx);
  ok(G.S().gold === before, "同一件不能买第二次");

  /* 加熟练度 3 点的档位要对 */
  G.newGame();
  G.addExp(G.TREE[0], 3);
  ok(G.S().lv.slash === 3, "剑系吃 3 点熟练度 → Lv.3，实得 Lv." + G.S().lv.slash);

  G.openShop();
  G.leaveShop();
  ok(!$("result").classList.contains("hide"), "离开商店进入结算页");
  ok($("resTitle").textContent === "商店", "结算标题是商店，实得：" + $("resTitle").textContent);

  console.log("\n[8] 敌人帧动画");
  ok(/faPlay/.test(inline) && /faPreload/.test(inline), "帧动画引擎已接线");
  G.newGame();
  G.startBattle(4, null);
  const bg0 = $("foeSprite").style.backgroundImage;
  ok(/foe_anim\/slime_golem\/idle_0\.webp/.test(bg0), "开局播待机首帧，实得：" + bg0);
  ok(/foe_anim\//.test(bg0) && !/assets\/foe\//.test(bg0), "不再用旧的静态立绘");
  ok(/faCount/.test(inline), "缺帧的敌人有降级处理");
  ok(/FA_NOBUFF/.test(inline) && /scale_beast/.test(inline), "鳞甲兽缺强化套已登记");
  G.startBattle(0, null);
  ok(/clawbird/.test($("foeSprite").style.backgroundImage), "换怪时切到 clawbird 帧");

  console.log("\n[8b] 状态系统");
  ok(Object.keys(G.STATUS).length >= 5, "状态种类 ≥5，实得 " + Object.keys(G.STATUS).length);
  ok(!!G.STATUS.poison && !!G.STATUS.burn && !!G.STATUS.wound, "中毒/灼烧/负伤都在");
  G.newGame(); G.startBattle(3, null);   // 藤蔓兽会缠绕
  G.addStatus("p", "poison", 3);
  ok(!!G.B().st.poison, "玩家身上挂上中毒");
  ok(G.B().st.poison === 3, "回合数记对，实得 " + G.B().st.poison);
  G.addStatus("foe", "burn", 2);
  ok(!!G.B().foe.status.burn, "敌人身上挂上灼烧");
  const stHtml = $("foeStatus").innerHTML;
  G.renderFoe();
  ok(/status\/burn\.webp|backgroundImage/.test($("foeStatus").innerHTML) || $("foeStatus").children.length > 0,
     "状态图标渲染到敌人身上");
  ok(G.FOES.length === 11, "敌人 11 只（原作全套），实得 " + G.FOES.length);
  ok(G.FOES.every(f => f.sk && f.sk.nm), "每只怪都有招牌技能");

  console.log("\n[8c] 探索系统");
  ok(G.ZONES.length === 6, "6 个区域，实得 " + G.ZONES.length);
  ok(G.ZONES.every(z => z.id && z.nm && z.floors > 0), "每个区域都有名字与层数");
  ok(G.ZONES.reduce((a, z) => a + z.floors, 0) === 33, "总层数 33，实得 " + G.ZONES.reduce((a, z) => a + z.floors, 0));
  const allFoe = G.ZONES.every(z => G.zoneFoes(z).length > 0);
  ok(allFoe, "每个区域都有敌人可出");
  G.newGame();
  ok(G.zoneUnlocked(G.ZONES[0]) === true, "荒野开局就开");
  ok(G.zoneUnlocked(G.ZONES[5]) === false, "试炼之仪要等第 26 天");
  G.S().day = 30;
  ok(G.zoneUnlocked(G.ZONES[5]) === true, "后期全区域解锁");
  G.S().day = 3;
  G.openZone();
  ok(!$("zone").classList.contains("hide"), "区域列表能打开");
  ok($("zoneList").children.length === 6, "列出 6 个区域，实得 " + $("zoneList").children.length);
  G.enterZone("wasteland");
  ok(!$("explore").classList.contains("hide"), "进入探索面板");
  ok(G.Z().depth === 1, "从第 1 层开始");
  ok(/wasteland\/0\.webp/.test($("zanim").style.backgroundImage), "区域特效帧已挂上");
  ok(/assets\/bg\//.test($("zstage").style.backgroundImage), "底下垫了场景图，不会黑屏");
  ok($("expZone").textContent === "荒野", "区域名显示对，实得：" + $("expZone").textContent);
  G.searchZone();
  ok(G.Z().searched === true, "搜刮后标记已搜");
  ok(G.Z().depth === 1, "搜刮不推进层数");
  /* 推进到底会进首领战 */
  G.S().hp = 999; G.S().maxHp = 999;
  const zd = G.Z();
  zd.depth = zd.floors;
  G.advanceZone();
  await sleep(900);
  ok(!!G.B(), "走到底触发首领战，B 已建立");
  ok(G.B().foe && G.B().foe.nm, "首领有名字，实得：" + (G.B() && G.B().foe && G.B().foe.nm));

  console.log("\n[8d] 装备");
  ok(G.GEAR.length === 18, "18 件装备，实得 " + G.GEAR.length);
  ok(G.GEAR.filter(g => g.slot === "weapon").length === 6, "6 把杖");
  ok(G.GEAR.filter(g => g.slot === "acc").length === 12, "12 件饰品");
  G.newGame();
  const pow0 = G.S().pow, def0 = G.S().def;
  G.ownGear("fire_wand");
  ok(G.S().bag.includes("fire_wand"), "买下后进背包");
  G.equipGear("fire_wand");
  ok(G.curGear("weapon") && G.curGear("weapon").id === "fire_wand", "武器槽穿上火焰之杖");
  ok(G.S().pow === pow0 + 8, `力量 +8：${pow0} → ${G.S().pow}`);
  G.equipGear("blaze_wand");
  ok(G.curGear("weapon").id === "blaze_wand", "换杖替换旧杖");
  ok(G.S().pow === pow0 + 12, `换杖后力量是 +12 而非叠加：${G.S().pow}`);
  G.unequipGear("weapon");
  ok(G.S().pow === pow0, "脱下后力量回到原点");
  G.ownGear("bless_amu");
  const hp0 = G.S().maxHp, chp0 = G.S().hp;
  G.equipGear("bless_amu");
  ok(G.S().maxHp === hp0 + 14, "祝福护符上限 +14");
  ok(G.S().hp === chp0 + 14, "上限增加同时补血");
  G.unequipGear("acc");
  ok(G.S().maxHp === hp0 && G.S().hp <= G.S().maxHp, "脱下后上限回落且血不超上限");
  G.ownGear("needle_ring");
  G.equipGear("needle_ring");
  ok(G.gearHas("thorns") === 5, "针山指轮的反伤被读到，实得 " + G.gearHas("thorns"));
  G.openGear(null);
  ok(!$("gear").classList.contains("hide"), "行装面板能打开");
  ok($("slotWeapon").className.indexOf("slot") === 0, "武器槽渲染出来");
  ok($("gearList").children.length > 0, "背包列表非空");

  console.log("\n[8e] 30 天流程");
  ok(G.MAXLV === 11, "招式仍是 11 级");
  ok(Object.keys(G.BOSS_DAY).length === 5, "5 个首领节点，实得 " + Object.keys(G.BOSS_DAY).length);
  ok(Object.keys(G.BOSS_DAY).map(Number).every(d => d <= 30), "首领节点都在 30 天内");
  ok(G.S().maxDay === 30, "总天数是 30，实得 " + G.S().maxDay);

  console.log("\n[9] 静态契约");
  ok(inline.indexOf("dlgSkip") > -1, "跳过按钮已接线");
  ok(!/openQTE|qteTrack|完美|失误/.test(inline), "判定逻辑与判定文案已清干净");
  ok(html.indexOf("assets/portrait/") > -1, "立绘走相对路径");
  /* 占位图是内联 data: SVG，里面必有 xmlns 的 w3.org —— 那不是网络请求，先摘掉再查 */
  const noNs = inline.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");
  ok(!/https?:\/\/(?!127\.0\.0\.1)/.test(noNs), "游戏脚本无外链依赖");
  ok(inline.indexOf("localization") === -1, "未泄露内部提取路径");
  ok(html.indexOf("image-rendering:pixelated") > -1, "像素图关闭插值");

  console.log("\n════════════════════");
  console.log(`通过 ${pass} 项，失败 ${fail} 项`);
  if (fail) { console.log("失败项："); fails.forEach(f => console.log("  - " + f)); process.exitCode = 1; }
  process.exit(process.exitCode || 0);
})();
