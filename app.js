console.log("app.js loaded v0.72");

// ============================
// DOM取得
// ============================
const lv =document.getElementById("lv");
const lvValue = document.getElementById("lvValue");
const statusBar = document.getElementById("statusBar");
const skillArea = document.getElementById("skillArea");
const skillList = document.getElementById("skillList");
const currentJobEl = document.getElementById("currentJob");

let sortMode = "level";
const sortSelect = document.getElementById("sortSelect");

let categoryFilter = "all";
const categorySelect = document.getElementById("categorySelect");
let burstFilter = "all";
const burstSelect = document.getElementById("burstFilter");

sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;

    console.log("currentJobKey", currentJobKey);

    //今選ばれてるジョブで描画しなおす
    if (currentJobKey) {
        renderSkills(currentJobKey);
    }
});

categorySelect.addEventListener("change", () => {
    categoryFilter = categorySelect.value;

    if (currentJobKey) {
        renderSkills(currentJobKey);
    }
});

burstSelect.addEventListener("change", () => {
    burstFilter = burstSelect.value;

    if (currentJobKey) {
        renderSkills(currentJobKey);
    }
});

let currentJobKey = null;

// ============================
// 初期hidden設定
// ============================
statusBar.hidden = true;
skillArea.hidden = true;

// ============================
// リキャスト管理関連
// ============================
function formatRecast(seconds) {
    const sec = Number(seconds);

    const min = Math.floor(sec / 60);
    const rem = sec % 60;

    //0mなら30s
    if (min === 0) return `${sec}s`;

    //割り切れるなら120s(2m)
    if (rem === 0) return `${sec}s (${min}m)`;

    //余りがあるなら90s(1m30s)
    return `${sec}s (${min}m${rem}s)`;
};

function pickByLevel(valueOrList, currentLv) {
    // 1) 数値ならそのまま返す
    if (typeof valueOrList === "number") return valueOrList;

    // 2) 配列じゃなければ何も返さない
    if (!Array.isArray(valueOrList)) return null;

    // 3) minLevel <= currentLv の中で一番高いものを使用
    let picked = null;
    for (const item of valueOrList) {
        if (currentLv >= item.minLevel) picked = item.value;
    }
    return picked;
};
// ============================
//辞書データ
// ============================

//タグラベル
const TAG_LABEL = {
    heal: "回復",
    mitigation: "軽減",
    barrier: "バリア",
    buff: "バフ",
    debuff: "デバフ",
    resource: "リソース",
    party: "PT対象",
    hot: "HoT",
    ground: "設置",
    magic: "魔法",
    raise: "蘇生",
    autoHeal: "オートヒール",
    HoT: "HoT",
    pet: "ペット",
    movement: "移動補助",
    burst: "バースト",
    mp: "MP",
};

//条件データ
const REQUIREMENT_TYPE_LABEL = {
    combat: "戦闘中のみ使用可能",
};

//条件リソース名ラベル
const RESOURCE = {
    MP: "mp",

    OATH: "oath",
    WRATH: "wrath",
    BLACKBLOOD: "blackblood",


    LILY: "lily",
    BLOODLILY: "bloodlily",
    AETHERFLOW: "aetherflow",
    FEAAETHER: "faeaether",
    FAIRY: "fairy",
    SERAPH: "seraph",
    SERAPHISM: "seraphism",
    KARDIA: "kardia",
    EUKRASIA: "eukrasia",
    ADDERSGALL: "addersgall",
    ADDERSTING: "addersting",

    NINKI: "ninki",
    CODA: "coda",
    IMPROVISATION: "improvisation",

    CARBUNCLE: "carbuncle",
    PHOENIX: "phoenix",
    LUXSOLARIS: "luxsolaris",
    PICTSKY: "pictsky",
    TEMPERACOAT: "temperacoat"
};

//リソース表示名
const RESOURCE_LABEL = {
    mp: "MP",
    oath: "オウス",
    wrath: "インナービースト",
    blackblood: "ブラックブラッド",

    lily: "ヒーリングリリー",
    bloodlily: "ブラッドリリー",
    aetherflow: "エーテルフロー",
    faeaether: "フェイエーテル",
    fairy: "フェアリー",
    seraph: "セラフィム",
    seraphism: "セラフィズム",
    kardia: "カルディア",
    eukrasia: "エウクラシア",
    addersgall: "アダーガル",
    addersting: "アダースティング",

    ninki: "忍気",
    coda: "コーダシンボル",
    improvisation: "インプロビゼーション",

    carbuncle: "カーバンクル",
    phoenix: "トランス・フェニックス",
    luxsolaris: "ルクス・ソラリス実行可",
    pictsky: "スカイの絵素",
    temperacoat: "テンペラコート",
};

// スキル範囲データ
const ORIGIN_LABEL = {
  self: "自分中心",
  target: "対象中心",
  fairy: "妖精中心",
  pet: "召喚獣から",
  ground: "設置"
};

const SHAPE_LABEL = {
  circle: "円",
  cone: "扇",
  line: "直線",
  single: "単体",
  self: "自分自身"
};

// ============================
// スキルカテゴリデータ
// ============================

//catecory    
//damage     = 攻撃
//heal        = 回復
//raise       = 蘇生
//mitigation  = 軽減
//buff        = 火力バフ
//burst       = バースト
//utility     = その他

// timelineTags
// partyBuff  = PT火力バフ
// selfBuff   = 自己バフ
// mitigation = 軽減
// barrier    = バリア
// heal       = 回復
// raise      = 蘇生
// invuln     = 無敵
// utility    = その他補助

// target（効果対象）
// self        = 自分
// party       = PT全体
// singleAlly  = 味方単体
// enemy       = 敵単体
// enemies     = 敵複数（範囲攻撃）

// shape（範囲形状）
//
// single  = 単体        → range
// circle  = 円範囲      → radius
// cone    = 扇範囲      → range + angle
// line    = 直線範囲    → range + width
// donut   = ドーナツ範囲 → innerRadius + outerRadius

//typeデータ
//type: "player" // ジョブ固有アクション
//type: "role"   // ロールアクション
//type: "pet"    // 妖精・召喚獣など

// =====================
// ロールアクション生成 helper
// =====================

const makeRoleSkill = (jobKey, skill, override = {}) => ({
    ...skill,
    ...override,

    id: override.id ?? `${jobKey.toLowerCase()}_${skill.group}`,

    notes: [
        ...(skill.notes ?? []),
        ...(override.notes ?? [])
    ]
});

// =====================
// ロールアクション　TANK
// =====================
const TANK_ROLE_ACTIONS = [
    {
        name: "ランパート",
        minLv: 8,
        group: "rampart",

        category: "mitigation",
        tags: ["mitigation", "buff"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "self",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 8, label: "被ダメージ軽減", value: 20 },
            { minLevel: 94, label: "HP回復効果上昇", value: 20 }
        ],

        effect: [
            {
                minLevel: 8,
                value: "自身の被ダメージを20%軽減"
            },
            {
                minLevel: 94,
                value: "自身の被ダメージを20%軽減\n自身が受けるHP回復効果を15%上昇"
            }
        ],

        requirements: [],

        notes: [

        ],

        icon: "icons/RoleAction/TANK/Rampart.png"
    },
    {
        name: "ロウブロウ",
        minLv: 12,
        group: "low_blow",

        category: "utility",
        tags: ["debuff"],
        timelineTags: ["debuff"],

        type: "role",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 3,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 25,
        recastType: "ogcd",

        duration: [
            { minLevel: 12, value: 5 }
        ],

        effect: [
            { minLevel: 12, value: "対象をスタンさせる" }
        ],

        requirements: [],

        notes: [
            "スタンが有効な詠唱・雑魚止め用"
        ],

        icon: "icons/RoleAction/TANK/Low_Blow.png"
    },
    {
        name: "挑発",
        minLv: 15,
        group: "provoke",

        category: "utility",
        tags: ["enmity"],
        timelineTags: ["enmity"],

        type: "role",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 30,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 15,
                value: "対象を挑発し、自身への敵視を最高位にしたうえで、さらに自身への敵視を上昇"
            }
        ],

        requirements: [],

        notes: [
            "タンクスイッチ用",
            "挑発後は追撃で敵視を安定させる"
        ],

        icon: "icons/RoleAction/TANK/Provoke.png"
    },
    {
        name: "インタージェクト",
        minLv: 18,
        group: "interject",

        category: "utility",
        tags: ["debuff"],
        timelineTags: ["debuff"],

        type: "role",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 3,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 30,
        recastType: "ogcd",

        duration: [],

        effect: [
            { minLevel: 18, value: "対象のアクション詠唱を中断させる" }
        ],

        requirements: [],

        notes: [
            "点滅詠唱バーの中断用"
        ],

        icon: "icons/RoleAction/TANK/Interject.png"
    },
    {
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",

        category: "mitigation",
        tags: ["mitigation", "debuff"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemies",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {
                minLevel: 22,
                value: "自身の周囲の敵の与ダメージを10%減少"
            },
            {
                minLevel: 98,
                value: "自身の周囲の敵の与ダメージを10%減少\nLv98以降: 効果時間15秒"
            }
        ],

        requirements: [],

        notes: [
            "敵に付与する軽減。[効果範囲は[自分中心5m]",
        ],

        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
    {
        name: "アームズレングス",
        minLv: 32,
        group: "arms_length",

        category: "utility",
        tags: ["buff", "debuff"],
        timelineTags: ["buff"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "self",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 32, label: "ノックバック無効", value: 6 },
            { minLevel: 32, label: "スロウ", value: 15 }
        ],

        effect: [
            {
                minLevel: 32,
                value: "一部を除くノックバックと引き寄せを無効化\n効果中に自身が物理攻撃を受けると、攻撃者に20%スロウを付与"
            }
        ],

        requirements: [],

        notes: [
            "ノックバック無効用。「アムレン」とコールされることが多い",
            "まとめ狩りでは物理攻撃を受けることでスロウ軽減としても使える"
        ],

        icon: "icons/RoleAction/TANK/Arms_Length.png"
    },
    {
        name: "シャーク",
        minLv: 48,
        group: "shirk",

        category: "utility",
        tags: ["enmity", "party"],
        timelineTags: ["enmity"],

        type: "role",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 48,
                value: "自身に向けられている敵視の25%を対象のPTMに移す"
            }
        ],

        requirements: [],

        notes: [
            "タンクスイッチ後の敵視調整用",
            "相方タンクに向けて使う。相方タンクの挑発の後に使うと敵視が安定しやすい"
        ],

        icon: "icons/RoleAction/TANK/Shirk.png"
    }
];

// =====================
// ロールアクション生成 HEALER
// =====================


// =====================
// ロールアクション生成 MELEE
// =====================

// =====================
// ロールアクション生成 RANGED
// =====================


// =====================
// ロールアクション生成 CASTER
// =====================




// ============================
// ナイトスキルデータ
// ============================
    const PLD_SKILLS = [
    // PLD固有スキル
    
    
    // ロールアクション
    ...TANK_ROLE_ACTIONS.map(skill => makeRoleSkill("PLD", skill))
     ]

// ============================
// 戦士スキルデータ
// ============================
    const WAR_SKILLS = [
        // WAR固有スキル
    
    // ロールアクション
    ...TANK_ROLE_ACTIONS.map(skill => makeRoleSkill("WAR", skill))
     ];

// ============================
// 暗黒騎士スキルデータ
// ============================
    const DRK_SKILLS = [
        // DRK固有スキル
    
    // ロールアクション
    ...TANK_ROLE_ACTIONS.map(skill => makeRoleSkill("DRK", skill))
      ];

// ============================
// ガンブレスキルデータ
// ============================
    const GNB_SKILLS = [
        // GNB固有スキル
    
    // ロールアクション
    ...TANK_ROLE_ACTIONS.map(skill => makeRoleSkill("GNB", skill))
       ];

