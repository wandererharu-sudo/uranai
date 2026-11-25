/**
 * 暦の基本表（十干・十二支・十二直・六曜・二十八宿）。
 * 宜忌の判定は almanac.js。六曜は日本の俗信なので判定には使わず、参考として表示だけする。
 *
 * - 十二直 … 節月と同じ十二支の日を建とし、建除満平定執破危成収開閉。
 *   節入りの日は前日と同じ直が繰り返される。協紀辨方書 卷六「建除」。
 * - 六曜（参考）… （旧暦の月 + 日）を 6 で割った余り。0大安 1赤口 2先勝 3友引 4先負 5仏滅。
 * - 冲 … 子↔午、丑↔未、寅↔申、卯↔酉、辰↔戌、巳↔亥。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TakujitsuRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const STEM_YOMI = ["きのえ", "きのと", "ひのえ", "ひのと", "つちのえ", "つちのと", "かのえ", "かのと", "みずのえ", "みずのと"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const BRANCH_YOMI = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];

  const DIRECTS = [
    { name: "建", yomi: "たつ" },
    { name: "除", yomi: "のぞく" },
    { name: "満", yomi: "みつ" },
    { name: "平", yomi: "たいら" },
    { name: "定", yomi: "さだん" },
    { name: "執", yomi: "とる" },
    { name: "破", yomi: "やぶる" },
    { name: "危", yomi: "あやぶ" },
    { name: "成", yomi: "なる" },
    { name: "収", yomi: "おさむ" },
    { name: "開", yomi: "ひらく" },
    { name: "閉", yomi: "とじる" }
  ];

  const ROKUYO = [
    { name: "大安", yomi: "たいあん" },
    { name: "赤口", yomi: "しゃっこう" },
    { name: "先勝", yomi: "せんしょう" },
    { name: "友引", yomi: "ともびき" },
    { name: "先負", yomi: "せんぷ" },
    { name: "仏滅", yomi: "ぶつめつ" }
  ];

  const MANSIONS = ["角", "亢", "氐", "房", "心", "尾", "箕", "斗", "牛", "女", "虚", "危", "室", "壁", "奎", "婁", "胃", "昴", "畢", "觜", "参", "井", "鬼", "柳", "星", "張", "翼", "軫"];
  const MANSION_YOMI = ["かく", "こう", "てい", "ぼう", "しん", "び", "き", "と", "ぎゅう", "じょ", "きょ", "き", "しつ", "へき", "けい", "ろう", "い", "ぼう", "ひつ", "し", "さん", "せい", "き", "りゅう", "せい", "ちょう", "よく", "しん"];

  /** 土用の間日の日支（土用の期間を出すのに calendar.js が使う） */
  const MABI_TABLE = { winter: [2, 3, 5], spring: [5, 6, 9], summer: [3, 4, 8], autumn: [7, 10, 11] };

  const CLASH = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };

  const MONTH_NAME = {
    2: "寅月", 3: "卯月", 4: "辰月", 5: "巳月", 6: "午月", 7: "未月",
    8: "申月", 9: "酉月", 10: "戌月", 11: "亥月", 0: "子月", 1: "丑月"
  };

  const DISCLAIMER = "擇日は伝統的な暦の考え方による参考です。最後はご都合と気持ちで決めてください。";

  return {
    STEMS: STEMS,
    STEM_YOMI: STEM_YOMI,
    BRANCHES: BRANCHES,
    BRANCH_YOMI: BRANCH_YOMI,
    DIRECTS: DIRECTS,
    ROKUYO: ROKUYO,
    MANSIONS: MANSIONS,
    MANSION_YOMI: MANSION_YOMI,
    CLASH: CLASH,
    MONTH_NAME: MONTH_NAME,
    MABI: MABI_TABLE,
    DISCLAIMER: DISCLAIMER
  };
});
