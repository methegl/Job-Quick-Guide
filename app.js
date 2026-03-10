console.log("app.js loaded v0.4");

// ============================
// DOM取得
// ============================
const lv =document.getElementById("lv");
const lvValue = document.getElementById("lvValue");
const statusBar = document.getElementById("statusBar");
const skillArea = document.getElementById("skillArea");
const skillList = document.getElementById("skillList");

let sortMode = "level";
const sortSelect = document.getElementById("sortSelect");

let categoryFilter = "all";
const categorySelect = document.getElementById("categorySelect");

sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;

    //今選ばれてるジョブで描画しなおす
    if (currentJobKey) {
        renderSchSkills(currentJobKey);
    }
});

categorySelect.addEventListener("change", () => {
    categoryFilter = categorySelect.value;

    if (currentJobKey) {
        renderSchSkills(currentJobKey);
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
    movement: "移動補助"
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
//offense     = 攻撃
//heal        = 回復
//raise       = 蘇生
//mitigation  = 軽減
//buff        = 火力バフ
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

// ============================
// ナイトスキルデータ
// ============================
    const PLD_SKILLS = [
    {
        id: "pld_second_wind",
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"範囲内の敵の与ダメージ10%減少"}
        ],

        requirements: [],

        notes: ["効果範囲は[自分中心5m]"],

        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
     ]

// ============================
// 戦士スキルデータ
// ============================
    const WAR_SKILLS = [
        {
        id: "pld_second_wind",
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"範囲内の敵の与ダメージ10%減少"}
        ],

        requirements: [],

        notes: ["効果範囲は[自分中心5m]"],

        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
     ];

// ============================
// 暗黒騎士スキルデータ
// ============================
    const DRK_SKILLS = [
        {
        id: "pld_second_wind",
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"範囲内の敵の与ダメージ10%減少"}
        ],

        requirements: [],

        notes: ["効果範囲は[自分中心5m]"],

        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
      ];