// ============================
// 白魔道士スキルデータ
// ============================
    const WHM_SKILLS = [
        // WHM固有スキル
    {
        id: "whm_raise",
        name: "レイズ",
        minLv: 12,
        group: "raise",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],

        type: "player",
        target: "singleAlly",
        origin: "target",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 8,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"対象を衰弱状態で蘇生" },
        ],

        requirements: [],

        icon: "icons/WHM/Raise.png"
    },
    // ロールアクション
    {
    id: "sge_repose",
    name: "リポーズ",
    minLv: 8,
    group: "repose",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemy",
    origin: "target",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -600 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 8, value: 30 }
    ],

    effect: [
        { minLevel: 8, value: "対象に睡眠を付与" }
    ],

    requirements: [],
    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/RoleAction/HEALER/Repose.png"
},
    {
    id: "whm_esuna",
    name: "エスナ",
    minLv: 10,
    group: "esuna",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 10, value: "対象にかかった一部の弱体効果を1つ解除" }
    ],

    requirements: [],
    notes: [
        "白線付きデバフが解除対象"
    ],

    icon: "icons/RoleAction/HEALER/Esuna.png"
},
{
    id: "whm_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
        "リキャスト毎に使うことを推奨"
    ],

    icon: "icons/RoleAction/HEALER/Lucid_Dreaming.png"
},
{
    id: "whm_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "基本は蘇生魔法とセットで使うことが多い",
        "絶等の高難易度の場合、回復魔法や攻撃魔法に使うこともある",
    ],

    icon: "icons/RoleAction/HEALER/Swiftcast.png"
},
{
    id: "whm_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/HEALER/Surecast.png"
},
    ]; 

// ============================
// 学者スキルデータ
// ============================
    const SCH_SKILLS = [
        // SCH固有スキル
    {
        id: "sch_physick",
        name: "フィジク",
        minLv: 4,
        group: "physick",

        category: "heal",
        tags: ["heal","magic"],
        timelineTags: ["heal"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
        ],
        skillType:"spell",
        charges: null,
        castTime: 1.5,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 4, value:"対象のHP回復 回復力:400"},
            {minLevel: 85, value:"対象のHP回復 回復力:450"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/SCH/Physick.png"
    },
    {
        id: "sch_resurrection",
        name: "リザレク",
        minLv: 12,
        group: "resurrection",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 8,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"対象を衰弱状態で蘇生"},
        ],

        requirements: [],

        icon: "icons/SCH/Resurrection.png"
    },
    {
        id: "sch_whispering",
        name: "光の囁き",
        minLv: 20,
        group: "whispering",

        category: "heal",
        tags: ["heal", "hot", "party", "pet"],
        timelineTags: ["heal"],

        type: "pet",
        target: "party",
        origin: "pet",
        shape: "circle",
        range: 0,
        radius: 20,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            {minLevel: 20, value:21}
        ],

        effect: [
            {minLevel: 20, value:"範囲内のPTMにHoT付与 回復力:80"},
        ],

        requirements: [
           { type:"buff", names: [RESOURCE.FAIRY, RESOURCE.SERAPH]}
        ],

        notes: ["[セラフィム召喚中]光輝の囁きに変化する ※効果は同じ"],

        icon: "icons/SCH/Whispering_Dawn.png"
    },
    {
        id: "sch_adloquium",
        name: "鼓舞激励の策",
        minLv: 30,
        group: "adloquium",

        category: ["heal","mitigation"],
        tags: ["heal", "barrier", "magic"],
        timelineTags: ["heal","barrier"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -900 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 2,
        recast: 2.5,
        recastType: "gcd",

        duration: [
            {minLevel: 30, value: 30}
        ],

        effect: [
            {minLevel: 30, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の125%"},
            {minLevel: 85, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の180%"}
        ],

        requirements: [],

        notes: [
                "賢者の[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]と競合",
                "[秘策]対象スキル",
                "クリティカル時:[激励]付与(バリア量2倍)"],

        interactionTags: ["recitation"],

        icon: "icons/SCH/Adloquium.png"
    },
    {
        id: "sch_succor",
        name: "士気高揚の策",
        minLv: 35,
        group: "succor",

        category: ["heal","mitigation"],
        tags: ["heal", "barrier", "party", "magic"],
        timelineTags: ["heal","barrier"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 20,

        resourceChange: [
            { resource: RESOURCE.MP, value: -900 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 2,
        recast: 2.5,
        recastType: "gcd",

        duration: [
            {minLevel: 35, value: 30}
        ],

        effect: [
            {minLevel: 35, value:"範囲内のPTMのHP回復+バリア付与\n回復力:200 バリア:回復力の115%"},
            {minLevel: 85, value:"範囲内のPTMのHP回復+バリア付与\n回復力:200 バリア:回復力の160%"}
        ],

        requirements: [],

        notes: [
                "賢者の[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]と競合",
                "[秘策]対象スキル",
                ],

        interactionTags: ["recitation"],

        icon: "icons/SCH/Succor.png"
    },
    {
        id: "sch_fey_illumination",
        name: "フェイイルミネーション",
        minLv: 40,
        group: "illumination",

        category: "mitigation",
        tags: ["mitigation", "buff", "party", "pet"],
        timelineTags: ["mitigation", "buff"],

        type: "pet",
        target: "party",
        origin: "pet",
        shape: "circle",
        range: 0,
        radius: 20,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 40, value: 20 }
        ],

        effect: [
            {
                minLevel: 40,
                value: "範囲内のPTMの[被魔法ダメージ]5%軽減/[回復魔法]の回復量10%UP"
            }
        ],

        requirements: [
            {
                type: "buff",
                names: [RESOURCE.FAIRY, RESOURCE.SERAPH]
            }
        ],

        notes: [
                "[セラフィム召喚中]セラフィックイルミネーションに変化する ※効果は同じ",
                "回復アビリティには効果は乗らない"
                ],

        icon: "icons/SCH/Fey_Illumination.png"
    },
    {
        id: "sch_aetherflow",
        name: "エーテルフロー",
        minLv: 45,
        group: "aetherflow",

        category: "utility",
        tags: ["resource", "buff"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: +2000 },
            { resource: RESOURCE.AETHERFLOW, value: +3 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 45,
                value: "最大MPの20%回復"
            }
        ],

        requirements: [
            { type: "combat" }
        ],

        notes: [],

        icon: "icons/SCH/Aetherflow.png"
    },
    {
        id: "sch_lustrate",
        name: "生命活性法",
        minLv: 45,
        group: "lustrate",

        category: "heal",
        tags: ["heal", "resource"],
        timelineTags: ["heal"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.AETHERFLOW, value: -1 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 1,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 45,
                value: "対象のHP回復 回復力:600"
            }
        ],

        requirements: [
            { type: "resource", resource: RESOURCE.AETHERFLOW, min: 1 }
        ],

         notes: [],

        icon: "icons/SCH/Lustrate.png"
    },
    {
        id: "sch_sacred_soil",
        name: "野戦治療の陣",
        minLv: 50,
        group: "sacred_soil",

        category: ["mitigation", "heal"],
        tags: ["mitigation", "heal", "hot", "party", "resource", "ground"],
        timelineTags: ["mitigation", "heal"],

        type: "player",
        target: "party",
        origin: "ground",
        shape: "circle",
        range: 30,
        radius: 15,

        resourceChange: [
            { resource: RESOURCE.AETHERFLOW, value: -1 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 30,
        recastType: "ogcd",

        duration: [
            { minLevel: 50, value: 15 }
        ],

        effect: [
            { minLevel: 50, value: "エリア内10%軽減" },
            { minLevel: 78, value: "エリア内10%軽減+HoT付与\n回復力:100"}
        ],

        requirements: [
            { type: "resource", resource: RESOURCE.AETHERFLOW, min: 1 }
        ],
        
        notes:["軽減バフは野戦治療の陣が消えたり出たりしても3秒ほど維持される"],

        icon: "icons/SCH/Sacred_Soil.png"
    },
    {
        id: "sch_indomitability",
        name: "不撓不屈の策",
        minLv: 52,
        group: "indomitability",

        category: "heal",
        tags: ["heal", "party", "resource"],
        timelineTags: ["heal"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [
            { resource: RESOURCE.AETHERFLOW, value: -1 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 30,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 52,
                value: "範囲内のPTMのHP回復 回復力:400"
            }
        ],

        requirements: [
            { type: "resource", resource: RESOURCE.AETHERFLOW, min: 1 }
        ],

        notes: ["[秘策]対象スキル"],

        interactionTags: ["recitation"],

        icon: "icons/SCH/Indomitability.png"
    },
    {
        id: "sch_deployment_tactics",
        name: "展開戦術",
        minLv: 56,
        group: "deployment_tactics",

        category: "utility",
        tags: ["buff", "barrier"],
        timelineTags: ["buff", "barrier"],

        type: "player",
        target: "party",
        origin: "target",
        shape: "circle",
        range: 30,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 56, value: 120 },
            { minLevel: 85, value: 90 }
        ],
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 56,
                value: "対象の[鼓舞（バリア）]を周囲に拡散させる"
            }
        ],

        requirements: [],

        notes: ["効果時間・効果量は拡散された時点のものになる"],

        icon: "icons/SCH/Deployment_Tactics.png"
    },
    {
        id: "sch_emergency_tactics",
        name: "応急戦術",
        minLv: 58,
        group: "emergency",

        category: "utility",
        tags: ["buff"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 58, value: 15 },
            { buff: "seraphism", value: 1 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 58, value: 15 }
        ],

        effect: [
            {
                minLevel: 58,
                value: "[鼓舞激励の策]/[士気高揚の策]/[意気軒高の策]のバリア分を回復効果に置き換える"
            }
        ],

        requirements: [],

        notes: ["セラフィズム使用中リキャストが１秒になる"],

        interactionTags: ["seraphism"],

        icon: "icons/SCH/Emergency_Tactics.png"
    },
    {
        id: "sch_dissipation",
        name: "転化",
        minLv: 60,
        group: "dissipation",

        category: "utility",
        tags: ["buff", "resource", "pet"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.AETHERFLOW, value: +3 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 180,
        recastType: "ogcd",

        duration: [
            { minLevel: 60, value: 30 }
        ],

        effect: [
            {
                minLevel: 60,
                value: "召喚中の[フェアリー]を一時帰還\n自身の[回復魔法効果]20%上昇"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.FAIRY }
        ],

        notes: ["サモン・セラフィム中使用不可","効果終了時フェアリーが[追従]状態になる"],

        icon: "icons/SCH/Dissipation.png"
    },
    {
        id: "sch_excogitation",
        name: "深謀遠慮の策",
        minLv: 62,
        group: "excogitation",

        category: "heal",
        tags: ["heal", "resource", "buff"],
        timelineTags: ["heal"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.AETHERFLOW, value: -1 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 45,
        recastType: "ogcd",

        duration: [
            { minLevel: 62, value: 45 }
        ],

        effect: [
            {
                minLevel: 62,
                value: "対象のHPが50%以下または効果時間終了で回復発動 回復力:800"
            }
        ],

        requirements: [
            { type: "combat" },
            { type: "resource", resource: RESOURCE.AETHERFLOW, min: 1 }
        ],

        interactionTags: ["recitation"],

        notes: [],

        icon: "icons/SCH/Excogitation.png"
    },
    {
        id: "sch_chain_stratagem",
        name: "連環計",
        minLv: 66,
        group: "chain_stratagem",

        category: "burst",
        burst: "120s",
        tags: ["debuff", "burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 66, value: 20 }
        ],

        effect: [
            {
                minLevel: 66,
                value: "対象のクリティカルヒットを受ける確率10%上昇"},
            {
                minLevel: 92,
                value: "対象のクリティカルヒットを受ける確率10%上昇\n自身に[埋伏の毒]実行可付与"
            }
        ],

        requirements: [],

        notes: [],

        icon: "icons/SCH/Chain_Stratagem.png"
    },
    {
        id: "sch_aetherpact",
        name: "エーテルパクト",
        minLv: 70,
        group: "aetherpact",

        category: "heal",
        tags: ["heal", "hot", "pet", "resource"],
        timelineTags: ["heal"],

        type: "pet",
        target: "singleAlly",
        origin: "pet",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.FEAAETHER, value: -10 }
        ],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 3,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 70,
                value: "対象を継続回復 回復力:300\nフェイエーテル10ずつ消費"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.FAIRY },
            { type: "resource", resource: RESOURCE.FEAAETHER, min: 10 },
        ],

        notes: ["セラフィム召喚中は使用不可",
                "フェアリーと対象の距離が30m以上になると効果が一時ストップする",
                "エーテルパクト中に他のフェアリースキルを発動させようとすると発動までディレイが発生する"
        ],

        icon: "icons/SCH/Aetherpact.png"
    },
    {
        id: "sch_recitation",
        name: "秘策",
        minLv: 74,
        group: "recitation",

        category: "utility",
        tags: ["buff"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 74, value: 90 },
            { minLevel: 98, value: 60 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 74, value: 15 }
        ],

        effect: [
            {
                minLevel: 74,
                value: "効果時間中1回の対象スキルの消費MP・消費フロー0\n対象スキルを確定クリティカル"
            }
        ],

        requirements: [],

        notes: ["対象:[鼓舞激励の策]/[士気高揚の策]/[意気軒高の策]/[不撓不屈の策]/[深謀遠慮の策]"],

    icon: "icons/SCH/Recitation.png"
    },
    {
        id: "sch_fey_blessing",
        name: "フェイブレッシング",
        minLv: 76,
        group: "blessing",

        category: "heal",
        tags: ["heal", "party", "pet"],
        timelineTags: ["heal"],

        type: "pet",
        target: "party",
        origin: "pet",
        shape: "circle",
        range: 0,
        radius: 20,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {
                minLevel: 76,
                value: "範囲内のPTMのHP回復 回復力:320"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.FAIRY }
        ],

        notes: ["セラフィム召喚中使用不可"],

        icon: "icons/SCH/Fey_Blessing.png"
    },
    {
        id: "sch_summon_seraph",
        name: "サモン・セラフィム",
        minLv: 80,
        group: "seraph",

        category: "utility",
         tags: ["buff", "pet"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 80, value: 22 }
        ],

        effect: [
            {
                minLevel: 80,
                value: "[フェアリー]を一時帰還させ、[セラフィム]を召喚する\n(一部のフェアリースキルをセラフィム用のスキルに置き換える)"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.FAIRY },
        ],

        notes: ["セラフィム帰還時にフェアリースキルを使うと効果は発動せずリキャストだけ回ってしまうことがある"],

        icon: "icons/SCH/Summon_Seraph.png"
    },
    {
        id: "sch_consolation",
        name: "コンソレイション",
        minLv: 80,
        group: "consolation",

        category: ["heal", "mitigation"],
        tags: ["heal", "barrier", "party", "pet"],
        timelineTags: ["heal", "barrier"],

        type: "pet",
        target: "party",
        origin: "pet",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: 2,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            {minLevel: 80, value: 30}
        ],

        effect: [
            {
                minLevel: 80,
                value: "範囲内のPTMのHP回復+バリア付与 回復力:250 バリア:回復量の100%"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.SERAPH }
        ],

        notes: [],

        icon: "icons/SCH/Consolation.png"
    },
    {
        id: "sch_protraction",
        name: "生命回生法",
        minLv: 86,
        group: "protraction",

        category: "heal",
        tags: ["heal", "buff"],
        timelineTags: ["heal", "buff"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 86, value: 10 }
        ],

        effect: [
            {
                minLevel: 86,
                value: "対象の[HP回復効果]と[最大HP]10%上昇/実行時対象のHP10%回復"
            }
        ],

        requirements: [],

        notes: [],

        icon: "icons/SCH/Protraction.png"
    },
    {
        id: "sch_expedient",
        name: "疾風怒濤の計",
        minLv: 90,
        group: "expedient",

        category: "mitigation",
        tags: ["mitigation", "movement", "party"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 90, label: "疾風の計", value: 10 },
            { minLevel: 90, label: "怒涛の計", value: 20 }
       ],

        effect: [
           {
            minLevel: 90,
            value: "範囲内のPTMに[疾風の計:10秒]スプリント+[怒涛の計:20秒]10%軽減"
            }
        ],

        requirements: [],

        notes: [],

        icon: "icons/SCH/Expedient.png"
    },
    {
        id: "sch_concitation",
        name: "意気軒高の策",
        minLv: 96,
        group: "succor",

        category: ["heal", "mitigation"],
        tags: ["heal", "barrier", "party", "magic"],
        timelineTags: ["heal", "barrier"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 20,

        resourceChange: [
            { resource: RESOURCE.MP, value: -900 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 2,
        recast: 2.5,
        recastType: "gcd",

        duration: [
            {minLevel: 96, value:30}
        ],

        effect: [
            {minLevel: 96, value:"範囲内のPTMのHP回復+バリア付与 回復力:200 バリア:回復力の180%"},
        ],

        requirements: [],

        notes: [
                "賢者の[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]と競合",
                "[秘策]対象スキル",
                ],

        icon: "icons/SCH/Concitation.png"
    },
    {
        id: "sch_seraphism",
        name: "セラフィズム",
        minLv: 100,
        group: "seraphism",

        category: ["heal", "utility"],
        tags: ["heal", "hot", "buff"],
        timelineTags: ["heal", "buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 50,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 180,
        recastType: "ogcd",

        duration: [
            {minLevel: 100, value:20}
        ],

        effect: [
            {minLevel: 96, value:"[鼓舞激励の策]/[意気軒高の策]を[マニフェステーション]/[アクセッション]に強化\n範囲内のPTMにHoT付与"},
        ],

        requirements: [
            { type: "combat" },
            { type: "buff", names: [RESOURCE.FAIRY, RESOURCE.SERAPH] }
        ],

        notes: [
                "[応急戦術]のリキャストを1秒に短縮"
            ],

        icon: "icons/SCH/Seraphism.png"
    },
    {
        id: "sch_manifestation",
        name: "マニフェステーション",
        minLv: 100,
        group: "manifestation",

        category: ["heal", "mitigation"],
        tags: ["heal", "barrier", "magic"],
        timelineTags: ["heal", "barrier"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -900 }
        ],
        skillType: "spell",
        charges: null,
        castTime: null,
        recast: 2.5,
        recastType: "gcd",

        duration: [
            {minLevel: 100, value:30}
        ],

        effect: [
            {minLevel: 100, value:"対象のHP回復+バリア付与 回復力:360 バリア:回復力の180%"},
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.SERAPHISM}
        ],
        
        notes: [
                "賢者の[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]と競合",
                "[秘策]効果対象外",
                "クリティカル時:[激励]付与(バリア量2倍)"],

        icon: "icons/SCH/Manifestation.png"
    },
    {
        id: "sch_accession",
        name: "アクセッション",
        minLv: 100,
        group: "accession",

        category: ["heal", "mitigation"],
        tags: ["heal", "barrier", "party", "magic"],
        timelineTags: ["heal", "barrier"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -900 }
        ],
        skillType: "spell",
        charges: null,
        castTime: null,
        recast: 2.5,
        recastType: "gcd",

        duration: [
            {minLevel: 100, value:30}
        ],

        effect: [
            {minLevel: 100, value:"範囲内のPTMのHP回復+バリア付与 回復力:240 バリア:回復力の180%"},
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.SERAPHISM}
        ],

        notes: [
                "賢者の[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]と競合",
                "[秘策]効果対象外",
                ],

        icon: "icons/SCH/Accession.png"
    },
    {
        id: "sch_enbrece",
        name: "光の癒し",
        minLv: 1,
        group: "enbrace",

        category: "heal",
        tags: ["heal", "magic", "pet", "autoHeal"],
        timelineTags: ["heal"],

        type: "pet",
        target: "singleAlly",
        origin: "pet",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "spell",
        charges: null,
        castTime: null,
        recast: 3,
        recastType: "ogcd",

        duration: [],
        
        effect: [
            {minLevel: 1, value:"対象のHPを回復する 回復力:150"},
            {minLevel: 85, value:"対象のHPを回復する 回復力:180"}
        ],

                requirements: [
            { type: "buff", buff: RESOURCE.FAIRY}
        ],

        notes: ["セラフィム召喚中は[セラフィックベール]に変化する"],

        icon: "icons/SCH/Pet_Actions/Embrace.png"
    },
    {
        id: "sch_seraphic_veil",
        name: "セラフィックベール",
        minLv: 80,
        group: "seraphic_veil",

        category: "heal",
        tags: ["heal", "magic", "pet", "autoHeal"],
        timelineTags: ["heal"],

        type: "pet",
        target: "singleAlly",
        origin: "pet",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "spell",
        charges: null,
        castTime: null,
        recast: 3,
        recastType: "ogcd",

        duration: [],
        
        effect: [
            {minLevel: 80, value:"対象のHPを回復する 回復力:150 バリア:回復力の100%"},
            {minLevel: 85, value:"対象のHPを回復する 回復力:180 バリア:回復力の100%"}
        ],

                requirements: [
            { type: "buff", buff: RESOURCE.FAIRY}
        ],

        notes: [],

        icon: "icons/SCH/Pet_Actions/Seraphic_Veil.png"
    } ,
    // ロールアクション
    {
    id: "sch_repose",
    name: "リポーズ",
    minLv: 8,
    group: "repose",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemy",
    origin: "target",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -600 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 8, value: 30 }
    ],

    effect: [
        { minLevel: 8, value: "対象に睡眠を付与" }
    ],

    requirements: [],
    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/RoleAction/HEALER/Repose.png"
},
    {
    id: "sch_esuna",
    name: "エスナ",
    minLv: 10,
    group: "esuna",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 10, value: "対象にかかった一部の弱体効果を1つ解除" }
    ],

    requirements: [],
    notes: [
        "白線付きデバフが解除対象"
    ],

    icon: "icons/RoleAction/HEALER/Esuna.png"
},
{
    id: "sch_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
        "リキャスト毎に使うことを推奨"
    ],

    icon: "icons/RoleAction/HEALER/Lucid_Dreaming.png"
},
{
    id: "sch_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "基本は蘇生魔法とセットで使うことが多い",
        "絶等の高難易度の場合、回復魔法や攻撃魔法に使うこともある",
    ],

    icon: "icons/RoleAction/HEALER/Swiftcast.png"
},
{
    id: "sch_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/HEALER/Surecast.png"
},
];

