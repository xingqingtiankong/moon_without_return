"use strict";
(function () {
    const original = MoonTutorials;
    const actionTips = {
        mines: ['观察数字与未翻开的相邻格。', '点左上角，安全区域自动展开。', '数字1表示邻近八格共有一颗雷。', '把已确定的危险格标旗；旗帜不会自动翻开其他格。', '不确定的格子不要凭颜色猜，先用相邻数字交叉验证。', '正式目标是翻开全部安全格，不要求把每颗雷插旗。'],
        wordle: ['独立示例的答案是 WATER。', '先试 OTHER，观察每个字母的反馈。', '绿色✓同时要求字母和位置一致。', '黄色↔只表示存在，需要换一个位置。', '同一个字母不能凭一次黄色无限重复使用。', '输入 WATER，五格绿色才完成。'],
        'number-wordle': ['独立示例的答案是1123，允许重复数字。', '先输入1111。', '前两位是✓，后两位是×：答案只有两个1。', '输入1213，观察位置变化后的反馈。', '×针对剩余数量，不一定代表这个数字完全不存在。', '输入1123，四个位置都正确。'],
        memory: ['演示卡只有四张，正式局会更多。', '翻开左上与右上：图案不同。', '两张短暂显示后盖回，位置保持不变。', '记住左上的月亮，再翻开左下的月亮。', '已经配对的卡移出，失配时不要忘记另一张的位置。', '最后两张配对，全部收走。'],
        link: ['演示先处理中央相邻的两张相同卡。', '点第一张，边框标记当前选择。', '点相同卡，零次转弯即可连通。', '腾出的空位可以让外侧那一对直连。', '最多两次转弯；相同图案但被挡住仍不能消除。', '余下两对清空。每对图案只有两张；消除后空位保留，其余牌不移动。'],
        match3: ['观察上排：两个菱形之间差一个菱形。', '选中第二格，再选其下方的菱形。', '交换相邻两格，形成横向三个相同图案。', '这三个被清除，上方落下并补入新符号。', '不能形成三连的交换会退回，不消耗正式步数。', '达到清除目标即完成，不要求清空整个棋盘。'],
        huarong: ['演示只保留主舱与出口，正式棋盘还有其他舱柜。', '点击主舱，选中边框亮起。', '按向下，将主舱平移一格。', '主舱到达底部中央出口。', '柜体不能旋转，也不能挤进不足的空位。', '正式局先轮换小箱和空位，为长柜与主舱腾出通路。'],
        spider: ['同花K到A组成一整组，演示将牌组分在两列。', '选择右列的7，它下面的6到A一并选中。', '把这组移到左列的8下面。', '完整K到A被自动收走，组数增加。', '有空列时不能发牌；先利用空列整理，再补齐它。', '正式局按任务要求收集指定组数，允许撤销上一步。'],
        solitaire: ['演示左列是黑6，右列是红5，另有一张A。', '选择红5，移动到黑6下面。', '连续牌组需要红黑交替，点数每次少1。', '选择A，送入同花归档区。', '空列只接受K；归档从A向上，和牌列方向相反。', '正式局归档达到目标张数，不必收完52张。'],
        tetris: ['预览中落下的是方形块，底行中间留有两格。', '左右移动对准空缺。', '旋转适用于其他形状，方形旋转后仍一样。', '按空格落下，完整横行被清除。', '未填满的行不会清除，堆到出生位置会失败。', '正式局清除目标行数，留出方块移动空间。'],
        jump: ['下一平台中心距离为240，先看它的宽度。', '按住蓄力，距离从100逐渐增加。', '接近目标刻线时准备松开。', '松开后落点在平台范围内，前进一次。', '继续按太久会跳过头；指针取消会取消本次蓄力。', '正式局每次平台距离变化，看清下一次目标再起跳。'],
        parkour: ['三条路线，先看障碍进入哪一条。', '低栏可按空格跳过，也可以提前换道。', '高横梁需要下键滑行，起跳反而会碰上。', '实心箱体必须绕到旁边路线。', '空中不能接滑行，动作结束后再做下一次。', '通过目标数量即可完成，剩余保护次数清楚显示。']
    };

    function clone(g) {
        return JSON.parse(JSON.stringify(g));
    }

    function demoStates(kind) {
        const g = MoonArcade.create(kind, {seed: 7, difficulty: 'easy'}), states = [];
        if (!g) return states;
        const snap = () => states.push(clone(g));
        if (kind === 'mines') {
            snap();
            MoonArcade.mineClick(g, 0);
            snap();
            snap();
            const i = g.cells.findIndex(v => v.mine);
            MoonArcade.mineClick(g, i, true);
            snap();
            snap();
            g.cells.forEach(v => {
                if (!v.mine) v.open = true;
            });
            snap();
        } else if (['wordle', 'number-wordle'].includes(kind)) {
            g.answer = kind === 'wordle' ? 'WATER' : '1123';
            snap();
            MoonArcade.guess(g, kind === 'wordle' ? 'OTHER' : '1111');
            snap();
            snap();
            if (kind === 'number-wordle') MoonArcade.guess(g, '1213');
            snap();
            snap();
            MoonArcade.guess(g, g.answer);
            snap();
        } else if (kind === 'memory') {
            Object.assign(g, {w: 2, h: 2, cells: [1, 2, 1, 2], remaining: 4});
            snap();
            MoonArcade.pairClick(g, 0);
            MoonArcade.pairClick(g, 1);
            snap();
            MoonArcade.tick(g, 1.2);
            snap();
            MoonArcade.pairClick(g, 0);
            MoonArcade.pairClick(g, 2);
            snap();
            MoonArcade.tick(g, .6);
            snap();
            MoonArcade.pairClick(g, 1);
            MoonArcade.pairClick(g, 3);
            MoonArcade.tick(g, .6);
            snap();
        } else if (kind === 'link') {
            Object.assign(g, {w: 4, h: 2, cells: [1, 2, 2, 1, 3, 3, 4, 4], remaining: 8});
            snap();
            MoonArcade.pairClick(g, 1);
            snap();
            MoonArcade.pairClick(g, 2);
            snap();
            MoonArcade.pairClick(g, 0);
            MoonArcade.pairClick(g, 3);
            snap();
            snap();
            MoonArcade.pairClick(g, 4);
            MoonArcade.pairClick(g, 5);
            MoonArcade.pairClick(g, 6);
            MoonArcade.pairClick(g, 7);
            snap();
        } else if (kind === 'match3') {
            Object.assign(g, {w: 4, h: 4, target: 3, cells: [1, 2, 1, 3, 2, 1, 3, 2, 3, 4, 2, 4, 4, 3, 4, 1]});
            snap();
            g.selected = 1;
            snap();
            MoonArcade.swapMatch(g, 1, 5);
            snap();
            MoonArcade.tick(g, .3);
            snap();
            MoonArcade.tick(g, .3);
            snap();
            for (let i = 0; i < 100 && g.animation; i++) MoonArcade.tick(g, .3);
            snap();
        } else if (kind === 'huarong') {
            g.pieces = [{x: 1, y: 2, w: 2, h: 2, name: '主舱'}];
            snap();
            g.selected = 0;
            snap();
            MoonArcade.slide(g, 2);
            snap();
            snap();
            snap();
            snap();
        } else if (kind === 'spider') {
            g.cols = [Array.from({length: 6}, (_, i) => ({
                rank: 13 - i,
                suit: 0,
                up: true
            })), Array.from({length: 7}, (_, i) => ({rank: 7 - i, suit: 0, up: true}))];
            g.stock = [];
            snap();
            MoonArcade.cardSelect(g, 1, 0);
            snap();
            MoonArcade.cardMove(g, 0);
            snap();
            snap();
            snap();
            snap();
        } else if (kind === 'solitaire') {
            g.cols = [[{rank: 6, suit: 0, up: true}], [{rank: 5, suit: 1, up: true}], [{rank: 1, suit: 2, up: true}]];
            snap();
            MoonArcade.cardSelect(g, 1, 0);
            snap();
            MoonArcade.cardMove(g, 0);
            snap();
            MoonArcade.cardSelect(g, 2, 0);
            MoonArcade.foundation(g, 2);
            snap();
            snap();
            snap();
        } else if (kind === 'tetris') {
            g.cells.fill(0);
            for (let i = 170; i < 180; i++) if (i !== 174 && i !== 175) g.cells[i] = 1;
            g.type = 1;
            g.piece = [[1, 1], [1, 1]];
            g.x = 3;
            g.y = 14;
            snap();
            MoonArcade.tetrisMove(g, 'right');
            snap();
            snap();
            MoonArcade.tetrisMove(g, 'drop');
            snap();
            snap();
            snap();
        } else if (kind === 'jump') {
            g.distance = 240;
            snap();
            g.holding = true;
            g.charge = .3;
            snap();
            g.charge = (240 - 100) / 180;
            snap();
            MoonArcade.jumpRelease(g);
            MoonArcade.tick(g, .7);
            snap();
            snap();
            snap();
        } else {
            for (let i = 0; i < 6; i++) snap();
        }
        return states;
    }

    function render(p) {
        const phase = p.introPhase || 'rules', kind = p.classic?.kind || 'piano',
            fresh = Object.hasOwn(MoonArcadeGuide.names, kind),
            lesson = fresh ? {rules: MoonArcadeGuide.rules[kind]} : original.lessons[kind] || original.lessons.piano;
        const root = document.createElement('section');
        root.className = 'workshop-guide';
        p.controls.append(root);
        const steps = document.createElement('ol');
        steps.className = 'workshop-phases';
        ['讲解规则', '分步演示', '正式游戏'].forEach((v, i) => {
            const li = document.createElement('li');
            li.textContent = (i + 1) + ' ' + v;
            li.setAttribute('aria-current', i === (phase === 'rules' ? 0 : 1) ? 'step' : 'false');
            steps.append(li);
        });
        root.append(steps);
        if (phase === 'rules') {
            const h = document.createElement('h3');
            h.textContent = '先看目标，再看怎样操作';
            root.append(h);
            lesson.rules.forEach((text, i) => {
                const row = document.createElement('p');
                row.className = 'rule-row';
                const b = document.createElement('b');
                b.textContent = String(i + 1).padStart(2, '0');
                row.append(b, document.createTextNode(text));
                root.append(row);
            });
            const note = document.createElement('p');
            note.className = 'guide-note';
            note.textContent = '下一步用独立小例子演示。教学不计时、不计分；正式开始后可以按 R 重试同题。';
            root.append(note);
            return;
        }
        p.workshopStep ??= 0;
        const max = fresh ? 6 : 6;
        const header = document.createElement('h3');
        header.textContent = '独立演示 · ' + (p.workshopStep + 1) + ' / ' + max;
        root.append(header);
        if (fresh) {
            p.demoSnapshots ??= demoStates(kind);
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 270;
            canvas.setAttribute('aria-label', '独立演示棋盘');
            root.append(canvas);
            draw(canvas, p.demoSnapshots[p.workshopStep], p.workshopStep);
            const caption = document.createElement('p');
            caption.className = 'demo-caption';
            caption.setAttribute('aria-live', 'polite');
            caption.textContent = actionTips[kind][p.workshopStep];
            root.append(caption);
        } else {
            const holder = document.createElement('div'), controls = p.controls;
            p.controls = holder;
            p.tutorialState = {playing: false, time: 0, step: Math.max(0, Math.min(3, p.workshopStep - 1))};
            original.render(p);
            p.controls = controls;
            p.tutorialDemo.root.hidden = false;
            root.append(p.tutorialDemo.root);
            if (p.workshopStep === 0) p.tutorialDemo.caption.textContent = '先确认：' + lesson.rules[0];
            if (p.workshopStep === 5) p.tutorialDemo.caption.textContent = '完成检查：' + lesson.rules.at(-1) + ' 正式关卡中的位置和规模可能不同。';
        }
        const toolbar = document.createElement('div');
        toolbar.className = 'guide-toolbar';
        root.append(toolbar);
        const control = (text, fn) => p.button(text, fn, toolbar), show = step => {
            p.workshopStep = step;
            p.workshopAuto = false;
            p.render();
        };
        control('上一步', () => show(Math.max(0, p.workshopStep - 1))).disabled = !p.workshopStep;
        control(p.workshopAuto ? '暂停演示' : '自动演示', () => {
            p.workshopAuto = !p.workshopAuto;
            p.workshopElapsed = 0;
            if (p.workshopStep === 5) p.workshopStep = 0;
            p.render();
        });
        control('下一步', () => show(Math.min(5, p.workshopStep + 1))).disabled = p.workshopStep === 5;
        control('从头重播', () => show(0));
        const note = document.createElement('p');
        note.className = 'guide-note';
        note.textContent = '演示可暂停、前后查看或重播。点击“准备好了，开始”才进入正式关卡。';
        root.append(note);
    }

    function draw(canvas, g, step) {
        const c = canvas.getContext('2d');
        c.fillStyle = '#101f25';
        c.fillRect(0, 0, 600, 270);
        c.font = '19px sans-serif';
        c.textAlign = 'center';
        const tile = (x, y, w, h, text, fill = '#35494c') => {
            c.fillStyle = fill;
            c.fillRect(x + 2, y + 2, w - 4, h - 4);
            c.fillStyle = '#ead6a4';
            c.fillText(text, x + w / 2, y + h * .65);
        };
        if (!g) return;
        if (g.kind === 'mines') {
            g.cells.forEach((v, i) => tile(160 + i % g.w * 40, 12 + Math.floor(i / g.w) * 40, 40, 40, v.flag ? '⚑' : v.open ? v.n || '·' : '', v.open ? '#4f6260' : '#24383e'));
        } else if (['memory', 'link', 'match3'].includes(g.kind)) {
            const size = Math.min(58, 235 / g.h), left = (600 - g.w * size) / 2;
            g.cells.forEach((v, i) => {
                const show = g.kind !== 'memory' || g.face.includes(i) || g.matched.includes(i);
                tile(left + i % g.w * size, 14 + Math.floor(i / g.w) * size, size, size, !v || g.matched?.includes(i) ? '' : show ? ['☾', '✦', '△', '◇'][v - 1] : '?', g.animation?.indices?.includes(i) ? '#a7874f' : g.selected === i ? '#7c6946' : '#344b50');
            });
        } else if (['wordle', 'number-wordle'].includes(g.kind)) {
            g.guesses.forEach((v, row) => [...v.text].forEach((letter, i) => tile(150 + i * 55, 20 + row * 65, 52, 58, letter, ['#3e494c', '#897444', '#47786b'][v.marks[i]])));
            if (!g.guesses.length) {
                c.fillStyle = '#caba95';
                c.fillText('示例答案 ' + g.answer, 300, 130);
            }
        } else if (g.kind === 'huarong') {
            for (let i = 0; i < 20; i++) tile(205 + i % 4 * 45, 15 + Math.floor(i / 4) * 45, 45, 45, '', '#1f333b');
            g.pieces.forEach(v => tile(205 + v.x * 45, 15 + v.y * 45, v.w * 45, v.h * 45, v.name, '#7d6c48'));
            c.fillStyle = '#d7c38d';
            c.fillText('↓ 出口', 295, 260);
        } else if (['spider', 'solitaire'].includes(g.kind)) {
            g.cols.forEach((col, x) => col.forEach((v, i) => tile(140 + x * 110, 12 + i * 25, 80, 48, ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][v.rank], v.suit % 2 ? '#815953' : '#45535b')));
            if (g.completed || g.foundation.some(Boolean)) {
                c.fillStyle = '#e0c58a';
                c.fillText('已归档 ' + (g.completed || g.foundation.reduce((a, b) => a + b, 0)), 430, 120);
            }
        } else if (g.kind === 'tetris') {
            const cells = [...g.cells];
            g.piece.forEach((row, y) => row.forEach((v, x) => {
                if (v) cells[(g.y + y) * 10 + g.x + x] = 2;
            }));
            for (let y = 10; y < 18; y++) for (let x = 0; x < 10; x++) tile(160 + x * 28, 20 + (y - 10) * 28, 28, 28, '', cells[y * 10 + x] ? '#b6a277' : '#223940');
            c.fillStyle = '#e0c58a';
            c.fillText('清除 ' + g.lines + ' 行', 300, 260);
        } else if (g.kind === 'jump') {
            tile(70, 170, 80, 70, '起点');
            tile(310 - g.width / 2, 170, g.width, 70, '平台', '#3d795f');
            c.fillStyle = '#d6bb88';
            c.fillRect(step >= 3 ? 300 : 100, 140, 20, 30);
            c.fillStyle = '#3c5356';
            c.fillRect(100, 40, 360, 16);
            c.fillStyle = '#c6a970';
            c.fillRect(100, 40, g.charge / 1.5 * 360, 16);
            c.fillText(step >= 3 ? '正确落在平台范围内' : '蓄力距离 ' + Math.round(100 + g.charge * 180), 300, 95);
        } else {
            for (let i = 0; i < 3; i++) tile(115 + i * 125, 28, 105, 190, ['低栏 · 跳', '横梁 · 滑', '箱体 · 绕'][i], step === i + 1 ? '#746443' : '#2c454b');
        }
    }

    function tick(p, dt) {
        if (p.introPhase !== 'demo' || !p.workshopAuto) return;
        p.workshopElapsed = (p.workshopElapsed || 0) + dt;
        if (p.workshopElapsed >= 3.5) {
            p.workshopElapsed = 0;
            if (p.workshopStep >= 5) p.workshopAuto = false; else p.workshopStep++;
            p.render();
        }
    }

    globalThis.MoonTutorials = {...original, render, tick};
})();