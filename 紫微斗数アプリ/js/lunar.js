/**
 * 旧暦（太陰太陽暦）への変換と、年の干支。
 * 天文計算は astro.js（擇日アプリと同じファイル。節気・朔は国立天文台の暦要項で検証済み）。
 * 旧暦の組み立ては擇日アプリ calendar.js の buildLunar / lunarOf と同じ考え方（下の buildLunar に補足）:
 *   ・朔（新月）の日を月の1日とする（日本標準時）
 *   ・冬至を含む月を十一月とする
 *   ・中気を含まない月を閏月とする
 * 年の干支は紫微斗数の一般的なやり方で「旧暦の正月（春節）」で切り替える（立春ではない）。
 */
(function (root, factory) {
  const api = factory(
    typeof module === "object" && module.exports ? require("./astro.js") : root.TakujitsuAstro
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZiweiLunar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (astro) {
  const STEMS = "甲乙丙丁戊己庚辛壬癸";
  const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
  let lunarCache = null;

  function mod(n, m) { return ((n % m) + m) % m; }

  // ΔT（TT−UT, 秒）。Espenak & Meeus (NASA, 2006) の多項式。
  // astro.js は 2026年付近の 69秒で固定しているので、昔の生年のために年ごとの値で日時に直す。
  function deltaT(y) {
    let t;
    if (y < 1900) { t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t - 0.0004473624 * t * t * t * t + t * t * t * t * t / 233174; }
    if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t - 0.000197 * t * t * t * t; }
    if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t; }
    if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547; }
    if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718; }
    if (y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t + 0.000651814 * t * t * t * t + 0.00002373599 * t * t * t * t * t; }
    if (y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
    t = (y - 1820) / 100; return -20 + 32 * t * t - 0.5628 * (2150 - y);
  }

  /** 力学時の JDE → その地方時（UTC+offset 時間）の日の番号（JDN） */
  function localJdn(jde, offsetHours) {
    const approxYear = 2000 + (jde - 2451545) / 365.25;
    const jdUt = jde - deltaT(approxYear) / 86400;
    return Math.floor(jdUt + 0.5 + offsetHours / 24);
  }

  function jdnToCivil(j) {
    const a = j + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 };
  }

  /**
   * 旧暦の月の並びを作る。手順は擇日アプリと同じ（朔が1日・冬至を含む月が十一月・中気のない月が閏月）。
   * 置閏は「冬至の月から次の冬至の月までが13か月ある年だけ、最初の中気のない月を閏月」とする
   * （中気のない月が閏年でない年にも出ることがあるため。1900年代はじめなどで必要）。
   * 日付は朔・中気の時刻を、ΔT を補正したうえで offsetHours の地方時の日付にしてから比べる。
   */
  function buildLunar(y1, y2, offsetHours) {
    const moonDays = [];
    const chuki = [];
    const seen = {};
    for (let y = y1 - 1; y <= y2 + 1; y++) {
      const pack = astro.eventsOfYear(y);
      for (let i = 0; i < pack.moons.length; i++) {
        const jd = localJdn(pack.moons[i].jde, offsetHours);
        if (!seen[jd]) { seen[jd] = true; moonDays.push(jd); }
      }
      for (let i = 0; i < pack.terms.length; i++) {
        const t = pack.terms[i];
        if (t.kind === "chuki") chuki.push({ name: t.name, jdn: localJdn(t.jde, offsetHours) });
      }
    }
    moonDays.sort(function (a, b) { return a - b; });
    // 月の検出で同じ朔を2回拾っていないか（29日未満の間隔は同じ朔）
    const md = [];
    for (let i = 0; i < moonDays.length; i++) {
      if (!md.length || moonDays[i] - md[md.length - 1] > 25) md.push(moonDays[i]);
    }
    const months = [];
    for (let i = 0; i < md.length - 1; i++) {
      const inside = chuki.filter(function (c) { return c.jdn >= md[i] && c.jdn < md[i + 1]; });
      months.push({
        js: md[i], jn: md[i + 1],
        hasChuki: inside.length > 0,
        winter: inside.some(function (c) { return c.name === "冬至"; })
      });
    }
    const wIdx = [];
    for (let i = 0; i < months.length; i++) if (months[i].winter) wIdx.push(i);
    for (let w = 0; w < wIdx.length - 1; w++) {
      const a = wIdx[w], b = wIdx[w + 1];
      const leapYear = b - a === 13;
      let leapDone = false;
      let n = 11;
      months[a].month = 11; months[a].leap = false;
      for (let i = a + 1; i < b; i++) {
        if (leapYear && !leapDone && !months[i].hasChuki) {
          months[i].month = n; months[i].leap = true; leapDone = true;
        } else {
          n = n === 12 ? 1 : n + 1;
          months[i].month = n; months[i].leap = false;
        }
      }
    }
    return months.filter(function (mo) { return mo.month !== undefined; });
  }

  function ensureLunar(y, offsetHours) {
    if (!lunarCache || y < lunarCache.y1 || y > lunarCache.y2 || lunarCache.off !== offsetHours) {
      lunarCache = { y1: y - 1, y2: y + 1, off: offsetHours, months: buildLunar(y - 1, y + 1, offsetHours) };
    }
    return lunarCache.months;
  }

  /**
   * 西暦 y-m-d → { year, month, day, leap, monthDays }
   * offsetHours: 旧暦を作る地方時。9 = 日本時間（既定）、8 = 中国・台湾の時間。
   */
  function toLunar(y, m, d, offsetHours) {
    const off = offsetHours === undefined ? 9 : offsetHours;
    const months = ensureLunar(y, off);
    const j = astro.gregorianJdn(y, m, d);
    for (let i = 0; i < months.length; i++) {
      const mo = months[i];
      if (j >= mo.js && j < mo.jn) {
        let year = y;
        if (mo.month >= 10 && m <= 3) year = y - 1;
        return { year: year, month: mo.month, day: j - mo.js + 1, leap: mo.leap, monthDays: mo.jn - mo.js };
      }
    }
    return null;
  }

  function yearGanzhi(lunarYear) {
    const n = mod(lunarYear - 1984, 60);
    return { index: n, stem: n % 10, branch: n % 12, name: STEMS[n % 10] + BRANCHES[n % 12] };
  }

  function addDays(y, m, d, k) {
    const t = new Date(Date.UTC(y, m - 1, d + k));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }

  return { STEMS: STEMS, BRANCHES: BRANCHES, toLunar: toLunar, yearGanzhi: yearGanzhi, addDays: addDays };
});
