/* 易（周易）の計算：三枚銭法・本卦/之卦・互卦/錯卦/綜卦・朱熹『易学啓蒙』の読み方 */
(function (root) {
  'use strict';
  // 八卦：爻は下から上へ（1=陽, 0=陰）
  var TRIGRAMS = [
    { key: '乾', sym: '☰', nature: '天', yomi: 'けん', lines: [1, 1, 1] },
    { key: '兌', sym: '☱', nature: '沢', yomi: 'だ', lines: [1, 1, 0] },
    { key: '離', sym: '☲', nature: '火', yomi: 'り', lines: [1, 0, 1] },
    { key: '震', sym: '☳', nature: '雷', yomi: 'しん', lines: [1, 0, 0] },
    { key: '巽', sym: '☴', nature: '風', yomi: 'そん', lines: [0, 1, 1] },
    { key: '坎', sym: '☵', nature: '水', yomi: 'かん', lines: [0, 1, 0] },
    { key: '艮', sym: '☶', nature: '山', yomi: 'ごん', lines: [0, 0, 1] },
    { key: '坤', sym: '☷', nature: '地', yomi: 'こん', lines: [0, 0, 0] }
  ];
  // 文王序（通行本の卦序）：KW[下卦][上卦]、八卦の並びは上の TRIGRAMS と同じ
  var KW = [
    [1, 43, 14, 34, 9, 5, 26, 11],
    [10, 58, 38, 54, 61, 60, 41, 19],
    [13, 49, 30, 55, 37, 63, 22, 36],
    [25, 17, 21, 51, 42, 3, 27, 24],
    [44, 28, 50, 32, 57, 48, 18, 46],
    [6, 47, 64, 40, 59, 29, 4, 7],
    [33, 31, 56, 62, 53, 39, 52, 15],
    [12, 45, 35, 16, 20, 8, 23, 2]
  ];
  function trigramIndex(l3) {
    for (var i = 0; i < 8; i++) {
      var t = TRIGRAMS[i].lines;
      if (t[0] === l3[0] && t[1] === l3[1] && t[2] === l3[2]) return i;
    }
    throw new Error('bad trigram');
  }
  // lines: 長さ6、[初爻..上爻]、1=陽 0=陰
  function hexNumber(lines) {
    return KW[trigramIndex(lines.slice(0, 3))][trigramIndex(lines.slice(3, 6))];
  }
  var LINES_BY_NUM = {};
  for (var lo = 0; lo < 8; lo++) for (var up = 0; up < 8; up++) {
    LINES_BY_NUM[KW[lo][up]] = TRIGRAMS[lo].lines.concat(TRIGRAMS[up].lines);
  }
  function linesOf(n) { return LINES_BY_NUM[n].slice(); }
  function hexInfo(n) {
    var l = linesOf(n);
    var lower = TRIGRAMS[trigramIndex(l.slice(0, 3))], upper = TRIGRAMS[trigramIndex(l.slice(3))];
    return { n: n, lines: l, lower: lower, upper: upper, glyph: String.fromCharCode(0x4DC0 + n - 1) };
  }
  // 卦の正式な呼び名（例：水雷屯、乾為天）
  function fullName(n, name) {
    var h = hexInfo(n);
    if (h.lower.key === h.upper.key) return name + '為' + h.upper.nature;
    return h.upper.nature + h.lower.nature + name;
  }
  // 三枚銭法：表=3・裏=2。表の枚数 → 6,7,8,9
  function valueFromHeads(heads) {
    if (heads < 0 || heads > 3 || heads !== Math.floor(heads)) throw new Error('heads 0..3');
    return heads * 3 + (3 - heads) * 2;
  }
  var VALUE_INFO = {
    6: { name: '老陰', yin: true, moving: true, mark: '×' },
    7: { name: '少陽', yin: false, moving: false, mark: '' },
    8: { name: '少陰', yin: true, moving: false, mark: '' },
    9: { name: '老陽', yin: false, moving: true, mark: '○' }
  };
  function isYang(v) { return v === 7 || v === 9; }
  function isMoving(v) { return v === 6 || v === 9; }
  // values: [初爻..上爻] の 6/7/8/9
  function cast(values) {
    if (!values || values.length !== 6) throw new Error('6 values');
    var prim = values.map(function (v) { return isYang(v) ? 1 : 0; });
    var rel = values.map(function (v) { return v === 9 ? 0 : v === 6 ? 1 : (isYang(v) ? 1 : 0); });
    var moving = [];
    values.forEach(function (v, i) { if (isMoving(v)) moving.push(i); });
    var p = hexNumber(prim);
    var r = moving.length ? hexNumber(rel) : null;
    return { values: values.slice(), primary: p, relating: r, moving: moving };
  }
  function nuclear(n) { var l = linesOf(n); return hexNumber(l.slice(1, 4).concat(l.slice(2, 5))); }
  function opposite(n) { return hexNumber(linesOf(n).map(function (x) { return 1 - x; })); }
  function inverse(n) { return hexNumber(linesOf(n).reverse()); }
  var POS = ['初', '二', '三', '四', '五', '上'];
  function lineLabel(n, i) {
    var yang = linesOf(n)[i] === 1, d = yang ? '九' : '六';
    if (i === 0) return '初' + d;
    if (i === 5) return '上' + d;
    return d + POS[i];
  }
  // 朱熹『易学啓蒙』考変占の決まり。
  // 戻り値 readings: [{hex, kind:'judg'|'line'|'use', line, main:true/false}]
  function zhuxi(c) {
    var m = c.moving, k = m.length, P = c.primary, R = c.relating;
    var still = [0, 1, 2, 3, 4, 5].filter(function (i) { return m.indexOf(i) < 0; });
    var res = { count: k, rule: '', readings: [] };
    if (k === 0) {
      res.rule = '変爻がないので、本卦の卦辞を読みます。';
      res.readings.push({ hex: P, kind: 'judg', main: true });
    } else if (k === 1) {
      res.rule = '変爻が1本なので、本卦のその爻の爻辞を読みます。';
      res.readings.push({ hex: P, kind: 'line', line: m[0], main: true });
    } else if (k === 2) {
      res.rule = '変爻が2本なので、本卦の2つの爻辞を読み、上の爻を主にします。';
      res.readings.push({ hex: P, kind: 'line', line: m[1], main: true });
      res.readings.push({ hex: P, kind: 'line', line: m[0], main: false });
    } else if (k === 3) {
      res.rule = '変爻が3本なので、本卦と之卦の卦辞を読みます。本卦を主（今のこと）、之卦を従（これから）にします。';
      res.readings.push({ hex: P, kind: 'judg', main: true });
      res.readings.push({ hex: R, kind: 'judg', main: false });
    } else if (k === 4) {
      res.rule = '変爻が4本なので、之卦の動かない2つの爻のうち、下の爻の爻辞を主に読みます（上の爻は従）。';
      res.readings.push({ hex: R, kind: 'line', line: still[0], main: true });
      res.readings.push({ hex: R, kind: 'line', line: still[1], main: false });
    } else if (k === 5) {
      res.rule = '変爻が5本なので、之卦の動かない1つの爻の爻辞を読みます。';
      res.readings.push({ hex: R, kind: 'line', line: still[0], main: true });
    } else {
      if (P === 1 || P === 2) {
        res.rule = '6本すべて変爻で、本卦が' + (P === 1 ? '乾なので「用九」' : '坤なので「用六」') + 'を読みます。';
        res.readings.push({ hex: P, kind: 'use', main: true });
      } else {
        res.rule = '6本すべて変爻なので、之卦の卦辞を読みます。';
        res.readings.push({ hex: R, kind: 'judg', main: true });
      }
    }
    return res;
  }
  // 暗号的乱数でコイン3枚 → 表の枚数
  function tossHeads(rng) {
    var coins = [];
    if (rng) { for (var i = 0; i < 3; i++) coins.push(rng() < 0.5 ? 1 : 0); }
    else {
      var a = new Uint8Array(3);
      (root.crypto || globalThis.crypto).getRandomValues(a);
      for (var j = 0; j < 3; j++) coins.push(a[j] & 1);
    }
    return coins;
  }
  var API = {
    TRIGRAMS: TRIGRAMS, KW: KW, hexNumber: hexNumber, linesOf: linesOf, hexInfo: hexInfo,
    fullName: fullName, valueFromHeads: valueFromHeads, VALUE_INFO: VALUE_INFO, cast: cast,
    nuclear: nuclear, opposite: opposite, inverse: inverse, lineLabel: lineLabel, zhuxi: zhuxi,
    tossHeads: tossHeads, isMoving: isMoving, isYang: isYang
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.EKI = API;
})(typeof window !== 'undefined' ? window : globalThis);
