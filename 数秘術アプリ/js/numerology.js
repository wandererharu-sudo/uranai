/* 数秘術の計算（ブラウザと node の両方で使う。外へは何も送らない） */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SUUHI = factory();
})(this, function () {
  'use strict';

  // マスター数をどこまで残すか
  var MASTER_MODES = {
    m33: { label: '11・22・33 まで', who: '標準。伊泉龍一・橙花・秦由佳・はづき虹映に共通', list: [11, 22, 33] },
    m44: { label: '44 も残す', who: '伊泉龍一さんが44も例に挙げている（橙花さん・岡田歩さんも44に触れる）', list: [11, 22, 33, 44] },
    m99: { label: '11〜99 のぞろ目をすべて残す', who: '岡田歩さん（トリニティ数秘術）', list: [11, 22, 33, 44, 55, 66, 77, 88, 99] }
  };
  // ライフパスの足し方
  var LP_METHODS = {
    all: { label: '全部の数字を1つずつ足す', who: '標準。伊泉龍一さんの説明。橙花・秦由佳・はづき虹映も同じ' },
    split: { label: '年・月・日を別々に1桁にしてから足す', who: '伊泉龍一さんが「両方試す人もいる」と紹介している足し方' }
  };
  // 個人年数の切りかえ
  var PY_SWITCH = {
    jan1: { label: '1月1日で切りかえ', who: 'はづき虹映さんの計算（今年＋生まれ月日）' },
    birthday: { label: '誕生日で切りかえ', who: '橙花さん（バイオリズムは誕生日で切りかわる）' }
  };

  function digitSum(n) {
    var s = 0; String(Math.abs(n)).split('').forEach(function (c) { s += +c; }); return s;
  }
  function masterList(mode) { return (MASTER_MODES[mode] || MASTER_MODES.m33).list; }
  // 1桁かマスター数になるまで足す。steps に途中の数を残す
  function reduce(n, mode) {
    var keep = mode === 'none' ? [] : masterList(mode);
    var steps = [n];
    while (n > 9 && keep.indexOf(n) < 0) { n = digitSum(n); steps.push(n); }
    var root1 = n; while (root1 > 9) root1 = digitSum(root1);
    return { value: n, root: root1, master: n > 9, steps: steps };
  }
  function digitsOf(s) { return String(s).split('').map(Number); }

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysIn(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // "YYYY-MM-DD" を確かめる
  function parseDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo)) return null;
    return { y: y, m: mo, d: d };
  }

  function lifePath(date, opt) {
    opt = opt || {};
    var mode = opt.master || 'm33', method = opt.method || 'all';
    if (method === 'split') {
      var parts = [date.y, date.m, date.d].map(function (p) { return reduce(p, 'none'); });
      var total = parts[0].value + parts[1].value + parts[2].value;
      var r = reduce(total, mode);
      r.formula = '年 ' + date.y + '→' + parts[0].steps.slice(1).join('→') + '、月 ' + date.m + (parts[1].steps.length > 1 ? '→' + parts[1].steps.slice(1).join('→') : '') +
        '、日 ' + date.d + (parts[2].steps.length > 1 ? '→' + parts[2].steps.slice(1).join('→') : '') +
        '。' + parts.map(function (p) { return p.value; }).join('+') + '=' + total + (r.steps.length > 1 ? '→' + r.steps.slice(1).join('→') : '');
      r.method = 'split';
      return r;
    }
    var ds = digitsOf(String(date.y) + String(date.m) + String(date.d));
    var sum = ds.reduce(function (a, b) { return a + b; }, 0);
    var res = reduce(sum, mode);
    res.formula = ds.join('+') + '=' + sum + (res.steps.length > 1 ? '→' + res.steps.slice(1).join('→') : '');
    res.method = 'all';
    return res;
  }

  // 個人年数（1〜9）。today は {y,m,d}
  function personalYear(date, today, sw) {
    var year = today.y;
    if (sw === 'birthday') {
      if (today.m < date.m || (today.m === date.m && today.d < date.d)) year = today.y - 1;
    }
    var ds = digitsOf(String(year) + String(date.m) + String(date.d));
    var sum = ds.reduce(function (a, b) { return a + b; }, 0);
    var r = reduce(sum, 'none');
    return { value: r.value, year: year, formula: ds.join('+') + '=' + sum + (r.steps.length > 1 ? '→' + r.steps.slice(1).join('→') : '') };
  }

  // ピタゴラス式（伊泉龍一さんの表）A・J・S＝1 …
  var TABLE = {};
  ['AJS', 'BKT', 'CLU', 'DMV', 'ENW', 'FOX', 'GPY', 'HQZ', 'IR'].forEach(function (g, i) {
    g.split('').forEach(function (c) { TABLE[c] = i + 1; });
  });
  var VOWELS = 'AEIOU';
  function normalizeName(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return s.toUpperCase();
  }
  // 戻り値 null＝ローマ字以外の文字がある
  function nameNumbers(name, mode) {
    var n = normalizeName(name);
    if (/[^A-Z\s\-'.・]/.test(n)) return null;
    var letters = n.replace(/[^A-Z]/g, '').split('');
    if (!letters.length) return null;
    var all = 0, v = 0, c = 0, vl = [], cl = [];
    letters.forEach(function (ch) {
      var x = TABLE[ch]; all += x;
      if (VOWELS.indexOf(ch) >= 0) { v += x; vl.push(ch + x); } else { c += x; cl.push(ch + x); }
    });
    function pack(sum, list) {
      var r = reduce(sum, mode); r.sum = sum; r.letters = list;
      r.formula = sum === 0 ? '0' : list.map(function (t) { return t.replace(/[A-Z]/g, ''); }).join('+') + '=' + sum + (r.steps.length > 1 ? '→' + r.steps.slice(1).join('→') : '');
      return r;
    }
    return {
      letters: letters.join(''),
      destiny: pack(all, letters.map(function (ch) { return ch + TABLE[ch]; })),
      soul: v ? pack(v, vl) : null,
      personality: c ? pack(c, cl) : null
    };
  }

  // 表記：マスター数は「6/33」
  function show(r) { return r.master ? r.root + '/' + r.value : String(r.value); }

  return {
    MASTER_MODES: MASTER_MODES, LP_METHODS: LP_METHODS, PY_SWITCH: PY_SWITCH, TABLE: TABLE,
    digitSum: digitSum, reduce: reduce, parseDate: parseDate, lifePath: lifePath,
    personalYear: personalYear, nameNumbers: nameNumbers, normalizeName: normalizeName, show: show
  };
});
