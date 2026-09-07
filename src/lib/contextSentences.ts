import type { ConjugationFormId } from "./types";

export interface TextSegment {
  text: string;
  reading?: string; // present only for kanji segments, rendered as furigana
}

export interface ContextSentence {
  id: string;
  hiragana: string; // looks up the verb in VERBS by its ます形-entry hiragana headword
  dictHint: string; // dictionary-form hint shown in parentheses, as in textbooks
  formId: ConjugationFormId;
  beforeSegments: TextSegment[]; // sentence text before the blank
  afterSegments: TextSegment[]; // sentence text after the blank
  translationVn: string;
}

// Every `hiragana` here must exist in みんなの日本語 (verbData) so conjugate()
// can derive the real answer — see findVerb() in lib/verbData.ts.
export const CONTEXT_SENTENCES: ContextSentence[] = [
  {
    id: "te-1",
    hiragana: "のむ",
    dictHint: "飲む",
    formId: "te",
    beforeSegments: [{ text: "コーヒーを" }],
    afterSegments: [{ text: "、" }, { text: "宿題", reading: "しゅくだい" }, { text: "をします。" }],
    translationVn: "Uống cà phê xong rồi làm bài tập.",
  },
  {
    id: "te-2",
    hiragana: "あらう",
    dictHint: "洗う",
    formId: "te",
    beforeSegments: [{ text: "手", reading: "て" }, { text: "を" }],
    afterSegments: [
      { text: "、ご" },
      { text: "飯", reading: "はん" },
      { text: "を" },
      { text: "食", reading: "た" },
      { text: "べます。" },
    ],
    translationVn: "Rửa tay xong rồi ăn cơm.",
  },
  {
    id: "nai-1",
    hiragana: "くる",
    dictHint: "来る",
    formId: "nai",
    beforeSegments: [
      { text: "危", reading: "あぶ" },
      { text: "ないですから、ここに" },
    ],
    afterSegments: [{ text: "でください。" }],
    translationVn: "Vì nguy hiểm nên xin đừng đến đây.",
  },
  {
    id: "nai-2",
    hiragana: "やすむ",
    dictHint: "休む",
    formId: "nai",
    beforeSegments: [{ text: "今日", reading: "きょう" }, { text: "は" }],
    afterSegments: [
      { text: "で、" },
      { text: "学校", reading: "がっこう" },
      { text: "へ" },
      { text: "行", reading: "い" },
      { text: "きます。" },
    ],
    translationVn: "Hôm nay không nghỉ, sẽ đi học.",
  },
  {
    id: "dict-1",
    hiragana: "べんきょうする",
    dictHint: "勉強する",
    formId: "dictionary",
    beforeSegments: [
      { text: "私", reading: "わたし" },
      { text: "は" },
      { text: "日本語", reading: "にほんご" },
      { text: "を" },
    ],
    afterSegments: [{ text: "ことが" }, { text: "好", reading: "す" }, { text: "きです。" }],
    translationVn: "Tôi thích việc học tiếng Nhật.",
  },
  {
    id: "dict-2",
    hiragana: "よむ",
    dictHint: "読む",
    formId: "dictionary",
    beforeSegments: [
      { text: "毎朝", reading: "まいあさ" },
      { text: "、" },
      { text: "新聞", reading: "しんぶん" },
      { text: "を" },
    ],
    afterSegments: [{ text: "ことにしています。" }],
    translationVn: "Tôi có thói quen đọc báo mỗi sáng.",
  },
  {
    id: "ta-1",
    hiragana: "てつだう",
    dictHint: "手伝う",
    formId: "ta",
    beforeSegments: [
      { text: "昨日", reading: "きのう" },
      { text: "、" },
      { text: "友達", reading: "ともだち" },
      { text: "を" },
    ],
    afterSegments: [{ text: "。" }],
    translationVn: "Hôm qua đã giúp bạn.",
  },
  {
    id: "ta-2",
    hiragana: "かう",
    dictHint: "買う",
    formId: "ta",
    beforeSegments: [
      { text: "先週", reading: "せんしゅう" },
      { text: "、" },
      { text: "新", reading: "あたら" },
      { text: "しい" },
      { text: "本", reading: "ほん" },
      { text: "を" },
    ],
    afterSegments: [{ text: "。" }],
    translationVn: "Tuần trước đã mua một quyển sách mới.",
  },
  {
    id: "potential-1",
    hiragana: "よむ",
    dictHint: "読む",
    formId: "potential",
    beforeSegments: [
      { text: "私", reading: "わたし" },
      { text: "は" },
      { text: "漢字", reading: "かんじ" },
      { text: "を" },
    ],
    afterSegments: [{ text: "。" }],
    translationVn: "Tôi có thể đọc chữ Hán.",
  },
  {
    id: "potential-2",
    hiragana: "はなす",
    dictHint: "話す",
    formId: "potential",
    beforeSegments: [
      { text: "彼", reading: "かれ" },
      { text: "は" },
      { text: "日本語", reading: "にほんご" },
      { text: "を" },
      { text: "上手", reading: "じょうず" },
      { text: "に" },
    ],
    afterSegments: [{ text: "。" }],
    translationVn: "Anh ấy có thể nói tiếng Nhật giỏi.",
  },
  {
    id: "volitional-1",
    hiragana: "たべる",
    dictHint: "食べる",
    formId: "volitional",
    beforeSegments: [
      { text: "みんなで" },
      { text: "晩", reading: "ばん" },
      { text: "ご" },
      { text: "飯", reading: "はん" },
      { text: "を" },
    ],
    afterSegments: [{ text: "と" }, { text: "思", reading: "おも" }, { text: "っています。" }],
    translationVn: "Tôi đang định cùng mọi người ăn tối.",
  },
  {
    id: "volitional-2",
    hiragana: "いく",
    dictHint: "行く",
    formId: "volitional",
    beforeSegments: [
      { text: "来年", reading: "らいねん" },
      { text: "、" },
      { text: "日本", reading: "にほん" },
      { text: "へ" },
    ],
    afterSegments: [{ text: "と" }, { text: "思", reading: "おも" }, { text: "います。" }],
    translationVn: "Tôi định sang năm sẽ đi Nhật.",
  },
  {
    id: "imperative-1",
    hiragana: "すわる",
    dictHint: "座る",
    formId: "imperative",
    beforeSegments: [{ text: "そこに" }],
    afterSegments: [{ text: "！" }],
    translationVn: "Ngồi xuống đó!",
  },
  {
    id: "imperative-2",
    hiragana: "かく",
    dictHint: "書く",
    formId: "imperative",
    beforeSegments: [{ text: "早", reading: "はや" }, { text: "く" }],
    afterSegments: [{ text: "！" }],
    translationVn: "Viết nhanh lên!",
  },
  {
    id: "prohibitive-1",
    hiragana: "さわる",
    dictHint: "触る",
    formId: "prohibitive",
    beforeSegments: [{ text: "これに" }],
    afterSegments: [{ text: "！" }],
    translationVn: "Đừng chạm vào cái này!",
  },
  {
    id: "prohibitive-2",
    hiragana: "はなす",
    dictHint: "話す",
    formId: "prohibitive",
    beforeSegments: [{ text: "教室", reading: "きょうしつ" }, { text: "で" }],
    afterSegments: [{ text: "！" }],
    translationVn: "Đừng nói chuyện trong lớp học!",
  },
  {
    id: "conditional-1",
    hiragana: "よむ",
    dictHint: "読む",
    formId: "conditional",
    beforeSegments: [{ text: "この" }, { text: "本", reading: "ほん" }, { text: "を" }],
    afterSegments: [
      { text: "、" },
      { text: "漢字", reading: "かんじ" },
      { text: "が" },
      { text: "分", reading: "わ" },
      { text: "かります。" },
    ],
    translationVn: "Nếu đọc quyển sách này, sẽ hiểu chữ Hán.",
  },
  {
    id: "conditional-2",
    hiragana: "のむ",
    dictHint: "飲む",
    formId: "conditional",
    beforeSegments: [{ text: "薬", reading: "くすり" }, { text: "を" }],
    afterSegments: [{ text: "、" }, { text: "元気", reading: "げんき" }, { text: "になります。" }],
    translationVn: "Nếu uống thuốc, sẽ khỏe lại.",
  },
];
