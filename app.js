console.log("app.js loaded v3");

// ============================
// DOM取得
// ============================
const lv =document.getElementById("lv");
const lvValue = document.getElementById("lvValue");
const statusBar = document.getElementById("statusBar");
const skillArea = document.getElementById("skillArea");
const skillList = document.getElementById("skillList");

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
}

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
}

// ============================
// ナイトスキルデータ
// ============================
    const PLD_SKILLS = [
    {
        name: "リプライザル",
        minLv: 98,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 10,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
    {
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
     ]

// ============================
// 戦士スキルデータ
// ============================
    const WAR_SKILLS = [
    {
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 10,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
    {
        name: "リプライザル",
        minLv: 98,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
     ];

// ============================
// 暗黒騎士スキルデータ
// ============================
    const DRK_SKILLS = [
    {
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 10,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
    {
        name: "リプライザル",
        minLv: 98,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
      ];

// ============================
// ガンブレスキルデータ
// ============================
    const GNB_SKILLS = [
    {
        name: "リプライザル",
        minLv: 22,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 10,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
    {
        name: "リプライザル",
        minLv: 98,
        group: "reprisal",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "範囲内の敵の与ダメージ10%減少",
        icon: "icons/RoleAction/TANK/Reprisal.png"
    },
       ];

// ============================
// 白魔道士スキルデータ
// ============================
    const WHM_SKILLS = [
    {
        name: "レイズ",
        minLv: 12,
        group: "raise",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/WHM/Raise.png"
    },
        ]; 

// ============================
// 学者スキルデータ
// ============================
    const SCH_SKILLS = [
    {
        name: "フィジク",
        minLv: 4,
        group: "physick",
        type: "player",
        mpCost: 400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["回復","魔法"],
        effect: [
            {minLevel: 4, value:"対象のHP回復 回復力:400"},
            {minLevel: 85, value:"対象のHP回復 回復力:450"}
        ],
        icon: "icons/SCH/Physick.png"
    },
    {
        name: "リザレク",
        minLv: 12,
        group: "resurrection",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/SCH/Resurrection.png"
    },
    {
        name: "光の囁き",
        minLv: 20,
        group: "whispering",
        type: "pet",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 21,
        tags: ["回復","ペット","アビリティ"],
        effect: "範囲内のPTMにHoT付与 回復力:80\n[セラフィム召喚中]光輝の囁きに変化する ※効果は同じ",
        icon: "icons/SCH/Whispering_Dawn.png"
    },
    {
        name: "鼓舞激励の策",
        minLv: 30,
        group: "adloquium",
        type: "player",
        mpCost: 900,
        recastType: "gcd",
        duration: 30,
        tags:["回復","バリア","魔法"],
        effect: [
            {minLevel: 30, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の125%\n賢者の[エウクラシア系]と競合"},
            {minLevel: 85, value:"対象のHP回復+バリア付与\n回復力:300 バリア:回復力の180%\n賢者の[エウクラシア系]と競合"}
        ],
        icon: "icons/SCH/Adloquium.png"
    },
    {
        name: "士気高揚の策",
        minLv: 35,
        group: "succor",
        type: "player",
        mpCost: 900,
        recastType: "gcd",
        duration: 30,
        tags:["回復","バリア","魔法"],
        effect: [
            {minLevel: 35, value:"範囲内のPTMのHP回復+バリア付与\n回復力:200 バリア:回復力の115%\n賢者の[エウクラシア系]と競合"},
            {minLevel: 85, value:"範囲内のPTMのHP回復+バリア付与\n回復力:200 バリア:回復力の160%\n賢者の[エウクラシア系]と競合"}
        ],
        icon: "icons/SCH/Succor.png"
    },
    {
        name: "フェイイルミネーション",
        minLv: 40,
        group: "illumination",
        type: "pet",
        mpCost: null,
        recast: 120,
        recastType: "ogcd",
        duration: 20,
        tags: ["軽減","ペット","アビリティ"],
        effect: "範囲内のPTMの[被魔法ダメージ]5%軽減/[回復魔法]の回復量10%UP\n[セラフィム召喚中]セラフィックイルミネーションに変化する ※効果は同じ",
        icon: "icons/SCH/Fey_Illumination.png"
    },
    {
        name: "エーテルフロー",
        minLv: 45,
        group: "aetherflow",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags: ["MP回復","アビリティ","フロー"],
        effect: "最大MPの20%回復\nエーテルフロー:3つ獲得",
        icon: "icons/SCH/Aetherflow.png"
    },
    {
        name: "生命活性法",
        minLv: 45,
        group: "lustrate",
        type: "player",
        mpCost: null,
        recast: 1,
        recastType: "ogcd",
        duration: null,
        tags: ["回復","アビリティ","フロー"],
        effect: "対象のHP回復 回復力:600\nエーテルフロー:1つ消費",
        icon: "icons/SCH/Lustrate.png"
    },
    {
        name: "野戦治療の陣",
        minLv: 50,
        group: "soil",
        type: "player",
        mpCost: null,
        recast: 30,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","設置型","アビリティ","フロー"],
        effect: [
            {minLevel: 50, value:"エリア内10%軽減\nエーテルフロー:1つ消費"},
            {minLevel: 78, value:"エリア内10%軽減+HoT付与\nエーテルフロー:1つ消費"}
        ],
        icon: "icons/SCH/Sacred_Soil.png"
    },
    {
        name: "不撓不屈の策",
        minLv: 52,
        group: "indomitability",
        type: "player",
        mpCost: null,
        recast: 30,
        recastType: "ogcd",
        duration: null,
        tags: ["回復","アビリティ","フロー"],
        effect: "範囲内のPTMのHP回復 回復力:400\nエーテルフロー:1つ消費",
        icon: "icons/SCH/Indomitability.png"
    },
    {
        name: "展開戦術",
        minLv: 56,
        group: "deployment",
        type: "player",
        mpCost: null,
        recast: [
            { minLevel:56, value: 120 },
            { minLevel:85, value: 90 }
        ],
        recastType: "ogcd",
        duration: null,
        tags:["ヒール補助","バリア","アビリティ"],
        effect: "対象の[鼓舞][士気]のバリアを周囲に拡散させる\n※効果時間は拡散された時間",
        icon: "icons/SCH/Deployment_Tactics.png"
    },
    {
        name: "応急戦術",
        minLv: 58,
        group: "emergency",
        type: "player",
        mpCost: null,
        recast: 15,
        recastType: "ogcd",
        duration: 15,
        tags:["ヒール補助","アビリティ"],
        effect: "[鼓舞][士気]のバリア分を回復効果に置き換える",
        icon: "icons/SCH/Emergency_Tactics.png"
    },
    {
        name: "転化",
        minLv: 60,
        group: "dissipation",
        type: "player",
        mpCost: null,
        recast: 180,
        recastType: "ogcd",
        duration: 30,
        tags:["バフ","フロー","ペット","アビリティ","ヒール補助"],
        effect: "召喚中の[フェアリー]を一時帰還//自身の[回復魔法効果]20%UP\n エーテルフロー:3つ獲得/[サモン・セラフィム中使用不可]/[効果終了時フェアリーの位置固定解除]",
        icon: "icons/SCH/Dissipation.png"
    },
    {
        name: "深謀遠慮の策",
        minLv: 62,
        group: "excogitation",
        type: "player",
        mpCost: null,
        recast: 45,
        recastType: "ogcd",
        duration: 45,
        tags: ["回復","アビリティ","フロー"],
        effect: "対象のHPが50%以下or効果時間終了で回復発動 回復力:800",
        icon: "icons/SCH/Excogitation.png"
    },
    {
        name: "連環計",
        minLv: 66,
        group: "chain",
        type: "player",
        mpCost: null,
        recast: 120,
        recastType: "ogcd",
        duration: 20,
        tags: ["シナジー","アビリティ"],
        effect: "対象のクリティカルヒットを受ける確率10%上昇",
        icon: "icons/SCH/Chain_Stratagem.png"
    },
    {
        name: "エーテルパクト",
        minLv: 70,
        group: "aetherpact",
        type: "pet",
        mpCost: null,
        recast: 3,
        recastType: "ogcd",
        duration: null,
        tags: ["回復","ペット","アビリティ"],
        effect: "対象を継続回復 回復力:300\nフェイエーテル10ずつ消費 [セラフィム召喚中使用不可]",
        icon: "icons/SCH/Aetherpact.png"
    },
    {
        name: "秘策",
        minLv: 74,
        group: "recitation",
        type: "player",
        mpCost: null,
        recast: [
            { minLevel:74, value: 90 },
            { minLevel:98, value: 60 }
        ],
        recastType: "ogcd",
        duration: 15,
        tags:["ヒール補助","バフ","アビリティ"],
        effect: "効果時間中1回の[鼓舞][士気][不屈][深謀]の消費MP・消費フロー0\n対象スキルを確定クリティカル",
        icon: "icons/SCH/Recitation.png"
    },
    {
        name: "フェイブレッシング",
        minLv: 76,
        group: "blessing",
        type: "pet",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags: ["回復","ペット","アビリティ"],
        effect: "範囲内のPTMのHP回復 回復力:320\n[セラフィム召喚中使用不可]",
        icon: "icons/SCH/Fey_Blessing.png"
    },
    {
        name: "サモン・セラフィム",
        minLv: 80,
        group: "seraph",
        type: "pet",
        mpCost: null,
        recast: 120,
        recastType: "ogcd",
        duration: 22,
        tags: ["ペット強化","ペット","アビリティ"],
        effect: "[フェアリー]を一時帰還させ、[セラフィム]を召喚する\n(一部のフェアリースキルをセラフィム用のスキルに置き換える)",
        icon: "icons/SCH/Summon_Seraph.png"
    },
    {
        name: "コンソレイション",
        minLv: 80,
        group: "consolation",
        type: "pet",
        mpCost: null,
        recast: 120,
        recastType: "ogcd",
        duration: 22,
        tags: ["回復","バリア","ペット","アビリティ"],
        effect: "範囲内のPTMTのHP回復+バリア付与 回復力:250 バリア:回復量の100%\n[最大チャージ2][サモン・セラフィム中のみ]",
        icon: "icons/SCH/Consolation.png"
    },
    {
        name: "生命回生法",
        minLv: 86,
        group: "protraction",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: 10,
        tags:["回復","ヒール補助","バフ","アビリティ"],
        effect: "対象の[HP回復効果]と[最大HP]10%上昇/対象のHP10%回復",
        icon: "icons/SCH/Protraction.png"
    },
    {
        name: "疾風怒濤の計",
        minLv: 90,
        group: "expedient",
        type: "player",
        mpCost: null,
        recast: 120,
        recastType: "ogcd",
        duration: [
            {label: "疾風の計", value: 10 },
            {label: "怒涛の計", value: 20 }
        ],
        tags:["軽減","スプリント","アビリティ"],
        effect: "範囲内のPTMに[疾風の計:10秒]スプリント+[怒涛の計:20秒]10%軽減",
        icon: "icons/SCH/Expedient.png"
    },
    {
        name: "意気軒高の策",
        minLv: 96,
        group: "succor",
        type: "player",
        mpCost: 900,
        recast: null,
        recastType: "gcd",
        duration: 30,
        tags:["回復","バリア","魔法"],
        effect: "範囲内のPTMのHP回復+バリア付与 回復力:200 バリア:回復力の180%",
        icon: "icons/SCH/Concitation.png"
    },
    {
        name: "セラフィズム",
        minLv: 100,
        group: "seraphism",
        type: "player",
        mpCost: null,
        recast: 180,
        recastType: "ogcd",
        duration: 20,
        tags:["回復","バリア"],
        effect: "[鼓舞][士気]を[マニフェステーション][アクセッション]に強化\n範囲内のPTMにHoT付与/[応急戦術]のリキャストを1秒に短縮",
        icon: "icons/SCH/Seraphism.png"
    },
    {
        name: "マニフェステーション",
        minLv: 100,
        group: "manifestation",
        type: "player",
        mpCost: 900,
        recast: null,
        recastType: "gcd",
        duration: 30,
        tags:["回復","バリア","魔法"],
        effect: "範囲内のPTMのHP回復+バリア付与 回復力:360 バリア:回復力の180%\n賢者の[エウクラシア系]と競合\n[セラフィズム効果中のみ][秘策]効果対象外",
        icon: "icons/SCH/Manifestation.png"
    },
    {
        name: "アクセッション",
        minLv: 100,
        group: "accession",
        type: "player",
        mpCost: 900,
        recast: null,
        recastType: "gcd",
        duration: 30,
        tags:["回復","バリア","魔法"],
        effect: "範囲内のPTMのHP回復+バリア付与 回復力:240 バリア:回復力の180%\n賢者の[エウクラシア系]と競合\n[セラフィズム効果中のみ][秘策]効果対象外",
        icon: "icons/SCH/Accession.png"
    },
    {
        name: "光の癒し",
        minLv: 1,
        group: "enbrace",
        type: "pet",
        mpCost: null,
        recast: 3,
        recastType: "ogcd",
        duration: null,
        tags:["回復","魔法","ペット","オートヒール"],
        effect: [
            {minLevel: 1, value:"対象のHPを回復する 回復力:150"},
            {minLevel: 78, value:"対象のHPを回復する 回復力:180"}
        ],
        icon: "icons/SCH/Pet_Actions/Embrace.png"
    } 
];

// ============================
// 占星術師スキルデータ
// ============================
    const AST_SKILLS = [
    {
        name: "アセンド",
        minLv: 12,
        group: "ascend",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/AST/Ascend.png"
    },   
    ];

// ============================
// 賢者スキルデータ
// ============================
    const SEG_SKILLS = [
     {
        name: "エゲイロー",
        minLv: 12,
        group: "egeiro",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/SEG/Egeiro.png"
    },   
    ]; 

// ============================
// モンクスキルデータ
// ============================
    const MNK_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// 侍スキルデータ
// ============================
    const SAM_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// 竜騎士スキルデータ
// ============================
    const DRG_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    }, 
    ]; 

// ============================
// リーパースキルデータ
// ============================
    const RPR_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },  
    ]; 

// ============================
// 忍者スキルデータ
// ============================
    const NIN_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },    
    ];

// ============================
// ヴァイパースキルデータ
// ============================
    const VPR_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/MELEE/Second_Wind.png"
    },      
    ]; 

