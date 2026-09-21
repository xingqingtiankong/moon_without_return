"use strict";
(function () {
    const lessons = {
        akari: {
            rules: ['放灯照亮所在行列，黑格会挡光。', '所有白格都要被照亮，两盏灯不能互相照到。', '黑格上的数字是它上下左右相邻灯的数量。'],
            steps: ['先看黑格数字需要几盏灯。', '点白格放灯，同行同列会亮起。', '若两灯直线相见就冲突，需要移开一盏。', '白格全亮、邻灯数量正确且无冲突，提交检查。']
        },
        shikaku: {
            rules: ['点击两个对角格，划出一个矩形。', '矩形恰好含一个数字，格子数量等于该数字。', '矩形不能重叠，覆盖全盘完成；点击区域可撤销。'],
            steps: ['数字6需要面积为6的矩形。', '它可以是2×3，或3×2。', '不能把另一个数字也圈进去。', '每格只属于一个区域，最终覆盖全部格子。']
        },
        pipe: {
            rules: ['入口与出口之间需要一条完整通路。', '点击管段，每次顺时针旋转90度。', '通水部分不能漏接；接好后打开阀门核验。'],
            steps: ['先认入口与出口。', '转动弯头，让接头朝向相邻管段。', '继续连接出口，未使用的岔路可以不接。', '打开阀门；只有完整、无泄漏的线路才通过。']
        },
        lights: {
            rules: ['点一格会同时切换自身及上下左右。', '亮灯代表故障，暗灯代表正常。', '把所有灯熄灭，重复点击会撤销该次翻转。'],
            steps: ['中心与四邻组成一次翻转范围。', '点击中心，五个位置一起变化。', '不要逐盏追着亮灯点，要考虑邻居。', '全部熄灭才算完成。']
        },
        merge: {
            rules: ['同值方块相撞合成两倍数值。', '方向键或箭头移动整张棋盘，每次有效移动新增方块。', '达到目标即可完成；没有空格且不能再合并会失败。'],
            steps: ['两个2可以合并。', '向左移动，2＋2变成4。', '有效移动后，空位会出现新的2或4。', '把大数字集中在一侧，保留移动空间。']
        },
        sudoku: {
            rules: ['每行与每列不能出现重复数字。', '每个粗线宫格也要包含完整数字。', '选可填格，再点数字；固定字段不能改，完成后核验。'],
            steps: ['示例为4×4，每行需要1、2、3、4。', '这一行已有1、2、3，空位只能是4。', '再核对这一列与2×2宫格。', '三项都满足，填入4；最后提交整盘。']
        },
        loop: {
            rules: ['沿相邻圆点连线；再点标叉，第三次清空。', '格子数字等于它四条边上已连接的线数。', '所有线组成一个闭环，不能分叉或分成多个圈。'],
            steps: ['这个2要求格子四周恰好两条线。', '先连相邻圆点，不是穿过数字连线。', '端点最终都应恰好连接两条线。', '四个角格各有两条边，整盘形成同一个闭环。']
        },
        bridges: {
            rules: ['岛上的数字是接入它的桥梁总数。', '只连水平或竖直相邻岛，最多两座桥，不能跨岛或交叉。', '点击连接处切换0、1、2座桥，所有岛都要连成整体。'],
            steps: ['左岛需要1座桥，中岛需要3座，右岛需要2座。', '左与中先连单桥。', '中与右连双桥：中岛共有1＋2＝3座。', '每岛数量正确且全体相连，才能完成。']
        },
        sokoban: {
            rules: ['方向键或屏幕箭头移动维修员。', '贴近无人机推行，只能推，不能拉。', '把全部设备推上充电座；卡住可撤回或重置本局。'],
            steps: ['人需要站在无人机背后。', '向右移动，会把无人机推一格。', '绕到另一侧才能改变推动方向。', '不要推入死角；每架都要抵达充电座。']
        },
        simon: {
            rules: ['先播放信号，观察闪灯的先后顺序。', '轮到你时按相同顺序点击颜色与编号。', '三轮逐渐加长；错误会重新播放当前轮。'],
            steps: ['先看，不要急着输入。', '示例依次闪：Ⅰ → Ⅲ → Ⅱ。', '轮到你时，按Ⅰ、Ⅲ、Ⅱ。', '下一轮增加长度，旧顺序仍需记住。']
        },
        sliding: {
            rules: ['只能把空位相邻的芯片滑进空位。', '按从左至右、从上至下排列编号。', '右下角留空；卡住可恢复本局布局。'],
            steps: ['右下的8旁边有一个空位。', '点击8，它滑入左边的空位。', '其余芯片不能跨越空格跳动。', '1到8按顺序排列，右下留空即完成。']
        },
        sort: {
            rules: ['先选一件工具，再选对应用途的托盘。', '过滤、紧固、密封是三种不同用途。', '全部归类完成；放错托盘会扣分。'],
            steps: ['滤芯的用途是过滤空气。', '先点击滤芯，再点击“过滤空气”。', '扳手归紧固，垫圈归密封。', '按名称与形状判断，不按摆放位置猜。']
        },
        order: {
            rules: ['按单据编号从小到大依次选入归档栏。', '点归档栏中的单据可取回重排。', '全部排列后提交，遗漏或乱序需要修改。'],
            steps: ['先看编号，不看纸张位置。', '017、012、014中最小的是012。', '接着选014，最后选017。', '确认无遗漏后提交归档。']
        },
        difference: {
            rules: ['左边是基准记录，右边是当前状态。', '点击右图发生变化的位置。', '只核验图上差异；圈重复位置不会重复得分。'],
            steps: ['先把同一个部位左右对照。', '示例：左边接水盘有水，右边没有。', '点击右图接水盘，差异会被圈出。', '再找剩余差异，不要把猜测当证据。']
        },
        flier: {
            rules: ['按空格或“抬升”给巡检机向上动力。', '不按会下落，穿过上下障碍之间的缺口。', '撞击消耗保护次数；通过目标数量即完成。'],
            steps: ['巡检机会自然下落。', '短按抬升，不要一直猛按。', '对准管道缺口，提前调整高度。', '越过整组障碍后计数，撞击会消耗保护。']
        },
        runner: {
            rules: ['按空格或“跳跃”越过地面障碍。', '空中不能连续起跳，需要先落地。', '抵达目标数量即可完成，碰撞会消耗保护。'],
            steps: ['观察地面障碍的距离。', '障碍接近时按一次跳跃。', '落地前再次按不会二连跳。', '保持间隔，越过障碍后计数。']
        },
        clips: {
            rules: ['按动作发生顺序选择六个录像片段。', '点击下方已选片段可以取回。', '全部排列后提交；失败会慢放正确顺序。'],
            steps: ['先观看原录像，记住动作发生的先后。', '独立示例：举手，然后转身，最后离开。', '把示例片段按“举手→转身→离开”排好。', '正式记录有六个不同动作，可以再次观看录像。']
        },
        bodymatch: {
            rules: ['先选择身体样本，再选择对应培养舱。', 'BIO后面的数字是身体编号。', '不要用共同的记忆模板名称代替编号。'],
            steps: ['样本 BIO-02 对应02号身体。', '选择样本，再选择02号舱。', 'BIO-09 应归09号，不归原武康。', '全部样本各归各位，才能恢复身体索引。']
        },
        anchors: {
            rules: ['三个锚点的稳定度都会缓慢下降。', '只点击亮起故障的锚点，正确处理会恢复稳定度。', '坚持180秒且任一锚点不归零；失败由冻结程序接管。'],
            steps: ['三个锚点分别维持读取、隔离和空间入口。', '儿童房门亮起警报，只处理这一项。', '处理正确，稳定度回升。', '继续观察其他警报，不需要不停乱点。']
        },
        piano: {
            rules: ['四条轨道对应设置中的四个琴键。', '音符到达横线时按键或点击琴键。', '每个音只判定一次；练习有预告，正式演奏无预告。'],
            steps: ['先看轨道对应的按键。', '等音符接近底部横线。', '到线时按对应键，过早或过晚会错过。', '跟随同一段旋律，保持节拍。']
        }
    };

    function kind(p) {
        return p.classic?.kind || 'piano';
    }

    function render(p) {
        const lesson = lessons[kind(p)] || lessons.piano, root = document.createElement('section');
        root.className = 'puzzle-tutorial';
        const heading = document.createElement('h3');
        heading.textContent = '规则与演示';
        const list = document.createElement('ol');
        lesson.rules.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            list.append(li);
        });
        root.append(heading, list);
        p.controls.append(root);
        const demo = document.createElement('div');
        demo.className = 'tutorial-demo';
        demo.hidden = !p.tutorialState.playing;
        const canvas = document.createElement('canvas');
        canvas.width = 560;
        canvas.height = 150;
        canvas.setAttribute('aria-label', '独立示例演示');
        const caption = document.createElement('p');
        caption.setAttribute('aria-live', 'polite');
        demo.append(canvas, caption);
        p.button('观看演示', () => {
            p.tutorialState = {playing: true, time: 0, step: 0};
            demo.hidden = false;
            draw(p);
        }, root);
        p.button('演示下一步', () => {
            demo.hidden = false;
            p.tutorialState.playing = false;
            p.tutorialState.step = ((p.tutorialState.step || 0) + 1) % 4;
            draw(p);
        }, root);
        root.append(demo);
        p.tutorialDemo = {root: demo, canvas, caption, lesson};
        draw(p);
    }

    function draw(p) {
        const demo = p.tutorialDemo;
        if (!demo) return;
        const c = demo.canvas.getContext('2d'), k = kind(p), step = p.tutorialState.step || 0;
        c.clearRect(0, 0, 560, 150);
        c.fillStyle = '#14252b';
        c.fillRect(0, 0, 560, 150);
        c.strokeStyle = '#c9af76';
        c.lineWidth = 5;
        c.fillStyle = '#e4d1a9';
        c.font = '22px sans-serif';
        c.textAlign = 'center';
        const tile = (x, y, text, active = false) => {
            c.fillStyle = active ? '#8b7044' : '#31494f';
            c.fillRect(x, y, 55, 45);
            c.fillStyle = '#f0dbad';
            c.fillText(text, x + 27, y + 30);
        }, line = (x1, y1, x2, y2) => {
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();
        };
        if (k === 'merge') {
            (step ? [4, 0, step > 1 ? 2 : 0, 0] : [2, 2, 0, 0]).forEach((n, i) => tile(150 + i * 60, 55, n || '', i === 0 && step > 0));
            c.fillText('←', 90, 85);
        } else if (k === 'bridges') {
            [1, 3, 2].forEach((n, i) => {
                c.beginPath();
                c.arc(160 + i * 120, 75, 24, 0, 7);
                c.stroke();
                c.fillText(n, 160 + i * 120, 83);
            });
            if (step > 0) line(184, 75, 256, 75);
            if (step > 1) {
                line(304, 70, 376, 70);
                line(304, 80, 376, 80);
            }
        } else if (k === 'loop') {
            [0, 1, 2, 3].forEach(i => c.fillText('2', 250 + i % 2 * 60, 62 + Math.floor(i / 2) * 60));
            [[220, 30, 340, 30], [340, 30, 340, 150], [340, 150, 220, 150], [220, 150, 220, 30]].slice(0, step + 1).forEach(v => line(...v));
        } else if (k === 'akari') {
            for (let i = 0; i < 5; i++) tile(120 + i * 60, 55, i === 1 ? '✦' : i === 3 ? '■' : '', step > 0 && i < 3);
        } else if (k === 'shikaku') {
            c.strokeRect(200, 20, 150, 105);
            if (step > 0) {
                line(250, 20, 250, 125);
                line(300, 20, 300, 125);
                line(200, 72, 350, 72);
            }
            c.fillText('6', 225, 54);
        } else if (k === 'sudoku') {
            [1, 2, 3, step > 1 ? 4 : '?'].forEach((n, i) => tile(150 + i * 60, 55, n, i === 3));
        } else if (k === 'sliding') {
            [1, 2, 3, 4, 5, 6, 7, step ? 8 : '', step ? '' : 8].forEach((n, i) => {
                c.fillStyle = '#38545a';
                c.fillRect(220 + i % 3 * 40, 12 + Math.floor(i / 3) * 43, 38, 40);
                c.fillStyle = '#dfc58f';
                c.fillText(n, 239 + i % 3 * 40, 40 + Math.floor(i / 3) * 43);
            });
        } else if (k === 'pipe') {
            line(120, 40, 280, 40);
            if (step > 0) line(280, 40, 280, 115); else line(280, 40, 330, 40);
            if (step > 1) line(280, 115, 440, 115);
            c.fillText('入口', 90, 47);
            c.fillText('出口', 475, 121);
        } else if (k === 'lights') {
            for (let i = 0; i < 9; i++) tile(200 + i % 3 * 50, 3 + Math.floor(i / 3) * 48, step ? '○' : '●', [1, 3, 4, 5, 7].includes(i) && !step);
        } else if (k === 'sokoban') {
            for (let i = 0; i < 6; i++) tile(90 + i * 60, 55, i === (step > 0 ? 2 : 1) ? '人' : i === (step > 0 ? 3 : 2) ? '机' : i === 4 ? '座' : '', i === 4);
        } else if (k === 'simon') {
            ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'].forEach((n, i) => tile(150 + i * 60, 55, n, i === [0, 2, 1, 0][step]));
        } else if (k === 'order' || k === 'clips') {
            c.font = '20px sans-serif';
            c.fillText(k === 'order' ? (step < 2 ? '017 → 012 → 014' : '012 → 014 → 017') : ['示例：转身 / 离开 / 举手', '先举手', '再转身 → 最后离开', '正式录像另有六个动作'][step], 280, 80);
        } else if (k === 'sort' || k === 'bodymatch') {
            c.fillText(k === 'sort' ? ['滤芯 → ？', '滤芯 → 过滤空气', '扳手 → 紧固螺栓', '密封圈 → 密封接头'][step] : step < 2 ? 'BIO-02 → 02号舱' : 'BIO-09 → 09号舱', 280, 80);
        } else if (k === 'difference') {
            c.fillText('昨晚：有水', 170, 75);
            c.fillText('现在：无水', 390, 75);
            if (step > 1) {
                c.beginPath();
                c.ellipse(390, 70, 80, 30, 0, 0, 7);
                c.stroke();
            }
        } else if (k === 'anchors') {
            ['餐桌', '儿童房', '入户门'].forEach((s, i) => tile(160 + i * 80, 55, s, i === 1 && step === 1));
        } else if (k === 'flier' || k === 'runner') {
            const phase = (p.tutorialState.time || step * 2) % 2;
            c.fillStyle = '#6a867e';
            c.fillRect(355 - phase * 90, k === 'runner' ? 105 : 0, 28, k === 'runner' ? 30 : 48);
            if (k === 'flier') c.fillRect(355 - phase * 90, 110, 28, 40);
            c.fillStyle = '#e3c785';
            c.fillRect(170, k === 'runner' ? 105 - Math.sin(phase / 2 * Math.PI) * 65 : 75 - Math.sin(phase * Math.PI) * 22, 27, 20);
        } else {
            line(100, 115, 450, 115);
            const bindings = MoonStorage.loadSettings().bindings.minigame;
            for (let i = 0; i < 4; i++) {
                c.fillText(MoonStorage.keyLabel(bindings['rhythmLane' + (i + 1)]), 155 + i * 75, 145);
                c.fillRect(140 + i * 75, i === step ? 90 : 25, 30, 12);
            }
        }
        demo.caption.textContent = '示例 ' + (step + 1) + ' / 4 · ' + demo.lesson.steps[step] + '（不计时、不计分）';
    }

    function tick(p, dt) {
        const s = p.tutorialState;
        if (!s?.playing) return;
        s.time += dt;
        s.step = Math.min(3, Math.floor(s.time / 2));
        draw(p);
        if (s.time >= 8) s.playing = false;
    }

    globalThis.MoonTutorials = Object.freeze({render, tick, lessons});
})();