// ============================
// 占星術師スキルデータ
// ============================
    const AST_SKILLS = [
    {
        id: "ast_acend",
        name: "アセンド",
        minLv: 12,
        group: "ascend",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 8,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"対象を衰弱状態で蘇生"},
        ],

        requirements: [],

        notes: [],

        icon: "icons/AST/Ascend.png"
    },
    // ロールアクション
    {
    id: "ast_repose",
    name: "リポーズ",
    minLv: 8,
    group: "repose",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemy",
    origin: "target",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -600 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 8, value: 30 }
    ],

    effect: [
        { minLevel: 8, value: "対象に睡眠を付与" }
    ],

    requirements: [],
    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/RoleAction/HEALER/Repose.png"
},
    {
    id: "ast_esuna",
    name: "エスナ",
    minLv: 10,
    group: "esuna",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 10, value: "対象にかかった一部の弱体効果を1つ解除" }
    ],

    requirements: [],
    notes: [
        "白線付きデバフが解除対象"
    ],

    icon: "icons/RoleAction/HEALER/Esuna.png"
},
{
    id: "ast_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
        "リキャスト毎に使うことを推奨"
    ],

    icon: "icons/RoleAction/HEALER/Lucid_Dreaming.png"
},
{
    id: "ast_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "基本は蘇生魔法とセットで使うことが多い",
        "絶等の高難易度の場合、回復魔法や攻撃魔法に使うこともある",
    ],

    icon: "icons/RoleAction/HEALER/Swiftcast.png"
},
{
    id: "ast_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/HEALER/Surecast.png"
},   
    ];

