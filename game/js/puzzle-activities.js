"use strict";
globalThis.MoonActivities = {
    descriptions: {
        tools: '工具分类：先选工具，再放入对应的用途托盘。看清工具形状与名称，错放会扣分。',
        oxygen: '旋转管段，把左上入口连至右下出口。亮起的管道是已通气部分，所有沿途接头都必须密合。',
        water: '转动滴灌软管，把左上水龙头接到右下花盆。岔路不必全接，但通水的接头不能漏水。',
        lamp: '旋转线路板，让电源接到楼道灯。铜色线路会显示已连通的部分。',
        temperature: '熄灯谜题：点击节点会同时翻转自身与上下左右四格。消除全部橙色过热节点。',
        interface: '熄灯谜题：点击节点会翻转自身与上下左右的邻居。消除全部故障灯，恢复只读接口。',
        drone: '推箱子：把全部无人机推上黄色充电座。方向键移动，只能推不能拉。卡住可撤回一步或重置。',
        comms: '信号记忆：看清灯光顺序，再按原顺序输入。每轮都会延长序列。',
        'soil-check': '对照昨晚和现在的花盆，在右图圈出变化。先看土和接水盘，再检查其他细节。',
        'model-check': '对照昨晚搭好的飞船，在右图圈出变化。留意零件的位置和周围的小物件。',
        'archive-sort': '顺序归档：按单据右上角的编号，从小到大依次放入归档栏。点错可取回，再提交核对。',
        'cache-match': '滑块拼图：点击空格旁的芯片移动。按从左到右、从上到下排列编号，空格留在右下角。'
    },
    reset(p) {
        p.classic = MoonClassic.create(p.info.game, {difficulty: p.difficulty, seed: p.seed});
        p.history = [];
    },
    complete(p) {
        p.scoring.award('board', Math.max(0, 900 - p.scoring.points));
        p.finish(true);
    },
    icon(kind) {
        const art = {
            drone: '<path d="M28 30L16 17M72 30L84 17M28 70L16 83M72 70L84 83" stroke="#a9bbc0" stroke-width="7"/><g fill="#25343b" stroke="#a9bbc0" stroke-width="3"><circle cx="17" cy="17" r="12"/><circle cx="83" cy="17" r="12"/><circle cx="17" cy="83" r="12"/><circle cx="83" cy="83" r="12"/></g><rect x="29" y="24" width="42" height="52" rx="12" fill="#b9b8a8"/><path d="M37 45h26v22H37Z" fill="#415966"/><circle cx="50" cy="35" r="5" fill="#e0b760"/>',
            person: '<ellipse cx="50" cy="82" rx="27" ry="9" fill="#121b21"/><path d="M25 77V54Q25 39 50 39Q75 39 75 54V77" fill="#b2b5a6" stroke="#283f49" stroke-width="5"/><circle cx="50" cy="28" r="17" fill="#d4b994"/><path d="M32 23Q34 3 53 9Q68 8 68 27" fill="#29353b"/><path d="M35 61H65" stroke="#b88346" stroke-width="7"/>',
            dock: '<rect x="12" y="12" width="76" height="76" rx="12" fill="none" stroke="#dfbc70" stroke-width="4" stroke-dasharray="15 7"/><path d="M55 23L36 53H51L44 77L66 44H51Z" fill="#dfbc70"/>',
            filter: '<rect x="27" y="14" width="46" height="72" rx="7" fill="#a8b5ac"/><path d="M36 24v50m9-50v50m10-50v50m9-50v50" stroke="#49606a" stroke-width="4"/>',
            wrench: '<path d="M65 13L58 31L70 41L87 34Q88 56 66 59L36 89L20 73L52 44Q44 23 65 13" fill="#bfc0b1"/><circle cx="30" cy="77" r="4" fill="#31434b"/>',
            seal: '<circle cx="50" cy="50" r="31" fill="none" stroke="#b6aa85" stroke-width="15"/><circle cx="50" cy="50" r="31" fill="none" stroke="#e0cba1" stroke-width="2"/>',
            chip: '<rect x="23" y="23" width="54" height="54" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><path d="M35 12v11m15-11v11m15-11v11M35 77v11m15-11v11m15-11v11M12 35h11m-11 15h11m-11 15h11M77 35h11m-11 15h11m-11 15h11" stroke="currentColor" stroke-width="4"/>'
        };
        return '<svg viewBox="0 0 100 100" aria-hidden="true">' + (art[kind] || art.chip) + '</svg>';
    },
    render(p) {
        const g = p.classic;
        if (!g) return;
        p.description.textContent = this.descriptions[p.info.game];
        const grid = document.createElement('div');
        grid.className = 'classic-board classic-' + g.kind;
        grid.style.setProperty('--cols', g.width || 3);
        p.controls.append(grid);
        const b = (text, handler, parent = grid) => p.button(text, handler, parent);
        const strip = document.createElement('div');
        strip.className = 'workbench-strip';
        strip.textContent = MoonClassic.levels[g.difficulty].label + ' · ' + ({
            pipe: '密封管路',
            lights: '温控矩阵',
            sokoban: '停机坪',
            simon: '信号回放',
            difference: '现场比对',
            sort: '工具托盘',
            order: '交接记录',
            sliding: '离线介质'
        }[g.kind]) + (g.width ? ' · ' + g.width + ' × ' + (g.height || g.width) : '');
        p.controls.prepend(strip);
        if (g.kind === 'pipe') {
            const water = MoonClassic.flow(g);
            g.cells.forEach((mask, i) => {
                const el = b('', () => {
                    g.cells[i] = MoonClassic.rotate(mask);
                    g.moves++;
                    p.render();
                });
                el.setAttribute('aria-label', '旋转管段 ' + (i + 1));
                el.className = 'pipe-tile' + (water.seen.has(i) ? ' connected' : '');
                let paths = '';
                for (const [bit, x, y] of [[1, 50, 0], [2, 100, 50], [4, 50, 100], [8, 0, 50]]) if (mask & bit) paths += '<path d="M50 50L' + x + ' ' + y + '"/>';
                el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><g class="pipe-shadow">' + paths + '</g><g>' + paths + '</g><circle cx="50" cy="50" r="11"/><g class="tile-rivets"><circle cx="9" cy="9" r="2"/><circle cx="91" cy="91" r="2"/></g></svg>' + (i === 0 ? '<small>入口 →</small>' : i === g.cells.length - 1 ? '<small>→ ' + (p.info.game === 'lamp' ? '灯' : '出口') + '</small>' : '');
            });
            b(p.info.game === 'lamp' ? '接通电源' : '打开阀门', () => {
                if (MoonClassic.flow(g).win) this.complete(p); else p.wrong('还有接头没接上，顺着亮起的线路检查。');
            }, p.controls);
        } else if (g.kind === 'lights') {
            g.cells.forEach((on, i) => {
                const el = b('', () => {
                    MoonClassic.toggle(g, i);
                    p.render();
                    if (g.cells.every(v => !v)) this.complete(p);
                });
                el.innerHTML = this.icon('chip') + '<small>' + String(i + 1).padStart(2, '0') + '</small>';
                el.className = 'light-tile' + (on ? ' is-on' : '');
                el.setAttribute('aria-label', '切换节点 ' + (i + 1));
                el.setAttribute('aria-pressed', Boolean(on));
            });
        } else if (g.kind === 'sokoban') {
            for (let i = 0; i < g.width * g.height; i++) {
                const cell = document.createElement('div');
                cell.className = 'soko-cell' + (g.walls.includes(i) ? ' wall' : '') + (g.goals.includes(i) ? ' dock' : '');
                cell.innerHTML = (g.goals.includes(i) ? this.icon('dock') : '') + (g.boxes.includes(i) ? this.icon('drone') : i === g.player ? this.icon('person') : '');
                grid.append(cell);
            }
            const pad = document.createElement('div');
            pad.className = 'soko-pad';
            p.controls.append(pad);
            ['↑', '→', '↓', '←'].forEach((text, d) => b(text, () => this.move(p, d), pad));
            p.feedback.textContent = '已归位 ' + g.boxes.filter(i => g.goals.includes(i)).length + ' / ' + g.goals.length;
            b('撤回一步', () => {
                const last = p.history.pop();
                if (last) {
                    g.player = last.player;
                    g.boxes = last.boxes;
                    g.moves++;
                    p.render();
                }
            }, p.controls).disabled = !p.history.length;
        } else if (g.kind === 'simon') {
            grid.style.setProperty('--cols', 2);
            ['青灯', '橙灯', '白灯', '绿灯'].forEach((text, i) => {
                const el = b(text, () => {
                    if (g.phase !== 'input') return;
                    if (i !== g.sequence[g.input.length]) {
                        p.wrong('顺序不对，再听一遍。');
                        g.phase = 'show';
                        g.clock = 0;
                        g.input = [];
                        p.render();
                        return;
                    }
                    MoonSound.note(i);
                    g.input.push(i);
                    if (g.input.length === g.round) {
                        p.scoring.award('round' + g.round, 300);
                        if (g.round === g.rounds.at(-1)) {
                            this.complete(p);
                            return;
                        }
                        g.round = g.rounds[g.rounds.indexOf(g.round) + 1];
                        g.phase = 'ready';
                        g.input = [];
                        p.message = '这一轮正确。';
                    }
                    p.render();
                });
                el.setAttribute('aria-label', text);
                el.className = 'simon-key simon-' + i;
                el.disabled = g.phase !== 'input';
                el.dataset.lamp = i;
                el.insertAdjacentHTML('afterbegin', '<span class="signal-symbol">' + ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][i] + '</span>');
            });
            p.description.textContent = this.descriptions.comms + ' 当前 ' + g.round + ' 拍。';
            if (g.phase === 'ready') b('播放信号', () => {
                g.phase = 'show';
                g.clock = 0;
                g.lit = -1;
                p.render();
            }, p.controls); else p.feedback.textContent = g.phase === 'input' ? '轮到你：' + g.input.length + ' / ' + g.round : '看灯，记住顺序。';
        } else if (g.kind === 'sliding') {
            g.cells.forEach((value, i) => {
                const el = b(value ? String(value).padStart(2, '0') : '', () => {
                    if (MoonClassic.slide(g, i)) {
                        p.render();
                        if (g.cells.every((v, k) => v === (k + 1) % g.cells.length)) this.complete(p);
                    }
                });
                el.className = 'cache-tile' + (!value ? ' empty' : '');
                el.setAttribute('aria-label', '移动芯片 ' + (i + 1));
                el.disabled = !value;
                if (value) el.insertAdjacentHTML('afterbegin', this.icon('chip'));
            });
        } else if (g.kind === 'order') {
            grid.className = 'archive-cards';
            g.items.forEach(item => {
                const el = b('', () => {
                    if (g.answer.includes(item.id)) return;
                    g.answer.push(item.id);
                    g.moves++;
                    p.render();
                });
                el.setAttribute('aria-label', '归档单据 ' + item.number);
                el.innerHTML = '<small>交接单 / ' + String(item.number).padStart(3, '0') + '</small><strong>' + (p.info.node === 'S02_TIME' ? String(Math.floor(item.id / 2) + 1).padStart(2, '0') + '号 · ' + (item.id % 2 ? '离世登记' : '唤醒登记') : ['滤芯签领', '压差复核', '阀组检查', '轮班记录'][item.id % 4]) + '</strong><span class="paper-lines"></span>';
                el.className = 'archive-card';
                el.disabled = g.answer.includes(item.id);
            });
            const tray = document.createElement('div');
            tray.className = 'archive-tray';
            p.controls.append(tray);
            g.answer.forEach(id => b(String(g.items.find(v => v.id === id).number), () => {
                g.answer = g.answer.filter(v => v !== id);
                p.render();
            }, tray));
            if (!g.answer.length) tray.textContent = '按编号从小到大放入这里';
            b('提交归档', () => {
                if (g.answer.length === g.items.length && g.answer.every((id, i) => id === i)) this.complete(p); else p.wrong('还有遗漏或顺序不对。点击下方的编号可以取回。');
            }, p.controls);
        } else if (g.kind === 'sort') {
            grid.className = 'tool-cards';
            const names = ['滤芯', '扳手', '密封圈', '滤网', '套筒扳手', '密封垫', '进气滤筒', '开口扳手', '法兰垫圈'];
            g.items.forEach(id => {
                const el = b('', () => {
                    g.selected = id;
                    p.render();
                });
                el.className = 'tool-card';
                el.setAttribute('aria-label', '选择' + names[id]);
                el.setAttribute('aria-pressed', g.selected === id);
                el.innerHTML = this.icon(['filter', 'wrench', 'seal'][id % 3]) + '<span>' + names[id] + '</span>';
                el.disabled = g.done.includes(id);
            });
            const trays = document.createElement('div');
            trays.className = 'tool-trays';
            p.controls.append(trays);
            ['过滤空气', '紧固螺栓', '密封接头'].forEach((name, i) => b(name, () => {
                if (g.selected === null) {
                    p.feedback.textContent = '先从上面选一件工具。';
                    return;
                }
                if (g.selected % 3 !== i) {
                    p.wrong('这件工具不是这个用途，再看一下。');
                    return;
                }
                g.done.push(g.selected);
                g.selected = null;
                p.scoring.award('tool' + g.done.at(-1), 900 / g.items.length);
                if (g.done.length === g.items.length) this.complete(p); else p.render();
            }, trays));
            p.feedback.textContent = '已整理 ' + g.done.length + ' / ' + g.items.length;
        } else if (g.kind === 'difference') this.difference(p, grid);
        if (['pipe', 'lights', 'sokoban', 'sliding'].includes(g.kind)) b('重置棋盘', () => {
            this.reset(p);
            p.message = '已恢复本局布局，计时与失误保留。';
            p.render();
        }, p.controls);
    },
    move(p, d) {
        if (p.result || !p.running) return;
        const g = p.classic;
        if (g.kind !== 'sokoban') return;
        const before = {player: g.player, boxes: [...g.boxes]};
        if (MoonClassic.push(g, d)) {
            p.history.push(before);
            p.render();
            if (MoonClassic.won(g)) this.complete(p);
        } else p.feedback.textContent = '推不过去。绕到另一边，或撤回一步。';
    },
    difference(p, root) {
        const g = p.classic, soil = p.info.game === 'soil-check',
            spots = soil ? [[110, 104, 39], [110, 154, 34]] : [[60, 70, 27], [120, 46, 25], [170, 107, 25]];
        if (g.extra > 0) spots.push(soil ? [45, 30, 20] : [194, 149, 16]);
        if (g.extra > 1) spots.push(soil ? [179, 153, 15] : [25, 30, 15]);
        g.spots = spots;
        root.className = 'difference-board';
        for (const changed of [false, true]) {
            const panel = document.createElement('div');
            panel.className = 'difference-panel';
            const label = soil ? (changed ? '现在' : '昨晚 · 浇水后') : (changed ? '现在' : '昨晚 · 搭好后');
            const pot = `<path d="M80 79Q32 76 42 28Q77 28 100 78M102 74Q156 78 166 26Q115 18 102 74" fill="#658577"/><path d="M99 89L97 46" stroke="#adc09b" stroke-width="4"/><path d="M62 100L73 151H150L161 100Z" fill="#947452"/><ellipse cx="110" cy="101" rx="49" ry="16" fill="${changed ? '#ae906a' : '#554b39'}"/>${changed ? '<path d="M78 102L99 98L105 107L125 102L140 109" fill="none" stroke="#514433" stroke-width="3"/>' : '<path d="M75 101Q104 90 143 104" fill="none" stroke="#77928b" stroke-width="4"/>'}<ellipse cx="111" cy="156" rx="50" ry="9" fill="#594d3b"/>${changed ? '' : '<ellipse cx="111" cy="154" rx="34" ry="5" fill="#608993"/>'}`;
            const model = `<path d="M35 130H185" stroke="#b09770" stroke-width="5"/><path d="${changed ? 'M39 62h38v30H39Z' : 'M41 87L83 65V115H41Z'}" fill="#6b8fa5"/><path d="${changed ? 'M109 29h28v29h-28Z' : 'M92 53L119 25L142 53V115H92Z'}" fill="#d0c7b0"/><path d="${changed ? 'M153 101h33v28h-33Z' : 'M147 72L185 97V115H147Z'}" fill="#ba8149"/>`;
            panel.innerHTML = `<strong>${label}</strong><svg viewBox="0 0 220 190" role="img" aria-label="${label}${soil ? '的花盆' : '的模型'}"><rect x="8" y="8" width="204" height="174" rx="8" fill="#26363b"/><g transform="${g.mirror ? 'translate(220 0) scale(-1 1)' : ''}">${soil ? pot : model}${g.extra > 0 ? (soil ? '<ellipse cx="45" cy="30" rx="15" ry="7" fill="' + (changed ? '#b59856' : '#648d70') + '"/>' : (changed ? '' : '<circle cx="194" cy="149" r="7" fill="#c9bb8f"/>')) : ''}${g.extra > 1 ? (soil ? '<path d="M179 142v22m-8-7h16" stroke="' + (changed ? '#5c5142' : '#8fbdc2') + '" stroke-width="4"/>' : '<path d="' + (changed ? 'M17 36L31 25L34 38Z' : 'M16 23H35L25 39Z') + '" fill="#cfad70"/>') : ''}${changed ? g.found.map(i => `<circle cx="${spots[i][0]}" cy="${spots[i][1]}" r="${spots[i][2]}" fill="none" stroke="#edd394" stroke-width="3"/>`).join('') : ''}</g></svg>`;
            root.append(panel);
            if (changed) {
                const svg = panel.querySelector('svg');
                svg.addEventListener('click', event => {
                    const at = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse()),
                        x = g.mirror ? 220 - at.x : at.x, y = at.y,
                        index = spots.findIndex(([a, b, d]) => Math.hypot(a - x, b - y) < d);
                    if (index < 0) {
                        p.wrong('这里没有变化。');
                        return;
                    }
                    if (g.found.includes(index)) return;
                    g.found.push(index);
                    p.scoring.award('difference' + index, 900 / spots.length);
                    p.message = '已圈出一处变化。';
                    p.render();
                    if (g.found.length === spots.length) this.complete(p);
                });
            }
        }
        p.feedback.textContent = `找到 ${g.found.length} / ${spots.length} 处。点击右图圈出不同。`;
    },
    reveal(p) {
        const g = p.classic;
        if (!g) return;
        if (g.kind === 'pipe') g.cells = [...g.solution];
        if (g.kind === 'lights') g.cells.fill(0);
        if (g.kind === 'sokoban') g.boxes = [...g.goals];
        if (g.kind === 'sliding') g.cells = g.cells.map((_, i) => (i + 1) % g.cells.length);
        if (g.kind === 'sort') g.done = [...g.items];
        if (g.kind === 'order') g.answer = g.items.map(v => v.id).sort((a, b) => a - b);
        if (g.kind === 'difference') g.found = Array.from({length: (p.info.game === 'soil-check' ? 2 : 3) + g.extra}, (_, i) => i);
        if (g.kind === 'simon') {
            g.phase = 'input';
            g.input = [...g.sequence];
            g.round = g.rounds.at(-1);
        }
        const holder = document.createElement('div');
        holder.className = 'classic-solution';
        const original = p.controls;
        p.controls = holder;
        const description = p.description.textContent, feedback = p.feedback.textContent;
        this.render(p);
        p.description.textContent = description;
        p.feedback.textContent = feedback;
        p.controls = original;
        holder.querySelectorAll('button').forEach(b => b.disabled = true);
        holder.inert = true;
        original.append(holder);
    },
    tick(p, dt) {
        const g = p.classic;
        if (g?.kind === 'simon' && g.phase === 'show') {
            g.clock += dt;
            const beat = Math.floor(g.clock / g.beat), on = g.clock % g.beat < g.beat * .65;
            if (beat >= g.round) {
                g.phase = 'input';
                g.input = [];
                p.render();
                return;
            }
            const lit = on ? g.sequence[beat] : -1;
            if (lit !== g.lit) {
                g.lit = lit;
                if (lit >= 0) MoonSound.note(lit);
                p.controls.querySelectorAll('[data-lamp]').forEach(el => el.classList.toggle('lit', Number(el.dataset.lamp) === lit));
            }
        }
    }
};
