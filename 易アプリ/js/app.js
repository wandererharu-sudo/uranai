/* 画面の動き */
(function () {
  'use strict';
  var E = window.EKI, T = window.EKI_TEXTS, C = window.EKI_COMMON, AD = window.EKI_ADVICE;
  var HKEY = 'eki-history-v1';
  var POSN = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  var state = { mode: 'real', values: [], coins: [], when: null };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tx(n) { return T[n - 1]; }
  function hexTitle(n) { return tx(n).name; }
  function judgText(n) { var h = tx(n); return h.label ? h.label + '：' + h.judg : h.judg; }
  function fmtDate(d) { var z = function (x) { return ('0' + x).slice(-2); }; return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + z(d.getHours()) + ':' + z(d.getMinutes()); }

  function barHTML(yang, moving) {
    return '<div class="bar' + (moving ? ' mv' : '') + '">' + (yang ? '<i></i>' : '<i></i><i></i>') + '</div>';
  }
  // 入力中の6本
  function renderBuilder(newIdx) {
    var h = '';
    for (var i = 5; i >= 0; i--) {
      var v = state.values[i];
      if (v === undefined) {
        h += '<div class="bline empty"><span>' + POSN[i] + '</span>' + barHTML(true, false) + '<span></span></div>';
      } else {
        var info = E.VALUE_INFO[v];
        h += '<div class="bline' + (i === newIdx ? ' new' : '') + '"><span>' + POSN[i] + '</span>' + barHTML(!info.yin, info.moving) +
          '<span class="bval">' + v + ' ' + info.name + (info.moving ? ' <b>' + info.mark + '</b>' : '') + '</span></div>';
      }
    }
    $('builder').innerHTML = h;
    var k = state.values.length;
    $('progress').textContent = k < 6 ? (k + 1) + '回目（' + POSN[k] + '）' + (k === 0 ? '' : '　あと' + (6 - k) + '回') : '6回そろいました';
    var dis = k >= 6;
    Array.prototype.forEach.call(document.querySelectorAll('#input-real button'), function (b) { b.disabled = dis; });
    $('btn-toss').disabled = dis;
    $('btn-undo').disabled = k === 0;
  }
  function addValue(v) {
    if (state.values.length >= 6) return;
    state.values.push(v);
    renderBuilder(state.values.length - 1);
    if (state.values.length === 6) {
      state.when = new Date();
      var rec = { t: state.when.getTime(), q: $('question').value.trim(), v: state.values.slice(), f: $('field') ? $('field').value : '' };
      saveHistory(rec);
      showResult(rec, true);
    }
  }
  function resetCast() {
    state.values = []; state.when = null;
    $('sec-result').classList.add('hidden'); $('sec-result').innerHTML = '';
    resetCoins(); renderBuilder();
  }
  function resetCoins() { Array.prototype.forEach.call(document.querySelectorAll('#coins .coin'), function (c) { c.textContent = '?'; c.className = 'coin'; }); }

  // 結果
  function miniHex(n, moving) {
    var l = E.linesOf(n), h = '<div class="mini">';
    for (var i = 5; i >= 0; i--) {
      var mv = moving && moving.indexOf(i) >= 0;
      h += '<div class="r">' + barHTML(l[i] === 1, mv) + '<span>' + (mv ? (l[i] ? '○' : '×') : '') + '</span></div>';
    }
    return h + '</div>';
  }
  function hexCard(kind, n, moving) {
    var info = E.hexInfo(n), t = tx(n);
    return '<div class="hex"><div class="kind">' + kind + '</div><div class="num">第' + n + '卦 ' + info.glyph + '</div>' +
      '<div class="nm">' + esc(t.name) + '</div><div class="yomi">' + esc(t.yomi) + '</div>' +
      '<div class="full">' + esc(E.fullName(n, t.name)) + '</div>' + miniHex(n, moving) +
      '<div class="tri">上卦 ' + info.upper.sym + ' ' + info.upper.key + '（' + info.upper.nature + '）<br>下卦 ' + info.lower.sym + ' ' + info.lower.key + '（' + info.lower.nature + '）</div></div>';
  }
  function vnote(arr) { return arr && arr.length ? '<div class="vnote">異文：' + esc(arr.join('、')) + '</div>' : ''; }
  function readingHTML(r) {
    var t = tx(r.hex), lab, gen, note;
    if (r.kind === 'judg') { lab = t.name + '（' + (r.hex === state.cur.primary ? '本卦' : '之卦') + '）の卦辞'; gen = judgText(r.hex); note = t.jnote; }
    else if (r.kind === 'use') { var y = t.yao[6]; lab = t.name + 'の' + y[0]; gen = y[0] + '：' + y[1]; note = y[2]; }
    else { var y2 = t.yao[r.line]; lab = t.name + '（' + (r.hex === state.cur.primary ? '本卦' : '之卦') + '）の' + y2[0] + '（' + POSN[r.line] + '）'; gen = y2[0] + '：' + y2[1]; note = y2[2]; }
    return '<div class="txt ' + (r.main ? 'main' : 'subr') + '"><span class="lab">' + esc(lab) + (r.main ? '<span class="tag">主に読む</span>' : '<span class="tag s">あわせて読む</span>') + '</span><span class="gen">' + esc(gen) + '</span>' + vnote(note) + (r.kind === 'judg' && AD && AD.get(r.hex) ? '<span class="yaku">訳：' + esc(AD.get(r.hex).yaku) + '</span>' : '') + (r.kind === 'line' ? posHTML(r.hex, r.line) : '') + '</div>';
  }
  function fullTextHTML(n, moving, title, open) {
    var t = tx(n), h = '<details class="box"' + (open ? ' open' : '') + '><summary>' + title + '：' + esc(t.name) + 'の本文</summary>';
    h += '<p class="summary">' + esc(t.summary) + '</p>';
    h += '<div class="txt"><span class="lab">卦辞</span><span class="gen">' + esc(judgText(n)) + '</span>' + vnote(t.jnote) + '</div><ol class="yao">';
    t.yao.forEach(function (y, i) {
      var mv = moving && moving.indexOf(i) >= 0;
      h += '<li' + (mv ? ' class="mv"' : '') + '><span class="l">' + y[0] + '</span>' + esc(y[1]) + (mv ? ' <span class="tag">変爻</span>' : '') + vnote(y[2]) + '</li>';
    });
    return h + '</ol></details>';
  }
  function relCell(label, n, what) {
    var t = tx(n);
    return '<div><span>' + label + '</span><b>' + E.hexInfo(n).glyph + ' ' + esc(t.name) + '</b>' + esc(E.fullName(n, t.name)) + '<br><small>' + what + '</small></div>';
  }
  // v2：5人に共通する見方（js/common.js）。出典の名前をかならず添える
  function srcHTML(src) { return '<span class="src">' + esc(C.srcLabel(src)) + '</span>'; }
  function posHTML(n, i) {
    var p = C.position(E.linesOf(n), i);
    return '<div class="pos"><b>爻の位置（参考）</b>：' + esc(POSN[i] + '…' + p.stage) + '。' + esc(p.notes.join('／')) + srcHTML(p.src) + '</div>';
  }
  function themeHTML(n, kind) {
    var th = C.theme(n);
    return '<p class="theme"><span class="k">' + kind + '</span><b>' + esc(tx(n).name) + '</b>：' + esc(th.text) + srcHTML(th.src) + '</p>';
  }
  function tipsHTML(list) {
    return '<ul class="tips">' + list.map(function (x) { return '<li><b>' + esc(x.h) + '</b>　' + esc(x.t) + srcHTML(x.src) + '</li>'; }).join('') + '</ul>';
  }
  // 問いへの読み（js/advice.js）：訳・向き・分野ごとの助言。卦の単位まで
  function ansOne(kind, n, f) {
    var a = AD.get(n, f); if (!a) return '';
    var h = '<div class="ansone"><p class="anshd"><span class="k">' + kind + '</span><b>' + esc(tx(n).name) + '</b><span class="dir ' + a.dir.cls + '">' + esc(a.dir.label) + '</span></p>';
    h += '<p class="ansyaku">' + esc(a.yaku) + '</p>';
    if (a.field) h += '<p class="ansf"><b>' + esc(AD.fieldLabel(f)) + 'の問いなら</b>　' + esc(a.field) + '</p>';
    h += '<ul class="ansul"><li><b>したらいいこと</b>　' + esc(a.todo) + '</li><li><b>気を付けること</b>　' + esc(a.care) + '</li></ul></div>';
    return h;
  }
  function answerHTML(rec, c, z) {
    if (!AD) return '';
    var f = rec.f || '';
    var h = '<div class="ans"><h3>問いへの読み' + (f ? '（分野：' + esc(AD.fieldLabel(f)) + '）' : '') + '</h3>';
    h += ansOne(c.relating ? 'いま' : 'この卦', c.primary, f);
    if (c.relating) h += ansOne('これから', c.relating, f);
    if (c.relating) h += '<p class="note">「いま」が今の様子、「これから」が移っていく先です。変爻の言葉（下の「ここを読みます」）は、その中での細かい立ち位置を示します。ここでは卦全体の向きまでを読んでいます。</p>';
    if (!f) h += '<p class="note">「1. 占う問い」で分野を選ぶと、その分野に合わせた一言が出ます。</p>';
    h += '<p class="note">易が示すのは「時の向き」までです。金額・相手・物の良し悪しは、手元の数字と事実で決めてください。' + (f === 'health' ? '体の不調は、医師に相談してください。' : '') + '</p></div>';
    return h;
  }
  function showResult(rec, scroll) {
    var c = E.cast(rec.v), z = E.zhuxi(c);
    state.cur = c;
    var d = new Date(rec.t);
    var h = '<h2>3. 結果</h2>';
    h += '<div class="qbox"><div class="d">' + fmtDate(d) + '</div><div>' + (rec.q ? '問い：' + esc(rec.q) : '（問いは書かずに占いました）') + '</div></div>';
    h += '<div class="hexpair">' + hexCard('本卦（いま）', c.primary, c.moving);
    if (c.relating) h += '<div class="arrow">→</div>' + hexCard('之卦（これから）', c.relating, null);
    h += '</div>';
    h += '<p class="note">出た数（下から）：' + rec.v.join('・') + '　変爻 ' + z.count + '本' + (c.moving.length ? '（' + c.moving.map(function (i) { return POSN[i]; }).join('・') + '）' : '') + '</p>';
    h += answerHTML(rec, c, z);
    h += '<div class="read"><h3>ここを読みます</h3><p class="rule">' + esc(z.rule) + '</p>';
    z.readings.forEach(function (r) { h += readingHTML(r); });
    h += '<p class="note">決まり：朱熹『易学啓蒙』（考変占）</p></div>';
    h += '<div class="life"><h3>生き方としての読み</h3><p class="note">5人の発信者のうち、2人以上が同じように見ている点を、この卦が示す「時」としてまとめました。</p>';
    h += themeHTML(c.primary, '本卦');
    if (c.relating) { h += themeHTML(c.relating, '之卦'); h += '<p class="note">' + esc(C.ZHIGUA.t) + srcHTML(C.ZHIGUA.src) + '</p>'; }
    h += '</div>';
    h += '<details class="box"><summary>読むときの心得（5人に共通する見方）</summary>' + tipsHTML(C.READING) + '<p class="note">名前は、その見方を公開の場で述べていた人です（竹村亞希子・白倉信司・服部篤幸・沢井龍醒・東海林秀樹、敬称略）。</p></details>';
    h += '<h3>やさしい要約</h3><p class="summary"><b>' + esc(tx(c.primary).name) + '</b>：' + esc(tx(c.primary).summary) + '</p>';
    if (c.relating) h += '<p class="summary"><b>' + esc(tx(c.relating).name) + '</b>（之卦）：' + esc(tx(c.relating).summary) + '</p>';
    h += fullTextHTML(c.primary, c.moving, '本卦', true);
    if (c.relating) h += fullTextHTML(c.relating, null, '之卦', false);
    h += '<details class="box"><summary>互卦・錯卦・綜卦（参考）</summary><div class="rel">' +
      relCell('互卦', E.nuclear(c.primary), '二〜五爻から作る、内にひそむ流れ') +
      relCell('錯卦', E.opposite(c.primary), '陰陽をすべて逆にした卦') +
      relCell('綜卦', E.inverse(c.primary), '上下をひっくり返した卦') + '</div></details>';
    h += '<div class="actions"><button type="button" class="pri" id="btn-save">HTMLで保存</button><button type="button" id="btn-print">印刷</button><button type="button" id="btn-again">もう一度占う</button></div>';
    var sec = $('sec-result'); sec.innerHTML = h; sec.classList.remove('hidden');
    $('btn-save').onclick = function () { saveHTML(rec); };
    $('btn-print').onclick = function () { openAll(); window.print(); };
    $('btn-again').onclick = function () { resetCast(); $('sec-cast').scrollIntoView({ behavior: 'smooth' }); };
    if (scroll) setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth' }); }, 250);
  }
  function openAll() { Array.prototype.forEach.call(document.querySelectorAll('#sec-result details'), function (x) { x.open = true; }); }
  window.addEventListener('beforeprint', openAll);

  function saveHTML(rec) {
    openAll();
    var css = $('eki-css').textContent;
    var body = $('sec-result').cloneNode(true);
    var act = body.querySelector('.actions'); if (act) act.remove();
    var html = '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>易の結果 ' + fmtDate(new Date(rec.t)) + '</title><style>' + css + '</style></head><body><main>' +
      '<section class="card">' + body.innerHTML + '</section><p class="foot">本文：『周易』卦辞・爻辞（パブリックドメイン）／読み方：朱熹『易学啓蒙』／生き方としての読み・心得：竹村亞希子・白倉信司・服部篤幸・沢井龍醒・東海林秀樹（敬称略）の公開情報で2人以上に共通する見方</p></main></body></html>';
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a'); var d = new Date(rec.t);
    a.href = URL.createObjectURL(blob);
    a.download = 'eki-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2) + '.html';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // 履歴（localStorage のみ）
  function loadHistory() { try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { return []; } }
  function saveHistory(rec) { var h = loadHistory(); h.unshift(rec); h = h.slice(0, 100); try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e) {} renderHistory(); }
  function renderHistory() {
    var h = loadHistory(), ul = $('hist');
    if (!h.length) { ul.innerHTML = '<li class="note">まだありません</li>'; return; }
    ul.innerHTML = h.map(function (r, i) {
      var c = E.cast(r.v), s = tx(c.primary).name + (c.relating ? ' → ' + tx(c.relating).name : '');
      return '<li><button type="button" data-i="' + i + '"><span class="d">' + fmtDate(new Date(r.t)) + '</span><br>' + esc(s) + (r.q ? '　<small>' + esc(r.q.slice(0, 24)) + '</small>' : '') + '</button></li>';
    }).join('');
  }
  $('hist').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]'); if (!b) return;
    var r = loadHistory()[+b.getAttribute('data-i')]; if (!r) return;
    state.values = r.v.slice(); renderBuilder(); $('question').value = r.q || ''; if ($('field')) $('field').value = r.f || ''; showResult(r, true);
  });
  $('btn-hist-clear').onclick = function () { if (confirm('この端末の履歴をすべて消しますか？')) { localStorage.removeItem(HKEY); renderHistory(); } };

  // 入力
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
    b.onclick = function () {
      state.mode = b.getAttribute('data-mode');
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (x) { x.classList.toggle('on', x === b); });
      $('input-real').classList.toggle('hidden', state.mode !== 'real'); $('howto-real').classList.toggle('hidden', state.mode !== 'real');
      $('input-app').classList.toggle('hidden', state.mode !== 'app'); $('howto-app').classList.toggle('hidden', state.mode !== 'app');
    };
  });
  $('input-real').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-heads]'); if (!b || b.disabled) return;
    addValue(E.valueFromHeads(+b.getAttribute('data-heads')));
  });
  $('btn-toss').onclick = function () {
    var btn = this; if (btn.disabled) return; btn.disabled = true;
    var coins = E.tossHeads(), els = document.querySelectorAll('#coins .coin');
    Array.prototype.forEach.call(els, function (c) { c.className = 'coin'; void c.offsetWidth; c.classList.add('spin'); c.textContent = ''; });
    setTimeout(function () {
      var heads = 0;
      Array.prototype.forEach.call(els, function (c, i) { heads += coins[i]; c.textContent = coins[i] ? '表' : '裏'; c.classList.toggle('ura', !coins[i]); });
      btn.disabled = false; addValue(E.valueFromHeads(heads));
    }, 520);
  };
  $('btn-undo').onclick = function () { if (!state.values.length) return; state.values.pop(); $('sec-result').classList.add('hidden'); renderBuilder(); };
  $('btn-reset').onclick = resetCast;

  if ($('field') && AD) $('field').innerHTML = AD.FIELDS.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
  renderBuilder(); renderHistory();
  window.__eki = { state: state, addValue: addValue, showResult: showResult };
  var bp = $('before-tips'); if (bp) bp.innerHTML = tipsHTML(C.BEFORE);
})();
