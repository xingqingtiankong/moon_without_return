"use strict";
(function () {
    const p = MoonPlacements;
    const blocks = ['h01_block_f01', 'h01_block_f04', 'h01_block_f05'];
    const assets = {h01_block_f01: 'livingroom', h01_block_f04: 'bathroom', h01_block_f05: 'balcony'};
    const line = (actor, text) => ({type: 'line', actor, text});
    const done = (s, id) => s.completedTasks.includes(id);
    const ready = s => done(s, 'h01_blocks') && done(s, 'h01_lamp');
    const count = s => blocks.filter(id => done(s, id)).length;

    function objectives(s) {
        if (s.node !== 'H01' || !s.flags.h01_started) return [];
        const result = blocks.filter(id => !done(s, id) && !done(s, 'h01_blocks')).map(id => ({
            ...p[id],
            label: `拾取${{F01: '客厅', F04: '卫生间', F05: '阳台'}[p[id].map]}的积木`,
            asset: `../img/props/family/h01-block-${assets[id]}.png`,
            kind: 'block'
        }));
        if (!done(s, 'h01_lamp')) result.push({...p.h01_lamp_f00, label: '修复入户楼道灯', kind: 'lamp'});
        if (ready(s)) result.push({...p.h01_dinner, label: '坐下吃饭', kind: 'dinner'});
        return result;
    }

    const tasks = [{id: 'h01_blocks', requires: {node: 'H01', flags: {h01_started: true}}}, {
        id: 'h01_lamp',
        requires: {node: 'H01', flags: {h01_started: true}}
    }, {id: 'h01_dinner', requires: {node: 'H01', tasks: ['h01_blocks', 'h01_lamp']}}];

    class H01 {
        constructor(story) {
            this.story = story;
            this.pendingObject = null;
        }

        start() {
            return this.story.run({
                id: 'h01_intro',
                requires: {node: 'H01'},
                queue: [line('system', '第一天夜。厨房里响着碗筷声。'), line('wukang', '（饭还热着。终于回来了。）'), line('azhi', '站门口发什么呆？回来就进来，饭快好了。'), line('wukang', '刚才还听见机器响呢。'), line('azhi', '小星把积木弄丢了，正着急呢。你帮他找找，我这儿走不开。'), line('wukang', '他又把积木带得到处都是？'), line('azhi', '客厅、卫生间和阳台都看看。还有入户楼道的灯，他说刚才经过时不太稳，你顺便检查一下。'), line('wukang', '行，我去看看。'), line('azhi', '不着急，我们等你。')],
                effects: {flags: {h01_started: true}, checkpointId: 'h01-explore'}
            });
        }

        get objects() {
            return objectives(this.story.state).filter(o => !this.story.busy || o.id !== this.pendingObject);
        }

        interact(id, result = null) {
            const s = this.story.state;
            if (this.story.busy || s.node !== 'H01' || !s.flags.h01_started) return false;
            let event;
            if (blocks.includes(id) && !done(s, id) && !done(s, 'h01_blocks')) {
                const n = count(s) + 1, completedTasks = [id];
                if (n === 3) completedTasks.push('h01_blocks');
                const text = n === 3 ? (done(s, 'h01_lamp') ? '三块都找齐了，楼道灯也修好了。回去吃饭吧。' : '三块都找齐了。再去看看楼道的灯。') : `找到第${n === 1 ? '一' : '二'}块了，还差${3 - n}块。`;
                event = {id, queue: [line('wukang', text)], effects: {completedTasks, checkpointId: `h01-block-${n}`}};
            } else if (id === 'h01_lamp_f00' && !done(s, 'h01_lamp')) {
                event = {
                    id,
                    queue: [line('wukang', '（线接好了。试一下……亮了。）'), line('wukang', done(s, 'h01_blocks') ? '积木也找齐了，回去吃饭吧。' : '灯修好了，再把剩下的积木找齐。')],
                    effects: {completedTasks: ['h01_lamp'], checkpointId: 'h01-lamp'}
                };
            } else if (id === 'h01_dinner') {
                if (!ready(s)) return this.story.run({
                    id: 'h01_dinner_reminder',
                    once: false,
                    queue: [line('wukang', done(s, 'h01_blocks') ? '先把楼道的灯修好，再来吃饭。' : done(s, 'h01_lamp') ? '还没找齐积木，找齐再来吃饭。' : '先找齐积木，再把楼道的灯修好。')]
                });
                event = {
                    id,
                    queue: [line('azhi', '都弄好了？饭也好了，过来吃吧。'), line('wukang', '三块积木都找到了。灯的接线也处理好了。'), line('azhi', '辛苦了。坐这边，菜还热着。'), line('wukang', '还是家里的饭好吃。'), line('azhi', '慢点，又没人跟你抢。'), line('wukang', '要是哪天我回来晚了，你们就先吃，别一直等。'), line('azhi', '饭会给你留着。'), line('azhi', '等你回来。')],
                    effects: {
                        completedTasks: ['h01_dinner'],
                        flags: {h01_complete: true},
                        node: 'H01_COMPLETE',
                        checkpointId: 'h01-complete'
                    }
                };
            }
            if (!event) return false;
            if (result) event.effects.minigameResults = {[id === 'h01_lamp_f00' ? 'H01_LAMP' : id]: result};
            this.pendingObject = id;
            return this.story.run(event);
        }

        talk(actor) {
            const s = this.story.state;
            if (s.node !== 'H01' || !s.flags.h01_started) return false;
            const text = actor === 'azhi' ? (ready(s) ? '两件事都弄好了，来吃饭吧。' : done(s, 'h01_lamp') ? '灯修好了？辛苦了。小星还等着他的积木呢。' : done(s, 'h01_blocks') ? '积木都找齐了？再帮忙看看楼道的灯，饭马上就好。' : '饭马上就好，积木和楼道灯就拜托你了。') : (done(s, 'h01_blocks') ? '都找到了！谢谢爸爸。' : `还差${3 - count(s)}块。爸爸，帮我找找吧。`);
            return this.story.run({id: `h01_talk_${actor}`, once: false, queue: [line(actor, text)]});
        }
    }

    globalThis.MoonH01 = Object.freeze({Controller: H01, tasks, objectives, blocks, count, ready});
})();