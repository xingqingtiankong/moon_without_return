"use strict";
(function () {
    const base = MoonTutorials;
    const captions = ['左侧是入口，右下侧是出口。每次点击管段，顺时针转90°。', '错误示范：右上弯头朝上，入口流到这里就泄漏，无法接通。', '把右上弯头转到左接头朝左、下接头朝下。水流可以转向下方。', '中间右侧的直管必须竖直，两端分别接上、接下。', '右下弯头必须上接来路、右接出口。亮起的连通管段组成完整通路。', '确认所有亮起的接头均接合，再打开阀门；楼道灯则点击接通电源。'];
    globalThis.MoonTutorials = {
        ...base, render(p) {
            if (p.classic?.kind !== 'pipe') return base.render(p);
            const root = document.createElement('section');
            root.className = 'workshop-guide';
            p.controls.append(root);
            root.innerHTML = '<ol class="workshop-phases"><li>① 讲解规则</li><li>② 分步演示</li><li>③ 正式游戏</li></ol>';
            if (p.introPhase === 'rules') {
                for (const text of ['目标：连接左上格左侧入口和右下格右侧出口。楼道灯使用同样的接线规则。', '点一个管段，顺时针旋转90°。相邻接头必须互相对准，只是挨着不算连通。', '绿色表示已从入口接通；入口朝错方向时，没有任何管段能通电或通水。', '从入口接通的每一个开口都要密封，不能朝空白或棋盘外泄漏，入口与出口除外。', '不要求所有装饰支路亮起，只需正确密封并到达出口。完成后点击打开阀门或接通电源。']) {
                    const row = document.createElement('p');
                    row.textContent = text;
                    root.append(row);
                }
                return;
            }
            const step = p.workshopStep || 0, canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 285;
            root.append(canvas);
            const c = canvas.getContext('2d');
            c.fillStyle = '#122831';
            c.fillRect(0, 0, 640, 285);
            const cells = [10, 10, step < 2 ? 3 : 12, 0, 0, step < 3 ? 10 : 5, 0, 0, step < 4 ? 6 : 3],
                g = {cells, width: 3, height: 3}, flow = MoonClassic.flow(g);
            for (let i = 0; i < 9; i++) {
                const x = 220 + i % 3 * 72, y = 28 + Math.floor(i / 3) * 72;
                c.fillStyle = '#2c4149';
                c.fillRect(x, y, 66, 66);
                c.strokeStyle = flow.seen.has(i) ? '#acd8b5' : '#b69f72';
                c.lineWidth = 12;
                c.lineCap = 'round';
                for (const [bit, dx, dy] of [[1, 0, -32], [2, 32, 0], [4, 0, 32], [8, -32, 0]]) if (cells[i] & bit) {
                    c.beginPath();
                    c.moveTo(x + 33, y + 33);
                    c.lineTo(x + 33 + dx, y + 33 + dy);
                    c.stroke();
                }
            }
            c.fillStyle = '#decea3';
            c.font = '18px sans-serif';
            c.fillText('入口 →', 112, 68);
            c.fillText('→ 出口', 447, 211);
            if (step === 5) {
                c.fillStyle = '#9ee0a9';
                c.fillText('密封检查通过 ✓', 238, 269);
            }
            const label = document.createElement('p');
            label.className = 'demo-caption';
            label.textContent = (step + 1) + ' / 6 · ' + captions[step];
            root.append(label);
            const controls = document.createElement('div');
            root.append(controls);
            for (const [name, next] of [['上一步', Math.max(0, step - 1)], ['下一步', Math.min(5, step + 1)], ['从头重播', 0]]) p.button(name, () => {
                p.workshopStep = next;
                p.render();
            }, controls);
        }, tick(p, dt) {
            if (p.classic?.kind !== 'pipe') base.tick(p, dt);
        }
    };
})();