// ============================
// 吟遊詩人スキルデータ
// ============================
    const BRD_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },     
    ]; 

// ============================
// 機工士スキルデータ
// ============================
    const MCH_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },            
    ]; 

// ============================
// 踊り子スキルデータ
// ============================
    const DNC_SKILLS = [
    {
        name: "内丹",
        minLv: 22,
        group: "second_wind",
        type: "player",
        mpCost: null,
        recast: 60,
        recastType: "ogcd",
        duration: null,
        tags:["回復","アビリティ","ロールアクション"],
        effect: [
            {minLevel: 22, value:"自分のHPを回復する 回復力:500"},
            {minLevel: 94, value:"自分のHPを回復する 回復力:800"}
        ],
        icon: "icons/RoleAction/RANGED/Second_Wind.png"
    },            
    ]; 

// ============================
// 黒魔道士スキルデータ
// ============================
    const BLM_SKILLS = [
    {
        name: "アドル",
        minLv: 8,
        group: "addole",
        type: "player",
        mpCost: null,
        recast: 90,
        recastType: "ogcd",
        duration: [
            {minLevel:8, value: 10},
            {minLevel:98, value: 15}
        ],
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "対象の与ダメージ減少\n[物理]5% [魔法]10%",
        icon: "icons/RoleAction/CASTER/Addle.png"
    },            
        {
        name: "アドル",
        minLv: 8,
        group: "addole",
        type: "player",
        mpCost: null,
        recast: 90,
        recastType: "ogcd",
        duration: [
            {minLevel:8, value: 10},
            {minLevel:98, value: 15}
        ],
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "対象の与ダメージ減少\n[物理]5% [魔法]10%",
        icon: "icons/RoleAction/CASTER/Addle.png"
    },            
    ]; 


