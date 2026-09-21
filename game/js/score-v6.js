"use strict";
(function () {
    const clamp = v => Math.max(0, Math.min(1, v));

    function evaluate(p, success, assisted = false) {
        const g = p.classic || {}, kind = g.kind || 'piano', errors = p.scoring.errors || 0, elapsed = p.time || 0,
            total = p.total || 1, tier = ['easy', 'normal', 'hard'].indexOf(p.difficulty);
        let quality = 0, reason = [], category = '推理与操作';
        const timeQuality = clamp(1 - Math.max(0, elapsed / total - .45) * .65);
        if (assisted || (!success && !p.info.game.startsWith('piano'))) return {
            success: false,
            assisted: true,
            grade: '已协助',
            score: 0,
            maxScore: 1000,
            accuracy: 0,
            errors,
            misses: p.misses?.size || 0,
            combo: p.scoring.maxCombo || 0,
            category,
            explanation: ['本次由协助完成，不计入评级。'],
            elapsed
        };
        if (p.info.game.startsWith('piano')) {
            const notes = p.sequence.length, perfect = p.scoring.perfect || 0, great = p.scoring.great || 0,
                good = p.scoring.good || 0;
            quality = clamp((perfect + great * .85 + good * .6) / notes - (p.stray || 0) / notes * .3);
            category = '节奏准确率';
            reason = ['Perfect ' + perfect + ' · Great ' + great + ' · Good ' + good + ' · Miss ' + p.misses.size, '准确度 ' + Math.round(quality * 100) + '%，额外按键 ' + p.stray + ' 次'];
        } else if (kind === 'spider') {
            const par = [50, 105, 165][tier], moves = g.moves || 0;
            quality = clamp(1 - Math.max(0, moves - par) / (par * 2.2) - errors * .012);
            category = '步数效率';
            reason = ['完成 ' + g.completed + ' 组 · ' + moves + ' 步（含发牌和撤销）', '参考步数 ' + par + '；不计算用时'];
        } else if (kind === 'memory') {
            const pairs = g.cells.length / 2, miss = g.mismatches || 0;
            quality = clamp(1 - miss / Math.max(1, g.maxMistakes) * .6) * .9 + timeQuality * .1;
            category = '记忆效率';
            reason = ['配对 ' + pairs + ' 组 · 翻牌 ' + g.flips + ' 次', '失配 ' + miss + ' / ' + g.maxMistakes + '；失配次数权重90%，用时10%'];
        } else if (['wordle', 'number-wordle'].includes(kind)) {
            quality = clamp(1 - Math.max(0, g.guesses.length - 2) / (g.max - 1) * .45 - errors * .02);
            category = '推断轮次';
            reason = ['第 ' + g.guesses.length + ' 轮完成 / 最多 ' + g.max + ' 轮', '以猜测轮次评分，不以打字速度评分'];
        } else if (['runner', 'flier', 'parkour', 'side-runner', 'jump'].includes(kind)) {
            const initial = kind === 'side-runner' ? [4, 3, 2][tier] : [3, 2, 1][tier],
                hits = Math.max(0, initial - g.lives);
            quality = clamp(1 - hits / Math.max(initial, 1) * .5);
            category = '通行与防护';
            reason = ['目标完成 · 剩余防护 ' + g.lives, '按碰撞或落点失误扣分，不奖励拖延或加速计时'];
        } else if (kind === 'match3') {
            const spare = g.turns / [30, 32, 35][tier];
            quality = clamp(.76 + spare * .24 - errors * .018);
            category = '消除效率';
            reason = ['清除 ' + g.cleared + ' / ' + g.target + ' · 剩余 ' + g.turns + ' 步', '剩余步数与无效交换决定评分，连续消除提高效率'];
        } else if (kind === 'merge') {
            const par = [25, 48, 80][tier];
            quality = clamp(1 - Math.max(0, g.moves - par) / (par * 2));
            category = '合并效率';
            reason = ['达到 ' + g.target + ' · ' + g.moves + ' 次有效移动', '无法移动不计步，新方块出现位置不参与扣分'];
        } else if (kind.includes('maze')) {
            const shortest = g.route.length - 1;
            quality = clamp(1 - Math.max(0, g.moves - shortest) / Math.max(20, shortest * 2) - errors * .06);
            category = '路线效率';
            reason = ['实际 ' + g.moves + ' 格 · 最短 ' + shortest + ' 格', '回头路与触墙失误计入评价，用时只限制关卡'];
        } else {
            let par = kind === 'nonogram' ? g.answer.filter(Boolean).length : kind === 'sudoku' ? g.givens.filter(v => !v).length : kind === 'logic-grid' ? g.n * 4 : kind === 'huarong' ? [22, 60, 125][tier] : g.solution?.length || g.cells?.length || 20;
            const moves = g.moves || par;
            const efficiency = ['logic-grid', 'nonogram', 'sudoku'].includes(kind) ? 1 : clamp(1 - Math.max(0, moves - par) / Math.max(20, par * 3));
            quality = .65 * clamp(1 - errors * .06) + .2 * efficiency + .15 * timeQuality;
            reason = ['规则通过 · 提交/操作失误 ' + errors + ' 次', '正确性65% · 操作效率20% · 用时15%；推理笔记不扣分'];
        }
        const ceiling = [899, 949, 1000][tier], score = Math.min(ceiling, Math.round(clamp(quality) * 1000)),
            grade = score >= 990 ? 'S+' : score >= 950 ? 'S' : score >= 900 ? 'A+' : score >= 800 ? 'A' : score >= 650 ? 'B' : 'C';
        return {
            success,
            assisted: false,
            score,
            maxScore: 1000,
            grade,
            accuracy: Math.round(clamp(quality) * 100),
            errors,
            misses: p.misses?.size || 0,
            combo: p.scoring.maxCombo || 0,
            elapsed,
            category,
            explanation: reason
        };
    }

    globalThis.MoonRating = {evaluate};
})();
