/**
 * 日ごとの暦（干支・節月・十二直）と、宜忌（almanac.js）。
 * 天文計算は astro.js、基本の表は rules.js。
 *
 * 日の干支: ユリウス日 JDN（グレゴリオ暦の正午）に対し (JDN + 49) mod 60。
 *   0 = 甲子。2026-01-01 が乙亥になる取り方で、暦象年表の日干支と一致する。
 *   日界は日本標準時の午前0時（四柱で子の刻を23時とする流儀とは、日付の境が違うことがあります）。
 * 二十八宿: (JDN + 11) mod 28。0 = 角。2026-01-01 が井、2025-02-03 が張。
 *   飛びや繰り返しは入れない、連続した28日周期。
 * 年干支: 1984年の立春を甲子とし、立春の日付から新しい年。節入り当日は新しい年。
 * 月干支: 「甲己之年丙作首」。その節月が属する年の十干から寅月の干を決め、月支の分だけ進める。
 */
(function (root, factory) {
  const api = factory(
    typeof module === "object" && module.exports ? require("./astro.js") : root.TakujitsuAstro,
    typeof module === "object" && module.exports ? require("./rules.js") : root.TakujitsuRules,
    typeof module === "object" && module.exports ? require("./almanac.js") : root.TakujitsuAlmanac
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Takujitsu = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (astro, rules, almanac) {
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function iso(p) {
    return p.y + "-" + pad(p.m) + "-" + pad(p.d);
  }

  function parseISO(value) {
    if (typeof value === "string") {
      const parts = value.split("-");
      return { y: +parts[0], m: +parts[1], d: +parts[2] };
    }
    return { y: value.y, m: value.m, d: value.d };
  }

  function cmp(a, b) {
    const A = typeof a.date === "string" && a.y == null ? parseISO(a.date) : (a.y != null ? a : parseISO(a));
    const B = typeof b === "string" ? parseISO(b) : (b.date && b.y == null ? parseISO(b.date) : (b.y != null ? b : parseISO(b)));
    if (A.y !== B.y) return A.y - B.y;
    if (A.m !== B.m) return A.m - B.m;
    return A.d - B.d;
  }

  function jdnToCivil(jdn) {
    let a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = b * 100 + d - 4800 + Math.floor(m / 10);
    return { y: year, m: month, d: day };
  }

  function addDays(date, n) {
    const p = parseISO(date);
    return jdnToCivil(astro.gregorianJdn(p.y, p.m, p.d) + n);
  }

  function weekday(date) {
    const p = parseISO(date);
    return WEEK[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  }

  function dayIndex(date) {
    const p = parseISO(date);
    return mod(astro.gregorianJdn(p.y, p.m, p.d) + 49, 60);
  }

  function mansionIndex(date) {
    const p = parseISO(date);
    return mod(astro.gregorianJdn(p.y, p.m, p.d) + 11, 28);
  }

  function kanshiFromIndex(index) {
    const stem = mod(index, 10);
    const branch = mod(index, 12);
    return {
      index: index,
      stem: stem,
      branch: branch,
      stemName: rules.STEMS[stem],
      branchName: rules.BRANCHES[branch],
      text: rules.STEMS[stem] + rules.BRANCHES[branch],
      yomi: rules.STEM_YOMI[stem] + " " + rules.BRANCH_YOMI[branch]
    };
  }

  function termsOf(year) {
    return astro.eventsOfYear(year).terms;
  }

  function setsuOnOrBefore(date) {
    const p = parseISO(date);
    let best = null;
    for (let y = p.y - 1; y <= p.y; y++) {
      const terms = termsOf(y);
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (t.kind !== "setsu") continue;
        if (cmp(t, p) <= 0 && (!best || cmp(t, best) > 0)) best = t;
      }
    }
    return best;
  }

  function termNamed(year, name) {
    const terms = termsOf(year);
    for (let i = 0; i < terms.length; i++) if (terms[i].name === name) return terms[i];
    return null;
  }

  function doyouCovering(date) {
    const p = parseISO(date);
    const terms = termsOf(p.y);
    for (let i = 0; i < astro.DOYO.length; i++) {
      const spec = astro.DOYO[i];
      let start = null;
      let endTerm = null;
      for (let k = 0; k < terms.length; k++) {
        if (terms[k].kind === "doyou" && terms[k].id === spec.id) start = terms[k];
        if (terms[k].kind === "setsu" && terms[k].name === spec.endName) endTerm = terms[k];
      }
      if (!start || !endTerm) continue;
      const end = addDays(endTerm, -1);
      if (cmp(p, start) >= 0 && cmp(p, end) <= 0) {
        return {
          id: spec.id,
          season: spec.season,
          start: start.date,
          end: iso(end),
          mabi: rules.MABI[spec.id]
        };
      }
    }
    return null;
  }

  let lunarCache = null;

  function buildLunar(y1, y2) {
    const moons = [];
    const chuki = [];
    const seenMoon = {};
    for (let y = y1 - 1; y <= y2 + 1; y++) {
      const pack = astro.eventsOfYear(y);
      for (let i = 0; i < pack.moons.length; i++) {
        const moon = pack.moons[i];
        if (!seenMoon[moon.date]) {
          seenMoon[moon.date] = true;
          moons.push(moon);
        }
      }
      for (let i = 0; i < pack.terms.length; i++) {
        if (pack.terms[i].kind === "chuki") chuki.push(pack.terms[i]);
      }
    }
    moons.sort(function (a, b) { return a.jde - b.jde; });
    chuki.sort(function (a, b) { return a.jde - b.jde; });
    const months = [];
    for (let i = 0; i < moons.length - 1; i++) {
      const inside = [];
      for (let k = 0; k < chuki.length; k++) {
        if (chuki[k].jde >= moons[i].jde && chuki[k].jde < moons[i + 1].jde) inside.push(chuki[k]);
      }
      months.push({
        start: moons[i],
        next: moons[i + 1],
        chuki: inside,
        hasChuki: inside.length > 0
      });
    }
    const winters = chuki.filter(function (c) { return c.name === "冬至"; });
    const anchor = winters[0];
    let idx = -1;
    for (let i = 0; i < months.length; i++) {
      if (anchor.jde >= months[i].start.jde && anchor.jde < months[i].next.jde) {
        idx = i;
        break;
      }
    }
    if (idx < 0) throw new Error("冬至を含む月が見つかりません");
    months[idx].month = 11;
    months[idx].leap = false;
    let n = 11;
    for (let i = idx + 1; i < months.length; i++) {
      if (!months[i].hasChuki) {
        months[i].leap = true;
        months[i].month = n;
      } else {
        n = n === 12 ? 1 : n + 1;
        months[i].leap = false;
        months[i].month = n;
      }
    }
    n = 11;
    for (let i = idx - 1; i >= 0; i--) {
      if (!months[i].hasChuki) {
        months[i].leap = true;
        months[i].month = n === 1 ? 12 : n - 1;
      } else {
        n = n === 1 ? 12 : n - 1;
        months[i].month = n;
        months[i].leap = false;
      }
    }
    return months;
  }

  function ensureLunar(y) {
    if (!lunarCache || y < lunarCache.y1 || y > lunarCache.y2) {
      const y1 = y - 1;
      const y2 = y + 1;
      lunarCache = { y1: y1, y2: y2, months: buildLunar(y1, y2) };
    }
    return lunarCache.months;
  }

  function lunarOf(date) {
    const p = parseISO(date);
    const months = ensureLunar(p.y);
    const j = astro.gregorianJdn(p.y, p.m, p.d);
    for (let i = 0; i < months.length; i++) {
      const mo = months[i];
      const js = astro.gregorianJdn(mo.start.y, mo.start.m, mo.start.d);
      const jn = astro.gregorianJdn(mo.next.y, mo.next.m, mo.next.d);
      if (j >= js && j < jn) {
        return { month: mo.month, day: j - js + 1, leap: mo.leap };
      }
    }
    return null;
  }

  function yearIndexFor(date, risshunMode) {
    const p = parseISO(date);
    const risshun = termNamed(p.y, "立春");
    const onDay = risshun && risshun.date === iso(p);
    let year = p.y;
    if (!risshun || cmp(p, risshun) < 0) year = p.y - 1;
    else if (onDay && risshunMode === "before") year = p.y - 1;
    return { index: mod(year - 1984, 60), onRisshun: !!onDay, risshun: risshun };
  }

  function monthIndex(yearIndex, monthBranch) {
    const yearStem = mod(yearIndex, 10);
    const yinStem = [2, 4, 6, 8, 0][yearStem % 5];
    let n = 0;
    for (; n < 60; n++) if (mod(n, 10) === yinStem && mod(n, 12) === 2) break;
    const steps = mod(monthBranch - 2, 12);
    return mod(n + steps, 60);
  }

  function seasonOf(date) {
    const p = parseISO(date);
    const risshun = termNamed(p.y, "立春");
    const rikka = termNamed(p.y, "立夏");
    const risshu = termNamed(p.y, "立秋");
    const ritto = termNamed(p.y, "立冬");
    if (cmp(p, risshun) >= 0 && cmp(p, rikka) < 0) return "spring";
    if (cmp(p, rikka) >= 0 && cmp(p, risshu) < 0) return "summer";
    if (cmp(p, risshu) >= 0 && cmp(p, ritto) < 0) return "autumn";
    return "winter";
  }

  function birthPillars(birth) {
    if (!birth || !birth.y) return null;
    const mode = birth.risshun === "before" ? "before" : "after";
    const year = yearIndexFor(birth, mode);
    const day = dayIndex(birth);
    return {
      year: kanshiFromIndex(year.index),
      day: kanshiFromIndex(day),
      onRisshun: year.onRisshun,
      assumedAfter: year.onRisshun && birth.risshun !== "before",
      gender: birth.gender || ""
    };
  }

  function purposeById(id) {
    for (let i = 0; i < almanac.PURPOSES.length; i++) {
      if (almanac.PURPOSES[i].id === id) return almanac.PURPOSES[i];
    }
    return almanac.PURPOSES[0];
  }

  /** 翌日が指定の節気かどうか（四離＝二分二至の前日、四絕＝四立の前日） */
  function dayBeforeTerm(p, names) {
    const next = addDays(p, 1);
    const key = iso(next);
    const terms = termsOf(next.y);
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].date === key && names.indexOf(terms[i].name) >= 0) return terms[i].name;
    }
    return null;
  }

  function describeDay(date, options) {
    const opt = options || {};
    const p = parseISO(date);
    const key = iso(p);
    const setsu = setsuOnOrBefore(p);
    const monthBranch = setsu.branch;
    const day = kanshiFromIndex(dayIndex(p));
    const yearInfo = yearIndexFor(p, "after");
    const year = kanshiFromIndex(yearInfo.index);
    const month = kanshiFromIndex(monthIndex(yearInfo.index, monthBranch));
    const lunar = lunarOf(p);
    const roku = lunar ? rules.ROKUYO[(lunar.month + lunar.day) % 6] : null;
    const direct = rules.DIRECTS[mod(day.branch - monthBranch, 12)];
    const mi = mansionIndex(p);
    const doyou = doyouCovering(p);
    const enters = [];
    const todayTerms = termsOf(p.y);
    for (let i = 0; i < todayTerms.length; i++) {
      if (todayTerms[i].date === key && todayTerms[i].kind !== "doyou") enters.push(todayTerms[i]);
    }
    const siLi = dayBeforeTerm(p, ["春分", "夏至", "秋分", "冬至"]);
    const siJue = dayBeforeTerm(p, ["立春", "立夏", "立秋", "立冬"]);
    const alm = almanac.compute({
      stem: day.stem, branch: day.branch, index: day.index, monthBranch: monthBranch,
      direct: direct.name, doyou: !!doyou, siLi: !!siLi, siJue: !!siJue
    });
    const birth = birthPillars(opt.birth);
    const clash = { year: false, day: false };
    if (birth) {
      clash.year = rules.CLASH[birth.year.branch] === day.branch;
      clash.day = rules.CLASH[birth.day.branch] === day.branch;
    }
    return {
      date: key, y: p.y, m: p.m, d: p.d,
      weekday: weekday(p),
      day: day, year: year, month: month,
      monthBranch: monthBranch,
      monthName: rules.MONTH_NAME[monthBranch],
      setsuName: setsu.name,
      direct: direct,
      mansion: { name: rules.MANSIONS[mi], yomi: rules.MANSION_YOMI[mi] },
      rokuyo: roku,
      lunar: lunar,
      lunarText: lunar ? "旧暦" + (lunar.leap ? "閏" : "") + lunar.month + "月" + lunar.day + "日" : "",
      doyou: doyou ? { season: doyou.season, start: doyou.start, end: doyou.end } : null,
      yi: alm.yi, ji: alm.ji, jiSources: alm.jiSources,
      buqu: alm.buqu, buquReasons: alm.buquReasons,
      tongYi: alm.tongYi, tongJi: alm.tongJi, tongFew: alm.tongFew, congquan: alm.congquan,
      xianYi: alm.xianYi, xianBuqu: alm.xianBuqu,
      xiejiYi: alm.xiejiYi, xiejiBuqu: alm.xiejiBuqu, xiejiAllJi: alm.xiejiAllJi,
      xiejiAll: alm.xiejiAll, xiejiJi: alm.xiejiJi, xiejiRules: alm.xiejiRules,
      goodGods: alm.goodGods, badGods: alm.badGods,
      huanghei: alm.huanghei,
      chong: alm.clash, shaDir: alm.shaDir,
      clash: clash, birth: birth,
      enters: enters.map(function (t) { return { name: t.name, hh: t.hh, mm: t.mm, kind: t.kind }; })
    };
  }

  function eachDate(start, end, fn) {
    let cursor = parseISO(start);
    const last = parseISO(end);
    const out = [];
    while (cmp(cursor, last) <= 0) {
      out.push(fn(cursor));
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  /** 期間内で、用途の事目が通宜に入り、忌でも不取でもない日を選ぶ（協紀不取の日は印を付けて残す。opt.excludeXiejiBuqu で外す） */
  function pickRange(start, end, options) {
    const opt = options || {};
    const s = parseISO(start);
    const e = parseISO(end);
    ensureLunar(s.y);
    ensureLunar(e.y);
    const purpose = purposeById(opt.purpose);
    const days = eachDate(s, e, function (d) {
      const day = describeDay(d, opt);
      let verdict = almanac.judge(day, purpose, { excludeXiejiBuqu: !!opt.excludeXiejiBuqu });
      if (verdict.ok && opt.excludeClash && (day.clash.year || day.clash.day)) {
        verdict = { ok: false, why: "生まれ年・生まれ日と沖" };
      }
      day.verdict = verdict;
      return day;
    });
    return { days: days, picked: days.filter(function (d) { return d.verdict.ok; }), purpose: purpose };
  }

  return {
    parseISO: parseISO,
    iso: iso,
    addDays: addDays,
    cmp: cmp,
    weekday: weekday,
    dayIndex: dayIndex,
    mansionIndex: mansionIndex,
    kanshiFromIndex: kanshiFromIndex,
    describeDay: describeDay,
    pickRange: pickRange,
    lunarOf: lunarOf,
    buildLunar: buildLunar,
    eventsOfYear: astro.eventsOfYear,
    purposeById: purposeById,
    rules: rules,
    almanac: almanac
  };
});