// ============================
// ガンブレスキルデータ
// ============================
    const GNB_SKILLS = [
        {
        id: "pld_second_wind",
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemies",
        origin: "self",
        shape: "circle",
        range: 0,
        radius: 5,

        resourceChange: [],
        skillType:"ability",
        charges: null,
        castTime: null,
        recast: 60,
        recastType: "ogcd",

        duration: [
            { minLevel: 22, value: 10 },
            { minLevel: 98, value: 15 }
        ],

        effect: [
            {minLevel: 8 , value:"範囲内の敵の与ダメージ10%減少"}
        ],

        requirements: [],

        notes: ["効果範囲は[自分中心5m]"],

        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
       ];

// ============================
// 白魔道士スキルデータ
// ============================
    const WHM_SKILLS = [
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
    ]; 

// ============================
// 学者スキルデータ
// ============================
    const SCH_SKILLS = [
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
            {minLevel: 30, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の125%\n賢者の[エウクラシア系]と競合"},
            {minLevel: 85, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の180%\n賢者の[エウクラシア系]と競合"}
        ],

        requirements: [],

        notes: [
                "賢者の[エウクラシア・ディアグノシス][エウクラシア・プログノシス]と競合",
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
                "賢者の[エウクラシア・ディアグノシス][エウクラシア・プログノシス]と競合",
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
            { minLevel: 78, value: "エリア内10%軽減+HoT付与"}
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

        note: ["[秘策]対象スキル"],

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
                value: "[鼓舞激励の策][士気高揚の策][意気軒高の策]のバリア分を回復効果に置き換える"
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

        category: "buff",
        tags: ["buff", "debuff"],
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
                minLevel: 66,value: "対象のクリティカルヒットを受ける確率10%上昇",
                minLevel: 92,value: "対象のクリティカルヒットを受ける確率10%上昇\n自身に[埋伏の毒]実行可付与"
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

        notes: ["対象スキル[鼓舞激励の策][士気高揚の策][意気軒高の策][不撓不屈の策][深謀遠慮の策]"],

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
                "賢者の[エウクラシア・ディアグノシス][エウクラシア・プログノシス]と競合",
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
            {minLevel: 96, value:"[鼓舞激励の策][意気軒高の策]を[マニフェステーション][アクセッション]に強化\n範囲内のPTMにHoT付与"},
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
                "賢者の[エウクラシア・ディアグノシス][エウクラシア・プログノシス]と競合",
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
                "賢者の[エウクラシア・ディアグノシス][エウクラシア・プログノシス]と競合",
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
    }  
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
    ];

// ============================
// 賢者スキルデータ
// ============================
    const SEG_SKILLS = [
     {
        id: "seg_egeiro",
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
        
        icon: "icons/SEG/Egeiro.png"
    },   
    ]; 

// ============================
// モンクスキルデータ
// ============================
    const MNK_SKILLS = [
    {
        id: "mnk_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// 侍スキルデータ
// ============================
    const SAM_SKILLS = [
    {
        id: "sum_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// 竜騎士スキルデータ
// ============================
    const DRG_SKILLS = [
    {
        id: "drg_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// リーパースキルデータ
// ============================
    const RPR_SKILLS = [
    {
        id: "rpr_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },  
    ]; 

// ============================
// 忍者スキルデータ
// ============================
    const NIN_SKILLS = [
    {
        id: "nin_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },    
    ];

// ============================
// ヴァイパースキルデータ
// ============================
    const VPR_SKILLS = [
    {
        id: "vpr_second_wind",
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

        icon: "icons/RoleAction/MELEE/Second_Wind.png"
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

        category: "buff",
        tags: ["buff"],
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
        id: "brd_troubadour",
        name: "地神のミンネ",
        minLv: 62,
        group: "troubadour",

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

        icon: "icons/BRD/Troubadour.png"
    },      
    {
        id: "brd_radiant_finale",
        name: "光神のフィナーレ",
        minLv: 90,
        group: "radiant_finale",

        category: "buff",
        tags: ["buff", "party"],
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

        note: ["ダンスパートナーと重なって使うと回復力が2倍になる"],

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
        target: "singlAlly",
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

        reqirements: [],

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
        id: "smn_addle",
        name: "アドル",
        minLv: 8,
        group: "addle",

        category: "mitigation",
        tags:["mitigation","debuff","role"],
        timelineTags: ["mitigation"],

        type: "player",
        target: "enemy",
        origin: "self",
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

        category: "buff",
        tags: ["buff", "party"],
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
    ]; 

// ============================
// 赤魔道士スキルデータ
// ============================
    const RDM_SKILLS = [
    {
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

        category: "buff",
        tags: ["buff", "party"],
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
    ]; 


// ============================
// ピクトマンサースキルデータ
// ============================
    const PCT_SKILLS = [
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
        
        category: "buff",
        tags: ["buff","party"],
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
    SGE: SEG_SKILLS,
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

 function renderSchSkills(jobKey) {
    skillList.innerHTML = "";

    const skills = JOB_SKILLS[jobKey];
    if (!skills) return;

    const selectedByGroup = {};

    if (!skills) {
        console.error("NO SKILLS for:", jobKey);
        return;
    }

    skills.forEach(skill => {
        //console.log("sample", skills[0]);
        const currentLv = Number(lv.value);

        const needLv = Number(skill.minLv ?? skill.minLevel ?? 0);
        if (currentLv >= needLv) {
        
        //if (currentLv >= skill.minLv) {
            const key =skill.group;
            
            if(key === "morale") {
                // console.log("morale candidate:", skill.name, "minLv;", skill.minLv);
            }

            const existing = selectedByGroup[key];

            if (!existing || skill.minLv > existing.minLv) {
                selectedByGroup[key] = skill;
            }
        }
        });
        
        //並び替え
        let displaySkills = Object.values(selectedByGroup);

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

        if (sortMode === "level") {
            displaySkills.sort((a,b) => {
           return Number(a.minLv ?? a.minLevel ?? 0) - Number(b.minLv ?? b.minLevel ?? 0);
        });
        }

        if (sortMode === "recast") {
            displaySkills.sort((a,b) => {
            const ra = a.recast ?? null;
            const rb = b.recast ?? null;

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
            if (Array.isArray(skill.duration)) {
                //ラベル追加
                const labelEl = document.createElement("span");
                labelEl.className = "time-item";
                labelEl.textContent = "効果時間 ";
                timeWrap.appendChild(labelEl);

                //今のLvで使えるdurationだけ残す
                const validDurations = skill.duration.filter((d) => currentLv >= d.minLevel);

                //ラベルごとに最新だけ残す
                const latestByLabel = {};
                
                validDurations.forEach(d => {
                    const key = d.label || ""; //ラベルがないものは""でまとめる

                    if (!latestByLabel[key] || d.minLevel > latestByLabel[key].minLevel) {
                        latestByLabel[key] = d;
                    }
                });

                //表示用に配列にして表示

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

            } else if (durationSec != null) {
                durationEl.textContent = `効果時間 ${durationSec}s`;
                timeWrap.appendChild(durationEl);
            };

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
                const resourceTexts = skill.resourceChange.map((r) => {

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

                resourceEl.textContent = resourceTexts.join(" / ");
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
    if (Array.isArray(skill.notes) && skill.notes.length > 0) {
        const noteEl = document.createElement("div");
        noteEl.className = "skill-notes";

        skill.notes.forEach(note => {
            const line = document.createElement("div");
            line.textContent = `⚠️[${note}]`;
            noteEl.appendChild(line);
        })
        
        card.appendChild(noteEl);
    }

            skillList.appendChild(card);
    });
}
    

// ============================
// レベルスライダー関連
// ============================
lv.addEventListener("input", () => {
    if (currentJobKey) renderSchSkills(currentJobKey);
});

if (statusBar.hidden) {
    document.title = "JQG-ジョブクイックガイド";
} else {
    //タイトル変更処理
    const shortName = currentJobEl.textContent.split(" / ")[1] || "";
    if (shortName){
        renderSchSkills(shortName);
    }

    document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
}

// ============================
// ジョブボタン関連
// ============================
const jobButtons = document.querySelectorAll(".job");
const currentJobEl = document.getElementById("currentJob");

//console.log("clicked shortName=", shortName);

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
            renderSchSkills(shortName);
        }


        currentJobEl.textContent = `${fullName} / ${shortName}`;

        statusBar.hidden = false;

        document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
    });
});

// 初回描画
//renderSchSkills();

// ============================
// モード切替
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeToggle");

    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });
});