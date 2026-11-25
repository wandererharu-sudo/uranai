/**
 * 占いの入口とのつなぎ（2026-11-18 みこ追加・同日「ほかの占いへ直接行ける帯」に変更）。
 * 1 画面のいちばん上に、入口とほかの占いへの帯を出す（印刷・PDFには出ない）。
 *   押した時に、いまの画面に入っている生年月日・名前・性別を読んで、行き先のアドレスに付ける。
 * 2 アドレスで渡された内容（?y=2000&m=1&d=1&time=12:00&gender=男&name=…&roma=…）を入力欄に入れる。
 * このファイルが無くても、各アプリは元のまま動く。入力はどこにも送らず、保存もしない。
 * 顔相・手相は外のファイルを読めない作りなので、この中身をそのままページの中に写してある（直したら両方）。
 */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var APPS = [
    ['hub', '入口', '../index.html'],
    ['shichu', '四柱推命', 'https://wandererharu-sudo.github.io/shichusuimei/'],
    ['ziwei', '紫微斗数', '../紫微斗数アプリ/index.html'],
    ['suuhi', '数秘術', '../数秘術アプリ/index.html'],
    ['takujitsu', '擇日', '../擇日アプリ/index.html'],
    ['eki', '易', '../易アプリ/index.html'],
    ['gansou', '顔相', '../顔相アプリ/index.html'],
    ['tesou', '手相', '../手相アプリ/index.html']
  ];
  var here = '';
  try { here = decodeURIComponent(location.pathname); } catch (e) { here = location.pathname; }
  function isHere(a) { return a[0] !== 'hub' && a[0] !== 'shichu' && here.indexOf(a[1] + 'アプリ') >= 0; }

  // 時刻（06:45）→ 紫微斗数の時辰の番号
  function hourOf(t) {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return '';
    var hh = +t.split(':')[0];
    return hh === 23 ? 'late' : String(Math.floor(((hh + 1) % 24) / 2));
  }

  // いまの画面の入力を読む（無い項目は、アドレスで渡された内容のまま）
  function collect() {
    var o = { y: q.get('y') || '', m: q.get('m') || '', d: q.get('d') || '', time: q.get('time') || '',
      hour: q.get('hour') || '', gender: q.get('gender') || '', name: q.get('name') || '', roma: q.get('roma') || '' };
    function setDate(y, m, d) {
      if (!y || !m || !d) return;
      if (+y !== +o.y || +m !== +o.m || +d !== +o.d) { o.time = ''; o.hour = ''; }  // 別の人の日付なら時刻は持ち越さない
      o.y = String(+y); o.m = String(+m); o.d = String(+d);
    }
    try {
      // 紫微斗数（命盤を出した後だけ読む。出す前は見本の値が入っているため）
      if ($('era') && $('year') && $('month') && $('day') && $('hour') && $('result') && !$('result').hidden) {
        setDate(+$('era').value + +$('year').value, $('month').value, $('day').value);
        var hv = $('hour').value;
        if (hv !== hourOf(o.time)) { o.time = ''; o.hour = hv; }
        if ($('gender') && $('gender').value) o.gender = $('gender').value;
        if ($('name') && $('name').value.trim()) o.name = $('name').value.trim();
      }
      // 数秘術
      if ($('by') && $('bm') && $('bd')) {
        setDate($('by').value, $('bm').value, $('bd').value);
        if ($('nm') && $('nm').value.trim()) o.roma = $('nm').value.trim();
      }
      // 擇日
      if ($('birth') && $('picker')) {
        var b = /^(\d{4})-(\d{2})-(\d{2})$/.exec($('birth').value || '');
        if (b) setDate(b[1], b[2], b[3]);
        var gv = $('gender') && $('gender').value;
        if (gv === 'male' || gv === 'female') o.gender = gv === 'female' ? '女' : '男';
      }
      // 顔相・手相
      if ($('nameInput')) {
        if ($('nameInput').value.trim()) o.name = $('nameInput').value.trim();
        var r = document.querySelector('input[name="gender"]:checked');
        if (r && (r.value === '男性' || r.value === '女性')) o.gender = r.value === '女性' ? '女' : '男';
      }
    } catch (e) {}
    return o;
  }

  function urlFor(a) {
    var o = collect(), p = new URLSearchParams(), has = o.y && o.m && o.d;
    if (a[0] === 'shichu') {  // 公開版の四柱推命は項目の名前が違う
      if (o.name) p.set('name', o.name);
      if (has) { p.set('year', o.y); p.set('month', o.m); p.set('day', o.d); }
      if (o.gender) p.set('gender', o.gender === '女' ? 'female' : 'male');
      if (o.time) p.set('time', o.time);
    } else {
      if (has) { p.set('y', o.y); p.set('m', o.m); p.set('d', o.d); }
      if (o.time) p.set('time', o.time);
      else if (o.hour) p.set('hour', o.hour);
      if (o.gender) p.set('gender', o.gender);
      if (o.name) p.set('name', o.name);
      if (o.roma) p.set('roma', o.roma);
    }
    var s = p.toString();
    return a[2] + (s ? '?' + s : '');
  }

  // 1 帯
  var st = document.createElement('style');
  st.textContent = '#hub-bar{position:relative;z-index:60;background:#2f3b36;color:#cfd8d3;padding:6px 12px;' +
    'font:14px/1.6 "Yu Gothic UI","Hiragino Sans",sans-serif;text-align:left;display:flex;flex-wrap:wrap;gap:2px 6px;align-items:center}' +
    '#hub-bar a{color:#fff;text-decoration:none;padding:2px 8px;border-radius:4px;white-space:nowrap}' +
    '#hub-bar a:hover{background:#4a5a53}' +
    '#hub-bar b{color:#2f3b36;background:#e9efe9;padding:2px 8px;border-radius:4px;white-space:nowrap}' +
    '#hub-bar span{font-size:12px;margin-right:2px}' +
    '@media print{#hub-bar{display:none !important}}';
  document.head.appendChild(st);
  var bar = document.createElement('div');
  bar.id = 'hub-bar';
  var lab = document.createElement('span');
  lab.textContent = '同じ生年月日で見る：';
  var links = [];
  APPS.forEach(function (a, i) {
    var el;
    if (isHere(a)) { el = document.createElement('b'); el.textContent = a[1]; }
    else {
      el = document.createElement('a');
      el.textContent = a[0] === 'hub' ? '← 入口' : a[1];
      if (a[0] === 'shichu') { el.target = '_blank'; el.rel = 'noopener'; el.title = 'ネットの公開版が別の窓で開きます'; }
      links.push([el, a]);
    }
    bar.appendChild(el);
    if (i === 0) bar.appendChild(lab);
  });
  function refresh() { links.forEach(function (x) { x[0].href = urlFor(x[1]); }); }
  refresh();
  ['pointerdown', 'mouseover', 'focusin', 'touchstart', 'contextmenu'].forEach(function (ev) {
    bar.addEventListener(ev, refresh, true);
  });
  bar.addEventListener('click', refresh, true);  // 押した瞬間の入力で行き先を決める
  document.body.insertBefore(bar, document.body.firstChild);

  // 2 渡された内容を入力欄へ入れる
  var y = +q.get('y'), m = +q.get('m'), d = +q.get('d');
  var gender = q.get('gender') || '', roma = q.get('roma') || '', name = q.get('name') || '';
  try {
    // 顔相・手相（名前・満年齢・性別）
    if ($('nameInput')) {
      if (name && !$('nameInput').value) $('nameInput').value = name.slice(0, 40);
      var ai = $('ageInput');
      if (y && m && d && ai && !ai.value) {
        var n = new Date(), age = n.getFullYear() - y - ((n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) ? 1 : 0);
        if (age >= 0 && age < 130) ai.value = String(age);
      }
      if (gender === '男' || gender === '女') {
        var rr = document.querySelector('input[name="gender"][value="' + (gender === '男' ? '男性' : '女性') + '"]');
        if (rr) rr.checked = true;
      }
    }
    if (!y || !m || !d) return;
    // 数秘術
    if ($('by') && $('bm') && $('bd') && $('btn-go')) {
      $('by').value = String(y);
      $('bm').value = String(m);
      if (typeof $('bm').onchange === 'function') $('bm').onchange();
      $('bd').value = String(d);
      if (roma && $('nm')) $('nm').value = roma.slice(0, 60);
      $('btn-go').click();
    }
    // 擇日
    if ($('birth') && $('picker')) {
      $('birth').value = y + '-' + pad(m) + '-' + pad(d);
      if ($('gender')) $('gender').value = gender === '女' ? 'female' : gender === '男' ? 'male' : '';
      $('birth').dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (e) { /* 入れられなくても、アプリはそのまま使える */ }
})();