// ============================
// 賢者スキルデータ
// ============================
    const SGE_SKILLS = [
    {
    id: "sge_diagnosis",
    name: "ディアグノシス",
    minLv: 2,
    group: "diagnosis",

    category: "heal",
    tags: ["heal", "magic"],
    timelineTags: ["heal"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
         { resource: RESOURCE.MP, value: -400 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 2,
        value: "対象のHP回復 回復力:400" },
        { minLevel: 85,
        value: "対象のHP回復 回復力:450" }
    ],

    requirements: [],
    notes: ["[ゾーエ]対象スキル"],

    icon: "icons/SGE/Diagnosis.png"
    },
    {
    id: "sge_kardia",
    name: "カルディア",
    minLv: 4,
    group: "kardia",

    category: "heal",
    tags: ["heal", "buff"],
    timelineTags: ["heal", "buff"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 5,
    recastType: "ogcd",

    duration: [],

    effect: [
        { minLevel: 4,
            value: "自身に[カルディア]・対象に[カルディア[被]]を付与\n攻撃魔法命中時にカルディア[被]対象を回復 回復力:130" },
        { minLevel: 85,
            value: "自身に[カルディア]・対象に[カルディア[被]]を付与\n攻撃魔法命中時にカルディア[被]対象を回復 回復力:170" }
    ],

    requirements: [],
    notes: ["効果時間:永続"],

    icon: "icons/SGE/Kardia.png"
    },
    {
    id: "sge_prognosis",
    name: "プログノシス",
    minLv: 10,
    group: "prognosis",

    category: "heal",
    tags: ["heal", "party", "magic"],
    timelineTags: ["heal"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 20,

    resourceChange: [
        { resource: RESOURCE.MP, value: -700 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 10, value: "範囲内のPTMのHP回復 回復力:300" }
    ],

    requirements: [],
    notes: ["[ゾーエ]対象スキル"],

    icon: "icons/SGE/Prognosis.png"
    },
    {
        id: "sge_egeiro",
        name: "エゲイロー",
        minLv: 12,
        group: "egeiro",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 10,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"対象を衰弱状態で蘇生"},
        ],

        requirements: [],

        notes: [],
        
        icon: "icons/SGE/Egeiro.png"
    },
    {
        id: "sge_physis",
        name: "ピュシス",
        minLv: 20,
        group: "physis",

        category: "heal",
        tags: ["heal", "hot", "party"],
        timelineTags: ["heal"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 20, value: 15 }
        ],

        effect: [
            { minLevel: 20, value: "範囲内のPTMにHoT付与 回復力:100" }
        ],

        requirements: [],
        notes: [],

        icon: "icons/SGE/Physis.png"
    },
    {
    id: "sge_eukrasia",
    name: "エウクラシア",
    minLv: 30,
    group: "eukrasia",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "player",
    target: "self",
    origin: "self",
    shape: "single",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 1,
    recastType: "ogcd",

    duration: [],

    effect: [
        { minLevel: 30, value: "一部の魔法をエウクラシア系アクションに変化させる" }
    ],

    requirements: [],
    notes: ["[ディアグノシス]/[プログノシス]/[ドシス]が[エウクラシア・〇〇]に変化"],

    icon: "icons/SGE/Eukrasia.png"
},
{
    id: "sge_eukrasian_diagnosis",
    name: "エウクラシア・ディアグノシス",
    minLv: 30,
    group: "eukrasian_diagnosis",

    category: ["heal", "mitigation"],
    tags: ["heal", "barrier", "magic"],
    timelineTags: ["heal", "barrier"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    resourceTrigger: [
    {
        minLevel: 66,
        resource: RESOURCE.ADDERSTING,
        value: +1,
        condition: "自身に付与したバリアが完全に吸収される"
    }
    ],
    skillType: "spell",
    charges: null,
    castTime: null,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 30, value: 30 }
    ],

    effect: [
        { minLevel: 30,
            value: "対象のHP回復+バリア付与\n回復力:300 バリア:回復力の125%" },
        { minLevel: 85,
            value: "対象のHP回復+バリア付与\n回復力:450 バリア:回復力の320%" }
    ],

    requirements: [
        { type: "buff", buff: "eukrasia" }
    ],

    notes: [
        {minLevel: 30, value: "学者の[鼓舞]効果と同時に付与されない"},
        {minLevel: 30, value: "クリティカル時:エウクラシア・ディアグノシス[強]付与(バリア量2倍)"},
        {minLevel: 30, value: "[ゾーエ]対象スキル"},
        {minLevel: 66, value: "付与されたバリアが完全に吸収されると[アダースティング]付与"}
    ],

    icon: "icons/SGE/Eukrasian_Diagnosis.png"
},
{
    id: "sge_eukrasian_prognosis",
    name: "エウクラシア・プログノシス",
    minLv: 30,
    group: "eukrasian_prognosis",

    category: ["heal", "mitigation"],
    tags: ["heal", "barrier", "party", "magic"],
    timelineTags: ["heal", "barrier"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 20,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    resourceTrigger: [
    {
        minLevel: 66,
        resource: RESOURCE.ADDERSTING,
        value: +1,
        condition: "自身に付与したバリアが完全に吸収される"
    }
    ],
    skillType: "spell",
    charges: null,
    castTime: null,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 30, value: 30 }
    ],

    effect: [
        { minLevel: 30, value: "範囲内のPTMのHP回復+バリア付与\n回復力:100 バリア:回復力の230%" },
        { minLevel: 85, value: "範囲内のPTMのHP回復+バリア付与\n回復力:100 バリア:回復力の320%" }
    ],

    requirements: [
        { type: "buff", buff: "eukrasia" }
    ],

    notes: [
        {minLevel: 30, value: "学者の[鼓舞]効果と同時に付与されない"},
        {minLevel: 30, value: "[ゾーエ]対象スキル"},
        {minLevel: 66, value: "自身に付与されたバリアが完全に吸収されると[アダースティング]付与"}
    ],

    icon: "icons/SGE/Eukrasian_Prognosis.png"
    },
    {
        id: "sge_soteria",
        name: "ソーテリア",
        minLv: 35,
        group: "soteria",

        category: ["heal", "utility"],
        tags: ["heal", "buff"],
        timelineTags: ["heal", "buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 35, value: 90 },
            { minLevel: 94, value: 60 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 35, value: 15 }
        ],

        effect: [
            {
                minLevel: 35,
                value: "自身に[ソーテリア]を4スタック付与\nカルディアによる回復効果を上昇"
            }
        ],

        requirements: [],

        notes: [
            "カルディア対象への攻撃連動回復を強化する",
            "カルディア運用前提"
        ],

        icon: "icons/SGE/Soteria.png"
    },
    {
    id: "sge_druochole",
    name: "ドルオコレ",
    minLv: 45,
    group: "druochole",

    category: "heal",
    tags: ["heal", "resource"],
    timelineTags: ["heal"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.ADDERSGALL, value: -1 },
        { resource: RESOURCE.MP, value: +700 }
    ],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 1,
    recastType: "ogcd",

    duration: [],

    effect: [
        { minLevel: 45, value: "対象のHP回復 回復力:600\n自身のMPを回復" }
    ],

    requirements: [
        { type: "resource", resource: RESOURCE.ADDERSGALL, min: 1 }
    ],

    notes: [],

    icon: "icons/SGE/Druochole.png"
},
{
    id: "sge_kerachole",
    name: "ケーラコレ",
    minLv: 50,
    group: "kerachole",

    category: ["mitigation", "heal"],
    tags: ["mitigation", "heal", "hot", "party", "resource"],
    timelineTags: ["mitigation", "heal"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 30,

    resourceChange: [
        { resource: RESOURCE.ADDERSGALL, value: -1 },
        { resource: RESOURCE.MP, value: +700 }
    ],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 30,
    recastType: "ogcd",

    duration: [
        { minLevel: 50, label: "被ダメージ軽減", value: 15 },
        { minLevel: 78, label: "継続回復効果", value: 15 }
    ],

    effect: [
        {
            minLevel: 50,
            value: "範囲内のPTMの被ダメージを10%軽減\n自身のMPを回復"
        },
        {
            minLevel: 78,
            value: "範囲内のPTMの被ダメージを10%軽減+HoT付与\n回復力:100\n自身のMPを回復"
        }
    ],

    requirements: [
        { type: "resource", resource: RESOURCE.ADDERSGALL, min: 1 }
    ],

    notes: ["[タウロコレ]の軽減効果は同時に付与されない"],

    icon: "icons/SGE/Kerachole.png"
},
{
    id: "sge_ixochole",
    name: "イックソコレ",
    minLv: 52,
    group: "ixochole",

    category: "heal",
    tags: ["heal", "party", "resource"],
    timelineTags: ["heal"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 15,

    resourceChange: [
        { resource: RESOURCE.ADDERSGALL, value: -1 },
        { resource: RESOURCE.MP, value: +700 }
    ],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 30,
    recastType: "ogcd",

    duration: [],

    effect: [
        {
            minLevel: 52,
            value: "範囲内のPTMのHP回復 回復力:400\n自身のMPを回復"
        }
    ],

    requirements: [
        { type: "resource", resource: RESOURCE.ADDERSGALL, min: 1 }
    ],

    notes: [],

    icon: "icons/SGE/Ixochole.png"
},
{
    id: "sge_zoe",
    name: "ゾーエ",
    minLv: 56,
    group: "zoe",

    category: ["heal", "utility"],
    tags: ["heal", "buff"],
    timelineTags: ["heal", "buff"],

    type: "player",
    target: "self",
    origin: "self",
    shape: "single",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
            { minLevel: 56, value: 120 },
            { minLevel: 88, value: 90 }
        ],
    recastType: "ogcd",

    duration: [
        { minLevel: 56, value: 30 }
    ],

    effect: [
        {
            minLevel: 56,
            value: "効果時間中1回、対象の回復魔法の回復量を50%上昇"
        }
    ],

    requirements: [],

    notes: [
         "対象:[ディアグノシス]/[プログノシス]/[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]/[プネウマ]",
         "回復アビリティには効果は乗らない"
    ],

    icon: "icons/SGE/Zoe.png"
},
{
    id: "sge_pepsis",
    name: "ペプシス",
    minLv: 58,
    group: "pepsis",

    category: ["heal", "utility"],
    tags: ["heal", "barrier", "party"],
    timelineTags: ["heal"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 20,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 30,
    recastType: "ogcd",

    duration: [],

    effect: [
        {
            minLevel: 58,
            value: "自身が対象に付与したエウクラシア系バリアを解除してHP回復\nエウクラシア・ディアグノシス中: 回復力450\nエウクラシア・プログノシス中: 回復力350"
        }
    ],

    requirements: [],

    notes: [
        "対象に自身が付与した[エウクラシア・ディアグノシス]/[エウクラシア・プログノシス]がない場合は効果なし",
        "他者が付与したバリアは対象外"
    ],

    icon: "icons/SGE/Pepsis.png"
},
    {
        id: "sge_physis_ii",
        name: "ピュシスII",
        minLv: 60,
        group: "physis",

        category: "heal",
        tags: ["heal", "hot", "party", "buff"],
        timelineTags: ["heal", "buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 60, label: "継続回復効果", value: 15 },
            { minLevel: 60, label: "HP回復効果上昇", value: 10 },
            { minLevel: 98, label: "HP回復効果上昇", value: 15 }
        ],

        effect: [
            { minLevel: 60, value: "範囲内のPTMにHoT付与 回復力:130\n対象が受けるHP回復効果を10%上昇" }
        ],

        requirements: [],
        notes: [],

        icon: "icons/SGE/Physis_II.png"
},
{
    id: "sge_taurochole",
    name: "タウロコレ",
    minLv: 62,
    group: "taurochole",

    category: ["heal", "mitigation"],
    tags: ["heal", "mitigation", "resource"],
    timelineTags: ["heal", "mitigation"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.ADDERSGALL, value: -1 },
        { resource: RESOURCE.MP, value: +700 }
    ],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 45,
    recastType: "ogcd",

    duration: [
        { minLevel: 62, label: "被ダメージ軽減", value: 15 }
    ],

    effect: [
        {
            minLevel: 62,
            value: "対象のHP回復 回復力:700\n対象の被ダメージを10%軽減\n自身のMPを回復"
        }
    ],

    requirements: [
        { type: "resource", resource: RESOURCE.ADDERSGALL, min: 1 }
    ],

    notes: [
         "自身またはPTMひとりを対象にできる",
        "[ケーラコレ]の軽減効果は同時に付与されない"
    ],

    icon: "icons/SGE/Taurochole.png"
},
{
    id: "sge_haima",
    name: "ハイマ",
    minLv: 70,
    group: "haima",

    category: ["mitigation", "heal"],
    tags: ["mitigation", "heal", "barrier"],
    timelineTags: ["mitigation", "heal", "barrier"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 70, label: "ハイマ/ハイマの印", value: 15 }
    ],

    effect: [
        {
            minLevel: 70,
            value: "対象にバリア付与 バリア量:回復力300相当\nさらに[ハイマの印]を5スタック付与\nバリアが完全吸収で消滅すると印を1消費してバリアを再付与\n印が残って終了した場合、残スタック数に応じてHP回復"
        }
    ],

    requirements: [],

    notes: [
        "終了時回復: 回復力150 × ハイマの印の残スタック数",
        "自身またはPTMひとりを対象にできる",
        "学者のバリアと競合しない"
    ],

    icon: "icons/SGE/Haima.png"
},
{
    id: "sge_rhizomata",
    name: "リゾーマタ",
    minLv: 74,
    group: "rhizomata",

    category: "utility",
    tags: ["resource"],
    timelineTags: ["resource"],

    type: "player",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.ADDERSGALL, value: +1 }
    ],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 90,
    recastType: "ogcd",

    duration: [],

    effect: [
        {
            minLevel: 74,
            value: "自身に[アダーガル]を付与"
        }
    ],

    requirements: [],

    notes: [
        "アダーガル消費アクション用のリソース補充"
    ],

    icon: "icons/SGE/Rhizomata.png"
},
{
    id: "sge_holos",
    name: "ホーリズム",
    minLv: 76,
    group: "holos",

    category: ["heal", "mitigation"],
    tags: ["heal", "mitigation", "barrier", "party"],
    timelineTags: ["heal", "mitigation", "barrier"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 30,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 76, label: "バリア", value: 30 },
        { minLevel: 76, label: "被ダメージ軽減", value: 20 }
    ],

    effect: [
        {
            minLevel: 76,
            value: "範囲内のPTMのHP回復 回復力:300\n対象にバリア付与 バリア量:回復量の100%\n対象の被ダメージを10%軽減"
        }
    ],

    requirements: [],

    notes: ["学者のバリアと競合しない"],

    icon: "icons/SGE/Holos.png"
},
{
    id: "sge_panhaima",
    name: "パンハイマ",
    minLv: 80,
    group: "panhaima",

    category: ["mitigation", "heal"],
    tags: ["mitigation", "heal", "barrier", "party"],
    timelineTags: ["mitigation", "heal", "barrier"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 30,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 80, label: "パンハイマ/パンハイマの印", value: 15 }
    ],

    effect: [
        {
            minLevel: 80,
            value: "範囲内のPTMにバリア付与 バリア量:回復力200相当\nさらに[パンハイマの印]を5スタック付与\nバリアが完全吸収で消滅すると印を1消費してバリアを再付与\n印が残って終了した場合、残スタック数に応じてHP回復"
        }
    ],

    requirements: [],

    notes: [
        "終了時回復: 回復力100 × パンハイマの印の残スタック数",
        "ハイマとは別スキル。単体強攻撃はハイマ、範囲連続ダメージはパンハイマ"
    ],

    icon: "icons/SGE/Panhaima.png"
},
{
    id: "sge_krasis",
    name: "クラーシス",
    minLv: 86,
    group: "krasis",

    category: ["heal", "utility"],
    tags: ["heal", "buff"],
    timelineTags: ["heal", "buff"],

    type: "player",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 86, value: 10 }
    ],

    effect: [
        {
            minLevel: 86,
            value: "対象が受けるHP回復効果を20%上昇"
        }
    ],

    requirements: [],

    notes: [
        "自身またはPTMひとりを対象にできる",
        "タンク強攻撃前や、単体回復を厚くしたい場面で使う"
    ],

    icon: "icons/SGE/Krasis.png"
},
{
    id: "sge_pneuma",
    name: "プネウマ",
    minLv: 90,
    group: "pneuma",

    category: ["heal", "damage"],
    tags: ["heal", "damage", "party", "magic", "burst"],
    timelineTags: ["heal", "damage"],

    type: "player",
    target: "enemies",
    origin: "self",
    shape: "line",
    range: 25,
    radius: 25,

    resourceChange: [
        { resource: RESOURCE.MP, value: -700 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1.5,
    recast: 120,
    recastType: "ogcd",

    duration: [],

    effect: [
        {
            minLevel: 90,
            value: "対象に向かって前方直線範囲魔法攻撃 威力:380\n2体目以降の威力は40%減少\n自身と周囲20m以内のPTMのHP回復 回復力:600\nカルディア対象のHP回復 回復力:170"
        }
    ],

    requirements: [],

    notes: [
        "固有リキャストを持つ魔法",
        "[ゾーエ]対象スキル。PTMの大回復の切り札になりえる",
        "回復範囲は自身中心20m"
    ],

    icon: "icons/SGE/Pneuma.png"
},
{
    id: "sge_eukrasian_prognosis_ii",
    name: "エウクラシア・プログノシスII",
    minLv: 96,
    group: "eukrasian_prognosis",

    category: ["heal", "mitigation"],
    tags: ["heal", "barrier", "party", "magic"],
    timelineTags: ["heal", "barrier"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 20,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],

    skillType: "spell",
    charges: null,
    castTime: null,
    recast: 1.5,
    recastType: "gcd",

    duration: [
        { minLevel: 96, value: 30 }
    ],

    effect: [
        {
            minLevel: 96,
            value: "範囲内のPTMのHP回復+バリア付与\n回復力:100 バリア:回復量の360%"
        }
    ],

    requirements: [
        { type: "buff", buff: RESOURCE.EUKRASIA }
    ],

    notes: [
        "学者の[鼓舞]効果と同時に付与されない",
        "自身に付与したバリアが完全に吸収されると[アダースティング]付与",
    ],

    icon: "icons/SGE/Eukrasian_Prognosis_II.png"
},
{
    id: "sge_philosophia",
    name: "フィロソフィア",
    minLv: 100,
    group: "philosophia",

    category: ["heal", "buff"],
    tags: ["heal", "buff", "party"],
    timelineTags: ["heal", "buff"],

    type: "player",
    target: "party",
    origin: "self",
    shape: "circle",
    range: 0,
    radius: 30,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 180,
    recastType: "ogcd",

    duration: [
        { minLevel: 100, label: "回復魔法効果上昇", value: 20 },
        { minLevel: 100, label: "エウダイモニア", value: 20 }
    ],

    effect: [
        {
            minLevel: 100,
            value: "自身の回復魔法の回復量を20%上昇\n自身と周囲のPTMに[エウダイモニア]を付与\n効果中に魔法を命中させると、エウダイモニア対象を回復 回復力:150"
        }
    ],

    requirements: [],

    notes: [
        "回復魔法強化+攻撃魔法連動回復の強化型全体カルディア付与のイメージ",
        "回復アビリティではなく、[回復魔法]に効果が乗る",
        "エウダイモニア中は魔法命中でPTMを追加回復"
    ],

    icon: "icons/SGE/Philosophia.png"
},
// ロールアクション
{
    id: "sge_repose",
    name: "リポーズ",
    minLv: 8,
    group: "repose",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemy",
    origin: "target",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -600 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 8, value: 30 }
    ],

    effect: [
        { minLevel: 8, value: "対象に睡眠を付与" }
    ],

    requirements: [],
    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/RoleAction/HEALER/Repose.png"
},
{
    id: "sge_esuna",
    name: "エスナ",
    minLv: 10,
    group: "esuna",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "singleAlly",
    origin: "self",
    shape: "single",
    range: 30,
    radius: 0,

    resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 1,
    recast: 2.5,
    recastType: "gcd",

    duration: [],

    effect: [
        { minLevel: 10, value: "対象にかかった一部の弱体効果を1つ解除" }
    ],

    requirements: [],
    notes: [
        "白線付きデバフが解除対象"
    ],

    icon: "icons/RoleAction/HEALER/Esuna.png"
},
{
    id: "sge_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
        "リキャスト毎に使うことを推奨"
    ],

    icon: "icons/RoleAction/HEALER/Lucid_Dreaming.png"
},
{
    id: "sge_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "基本は蘇生魔法とセットで使うことが多い",
        "絶等の高難易度の場合、回復魔法や攻撃魔法に使うこともある",
    ],

    icon: "icons/RoleAction/HEALER/Swiftcast.png"
},
{
    id: "sge_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/HEALER/Surecast.png"
},
]; 

