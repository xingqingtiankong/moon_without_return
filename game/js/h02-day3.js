"use strict";
(function () {
    const line = (actor, text) => ({type: 'line', actor, text});
    const exit = {
        id: 'family_depart',
        map: 'F00',
        x: 840,
        y: 680,
        radius: 85,
        kind: 'depart',
        label: '结束休息，返回基地'
    };
    const pod = {
        id: 'rest_pod',
        map: 'R03',
        x: 795,
        y: 410,
        interactX: 860,
        interactY: 480,
        radius: 85,
        kind: 'rest',
        label: '进入休眠舱休息'
    };
    const tasks = [{id: 'h02_temp', requires: {node: 'H02_D3_REAL'}}, {
        id: 'h02_plant',
        requires: {node: 'H02_D3_HOME', tasks: ['h02_temp']}
    }];
    const active = s => s.node === 'H01_COMPLETE' || s.node.startsWith('H02_D3_');

    function objectives(s) {
        if (['H01_COMPLETE', 'H02_D3_DEPART_HOME'].includes(s.node)) return [{...exit}];
        if (s.node === 'H02_D3_REAL') return [{
            ...MoonPlacements.h02_d3_temp,
            kind: 'temperature',
            label: '前往维修区，复位温控回路'
        }];
        if (['H02_D3_RETURN', 'H02_D3_NEXT_REST'].includes(s.node)) return [{...pod}];
        if (s.node === 'H02_D3_HOME') return [{...MoonPlacements.h02_d3_plant, kind: 'plant', label: '给盆栽浇水'}];
        if (s.node === 'H02_D3_WATERED') return [{
            ...MoonPlacements.h01_dinner,
            kind: 'evening',
            label: '回餐桌陪阿芷坐一会儿'
        }];
        return [];
    }

    function destination(node) {
        if (['H02_D3_WAKE', 'H02_D3_NEXT_REST'].includes(node)) return {map: 'R03', x: 860, y: 480};
        if (['H02_D3_HOME', 'H02_D3_COMPLETE'].includes(node)) return {
            map: 'F01',
            x: MoonPlacements.h01_player_spawn.x,
            y: MoonPlacements.h01_player_spawn.y
        };
        return null;
    }

    class Day3 {
        constructor(story) {
            this.story = story;
        }

        automatic() {
            const s = this.story.state;
            if (this.story.busy) return false;
            if (s.node === 'H01_COMPLETE' && !s.flags.h02_depart_notice) return this.story.run({
                id: 'h02_depart_notice',
                queue: [line('system', '腕端轻轻震动：休息时段即将结束，下一轮值班需要提前准备。'), line('wukang', '我得回去了。下轮要检查温控，不能耽误。'), line('azhi', '知道了。去吧，路上慢点。下次回来再陪小星把积木搭好。'), line('wukang', '嗯。先从门口出去，结束这次休息。')],
                effects: {flags: {h02_depart_notice: true}, checkpointId: 'h01-ready-to-leave'}
            });
            if (s.node === 'H02_D3_WAKE') return this.story.run({
                id: 'h02_d3_wake_briefing',
                queue: [line('system', '第三天。休眠结束，生命体征稳定。'), line('wukang', '（刚才还在吃饭。又是这股消毒水味。）'), line('system', '今日任务：维修区温控回路出现偏差，请前往终端复位。'), line('wukang', '先离开休眠区，穿过中央通道，到维修区检查。'), line('system', '任务位置已标记。作业完成后，返回休眠舱休息。')],
                effects: {node: 'H02_D3_REAL', checkpointId: 'h02-d3-real'}
            });
            if (s.node === 'H02_D3_HOME' && !s.flags.h02_d3_home_intro) return this.story.run({
                id: 'h02_d3_home_intro',
                queue: [line('azhi', '回来啦？今天怎么比上回晚了一点。'), line('wukang', '温控坏了，耽误了一会儿。'), line('azhi', '那先洗手。阳台的滴灌管也帮我接一下，花土都裂了。'), line('wukang', '大叶子的那盆？'), line('azhi', '嗯。接好了开一点水，别浇太多。')],
                effects: {flags: {h02_d3_home_intro: true}, checkpointId: 'h02-d3-home'}
            });
            return false;
        }

        depart() {
            const s = this.story.state;
            if (s.node === 'H01_COMPLETE') return this.story.run({
                id: 'h02_d3_start',
                requires: {node: 'H01_COMPLETE'},
                queue: [line('wukang', '该回去值班了。'), line('system', '休息时段结束，准备唤醒。')],
                effects: {node: 'H02_D3_WAKE', day: 3, checkpointId: 'h02-d3-wake'}
            });
            if (s.node === 'H02_D3_DEPART_HOME') return this.story.run({
                id: 'h02_d3_next_evening',
                requires: {node: s.node},
                queue: [line('wukang', '明天还要例行检查，今天就先到这里。'), line('system', '休息结束。'), line('system', '第四天 · 例行值守结束。'), line('wukang', '今天没有新增维修。把记录交上去了，回舱里休息吧。')],
                effects: {node: 'H02_D3_NEXT_REST', day: 4, checkpointId: 'h02-d3-next-rest'}
            });
            return false;
        }

        resetTemperature(result = null) {
            return this.story.run({
                id: 'h02_d3_temp',
                requires: {node: 'H02_D3_REAL'},
                queue: [line('system', '过热告警解除。'), line('wukang', '（总算不跳了。）'), {
                    type: 'wait',
                    seconds: .7
                }, line('system', '复核完成。本次维修记录已提交。'), line('wukang', '收工。回去睡会儿。')],
                effects: {
                    minigameResults: result ? {H02_TEMP: result} : {},
                    completedTasks: ['h02_temp'],
                    node: 'H02_D3_RETURN',
                    checkpointId: 'h02-d3-return'
                }
            });
        }

        rest() {
            const s = this.story.state;
            if (s.node === 'H02_D3_RETURN') return this.story.run({
                id: 'h02_d3_rest',
                requires: {node: s.node, tasks: ['h02_temp']},
                queue: [line('system', '值班记录已确认，可以开始休息。'), line('wukang', '今天的事做完了。希望这次能多待一会儿。'), line('system', '休眠程序启动。')],
                effects: {node: 'H02_D3_HOME', checkpointId: 'h02-d3-home-entry'}
            });
            if (s.node === 'H02_D3_NEXT_REST') return this.story.run({
                id: 'h02_d3_next_home',
                requires: {node: s.node},
                queue: [line('system', '休眠程序启动。'), line('wukang', '又到晚上了。阿芷应该还在等我。')],
                effects: {
                    node: 'H02_D3_COMPLETE',
                    flags: {h02_d3_complete: true, h02_d3_soil_dry: true},
                    checkpointId: 'h02-d3-complete'
                }
            });
            return false;
        }

        water(result = null) {
            return this.story.run({
                id: 'h02_d3_plant',
                requires: {node: 'H02_D3_HOME', tasks: ['h02_temp'], flags: {h02_d3_home_intro: true}},
                queue: [line('wukang', '（水流下去了。土里的裂纹慢慢合上了。）'), line('wukang', '（接水盘都湿了。够了，别把根泡坏。）')],
                effects: {
                    minigameResults: result ? {H02_WATER: result} : {},
                    completedTasks: ['h02_plant'],
                    node: 'H02_D3_WATERED',
                    checkpointId: 'h02-d3-watered'
                }
            });
        }

        evening() {
            return this.story.run({
                id: 'h02_d3_evening',
                requires: {node: 'H02_D3_WATERED'},
                queue: [line('azhi', '浇好了？来，喝口水。'), line('wukang', '今天盯了一天屏幕，眼睛都花了。'), line('azhi', '那就别看了。喝水，坐会儿。'), line('wukang', '（她往旁边挪了一点，给我让出半张椅子。）'), line('system', '腕端提示：下一轮值守即将开始，请结束休息。'), line('wukang', '又到时间了。我得回去准备明天的例行检查。'), line('azhi', '去吧。下次回来，记得先歇一会儿。')],
                effects: {node: 'H02_D3_DEPART_HOME', checkpointId: 'h02-d3-evening'}
            });
        }

        inspect() {
            return this.story.run({
                id: 'h02_d3_dry_observation',
                requires: {node: 'H02_D3_COMPLETE', flags: {h02_d3_soil_dry: true}},
                queue: [line('wukang', '土又干了。')]
            });
        }

        get objects() {
            const s = this.story.state, result = objectives(s);
            if (s.node === 'H02_D3_COMPLETE' && !s.oneShotEvents.includes('h02_d3_dry_observation')) result.push({
                ...MoonPlacements.h02_d3_plant,
                kind: 'plant-inspect',
                label: '看看盆栽',
                optional: true
            });
            return result;
        }
    }

    globalThis.MoonDay3 = Object.freeze({Controller: Day3, tasks, active, objectives, destination, exit, pod});
})();