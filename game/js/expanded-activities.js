"use strict";
(function () {
    const a = MoonActivities, base = {reset: a.reset, render: a.render, reveal: a.reveal, tick: a.tick};
    Object.assign(a.descriptions, {
        'merge2048': '电力汇集 · 2048：用方向键或屏幕箭头移动，相同数字相碰会合并。达到本局目标即可恢复备用电源。每次移动后出现新电池。',
        flier: '微型巡检机：按空格或点击「抬升」，穿过管道之间的缺口。松开会下落；通过指定数量的障碍即可完成巡检。',
        runner: '地面巡检车：按空格或点击「跳跃」越过障碍，落地后才能再次起跳。通过指定数量即可抵达检修口。',
        sudoku: '记录校验 · 数独：每行、每列和粗线宫格都必须包含 1 到本局最大数字，且不重复。选空格后填数；固定字段不可修改。',
        loop: '隔离回路 · 数回：点击相邻圆点之间的边连线，再点标叉，第三次清除。每格周围线数等于数字，最终形成一条不分叉的闭合回路。',
        bridges: '数据连接 · 数桥：点击岛屿之间的连线，切换无桥、单桥、双桥。每座岛的桥数等于数字，所有岛屿必须连成整体。',
        'clip-order': '动作排序：按录像中动作发生的顺序选入六个片段。点下方片段可取回，确认后提交。',
        'body-match': '舱位校验：先选身体样本记录，再选编号相符的培养舱。不要把记忆模板名称当成身体编号。',
        anchors: '空间锚点 · 故障处置：维持餐桌、儿童房门和入户门三个锚点。亮起故障时点击对应锚点处理。阿芷需要 180 秒读完文件。'
    });
    a.descriptions.akari = '照明覆盖 · 美术馆：点击白格放灯或取回。灯照亮同行同列，黑格阻挡光线；所有白格都要亮，灯之间不能互相照到。黑格数字规定相邻灯数。';
    a.descriptions.shikaku = '档案分区 · 四角切分：先点矩形一个角，再点对角。每个矩形恰好包含一个数字，面积等于数字。所有区域不能重叠，并要覆盖全盘。';
    a.descriptions.lamp = '楼道照明校验 · ' + a.descriptions.akari;
    a.descriptions.temperature = '温控记录校验 · ' + a.descriptions.sudoku;
    a.descriptions.interface = '只读通道重连 · ' + a.descriptions.bridges;
    a.reset = function (p) {
        p.classic = MoonExpanded.create(p.info.game, {difficulty: p.difficulty, seed: p.seed});
        if (!p.classic) return base.reset.call(this, p);
        p.history = [];
        if (p.classic.kind === 'anchors') {
            p.total = 180;
            p.remaining = 180;
        }
    };
    const isExpanded = g => g && ['merge', 'sudoku', 'loop', 'bridges', 'flier', 'runner', 'clips', 'bodymatch', 'anchors', 'akari', 'shikaku'].includes(g.kind);
    a.render = function (p) {
        const g = p.classic;
        if (!isExpanded(g)) return base.render.call(this, p);
        p.description.textContent = this.descriptions[p.info.game];
        const root = document.createElement('div');
        root.className = 'expanded-board expanded-' + g.kind;
        p.controls.append(root);
        p.expandedRoot = root;
        const b = (text, fn, parent = root) => p.button(text, fn, parent);
        const submit = (text, valid) => b(text, () => valid() ? this.complete(p) : p.wrong('还有不符合规则的地方，检查后可以再次提交。'), p.controls);
        if (g.kind === 'merge') {
            root.style.setProperty('--cols', 4);
            g.cells.forEach((v, i) => {
                const tile = document.createElement('div');
                tile.className = 'energy-cell';
                tile.dataset.power = v;
                tile.textContent = v || '';
                root.append(tile);
            });
            const pad = document.createElement('div');
            pad.className = 'expanded-pad';
            p.controls.append(pad);
            ['↑', '→', '↓', '←'].forEach((label, d) => b(label, () => this.expandedKey(p, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][d]), pad));
            p.feedback.textContent = '目标 ' + g.target + ' · 当前最高 ' + Math.max(...g.cells) + ' · 合并能量 ' + g.merges;
        } else if (g.kind === 'akari') {
            root.style.setProperty('--cols', g.width);
            const light = MoonExpanded.illumination(g);
            g.blocks.forEach((wall, i) => {
                const el = b(wall ? String(g.clues[i]) : g.bulbs[i] ? '✦' : '', () => {
                    g.bulbs[i] = !g.bulbs[i];
                    g.moves++;
                    p.render();
                });
                el.setAttribute('aria-label', '照明格 ' + (i + 1));
                el.disabled = wall;
                el.className = 'akari-cell' + (wall ? ' wall' : light.lit.has(i) ? ' lit' : '') + (light.conflicts.has(i) ? ' conflict' : '');
            });
            submit('检查照明覆盖', () => MoonExpanded.akariWin(g));
        } else if (g.kind === 'shikaku') {
            root.style.setProperty('--cols', g.width);
            g.clues.forEach((value, i) => {
                const region = g.regions.findIndex(v => MoonExpanded.regionCells(g, v).includes(i)),
                    el = b(value ? String(value) : '', () => {
                        if (region >= 0) {
                            g.regions.splice(region, 1);
                            g.start = null;
                            p.render();
                            return;
                        }
                        if (g.start === null) {
                            g.start = i;
                            p.render();
                            return;
                        }
                        const rect = MoonExpanded.rectangle(g, g.start, i);
                        g.start = null;
                        if (!MoonExpanded.placeRegion(g, rect)) p.wrong('矩形里必须只有一个数字，面积相等，并且不能重叠。');
                        p.render();
                        if (MoonExpanded.shikakuWin(g)) this.complete(p);
                    });
                el.setAttribute('aria-label', '分区格 ' + (i + 1));
                el.className = 'shikaku-cell' + (i === g.start ? ' selected' : '');
                if (region >= 0) el.style.background = ['#365c63', '#776245', '#4b6451', '#5a5671'][region % 4];
            });
            p.feedback.textContent = '先点一个角，再点对角；点击已划分区域可以撤销。';
        } else if (g.kind === 'sudoku') {
            root.style.setProperty('--cols', g.width);
            g.cells.forEach((v, i) => {
                const el = b(v ? String(v) : '', () => {
                    g.selected = i;
                    p.render();
                });
                el.className = 'sudoku-cell' + (g.givens[i] ? ' fixed' : '') + (i === g.selected ? ' selected' : '');
                el.setAttribute('aria-label', '数独格 ' + (i + 1));
                el.disabled = false;
                if (v && v === g.cells[g.selected]) el.classList.add('same-number');
                if (i % g.width === g.width - 1) el.style.borderRightWidth = '3px';
                if (Math.floor(i / g.width) === g.width - 1) el.style.borderBottomWidth = '3px';
                if (i % g.width % g.bw === 0) {
                    el.style.borderLeftWidth = '3px';
                    el.classList.add('box-left');
                }
                if (Math.floor(i / g.width) % g.bh === 0) {
                    el.style.borderTopWidth = '3px';
                    el.classList.add('box-top');
                }
            });
            const pad = document.createElement('div');
            pad.className = 'number-pad';
            p.controls.append(pad);
            for (let n = 0; n <= g.width; n++) b(n ? '填入 ' + n : '擦除', () => {
                if (g.selected < 0 || g.givens[g.selected]) {
                    p.feedback.textContent = '先选择一个可填写的格子。';
                    return;
                }
                g.cells[g.selected] = n;
                g.moves++;
                p.render();
            }, pad);
            submit('核验记录', () => MoonExpanded.sudokuWin(g));
        } else if (g.kind === 'loop') {
            const w = g.width;
            root.style.aspectRatio = '1';
            g.clues.forEach((v, i) => {
                const el = document.createElement('span');
                el.className = 'loop-clue';
                el.style.left = (i % w + .5) / w * 100 + '%';
                el.style.top = (Math.floor(i / w) + .5) / w * 100 + '%';
                el.textContent = v;
                root.append(el);
            });
            for (let y = 0; y <= w; y++) for (let x = 0; x <= w; x++) {
                const dot = document.createElement('i');
                dot.className = 'loop-dot';
                dot.style.left = x / w * 100 + '%';
                dot.style.top = y / w * 100 + '%';
                root.append(dot);
            }
            g.edges.forEach((e, i) => {
                const el = b(g.values[i] === -1 ? '×' : '', () => {
                    g.values[i] = g.values[i] === 0 ? 1 : g.values[i] === 1 ? -1 : 0;
                    p.render();
                });
                el.className = 'loop-edge ' + (e.h ? 'horizontal' : 'vertical') + (g.values[i] === 1 ? ' linked' : '');
                el.setAttribute('aria-label', '回路线段 ' + (i + 1));
                el.style.left = (e.x + (e.h ? .5 : 0)) / w * 100 + '%';
                el.style.top = (e.y + (e.h ? 0 : .5)) / w * 100 + '%';
                el.style[e.h ? 'width' : 'height'] = 82 / w + '%';
            });
            submit('检查隔离回路', () => MoonExpanded.loopWin(g));
        } else if (g.kind === 'bridges') {
            const nx = x => 10 + x / (g.width - 1) * 80, ny = y => 10 + y / (g.height - 1) * 80;
            g.edges.forEach((e, i) => {
                const first = g.nodes[e.a], last = g.nodes[e.b], horizontal = first.y === last.y,
                    el = b(g.values[i] === 2 ? 'Ⅱ' : g.values[i] === 1 ? 'Ⅰ' : '·', () => {
                        g.values[i] = (g.values[i] + 1) % 3;
                        p.render();
                    });
                el.className = 'bridge-edge ' + (horizontal ? 'horizontal' : 'vertical') + ' bridges-' + g.values[i];
                el.setAttribute('aria-label', '桥梁 ' + (i + 1));
                el.style.left = nx((first.x + last.x) / 2) + '%';
                el.style.top = ny((first.y + last.y) / 2) + '%';
                el.style[horizontal ? 'width' : 'height'] = (horizontal ? 80 / (g.width - 1) : 80 / (g.height - 1)) * .68 + '%';
            });
            g.nodes.forEach(n => {
                const el = document.createElement('span');
                el.className = 'bridge-island';
                el.textContent = n.need;
                el.style.left = nx(n.x) + '%';
                el.style.top = ny(n.y) + '%';
                root.append(el);
            });
            submit('验证连接', () => MoonExpanded.bridgeWin(g));
        } else if (['flier', 'runner'].includes(g.kind)) {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 300;
            canvas.setAttribute('aria-label', '巡检画面');
            root.append(canvas);
            p.arcadeCanvas = canvas;
            b(g.kind === 'flier' ? '抬升' : '跳跃', () => MoonExpanded.hop(g), p.controls);
            this.drawArcade(p);
        } else if (g.kind === 'clips') {
            const screen = document.createElement('p');
            screen.className = 'clip-playback';
            screen.setAttribute('aria-live', 'polite');
            screen.textContent = g.playback > 0 ? '原录像播放中…' : '先观看原录像，再按记住的顺序排列。';
            p.controls.prepend(screen);
            p.clipScreen = screen;
            b('观看原录像', () => {
                g.playback = 12;
                g.answer = [];
                p.render();
            }, p.controls);
            g.items.forEach(item => {
                const el = b(item.text, () => {
                    g.answer.push(item.id);
                    p.render();
                });
                el.disabled = g.answer.includes(item.id);
                el.className = 'archive-card';
            });
            const tray = document.createElement('div');
            tray.className = 'archive-tray';
            p.controls.append(tray);
            g.answer.forEach(id => b(g.items.find(x => x.id === id).text, () => {
                g.answer = g.answer.filter(v => v !== id);
                p.render();
            }, tray));
            submit('提交动作顺序', () => g.answer.length === 6 && g.answer.every((v, i) => v === i));
        } else if (g.kind === 'bodymatch') {
            const records = document.createElement('div'), bays = document.createElement('div');
            records.className = bays.className = 'body-records';
            root.append(records, bays);
            g.items.forEach(id => {
                const el = b('样本 BIO-' + String(id).padStart(2, '0'), () => {
                    g.selected = id;
                    p.render();
                }, records);
                el.disabled = g.matched.includes(id);
                el.setAttribute('aria-pressed', g.selected === id);
            });
            [...g.items].sort((a, b) => a - b).forEach(id => {
                const el = b(String(id).padStart(2, '0') + ' 号舱', () => {
                    if (g.selected !== id) {
                        p.wrong('核对样本编码；记忆模板相同不代表是同一个身体。');
                        return;
                    }
                    g.matched.push(id);
                    g.selected = null;
                    p.scoring.award('body' + id, 900 / g.items.length);
                    if (g.matched.length === g.items.length) this.complete(p); else p.render();
                }, bays);
                el.disabled = g.matched.includes(id);
            });
        } else if (g.kind === 'anchors') {
            ['餐桌 · 文件读取', '儿童房门 · 进程隔离', '入户门 · 空间索引'].forEach((name, i) => {
                const el = b(name, () => {
                    if (g.fault === i) {
                        g.values[i] = Math.min(100, g.values[i] + 30);
                        g.fault = -1;
                        p.scoring.award('anchor' + Math.floor(g.elapsed), Math.min(12, Math.max(0, 900 - p.scoring.points)));
                        MoonSound.note(i);
                    } else p.wrong('这个锚点没有故障。先处理亮起的警报。');
                });
                el.dataset.anchor = i;
                el.insertAdjacentHTML('beforeend', '<meter min="0" max="100" value="85"></meter><small>运行中</small>');
            });
            p.feedback.textContent = '阿芷正在逐页阅读。维持空间，不必恢复原来的布置。';
        }
        if (['sudoku', 'loop', 'bridges', 'clips', 'bodymatch', 'akari', 'shikaku'].includes(g.kind)) b('重置本局', () => {
            this.reset(p);
            p.render();
        }, p.controls);
    };
    a.expandedKey = function (p, code) {
        const g = p.classic;
        if (!isExpanded(g) || p.result || !p.started) return false;
        if (g.kind === 'merge') {
            const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(code);
            if (d < 0) return false;
            if (MoonExpanded.merge(g, d)) {
                p.render();
                if (Math.max(...g.cells) >= g.target) this.complete(p); else if (MoonExpanded.mergeStuck(g)) p.finish(false);
            }
            return true;
        }
        if (['flier', 'runner'].includes(g.kind) && ['Space', 'ArrowUp'].includes(code)) {
            MoonExpanded.hop(g);
            return true;
        }
        return false;
    };
    a.drawArcade = function (p) {
        const g = p.classic, c = p.arcadeCanvas.getContext('2d');
        c.fillStyle = '#101e27';
        c.fillRect(0, 0, 600, 300);
        c.strokeStyle = '#3a535d';
        for (let x = -(g.elapsed * 35) % 60; x < 600; x += 60) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, 300);
            c.stroke();
        }
        for (const o of g.obstacles) {
            c.fillStyle = '#69796d';
            if (g.kind === 'flier') {
                c.fillRect(o.x, 0, 34, o.center - g.gap / 2);
                c.fillRect(o.x, o.center + g.gap / 2, 34, 300);
            } else {
                c.fillStyle = '#b1945f';
                c.fillRect(o.x, 240 - o.height, 34, o.height);
            }
        }
        if (g.kind === 'runner') {
            c.fillStyle = '#637374';
            c.fillRect(0, 240, 600, 5);
        }
        c.fillStyle = g.invulnerable > 0 ? '#9e8580' : '#e6c989';
        c.fillRect(78, g.y - 12, 26, 18);
        c.fillStyle = '#70bbc7';
        c.fillRect(93, g.y - 10, 8, 6);
        c.strokeStyle = '#dbc899';
        c.beginPath();
        c.moveTo(74, g.y - 15);
        c.lineTo(111, g.y - 15);
        c.stroke();
        if (g.kind === 'runner') {
            c.fillStyle = '#b6c1bb';
            c.beginPath();
            c.arc(82, g.y + 8, 5, 0, 7);
            c.arc(101, g.y + 8, 5, 0, 7);
            c.fill();
        }
        p.feedback.textContent = '已通过 ' + g.passed + ' / ' + g.target + ' · 剩余保护 ' + g.lives;
    };
    a.tick = function (p, dt) {
        const g = p.classic;
        if (g?.kind === 'clips' && g.playback > 0) {
            g.playback = Math.max(0, g.playback - dt);
            const step = Math.min(5, Math.floor((12 - g.playback) / 2));
            p.clipScreen.textContent = g.playback > 0 ? '原录像 ' + (step + 1) + ' / 6 · ' + g.items.find(v => v.id === step).text : '播放结束。按记住的动作顺序排列，可再次观看。';
        }
        if (!isExpanded(g)) return base.tick.call(this, p, dt);
        if (['flier', 'runner'].includes(g.kind)) {
            const lives = g.lives;
            MoonExpanded.arcadeTick(g, dt);
            if (g.lives < lives) p.scoring.mistake();
            this.drawArcade(p);
            if (g.ended) g.lives > 0 ? this.complete(p) : p.finish(false);
        }
        if (g.kind === 'anchors') {
            g.elapsed += dt;
            g.next -= dt;
            g.values = g.values.map((v, i) => Math.max(0, v - dt * g.decay * (g.fault === i ? 5 : 1)));
            if (g.next <= 0) {
                g.fault = Math.floor(g.rng() * 3);
                g.next = g.window;
            }
            p.controls.querySelectorAll('[data-anchor]').forEach(el => {
                const i = Number(el.dataset.anchor);
                el.classList.toggle('fault', g.fault === i);
                el.querySelector('meter').value = g.values[i];
                el.querySelector('small').textContent = g.fault === i ? '故障 · 点击处理' : '稳定度 ' + Math.round(g.values[i]);
            });
            if (g.values.some(v => v <= 0)) p.finish(false); else if (g.elapsed >= 180) this.complete(p);
        }
    };
    a.reveal = function (p) {
        const g = p.classic;
        if (!isExpanded(g)) return base.reveal.call(this, p);
        const explanation = document.createElement('div');
        explanation.className = 'classic-solution';
        if (g.kind === 'clips') explanation.textContent = '慢放顺序：确认走廊 → 关闭灯光 → 数墙板 → 触摸第三块 → 后退等待 → 指向下缘。'; else if (g.kind === 'merge') explanation.textContent = '辅助电源已接入。合并时把大数字留在一侧，给小数字保留移动空间。'; else if (['flier', 'runner'].includes(g.kind)) explanation.textContent = '设备保护机构接管并完成剩余巡检。观察障碍的间距，提前调整动作。'; else if (g.kind === 'anchors') explanation.textContent = '广寒子冻结非必要区域，保留三个锚点。阿芷仍读完了全部文件。'; else {
            if (g.kind === 'akari') g.bulbs = [...g.solution];
            if (g.kind === 'shikaku') g.regions = g.solution.map(v => ({...v}));
            if (g.kind === 'sudoku') g.cells = [...g.solution];
            if (['loop', 'bridges'].includes(g.kind)) g.values = [...g.solution];
            if (g.kind === 'bodymatch') g.matched = [...g.items];
            const original = p.controls;
            p.controls = explanation;
            const description = p.description.textContent;
            this.render(p);
            p.description.textContent = description;
            p.controls = original;
            explanation.querySelectorAll('button').forEach(el => el.disabled = true);
            explanation.inert = true;
        }
        p.controls.append(explanation);
    };
})();