// ============================
// モンクスキルデータ
// ============================
    const MNK_SKILLS = [
    {
        id: "mnk_second_wind",
        name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },
    {
        id: "mnk_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    },
    {
        id: "mnk_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    }, 
    ]; 

// ============================
// 侍スキルデータ
// ============================
    const SAM_SKILLS = [
    {
        id: "sum_second_wind",
        name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },
    {
        id: "sum_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    }, 
    {
        id: "sum_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    },
    ]; 

// ============================
// 竜騎士スキルデータ
// ============================
    const DRG_SKILLS = [
    {
        id: "drg_battle_litany",
        name: "バトルリタニー",
        minLv: 52,
        group: "battle_litany",

        category: "burst",
        burst: "120s",
        tags: ["buff","burst"],
        timelineTags: ["buff",],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
        { minLevel: 50, value: 20 }
        ],

        effect: [
            {minLevel: 50, value:"自身と周囲のPTMのクリティカル発生率を10%UP"}
        ],

        requirements: [],
    
        notes: [],

        icon: "icons/DRG/Battle_Litany.png"
    }, 
    {
        id: "drg_second_wind",
       name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },
    {
        id: "drg_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    },
    {
        id: "drg_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    }, 
    ]; 

// ============================
// リーパースキルデータ
// ============================
    const RPR_SKILLS = [
    {
        id: "rpr_second_wind",
        name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    {
        id: "rpr_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    }, 
    {
        id: "rpr_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    },

    ]; 

// ============================
// 忍者スキルデータ
// ============================
    const NIN_SKILLS = [
    {
        id: "nin_mug",
        name: "ぶんどる",
        minLv: 15,
        group: "mug",

        category: "burst",
        burst: "120s",
        tags: ["debuff","burst"],
        timelineTags: ["buff",],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "cone",
        range: 3,
        radius: 0,

        resourceChange: [
        ],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 15, value: 20 }
        ],

        effect: [
            {minLevel: 15 , value:"対象に物理攻撃 威力:150\n対象の被ダメージ5%UP"},
        ],

        requirements: [],

        notes: ["敵撃破時、確率で追加ドロップ効果あり"],

        icon: "icons/NIN/Mug.png"
    }, 
    {
        id: "nin_Dokumori",
        name: "毒盛の術",
        minLv: 66,
        group: "mug",

        category: "burst",
        burst: "120s",
        tags: ["debuff","burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "cone",
        range: 8,
        radius: 8,

        resourceChange: [
            { resource: RESOURCE.NINKI, value: 40 }
        ],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 66, value: 20 }
        ],

        effect: [
            {minLevel: 66 , value:"前方扇範囲攻撃 威力:400\n対象の被ダメージ5%UP"},
            {minLevel: 96 , value:"前方扇範囲攻撃 威力:400\n対象の与ダメージ減少\n自身に[秘技実行可]付与"}
        ],

        requirements: [],

        notes: ["敵撃破時、確率で追加ドロップ効果あり"],

        icon: "icons/NIN/Dokumori.png"
    },
    {
        id: "nin_second_wind",
        name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },
    {
        id: "nin_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "role",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    },    
    {
        id: "nin_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "role",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    },    
    ];

// ============================
// ヴァイパースキルデータ
// ============================
    const VPR_SKILLS = [
    {
        id: "vpr_second_wind",
        name: "内丹",
        minLv: 8,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 8, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },
    {
        id: "vpr_bloodbath",
        name: "ブラッドバス",
        minLv: 12,
        group: "bloodbath",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 12, value:"効果時間中、自身の[物理攻撃]に与えたダメージの一部をHPとして吸収する効果を付与"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Bloodbath.png"
    },
    {
        id: "vpr_feint",
        name: "牽制",
        minLv: 22,
        group: "feint",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "self",
        shape: "single",
        range: 10,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 22 , value:"対象の与ダメージ減少\n[物理]10% [魔法]5%"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/MELEE/Feint.png"
    },      
    ]; 

// ============================
// 吟遊詩人スキルデータ
// ============================
    const BRD_SKILLS = [
    {
        id: "brd_second_wind",
        name: "内丹",
        minLv: 22,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 22, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },
    {
        id: "brd_battle_voice",
        name: "バトルボイス",
        minLv: 50,
        group: "battle_voice",

        category: "burst",
        burst: "120s",
        tags: ["buff","burst"],
        timelineTags: ["buff",],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
        { minLevel: 50, value: 20 }
        ],

        effect: [
            {minLevel: 50, value:"自身と周囲のPTMのDH発生率を20%UP"}
        ],

        requirements: [],
    
        notes: [],

        icon: "icons/BRD/Battle_Voice.png"
    },
    {
        id: "brd_troubadour",
        name: "トルバドゥール",
        minLv: 62,
        group: "troubadour",

        category: "mitigation",
        tags: ["mitigation", "party"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 62, value: 120 },
            { minLevel: 88, value: 90 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 62, value: 15 }
        ],

        effect: [
            { minLevel: 62, value: "周囲のPTMの被ダメージを10%軽減" },
            { minLevel: 98, value: "周囲のPTMの被ダメージを15%軽減" }
        ],

        requirements: [],

        notes: ["機工士の[タクティシャン]、踊り子の[守りのサンバ]と競合"],

        icon: "icons/BRD/Troubadour.png"
    },
    {
        id: "brd_minne",
        name: "地神のミンネ",
        minLv: 62,
        group: "minne",

        category: "buff",
        tags: ["buff", "heal"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 62, value: 15 }
        ],

        effect: [
            { minLevel: 62, value: "自身と周囲のPTMの[受けるHP回復効果]15%UP" }
        ],

        requirements: [],

        notes: [],

        icon: "icons/BRD/Natures_Minne.png"
    },      
    {
        id: "brd_radiant_finale",
        name: "光神のフィナーレ",
        minLv: 90,
        group: "radiant_finale",

        category: "burst",
        burst: "120s",
        tags: ["buff", "party","burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 110,
        recastType: "ogcd",

        duration: [
            { minLevel: 90, label: "与ダメ上昇", value: 20 },
            { minLevel: 90, label: "光神のアンコール実行可", value: 30 }
        ],

        effect: [
            {
                minLevel: 90,
                value: "自身と周囲のPTMの与ダメージを上昇\n"+
                "コーダシンボル1種: 2%\nコーダシンボル2種: 4%\nコーダシンボル3種: 6%\n"
            },
            {
                minLevel: 100,
                value: "自身と周囲のPTMの与ダメージを上昇\n"+
                "コーダシンボル1種: 2%\nコーダシンボル2種: 4%\nコーダシンボル3種: 6%\n"
                +"追加効果: 自身に[光神のアンコール実行可]を付与"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.CODA }
        ],

        notes: [],

        icon: "icons/BRD/Radiant_Finale.png"
    },
    ]; 

// ============================
// 機工士スキルデータ
// ============================
    const MCH_SKILLS = [
    {
        id: "mch_second_wind",
       name: "内丹",
        minLv: 22,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 22, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },
    {
        id: "mch_tactician",
        name: "タクティシャン",
        minLv: 56,
        group: "tactician",

        category: "mitigation",
        tags: ["mitigation", "party"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 56, value: 120 },
            { minLevel: 88, value: 90 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 56, value: 15 }
        ],

        effect: [
            { minLevel: 56, value: "周囲のPTMの被ダメージを10%軽減" },
            { minLevel: 98, value: "周囲のPTMの被ダメージを15%軽減" }
        ],

        requirements: [],

        notes:["吟遊詩人の[トルバドゥール]、踊り子の[守りのサンバ]と競合"],

        icon: "icons/MCH/Tactician.png"
    },
    {
        id: "mch_dismantle",
        name: "ウェポンブレイク",
        minLv: 62,
        group: "dismantle",

        category: "mitigation",
        tags: ["mitigation", "debuff"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 62, value: 10 }
        ],

        effect: [
            { minLevel: 62, value: "対象の与ダメージを10%減少" }
        ],

        requirements: [],

        notes: [],

        icon: "icons/MCH/Dismantle.png"
    },            
    ]; 

// ============================
// 踊り子スキルデータ
// ============================
    const DNC_SKILLS = [
    {
        id: "dnc_second_wind",
        name: "内丹",
        minLv: 22,
        group: "second_wind",

        category: "heal",
        tags: ["heal", "self", "role"],
        timelineTags: ["heal"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 22, value:"自身のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自身のHPを回復する 回復力:800"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },
    {
        id: "dnc_curing_waltz",
        name: "癒しのワルツ",
        minLv: 52,
        group: "curing_waltz",

        category: "heal",
        tags: ["heal", "party"],
        timelineTags: ["heal"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 52, value:"自身と周囲のPTMのHPを回復する 回復力:300\nダンスパートナーからも同様の範囲回復効果を発動させる"}
        ],

        requirements: [],

        notes: ["ダンスパートナーと重なって使うと回復力が2倍になる"],

        icon: "icons/DNC/Curing_Waltz.png"
    },
    {
        id: "dnc_shield_samba",
        name: "守りのサンバ",
        minLv: 56,
        group: "shield_samba",

        category: "mitigation",
        tags: ["mitigation", "party"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: [
            { minLevel: 56, value: 120 },
            { minLevel: 88, value: 90 }
        ],
        recastType: "ogcd",

        duration: [
            { minLevel: 56, value: 15 }
        ],

        effect: [
            { minLevel: 56, value: "周囲のPTMの被ダメージを10%軽減" },
            { minLevel: 98, value: "周囲のPTMの被ダメージを15%軽減" }
        ],

        requirements: [],
        
        notes: ["吟遊詩人の[トルバドゥール]、機工士の[タクティシャン]と競合"],

        icon: "icons/DNC/Shield_Samba.png"
    },
    {
        id: "dnc_closed_position",
        name: "クローズドポジション",
        minLv: 60,
        group: "closed_position",

        category: "buff",
        tags: ["buff"],
        timelineTags: ["buff"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 30,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 60, value:"PTM1人をダンスパートナーに指定し、自身に[クローズドポジション]を付与\n\n[スタンダードフィニッシュ][フィニッシングムーブ][癒しのワルツ][攻めのタンゴ]を実行するとダンスパートナーも同様の効果を得る\n再使用で解除可能"}
        ],

        requirements: [],

        notes: ["付け替えにクールタイムが発生する"],

        icon: "icons/DNC/Closed_Position.png"
    },
    {
        id: "dnc_devilment",
        name: "攻めのタンゴ",
        minLv: 62,
        group: "devilment",

        category: "buff",
        tags: ["buff", "party"],
        timelineTags: ["buff"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast:  120,
        recastType: "ogcd",

        duration: [
            { minLevel: 62, value: 20 }
        ],

        effect: [
            { minLevel: 62, value: "自身とダンスパートナーのクリティカル発生率とDH発生率を20%上昇させる" },
            { minLevel: 90, value: "自身とダンスパートナーのクリティカル発生率とDH発生率を20%上昇させる\n自身に[流星の舞実行可]を付与" }
        ],

        requirements: [],

        notes: [],

        icon: "icons/DNC/Devilment.png"
    },            
    {
        id: "dnc_improvisation",
        name: "インプロビゼーション",
        minLv: 80,
        group: "improvisation",

        category: "buff",
        tags: ["buff", "heal", "hot", "party"],
        timelineTags: ["buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 8,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 80, label: "インプロビゼーション", value: 15 },
            { minLevel: 80, label: "踊りの熱情", value: 15 },
            { minLevel: 80, label: "継続回復効果", value: 15 }
        ],

        effect: [
            {
                minLevel: 80,
                value: 
                "自身に[踊りの熱情]を付与\n"+
                "3秒ごとにスタックを蓄積する(最大4)\n"+
                "自身と周囲のPTMにHoTを付与する 回復力:100\n"+
                "移動または他アクション実行で終了\n"+
                "再実行で[インプロビゼーションフィニッシュ]発動"
            }
        ],

        requirements: [],

        notes: [],

        icon: "icons/DNC/Improvisation.png"
    },
    {
        id: "dnc_improvised_finish",
        name: "インプロビゼーション・フィニッシュ",
        minLv: 80,
        group: "improvised_finish",

        category: "mitigation",
        tags: ["barrier", "party", "buff"],
        timelineTags: ["barrier"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 8,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 1.5,
        recastType: "ogcd",

        duration: [
            { minLevel: 80, value: 30 }
        ],

        effect: [
            {
                minLevel: 80,
                value: 
                "自身と周囲のPTMにバリアを付与\n効果量は[踊りの熱情]のスタック数に応じて変化\n"+
                "0: 最大HPの5%\n1: 最大HPの6%\n2: 最大HPの7%\n3: 最大HPの8%\n4: 最大HPの10%\n"
            }
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.IMPROVISATION }
        ],

        notes: ["インプロビゼーション・フィニッシュを押す前に動いたりほかのアクションを押すとprocが消失する"],

        icon: "icons/DNC/Improvised_Finish.png"
    },
    ]; 

// ============================
// 黒魔道士スキルデータ
// ============================
    const BLM_SKILLS = [
    {
        id: "blm_manaward",
        name: "マバリア",
        minLv: 30,
        group: "manaward",

        category: "mitigation",
        tags: ["mitigation", "barrier"],
        timelineTags: ["mitigation","barrier"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            { minLevel: 30, value: 20 },
        ],

        effect: [
            {minLevel: 30 , value:"自身に[最大HPの30%分]を無効化するバリアを張る"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/BLM/Manaward.png"
    },
    // ロールアクション
    {
        id: "blm_addle",
        name: "アドル",
        minLv: 8,
        group: "addle",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 8, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"対象の与ダメージ減少\n[物理]5% [魔法]10%"}
        ],

        requirements: [],

        notes: [],
        
        icon: "icons/RoleAction/CASTER/Addle.png"
    },
    {
    id: "blm_sleep",
    name: "スリプル",
    minLv: 10,
    group: "sleep",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemies",
    origin: "target",
    shape: "circle",
    range: 30,
    radius: 5,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 10, value: 30 }
    ],

    effect: [
        { minLevel: 10, value: "対象とその周囲の敵に睡眠を付与" }
    ],

    requirements: [],

    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/ROLE/Sleep.png"
},
    {
    id: "blm_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
        "AF中は効果無効"
    ],

    icon: "icons/RoleAction/CASTER/Lucid_Dreaming.png"
},
    {
    id: "blm_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "三連魔効果中は三連魔が優先される"
    ],

    icon: "icons/RoleAction/CASTER/Swiftcast.png"
},
{
    id: "blm_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/CASTER/Surecast.png"
},            
    ]; 