// ============================
// 召喚士スキルデータ
// ============================
    const SMN_SKILLS = [
    {
        name: "リザレク",
        minLv: 12,
        group: "resurrection",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/SMN/Resurrection.png"
    },
    ]; 

// ============================
// 赤魔道士スキルデータ
// ============================
    const RDM_SKILLS = [
    {
        name: "ヴァルレイズ",
        minLv: 64,
        group: "verraise",
        type: "player",
        mpCost: 2400,
        recast: null,
        recastType: "gcd",
        duration: null,
        tags: ["蘇生","魔法"],
        effect: "対象を衰弱状態で蘇生",
        icon: "icons/RDM/Verraise.png"
    },    
    ]; 


// ============================
// ピクトマンサースキルデータ
// ============================
    const PCT_SKILLS = [
    {
        name: "アドル",
        minLv: 8,
        group: "addole",
        type: "player",
        mpCost: null,
        recast: 90,
        recastType: "ogcd",
        duration: 10,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "対象の与ダメージ減少\n[物理]5% [魔法]10%",
        icon: "icons/RoleAction/CASTER/Addle.png"
    },  
    {
        name: "アドル",
        minLv: 98,
        group: "addole",
        type: "player",
        mpCost: null,
        recast: 90,
        recastType: "ogcd",
        duration: 15,
        tags:["軽減","アビリティ","ロールアクション"],
        effect: "対象の与ダメージ減少\n[物理]5% [魔法]10%",
        icon: "icons/RoleAction/CASTER/Addle.png"
    },                               
    ]; 

