/**
 * 宜忌エンジン v3（台湾の通書と同じ「憲宜・協紀・通宜」の3段で出す）。
 *
 * ■ 3段の意味（國家圖書館所蔵 1948年臺北刊通書・林裕盛2007『擇日通書之脈絡分析與研究』による。
 *   nongminli.tw「為什麼各家農民曆不一樣」に要約あり）
 *   - 憲宜 … 官暦（時憲書）の宜。『欽定協紀辨方書』卷十一「用事」の「民用三十七事」の範囲で、協紀の判定どおりに出す。
 *   - 協紀 … 同書の判定で宜になるが、民用三十七事に入らず「通書選擇六十事」にだけある事目
 *            （祈福・求嗣・上冊受封・襲爵受封・臨政親民・納采問名・解除・整手足甲・築隄防・修倉庫・醞釀・
 *             開倉庫出貨財・補垣塞穴・修飾垣牆・取魚・納畜）。これが1つもない日を「協紀不取」とする。
 *            ※ 三僚大通書は同じ状態を「協紀仝」と書く（例 2025-05-10 「宪书宜 祭祀 入学 协纪仝」）。
 *            ※ 協紀の判定が「諸事皆忌」の日は、憲宜も空（通書の「憲協均不取」「憲宜不取・協紀不取」）。
 *   - 通宜 … 通書家が民間向けに足す宜。協紀で不取の日でも出す。このアプリの用途選びは通宜で判定する。
 *
 * ■ 協紀の判定（xieji*）… 『欽定協紀辨方書』卷十「宜忌」の各神の宜忌と、その特例条文をそのまま規則にした。
 *   - 宜：吉神・建除の宜の和。忌：凶神・建除の忌の和。原則は「忌が勝つ」（如常例）。
 *   - 卷十の特例（同巻「平日」条の按語にある六等の考え方）:
 *       止忌安撫邊境…求醫療病餘皆不忌（吉足勝凶）→ 忌は療病だけ
 *       凡所忌者則不註宜所宜者亦不註忌（吉凶相抵）→ 忌にある事は宜にしない
 *       諸事皆忌（凶又逢凶・凶疊大凶）→ その日は宜なし
 *     例：災煞「寅申巳亥月值開日…不與德神併凡所忌者則不註宜」。2025-05-10（巳月・開日・災煞・德なし）は
 *         開日の宜のうち刼煞（＝災煞）の「止不忌」に入る 祭祀・入學 だけが残る → 憲宜 祭祀 入學、協紀 不取。
 *   - 百忌日（卷十末「百忌日」）、無祿日（同「無禄日」）、上朔四離四絶（同）も入れる。
 *   - 受死・天罡・河魁は協紀辨方書の宜忌にない俗忌なので、協紀の判定には使わない（通宜でだけ使う）。
 *
 * ■ 通宜（tong*）… v2 の宜忌（吉神の宜＋建除の宜 − 凶神の忌、德は軽い凶神の忌を外す）を土台に、民間通書の考え方を足した。
 *   - 受死・四廢の日は通宜も「不取」。月破・四離・四絶の日は通宜を少しだけ（破日・四離四絶で忌まない事だけ）。
 *   - 協紀が「諸事皆忌」の日は「憲協均少取、通宜刊註從權取用」（1948年通書の文言）として、
 *     通宜は建除の宜だけから取る（吉神の宜は足さない）。
 *   - 修造の細目：修造が吉神・建除で宜の日は、起基・定磉・拆卸も宜の候補にする。
 *     天火（＝災煞、協紀「又為天火忌苫蓋」＝屋根の事）・地囊（土の事）・三煞は「修造・動土・豎柱・上樑」を止めるが、
 *     基礎の据え付けや取り壊しまでは止めない、という通書の扱い（写真の通書・三僚大通書とも 2025-05-10 に
 *     「起基 定磉 拆卸」を宜、動土を宜にしない）。それ以外の凶神・建除で修造が忌の日は細目も忌。
 *   - 造倉庫：協紀「母倉…與月恩四相開日併宜修倉庫」「收日…與月恩四相時德併宜修倉庫」「德合赦願則自宜修倉庫」。
 *   - 祈福が宜なら 齋醮・酬神・開光・塑繪、嫁娶なら 納婿、納采なら 問名、上官なら 赴任 も宜（通書の同類事目）。
 *   - 三煞（劫煞・災煞・月煞）が協紀で「如常例」（德で化されず、相抵や軽減の特例にも当たらない）の日は、
 *     協紀の「忌同月破」の忌を通宜にも当てる（例 2025-05-09 巳月收日劫煞 → 通宜は捕捉・畋獵の類だけ）。
 *   - 天火は災煞と同じ日（協紀「災煞 又為天火」）、地火は月厭と同じ日（協紀「月厭 又為地火」）。
 *   - 地囊は 協紀 卷六の「歴例」の表（民間の通書が使う表）。協紀の判定には同所で協紀が直した表を使う。
 *   - 交車・買車は原典にない現代の事目。通宜に「出行」がある日を交車、さらに交易・立券・納財のどれかがあれば買車。
 *
 * ■ わかっている限界
 *   - 協紀辨方書の神煞のうち、ここに入れていないもの（五富・天倉・五合・臨日・解神・鳴吠・小耗・五虛・九空・九坎ほか）がある。
 *   - 畋獵・取魚・伐木の季節（霜降後・雨水後など）は節月で近似。
 *   - 通宜は出版社ごとに違う。tests/check.js で写真と比べる。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TakujitsuAlmanac = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const S = "甲乙丙丁戊己庚辛壬癸";
  const B = "子丑寅卯辰巳午未申酉戌亥";
  const ZODIAC = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
  const ZODIAC_JA = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];

  function w(s) { return s.split(/\s+/).filter(Boolean); }
  function mod(n, m) { return ((n % m) + m) % m; }
  function uniq(a) { const o = []; a.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }

  /** 表示の順番（台湾の通書でよく見る並び） */
  const ITEMS = w(
    "祭祀 祈福 求嗣 齋醮 酬神 開光 塑繪 上表章 上冊受封 襲爵受封 上官 赴任 臨政親民 入學 " +
    "出行 訂盟 納采 問名 冠笄 裁衣 嫁娶 納婿 安床 移徙 入宅 會親友 進人口 " +
    "解除 沐浴 剃頭 整手足甲 求醫 治病 掃舍 " +
    "修造 動土 起基 定磉 豎柱 上樑 拆卸 造倉庫 修倉庫 修置產室 開渠穿井 安碓磑 築隄防 修飾垣牆 塞穴 平治道塗 " +
    "經絡 醞釀 開市 交易 立券 納財 開倉 出貨財 " +
    "栽種 牧養 納畜 伐木 捕捉 畋獵 取魚 破土 安葬 啟鑽 買車 交車"
  );

  const ITEM_NOTE = {
    "訂盟": "結婚姻", "納采": "納采問名", "問名": "納采問名", "冠笄": "冠帶", "裁衣": "裁製",
    "修造": "修造動土", "動土": "修造動土", "豎柱": "豎柱上梁", "上樑": "豎柱上梁",
    "拆卸": "破屋壞垣", "交易": "立券交易", "立券": "立券交易", "開倉": "開倉庫出貨財",
    "出貨財": "開倉庫出貨財", "掃舍": "掃舍宇", "塞穴": "補垣塞穴", "求醫": "求醫療病",
    "治病": "求醫療病", "啟鑽": "啓攢", "入宅": "移徙", "上官": "上官赴任", "赴任": "上官赴任",
    "起基": "（通書の修造細目）", "定磉": "（通書の修造細目）", "造倉庫": "修倉庫",
    "買車": "（現代の事目）", "交車": "（現代の事目）"
  };

  // =====================================================================
  // 共通：月ごとの神煞の位置（index mi: 0 = 寅月 … 11 = 丑月）
  // =====================================================================
  const TIANDE = "丁申壬辛亥甲癸寅丙乙巳庚";      // 天德（干または支）
  const TIANDE_HE = "壬巳丁丙寅己戊亥辛庚申乙";   // 天德合
  const TIANYUAN = ["乙亥", "甲戌", "乙酉", "丙申", "丁未", "戊午", "己巳", "庚辰", "辛卯", "壬寅", "癸丑", "甲子"];
  const YUEEN = "丙丁庚己戊辛壬癸庚乙甲辛";       // 月恩（干）
  const YUEYAN = "戌酉申未午巳辰卯寅丑子亥";      // 月厭（＝地火）
  const YUEXING = "巳子辰申午丑寅酉未亥卯戌";     // 月刑
  const YUEHAI = "巳辰卯寅丑子亥戌酉申未午";      // 月害
  const WANGWANG = "寅巳申亥卯午酉子辰未戌丑";    // 往亡
  const TIANZEI = "辰酉寅未子巳戌卯申丑午亥";     // 天賊
  const SHOUSI = "戌辰亥巳子午丑未寅申卯酉";      // 受死（俗忌）
  const TIANGANG = "巳子未寅酉辰亥午丑申卯戌";    // 天罡（俗忌）
  const HEKUI = "亥午丑申卯戌巳子未寅酉辰";       // 河魁（俗忌）
  const PUHU = "申寅酉卯戌辰亥巳子午丑未";        // 普護（協紀 卷六 歴例）
  const YANGDE = "戌子寅辰午申";                  // 陽德 正月戌 順行六陽辰
  const YINDE = "酉未巳卯丑亥";                   // 陰德 正月酉 逆行六陰辰
  const TUFU = "丑巳酉寅午戌卯未亥辰申子";        // 土符（協紀 卷六 歴例）
  // 地囊：協紀 卷六。民間の歴例の表と、協紀が直した表
  const DINANG_FOLK = [["庚子", "庚午"], ["癸未", "癸丑"], ["甲子", "甲寅"], ["己卯", "己丑"], ["戊辰", "戊午"], ["癸未", "癸巳"],
    ["丙寅", "丙申"], ["丁卯", "丁巳"], ["戊辰", "戊子"], ["庚戌", "庚子"], ["辛未", "辛酉"], ["乙酉", "乙未"]];
  const DINANG_XJ = [["庚子", "庚午"], ["乙未", "癸丑"], ["甲子", "壬午"], ["己卯", "己酉"], ["壬戌", "甲辰"], ["丙辰", "丙戌"],
    ["丁巳", "丁亥"], ["丙寅", "丙申"], ["辛丑", "辛未"], ["戊寅", "戊申"], ["辛卯", "辛酉"], ["癸酉", "乙卯"]];
  function sanheGroup(mb) { return [2, 6, 10].indexOf(mb) >= 0 ? 0 : [8, 0, 4].indexOf(mb) >= 0 ? 1 : [5, 9, 1].indexOf(mb) >= 0 ? 2 : 3; }
  const YUEDE = "丙壬庚甲", YUEDE_HE = "辛丁乙己", YUEKONG = "壬丙甲庚";
  const YIMA = "申寅亥巳", YUESHA = "丑未辰戌", JIESHA = "亥巳寅申", ZAISHA = "子午卯酉";
  const TIANSHE = ["戊寅", "甲午", "戊申", "甲子"];
  const SIXIANG = ["丙丁", "戊己", "壬癸", "甲乙"];
  const SHIDE = "午辰子寅";
  const MUCANG = ["亥子", "寅卯", "辰戌丑未", "申酉"];
  const SIFEI = [["庚申", "辛酉"], ["壬子", "癸亥"], ["甲寅", "乙卯"], ["丙午", "丁巳"]];
  const SIJI = ["甲子", "丙子", "庚子", "壬子"];
  const SIQIONG = ["乙亥", "丁亥", "辛亥", "癸亥"];
  const TIANEN = w("甲子 乙丑 丙寅 丁卯 戊辰 己卯 庚辰 辛巳 壬午 癸未 己酉 庚戌 辛亥 壬子 癸丑");
  const BAZHUAN = w("甲寅 乙卯 丁未 己未 庚申 辛酉 癸丑");
  const WULU = w("甲辰 乙巳 丙申 丁亥 戊戌 己丑 庚辰 辛巳 壬申 癸亥");   // 無祿日（十惡大敗）
  const LIUHE = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  // 協紀 卷十「月建」「月厭」条の「諸事皆忌」の日（月の数字は節月、正月＝寅月）。
  const ALL_JI_DAYS = {
    "陰陽大會": "1甲戌 2乙酉 5丙午 6丁巳 7庚辰 8辛卯 11壬子 12癸亥",
    "陰陽小會": "2己卯 3戊辰 4己巳 5戊午 8己酉 9戊戌 10己亥 11戊子",
    "陰位": "3庚辰 9甲戌",
    "陰陽交破": "4癸亥 10丁巳",
    "陰陽擊衝": "5壬子 11丙午",
    "陽破陰衝": "6癸丑 12丁未",
    "陰道衝陽": "2己酉 8己卯",
    "三陰": "1辛酉 7乙卯",
    "絶陰": "4戊辰",
    "絶陽": "10戊戌"
  };

  const HUANGHEI = [
    { name: "青龍", yellow: true }, { name: "明堂", yellow: true }, { name: "天刑", yellow: false },
    { name: "朱雀", yellow: false }, { name: "金匱", yellow: true }, { name: "天德", yellow: true },
    { name: "白虎", yellow: false }, { name: "玉堂", yellow: true }, { name: "天牢", yellow: false },
    { name: "玄武", yellow: false }, { name: "司命", yellow: true }, { name: "勾陳", yellow: false }
  ];
  const QINGLONG_START = { 2: 0, 8: 0, 3: 2, 9: 2, 4: 4, 10: 4, 5: 6, 11: 6, 6: 8, 0: 8, 7: 10, 1: 10 };

  /** その日の神煞（表示用と判定用） */
  function gods(ctx) {
    const s = S[ctx.stem], b = B[ctx.branch], gz = s + b;
    const mb = ctx.monthBranch, mi = mod(mb - 2, 12), season = Math.floor(mi / 3), g = sanheGroup(mb);
    const hit = function (chars) { return chars.indexOf(s) >= 0 || chars.indexOf(b) >= 0; };
    const good = [], bad = [];
    if (hit(TIANDE[mi])) good.push("天德");
    if (hit(TIANDE_HE[mi])) good.push("天德合");
    if (s === YUEDE[g]) good.push("月德");
    if (s === YUEDE_HE[g]) good.push("月德合");
    if (gz === TIANSHE[season]) good.push("天赦");
    if (gz === TIANYUAN[mi]) good.push("天願");
    if (s === YUEEN[mi]) good.push("月恩");
    if (SIXIANG[season].indexOf(s) >= 0) good.push("四相");
    if (b === SHIDE[season]) good.push("時德");
    if (TIANEN.indexOf(gz) >= 0) good.push("天恩");
    if (b === "午申戌子寅辰"[mi % 6]) good.push("天馬");
    if (b === YIMA[g]) good.push("驛馬");
    if (s === YUEKONG[g]) good.push("月空");
    if (MUCANG[season].indexOf(b) >= 0) good.push("母倉");
    if (ctx.branch !== mb && sanheGroup(ctx.branch) === g) good.push("三合");
    if (LIUHE[mb] === ctx.branch) good.push("六合");
    if (b === YANGDE[mi % 6]) good.push("陽德");
    if (b === YINDE[mi % 6]) good.push("陰德");
    if (b === PUHU[mi]) good.push("普護");
    if (ctx.direct === "開") { good.push("時陽"); good.push("生氣"); }

    if (ctx.branch === mod(mb + 6, 12)) bad.push("月破");
    if (b === SHOUSI[mi]) bad.push("受死");
    if (ctx.siLi) bad.push("四離");
    if (ctx.siJue) bad.push("四絕");
    if (SIFEI[season].indexOf(gz) >= 0) bad.push("四廢");
    if (b === YUEYAN[mi]) { bad.push("月厭"); bad.push("地火"); }
    if (b === B[mod(B.indexOf(YUEYAN[mi]) + 6, 12)]) bad.push("厭對");
    if (b === YUESHA[g]) bad.push("月煞");
    if (b === JIESHA[g]) bad.push("劫煞");
    if (b === ZAISHA[g]) { bad.push("災煞"); bad.push("天火"); }
    if (b === YUEXING[mi]) bad.push("月刑");
    if (b === YUEHAI[mi]) bad.push("月害");
    if (b === "卯子酉午"[mi % 4]) bad.push("大時");
    if (b === "酉午卯子"[mi % 4]) bad.push("天吏");
    if (ctx.branch === mod(mb + 4, 12)) bad.push("死氣");
    if (b === WANGWANG[mi]) bad.push("往亡");
    if (b === "丑寅子"[mi % 3]) bad.push("歸忌");
    if (b === TIANZEI[mi]) bad.push("天賊");
    if (gz === SIJI[season]) bad.push("四忌");
    if (gz === SIQIONG[season]) bad.push("四窮");
    if (BAZHUAN.indexOf(gz) >= 0) bad.push("八專");
    if (b === "巳" || b === "亥") bad.push("重日");
    if (b === TUFU[mi]) bad.push("土符");
    if (DINANG_FOLK[mi].indexOf(gz) >= 0 || DINANG_XJ[mi].indexOf(gz) >= 0) bad.push("地囊");
    if (WULU.indexOf(gz) >= 0) bad.push("無祿");
    if (b === TIANGANG[mi]) bad.push("天罡");
    if (b === HEKUI[mi]) bad.push("河魁");
    if (b === "巳寅亥申"[mi % 4]) bad.push("遊禍");
    if (ctx.doyou) bad.push("土王用事");
    return { good: good, bad: bad, s: s, b: b, gz: gz, mb: mb, mi: mi, season: season, g: g,
      dinangFolk: DINANG_FOLK[mi].indexOf(gz) >= 0, dinangXj: DINANG_XJ[mi].indexOf(gz) >= 0 };
  }

  // =====================================================================
  // 協紀辨方書 卷十「宜忌」の判定
  // =====================================================================
  // 原典の事目 → このアプリの事目（御用だけの事目＝覃恩・肆赦など は使わない）
  const XJ_PHRASES = [
    ["上冊進表章", ["上冊受封", "上表章"]], ["上冊受封", ["上冊受封"]], ["上表章", ["上表章"]],
    ["施恩封拜", ["襲爵受封"]], ["襲爵受封", ["襲爵受封"]], ["臨政親民", ["臨政親民"]],
    ["上官赴任", ["上官"]], ["行幸遣使", ["出行"]], ["宴會", ["會親友"]], ["會親友", ["會親友"]],
    ["祭祀", ["祭祀"]], ["祈福", ["祈福"]], ["求嗣", ["求嗣"]], ["入學", ["入學"]], ["冠帶", ["冠笄"]],
    ["結婚姻", ["訂盟"]], ["納采問名", ["納采"]], ["嫁娶", ["嫁娶"]], ["進人口", ["進人口"]],
    ["般移", ["移徙"]], ["安牀", ["安床"]], ["解除", ["解除"]], ["沐浴", ["沐浴"]],
    ["整容剃頭", ["剃頭"]], ["剃頭", ["剃頭"]], ["整手足甲", ["整手足甲"]], ["求醫療病", ["求醫", "治病"]],
    ["裁製", ["裁衣"]], ["營建宮室", ["修造"]], ["修宮室", ["修造"]], ["興造動土", ["修造", "動土"]],
    ["豎柱上梁", ["豎柱", "上樑"]], ["築隄防", ["築隄防"]], ["修倉庫", ["修倉庫"]], ["經絡", ["經絡"]],
    ["醞釀", ["醞釀"]], ["開市", ["開市"]], ["立券交易", ["立券", "交易"]], ["立券", ["立券"]], ["交易", ["交易"]],
    ["納財", ["納財"]], ["開倉庫出貨財", ["開倉", "出貨財"]], ["修置產室", ["修置產室"]], ["置產室", ["修置產室"]],
    ["開渠穿井", ["開渠穿井"]], ["安碓磑", ["安碓磑"]], ["補垣塞穴", ["塞穴"]], ["掃舍宇", ["掃舍"]],
    ["修飾垣牆", ["修飾垣牆"]], ["平治道塗", ["平治道塗"]], ["破屋壞垣", ["拆卸"]], ["伐木", ["伐木"]],
    ["捕捉", ["捕捉"]], ["畋獵", ["畋獵"]], ["取魚", ["取魚"]], ["栽種", ["栽種"]], ["牧養", ["牧養"]],
    ["納畜", ["納畜"]], ["破土", ["破土"]], ["安葬", ["安葬"]], ["啟攢", ["啟鑽"]]
  ].sort(function (a, b) { return b[0].length - a[0].length; });
  function norm(t) {
    return t.replace(/宫/g, "宮").replace(/産/g, "產").replace(/壊/g, "壞").replace(/劵/g, "券").replace(/㑹/g, "會")
      .replace(/啓/g, "啟").replace(/醖/g, "醞").replace(/墻/g, "牆").replace(/補捉/g, "捕捉").replace(/册/g, "冊");
  }
  /** 原典の文字列（例「宜祭祀祈福求嗣…」）を事目の配列にする */
  function xj(text) {
    let t = norm(text);
    const out = [];
    XJ_PHRASES.forEach(function (p) {
      if (t.indexOf(p[0]) >= 0) {
        p[1].forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
        t = t.split(p[0]).join("／");
      }
    });
    return out;
  }
  const XJ_ALL = uniq(XJ_PHRASES.reduce(function (a, p) { return a.concat(p[1]); }, []));
  function except(list) { return XJ_ALL.filter(function (x) { return list.indexOf(x) < 0; }); }

  // 民用三十七事（卷十一）→ 憲宜に出す事目
  const XIAN_ITEMS = w("祭祀 上表章 上官 入學 冠笄 訂盟 會親友 嫁娶 進人口 出行 移徙 安床 沐浴 剃頭 治病 求醫 裁衣 " +
    "修造 動土 豎柱 上樑 經絡 開市 立券 交易 納財 修置產室 開渠穿井 安碓磑 掃舍 平治道塗 拆卸 伐木 捕捉 畋獵 栽種 牧養 破土 安葬 啟鑽");
  // 通書選擇六十事のうち民用三十七事にないもの → 協紀の段に出す事目
  const XIEJI_ROW_ITEMS = w("祈福 求嗣 上冊受封 襲爵受封 臨政親民 納采 解除 整手足甲 築隄防 修倉庫 醞釀 開倉 出貨財 塞穴 修飾垣牆 取魚 納畜");

  // ---- 宜（卷十「以上所宜」） ----
  const XJ_DE = xj("祭祀祈福求嗣上冊進表章施恩封拜宴㑹行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶般移解除求醫療病裁製營建宫室興造動土豎柱上梁修倉庫栽種牧養納畜安葬");
  const XJ_YI = {
    "天德": XJ_DE, "月德": XJ_DE, "天德合": XJ_DE, "月德合": XJ_DE, "天赦": XJ_DE,
    "月空": xj("上表章"),
    "天恩": xj("宴㑹"),
    "母倉": xj("納財栽種牧養納畜"),
    "天願": xj("祭祀祈福求嗣上册進表章施恩封拜宴㑹行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移裁製營建宮室興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財栽種牧養納畜安葬"),
    "月恩": xj("祭祀祈福求嗣施恩封拜宴㑹行幸遣使上官赴任臨政親民結婚姻納采問名般移解除求醫療病裁製修宮室興造動土豎柱上梁納財開倉庫出貨財栽種牧養"),
    "三合": xj("宴㑹結婚姻納采問名嫁娶進人口裁製修宮室興造動土豎柱上梁修倉庫經絡醞釀立劵交易納財安碓磑納畜"),
    "六合": xj("宴㑹結婚姻嫁娶進人口經絡醞釀立劵交易納財納畜安葬"),
    "驛馬": xj("行幸遣使般移"), "天馬": xj("行幸遣使般移"),
    "普護": xj("祭祀祈福")
  };
  XJ_YI["四相"] = XJ_YI["月恩"]; XJ_YI["時德"] = XJ_YI["月恩"];
  const XJ_DIRECT_YI = {
    "建": xj("施恩封拜行幸遣使上官赴任臨政親民"),
    "除": xj("解除沐浴整容剃頭整手足甲求醫療病掃舍宇施恩封拜行幸遣使上官赴任臨政親民"),
    "滿": xj("進人口裁製修倉庫經絡開市立劵交易納財開倉庫出貨財補垣塞穴祭祀祈福上册進表章宴㑹修宮室"),
    "平": xj("修飾垣墻平治道塗"),
    "定": xj("冠帶"),
    "執": xj("捕捉"),
    "破": xj("求醫療病破屋壞垣"),
    "危": xj("安牀"),
    "成": xj("入學般移築隄防開市施恩封拜宴㑹行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶求醫療病"),
    "收": xj("進人口納財捕捉納畜"),
    "開": xj("祭祀祈福求嗣上册進表章施恩封拜宴㑹入學行幸遣使上官赴任臨政親民般移解除求醫療病裁製修宫室興造動土豎柱上梁開市修置產室開渠穿井安碓磑栽種牧養"),
    "閉": xj("築隄防補垣塞穴")
  };
  const XJ_DIRECT_JI = { "開": xj("伐木畋獵取魚") };   // 開日の破土安葬啓攢は「不註忌」（鋪註條例）

  // ---- 忌（卷十「以上所忌」） ----
  const T_JIESHA = "祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除整容剃頭整手足甲求醫療病裁製營建宮室修宮室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置產室開渠穿井安碓磑補垣塞穴修飾垣墻破屋壞垣栽種牧養納畜破土安葬啟攢";
  const T_TUFU = "營建宮室修宮室築隄防興造動土修倉庫修置產室開渠穿井安碓磑修飾垣墻平治道塗破屋壞垣栽種破土";
  const XJ_JI = {
    "月建": xj("祈福求嗣上册進表章結婚姻納采問名解除整容剃頭整手足甲求醫療病營建宮室修宫室興造動土豎柱上梁修倉庫開倉庫出貨財修置產室破屋壞垣伐木栽種破土安葬啟攢" + T_TUFU),
    "月破": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀整容剃頭整手足甲裁製營建宫室修宫室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置產室開渠穿井安碓磑補垣塞穴修飾垣墻伐木栽種牧養納畜破土安葬啟攢"),
    "平日": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除求醫療病裁製營建宮室修宮室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置產室開渠穿井栽種牧養納畜破土安葬啟攢"),
    "收日": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶般移安牀解除求醫療病裁製營建宫室修宮室築隄防興造動土豎柱上梁經絡醞釀開市立劵交易開倉庫出貨財修置產室開渠穿井破土安葬啟攢"),
    "滿日": xj("施恩封拜上官赴任臨政親民結婚姻納采問名求醫療病"),
    "閉日": xj("上册進表章施恩封拜宴㑹行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀求醫療病營建宫室修宮室興造動土豎柱上梁開市開倉庫出貨財修置產室開渠穿井"),
    "劫煞": xj(T_JIESHA),
    "災煞": xj(T_JIESHA),
    "月煞": xj(T_JIESHA + "修倉庫開倉庫出貨財"),
    "月刑": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除整容剃頭整手足甲求醫療病裁製營建宫室修宫室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置產室開渠穿井安碓磑補垣塞穴修飾垣墻破屋壞垣栽種牧養納畜破土安葬啟攢"),
    "月害": xj("祈福求嗣上册進表章宴㑹結婚姻納采問名嫁娶進人口求醫療病修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財置産室牧養納畜破土安葬啟攢"),
    "月厭": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除整容剃頭整手足甲求醫療病裁製營建宮室修宮室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置産室開渠穿井安碓磑補垣塞穴修飾垣墻平治道塗破屋壞垣伐木栽種牧養納畜破土安葬啟攢"),
    "厭對": xj("嫁娶"),
    "大時": xj("祈福求嗣上册進表章施恩封拜冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除求醫療病營建宮室修宮室築隄防興造動土豎柱上梁修倉庫開市立劵交易納財開倉庫出貨財修置產室栽種牧養納畜"),
    "遊禍": xj("祈福求嗣解除求醫療病"),
    "天吏": xj("祈福求嗣上册進表章施恩封拜冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除求醫療病營建宫室修宫室築隄防興造動土豎柱上梁修倉庫開市立劵交易納財開倉庫出貨財修置産室栽種牧養納畜"),
    "死氣": xj("解除求醫療病修置産室栽種"),
    "四廢": xj("祈福求嗣上册進表章施恩封拜宴㑹冠帶行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶進人口般移安牀解除求醫療病裁製營建宫室修宫室築隄防興造動土豎柱上梁修倉庫經絡醞釀開市立劵交易納財開倉庫出貨財修置産室開渠穿井安碓磑補垣塞穴修飾垣墻栽種牧養納畜破土安葬啟攢"),
    "四忌": xj("結婚姻納采問名嫁娶安葬"),
    "四窮": xj("結婚姻納采問名嫁娶安葬進人口修倉庫開市立劵交易納財開倉庫出貨財"),
    "往亡": xj("上册進表章行幸遣使上官赴任臨政親民嫁娶進人口般移求醫療病捕捉畋獵取魚"),
    "歸忌": xj("般移"),
    "天賊": xj("行幸遣使修倉庫開倉庫出貨財"),
    "重日": xj("破土安葬啟攢"),
    "八專": xj("結婚姻納采問名嫁娶"),
    "土符": xj(T_TUFU), "地囊": xj(T_TUFU),
    "土王用事": xj("營建宫室修宫室築隄防興造動土修倉庫修置産室開渠穿井安碓磑修飾垣墻平治道塗破屋壊垣栽種破土"),
    "四離": except(xj("祭祀解除沐浴整容剃頭整手足甲補垣塞穴掃舍宇修飾垣牆平治道塗破屋壊垣伐木")),
    "無祿": except(xj("祭祀解除沐浴整容剃頭整手足甲掃舍宇修飾垣墻平治道塗破屋壞垣伐木"))
  };
  XJ_JI["四絕"] = XJ_JI["四離"];
  const MILD = xj("求醫療病");   // 「止忌安撫邊境選將訓兵出師求醫療病餘皆不忌」で残る事目
  // 百忌日（卷十末）
  const BAIJI_STEM = { "甲": "開倉庫出貨財", "乙": "栽種", "丁": "剃頭", "庚": "經絡", "辛": "醞釀", "壬": "開渠穿井" };
  const BAIJI_BRANCH = { "丑": "冠帶", "寅": "祭祀", "卯": "開渠穿井", "巳": "行幸遣使", "申": "安牀", "酉": "宴㑹", "亥": "嫁娶" };

  /**
   * 協紀の判定。各凶神の「特例」条文を、そのまま条件に書いた。
   * outcome: normal（如常例）/ cancel（吉凶相抵）/ mild（止忌…療病）/ army（止忌軍事）/ none（不忌）/ all（諸事皆忌）/ defer（ほかの条に従う）
   */
  function xiejiJudge(ctx, G) {
    const has = function (n) { return G.good.indexOf(n) >= 0 || G.bad.indexOf(n) >= 0; };
    const td = has("天德"), tdh = has("天德合"), yd = has("月德"), ydh = has("月德合");
    const de = td || tdh || yd || ydh;
    const deSY = de || has("天赦") || has("天願");
    const mb = G.mb, mnum = G.mi + 1;               // mnum: 節月の番号（正月＝寅月＝1）
    const meng = [2, 8, 5, 11].indexOf(mb) >= 0;    // 寅申巳亥月
    const zhong = [0, 6, 3, 9].indexOf(mb) >= 0;    // 子午卯酉月
    const jiM = !meng && !zhong;                     // 辰戌丑未月
    const isM = function (chars) { return chars.indexOf(B[mb]) >= 0; };
    const d = ctx.direct === "満" ? "滿" : ctx.direct === "収" ? "收" : ctx.direct;
    const entries = [];
    const add = function (name, outcome, why, ji) { entries.push({ name: name, outcome: outcome, why: why, ji: ji || XJ_JI[name] || [] }); };

    // 諸事皆忌の特定日（月建・月厭条）
    Object.keys(ALL_JI_DAYS).forEach(function (k) {
      if (w(ALL_JI_DAYS[k]).indexOf(mnum + G.gz) >= 0) add(k, "all", "卷十 月厭条: " + mnum + "月" + G.gz + "は" + k + "、諸事皆忌", []);
    });

    // 建除の凶日
    if (d === "建") {
      if (has("月刑") || has("月厭")) add("月建", "defer", "刑・厭に従う");
      else if (de || has("天赦") || has("月恩") || has("四相")) add("月建", "partial", "月建 與德・天赦・月恩・四相併: 止忌土事・伐木・栽種・破土", xj(T_TUFU + "伐木栽種破土"));
      else add("月建", "normal", "月建 如常例");
    }
    if (d === "破") {
      if (has("四廢")) add("月破", "all", "四廢 與月破併: 諸事皆忌", []);
      else if (isM("卯酉") && has("災煞") && has("月厭")) add("月破", "all", "卯酉月 月破值災煞又值月厭: 諸事皆忌", []);
      else if ((isM("子午") && has("災煞")) || (isM("未申") && has("月刑"))) {
        if (yd || tdh || ydh) add("月破", "normal", "月破 值災煞/月刑 與德併: 祭祀等は不忌、解除療病破屋は仍忌", XJ_JI["月破"].concat(xj("解除求醫療病破屋壞垣")));
        else add("月破", "all", "月破 值災煞/月刑 不與德併: 諸事皆忌", []);
      } else add("月破", "normal", "月破 如常例（德も化せず）");
    }
    if (d === "平") {
      if (isM("寅巳子")) add("平日", "defer", "月刑に従う");
      else if (jiM) add("平日", "defer", "月煞に従う");
      else if (isM("亥")) add("平日", "mild", "亥月平日 相日・時德・六合: 止忌軍事療病", MILD);
      else if (isM("申")) add("平日", de ? "mild" : "normal", "申月平日 值月害" + (de ? " 與德併: 止忌軍事療病" : " 如常例"), de ? MILD : null);
      else add("平日", ((isM("卯酉") && yd) || (isM("午") && ydh)) ? "cancel" : "normal", "子午卯酉月平日 值天吏");
    }
    if (d === "收") {
      if (meng) add("收日", "defer", "刼煞に従う");
      else if (isM("卯丑戌")) add("收日", "defer", "月刑に従う");
      else if (zhong) add("收日", ((isM("子午") && ydh) || (isM("酉") && yd)) ? "cancel" : "normal", "子午卯酉月收日 值大時");
      else add("收日", de ? "mild" : "normal", "辰未月收日" + (de ? " 與德合併: 止忌軍事療病" : " 如常例"), de ? MILD : null);
    }
    if (d === "滿") {
      if (jiM) add("滿日", "defer", "災煞に従う");
      else if (isM("巳亥")) add("滿日", "defer", "月厭に従う");
      else if (yd || tdh || ydh || has("月恩") || has("四相")) add("滿日", "none", "滿日 與德合・月恩・四相併: 不忌", []);
      else add("滿日", "normal", "滿日 如常例");
    }
    if (d === "閉") {
      if (meng) add("閉日", "defer", "月煞に従う");
      else add("閉日", deSY ? "cancel" : "normal", "閉日" + (deSY ? " 與德合赦願併: 吉凶相抵" : " 如常例"));
    }
    // 三煞
    if (has("劫煞")) {
      if (meng && isM("寅申")) add("劫煞", "mild", "寅申月收日 月令長生・六合: 止忌軍事療病", MILD);
      else if (meng) add("劫煞", de ? "mild" : "normal", "巳亥月收日 值月害" + (de ? " 與德併: 止忌軍事療病" : " 不與德併: 如常例"), de ? MILD : null);
      else if (jiM) add("劫煞", de ? "mild" : "cancel", "辰戌丑未月除日相日" + (de ? " 與德併: 止忌軍事療病" : " 不與德併: 吉凶相抵"), de ? MILD : null);
      else add("劫煞", (yd || ydh) ? "cancel" : "normal", "子午卯酉月執日" + ((yd || ydh) ? " 與月德併: 吉凶相抵" : " 如常例"));
    }
    if (has("災煞")) {
      if (meng) add("災煞", de ? "mild" : "cancel", "寅申巳亥月開日" + (de ? " 與德併: 止忌軍事療病" : " 不與德神併: 凡所忌者則不註宜（吉凶相抵）"), de ? MILD : null);
      else if (jiM) add("災煞", de ? "mild" : "normal", "辰戌丑未月滿日" + (de ? " 與德併: 止忌軍事療病" : " 如常例"), de ? MILD : null);
      else add("災煞", "defer", "子午卯酉月 破日は月破に従う");
    }
    if (has("月煞")) {
      if (isM("卯酉")) add("月煞", (yd || has("天願")) ? "mild" : "cancel", "卯酉月 六合", (yd || has("天願")) ? MILD : null);
      else if (isM("子午")) add("月煞", ydh ? "cancel" : "normal", "子午月 值月害");
      else add("月煞", de ? "normal" : "all", "寅申巳亥月閉日・辰戌丑未月平日" + (de ? " 與德併: 如常例" : " 不與德併: 諸事皆忌"), de ? null : []);
    }
    if (has("月刑")) {
      if (isM("巳")) add("月刑", (yd || tdh || has("天願")) ? "mild" : "cancel", "巳月平日相日六合", (yd || tdh || has("天願")) ? MILD : null);
      else if (isM("寅辰酉亥丑戌")) add("月刑", de ? "cancel" : "normal", "月刑" + (de ? " 與德併: 吉凶相抵" : " 如常例"));
      else if (isM("子卯未申")) add("月刑", de ? "normal" : "all", "月刑 凶又逢凶" + (de ? " 與德併: 如常例" : " 不與德併: 諸事皆忌"), de ? null : []);
      else add("月刑", "defer", "午月 月厭に従う");
    }
    if (has("月害")) {
      if (isM("子午")) add("月害", "defer", "月煞に従う");
      else if (isM("巳亥")) add("月害", "defer", "刼煞に従う");
      else if (isM("寅")) add("月害", "defer", "月刑に従う");
      else if (isM("申")) add("月害", "defer", "平日に従う");
      else if (isM("卯酉丑未")) add("月害", (td || yd) ? "mild" : "normal", "月害", (td || yd) ? MILD : null);
      else add("月害", (tdh || ydh) ? "cancel" : "normal", "辰戌月 閉日 月害");
    }
    if (has("月厭")) {
      if (isM("子午")) add("月厭", has("天赦") ? "normal" : "all", "子午月 厭建會" + (has("天赦") ? " 與天赦併: 如常例" : ": 諸事皆忌"), has("天赦") ? null : []);
      else if (isM("卯酉")) add("月厭", "all", "卯酉月 月厭值月破災煞: 諸事皆忌", []);
      else if (isM("寅申丑未")) add("月厭", (yd || tdh || ydh) ? "partial" : "normal", "月厭",
        (yd || tdh || ydh) ? xj("行幸遣使上官赴任臨政親民結婚姻納采問名嫁娶求醫療病般移栽種") : null);
      else add("月厭", (td || yd || ydh) ? "cancel" : "normal", "辰戌月定日・巳亥月滿日 月厭");
    }
    if (has("厭對") && !(de || has("天赦"))) add("厭對", "normal", "厭對 忌嫁娶");
    if (has("大時")) {
      if (meng || isM("辰戌")) add("大時", "army", "大時 止忌軍事", []);
      else if (isM("丑未")) add("大時", (td || yd) ? "army" : "normal", "丑未月執日 大時", (td || yd) ? [] : null);
      else add("大時", "defer", "收日に従う");
    }
    if (has("天吏")) {
      if (meng) add("天吏", de ? "mild" : "normal", "寅申巳亥月危日 天吏", de ? MILD : null);
      else if (jiM) add("天吏", deSY ? "cancel" : "normal", "辰戌丑未月閉日 天吏");
      else add("天吏", "defer", "平日に従う");
    }
    if (has("死氣")) add("死氣", de ? "mild" : "normal", "死氣", de ? MILD : null);
    if (has("四廢") && d !== "破") add("四廢", "normal", "四廢（與德合併猶忌）");
    ["遊禍", "四忌", "四窮", "往亡", "歸忌", "天賊", "土符", "土王用事", "四離", "四絕"].forEach(function (n) {
      if (has(n)) add(n, "normal", n + "（與德合赦願併猶忌）");
    });
    if (G.dinangXj) add("地囊", "normal", "地囊（協紀の表）");
    if (has("重日") && !(de || has("天赦") || has("六合"))) add("重日", "normal", "重日 忌破土安葬啟攢");
    if (has("八專") && !has("天願")) add("八專", "normal", "八專");
    if (has("無祿") && !(td || yd)) add("無祿", "normal", "無祿日: 止註祭祀解除沐浴…餘事不註");
    const bj = [];
    if (BAIJI_STEM[G.s]) bj.push(BAIJI_STEM[G.s]);
    if (BAIJI_BRANCH[G.b]) bj.push(BAIJI_BRANCH[G.b]);
    if (bj.length) add("百忌日", "normal", G.s + "日・" + G.b + "日の百忌", xj(bj.join("")));

    // 宜
    let yi = [];
    G.good.forEach(function (n) { (XJ_YI[n] || []).forEach(function (x) { yi.push(x); }); });
    (XJ_DIRECT_YI[d] || []).forEach(function (x) { yi.push(x); });
    if (G.b === "亥" || G.b === "子") yi.push("沐浴");
    // 修倉庫（母倉・六合と月恩四相時德／開日、收日と月恩四相時德、德合赦願）
    const ens = has("月恩") || has("四相") || has("時德");
    if ((has("母倉") && (has("月恩") || has("四相") || d === "開")) || (has("六合") && ens) || (d === "收" && ens)) yi.push("修倉庫");
    // 季節（節月で近似）
    if ((d === "危") && [11, 0, 1].indexOf(mb) >= 0) yi.push("伐木");
    if ((d === "執" || d === "危" || d === "收") && [11, 0, 1].indexOf(mb) >= 0) yi.push("畋獵");
    if ((d === "執" || d === "危" || d === "收") && [3, 4].indexOf(mb) >= 0) yi.push("取魚");
    yi = uniq(yi);

    let ji = [];
    (XJ_DIRECT_JI[d] || []).forEach(function (x) { ji.push(x); });
    if (de || has("天赦")) xj("畋獵取魚").forEach(function (x) { ji.push(x); });
    const allJi = entries.some(function (e) { return e.outcome === "all"; });
    entries.forEach(function (e) {
      if (e.outcome === "defer" || e.outcome === "none" || e.outcome === "army") return;
      e.ji.forEach(function (x) { ji.push(x); });
    });
    ji = uniq(ji);
    const finalYi = allJi ? [] : yi.filter(function (x) { return ji.indexOf(x) < 0; });
    const order = function (arr) { return ITEMS.filter(function (x) { return arr.indexOf(x) >= 0; }); };
    const xian = order(finalYi.filter(function (x) { return XIAN_ITEMS.indexOf(x) >= 0; }));
    // 憲宜は 求醫・治病 を「療病」1つで出すので、表示は 治病 にまとめる
    const xianShown = xian.filter(function (x) { return x !== "求醫" || xian.indexOf("治病") < 0; });
    const row = order(finalYi.filter(function (x) { return XIEJI_ROW_ITEMS.indexOf(x) >= 0; }));
    const main = entries.filter(function (e) { return e.outcome !== "defer"; });
    return {
      allJi: allJi,
      yi: order(finalYi),
      ji: order(ji),
      xianYi: xianShown,
      row: row,
      buqu: row.length === 0,
      rules: main.map(function (e) { return { god: e.name, outcome: e.outcome, why: e.why }; })
    };
  }

  // =====================================================================
  // 通宜（民間の通書）
  // =====================================================================
  const DIRECT_RULES = {
    "建": { yi: w("出行 冠笄 會親友 祈福"), ji: w("動土 破土 開倉 出貨財 安葬 啟鑽 嫁娶 栽種") },
    "除": { yi: w("解除 沐浴 求醫 治病 掃舍 祭祀"), ji: w("出貨財 嫁娶 移徙 入宅") },
    "滿": { yi: w("祭祀 祈福 進人口 納財 開市 交易 立券 牧養 納畜"), ji: w("栽種 動土 破土 安葬 求醫 治病") },
    "平": { yi: w("平治道塗 塞穴"), ji: w("開渠穿井") },
    "定": { yi: w("祭祀 祈福 冠笄 嫁娶 訂盟 納采 會親友 交易 立券 進人口 納畜 修造 動土 入宅 安床"), ji: w("出行 求醫 治病") },
    "執": { yi: w("捕捉 畋獵 祭祀 祈福 嫁娶 訂盟 納采 立券 修造 動土 栽種"), ji: w("出行 開市 移徙 入宅 出貨財 開倉") },
    "破": { yi: w("拆卸 求醫 治病"), ji: ITEMS.filter(function (x) { return ["拆卸", "求醫", "治病"].indexOf(x) < 0; }) },
    "危": { yi: w("祭祀 祈福 安床 納畜"), ji: w("出行 嫁娶 移徙 入宅") },
    "成": { yi: w("祭祀 祈福 求嗣 出行 冠笄 嫁娶 訂盟 納采 移徙 入宅 安床 修造 動土 開市 交易 立券 納財 栽種 納畜 會親友 進人口 入學"), ji: [] },
    "收": { yi: w("納財 捕捉 畋獵 栽種 納畜 進人口"), ji: w("出行 安葬 啟鑽 求醫 治病 開市") },
    // 開日：v2 の宜に、通書の建除歌「開日宜祭祀祈福入學上任修造動土開市安床交易出行豎柱」の 上官（上任）・安床・修造・動土・豎柱 を足した
    "開": { yi: w("祭祀 祈福 求嗣 出行 冠笄 嫁娶 訂盟 納采 移徙 入宅 解除 裁衣 開市 交易 立券 納財 栽種 牧養 求醫 治病 會親友 進人口 上官 入學 安床 修造 動土 豎柱"), ji: w("安葬 破土") },
    "閉": { yi: w("塞穴 安葬 築隄防"), ji: w("出行 開市 開倉 出貨財 求醫 治病 嫁娶 移徙 入宅") }
  };
  DIRECT_RULES["満"] = DIRECT_RULES["滿"];
  DIRECT_RULES["収"] = DIRECT_RULES["收"];

  const DE_YI = w("祭祀 祈福 求嗣 出行 訂盟 納采 冠笄 裁衣 嫁娶 移徙 入宅 安床 會親友 進人口 解除 沐浴 求醫 治病 修造 動土 豎柱 上樑 開市 交易 立券 納財 栽種 牧養 納畜 安葬 掃舍 上官");
  const DE_JI = w("畋獵 捕捉");
  const GOOD = {
    "天德": { yi: DE_YI, ji: DE_JI, de: true },
    "天德合": { yi: DE_YI, ji: DE_JI, de: true },
    "月德": { yi: DE_YI, ji: DE_JI, de: true },
    "月德合": { yi: DE_YI, ji: DE_JI, de: true },
    "天赦": { yi: DE_YI, ji: DE_JI, de: true },
    "天願": { yi: DE_YI, ji: DE_JI, de: true },
    "月恩": { yi: w("祭祀 嫁娶 移徙 入宅 修造 動土 納財 上官") },
    "四相": { yi: w("修造 動土 栽種 移徙 入宅 出行 上官") },
    "時德": { yi: w("祈福 會親友") },
    "天恩": { yi: w("祭祀 會親友") },
    "天馬": { yi: w("出行") },
    "驛馬": { yi: w("出行 移徙") },
    "月空": { yi: w("修造 動土") },
    "母倉": { yi: w("栽種 牧養 納畜") },
    "三合": { yi: w("嫁娶 訂盟 納采 會親友 開市 交易 立券 修造 動土 進人口") },
    "六合": { yi: w("嫁娶 訂盟 納采 會親友 開市 交易 立券 進人口") },
    "普護": { yi: w("祭祀 祈福") }
  };
  const BUILD = w("修造 動土 豎柱 上樑 破土");
  const BUILD_SUB = w("起基 定磉 拆卸 造倉庫");
  // 修造を止めても、細目（起基・定磉・拆卸・造倉庫）までは止めない凶神
  const BUILD_LIGHT = w("天火 地囊 災煞 劫煞 月煞");
  const BAD = {
    "月厭": { ji: w("出行 嫁娶 訂盟 納采 移徙 入宅 會親友 進人口") },
    "厭對": { ji: w("嫁娶 訂盟 納采 進人口") },
    "月煞": { ji: BUILD.concat(w("開市 交易 立券 納財 開倉 出貨財")), soft: true },
    "劫煞": { ji: BUILD.concat(w("開倉 出貨財")), soft: true },
    "災煞": { ji: BUILD.concat(w("開倉 出貨財")), soft: true },
    "月刑": { ji: w("祈福 求嗣 會親友 訂盟 納采 嫁娶 進人口 移徙 入宅 安床 修造 動土 豎柱 上樑 開市 交易 立券 納財 開倉 出貨財 栽種 牧養 納畜 破土 安葬 啟鑽 求醫 治病 解除 祭祀") },
    "月害": { ji: w("祈福 求嗣 會親友 嫁娶 訂盟 納采 進人口 求醫 治病"), soft: true },
    "大時": { ji: w("出行 嫁娶 移徙 入宅 修造 動土 開市") },
    "天吏": { ji: w("出行 求醫 治病"), soft: true },
    "往亡": { ji: w("出行 嫁娶 移徙 入宅 進人口 求醫 治病 捕捉 畋獵") },
    "歸忌": { ji: w("移徙 入宅 嫁娶 進人口") },
    "天賊": { ji: w("出行 開倉 出貨財") },
    "天火": { ji: w("修造 豎柱 上樑") },
    "地火": { ji: w("栽種 動土 破土 修造") },
    "地囊": { ji: w("修造 動土 破土 栽種 開渠穿井") },
    "四忌": { ji: w("嫁娶 安葬 進人口") },
    "四窮": { ji: w("嫁娶 安葬 進人口 納財 開市") },
    "八專": { ji: w("嫁娶") },
    "重日": { ji: w("安葬 破土") },
    "天罡": { ji: w("修造 動土 嫁娶 移徙 入宅"), soft: true },
    "河魁": { ji: w("修造 動土 嫁娶 移徙 入宅"), soft: true },
    "遊禍": { ji: w("祈福 求醫 治病"), soft: true },
    "土王用事": { ji: w("動土 破土 修造 安葬") }
  };
  // 通宜も不取（空）にする日／少しだけ出す日
  const TONG_BUQU = { "受死": "日值受死 不取", "四廢": "日值四廢 不取" };
  const TONG_FEW = {
    "月破": { why: "日值月破 大事勿用（破屋・療病だけ）", keep: w("拆卸 求醫 治病") },
    "四離": { why: "日值四離 大事勿用", keep: w("祭祀 解除 沐浴 剃頭 掃舍 平治道塗 拆卸 塞穴") },
    "四絕": { why: "日值四絕 大事勿用", keep: w("祭祀 解除 沐浴 剃頭 掃舍 平治道塗 拆卸 塞穴") }
  };

  function tongJudge(ctx, G, X) {
    const dr = DIRECT_RULES[ctx.direct] || { yi: [], ji: [] };
    const congquan = X.allJi;   // 憲協均少取 → 通宜は建除の宜だけ（從權取用）
    const yiSet = {}, jiSrc = {};
    const addJi = function (x, src) { (jiSrc[x] = jiSrc[x] || []).push(src); };
    dr.yi.forEach(function (x) { yiSet[x] = true; });
    dr.ji.forEach(function (x) { addJi(x, "建除:" + ctx.direct); });
    G.good.forEach(function (n) {
      if (!GOOD[n]) return;
      if (!congquan) GOOD[n].yi.forEach(function (x) { yiSet[x] = true; });
      (GOOD[n].ji || []).forEach(function (x) { addJi(x, n); });
    });
    G.bad.forEach(function (n) {
      if (n === "地囊" && !G.dinangFolk) return;   // 通宜は民間（歴例）の地囊の表
      if (!BAD[n]) return;
      BAD[n].ji.forEach(function (x) { addJi(x, n); });
    });
    const hasDe = G.good.some(function (n) { return GOOD[n] && GOOD[n].de; });
    // 三煞が協紀で「如常例」（德で化されない）日は、協紀の忌（忌同月破）を通宜にも当てる
    X.rules.forEach(function (r) {
      if (["劫煞", "災煞", "月煞"].indexOf(r.god) >= 0 && r.outcome === "normal" && !hasDe) {
        XJ_JI[r.god].forEach(function (x) { addJi(x, "協紀:" + r.god); });
      }
    });
    if (hasDe) {
      Object.keys(jiSrc).forEach(function (x) {
        if (jiSrc[x].every(function (src) { return BAD[src] && BAD[src].soft; })) delete jiSrc[x];
      });
    }
    // 修造の細目
    if (yiSet["修造"]) {
      const src = jiSrc["修造"] || [];
      const heavy = src.filter(function (s) { return BUILD_LIGHT.indexOf(s) < 0; });
      ["起基", "定磉", "拆卸"].forEach(function (x) { yiSet[x] = true; });
      if (heavy.length) ["起基", "定磉", "拆卸", "造倉庫"].forEach(function (x) { heavy.forEach(function (s) { addJi(x, s); }); });
    }
    const has = function (n) { return G.good.indexOf(n) >= 0; };
    const ens = has("月恩") || has("四相") || has("時德");
    if (!congquan && ((has("母倉") && (has("月恩") || has("四相") || ctx.direct === "開")) || (has("六合") && ens) ||
        ((ctx.direct === "收" || ctx.direct === "収") && ens) || hasDe)) {
      if (!(jiSrc["修造"] || []).some(function (s) { return BUILD_LIGHT.indexOf(s) < 0; })) yiSet["造倉庫"] = true;
    }
    let yi = ITEMS.filter(function (x) { return yiSet[x] && !jiSrc[x]; });
    // 同類の事目
    const fam = { "祈福": w("齋醮 酬神 開光 塑繪"), "嫁娶": w("納婿"), "納采": w("問名"), "上官": w("赴任") };
    Object.keys(fam).forEach(function (k) { if (yi.indexOf(k) >= 0) fam[k].forEach(function (x) { if (!jiSrc[x]) yi.push(x); }); });

    const buquReasons = [];
    G.bad.forEach(function (n) { if (TONG_BUQU[n]) buquReasons.push(TONG_BUQU[n]); });
    const few = G.bad.filter(function (n) { return TONG_FEW[n]; });
    const buqu = buquReasons.length > 0;
    if (buqu) yi = [];
    else if (few.length) {
      few.forEach(function (n) {
        buquReasons.push(TONG_FEW[n].why);
        yi = yi.filter(function (x) { return TONG_FEW[n].keep.indexOf(x) >= 0; });
      });
    }
    if (yi.indexOf("出行") >= 0) {
      yi.push("交車");
      if (yi.indexOf("交易") >= 0 || yi.indexOf("立券") >= 0 || yi.indexOf("納財") >= 0) yi.push("買車");
    }
    yi = ITEMS.filter(function (x) { return yi.indexOf(x) >= 0; });
    const ji = ITEMS.filter(function (x) { return jiSrc[x] && yi.indexOf(x) < 0; });
    return { yi: yi, ji: ji, jiSources: jiSrc, buqu: buqu, few: few.length > 0 && !buqu, buquReasons: buquReasons, congquan: congquan };
  }

  /**
   * ctx: { stem, branch, index(六十干支 0=甲子), monthBranch, direct("建"…), doyou(bool), siLi(bool), siJue(bool) }
   */
  function compute(ctx) {
    const G = gods(ctx);
    const X = xiejiJudge(ctx, G);
    const T = tongJudge(ctx, G, X);
    const hh = HUANGHEI[mod(ctx.branch - QINGLONG_START[G.mb], 12)];
    const clashIdx = mod(ctx.index - 6, 60);
    const clash = { gz: S[clashIdx % 10] + B[clashIdx % 12], branch: clashIdx % 12, animal: ZODIAC[clashIdx % 12], animalJa: ZODIAC_JA[clashIdx % 12] };
    const shaDir = ["南", "東", "北", "西"][mod(ctx.branch, 4)];
    return {
      // 通宜（用途選びに使う。v2 と同じ名前で返す）
      yi: T.yi, ji: T.ji, jiSources: T.jiSources, buqu: T.buqu, buquReasons: T.buquReasons,
      tongYi: T.yi, tongJi: T.ji, tongFew: T.few, congquan: T.congquan,
      // 憲宜・協紀
      xianYi: X.xianYi, xianBuqu: X.xianYi.length === 0,
      xiejiYi: X.row, xiejiBuqu: X.buqu, xiejiAllJi: X.allJi, xiejiAll: X.yi, xiejiJi: X.ji, xiejiRules: X.rules,
      goodGods: G.good, badGods: G.bad, huanghei: hh, clash: clash, shaDir: shaDir
    };
  }

  /** 用途（日本語）→ 通書の事目。any: どれかが通宜で、どれも忌でない日を選ぶ */
  const PURPOSES = [
    { id: "drive", label: "ドライブ・旅行", items: ["出行"], lead: "出行（出かける）が宜の日" },
    { id: "move", label: "引っ越し", items: ["移徙", "入宅"], lead: "移徙・入宅が宜の日" },
    { id: "jichinsai", label: "地鎮祭・着工", items: ["動土"], lead: "動土が宜の日" },
    { id: "build", label: "家の工事・リフォーム", items: ["修造"], lead: "修造が宜の日" },
    { id: "kiso", label: "基礎・礎石", items: ["起基", "定磉"], lead: "起基・定磉が宜の日" },
    { id: "demolish", label: "解体・取り壊し", items: ["拆卸"], lead: "拆卸が宜の日" },
    { id: "joto", label: "上棟", items: ["上樑", "豎柱"], lead: "上樑・豎柱が宜の日" },
    { id: "wedding", label: "結婚", items: ["嫁娶"], lead: "嫁娶が宜の日" },
    { id: "yuino", label: "婚約・結納", items: ["訂盟", "納采"], lead: "訂盟・納采が宜の日" },
    { id: "open", label: "開業・開店", items: ["開市"], lead: "開市が宜の日" },
    { id: "contract", label: "契約", items: ["立券", "交易"], lead: "立券・交易が宜の日" },
    { id: "car", label: "納車", items: ["交車"], lead: "交車が宜の日" },
    { id: "buycar", label: "車を買う", items: ["買車"], lead: "買車が宜の日" },
    { id: "pray", label: "お参り・祈願", items: ["祈福", "祭祀"], lead: "祈福・祭祀が宜の日" },
    { id: "medical", label: "治療・通院の始め", items: ["求醫", "治病"], lead: "求醫・治病が宜の日" },
    { id: "bed", label: "寝具・ベッドを替える", items: ["安床"], lead: "安床が宜の日" },
    { id: "garden", label: "庭・畑に植える", items: ["栽種"], lead: "栽種が宜の日" },
    { id: "burial", label: "納骨・埋葬", items: ["安葬"], lead: "安葬が宜の日" }
  ];

  /**
   * 用途の判定。まず通宜で見る。協紀不取の日は印（xiejiBuqu）を付けて残す。
   * opts.excludeXiejiBuqu=true なら、協紀不取の日は外す。
   */
  function judge(day, purpose, opts) {
    const o = opts || {};
    if (day.buqu) return { ok: false, why: day.buquReasons.join("・") };
    const badItems = purpose.items.filter(function (x) { return day.ji.indexOf(x) >= 0 && day.yi.indexOf(x) < 0; });
    const goodItems = purpose.items.filter(function (x) { return day.yi.indexOf(x) >= 0; });
    if (!goodItems.length) {
      if (badItems.length) return { ok: false, why: "忌に「" + badItems.join("・") + "」" };
      return { ok: false, why: day.tongFew ? day.buquReasons.join("・") : "通宜に入っていない" };
    }
    if (day.xiejiBuqu && o.excludeXiejiBuqu) return { ok: false, why: "協紀不取（設定で外しています）", xiejiBuqu: true };
    return { ok: true, items: goodItems, xiejiBuqu: !!day.xiejiBuqu };
  }

  return {
    ITEMS: ITEMS, ITEM_NOTE: ITEM_NOTE, DIRECT_RULES: DIRECT_RULES, GOOD: GOOD, BAD: BAD,
    XIAN_ITEMS: XIAN_ITEMS, XIEJI_ROW_ITEMS: XIEJI_ROW_ITEMS,
    PURPOSES: PURPOSES, HUANGHEI: HUANGHEI, ZODIAC: ZODIAC, ZODIAC_JA: ZODIAC_JA,
    compute: compute, judge: judge
  };
});