// ============================
// 召喚士スキルデータ
// ============================
    const SMN_SKILLS = [
    {
        id: "smn_radiant_aegis",
        name: "守りの光",
        minLv: 2,
        group: "radiant_aegis",

        category: "mitigation",
        tags: ["mitigation", "barrier", "pet"],
        timelineTags: ["barrier"],

        type: "pet",
        target: "self",
        origin: "pet",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: [
            { minLevel: 2, value: 1 },
            { minLevel: 88, value: 2 }
        ],
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            {minLevel: 2, value: 30 }
        ],

        effect: [
            {minLevel: 2, value:"召喚者に[最大HP20%分]のバリアを張る"},
            {minLevel: 88, value:"召喚者に[最大HP20%分]のバリアを張る"}
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.CARBUNCLE}
        ],

        notes: [],

        icon: "icons/SMN/Radiant_Aegis.png"
    },
    {
        id: "smn_physick",
        name: "フィジク",
        minLv: 4,
        group: "physick",

        category: "heal",
        tags: ["heal","magic"],
        timelineTags: ["heal"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [
        { resource: RESOURCE.MP, value: -400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 1.5,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 4, value:"対象のHP回復 回復力:400"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/SMN/Physick.png"
    },
    {
        id: "smn_resurrection",
        name: "リザレク",
        minLv: 12,
        group: "resurrection",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 8,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 12 , value:"対象を衰弱状態で蘇生"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/SMN/Resurrection.png"
    },
    {
        id: "smn_searing_light",
        name: "シアリングライト",
        minLv: 66,
        group: "searing_light",

        category: "burst",
        burst: "120s",
        tags: ["buff", "party","burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            {minLevel: 66, value: 20 }
        ],

        effect: [
            {minLevel: 66 , value:"自身と範囲内のPTMの与ダメージ5%上昇"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/SMN/Searing_Light.png"
    },
    {
        id: "smn_everlasting_flight",
        name: "不死鳥の翼",
        minLv: 80,
        group: "everlasting_flight",

        category: "heal",
        tags: ["heal", "hot", "pet", "party"],
        timelineTags: ["heal"],

        type: "pet",
        target: "party",
        origin: "pet",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: null,
        recastType: "ogcd",

        duration: [
            {minLevel: 80, value: 21 }
        ],

        effect: [
            {minLevel: 80 , value:"周囲のPTMにHoT付与 回復力:100"}
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.PHOENIX}
        ],

        notes: ["デミ・フェニックス顕現時自動付与","ホットバー登録不可"],

        icon: "icons/SMN/Everlasting_Flight.png"
    },
    {
        id: "smn_rekindle",
        name: "再生の炎",
        minLv: 80,
        group: "rekindle",

        category: "heal",
        tags: ["heal", "hot", "pet"],
        timelineTags: ["heal"],

        type: "pet",
        target: "singleAlly",
        origin: "pet",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 20,
        recastType: "ogcd",

        duration: [
            {minLevel: 80, label: "再生の炎", value: 30 },
            {minLevel: 80, label: "継続回復効果", value: 15 }
        ],

        effect: [
            {minLevel: 80 , value:"対象のHPを回復する 回復力:400\n対象に[再生の炎]を付与 対象のHP75%以下or効果時間終了でHoT付与 回復力:200"}
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.PHOENIX}
        ],

        notes: [],

        icon: "icons/SMN/Rekindle.png"
    },
    {
        id: "smn_lux_solaris",
        name: "ルクス・ソラリス",
        minLv: 100,
        group: "lux_solaris",

        category: "heal",
        tags: ["heal", "party"],
        timelineTags: ["heal"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 15,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [],

        effect: [
            {minLevel: 100 , value:"自身と周囲のPTMのHP回復 回復力:500"}
        ],

        requirements: [
            { type: "buff", buff: RESOURCE.LUXSOLARIS}
        ],

        notes: [],

        icon: "icons/SMN/Lux_Solaris.png"
    },
    // ロールアクション
        {
        id: "smn_addle",
        name: "アドル",
        minLv: 8,
        group: "addle",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 8, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"対象の与ダメージ減少\n[物理]5% [魔法]10%"}
        ],

        requirements: [],

        notes: [],
        
        icon: "icons/RoleAction/CASTER/Addle.png"
    },
    {
    id: "smn_sleep",
    name: "スリプル",
    minLv: 10,
    group: "sleep",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemies",
    origin: "target",
    shape: "circle",
    range: 30,
    radius: 5,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 10, value: 30 }
    ],

    effect: [
        { minLevel: 10, value: "対象とその周囲の敵に睡眠を付与" }
    ],

    requirements: [],

    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/ROLE/Sleep.png"
},
    {
    id: "smn_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
    ],

    icon: "icons/RoleAction/CASTER/Lucid_Dreaming.png"
},
    {
    id: "smn_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "攻撃以外にも蘇生に使うこともある"
    ],

    icon: "icons/RoleAction/CASTER/Swiftcast.png"
},
{
    id: "smn_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/CASTER/Surecast.png"
},  
    ]; 

