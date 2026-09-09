"use strict";

(function createChapter1Data() {
    const portraits = {
        azhi: "../img/characters/azhi/azhi-portrait.png",
        xing8: "../img/characters/xing8/xing8-portrait.png"
    };
    const actors = {
        azhi: {name: "阿芷", role: "妻子", portrait: portraits.azhi, mapImage: "../img/characters/azhi/azhi-npc.png"},
        xing8: {
            name: "小星",
            role: "儿子 · 8岁",
            portrait: portraits.xing8,
            mapImage: "../img/characters/xing8/xing8-npc.png"
        },
        system: {name: "系统", role: "任务提示", portrait: ""},
        wukang: {name: "武康", role: "工程师", portrait: ""}
    };
    const interactions = {
        h01_block_f01: {
            node: "H01",
            map: "F01",
            x: 975,
            y: 650,
            radius: 92,
            label: "拾取沙发旁的积木",
            asset: "../img/props/family/h01-block-livingroom.png",
            size: 28,
            task: "h01_blocks"
        },
        h01_block_f04: {
            node: "H01",
            map: "F04",
            x: 1050,
            y: 690,
            radius: 105,
            label: "拾取卫生间的积木",
            asset: "../img/props/family/h01-block-bathroom.png",
            size: 28,
            task: "h01_blocks"
        },
        h01_block_f05: {
            node: "H01",
            map: "F05",
            x: 850,
            y: 780,
            radius: 105,
            label: "拾取阳台的积木",
            asset: "../img/props/family/h01-block-balcony.png",
            size: 28,
            task: "h01_blocks"
        },
        h01_lamp: {
            node: "H01",
            map: "F00",
            x: 650,
            y: 175,
            interactX: 650,
            interactY: 410,
            radius: 125,
            label: "检查楼道灯",
            marker: true,
            task: "h01_lamp"
        },
        h01_dinner: {
            node: "H01",
            map: "F01",
            x: 430,
            y: 560,
            radius: 115,
            label: "坐下吃饭",
            requires: ["h01_blocks", "h01_lamp"],
            task: "h01_dinner",
            hiddenUntilReady: true
        },
        h02_temp: {
            node: "H02_D3_REAL",
            map: "R04",
            x: 1200,
            y: 285,
            interactX: 1180,
            interactY: 420,
            radius: 125,
            label: "操作温控终端",
            terminal: true,
            task: "h02_temp"
        },
        h02_plant: {
            node: "H02_D3_HOME",
            map: "F05",
            x: 900,
            y: 520,
            interactX: 820,
            interactY: 550,
            radius: 125,
            label: "给植物浇水",
            task: "h02_plant"
        },
        h02_drone: {
            node: "H02_D5_REAL",
            map: "R02",
            x: 760,
            y: 540,
            radius: 105,
            label: "将无人机归位",
            asset: "../img/props/base/h02-drone.png",
            size: 55,
            task: "h02_drone"
        },
        h02_blocks: {
            node: "H02_D5_HOME",
            map: "F03",
            x: 1040,
            y: 560,
            interactX: 930,
            interactY: 610,
            radius: 135,
            label: "收拾地毯上的积木",
            task: "h02_blocks"
        },
        h02_comms: {
            node: "H02_D6_REAL",
            map: "R06",
            x: 810,
            y: 320,
            interactX: 810,
            interactY: 430,
            radius: 130,
            label: "运行通信自检",
            terminal: true,
            task: "h02_comms"
        },
        h02_seat: {
            node: "H02_D6_HOME",
            map: "F01",
            x: 430,
            y: 560,
            radius: 120,
            label: "在餐桌前坐下",
            choice: true,
            task: "h02_seat"
        }
    };
    const nodeMeta = {
        H01: {day: 1, title: "第一次回家", map: "F01", spawn: {x: 760, y: 825}},
        H02_D3_REAL: {day: 3, title: "温控复位", map: "R04", spawn: {x: 1100, y: 650}},
        H02_D3_HOME: {day: 3, title: "给植物浇水", map: "F05", spawn: {x: 620, y: 650}},
        H02_D5_REAL: {day: 5, title: "无人机归位", map: "R02", spawn: {x: 800, y: 620}},
        H02_D5_HOME: {day: 5, title: "收拾积木", map: "F03", spawn: {x: 800, y: 780}},
        H02_D6_REAL: {day: 6, title: "通信自检", map: "R06", spawn: {x: 780, y: 650}},
        H02_D6_HOME: {day: 6, title: "在餐桌前坐下", map: "F01", spawn: {x: 760, y: 825}},
        H02_COMPLETE: {day: 6, title: "轮班结束", map: "F01", spawn: {x: 760, y: 825}}
    };
    const dialogue = {
        h01_intro: [
            {actor: "azhi", text: "你回来啦。饭快好了，能先帮我找找小星散落的积木，再看看楼道的灯吗？"},
            {actor: "xing8", text: "我明明都收好了……应该就在家里。"}
        ],
        h01_block_1: [{actor: "xing8", text: "找到一块了！还有两块。"}],
        h01_block_2: [{actor: "xing8", text: "第二块也找到了，只差最后一块。"}],
        h01_block_3: [{actor: "xing8", text: "都找齐了！我等会儿把它们收好。"}],
        h01_lamp: [{actor: "wukang", text: "线路只是松了。重新接好以后，灯稳定了。"}],
        h01_ready: [{actor: "azhi", text: "都弄好了？那就过来吃饭吧。"}],
        h01_end: [{actor: "xing8", text: "爸爸，今天坐我旁边！"}, {actor: "azhi", text: "等你回来。"}],
        d3_intro: [{actor: "system", text: "Day 3。维修区温控回路等待复位。"}],
        d3_temp: [{actor: "system", text: "温控回路已复位，环境参数恢复正常。"}],
        d3_home: [{actor: "azhi", text: "阳台那盆植物今天还没浇水。能帮我一下吗？"}],
        d3_plant: [{actor: "azhi", text: "好了，谢谢。今晚它应该不会再蔫了。"}],
        d5_intro: [{actor: "system", text: "Day 5。中央通道有一架维修无人机偏离停放区。"}, {
            actor: "wukang",
            text: "阳台那盆土又干了，像昨晚没有浇过一样。"
        }],
        d5_drone: [{actor: "system", text: "无人机已归位。"}],
        d5_home: [{actor: "xing8", text: "爸爸，能帮我把地毯上的积木收一下吗？"}],
        d5_blocks: [{actor: "xing8", text: "收好了！明天我想把它拼成更大的飞船。"}],
        d6_intro: [{actor: "system", text: "Day 6。通信与旧缓存室需要进行例行自检。"}, {
            actor: "wukang",
            text: "昨天收好的模型又散开了。也许小星起得比我早。"
        }],
        d6_comms: [{actor: "system", text: "通信链路自检通过。"}],
        d6_home: [{actor: "azhi", text: "饭刚好，过来坐吧。"}],
        d6_end: [{actor: "azhi", text: "等你回来。"}, {actor: "azhi", text: "今天也累了吧？先吃饭。"}, {
            actor: "system",
            text: "H02试玩段落已完成，进度已自动保存。"
        }]
    };
    globalThis.MoonChapter1 = Object.freeze({
        actors: Object.freeze(actors),
        interactions: Object.freeze(interactions),
        nodeMeta: Object.freeze(nodeMeta),
        dialogue: Object.freeze(dialogue)
    });
})();