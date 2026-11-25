/**
 * やさしい案内（2026-11-18 みこ追加）。計算には触らず、出来上がった命盤を普段の言葉で案内する。
 * - 宮の普段の言い方（PLAIN）、星のたとえ（TATOE）
 * - 「この盤の要点」「画面の見方」「お金の読み」
 * 断定せず、流派の決まりに沿った読みとして書く。不安をあおる言い方は入れない。
 */
(function (root) {
  const PLAIN = {
    "命宮": "自分", "兄弟宮": "きょうだい・仲間", "夫妻宮": "パートナー", "子女宮": "子ども・後輩",
    "財帛宮": "お金", "疾厄宮": "体と心", "遷移宮": "外での姿", "交友宮": "まわりの人",
    "官禄宮": "仕事", "田宅宮": "家・不動産", "福徳宮": "心の楽しみ", "父母宮": "親・目上"
  };
  const TATOE = {
    "紫微": "王様の星", "天機": "知恵の星", "太陽": "照らす星", "武曲": "お金と決断の星", "天同": "おだやかさの星",
    "廉貞": "こだわりの星", "天府": "蔵の星", "太陰": "月・やさしさの星", "貪狼": "好奇心の星", "巨門": "ことばの星",
    "天相": "印鑑の星", "天梁": "見守りの星", "七殺": "行動の星", "破軍": "作り直しの星",
    "左輔": "助っ人の星", "右弼": "助っ人の星", "文昌": "文章の星", "文曲": "話術・芸の星", "天魁": "引き立ての星", "天鉞": "引き立ての星",
    "禄存": "たくわえの星", "擎羊": "刃の星", "陀羅": "長引く星", "火星": "瞬発の星", "鈴星": "秘めた熱の星", "地空": "空の星", "地劫": "空の星"
  };
  // 盤の上の位置（app.js の POS と同じ並び）
  const POS = { 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 4: [2, 1], 9: [2, 4], 3: [3, 1], 10: [3, 4], 2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4] };
  const mod = (n, m) => ((n % m) + m) % m;

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function plain(name) { return PLAIN[name] || ""; }
  function tatoe(star) { return TATOE[star] || ""; }
  function starT(s) { return TATOE[s] ? `${s}（${TATOE[s]}）` : s; }

  // 「上の段の左から3つ目」のような、盤の上の場所の言い方
  function whereOnBoard(b) {
    const r = POS[b][0], c = POS[b][1];
    if (r === 1) return `上の段の左から${c}つ目`;
    if (r === 4) return `下の段の左から${c}つ目`;
    return `${c === 1 ? "左" : "右"}の列の上から${r}つ目`;
  }
  // 宮の名前から、その宮の場所（地支の番号）を探す
  function byName(ch, name) {
    for (let b = 0; b < 12; b++) if (ch.palaces[b].name === name) return b;
    return -1;
  }
  // 星（主星・補佐の星）がある宮を探す
  function findStar(ch, star) {
    for (let b = 0; b < 12; b++) { const p = ch.palaces[b]; if (p.major.includes(star) || p.minor.includes(star)) return b; }
    return -1;
  }
  // 四化（化禄・化忌など）が付いている宮と星
  function findHua(ch, hua) {
    for (let b = 0; b < 12; b++) { const p = ch.palaces[b]; for (const s of Object.keys(p.hua)) if (p.hua[s] === hua) return { b: b, star: s }; }
    return null;
  }
  function hasHua(p, hua) { return Object.keys(p.hua).some((s) => p.hua[s] === hua); }
  // 主星。無ければ向かいの宮から借りる
  function majors(ch, b) {
    const p = ch.palaces[b];
    if (p.major.length) return { stars: p.major, borrowed: false };
    const o = ch.palaces[mod(b + 6, 12)];
    return { stars: o.major, borrowed: true, from: o.name };
  }
  function label(ch, b) { const p = ch.palaces[b]; return `${p.name}（${plain(p.name)}）`; }
  function jump(b, text) { return `<button type="button" class="jump" data-b="${b}">${text}</button>`; }
  function starsLine(m) {
    if (!m.stars.length) return "主な星なし";
    return (m.borrowed ? `主な星なし → 向かいの${m.from}から借りる：` : "") + m.stars.map(starT).join("・");
  }

  /* ---------- 画面の見方 ---------- */
  function legend() {
    return "<h2>画面の見方</h2><ul>" +
      "<li><b>12のマス</b>：人生の分野です。マスの下の太字が分野の名前で、その上に普段の言葉を添えています（例：財帛＝お金、官禄＝仕事）。</li>" +
      '<li><b class="lg-maj">赤い太字</b>：主な星です。その分野の性格を表します。小さい字は補佐の星です。</li>' +
      '<li><span class="lg-hua">禄</span><span class="lg-hua">権</span><span class="lg-hua">科</span><span class="lg-hua ji">忌</span>：生まれ年が付ける4つの印です。禄＝恵み、権＝力、科＝評判、忌＝こだわり・宿題の場所。</li>' +
      '<li><span class="lg-ming">色の付いたマス</span>：命宮＝自分自身のマスです。<span class="lg-tag shen">身</span>は人生の後半に強まるマス、<span class="lg-tag flow">流年</span>は今年のマスです。</li>' +
      "<li><b>〇〜〇歳</b>：10年ごとの運（大限）が、その年齢でどのマスに来るかです。</li>" +
      "</ul>";
  }

  /* ---------- この盤の要点 ---------- */
  function points(ch, TX) {
    if (!ch.hourKnown) return "<h2>この盤の要点</h2><p>生まれた時刻が不明なので、要点は出せません。時刻がわかったら、もう一度出してください。</p>";
    const M = TX.majorInfo, P = ch.palaces;
    const rows = [];
    const add = (b, title, body) => rows.push(`<li>${jump(b, `<b>${title}</b><span class="where">${whereOnBoard(b)}</span>`)}<div class="pt-body">${body}</div></li>`);
    const want = (m) => m.stars.map((s) => M[s].want).join("、");
    const work = (m) => m.stars.map((s) => M[s].work).join("、");

    let b = ch.ming, m = majors(ch, b);
    add(b, "自分（命宮）", `${starsLine(m)}。` + (m.stars.length ? `「${want(m)}」人、という読みです。` : ""));
    b = mod(ch.ming + 6, 12); m = majors(ch, b);
    add(b, "外での姿（遷移宮）", `${starsLine(m)}。` + (m.stars.length ? `外では「${want(m)}」面が出やすい、という読みです。` : ""));
    b = byName(ch, "官禄宮"); m = majors(ch, b);
    add(b, "仕事（官禄宮）", `${starsLine(m)}。` + (m.stars.length ? `${work(m)}が向きやすい、という読みです。` : ""));
    b = byName(ch, "財帛宮"); m = majors(ch, b);
    add(b, "お金（財帛宮）", `${starsLine(m)}。` + (m.stars.length ? `稼ぎ方は、${work(m)}が向きやすい、という読みです。` : "") + "くわしくは下の「お金の読み」へ。");
    if (ch.shen !== ch.ming) {
      b = ch.shen;
      add(b, `人生の後半（身宮＝${plain(P[b].name)}）`, `30〜40代ごろから、${TX.palaceInfo[P[b].name].area}のテーマが強まる、という読みです。`);
    }
    const fy = ch.flowYear;
    if (fy && fy.decade) {
      b = fy.decade.branch;
      add(b, `今の10年（${fy.decade.range[0]}〜${fy.decade.range[1]}歳）`, `本来の${label(ch, b)}のマスに運が来ています。${TX.palaceInfo[P[b].name].area}がテーマになりやすい時期、という読みです。`);
    }
    if (fy && fy.palaceName) {
      b = fy.palace;
      add(b, `今年（${fy.year}年）`, `今年の運は、本来の${label(ch, b)}のマスに来ています。`);
    }
    return "<h2>この盤の要点</h2><p class=\"note noprint\">見出しを押すと、盤の上でそのマスが光ります。</p><ul class=\"pts\">" + rows.join("") + "</ul>";
  }

  /* ---------- お金の読み ---------- */
  function money(ch, TX) {
    if (!ch.hourKnown) return "";
    const M = TX.majorInfo, P = ch.palaces;
    const good = [], care = [];
    const li = (b, text) => `<li>${text}${b >= 0 ? ` <span class="where">${jump(b, whereOnBoard(b))}</span>` : ""}</li>`;
    const bCai = byName(ch, "財帛宮"), bGuan = byName(ch, "官禄宮"), bTian = byName(ch, "田宅宮"), bFu = byName(ch, "福徳宮");
    const four = [ch.ming, mod(ch.ming + 6, 12), bCai, bGuan];

    // --- したらいいこと ---
    let m = majors(ch, bCai);
    if (m.stars.length) good.push(li(bCai, `<b>稼ぎ方の型</b>：お金のマスは${starsLine(m)}。${m.stars.map((s) => M[s].work).join("、")}で稼ぐ形が向きやすいとされます。`));
    m = majors(ch, bGuan);
    if (m.stars.length) good.push(li(bGuan, `<b>働き方の型</b>：仕事のマスは${starsLine(m)}。${m.stars.map((s) => M[s].work).join("、")}が向きやすいとされます。`));
    let b = findStar(ch, "武曲");
    if (b >= 0) good.push(li(b, `<b>お金の星（武曲）の場所</b>：${label(ch, b)}にあります。${TX.palaceInfo[P[b].name].area}が、お金の動く場所になりやすいとされます。`));
    const lu = findHua(ch, "化禄");
    if (lu) good.push(li(lu.b, `<b>恵みの印（禄）の場所</b>：${lu.star}に付き、${label(ch, lu.b)}にあります。${TX.palaceInfo[P[lu.b].name].area}が、縁やお金の入口になりやすいとされます。この縁を切らさないことです。`));
    const ke = findHua(ch, "化科");
    if (ke) good.push(li(ke.b, `<b>評判の印（科）の場所</b>：${starT(ke.star)}に付き、${label(ch, ke.b)}にあります。${M[ke.star] ? "「" + M[ke.star].want + "」ことを外に見せると、名前が広がりやすいとされます。" : "ここで評判が立ちやすいとされます。"}`));
    const helpers = four.filter((x) => P[x].minor.some((s) => s === "天魁" || s === "天鉞"));
    if (helpers.length) good.push(li(helpers[0], `<b>人の引き立て</b>：${helpers.map((x) => label(ch, x)).join("・")}に引き立ての星（天魁・天鉞）があります。目上の方や紹介が、収入の入口になりやすいとされます。`));
    b = findStar(ch, "禄存");
    if (b >= 0 && !hasHua(P[b], "化忌")) good.push(li(b, `<b>たくわえの星（禄存）の場所</b>：${label(ch, b)}にあります。${TX.palaceInfo[P[b].name].area}が、守るお金の置き場になりやすいとされます。`));

    // --- 気を付けること ---
    const ji = findHua(ch, "化忌");
    if (ji) care.push(li(ji.b, `<b>宿題の印（忌）の場所</b>：${starT(ji.star)}に付き、${label(ch, ji.b)}にあります。${TX.palaceInfo[P[ji.b].name].area}で、こだわりや行き違いが出やすいとされます。大事なことは書面に残すと安心です。`));
    // 印鑑の星（天相）が、忌と見守り・刃の星にはさまれる形
    b = findStar(ch, "天相");
    if (b >= 0) {
      const L = P[mod(b - 1, 12)], R = P[mod(b + 1, 12)];
      const xing = (p) => p.major.includes("天梁") || p.minor.includes("擎羊");
      if ((hasHua(L, "化忌") && xing(R)) || (hasHua(R, "化忌") && xing(L))) {
        care.push(li(b, `<b>判子・保証・契約書</b>：印鑑の星（天相）のある${label(ch, b)}が、両隣を「忌」の印と天梁にはさまれています。古くから「印がはさまれる」と呼ばれる形で、保証人になること、あいまいな契約に判を押すことを戒めます。`));
      }
    }
    // たくわえの星と忌が同じマス（両隣は必ず刃の星・長引く星）
    b = findStar(ch, "禄存");
    if (b >= 0 && hasHua(P[b], "化忌")) {
      care.push(li(b, `<b>${plain(P[b].name)}は「守り」で</b>：${label(ch, b)}には、たくわえの星（禄存）と「忌」の印がいっしょにあり、両隣は刃の星（擎羊）と長引く星（陀羅）です。この分野は財になるが、口約束や説明の食い違いでもめやすく、大きく広げる勝負には向きにくい、という読みです。`));
    }
    // 空の星
    ["地空", "地劫"].forEach((s) => {
      const x = findStar(ch, s);
      if (x < 0) return;
      const n = P[x].name;
      let t = "";
      if (n === "兄弟宮" || n === "交友宮") t = "仲間内のお金の貸し借りや共同出資は、形が残りにくいとされます。するなら書面で。";
      else if (n === "財帛宮") t = "入ったお金が形に残りにくいとされます。先に取り分けて、形のあるもので持つと安心です。";
      else if (n === "田宅宮") t = "たくわえが目減りしやすいとされます。目的ごとに分けて持つと安心です。";
      else if (n === "福徳宮") t = "気分や思いつきでお金が出やすいとされます。楽しみの財布を別にすると安心です。";
      else if (n === "命宮" || n === "遷移宮" || n === "官禄宮") t = "人と違う発想が強みですが、お金の計画は先に紙に書いておくと安心です。";
      if (t) care.push(li(x, `<b>空の星（${s}）</b>：${label(ch, x)}にあります。${t}`));
    });
    // 長引く星・刃の星・瞬発の星が、お金・心の楽しみ・仕事のマスにある時
    [bCai, bFu].forEach((x) => { if (P[x].minor.includes("陀羅")) care.push(li(x, `<b>長引く星（陀羅）</b>：${label(ch, x)}にあります。請求や入金の確認を後回しにすると、ずるずる延びやすいとされます。期日を決めて早めに。`)); });
    [bCai, bGuan].forEach((x) => { if (P[x].minor.includes("擎羊")) care.push(li(x, `<b>刃の星（擎羊）</b>：${label(ch, x)}にあります。契約や書類は急がず、文言を読み合わせてから進めると安心です。`)); });
    [bCai, bFu].forEach((x) => { if (P[x].minor.includes("火星") || P[x].minor.includes("鈴星")) care.push(li(x, `<b>瞬発・秘めた熱の星</b>：${label(ch, x)}にあります。勢いで使いやすいので、大きな買い物は一晩おくと安心です。`)); });
    // 蔵の星に禄が届いていない形
    b = findStar(ch, "天府");
    if (b >= 0 && [ch.ming, bCai, bTian].includes(b)) {
      const around = [b, mod(b + 6, 12), mod(b + 4, 12), mod(b + 8, 12)];
      const filled = around.some((x) => P[x].minor.includes("禄存") || hasHua(P[x], "化禄"));
      if (!filled) care.push(li(b, `<b>蔵は自分で満たす</b>：蔵の星（天府）のまわり（三方四正）に、禄の印もたくわえの星も入っていません。器はあるが、放っておいて貯まる型ではない、という読みです。先に取り分けて残す仕組みが合います。`));
    }
    // お金のマスの主星の「気をつけたいこと」
    m = majors(ch, bCai);
    m.stars.forEach((s) => care.push(li(bCai, `<b>${starT(s)}の気をつけたい所</b>：${M[s].care}。`)));
    // 今の10年のお金の場所
    const fy = ch.flowYear;
    let decade = "";
    if (fy && fy.decade) {
      const x = mod(fy.decade.branch - 4, 12), p = P[x];
      decade = `<h3>今の10年（${fy.decade.range[0]}〜${fy.decade.range[1]}歳）のお金</h3><ul>` +
        li(x, `この10年の「お金の場所」は、本来の${label(ch, x)}のマスに重なります。${TX.palaceInfo[p.name].area}が、お金の話の中心になりやすい時期です。` +
          (hasHua(p, "化忌") ? "ここには「忌」の印があるので、この10年は守りを厚くする読みになります。" : "") +
          (hasHua(p, "化禄") ? "ここには「禄」の印があるので、入口が開きやすい10年という読みになります。" : "")) + "</ul>";
    }

    return "<h2>お金の読み</h2>" +
      "<p class=\"note\">この命盤を、紫微斗数の決まりどおりに読んだものです。<span class=\"noprint\">場所の言葉を押すと、盤の上でそのマスが光ります。</span></p>" +
      "<h3>したらいいこと</h3><ul>" + (good.join("") || "<li>とくに拾える形はありません。</li>") + "</ul>" +
      "<h3>気を付けること</h3><ul>" + (care.join("") || "<li>とくに拾える形はありません。</li>") + "</ul>" +
      decade +
      "<p class=\"note\">これは流派の決まりに沿った読みで、確かめられた事実ではありません。お金の判断は、数字（収支・金利・手元資金）で決めてください。「契約を書面にする」「保証人にならない」「請求と入金を後回しにしない」は、占いに関係なく役に立つ習慣です。</p>";
  }

  root.ZiweiGuide = { PLAIN: PLAIN, TATOE: TATOE, plain: plain, tatoe: tatoe, starT: starT, whereOnBoard: whereOnBoard, legend: legend, points: points, money: money, esc: esc };
})(typeof globalThis !== "undefined" ? globalThis : this);