// ============================
//辞書データ
 // ============================


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
    // console.log("render start, lv.value =", lv.value);
    skillList.innerHTML = "";

    const skills = JOB_SKILLS[jobKey];
    if (!skills) return;

    const selectedByGroup = {};

console.log("jobKey=", jobKey, "skills=", skills);

    if (!skills) {
        console.error("NO SKILLS for:", jobKey);
        return;
    }

    skills.forEach(skill => {
        console.log("sample", skills[0]);
        const currentLv = Number(lv.value);

        const needLv = Number(skill.minLv ?? skill.MinLevel ?? 0);
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

        Object.values(selectedByGroup).forEach((skill) => {

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

            const mpCost = pickByLevel(skill.mpCost, currentLv);
            const recastSec = pickByLevel(skill.recast, currentLv); 
            const durationSec = pickByLevel(skill.duration, currentLv);

            // MP
            if (mpCost != null) {
                mpEl.textContent = `MP ${mpCost}`;
                timeWrap.appendChild(mpEl);
            }

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
            }

            //効果時間
            if (Array.isArray(skill.duration)) {

                //ラベル追加
                const labelEl = document.createElement("span");
                labelEl.className = "time-item";
                labelEl.textContent = "効果時間 ";
                timeWrap.appendChild(labelEl);

                skill.duration.forEach(d => {
                    const dEl = document.createElement("span");
                    dEl.className = "time-item";
                    dEl.textContent = `${d.label} ${d.value}s`;
                    timeWrap.appendChild(dEl);
                });
            } else if (durationSec != null) {
                durationEl.textContent = `効果時間 ${durationSec}s`;
                timeWrap.appendChild(durationEl);
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
                tag.textContent = `${t}`;
                tagsEl.appendChild(tag);
            });

            titleWrap.appendChild(nameEl);
            titleWrap.appendChild(timeWrap);
            titleWrap.appendChild(tagsEl);

            top.appendChild(icon);
            top.appendChild(titleWrap);


            const body = document.createElement("div");
            body.className = "skill-body";
            
            //console.log(skill.effect);
            //console.log(typeof skill.effect);

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

            skillList.appendChild(card);
            
        });
    }

// ============================
// レベルスライダー関連
// ============================
lv.addEventListener("input", function() {
lvValue.textContent = lv.value;

if (statusBar.hidden) {
    document.title = "JQG-ジョブクイックガイド";
    return;
}

    //タイトル変更処理
    const shortName = currentJobEl.textContent.split(" / ")[1] || "";
    if (shortName){
        renderSchSkills(shortName);
    }

    document.title = `JQG ▶ ${shortName} Lv${lv.value}`;
});

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
            renderSchSkills(shortName);
        }


        //学者を選んでるとき
        // if (shortName === "SCH") {
        //    skillArea.hidden = false;
        //    renderSchSkills();
        //    console.log("lv.value =", lv.value);
        //} else {
        //    skillArea.hidden = true;
        //}

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

        if (document.body.classList.contains("dark")) {
            toggle.textContent = "☀️";
        } else {
            toggle.textContent = "🌙";
        }
    });
});