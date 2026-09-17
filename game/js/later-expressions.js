"use strict";

(function () {
    const labels = {smile: '微笑', happy: '开心', confused: '疑惑', thinking: '思考', angry: '生气', afraid: '惊慌', crying: '哭泣'};
    const normalize = text => String(text || '').replace(/[\p{P}\p{Z}\s]/gu, '');
    const rules = new Map();
    function add(node, actor, emotion, lines) {
        for (const text of lines) rules.set([node, actor, normalize(text)].join('|'), emotion);
    }

    add('M00', 'azhi', 'thinking', ['我还没想明白，今天先别问我了', '对不起，我还需要一点时间，今天我们先冷静一下，别再问了']);
    add('M00', 'azhi', 'confused', ['什么事情？']);
    add('M00', 'azhi', 'angry', ['查到了就告诉我，别再替我挑哪些能看', '查到了就告诉我，别再自作主张地为我决定哪些能看了']);

    add('S04_ARRIVE', 'azhi', 'confused', ['你带回什么了？', '多久以前的？']);
    add('S04_ARRIVE', 'azhi', 'thinking', ['放桌上。']);
    add('S04_CHOICE', 'azhi', 'angry', ['别替我说完，我自己看']);
    add('S04_MAP', 'azhi', 'thinking', ['我来开']);
    add('S04_MAP', 'azhi', 'afraid', ['停一下']);


    add('S04_PAUSE', 'azhi', 'crying', ['他已经这么大了', '我还在每天问他作业写完没有']);
    add('S04_PHOTO', 'azhi', 'angry', ['这张照片，从我的相框里拿掉', '不是说那些事没发生过，只是别再拿它告诉我，现在该站在哪里']);
    add('S04_DOOR', 'azhi', 'thinking', ['先别让小星看到，我还没想好怎么跟他说']);
    add('S04_NAME', 'azhi', 'angry', ['还有，别再叫我老婆']);
    add('S04_NAME', 'azhi', 'afraid', ['别关，我要看完']);
    add('S04_ANCHORS', 'azhi', 'thinking', ['我看完了']);
    add('S04_ANCHORS', 'azhi', 'angry', ['你去回他吧，别冒充他爸爸', '你去和他说吧，别冒充他爸爸']);
    add('V_TELL_SUMMARY', 'azhi', 'thinking', ['你整理过了？原文件先留着，我现在听得下去多少，我会告诉你']);
    add('V_MODEL_ONLY', 'azhi', 'thinking', ['那就先说我们，这里的昨天，至少是我经过的']);
    add('V_CRISIS', 'azhi', 'afraid', ['别替我把这一晚抹掉，先告诉我你能做什么']);
    add('V_CRISIS_STAY', 'azhi', 'thinking', ['最后一页也读完了，现在可以停一下']);
    add('V_CRISIS_AUTONOMY', 'azhi', 'thinking', ['先给我一间空房，不要照片，不要默认称谓，我想在里面把文件看完']);
    add('V_AZHI_NIGHT1', 'azhi', 'thinking', ['日期核对完了，那个人的以后，不是我缺了一段记忆', '日期核对完了，原来她后来过的那些日子，我根本没经历过，我还以为是自己忘了', '明天我想试着改一下自己的身份']);

    add('V_AZHI_NIGHT2', 'azhi', 'confused', ['我删掉了妻子这一栏，系统重载时又填回来了']);
    add('V_AZHI_NIGHT2', 'azhi', 'thinking', ['保存了，它把那个称谓当成家庭程序的一部分', '小星又问什么时候出去，先说说该怎么告诉他']);
    add('K_AZHI', 'azhi', 'thinking', ['他问我，为什么房门现在要锁着。', '说外面的文件还没整理好。可不能永远这么说。', '我想告诉他，外面过去了很久。成年影像先不给他看。']);
    add('K_TELL', 'xing8', 'confused', ['那我要上三年级了吗？', '我房间里的东西还在吗？']);
    add('V_CHILD_EXPLAIN', 'xing8', 'happy', ['那他还喜欢我的飞船吗？']);
    add('V_CHILD_MERGE', 'xing8', 'confused', ['我明天去上班……我的作业本呢？']);
    add('V_CRISIS_LATE', 'azhi', 'angry', ['我说过他不能一下长大十六年，现在先把两个时间线分开']);

    add('V_AZHI_NIGHT3', 'azhi', 'thinking', ['只改称谓不够，下一具身体醒来，协议还会重新调用那张妻子的快照']);
    add('V_AZHI_NIGHT3', 'azhi', 'confused', ['你带回了很多表格，哪些事会改变这里？']);
    add('V_AZHI_FUTURE', 'azhi', 'thinking', ['请把可执行的选择说明白，别替我选一个好听的词']);
    add('V_AZHI_FUTURE', 'azhi', 'angry', ['我没有读到完整的后续，不要把这当作我的知情同意']);
    add('V_AZHI_STOP', 'azhi', 'thinking', ['三晚了，我核验过文件，试过改身份，也读过重新调用规则']);
    add('E_ANSWER_name', 'azhi', 'thinking', ['等启动以后再决定。']);
    add('E_CHILD', 'azhi', 'thinking', ['当前操作员……']);
    add('E_CHILD', 'azhi', 'confused', ['这个也不像名字。']);
    add('V_LAST_NIGHT', 'azhi', 'thinking', ['不要把今天叫作回家，你只是来把答应我的事做完']);
    add('V_LAST_NIGHT', 'xing8', 'happy', ['爸爸明天回来吗？']);

    function resolve(item, state) {
        if (state?.chapter === 1) return globalThis.MoonChapter1Expressions.resolve(item, state);
        if (!(state?.chapter >= 2 && state.chapter <= 7) || item?.type !== 'line' || !['azhi', 'xing8'].includes(item.actor)) return null;
        const emotion = rules.get([state.node, item.actor, normalize(item.text)].join('|')) || 'smile';
        return {src: `../img/characters/${item.actor}/expressions/${emotion}.png`, emotion, label: labels[emotion]};
    }
    globalThis.MoonDialogueExpressions = Object.freeze({resolve});
})();
