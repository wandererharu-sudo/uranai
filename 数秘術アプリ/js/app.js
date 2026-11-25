/* 画面の動き（入力はどこにも送らず、保存もしない） */
(function () {
  'use strict';
  var S = window.SUUHI, T = window.SUUHI_TEXTS;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function srcHTML(a) { return a && a.length ? '<span class="src">（' + esc(a.join('・')) + '）</span>' : ''; }
  function tipsHTML(list) { return '<ul class="tips">' + list.map(function (x) { return '<li>' + (x.h ? '<b>' + esc(x.h) + '</b>：' : '') + esc(x.t) + srcHTML(x.src) + '</li>'; }).join('') + '</ul>'; }

  // 入力欄
  var now = new Date();
  (function fill() {
    var y = $('by'), m = $('bm');
    y.innerHTML = '<option value="">年</option>';
    for (var i = now.getFullYear(); i >= 1900; i--) y.innerHTML += '<option value="' + i + '">' + i + '年</option>';
    m.innerHTML = '<option value="">月</option>';
    for (var j = 1; j <= 12; j++) m.innerHTML += '<option value="' + j + '">' + j + '月</option>';
    fillDays();
  })();
  function fillDays() {
    var d = $('bd'), keep = d.value, y = +$('by').value || 2000, m = +$('bm').value || 1;
    var max = new Date(y, m, 0).getDate();
    d.innerHTML = '<option value="">日</option>';
    for (var k = 1; k <= max; k++) d.innerHTML += '<option value="' + k + '">' + k + '日</option>';
    if (keep && +keep <= max) d.value = keep;
  }
  $('by').onchange = fillDays; $('bm').onchange = fillDays;

  function radios(fs, name, obj, def) {
    Object.keys(obj).forEach(function (k) {
      var l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = '<input type="radio" name="' + name + '" value="' + k + '"' + (k === def ? ' checked' : '') + '><span>' + esc(obj[k].label) + '<small>' + esc(obj[k].who) + '</small></span>';
      $(fs).appendChild(l);
    });
  }
  radios('f-master', 'master', S.MASTER_MODES, 'm33');
  radios('f-method', 'method', S.LP_METHODS, 'all');
  radios('f-py', 'py', S.PY_SWITCH, 'jan1');
  function val(name) { var e = document.querySelector('input[name="' + name + '"]:checked'); return e ? e.value : null; }

  function numCard(pos, r, extra, main) {
    var P = T.POSITIONS[pos], sub = pos === 'lifePath' && r.method === 'split' ? '年・月・日を別々に1桁にしてから' : P.sub, meaning = T.NUMBERS[r.value] || T.NUMBERS[r.root];
    var h = '<div class="num' + (main ? ' main' : '') + '"><div class="hd"><div class="v' + (r.master ? ' m' : '') + '">' + esc(S.show(r)) + '</div>' +
      '<div class="t"><b>' + esc(P.name) + '</b><span>' + esc(sub) + '</span></div></div>';
    h += '<p>' + esc(P.what) + srcHTML(P.src) + '</p>';
    h += '<span class="k">' + esc(meaning.key) + '</span><p>' + esc(meaning.text) + srcHTML(meaning.src) + '</p>';
    if (r.master && !T.NUMBERS[r.value]) h += '<p class="note">' + esc(T.BIG_MASTER_NOTE) + '</p>';
    if (r.master && T.NUMBERS[r.value]) h += '<p class="note">1桁にすると ' + r.root + '（' + esc(T.NUMBERS[r.root].key) + '）。両方の面をあわせ持つと読みます。</p>';
    if (extra) h += extra;
    h += '<div class="calc">計算：' + esc(r.formula) + '</div></div>';
    return h;
  }

  function show() {
    var err = $('err'); err.classList.add('hidden');
    var y = $('by').value, m = $('bm').value, d = $('bd').value;
    var date = S.parseDate(y + '-' + m + '-' + d);
    if (!date) { err.textContent = '生年月日（年・月・日）を選んでください。'; err.classList.remove('hidden'); return; }
    var nameRaw = $('nm').value.trim(), nn = null;
    var mode = val('master'), method = val('method'), sw = val('py');
    if (nameRaw) {
      nn = S.nameNumbers(nameRaw, mode);
      if (!nn) { err.textContent = '名前はローマ字（A〜Z）で入れてください。例：TARO YAMADA'; err.classList.remove('hidden'); return; }
    }
    var lp = S.lifePath(date, { master: mode, method: method });
    var other = S.lifePath(date, { master: mode, method: method === 'all' ? 'split' : 'all' });
    var today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    var py = S.personalYear(date, today, sw);
    var next = S.personalYear(date, { y: py.year + 1, m: date.m, d: date.d }, 'jan1');

    var h = '<h2>結果</h2><div class="who">生年月日：' + date.y + '年' + date.m + '月' + date.d + '日' + (nn ? '<br>名前：' + esc(S.normalizeName(nameRaw).replace(/\s+/g, ' ')) : '') + '</div>';

    var ex = '';
    if (other.value !== lp.value) ex = '<p class="note">参考：' + esc(S.LP_METHODS[other.method].label) + '方法だと ' + esc(S.show(other)) + ' になります（足し方で数が変わることがあります）。</p>';
    h += numCard('lifePath', lp, ex, true);
    if (lp.master) h += tipsHTML(T.MASTER_NOTE);

    // 今年
    h += '<h3>今年のテーマ（個人年数）</h3><div class="num"><div class="hd"><div class="v">' + py.value + '</div><div class="t"><b>' + (sw === 'birthday' ? py.year + '年の誕生日から1年間' : py.year + '年') + '</b><span>9年でひとめぐりする流れの ' + py.value + ' 年目</span></div></div>' +
      '<div class="year">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<span' + (i === py.value ? ' class="on"' : '') + '>' + i + '</span>'; }).join('') + '</div>' +
      '<p>' + esc(T.YEARS[py.value]) + '</p><p class="note">次の年は ' + next.value + '：' + esc(T.YEARS[next.value]) + '</p>' +
      '<p class="note">年のテーマは、数の意味と9年の流れ（下の見方）から自分の言葉でまとめたものです。</p>' +
      '<div class="calc">計算：' + esc(py.formula) + '（' + esc(S.PY_SWITCH[sw].label) + '）</div></div>';
    h += tipsHTML(T.CYCLE_NOTE);

    // 名前
    if (nn) {
      h += '<h3>名前の数</h3>';
      h += numCard('destiny', nn.destiny);
      if (nn.soul) h += numCard('soul', nn.soul);
      if (nn.personality) h += numCard('personality', nn.personality);
      h += '<p class="note">文字の数え方：A・J・S＝1、B・K・T＝2、C・L・U＝3、D・M・V＝4、E・N・W＝5、F・O・X＝6、G・P・Y＝7、H・Q・Z＝8、I・R＝9（伊泉龍一さんの表）。母音はA・I・U・E・O。名前の呼び方も伊泉さんの説明によります。</p>';
      h += tipsHTML(T.NAME_NOTE);
    } else {
      h += '<p class="note">名前のローマ字を入れると、名前の数（全部の文字・母音・子音）も出ます。</p>';
    }

    h += '<h3>5人に共通する見方</h3>' + tipsHTML(T.COMMON);
    h += '<div class="method">計算のしかた：' + esc(S.MASTER_MODES[mode].label) + '（' + esc(S.MASTER_MODES[mode].who) + '）／' + esc(S.LP_METHODS[method].label) + '／今年の数は' + esc(S.PY_SWITCH[sw].label) + '。<br>名前は発信者の敬称略。数秘術は傾向の参考で、決めるのはご自身です。</div>';
    h += '<div class="actions"><button type="button" class="pri" id="btn-save">HTMLで保存</button><button type="button" id="btn-print">印刷</button><button type="button" id="btn-again">入れ直す</button></div>';

    var sec = $('sec-result'); sec.innerHTML = h; sec.classList.remove('hidden');
    $('btn-save').onclick = saveHTML;
    $('btn-print').onclick = function () { window.print(); };
    $('btn-again').onclick = function () { $('sec-in').scrollIntoView({ behavior: 'smooth' }); };
    setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }
  $('btn-go').onclick = show;

  function saveHTML() {
    var css = $('suuhi-css').textContent;
    var body = $('sec-result').cloneNode(true);
    var act = body.querySelector('.actions'); if (act) act.remove();
    var d = new Date(), z = function (x) { return ('0' + x).slice(-2); };
    var src = T.SOURCES.map(function (s) { return s.n + '（' + s.s + '）'; }).join('・');
    var html = '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>数秘術の結果 ' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日</title><style>' + css + '</style></head><body><main>' +
      '<section class="card">' + body.innerHTML + '</section><p class="foot">見方の出典：' + esc(src) + 'の公開されている発信のうち、2人以上に共通する点（敬称略）</p></main></body></html>';
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'suuhi-' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + '.html';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  window.__suuhi = { show: show };
})();
