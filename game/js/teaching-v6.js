"use strict";
(function () {
    const original = MoonTutorials, rules = {
        akari: ['白格可以放灯，黑格不能放灯；黑格会阻断光线。', '一盏灯照亮自己，以及四个正方向上遇到黑格前的所有白格。斜方向不照亮。', '每个白格都要亮；两盏灯不能在没有黑格阻挡的同一行或同一列互相照到。', '黑格数字只统计上下左右紧邻的灯。例如4要求四邻都放灯，0要求四邻都不放灯。', '全部满足后点击“检查照明覆盖”。本例用3×3展示照亮、冲突、纠正和完成。'],
        sudoku: ['4×4示例使用1—4；正式困难局为9×9，使用1—9，时间500秒。', '每行、每列、每个粗线宫格，都必须恰好包含完整数字，不能重复。', '点已有数字会高亮所有同值数字。固定数字可查看，不能改；空格选中后用下方数字填写。', '用行、列、宫的交集排除，不只看一行。全部填完后核验记录。'],
        piano: ['轻松与普通使用4轨；困难使用8轨：A S D F J K L ;。', '音符中心到达横线时按对应键，也能点击屏幕琴键。', 'Perfect：±75毫秒；Great：±140毫秒；Good：剩余容错窗口内。漏音与空按为Miss。', '同一个音只判定一次。难度越高，音符间隔越短；困难的更高评级取决于准确率。']
    };

    function demo(canvas, kind, step) {
        const c = canvas.getContext('2d');
        c.fillStyle = '#10252e';
        c.fillRect(0, 0, 640, 285);
        if (kind === 'akari') {
            const bulbs = step === 0 ? [] : step === 1 ? [1] : step === 2 ? [0, 1] : step === 3 ? [1, 3] : step === 4 ? [1, 3, 5] : [1, 3, 5, 7],
                g = {
                    width: 3,
                    blocks: Array.from({length: 9}, (_, i) => i === 4),
                    bulbs: Array.from({length: 9}, (_, i) => bulbs.includes(i)),
                    clues: Array.from({length: 9}, (_, i) => i === 4 ? 4 : null)
                }, light = MoonExpanded.illumination(g);
            for (let i = 0; i < 9; i++) {
                const x = 220 + i % 3 * 64, y = 34 + Math.floor(i / 3) * 64;
                c.fillStyle = i === 4 ? '#15202a' : light.conflicts.has(i) ? '#87574b' : light.lit.has(i) ? '#b5b184' : '#40565b';
                c.fillRect(x, y, 60, 60);
                c.fillStyle = '#f7e2b4';
                c.font = '26px sans-serif';
                c.textAlign = 'center';
                c.fillText(i === 4 ? '4' : bulbs.includes(i) ? '✦' : '', x + 30, y + 39);
            }
            return;
        }
        if (kind === 'sudoku') {
            const values = [1, 2, 3, step >= 4 ? 4 : 0, 3, step === 5 ? 4 : 0, 1, 2, 2, 1, step === 5 ? 4 : 0, 3, step === 5 ? 4 : 0, 3, 2, 1];
            for (let i = 0; i < 16; i++) {
                const x = 204 + i % 4 * 53, y = 20 + Math.floor(i / 4) * 53;
                c.fillStyle = (step === 1 && i < 4) || (step === 2 && i % 4 === 3) || (step === 3 && i % 4 >= 2 && i < 8) ? '#697d64' : '#293e48';
                if (i === 3) c.fillStyle = '#ac955d';
                c.fillRect(x, y, 53, 53);
                c.strokeStyle = '#658084';
                c.lineWidth = 1;
                c.strokeRect(x, y, 53, 53);
                c.fillStyle = '#eee3c5';
                c.font = '23px monospace';
                c.textAlign = 'center';
                c.fillText(values[i] || '', x + 26, y + 35);
            }
            c.strokeStyle = '#c2b48d';
            c.lineWidth = 3;
            for (let k = 0; k <= 4; k += 2) {
                c.beginPath();
                c.moveTo(204 + k * 53, 20);
                c.lineTo(204 + k * 53, 232);
                c.moveTo(204, 20 + k * 53);
                c.lineTo(416, 20 + k * 53);
                c.stroke();
            }
            return;
        }
        for (let i = 0; i < 8; i++) {
            c.fillStyle = '#263f48';
            c.fillRect(76 + i * 61, 35, 57, 205);
            c.fillStyle = '#decc9f';
            c.font = '20px monospace';
            c.fillText(['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'][i], 94 + i * 61, 268);
        }
        c.strokeStyle = '#edc780';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(74, 215);
        c.lineTo(565, 215);
        c.stroke();
        const y = [50, 110, 170, 213, 215, 215][step];
        c.fillStyle = '#b8dace';
        c.fillRect(326, y - 7, 38, 14);
        if (step >= 4) {
            c.fillStyle = '#edd397';
            c.font = '25px sans-serif';
            c.fillText(step === 4 ? 'Perfect' : '跟随下一音', 430, 100);
        }
    }

    const captions = {
        akari: ['中间黑格写着4，四个紧邻白格最终都需要放灯。', '上方放一盏灯。顶行亮起，向下的光被中心黑格挡住。', '错误示范：再放左上角，两灯在顶行互相照到，冲突标红。', '撤掉左上角，改在中心左侧放灯。中心黑格挡住横向光。', '再放中心右侧。两灯中间有黑格，所以不冲突。', '最后在中心下侧放灯。四邻共4盏、所有白格亮、无冲突，完成。'],
        sudoku: ['黄色空格待填，示例的每行都需要1、2、3、4。', '高亮第一行：已有1、2、3，所以缺4。', '高亮第四列：已有2、3、1，这一列也缺4。', '查看右上2×2粗线宫：已有3、1、2，同样缺4。', '三项条件一致，在黄色空格填4。', '用同样方法补完剩余空格，再提交整盘核验。'],
        piano: ['先记住8条轨道与下方按键的对应。', '音符沿自己的轨道接近判定线。', '不要在离线很远时抢按。', '音符中心接近横线，准备按这一轨的J键。', '在±75毫秒内击中，显示Perfect。', '手离开按键，继续等待下一音；重复乱按会计入Miss。']
    };
    globalThis.MoonTutorials = {
        ...original, render(p) {
            const kind = p.classic?.kind || (p.info.game.startsWith('piano') ? 'piano' : '');
            if (!rules[kind]) {
                original.render(p);
                if (['wordle', 'number-wordle'].includes(kind) && p.introPhase === 'demo') {
                    const note = document.createElement('p');
                    note.textContent = '黄色只说明该位置不对且有剩余匹配数量。是否重复，需要看其他格；一个黄色不等于多个。';
                    p.controls.append(note);
                }
                return;
            }
            const root = document.createElement('section');
            root.className = 'workshop-guide';
            p.controls.append(root);
            root.innerHTML = '<ol class="workshop-phases"><li>① 讲解规则</li><li>② 分步演示</li><li>③ 正式游戏</li></ol>';
            if (p.introPhase === 'rules') {
                rules[kind].forEach((v, i) => {
                    const el = document.createElement('p');
                    el.className = 'rule-row';
                    el.textContent = (i + 1) + '. ' + v;
                    root.append(el);
                });
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 285;
            canvas.setAttribute('aria-label', '可核验的独立教学棋盘');
            root.append(canvas);
            const step = p.workshopStep || 0;
            demo(canvas, kind, step);
            const text = document.createElement('p');
            text.className = 'demo-caption';
            text.textContent = (step + 1) + ' / 6 · ' + captions[kind][step];
            root.append(text);
            const controls = document.createElement('div');
            controls.className = 'guide-toolbar';
            root.append(controls);
            for (const [label, next] of [['上一步', Math.max(0, step - 1)], ['下一步', Math.min(5, step + 1)], ['从头重播', 0]]) p.button(label, () => {
                p.workshopStep = next;
                p.workshopAuto = false;
                p.render();
            }, controls);
            p.button(p.workshopAuto ? '暂停演示' : '自动演示', () => {
                p.workshopAuto = !p.workshopAuto;
                p.workshopElapsed = 0;
                p.render();
            }, controls);
        }, tick(p, dt) {
            const kind = p.classic?.kind || 'piano';
            if (!rules[kind]) return original.tick(p, dt);
            if (p.workshopAuto) {
                p.workshopElapsed = (p.workshopElapsed || 0) + dt;
                if (p.workshopElapsed >= 3.5) {
                    p.workshopElapsed = 0;
                    p.workshopStep = Math.min(5, (p.workshopStep || 0) + 1);
                    if (p.workshopStep === 5) p.workshopAuto = false;
                    p.render();
                }
            }
        }
    };
})();