// ============================
// 赤魔道士スキルデータ
// ============================
    const RDM_SKILLS = [
    {
        id: "rdm_varcure",
        name: "ヴァルケアル",
        minLv: 54,
        group: "vercure",

        category: "heal",
        tags: ["heal","magic"],
        timelineTags: ["heal"],

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
        { resource: RESOURCE.MP, value: -500 }
        ],
        skillType:"spell",
        charges: null,
        castTime: 2,
        recast: 2.5,
        recastType: "gcd",
       
        duration: [],

        effect: [
            {minLevel: 54 , value:"対象のHP回復 回復力:350"}
        ],

        requirements: [],

        notes: ["[連続魔]対象スキル"],

        icon: "icons/RDM/Vercure.png"
    },
    {
        id: "rdm_embolden",
        name: "エンボルデン",
        minLv: 58,
        group: "embolden",

        category: "burst",
        burst: "120s",
        tags: ["buff", "party","burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",
       
        duration: [
            { minLevel: 58, value: 20 },
        ],

        effect: [
            {minLevel: 58 , value:"周囲のPTMの与ダメージ5%上昇\n自身の[与魔法ダメージ]10%上昇"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RDM/Embolden.png"
    },  
    {
        id: "rdm_verraise",
        name: "ヴァルレイズ",
        minLv: 64,
        group: "verraise",

        category: "raise",
        tags: ["raise", "magic"],
        timelineTags: ["raise"],
        

        type: "player",
        target: "singleAlly",
        origin: "self",
        shape: "single",
        range: 30,
        radius: 0,

        resourceChange: [
            { resource: RESOURCE.MP, value: -2400 }
        ],
        skillType: "spell",
        charges: null,
        castTime: 10,
        recast: 2.5,
        recastType: "gcd",

        duration: [],

        effect: [
            {minLevel: 64 , value:"対象を衰弱状態で蘇生"}
        ],

        requirements: [],

        notes: ["[連続魔]対象スキル"],

        icon: "icons/RDM/Verraise.png"
    },
    {
        id: "rdm_magick_barrier",
        name: "バマジク",
        minLv: 86,
        group: "magick_barrier",

        category: "mitigation",
        tags: ["mitigation", "buff", "party"],
        timelineTags: ["mitigation", "buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType: "ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            {minLevel:86, value: 10}
        ],

        effect: [
            {minLevel: 86, value:"自身と周囲のPTMの[被魔法ダメージ]10%軽減 [受ける回復効果]5%上昇"}
        ],

        requirements: [],

        notes: [],

        icon: "icons/RDM/Magick_Barrier.png"
    },
    // ロールアクション
    {
        id: "rdm_addle",
        name: "アドル",
        minLv: 8,
        group: "addle",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 8, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"対象の与ダメージ減少\n[物理]5% [魔法]10%"}
        ],

        requirements: [],

        notes: [],
        
        icon: "icons/RoleAction/CASTER/Addle.png"
    },
    {
    id: "rdm_sleep",
    name: "スリプル",
    minLv: 10,
    group: "sleep",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemies",
    origin: "target",
    shape: "circle",
    range: 30,
    radius: 5,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 10, value: 30 }
    ],

    effect: [
        { minLevel: 10, value: "対象とその周囲の敵に睡眠を付与" }
    ],

    requirements: [],

    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/ROLE/Sleep.png"
},
    {
    id: "rdm_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
    ],

    icon: "icons/RoleAction/CASTER/Lucid_Dreaming.png"
},
    {
    id: "rdm_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "攻撃以外にも蘇生に使うこともある",
        "連続魔がある場合連続魔が先に消費される"
    ],

    icon: "icons/RoleAction/CASTER/Swiftcast.png"
},
{
    id: "rdm_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/CASTER/Surecast.png"
},      
    ]; 


