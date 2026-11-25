(function () {
  const Z = window.Ziwei, TX = window.ZiweiTexts, G = window.ZiweiGuide;
  const tt = (s) => (G.tatoe(s) ? "（" + G.tatoe(s) + "）" : ""); // 星のたとえ（例：天府＝蔵の星）
  const S = Z.STEMS, B = Z.BR;
  const $ = (id) => document.getElementById(id);
  // 4×4 の伝統的な配置（上段: 巳午未申、下段: 寅丑子亥）
  const POS = { 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 4: [2, 1], 9: [2, 4], 3: [3, 1], 10: [3, 4], 2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4] };
  const HOURS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  let current = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function fillSelect(sel, n, keep) {
    const v = keep || sel.value || "1";
    sel.innerHTML = "";
    for (let i = 1; i <= n; i++) { const o = document.createElement("option"); o.value = i; o.textContent = i; sel.appendChild(o); }
    sel.value = Math.min(+v, n);
  }
  function westYear() { return (+$("era").value) + (+$("year").value || 0); }
  function syncDays() {
    const y = westYear(), m = +$("month").value || 1;
    fillSelect($("day"), new Date(Date.UTC(y, m, 0)).getUTCDate());
    const era = $("era");
    $("seireki").textContent = era.value === "0" ? "" : "西暦 " + y + " 年";
  }
  fillSelect($("month"), 12, "1");
  syncDays();
  ["era", "year", "month"].forEach((id) => $(id).addEventListener("input", syncDays));

  function star(name, p) {
    const h = p.hua[name];
    return esc(name) + (h ? `<span class="hua${h === "化忌" ? " ji" : ""}">${h.slice(1)}</span>` : "");
  }

  function render(ch, name) {
    const board = $("board");
    board.innerHTML = "";
    const today = ch.flowYear;
    for (let b = 0; b < 12; b++) {
      const p = ch.palaces[b];
      const el = document.createElement("div");
      el.className = "cell" + (ch.hourKnown && b === ch.ming ? " ming" : "");
      el.id = "cell-" + b;
      el.style.gridRow = POS[b][0]; el.style.gridColumn = POS[b][1];
      el.innerHTML =
        (p.isShen ? '<span class="tag shen">身</span>' : "") +
        (today && today.palace === b ? '<span class="tag flow">流年</span>' : "") +
        '<div class="stars">' +
        (p.major.length ? '<div class="maj">' + p.major.map((s) => star(s, p)).join("<br>") + "</div>" : "") +
        (p.minor.length ? '<div class="min">' + p.minor.map((s) => star(s, p)).join(" ") + "</div>" : "") +
        "</div>" +
        (p.name && G.plain(p.name) ? '<div class="plain">' + esc(G.plain(p.name)) + "</div>" : "") +
        '<div class="foot"><span class="pname">' + (p.name ? esc(p.name.replace("宮", "")) : "　") + "</span>" +
        '<span class="gz">' + S[p.stem] + B[b] + "</span></div>" +
        (p.decade ? '<div class="dec">' + p.decade[0] + "〜" + p.decade[1] + "歳</div>" : "");
      el.addEventListener("click", () => showDetail(b));
      board.appendChild(el);
    }
    const c = document.createElement("div");
    c.className = "centerbox";
    const lu = ch.lunar;
    const inp = ch.input;
    c.innerHTML =
      (name ? '<div class="big">' + esc(name) + " さん</div>" : '<div class="big">命盤</div>') +
      `<div>${inp.y}年${inp.m}月${inp.d}日 ${inp.hour === null ? "時刻不明" : HOURS[inp.hour] + "の刻" + (inp.lateZi ? "（夜子）" : "")}</div>` +
      `<div>旧暦 ${lu.year}年 ${lu.leap ? "閏" : ""}${lu.month}月${lu.day}日</div>` +
      `<div>${ch.yearGanzhi}年・${ch.yinyang}${inp.gender}</div>` +
      (ch.hourKnown ? `<div>${ch.bureauName}（${ch.mingNayin}）</div><div>命主 ${ch.mingzhu}・身主 ${ch.shenzhu}</div>` : `<div>五行局：時刻が必要です</div><div>身主 ${ch.shenzhu}</div>`) +
      (today ? `<div>流年 ${today.year}年 ${today.ganzhi}（数え${today.age}歳）</div>` : "");
    board.appendChild(c);

    const notes = [];
    if (!ch.hourKnown) notes.push("生まれた時刻が不明なので、命宮・身宮・十二宮・五行局・紫微星と十四主星・文昌/文曲/火星/鈴星/地空/地劫・大限は決められません。いま出ているのは、生まれ年と月だけで決まる星です。時刻がわかったら、もう一度出してください。");
    if (lu.leap) notes.push(`閏${lu.month}月の${lu.day}日生まれです。このアプリでは閏月の15日までは前の月、16日からは次の月として計算しています（いまは${ch.lunarMonthUsed}月として計算）。`);
    if (inp.lateZi) notes.push("23時台の生まれは、翌日の子の刻として計算しています。");
    $("notice").hidden = !notes.length;
    $("notice").innerHTML = notes.map(esc).join("<br>");

    const sh = ch.sihua.map((x) => `${x.star}${x.hua}`).join("・");
    let fy = "";
    if (today) {
      fy = `<p><b>流年 ${today.year}年（${today.ganzhi}）</b>：今年の命宮は ${B[today.palace]} の宮` +
        (today.palaceName ? `（命盤の${today.palaceName}）` : "") + "です。" +
        (today.decade ? `いまの大限（10年運）は ${today.decade.range[0]}〜${today.decade.range[1]}歳の${today.decade.name}です。` : "") +
        `今年の四化：${today.sihua.map((x) => x.star + x.hua.slice(1)).join("・")}</p>`;
    }
    $("sihua").innerHTML = `<p><b>生年四化</b>（${S[ch.yearStem]}年）：${sh}</p>` + fy;
    $("reading").innerHTML = reading(ch);
    $("points").innerHTML = G.points(ch, TX);
    $("legend").innerHTML = G.legend();
    const mo = G.money(ch, TX);
    $("money").innerHTML = mo;
    $("money").hidden = !mo;
    // PDFに保存する時のファイル名になる
    document.title = "紫微斗数_" + (name ? name + "_" : "") + inp.y + "-" + ("0" + inp.m).slice(-2) + "-" + ("0" + inp.d).slice(-2);
    $("result").hidden = false;
  }

  function starList(ch, list) { return list.length ? list.map(G.starT).join("・") : "主星なし"; }
  function palLabel(ch, b) { const p = ch.palaces[b]; return (p.name || B[b] + "の宮") + "（" + B[b] + "）"; }

  function showDetail(b) {
    const ch = current, p = ch.palaces[b];
    let h = "";
    h += `<h2>${p.name ? esc(p.name) + (G.plain(p.name) ? "（" + esc(G.plain(p.name)) + "）" : "") : B[b] + "の宮"}</h2>`;
    h += `<p class="meta">${S[p.stem]}${B[b]}の宮` + (p.isShen ? "・身宮" : "") + (p.decade ? `・大限 ${p.decade[0]}〜${p.decade[1]}歳` : "") +
      (ch.flowYear && ch.flowYear.palace === b ? "・今年の流年命宮" : "") + (ch.laiyin === b ? "・来因宮" : "") + "</p>";
    if (p.name) {
      const info = TX.palaceInfo[p.name];
      h += `<p>${info.theme}${info.more}</p>`;
    } else h += "<p>生まれた時刻が不明なので、この宮が何の宮になるかは決められません。</p>";
    if (ch.hourKnown) {
      h += "<h3>主星</h3>";
      if (p.major.length) {
        h += "<ul>" + p.major.map((s) => `<li><b>${s}</b>${tt(s)}${p.hua[s] ? "（" + p.hua[s] + "）" : ""}：${TX.major[s]}${p.name ? TX.starInPalace(s, p.name) : ""}気をつけたいのは、${TX.majorInfo[s].care}。</li>`).join("") + "</ul>";
        if (p.major.length === 2) h += `<p class="note">${TX.twoStars}</p>`;
      } else {
        const o = ch.palaces[(b + 6) % 12];
        h += `<p>${p.name === "命宮" ? TX.emptyMing : TX.empty}</p><p>対宮（${o.name}・${B[o.branch]}）の星：${o.major.length ? o.major.join("・") : "なし"}</p>`;
        if (o.major.length) h += "<ul>" + o.major.map((s) => `<li><b>${s}</b>：${TX.major[s]}</li>`).join("") + "</ul>";
      }
    }
    if (p.minor.length) {
      h += "<h3>補佐の星</h3><ul>" + p.minor.map((s) => `<li><b>${s}</b>${tt(s)}${p.hua[s] ? "（" + p.hua[s] + "）" : ""}：${TX.minor[s]}</li>`).join("") + "</ul>";
      if (p.minor.some((s) => TX.STRONG.includes(s))) h += `<p class="note">${TX.strongNote}</p>`;
    }
    const hs = Object.keys(p.hua);
    if (hs.length) {
      h += "<h3>生年四化</h3><ul>" + hs.map((s) => `<li>${s}の${p.hua[s]}：` +
        (p.name ? TX.huaIn[p.hua[s]](TX.palaceInfo[p.name].area) : TX.hua[p.hua[s]]) + "</li>").join("") + "</ul>";
    }
    if (ch.hourKnown) {
      const sf = Z.sanfang(b);
      h += "<h3>三方四正（いっしょに見る宮）</h3>";
      h += `<p>${p.name ? TX.palaceInfo[p.name].pair : ""}</p><ul>` +
        `<li>対宮 ${palLabel(ch, sf.opposite)}：${starList(ch, ch.palaces[sf.opposite].major)}</li>` +
        sf.trine.map((t) => `<li>三合 ${palLabel(ch, t)}：${starList(ch, ch.palaces[t].major)}</li>`).join("") + "</ul>";
      const zs = Object.keys(p.zihua || {});
      if (zs.length || ch.laiyin === b) {
        h += '<h3>参考（飛星派・欽天派の見方）</h3><ul class="ref">';
        if (ch.laiyin === b) h += `<li>${TX.laiyin}</li>`;
        if (zs.length) h += `<li>自化：${zs.map((s) => s + "が自化" + p.zihua[s].slice(1)).join("・")}。${TX.zihuaNote}</li>`;
        h += "</ul>";
      }
    }
    h += `<p class="closing">${TX.closing}</p>`;
    $("detail").innerHTML = h;
    $("sheet").hidden = false;
  }

  // 命盤の「読み解き」: 命宮 → 三方四正 → 身宮 → 生年四化 → 今の大限 → 参考
  function reading(ch) {
    const P = ch.palaces;
    let h = "<h2>読み解き</h2>";
    if (!ch.hourKnown) {
      h += "<p>生まれた時刻が不明なので、命宮・身宮・三方四正・大限は読めません。生まれ年で決まる生年四化の星だけを書きます。</p>";
      h += "<p>" + ch.sihua.map((x) => `${x.star}の${x.hua}（${TX.hua[x.hua]}）`).join("、") + "。</p>";
      h += `<p class="closing">${TX.closing}</p>`;
      return h;
    }
    const ming = P[ch.ming];
    // 1. 命宮
    h += "<h3>命宮（その人らしさ）</h3>";
    h += `<p>命宮は${B[ch.ming]}の宮です。${TX.palaceInfo["命宮"].more}</p>`;
    if (ming.major.length) {
      h += "<ul>" + ming.major.map((s) => `<li><b>${s}</b>${tt(s)}：${TX.major[s]}${TX.starInPalace(s, "命宮")}</li>`).join("") + "</ul>";
      if (ming.major.length === 2) h += `<p>${TX.twoStars}</p>`;
    } else {
      const o = P[(ch.ming + 6) % 12];
      h += `<p>${TX.emptyMing}</p>`;
      if (o.major.length) h += "<ul>" + o.major.map((s) => `<li><b>${s}</b>（遷移宮から借りる星）：${TX.major[s]}</li>`).join("") + "</ul>";
    }
    const mg = ming.minor.filter((s) => TX.GOOD.includes(s)), ms = ming.minor.filter((s) => TX.STRONG.includes(s));
    if (mg.length) h += `<p>命宮には助けの星（${mg.join("・")}）があり、まわりの力を借りやすい形です。</p>`;
    if (ms.length) h += `<p>命宮には勢いの強い星（${ms.join("・")}）もあります。${TX.strongNote}</p>`;
    h += `<p class="note">${TX.sameStarNote}</p>`;

    // 2. 三方四正
    const sf = Z.sanfang(ch.ming);
    h += "<h3>三方四正（命宮と4つセットで見る宮）</h3>";
    h += `<p>${TX.sanfangIntro}</p><ul>`;
    const line = (b, label, key) => {
      const p = P[b];
      let t = `<li><b>${label}</b>（${p.name}）：${starList(ch, p.major)}。`;
      if (p.major.length && key === "work") t += `働き方は、${p.major.map((s) => TX.majorInfo[s].work).join("、")}が向きやすいです。`;
      if (p.major.length && key === "money") t += `稼ぎ方は、${p.major.map((s) => TX.majorInfo[s].work).join("、")}が向きやすいとされます。`;
      if (p.major.length && key === "out") t += `外では、${p.major.map((s) => TX.majorInfo[s].want).join("、")}という面が見えやすいです。`;
      if (!p.major.length) t += "主星がないので、向かいの宮の星を借りて読みます。";
      return t + "</li>";
    };
    h += line(sf.opposite, "外での顔", "out");
    sf.trine.forEach((t) => { h += line(t, P[t].name === "財帛宮" ? "お金" : "仕事", P[t].name === "財帛宮" ? "money" : "work"); });
    h += "</ul>";
    const four = [ch.ming, sf.opposite].concat(sf.trine);
    const goods = [], strongs = [];
    four.forEach((b) => P[b].minor.forEach((s) => { if (TX.GOOD.includes(s)) goods.push(s); if (TX.STRONG.includes(s)) strongs.push(s); }));
    h += `<p>この4つの宮に、助けの星が${goods.length}つ${goods.length ? "（" + goods.join("・") + "）" : ""}、勢いの強い星が${strongs.length}つ${strongs.length ? "（" + strongs.join("・") + "）" : ""}あります。` +
      (goods.length > strongs.length ? "人の助けを得ながら進める形です。" : strongs.length > goods.length ? "自分の力で勢いよく進める形です。あわてず、ていねいに進めると活きます。" : "助けと勢いの両方を使える形です。") + "</p>";

    // 3. 身宮
    h += "<h3>身宮（人生の後半に強まるところ）</h3>";
    const shen = P[ch.shen];
    if (ch.shen === ch.ming) h += `<p>${TX.shenSame}</p>`;
    else {
      h += `<p>${TX.shenOther(shen.name, TX.palaceInfo[shen.name].area)}</p>`;
      if (shen.major.length) h += `<p>身宮の星：${shen.major.map((s) => s + "（" + TX.majorInfo[s].want + "）").join("・")}。</p>`;
    }

    // 4. 生年四化
    h += `<h3>生年四化（${S[ch.yearStem]}年生まれ）</h3><p>${TX.huaOrder}</p><ul>`;
    ch.sihua.forEach((x) => {
      const b = Z.where(ch, x.star);
      if (b < 0) return;
      const p = P[b];
      h += `<li><b>${x.star}の${x.hua}</b>（${p.name}）：${TX.huaIn[x.hua](TX.palaceInfo[p.name].area)}</li>`;
    });
    h += "</ul>";

    // 5. 今の大限
    const fy = ch.flowYear;
    if (fy && fy.decade) {
      const d = P[fy.decade.branch];
      h += `<h3>いまの大限（${fy.decade.range[0]}〜${fy.decade.range[1]}歳）</h3>`;
      h += `<p>この10年は、本来の${d.name}にあたる宮がめぐってきています。${TX.palaceInfo[d.name].area}が、この時期のテーマになりやすいです。` +
        (d.major.length ? `この宮の星は${d.major.join("・")}で、${d.major.map((s) => TX.majorInfo[s].want).join("、")}という流れが出やすい時期です。` : "この宮には主星がないので、向かいの宮の星を借りて読みます。") + "</p>";
      const hs = Object.keys(d.hua);
      if (hs.length) h += `<p>この宮には生年四化（${hs.map((s) => s + "の" + d.hua[s]).join("・")}）があり、生まれ持ったテーマが表に出やすい10年です。</p>`;
      h += `<p>今年（${fy.year}年・${fy.ganzhi}）の流年命宮は${B[fy.palace]}の宮（命盤の${fy.palaceName}）です。</p>`;
      h += `<p class="note">${TX.decadeNote}</p>`;
    }

    // 6. 参考
    h += '<h3>参考（飛星派・欽天派の見方）</h3><ul class="ref">';
    h += `<li>${TX.laiyin}あなたの来因宮は${palLabel(ch, ch.laiyin)}で、${TX.palaceInfo[P[ch.laiyin].name].area}が人生の前提になりやすい、と読みます。</li>`;
    if (ch.zihua.length) h += `<li>${TX.zihuaNote}この命盤の自化：${ch.zihua.map((z) => P[z.branch].name + "の" + z.star + "（自化" + z.hua.slice(1) + "）").join("、")}。</li>`;
    else h += "<li>この命盤には自化がありません。</li>";
    h += `<li>${TX.schoolNote}</li></ul>`;
    h += `<p class="closing">${TX.closing}</p>`;
    return h;
  }

  $("close").addEventListener("click", () => { $("sheet").hidden = true; });
  $("sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") $("sheet").hidden = true; });

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const y = westYear(), m = +$("month").value, d = +$("day").value;
    if (y < 1901 || y > 2099) { alert("1901年〜2099年の生年月日で入力してください。"); return; }
    const hv = $("hour").value;
    const hour = hv === "" ? null : hv === "late" ? 0 : +hv;
    const now = new Date();
    try {
      current = Z.chart({ y, m, d, hour, lateZi: hv === "late", gender: $("gender").value, calendar: $("cal").value,
        now: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() } });
    } catch (err) { alert(err.message); return; }
    render(current, $("name").value.trim());
    $("result").scrollIntoView({ behavior: "smooth" });
  });
  // 「この盤の要点」「お金の読み」の場所の言葉を押すと、盤のそのマスが光る
  document.addEventListener("click", (e) => {
    const j = e.target.closest && e.target.closest(".jump");
    if (!j) return;
    const cell = $("cell-" + j.dataset.b);
    if (!cell) return;
    document.querySelectorAll(".cell.glow").forEach((c) => c.classList.remove("glow"));
    cell.scrollIntoView({ behavior: "smooth", block: "center" });
    cell.classList.add("glow");
    setTimeout(() => cell.classList.remove("glow"), 4000);
  });

  // PDFで保存（ブラウザの印刷画面で「PDFに保存」を選ぶ）
  $("pdf").addEventListener("click", () => { window.print(); });

  // ほかのアプリからの受け取り口：?y=2000&m=1&d=1&hour=6&gender=男&name=… で自動入力して命盤を出す
  // hour は 0〜11（子〜亥）・late（夜の子）・空（不明）。time=06:45 のような時刻でも受け取れる。
  (function fromUrl() {
    const q = new URLSearchParams(location.search);
    const y = +q.get("y"), m = +q.get("m"), d = +q.get("d");
    if (!y || !m || !d) return;
    $("era").value = "0";
    $("year").value = y;
    $("month").value = m;
    syncDays();
    $("day").value = d;
    let hv = q.get("hour");
    const t = q.get("time");
    if ((hv === null || hv === "") && t && /^\d{1,2}:\d{2}$/.test(t)) {
      const hh = +t.split(":")[0];
      hv = hh === 23 ? "late" : String(Math.floor(((hh + 1) % 24) / 2));
    }
    $("hour").value = hv === null ? "" : hv;
    const g = q.get("gender");
    if (g === "男" || g === "女" || g === "male" || g === "female") $("gender").value = g === "female" || g === "女" ? "女" : "男";
    if (q.get("name")) $("name").value = q.get("name").slice(0, 20);
    $("form").requestSubmit ? $("form").requestSubmit() : $("form").dispatchEvent(new Event("submit", { cancelable: true }));
  })();

  window.ZiweiApp = { showDetail: showDetail, reading: reading };
})();
