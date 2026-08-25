import type { ConjugationFormId, VerbGroup } from "./types";

export interface TeachingRule {
  group: VerbGroup;
  groupLabel: string; // e.g. "Nhóm I (Động từ nhóm 1 / Godan)"
  rule: string; // main rule, Vietnamese
  subRules?: string[]; // bullet sub-cases (godan's multiple endings, etc.)
  examples: { dict: string; masu: string; result: string }[];
}

export interface FormTeaching {
  id: ConjugationFormId;
  title: string; // "Thể Te (て形)"
  usage: string; // one-line meaning/typical use, Vietnamese
  groups: TeachingRule[];
  notes?: string[];
}

export const TEACHING_CONTENT: FormTeaching[] = [
  {
    id: "te",
    title: "Thể Te（て形）",
    usage:
      "Dùng để nối các hành động/câu với nhau (làm A rồi làm B), nhờ vả (～てください), xin phép (～てもいいです), hoặc đang làm gì đó (～ています).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Nhìn vào âm cuối của thể ます (bỏ ます) rồi đổi theo bảng dưới:",
        subRules: [
          "い、ち、り → って  （かいます→かって、まちます→まって、かえります→かえって）",
          "み、び、に → んで  （よみます→よんで、あそびます→あそんで、しにます→しんで）",
          "き → いて  （かきます→かいて）　※ ngoại lệ: いきます→いって",
          "ぎ → いで  （およぎます→およいで）",
          "し → して  （はなします→はなして）",
        ],
        examples: [
          { dict: "書く", masu: "かきます", result: "かいて" },
          { dict: "飲む", masu: "のみます", result: "のんで" },
          { dict: "買う", masu: "かいます", result: "かって" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm て.",
        examples: [
          { dict: "食べる", masu: "たべます", result: "たべて" },
          { dict: "見る", masu: "みます", result: "みて" },
        ],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → して　／　きます（来ます）→ きて（来て）",
        examples: [
          { dict: "する", masu: "します", result: "して" },
          { dict: "来る", masu: "きます", result: "きて" },
        ],
      },
    ],
  },
  {
    id: "nai",
    title: "Thể Nai（ない形）",
    usage: "Dạng phủ định thông thường của động từ — \"không làm gì đó\" (～ないでください、～なければなりません、v.v.).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng あ, rồi thêm ない.",
        subRules: [
          "き→か、み→ま、び→ば、に→な、り→ら、ち→た、し→さ、ぎ→が　＋ない",
          "Riêng động từ kết thúc bằng い（買います、洗います…）→ わない （không phải あない）",
        ],
        examples: [
          { dict: "書く", masu: "かきます", result: "かかない" },
          { dict: "買う", masu: "かいます", result: "かわない" },
          { dict: "飲む", masu: "のみます", result: "のまない" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm ない.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべない" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → しない　／　きます（来ます）→ こない（来ない）",
        examples: [
          { dict: "する", masu: "します", result: "しない" },
          { dict: "来る", masu: "きます", result: "こない" },
        ],
      },
    ],
    notes: ["Động từ ある là ngoại lệ đặc biệt: thể ない của ある là ない (không phải あらない)."],
  },
  {
    id: "dictionary",
    title: "Thể từ điển（辞書形）",
    usage: "Dạng nguyên thể, dùng để tra từ điển, nói với bạn bè thân/người dưới, và làm gốc cho nhiều thể khác (可能形、意向形…).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng う (cùng cột phụ âm).",
        subRules: [
          "き→く、ぎ→ぐ、し→す、ち→つ、に→ぬ、び→ぶ、み→む、り→る、い→う",
        ],
        examples: [
          { dict: "書く", masu: "かきます", result: "かく" },
          { dict: "話す", masu: "はなします", result: "はなす" },
          { dict: "買う", masu: "かいます", result: "かう" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm る.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべる" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → する　／　きます（来ます）→ くる（来る）",
        examples: [
          { dict: "する", masu: "します", result: "する" },
          { dict: "来る", masu: "きます", result: "くる" },
        ],
      },
    ],
  },
  {
    id: "ta",
    title: "Thể Ta（た形）",
    usage: "Thể quá khứ thông thường — \"đã làm gì đó\". Quy tắc biến đổi giống hệt thể て, chỉ khác て→た, で→だ.",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Áp dụng quy tắc giống thể て, nhưng て→た, で→だ:",
        subRules: [
          "い、ち、り → った  （かって→かった、まって→まった）",
          "み、び、に → んだ  （よんで→よんだ、あそんで→あそんだ）",
          "き → いた  （かいて→かいた）　※ ngoại lệ: いって→いった",
          "ぎ → いだ  （およいで→およいだ）",
          "し → した  （はなして→はなした）",
        ],
        examples: [
          { dict: "書く", masu: "かきます", result: "かいた" },
          { dict: "飲む", masu: "のみます", result: "のんだ" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm た.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべた" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → した　／　きます（来ます）→ きた（来た）",
        examples: [
          { dict: "する", masu: "します", result: "した" },
          { dict: "来る", masu: "きます", result: "きた" },
        ],
      },
    ],
  },
  {
    id: "potential",
    title: "Thể khả năng（可能形）",
    usage: "Diễn tả \"có thể làm được gì đó\" (thay cho ～ことができます).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng え, rồi thêm る.",
        examples: [
          { dict: "書く", masu: "かきます", result: "かける" },
          { dict: "話す", masu: "はなします", result: "はなせる" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm られる.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべられる" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → できる　／　きます（来ます）→ こられる（来られる）",
        examples: [
          { dict: "する", masu: "します", result: "できる" },
          { dict: "来る", masu: "きます", result: "こられる" },
        ],
      },
    ],
  },
  {
    id: "volitional",
    title: "Thể ý chí（意向形）",
    usage: "Diễn tả ý định/rủ rê \"cùng làm gì đó nào!\" (thân mật, tương đương ～ましょう).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng お, rồi thêm う.",
        examples: [
          { dict: "書く", masu: "かきます", result: "かこう" },
          { dict: "飲む", masu: "のみます", result: "のもう" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm よう.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべよう" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → しよう　／　きます（来ます）→ こよう（来よう）",
        examples: [
          { dict: "する", masu: "します", result: "しよう" },
          { dict: "来る", masu: "きます", result: "こよう" },
        ],
      },
    ],
  },
  {
    id: "imperative",
    title: "Thể mệnh lệnh（命令形）",
    usage: "Ra lệnh trực tiếp, mạnh (thường dùng giữa nam giới, trong thể thao, khẩu hiệu — không dùng với người lớn tuổi/cấp trên).",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng え (không thêm gì thêm).",
        examples: [
          { dict: "書く", masu: "かきます", result: "かけ" },
          { dict: "行く", masu: "いきます", result: "いけ" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm ろ.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべろ" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → しろ　／　きます（来ます）→ こい（来い）",
        examples: [
          { dict: "する", masu: "します", result: "しろ" },
          { dict: "来る", masu: "きます", result: "こい" },
        ],
      },
    ],
  },
  {
    id: "prohibitive",
    title: "Thể cấm đoán（禁止形）",
    usage: "Ra lệnh cấm trực tiếp, mạnh — \"không được làm gì đó!\" (đối lập với 命令形).",
    groups: [
      {
        group: 1,
        groupLabel: "Tất cả các nhóm（グループ1・2・3 共通）",
        rule: "Quy tắc giống nhau cho mọi nhóm động từ: lấy thể từ điển（辞書形）rồi thêm な ở cuối.",
        examples: [
          { dict: "書く", masu: "かきます", result: "かくな" },
          { dict: "食べる", masu: "たべます", result: "たべるな" },
          { dict: "する", masu: "します", result: "するな" },
          { dict: "来る", masu: "きます", result: "くるな" },
        ],
      },
    ],
  },
  {
    id: "conditional",
    title: "Thể điều kiện（条件形・ば形）",
    usage: "Diễn tả điều kiện \"nếu làm gì đó thì...\" (～ば～), tương tự たら nhưng trang trọng/văn viết hơn.",
    groups: [
      {
        group: 1,
        groupLabel: "Nhóm I（動詞グループ1）",
        rule: "Đổi âm cuối của thể ます từ hàng い sang hàng え, rồi thêm ば.",
        examples: [
          { dict: "書く", masu: "かきます", result: "かけば" },
          { dict: "飲む", masu: "のみます", result: "のめば" },
        ],
      },
      {
        group: 2,
        groupLabel: "Nhóm II（動詞グループ2）",
        rule: "Bỏ ます, thêm れば.",
        examples: [{ dict: "食べる", masu: "たべます", result: "たべれば" }],
      },
      {
        group: 3,
        groupLabel: "Nhóm III（動詞グループ3）",
        rule: "します → すれば　／　きます（来ます）→ くれば（来れば）",
        examples: [
          { dict: "する", masu: "します", result: "すれば" },
          { dict: "来る", masu: "きます", result: "くれば" },
        ],
      },
    ],
  },
];

export function getTeaching(id: ConjugationFormId): FormTeaching {
  return TEACHING_CONTENT.find((t) => t.id === id)!;
}