// ============================
// ピクトマンサースキルデータ
// ============================
    const PCT_SKILLS = [
    {
        id: "pct_tempera_coat",
        name: "テンペラコート",
        minLv: 10,
        group: "tempera_coat",

        category: "mitigation",
        tags:["mitigation", "barrier"],
        timelineTags: ["mitigation","barrier"],

        type: "player",
        target: "self",
        origin: "self",
        shape: "single",
        range: 0,
        radius:0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            {minLevel: 10, value:10}
        ],

        effect: [
            {minLevel: 10, value:"自身に[最大HPの20%分]のバリアを張る"},
            {minLevel: 88, value:"自身に[最大HPの20%分]のバリアを張る\n[テンペラグラッサ]実行可能"}
        ],

        requirements: [],

        notes: ["バリアが割れると[テンペラコート]リキャスト60秒短縮"],
        
        icon: "icons/PCT/Tempera_Coat.png"
    },
    {
        id:"pct_starry_muse",
        name: "イマジンスカイ",
        minLv: 70,
        group: "starry_muse",
        
        category: "burst",
        burst: "120s",
        tags: ["buff","party","burst"],
        timelineTags: ["buff"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 120,
        recastType: "ogcd",

        duration: [
            {minLevel: 70, label: "イマジンスカイ(PT与ダメUP)", value: 20 },
            {minLevel: 70, label: "インスタレーション", value: 30 }
        ],

        effect: [
            {minLevel: 70, 
             value:"自身と周囲のPTMの与ダメージ5%上昇\n[インスタレーション]5スタック付与\n[サブトラクティブパレット実行可]付与"
            }
        ],

        requirements: [
            { type: "combat" },
            { type: "resource", resource: RESOURCE.PICTSKY, min: 1 }
        ],

        notes: [],

        icon: "icons/PCT/Starry_Muse.png"
    },          
    {
        id: "pct_tempera_grassa",
        name: "テンペラグラッサ",
        minLv: 88,
        group: "tempera_grassa",

        category: "mitigation",
        tags:["party","mitigation","barrier"],
        timelineTags: ["mitigation","barrier"],

        type: "player",
        target: "party",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 30,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 1,
        recastType: "ogcd",

        duration: [
            {minLevel:88, value: 10}
        ],

        effect: [
            {minLevel: 88, value:"[テンペラコート]を解除し、自身と周囲のPTMに[対象の最大HPの10%分]のバリアを張る"}
        ],

        requirements: [
           { type:"buff", buff:RESOURCE.TEMPERACOAT }
        ],

        notes: ["自分に付与されたバリアが割れると[テンペラコート]リキャスト30秒短縮"],
        
        icon: "icons/PCT/Tempera_Grassa.png"
    }, 
    // ロールアクション
        {
        id: "pct_addle",
        name: "アドル",
        minLv: 8,
        group: "addle",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "target",
        shape: "single",
        range: 25,
        radius: 0,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 90,
        recastType: "ogcd",

        duration: [
            { minLevel: 8, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"対象の与ダメージ減少\n[物理]5% [魔法]10%"}
        ],

        requirements: [],

        notes: [],
        
        icon: "icons/RoleAction/CASTER/Addle.png"
    },
    {
    id: "pct_sleep",
    name: "スリプル",
    minLv: 10,
    group: "sleep",

    category: "utility",
    tags: ["debuff", "magic"],
    timelineTags: ["debuff"],

    type: "role",
    target: "enemies",
    origin: "target",
    shape: "circle",
    range: 30,
    radius: 5,

    resourceChange: [
        { resource: RESOURCE.MP, value: -800 }
    ],
    skillType: "spell",
    charges: null,
    castTime: 2.5,
    recast: 2.5,
    recastType: "gcd",

    duration: [
        { minLevel: 10, value: 30 }
    ],

    effect: [
        { minLevel: 10, value: "対象とその周囲の敵に睡眠を付与" }
    ],

    requirements: [],

    notes: [
        "実行後にオートアタックを停止する",
        "特定の敵の詠唱を止めるために使うことがある"
    ],

    icon: "icons/ROLE/Sleep.png"
},
    {
    id: "pct_lucid_dreaming",
    name: "ルーシッドドリーム",
    minLv: 14,
    group: "lucid_dreaming",

    category: "utility",
    tags: ["resource", "mp"],
    timelineTags: ["resource"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 60,
    recastType: "ogcd",

    duration: [
        { minLevel: 14, value: 21 }
    ],

    effect: [
        { minLevel: 14, value: "自身のMPを継続回復\n効果量:55" }
    ],

    requirements: [],
    notes: [
        "MP管理用ロールアクション",
    ],

    icon: "icons/RoleAction/CASTER/Lucid_Dreaming.png"
},
    {
    id: "pct_swiftcast",
    name: "迅速魔",
    minLv: 18,
    group: "swiftcast",

    category: "utility",
    tags: ["buff", "magic", "raise"],
    timelineTags: ["buff", "raise"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: [
        { minLevel: 18, value: 60 },
        { minLevel: 94, value: 40 }
    ],
    recastType: "ogcd",

    duration: [
        { minLevel: 18, value: 10 }
    ],

    effect: [
        { minLevel: 18, value: "効果時間中に実行する1回の魔法について、詠唱時間なしで詠唱可能" }
    ],

    requirements: [],
    notes: [
        "ピクト系の技に使うとGCDが回るのが遅い"
    ],

    icon: "icons/RoleAction/CASTER/Swiftcast.png"
},
{
    id: "pct_surecast",
    name: "堅実魔",
    minLv: 44,
    group: "surecast",

    category: "utility",
    tags: ["buff"],
    timelineTags: ["buff"],

    type: "role",
    target: "self",
    origin: "self",
    shape: "self",
    range: 0,
    radius: 0,

    resourceChange: [],
    skillType: "ability",
    charges: null,
    castTime: null,
    recast: 120,
    recastType: "ogcd",

    duration: [
        { minLevel: 44, value: 6 }
    ],

    effect: [
        { minLevel: 44, value: "一定時間、詠唱妨害を受けなくなる\n一部を除くノックバックと引き寄せを無効化" }
    ],

    requirements: [],
    notes: [
        "ノックバック無効用に使うことがほとんど",
        "コールでは「アムレン」といわれることが多い"
    ],

    icon: "icons/RoleAction/CASTER/Surecast.png"
},                      
    ]; 

//============
//ジョブデータ
//===========
const JOB_SKILLS = {
    PLD: PLD_SKILLS,
    WAR: WAR_SKILLS,
    DRK: DRK_SKILLS,
    GNB: GNB_SKILLS,
    WHM: WHM_SKILLS,
    SCH: SCH_SKILLS,
    AST: AST_SKILLS,
    SGE: SGE_SKILLS,
    MNK: MNK_SKILLS,
    SAM: SAM_SKILLS,
    DRG: DRG_SKILLS,
    RPR: RPR_SKILLS,
    NIN: NIN_SKILLS,
    VPR: VPR_SKILLS,
    BRD: BRD_SKILLS,
    MCH: MCH_SKILLS,
    DNC: DNC_SKILLS,
    BLM: BLM_SKILLS,
    SMN: SMN_SKILLS,
    RDM: RDM_SKILLS,
    PCT: PCT_SKILLS,
};

 function renderSkills(jobKey) {
    skillList.innerHTML = "";

    const skills = JOB_SKILLS[jobKey];
    if (!skills) {
        console.error("NO SKILLS for:", jobKey);
        return;
    }

    const selectedByGroup = {};

    skills.forEach(skill => {
        const currentLv = Number(lv.value);
        const needLv = Number(skill.minLv ?? skill.minLevel ?? 0);

        if (currentLv >= needLv) {
            const key = skill.group;
            const existing = selectedByGroup[key];
            const existingLv = Number(existing?.minLv ?? existing?.minLevel ?? 0);

            if (!existing || needLv > existingLv) {
                selectedByGroup[key] = skill;
            }
        }
    });
        
        //並び替え
        let displaySkills = Object.values(selectedByGroup);

        //カテゴリ絞り込み
        if(categoryFilter !== "all") {
            displaySkills = displaySkills.filter(skill => {

                const cat =skill.category;

                if (!cat) return categoryFilter === "other";

                if (Array.isArray(cat)) {
                    return cat.includes(categoryFilter);
                }
                return cat === categoryFilter;
            });
        }

        if (burstFilter !== "all") {
            displaySkills = displaySkills.filter(skill => {
                if (burstFilter === "other") {
                    return skill.burst && skill.burst !== "120s" && skill.burst !== "60s";
                }
                return skill.burst === burstFilter;
            });
        }

        console.log(displaySkills.map(s => s.name));
        

        if (sortMode === "level") {
            displaySkills.sort((a,b) => {
           return Number(a.minLv ?? a.minLevel ?? 0) - Number(b.minLv ?? b.minLevel ?? 0);
        });
        }

        if (sortMode === "recast") {
            displaySkills.sort((a,b) => {
            const currentLv = Number(lv.value);

                const ra = pickByLevel(a.recast, currentLv);
                const rb = pickByLevel(b.recast, currentLv);

                if (ra == null && rb == null) {
                    return Number(a.minLv ?? a.minLevel ?? 0) -Number(b.minLv ?? b.minLevel ?? 0);
                }
                if (ra == null) return 1;
                if (rb == null) return -1;

                if (ra !== rb) return ra - rb;

                return (Number(a.minLv ?? a.minLevel ?? 0)) - (Number(b.minLv ?? b.minLevel ?? 0))
            });
        }

        

        displaySkills.forEach((skill) => {

            const currentLv = Number(lv.value);

            // ============================
            // スキルカード
            // ============================

            const card = document.createElement("div");
            card.className = "skill-card";

            const top = document.createElement("div");
            top.className = "skill-top";

            const mpEl = document.createElement("span");
            mpEl.className = "time-item";

            const recastEl = document.createElement("span");
            recastEl.className = "time-item";

            const durationEl = document.createElement("span");
            durationEl.className = "time-item";

            const timeWrap = document.createElement("span");
            timeWrap.className = "time-wrap";

            const resourceEl = document.createElement("span");
            resourceEl.className = "skill-resource";

            const mpCost = pickByLevel(skill.mpCost, currentLv);
            const recastSec = pickByLevel(skill.recast, currentLv); 
            const durationSec = pickByLevel(skill.duration, currentLv);

            // MP
            //if (mpCost != null) {
            //    mpEl.textContent = `MP ${mpCost}`;
            //    timeWrap.appendChild(mpEl);
            //}

            //GCD or リキャスト
            if (skill.recastType === "gcd") {
                recastEl.textContent = "GCD"; //将来SS対応で変えられる
            } else if (recastSec != null) {
                recastEl.textContent = `Recast ${formatRecast(recastSec)}`;
            } else {
                recastEl.textContent = "";
            }

            if (recastEl.textContent) {
                timeWrap.appendChild(recastEl);
            };

            //効果時間
            if (Array.isArray(skill.duration) && skill.duration.length > 0) {
                const validDurations = skill.duration.filter((d) => currentLv >= d.minLevel);

                if (validDurations.length > 0) {
                    const labelEl = document.createElement("span");
                    labelEl.className = "time-item";
                    labelEl.textContent = "効果時間 ";
                    timeWrap.appendChild(labelEl);

                    const latestByLabel = {};

                    validDurations.forEach(d => {  
                        const key = d.label || "";

                        if (!latestByLabel[key] || d.minLevel > latestByLabel[key].minLevel) {
                            latestByLabel[key] = d;
                        }
                    });

                    Object.values(latestByLabel).forEach(d => {
                        const dEl = document.createElement("span");
                        dEl.className = "time-item";

                    if (d.label) {
                        dEl.textContent = `${d.label} ${d.value}s`;
                    } else {
                        dEl.textContent = `${d.value}s`;
                    }

                    timeWrap.appendChild(dEl);
                });
            }
        } else if (durationSec != null) {
            durationEl.textContent = `効果時間 ${durationSec}s`;
            timeWrap.appendChild(durationEl);
        }

            //範囲
            let rangeText = "";
            if (skill.origin && skill.shape) {
            const o = ORIGIN_LABEL[skill.origin] ?? skill.origin;
            const s = SHAPE_LABEL[skill.shape] ?? skill.shape;
            rangeText = `${o} / ${s}`;
            };

            if (rangeText) {
                const rangeEl = document.createElement("span");
                rangeEl.className = "time-item";
                rangeEl.textContent = rangeText;
                timeWrap.appendChild(rangeEl);
            }

            //リソース系
            if (Array.isArray(skill.resourceChange) && skill.resourceChange.length > 0) {
                const resourceTexts = skill.resourceChange
                    .filter((r) => r.minLevel == null || currentLv >= r.minLevel)
                    .map((r) => {

                    const key = r.resource;
                    const name = RESOURCE_LABEL[key] ?? key;
                    const amount = r.value;

                    if (amount > 0) {
                        if (key === "mp") {
                            return `${name}：${amount}回復`; //MP回復
                        } else {
                            return `${name}：${amount}獲得`; //リソース回復
                        }
                    } else {
                    return `${name}：${Math.abs(amount)}消費`;  //消費
                    }
                });
                if (resourceTexts.length > 0) {
                    resourceEl.textContent = resourceTexts.join(" / ");
                }
            }

            const icon = document.createElement("img");
            icon.className = "skill-icon"; 
            icon.src = skill.icon;
            icon.alt = skill.name;

            const titleWrap = document.createElement("div");

            const nameEl = document.createElement("div");
            nameEl.className = "skill-name";
            nameEl.textContent = skill.name;

            const tagsEl = document.createElement("div");
            tagsEl.className = "skill-tags";

            (skill.tags || []).forEach((t) => {
                const tag = document.createElement("span");
                tag.className = "tag"

                const label = TAG_LABEL[t] ?? t;
                tag.textContent = label;
                
                tagsEl.appendChild(tag);
            });

            titleWrap.appendChild(nameEl);
            titleWrap.appendChild(timeWrap);

            if (resourceEl.textContent) {
                titleWrap.appendChild(resourceEl);
            }

            titleWrap.appendChild(tagsEl);

            top.appendChild(icon);
            top.appendChild(titleWrap);


            const body = document.createElement("div");
            body.className = "skill-body";
            

            if (Array.isArray(skill.effect)) {
                // レベルで変化するeffect
            const activeEffect = skill.effect
             .filter(e => currentLv >= e.minLevel)
             .at(-1);

             body.textContent = activeEffect ? activeEffect.value : "";
        } else {
            // 文字列effect
            body.textContent = skill.effect ?? "";
        }

            card.appendChild(top);
            card.appendChild(body);

            // requirements表示
            if (Array.isArray(skill.requirements) && skill.requirements.length > 0) {
                const reqEl = document.createElement("div");
                reqEl.className = "skill-req";

                skill.requirements.forEach((req) => {
                    const line = document.createElement("div");
                

                if (req.type === "resource") {
                const label = RESOURCE_LABEL[req.resource] ?? req.resource;
                line.textContent = `${label}：${req.min}以上必要`;
                }
            
                if (req.type === "combat") {
                line.textContent = REQUIREMENT_TYPE_LABEL[req.type] ?? req.type;
                }

                if (req.type === "buff") {
                    const rawNames = req.names ?? (req.buff ? [req.buff] : []);
                    const names = rawNames.map(name => RESOURCE_LABEL[name] ?? name);

                if (names.length === 1) {
                    line.textContent = `${names[0]}が必要`;
                } else if (names.length > 1 ){
                line.textContent = `${names.join("/")} のいずれかが必要`;
                }
            }

            if (line.textContent) {
                reqEl.appendChild(line);
            }
        });

        if (reqEl.childNodes.length > 0) {
            card.appendChild(reqEl);
        }
    }
    //notes表示
    // notes表示
    if (Array.isArray(skill.notes) && skill.notes.length > 0) {
        const noteEl = document.createElement("div");
        noteEl.className = "skill-notes";

        skill.notes.forEach(note => {
            let noteText = "";

            if (typeof note === "string") {
                noteText = note;
            } else if (typeof note === "object" && currentLv >= note.minLevel) {
                noteText = note.value;
            }

            if (noteText) {
                const line = document.createElement("div");
                line.textContent = `⚠️[${noteText}]`;
                noteEl.appendChild(line);
            }
        });

        if (noteEl.childNodes.length > 0) {
            card.appendChild(noteEl);
        }
    }

    skillList.appendChild(card);
});

// renderSkills 終了
}
    

// ============================
// レベルスライダー関連
// ============================
lv.addEventListener("input", () => {
    lvValue.textContent = lv.value;

    if (currentJobKey) {
        renderSkills(currentJobKey);
    }

    const shortName = currentJobEl.textContent.split(" / ")[1] || "";
    if (shortName) {
        document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
    }
});

//初期表示
lvValue.textContent = lv.value;

if (statusBar.hidden) {
    document.title = "JQG-ジョブクイックガイド";
} else {
    //タイトル変更処理
    const shortName = currentJobEl.textContent.split(" / ")[1] || "";
    if (shortName) {
        document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
    }
}

// ============================
// ジョブボタン関連
// ============================
const jobButtons = document.querySelectorAll(".job");


// 絶モード
document.querySelectorAll(".ultimate-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!currentJobKey) return;

        const level = Number(btn.dataset.level);

        // スライダーの値を変更
        lv.value = level;
        lvValue.textContent = level;

        // active切り替え
        document.querySelectorAll(".ultimate-buttons button").forEach(b => {
            b.classList.remove("active");
        });
        btn.classList.add("active");

        // 再描画
        renderSkills(currentJobKey);

        // タイトル更新
        const shortName = currentJobEl.textContent.split(" / ")[1] || "";
        if (shortName) {
            document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
        }
    });
});



jobButtons.forEach(button => {
    button.addEventListener("click",function(){

        //全ボタンからactiveを外す
        document.querySelectorAll(".job").forEach(b => {
            b.classList.remove("active","active-tank", "active-healer", "active-dps");
        });

        const role = button.dataset.role;

        //押したボタンだけactiveにする
        button.classList.add("active");

        //ロール別active
        if (role === "tank") {
            button.classList.add("active-tank");
        } else if (role === "healer") {
            button.classList.add("active-healer");
        } else if (role === "dps") {
            button.classList.add("active-dps");
        }

        const shortName = button.dataset.job;
        const fullName = button.dataset.name;

        const hasSkills = !!JOB_SKILLS[shortName];
        console.log("clicked shortName=", shortName, "hasSkills=", hasSkills);

        skillArea.hidden = !hasSkills;

        if(hasSkills) {
            currentJobKey = shortName;
            renderSkills(shortName);
        }


        currentJobEl.textContent = `${fullName} / ${shortName}`;

        statusBar.hidden = false;

        document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
    });
});



// ============================
// モード切替（保存あり）
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeToggle");

    // themeToggle がないページでは何もしない
    if (!toggle) return;

    // 保存されたテーマを読み込む
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }

    // トグルクリック
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });
});