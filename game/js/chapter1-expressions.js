"use strict";

(function createChapter1Expressions() {
    const labels = {smile: "微笑", happy: "开心", confused: "疑惑", thinking: "思考", angry: "生气", afraid: "惊慌"};
    const rules = new Map();
    const normalize = text => String(text || "").replace(/[\p{P}\p{Z}\s]/gu, "");



    function add(node, actor, emotion, lines) {
        for (const text of lines) rules.set([node, actor, normalize(text)].join("|"), emotion);
    }




    add("H01", "xing8", "confused", ["我明明都收好了……应该就在家里。"]);
    add("H01", "xing8", "happy", [

        "都找到了！谢谢爸爸。", "找到一块了！还有两块。", "第二块也找到了，只差最后一块。",
        "都找齐了！我等会儿把它们收好。", "爸爸，今天坐我旁边！"
    ]);
    add("H01", "azhi", "smile", ["辛苦了。坐这边，菜还热着。", "慢点，又没人跟你抢。"]);
    add("H02_D3_WATERED", "azhi", "smile", [
        "花浇好了？快来坐下喝杯温水吧", "那就别看了，在家里你可以放松下来，别再想工作的事情"
    ]);
    add("H02_D4_ASK", "azhi", "confused", ["没有啊，怎么了？", "你昨天浇过？", "哦……是吗？"]);
    add("H02_D5_HOME", "xing8", "happy", ["爸爸，帮我收一下地毯上的积木吧！先别踩到那块蓝色的"]);
    add("H02_D5_BLOCKS", "xing8", "happy", [
        "好了！爸爸，千万别给我拆了，明天还要装飞船的尾巴", "拉钩！",
        "对！明天我还想加两个翅膀", "说好了，你要记得", "收好了！明天我想把它拼成更大的飞船。"
    ]);


    add("H02_D6_MODEL_ASK", "xing8", "angry", ["我没拆！", "没有！我一直等你装尾巴"]);
    add("H02_D6_MODEL_ASK", "xing8", "confused", ["昨天还是你硬卡进去的，蓝色那块还有点松"]);


    add("H02_D6_MODEL_ASK", "xing8", "confused", [
        "可是我完全没动啊，今天醒来就是这样的"
    ]);
    add("H02_D6_MODEL_ASK", "xing8", "thinking", [
        "我不记得了……"
    ]);
    add("H02_D6_MODEL_ASK", "xing8", "confused", [
        "爸爸，我不知道飞船为什么成这样了……"
    ]);
    add("H02_D6_REPEAT", "azhi", "confused", ["等你回来，怎么了？"]);

    add("H02_D4_ASK", "azhi", "confused", ["奇怪，你昨天给花浇过水吗？我以为你忘记了……"]);
    add("H02_D6_REPEAT", "azhi", "confused", ["没有啊，怎么了？", "？我确实没有碰过积木啊", "奇怪了"]);
    add("H02_D5_HOME", "xing8", "happy", ["爸爸，帮我收一下地毯上的积木吧！"]);
    add("H02_D5_BLOCKS", "xing8", "happy", ["好了！谢谢爸爸！明天咱们继续装飞船的尾巴！", "好！"]);
    add("H03_HOME", "xing8", "happy", ["爸爸！我画了你回来的样子，画就放在房间里"]);
    add("H03_HOME", "azhi", "smile", ["他画了很久，说一定要让你亲眼看看"]);
    add("H03_DRAW", "xing8", "happy", [
        "这里是飞船，你从这里下来，我和妈妈就在门口", "真的吗？那太好了，爸爸马上回来了！",
        "这么快已经过去七天了吗？那太好了，爸爸马上回来了！"
    ]);
    add("H05_TRAIN", "xing8", "happy", ["爸爸，你弹一下刚才那个旋律！", "爸爸弹得真好！我以后也要学钢琴！"]);
    add("H05_HOME", "xing8", "happy", ["爸爸，今天也弹一段吧！就昨天那个曲子"]);
    add("H05_HOME", "azhi", "smile", ["他期待一天了，你快试试吧"]);
    add("H05_PIANO", "xing8", "happy", ["就是这个！再来一次！", "就是这个！爸爸弹得真好！"]);

    add("H05_PIANO", "xing8", "smile", ["爸爸，你弹的真难听~~~"]);
    add("H05_PIANO", "xing8", "confused", ["好像和以前不一样了"]);
    add("H05_PIANO", "azhi", "smile", ["先让爸爸歇歇", "你爸太久没练了，慢慢来", "太久没练了，慢慢来"]);
    add("H06_NORMAL", "azhi", "confused", ["你怎么了？", "你脸色不太好欸，在那边的工作出问题了吗？"]);
    add("H06_CHOICE", "azhi", "confused", ["什么记录？拿来我看看", "什么资料啊？拿给我看看"]);
    add("H06_DENY", "azhi", "confused", ["你看错了吧？？？", "……你说的东西在哪儿？", "打开，让我看看"]);
    add("H06_DENY", "azhi", "afraid", [
        "昨天你还在这儿吃饭，上周小星打翻水壶，也是咱俩一起拾掇的",
        "结婚那天呢？下那么大雨，你连伞都没带，最后是我把外套顶在头上，拉着你跑"
    ]);
    add("V_AZHI_DIRECT", "azhi", "angry", [
        "先别叫我的名字", "我记得放在这里的东西，你不能拿一行字替我解释所有事"
    ]);
    add("H06_INDEX", "azhi", "confused", ["昨天的晚饭在这里", "来源……本地"]);
    add("H06_INDEX", "azhi", "afraid", ["全是本地……", "可我记得啊？", "先别说！"]);

    function resolve(item, state) {


        if (state?.chapter !== 1 || item?.type !== "line" || !["azhi", "xing8"].includes(item.actor)) return null;



        const emotion = rules.get([state.node, item.actor, normalize(item.text)].join("|")) || "smile";
        return {src: `../img/characters/${item.actor}/expressions/${emotion}.png`, emotion, label: labels[emotion]};
    }

    globalThis.MoonChapter1Expressions = Object.freeze({resolve});
})();
