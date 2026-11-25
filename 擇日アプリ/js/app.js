(function () {
  const T = globalThis.Takujitsu;
  const RULES = T.rules;
  const ALM = T.almanac;
  document.getElementById("disclaimer").textContent = RULES.DISCLAIMER;

  const params = new URLSearchParams(location.search);
  const state = {
    purpose: params.get("purpose") || "drive",
    filter: "ok",
    risshun: "after"
  };

  const purposeRoot = document.getElementById("purpose-groups");
  ALM.PURPOSES.forEach(function (p) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.dataset.purpose = p.id;
    btn.setAttribute("aria-pressed", p.id === state.purpose ? "true" : "false");
    btn.innerHTML = "<strong>" + p.label + "</strong><small>" + p.items.join("・") + "</small>";
    btn.addEventListener("click", function () {
      state.purpose = p.id;
      document.querySelectorAll(".choice").forEach(function (el) {
        el.setAttribute("aria-pressed", el.dataset.purpose === p.id ? "true" : "false");
      });
      render();
    });
    purposeRoot.appendChild(btn);
  });

  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");
  const birthInput = document.getElementById("birth");
  const genderInput = document.getElementById("gender");
  const excludeInput = document.getElementById("exclude-clash");
  const excludeXiejiInput = document.getElementById("exclude-xieji");
  const risshunBox = document.getElementById("risshun-box");

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(p) { return p.y + "-" + pad(p.m) + "-" + pad(p.d); }
  function todayParts() {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  }

  function applyPreset(days) {
    const start = todayParts();
    startInput.value = iso(start);
    endInput.value = iso(T.addDays(start, days - 1));
    document.querySelectorAll("#presets button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", Number(btn.dataset.days) === days ? "true" : "false");
    });
  }

  document.getElementById("presets").addEventListener("click", function (event) {
    const btn = event.target.closest("button");
    if (!btn) return;
    applyPreset(Number(btn.dataset.days));
    render();
  });

  [startInput, endInput, birthInput, genderInput, excludeInput, excludeXiejiInput].forEach(function (el) {
    el.addEventListener("change", function () {
      if (el === startInput || el === endInput) {
        document.querySelectorAll("#presets button").forEach(function (btn) { btn.setAttribute("aria-pressed", "false"); });
      }
      render();
    });
  });

  document.getElementById("filter").addEventListener("click", function (event) {
    const btn = event.target.closest("button");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    document.querySelectorAll("#filter button").forEach(function (el) {
      el.setAttribute("aria-pressed", el === btn ? "true" : "false");
    });
    render();
  });

  document.getElementById("print").addEventListener("click", function () { window.print(); });

  const dialog = document.getElementById("day-dialog");
  dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });

  function birthOption() {
    if (!birthInput.value) return null;
    const p = T.parseISO(birthInput.value);
    return { y: p.y, m: p.m, d: p.d, gender: genderInput.value, risshun: state.risshun };
  }

  function updateRisshunNote() {
    risshunBox.innerHTML = "";
    if (!birthInput.value) return;
    const day = T.describeDay(birthInput.value);
    const entered = day.enters.find(function (e) { return e.name === "立春"; });
    if (!entered) return;
    const box = document.createElement("div");
    box.className = "risshun-note";
    box.innerHTML = "<p>この日は立春です（" + pad(entered.hh) + "時" + pad(entered.mm) + "分）。時刻がわからないときは、立春のあとの年干支で見ています。</p>";
    const row = document.createElement("div");
    row.className = "presets";
    [["after", "立春よりあと"], ["before", "立春より前"]].forEach(function (pair) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = pair[1];
      btn.setAttribute("aria-pressed", state.risshun === pair[0] ? "true" : "false");
      btn.addEventListener("click", function () { state.risshun = pair[0]; render(); });
      row.appendChild(btn);
    });
    box.appendChild(row);
    risshunBox.appendChild(box);
  }

  function human(isoDate) {
    const p = T.parseISO(isoDate);
    return p.m + "月" + p.d + "日";
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }

  function cls(day) {
    if (day.verdict.ok) return "g-best";
    if (day.buqu || /忌|沖/.test(day.verdict.why)) return "g-bad";
    return "";
  }

  function cardTags(day, purpose) {
    const first = day.yi.filter(function (x) { return purpose.items.indexOf(x) >= 0; });
    const rest = day.yi.filter(function (x) { return purpose.items.indexOf(x) < 0; });
    const shown = rest.slice(0, 8);
    return first.map(function (x) { return "<span class='on'>" + x + "</span>"; }).join("") +
      shown.map(function (x) { return "<span>" + x + "</span>"; }).join("") +
      (rest.length > shown.length ? "<span>ほか" + (rest.length - shown.length) + "</span>" : "");
  }

  function hhText(day) {
    return "<span class='" + (day.huanghei.yellow ? "hh-y" : "hh-b") + "'>" + day.huanghei.name + "（" + (day.huanghei.yellow ? "黄道" : "黒道") + "）</span>";
  }

  function render() {
    updateRisshunNote();
    const summary = document.getElementById("summary");
    const list = document.getElementById("list");
    const months = document.getElementById("months");
    summary.innerHTML = ""; list.innerHTML = ""; months.innerHTML = "";
    if (!startInput.value || !endInput.value) return;
    if (startInput.value > endInput.value) {
      summary.innerHTML = "<p class='error'>おわりの日が、はじめより前になっています。</p>";
      return;
    }
    const s = T.parseISO(startInput.value), e = T.parseISO(endInput.value);
    const span = Math.round((Date.UTC(e.y, e.m - 1, e.d) - Date.UTC(s.y, s.m - 1, s.d)) / 86400000);
    if (span > 366) {
      summary.innerHTML = "<p class='error'>一度に見られるのは、およそ一年までです。</p>";
      return;
    }
    const options = {
      purpose: state.purpose,
      birth: birthOption(),
      excludeClash: !!(birthInput.value && excludeInput.checked),
      excludeXiejiBuqu: !!excludeXiejiInput.checked
    };
    let result;
    try {
      result = T.pickRange(startInput.value, endInput.value, options);
    } catch (err) {
      summary.innerHTML = "<p class='error'>暦を組み立てられませんでした。期間を変えてみてください。</p>";
      return;
    }
    const purpose = result.purpose;
    const h2 = document.createElement("h2");
    h2.textContent = purpose.label + "（" + purpose.items.join("・") + "）";
    const p = document.createElement("p");
    const xb = result.picked.filter(function (d) { return d.xiejiBuqu; }).length;
    p.textContent = human(startInput.value) + "〜" + human(endInput.value) + "の" + result.days.length + "日のうち、通宜に入る日は" + result.picked.length + "日です。" +
      (excludeXiejiInput.checked ? "（協紀不取の日は外しています）" : (xb ? "うち" + xb + "日は「協紀不取」の印つきです。" : ""));
    summary.appendChild(h2);
    summary.appendChild(p);

    const shown = state.filter === "ok" ? result.picked : result.days;
    if (!shown.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "この期間には、" + purpose.items.join("・") + "が宜に入る日がありません。期間を広げてみてください。";
      list.appendChild(empty);
    }
    shown.forEach(function (day) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day-card";
      const mark = day.verdict.ok ? "宜" : (day.buqu ? "不" : "－");
      const markCls = day.verdict.ok ? "g-best" : (day.buqu ? "g-bad" : "g-fair");
      const why = day.verdict.ok
        ? (day.xiejiBuqu ? "<span class='xb'>協紀不取</span>" : "") + "<div class='tags'>" + cardTags(day, purpose) + "</div>"
        : "<span class='why'>" + esc(day.verdict.why) + "</span>";
      btn.innerHTML =
        "<span class='mark " + markCls + "'>" + mark + "</span>" +
        "<span><span class='when'>" + human(day.date) + "（" + day.weekday + "）" + day.day.text + "</span><br>" +
        "<span class='sub'>" + day.direct.name + "日 · " + hhText(day) + " · 沖" + day.chong.animal + "（" + day.chong.gz + "）煞" + day.shaDir + "</span>" +
        why + "</span><span></span>";
      btn.addEventListener("click", function () { openDay(day); });
      list.appendChild(btn);
    });
    renderMonths(result.days);
  }

  function renderMonths(days) {
    const byDate = {};
    days.forEach(function (d) { byDate[d.date] = d; });
    const first = T.parseISO(days[0].date), last = T.parseISO(days[days.length - 1].date);
    const host = document.getElementById("months");
    let y = first.y, m = first.m;
    while (y < last.y || (y === last.y && m <= last.m)) {
      host.appendChild(monthGrid(y, m, byDate));
      m += 1;
      if (m === 13) { m = 1; y += 1; }
    }
  }

  function monthGrid(y, m, byDate) {
    const section = document.createElement("section");
    section.className = "month";
    section.innerHTML = "<h3>" + y + "年" + m + "月</h3>";
    const week = document.createElement("div");
    week.className = "week";
    ["日", "月", "火", "水", "木", "金", "土"].forEach(function (n) {
      const sp = document.createElement("span"); sp.textContent = n; week.appendChild(sp);
    });
    section.appendChild(week);
    const grid = document.createElement("div");
    grid.className = "grid";
    const firstW = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let i = 0; i < firstW; i++) grid.appendChild(document.createElement("span"));
    const today = iso(todayParts());
    for (let d = 1; d <= count; d++) {
      const key = y + "-" + pad(m) + "-" + pad(d);
      const day = byDate[key];
      if (!day) {
        const sp = document.createElement("span");
        sp.className = "cell out"; sp.textContent = String(d);
        grid.appendChild(sp);
        continue;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell " + cls(day) + (key === today ? " today" : "");
      const g = day.verdict.ok ? "宜" : (day.buqu ? "不取" : (/忌/.test(day.verdict.why) ? "忌" : ""));
      btn.innerHTML = "<span class='n'>" + d + "</span><span class='g'>" + g + "</span><span class='r'>" + day.day.text + day.direct.name + "</span>" +
        (day.verdict.ok && day.xiejiBuqu ? "<span class='xbs'>協紀不取</span>" : "");
      btn.setAttribute("aria-label", human(key) + " " + (g || "どちらでもない"));
      btn.addEventListener("click", function () { openDay(day); });
      grid.appendChild(btn);
    }
    section.appendChild(grid);
    return section;
  }

  function openDay(day) {
    const body = document.getElementById("dialog-body");
    const purpose = T.purposeById(state.purpose);
    const enters = day.enters.length
      ? "<p>この日 " + day.enters.map(function (e) { return pad(e.hh) + "時" + pad(e.mm) + "分に" + e.name; }).join("、") + "。</p>"
      : "";
    const mark = function (x) { return "<span>" + (purpose.items.indexOf(x) >= 0 ? "<b><u>" + x + "</u></b>" : x) + "</span>"; };
    const verdict = day.verdict.ok
      ? "<p><b>" + purpose.label + "</b>：通宜に「" + day.verdict.items.join("・") + "」があります。" + (day.xiejiBuqu ? "ただし<b>協紀不取</b>の日です。" : "") + "</p>"
      : "<p><b>" + purpose.label + "</b>：選べません（" + esc(day.verdict.why) + "）。</p>";
    // 通書と同じく、憲宜・協紀の段にある事目は通宜に重ねて出さない
    const tongShown = day.yi.filter(function (x) { return day.xianYi.indexOf(x) < 0 && day.xiejiYi.indexOf(x) < 0; });
    const list = function (arr, empty) { return arr.length ? arr.map(mark).join("") : empty; };
    const rules = (day.xiejiRules || []).map(function (r) { return esc(r.why); });
    const clash = [];
    if (day.clash.year) clash.push("生まれ年");
    if (day.clash.day) clash.push("生まれ日");
    body.innerHTML =
      "<h3>" + human(day.date) + "（" + day.weekday + "）" + day.day.text + "日</h3>" +
      "<p class='sub'>" + day.year.text + "年 " + day.month.text + "月（" + day.setsuName + "から） · " + day.lunarText + "</p>" +
      verdict +
      (day.buqu || day.tongFew ? "<div class='buqu'>" + day.buquReasons.join("／") + "</div>" : "") +
      "<div class='yiji xian'><h4>憲宜<small>官暦の宜</small></h4><p>" + list(day.xianYi, "不取") + "</p></div>" +
      "<div class='yiji xieji'><h4>協紀<small>協紀辨方書</small></h4><p>" + (day.xiejiBuqu ? "<span class='xb'>不取</span>" + (day.xiejiAllJi ? "（諸事皆忌）" : "") : list(day.xiejiYi, "")) + "</p></div>" +
      "<div class='yiji yi'><h4>通宜<small>民間の通書</small></h4><p>" + (day.buqu ? "不取" : list(tongShown, "（憲宜・協紀と同じ）")) + "</p>" +
        (day.congquan ? "<p class='sub'>憲協均少取 — 通宜は建除の宜だけから取っています（從權取用）。</p>" : "") + "</div>" +
      "<div class='yiji ji'><h4>忌</h4><p>" + (day.ji.length ? day.ji.map(mark).join("") : "なし") + "</p></div>" +
      (rules.length ? "<details class='why-x'><summary>協紀の判定のわけ</summary><ul>" + rules.map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ul></details>" : "") +
      "<div class='chips pillars'>" +
        "<span>建除 " + day.direct.name + "</span>" +
        "<span>" + hhText(day) + "</span>" +
        "<span>沖" + day.chong.animal + "（" + day.chong.gz + "）</span>" +
        "<span>煞" + day.shaDir + "</span>" +
        "<span>" + day.mansion.name + "宿</span>" +
        (day.rokuyo ? "<span>六曜 " + day.rokuyo.name + "（参考）</span>" : "") +
      "</div>" +
      (clash.length ? "<p>" + clash.join("・") + "の十二支と沖しています。</p>" : "") +
      enters +
      "<p class='sub'>吉神：" + (day.goodGods.join("・") || "なし") + "<br>凶神：" + (day.badGods.join("・") || "なし") + "</p>" +
      "<p class='note'>" + RULES.DISCLAIMER + "</p>" +
      "<button type='button' class='close-btn' id='close-dialog'>閉じる</button>";
    document.getElementById("close-dialog").addEventListener("click", function () { dialog.close(); });
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  if (params.get("start") && params.get("end")) {
    startInput.value = params.get("start");
    endInput.value = params.get("end");
    document.querySelectorAll("#presets button").forEach(function (btn) { btn.setAttribute("aria-pressed", "false"); });
  } else {
    applyPreset(30);
  }
  render();
  if (params.get("open")) {
    const d = T.describeDay(params.get("open"), { birth: birthOption() });
    d.verdict = ALM.judge(d, T.purposeById(state.purpose), { excludeXiejiBuqu: excludeXiejiInput.checked });
    openDay(d);
  }
})();
