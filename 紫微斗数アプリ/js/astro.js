/**
 * 太陽・月の視黄経と、節入り・朔の時刻。
 *
 * 太陽: VSOP87D（黄道・分点は日付のもの）を、2025–2035年で寄与が
 *       約 3e-6 rad を下回る項を落とした短縮級数。
 *       地心黄経 = 地球の日心黄経 + 180°。
 *       視黄経には章動（Meeus 近似、Δψ で約 0.5″）と光行差
 *       （−20.4898″ / 距離）を足す。章動・光行差の式は
 *       Jean Meeus, Astronomical Algorithms, ch.22 / ch.25。
 * 月:   Meeus 第47章の月黄経（平均分点、表47.A の経度項と追加の3項）。
 *       視黄経には同じ章動を足す。朔は「月と太陽の視黄経の差が 0°」
 *       （国立天文台暦要項の定義）。
 * 時刻: 力学時 TT。ΔT = TT − UTC は 2026年付近の 69秒
 *       （暦象年表 令和8年の ΔT＝69s）に固定。日本標準時は UTC+9。
 *       暦要項の分単位との差は、この短縮級数でおおむね ±2分以内。
 *       日付が深夜0時前後で裏返らないことは test/calendar.test.js で確認する。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TakujitsuAstro = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEG = Math.PI / 180;
  const J2000 = 2451545.0;
  const EARTH = {"L":{"0":[[1.75347045673,0,0],[0.03341656456,4.66925680417,6283.0758499914],[0.00034894275,4.62610241759,12566.1516999828],[0.00003417571,2.82886579606,3.523118349],[0.00003497056,2.74411800971,5753.3848848968],[0.00003135896,3.62767041758,77713.7714681205],[0.00002676218,4.41808351397,7860.4193924392],[0.00002342687,6.13516237631,3930.2096962196],[0.00001273166,2.03709655772,529.6909650946],[0.00001324292,0.74246356352,11506.7697697936],[0.00000901855,2.04505443513,26.2983197998],[0.00001199167,1.10962944315,1577.3435424478],[0.00000857223,3.50849156957,398.1490034082],[0.00000779786,1.17882652114,5223.6939198022],[0.0000099025,5.23268129594,5884.9268465832],[0.00000753141,2.53339053818,5507.5532386674],[0.00000505264,4.58292563052,18849.2275499742],[0.00000492379,4.20506639861,775.522611324],[0.00000356655,2.91954116867,0.0673103028],[0.00000317087,5.84901952218,11790.6290886588]],"1":[[6283.31966747491,0,0],[0.00206058863,2.67823455584,6283.0758499914],[0.0000430343,2.63512650414,12566.1516999828]],"2":[[0.0005291887,0,0],[0.00008719837,1.07209665242,6283.0758499914]]},"R":{"0":[[1.00013988799,0,0],[0.01670699626,3.09846350771,6283.0758499914],[0.00013956023,3.0552460962,12566.1516999828],[0.0000308372,5.19846674381,77713.7714681205],[0.00001628461,1.17387749012,5753.3848848968],[0.00001575568,2.84685245825,7860.4193924392],[0.00000924799,5.45292234084,11506.7697697936],[0.00000542444,4.56409149777,3930.2096962196],[0.0000047211,3.66100022149,5884.9268465832],[0.0000032878,5.89983646482,5223.6939198022],[0.00000345983,0.96368617687,5507.5532386674],[0.00000306784,0.29867139512,5573.1428014331]],"1":[[0.00103018608,1.10748969588,6283.0758499914],[0.00001721238,1.06442301418,12566.1516999828]],"2":[[0.00004359385,5.78455133738,6283.0758499914]]}};
  const MOON_L = [[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294],[2,0,-1,-2,0]];

  const SETSU = [
    { lon: 315, branch: 2, name: "立春", monthNo: 1 },
    { lon: 345, branch: 3, name: "啓蟄", monthNo: 2 },
    { lon: 15, branch: 4, name: "清明", monthNo: 3 },
    { lon: 45, branch: 5, name: "立夏", monthNo: 4 },
    { lon: 75, branch: 6, name: "芒種", monthNo: 5 },
    { lon: 105, branch: 7, name: "小暑", monthNo: 6 },
    { lon: 135, branch: 8, name: "立秋", monthNo: 7 },
    { lon: 165, branch: 9, name: "白露", monthNo: 8 },
    { lon: 195, branch: 10, name: "寒露", monthNo: 9 },
    { lon: 225, branch: 11, name: "立冬", monthNo: 10 },
    { lon: 255, branch: 0, name: "大雪", monthNo: 11 },
    { lon: 285, branch: 1, name: "小寒", monthNo: 12 }
  ];

  const CHUKI = [
    { lon: 270, name: "冬至" },
    { lon: 300, name: "大寒" },
    { lon: 330, name: "雨水" },
    { lon: 0, name: "春分" },
    { lon: 30, name: "穀雨" },
    { lon: 60, name: "小満" },
    { lon: 90, name: "夏至" },
    { lon: 120, name: "大暑" },
    { lon: 150, name: "処暑" },
    { lon: 180, name: "秋分" },
    { lon: 210, name: "霜降" },
    { lon: 240, name: "小雪" }
  ];

  const DOYO = [
    { lon: 297, endName: "立春", season: "冬", id: "winter" },
    { lon: 27, endName: "立夏", season: "春", id: "spring" },
    { lon: 117, endName: "立秋", season: "夏", id: "summer" },
    { lon: 207, endName: "立冬", season: "秋", id: "autumn" }
  ];

  const TERM_GUESS = {
    285: [1, 5], 300: [1, 20], 315: [2, 4], 330: [2, 19],
    345: [3, 6], 0: [3, 21], 15: [4, 5], 30: [4, 20],
    45: [5, 6], 60: [5, 21], 75: [6, 6], 90: [6, 21],
    105: [7, 7], 120: [7, 23], 135: [8, 7], 150: [8, 23],
    165: [9, 8], 180: [9, 23], 195: [10, 8], 210: [10, 23],
    225: [11, 7], 240: [11, 22], 255: [12, 7], 270: [12, 22],
    297: [1, 17], 27: [4, 17], 117: [7, 20], 207: [10, 20]
  };

  function deltaTSeconds() {
    return 69;
  }

  function horner(x, coeffs) {
    let y = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) y = y * x + coeffs[i];
    return y;
  }

  function normDeg(x) {
    const d = x % 360;
    return d < 0 ? d + 360 : d;
  }

  function angDiff(target, value) {
    let d = target - value;
    d = ((d + 540) % 360) - 180;
    return d;
  }

  function sumSeries(series, tau) {
    let total = 0;
    const powers = Object.keys(series);
    for (let i = 0; i < powers.length; i++) {
      const p = Number(powers[i]);
      const terms = series[powers[i]];
      let s = 0;
      for (let k = 0; k < terms.length; k++) {
        const a = terms[k][0], b = terms[k][1], c = terms[k][2];
        s += a * Math.cos(b + c * tau);
      }
      total += s * Math.pow(tau, p);
    }
    return total;
  }

  function nutationLongitudeDeg(jde) {
    const T = (jde - J2000) / 36525;
    const omega = (125.04452 - 1934.136261 * T) * DEG;
    const L = (280.4665 + 36000.7698 * T) * DEG;
    const Lp = (218.3165 + 481267.8813 * T) * DEG;
    const arcsec = -17.2 * Math.sin(omega)
      - 1.32 * Math.sin(2 * L)
      - 0.23 * Math.sin(2 * Lp)
      + 0.21 * Math.sin(2 * omega);
    return arcsec / 3600;
  }

  function sunApparentDeg(jde) {
    const T = (jde - J2000) / 36525;
    const tau = T * 0.1;
    const lon = sumSeries(EARTH.L, tau);
    const range = sumSeries(EARTH.R, tau);
    const aber = -20.4898 / 3600 / range;
    return normDeg(lon * 180 / Math.PI + 180 + nutationLongitudeDeg(jde) + aber);
  }

  function moonApparentDeg(jde) {
    const T = (jde - J2000) / 36525;
    const l_ = horner(T, [218.3164477, 481267.88123421, -0.0015786, 1 / 538841, -1 / 65194000]) * DEG;
    const d = horner(T, [297.8501921, 445267.1114034, -0.0018819, 1 / 545868, -1 / 113065000]) * DEG;
    const m = horner(T, [357.5291092, 35999.0502909, -0.0001536, 1 / 24490000]) * DEG;
    const mp = horner(T, [134.9633964, 477198.8675055, 0.0087414, 1 / 69699, -1 / 14712000]) * DEG;
    const f = horner(T, [93.272095, 483202.0175233, -0.0036539, -1 / 3526000, 1 / 863310000]) * DEG;
    const a1 = (119.75 + 131.849 * T) * DEG;
    const a2 = (53.09 + 479264.29 * T) * DEG;
    const e = horner(T, [1, -0.002516, -0.0000074]);
    let sumL = 3958 * Math.sin(a1) + 1962 * Math.sin(l_ - f) + 318 * Math.sin(a2);
    for (let i = 0; i < MOON_L.length; i++) {
      const D = MOON_L[i][0], M = MOON_L[i][1], Mp = MOON_L[i][2], F = MOON_L[i][3], sl = MOON_L[i][4];
      if (!sl) continue;
      let ee = 1;
      const am = M < 0 ? -M : M;
      if (am === 1) ee = e;
      else if (am === 2) ee = e * e;
      sumL += sl * Math.sin(d * D + m * M + mp * Mp + f * F) * ee;
    }
    const lon = l_ + sumL * 1e-6 * DEG;
    return normDeg(lon * 180 / Math.PI + nutationLongitudeDeg(jde));
  }

  function jdeFromJst(y, m, d, hh, mm) {
    const utc = Date.UTC(y, m - 1, d, (hh || 0) - 9, mm || 0, 0);
    return utc / 86400000 + 2440587.5 + deltaTSeconds() / 86400;
  }

  function jstFromJde(jde) {
    const utcMs = (jde - 2440587.5) * 86400000 - deltaTSeconds() * 1000;
    const jst = new Date(utcMs + 9 * 3600000);
    return {
      y: jst.getUTCFullYear(),
      m: jst.getUTCMonth() + 1,
      d: jst.getUTCDate(),
      hh: jst.getUTCHours(),
      mm: jst.getUTCMinutes(),
      ss: jst.getUTCSeconds()
    };
  }

  function iso(p) {
    const z = (n) => (n < 10 ? "0" : "") + n;
    return p.y + "-" + z(p.m) + "-" + z(p.d);
  }

  function findSun(year, targetLon) {
    const g = TERM_GUESS[targetLon];
    let jde = jdeFromJst(year, g[0], g[1], 12, 0);
    for (let i = 0; i < 16; i++) {
      jde += angDiff(targetLon, sunApparentDeg(jde)) / 0.98564736;
    }
    return jde;
  }

  function findNewMoon(guessJde) {
    let jde = guessJde;
    for (let i = 0; i < 12; i++) {
      let diff = moonApparentDeg(jde) - sunApparentDeg(jde);
      diff = ((diff % 360) + 360) % 360;
      if (diff > 180) diff -= 360;
      jde -= diff / 12.190749;
    }
    return jde;
  }

  const yearCache = new Map();

  function eventsOfYear(year) {
    if (yearCache.has(year)) return yearCache.get(year);
    const terms = [];
    function push(kind, meta, lon) {
      const jde = findSun(year, lon);
      const p = jstFromJde(jde);
      terms.push(Object.assign({ kind: kind, lon: lon, jde: jde, date: iso(p) }, meta, p));
    }
    for (let i = 0; i < SETSU.length; i++) push("setsu", SETSU[i], SETSU[i].lon);
    for (let i = 0; i < CHUKI.length; i++) push("chuki", CHUKI[i], CHUKI[i].lon);
    for (let i = 0; i < DOYO.length; i++) push("doyou", DOYO[i], DOYO[i].lon);
    terms.sort((a, b) => a.jde - b.jde);
    const moons = [];
    let guess = findNewMoon(jdeFromJst(year, 1, 1, 0, 0) - 40);
    const limit = jdeFromJst(year, 12, 31, 0, 0) + 45;
    let guard = 0;
    while (guess < limit && guard < 20) {
      const jde = findNewMoon(guess);
      const p = jstFromJde(jde);
      const date = iso(p);
      if (!moons.length || moons[moons.length - 1].date !== date) {
        moons.push(Object.assign({ jde: jde, date: date }, p));
      }
      guess = jde + 29.53058867;
      guard++;
    }
    const pack = { year: year, terms: terms, moons: moons };
    yearCache.set(year, pack);
    return pack;
  }

  function gregorianJdn(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
      + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  return {
    SETSU: SETSU,
    CHUKI: CHUKI,
    DOYO: DOYO,
    deltaTSeconds: deltaTSeconds,
    sunApparentDeg: sunApparentDeg,
    moonApparentDeg: moonApparentDeg,
    jdeFromJst: jdeFromJst,
    jstFromJde: jstFromJde,
    eventsOfYear: eventsOfYear,
    gregorianJdn: gregorianJdn,
    iso: iso
  };
});
