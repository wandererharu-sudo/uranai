/**
 * 紫微斗数の命盤（三合派・『紫微斗数全書』系の一般的な安星法）。
 * 宮の番号は地支: 0=子 1=丑 2=寅 … 11=亥。
 * 時辰の番号: 0=子 1=丑 … 11=亥。23時〜24時の「夜子」は翌日の子の刻として計算する（呼び出し側で日付を進める）。
 */
(function (root, factory) {
  const api = factory(
    typeof module === "object" && module.exports ? require("./lunar.js") : root.ZiweiLunar
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Ziwei = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (lunar) {
  const STEMS = "甲乙丙丁戊己庚辛壬癸";
  const BR = "子丑寅卯辰巳午未申酉戌亥";
  const PALACES = ["命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮", "遷移宮", "交友宮", "官禄宮", "田宅宮", "福徳宮", "父母宮"];
  const BUREAU = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };
  // 納音五行（60干支を2つずつ）。金=4 木=3 水=2 土=5 火=6 の局数で持つ。
  const NAYIN_BUREAU = [4, 6, 3, 5, 4, 6, 2, 5, 4, 3, 2, 5, 6, 3, 2, 4, 6, 3, 5, 4, 6, 2, 5, 4, 3, 2, 5, 6, 3, 2];
  const NAYIN_NAME = ["海中金", "炉中火", "大林木", "路傍土", "剣鋒金", "山頭火", "澗下水", "城頭土", "白蝋金", "楊柳木", "泉中水", "屋上土", "霹靂火", "松柏木", "長流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金", "覆灯火", "天河水", "大駅土", "釵釧金", "桑柘木", "大渓水", "沙中土", "天上火", "石榴木", "大海水"];
  // 生年四化（禄・権・科・忌）。庚年は「太陽・武曲・太陰・天同」の説を採る。
  const SIHUA = [
    ["廉貞", "破軍", "武曲", "太陽"], // 甲
    ["天機", "天梁", "紫微", "太陰"], // 乙
    ["天同", "天機", "文昌", "廉貞"], // 丙
    ["太陰", "天同", "天機", "巨門"], // 丁
    ["貪狼", "太陰", "右弼", "天機"], // 戊
    ["武曲", "貪狼", "天梁", "文曲"], // 己
    ["太陽", "武曲", "太陰", "天同"], // 庚
    ["巨門", "太陽", "文曲", "文昌"], // 辛
    ["天梁", "紫微", "左輔", "武曲"], // 壬
    ["破軍", "巨門", "太陰", "貪狼"]  // 癸
  ];
  const HUA = ["化禄", "化権", "化科", "化忌"];
  // 天魁・天鉞（甲戊庚は丑未、乙己は子申、丙丁は亥酉、辛は午寅、壬癸は卯巳）
  const KUI = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];
  const YUE = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5];
  // 禄存（甲寅 乙卯 丙戊巳 丁己午 庚申 辛酉 壬亥 癸子）
  const LUCUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  // 命主（命宮の地支）・身主（生年の地支）
  const MINGZHU = ["貪狼", "巨門", "禄存", "文曲", "廉貞", "武曲", "破軍", "武曲", "廉貞", "文曲", "禄存", "巨門"];
  const SHENZHU = ["火星", "天相", "天梁", "天同", "文昌", "天機", "火星", "天相", "天梁", "天同", "文昌", "天機"];
  const MAJOR = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"];

  function mod(n, m) { return ((n % m) + m) % m; }

  function ganzhiIndex(stem, branch) {
    for (let n = 0; n < 60; n++) if (n % 10 === stem && n % 12 === branch) return n;
    return -1;
  }

  /** 紫微星の位置。局数 j・旧暦の日 d */
  function ziweiPos(j, d) {
    const q = Math.ceil(d / j);
    const x = q * j - d;
    const base = 2 + q - 1; // 寅から数える
    return mod(x % 2 === 0 ? base + x : base - x, 12);
  }

  /**
   * 命盤を作る。
   * input: { y, m, d, hour: 0..11 | null, lateZi: bool, gender: "男"|"女", calendar: "jp"|"cn", now: {y,m,d} }
   * 出生時刻が不明（hour = null）のときは、命宮・身宮・十二宮・五行局・紫微・十四主星・
   * 時刻で決まる星（文昌・文曲・火星・鈴星・地空・地劫）・大限を出さない。
   */
  function chart(input) {
    let y = input.y, m = input.m, d = input.d;
    if (input.hour === 0 && input.lateZi) {
      const t = lunar.addDays(y, m, d, 1); y = t.y; m = t.m; d = t.d;
    }
    const off = input.calendar === "cn" ? (y < 1929 ? 7.7611 : 8) : 9;
    const lu = lunar.toLunar(y, m, d, off);
    if (!lu) throw new Error("この日付は計算できません（1900〜2100年でお試しください）");
    const yg = lunar.yearGanzhi(lu.year);
    const ys = yg.stem, yb = yg.branch;
    // 閏月: 15日までは前の月、16日からは次の月として扱う
    let month = lu.month;
    if (lu.leap && lu.day > 15) month = month === 12 ? 1 : month + 1;
    const h = input.hour;
    const known = h !== null && h !== undefined;

    const palaces = [];
    const yinStem = [2, 4, 6, 8, 0][ys % 5];
    for (let b = 0; b < 12; b++) {
      palaces.push({ branch: b, stem: mod(yinStem + mod(b - 2, 12), 10), name: null, major: [], minor: [], hua: {} , decade: null });
    }
    function put(list, star, pos) { palaces[mod(pos, 12)][list].push(star); }

    // 年で決まる星（時刻がなくても出せる）
    put("minor", "天魁", KUI[ys]);
    put("minor", "天鉞", YUE[ys]);
    const lc = LUCUN[ys];
    put("minor", "禄存", lc);
    put("minor", "擎羊", lc + 1);
    put("minor", "陀羅", lc - 1);
    // 月で決まる星
    put("minor", "左輔", 4 + (month - 1));
    put("minor", "右弼", 10 - (month - 1));

    const result = {
      input: { y: input.y, m: input.m, d: input.d, hour: known ? h : null, gender: input.gender, lateZi: !!input.lateZi, calendar: input.calendar === "cn" ? "cn" : "jp" },
      calcDate: { y: y, m: m, d: d },
      lunar: lu, lunarMonthUsed: month,
      yearGanzhi: yg.name, yearStem: ys, yearBranch: yb,
      yinyang: ys % 2 === 0 ? "陽" : "陰",
      hourKnown: known,
      palaces: palaces,
      sihua: SIHUA[ys].map(function (s, i) { return { star: s, hua: HUA[i] }; }),
      shenzhu: SHENZHU[yb]
    };

    if (known) {
      const ming = mod(2 + (month - 1) - h, 12);
      const shen = mod(2 + (month - 1) + h, 12);
      for (let i = 0; i < 12; i++) palaces[mod(ming - i, 12)].name = PALACES[i];
      palaces[shen].isShen = true;
      const n = ganzhiIndex(palaces[ming].stem, ming);
      const j = NAYIN_BUREAU[n >> 1];
      const z = ziweiPos(j, lu.day);
      const f = mod(4 - z, 12);
      put("major", "紫微", z); put("major", "天機", z - 1); put("major", "太陽", z - 3);
      put("major", "武曲", z - 4); put("major", "天同", z - 5); put("major", "廉貞", z - 8);
      put("major", "天府", f); put("major", "太陰", f + 1); put("major", "貪狼", f + 2);
      put("major", "巨門", f + 3); put("major", "天相", f + 4); put("major", "天梁", f + 5);
      put("major", "七殺", f + 6); put("major", "破軍", f + 10);
      put("minor", "文昌", 10 - h);
      put("minor", "文曲", 4 + h);
      const fl = [[1, 3], [2, 10], [3, 10], [9, 10]][[1, 2, 0, 3][yb % 4]]; // 寅午戌, 申子辰, 巳酉丑, 亥卯未
      put("minor", "火星", fl[0] + h);
      put("minor", "鈴星", fl[1] + h);
      put("minor", "地劫", 11 + h);
      put("minor", "地空", 11 - h);
      // 大限: 陽男・陰女は順行（子→丑→寅…）、陰男・陽女は逆行
      const forward = (ys % 2 === 0) === (input.gender === "男");
      for (let i = 0; i < 12; i++) {
        const p = palaces[mod(ming + (forward ? i : -i), 12)];
        p.decade = [j + 10 * i, j + 10 * i + 9];
      }
      Object.assign(result, {
        ming: ming, shen: shen, bureau: j, bureauName: BUREAU[j], mingNayin: NAYIN_NAME[n >> 1],
        ziwei: z, tianfu: f, mingzhu: MINGZHU[ming], forward: forward
      });
    }
    // 参考（飛星派・欽天派の見方）: 来因宮と自化。命盤の星の配置は変えない。
    if (known) {
      // 来因宮: 寅〜亥の宮のうち、宮の干が生まれ年の干と同じ宮（子・丑は寅・卯と同じ干になるので使わない）
      for (let b = 2; b < 12; b++) if (palaces[b].stem === ys) { result.laiyin = b; break; }
      // 自化: 宮の干から出る四化が、その宮の中の星に付く形
      result.zihua = [];
      palaces.forEach(function (p) {
        p.zihua = {};
        SIHUA[p.stem].forEach(function (s, i) {
          if (p.major.indexOf(s) >= 0 || p.minor.indexOf(s) >= 0) {
            p.zihua[s] = HUA[i];
            result.zihua.push({ branch: p.branch, star: s, hua: HUA[i] });
          }
        });
      });
    }
    // 四化を星に付ける
    SIHUA[ys].forEach(function (s, i) {
      palaces.forEach(function (p) {
        if (p.major.indexOf(s) >= 0 || p.minor.indexOf(s) >= 0) p.hua[s] = HUA[i];
      });
    });

    // 流年（今年）。流年の命宮 = 今年の地支の宮。年は旧暦の正月で切り替える。
    if (input.now) {
      const nl = lunar.toLunar(input.now.y, input.now.m, input.now.d, off);
      const ng = lunar.yearGanzhi(nl.year);
      const age = nl.year - lu.year + 1; // 数え年
      const fy = { year: nl.year, ganzhi: ng.name, palace: ng.branch, age: age, sihua: SIHUA[ng.stem].map(function (s, i) { return { star: s, hua: HUA[i] }; }) };
      if (known) {
        fy.palaceName = palaces[ng.branch].name;
        const dec = palaces.filter(function (p) { return p.decade && age >= p.decade[0] && age <= p.decade[1]; })[0];
        if (dec) fy.decade = { branch: dec.branch, name: dec.name, range: dec.decade };
      }
      result.flowYear = fy;
    }
    return result;
  }

  function where(ch, star) {
    for (let i = 0; i < 12; i++) {
      if (ch.palaces[i].major.indexOf(star) >= 0 || ch.palaces[i].minor.indexOf(star) >= 0) return i;
    }
    return -1;
  }

  /** 三方四正: その宮・対宮・三合の2宮（地支の番号で返す） */
  function sanfang(b) { return { self: b, opposite: mod(b + 6, 12), trine: [mod(b + 4, 12), mod(b + 8, 12)] }; }

  return { STEMS: STEMS, BR: BR, PALACES: PALACES, MAJOR: MAJOR, SIHUA: SIHUA, HUA: HUA, chart: chart, where: where, ziweiPos: ziweiPos, sanfang: sanfang };
});
