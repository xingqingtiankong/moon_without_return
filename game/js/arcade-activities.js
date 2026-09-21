"use strict";
(function () {
    const a = MoonActivities,
        base = {reset: a.reset, render: a.render, tick: a.tick, reveal: a.reveal, key: a.expandedKey};
    const names = {
        mines: '扫雷 · 危险点排查',
        spider: '蜘蛛纸牌 · 连续记录归档',
        solitaire: '纸牌 · 权限分级',
        jump: '跳一跳 · 平台跃迁',
        huarong: '华容道 · 主舱脱困',
        link: '连连看 · 同源线路',
        tetris: '俄罗斯方块 · 缓冲区整理',
        match3: '消消乐 · 噪声清除',
        memory: '翻牌配对 · 双份记录',
        'number-wordle': '数字 Wordle · 校验码',
        wordle: 'Wordle · 英文识别',
        parkour: '跑酷 · 三线巡检'
    };
    const rules = {
        mines: ['点开安全格，数字表示周围八格中的雷数。', '右键插旗，或先切换“标记模式”。插旗不是完成条件。', '第一次点开的格子及其周围安全；翻开全部非雷格完成。'],
        spider: ['点击一张牌，选中它和下面连续递减的同花牌。', '移到大一点的牌下；空列可放任意合法牌组。', '凑齐同花 K 到 A 自动收走；没有空列时可发一行。达成本局组数即可。'],
        solitaire: ['牌列按红黑交替、点数递减叠放，空列只能放 K。', '归档区按同花色 A 到 K 递增，每次归档一张。', '点击牌选择，再点目标列或归档区；牌库逐张翻牌，可回收重翻。'],
        jump: ['按住空格或跳跃按钮蓄力，松开起跳。', '蓄力条标明跃迁距离，落点要落入下一平台。', '落空消耗保护次数；落到目标数量的平台即完成。'],
        huarong: ['点击选择一个舱柜，用方向键或箭头移动一格。', '所有物件只能平移，不能重叠，也不能旋转。', '将最大的主舱移到底部中央出口，允许撤回一步。'],
        link: ['选择两个相同图案，清除一对。', '连线最多转两个弯，可以经过棋盘外边缘，不能穿过其他图案。', '清空棋盘完成；无可消除对时自动重新排列剩余图案。'],
        tetris: ['方向键左右移动，上键旋转，下键加速；空格直接落下。', '一整横行填满就清除，清除目标行数完成。', '方块堆到出生位置会失败；屏幕按钮也能操作。'],
        match3: ['交换相邻的两个符号，形成横向或纵向至少三个相同符号。', '有效交换消耗一步，连锁消除也计入目标。', '在步数内消除目标数量；无有效交换时自动换盘。'],
        memory: ['翻开两张卡，记住图案所在的位置。', '相同则收走，不同会短暂展示后扣回。', '卡片位置保持不变，找到所有配对完成。'],
        'number-wordle': ['每次输入完整数字码，数字可以重复。', '✓：数字和位置都对；↔：数字存在但位置不对；×：本次多出的数字不存在。', '重复数字按实际数量反馈，有限次数内猜中完整码。'],
        wordle: ['每次输入一个五字母英文单词。候选词可在站内词库查看。', '✓ 位置正确，↔ 字母存在但位置错误，× 表示超出答案中的数量。', '所有答案与允许输入均来自可查看的词库，有限次数内猜中。'],
        parkour: ['左右键切换三条路线，空格跳跃，下键滑行。', '低栏可以跳过，高横梁需要滑行，实心箱体必须换道。', '看清障碍接近的路线，通过目标数量完成。']
    };
    Object.entries(names).forEach(([k, v]) => a.descriptions[k] = v + '：' + rules[k].join(''));
    a.reset = function (p) {
        const g = MoonArcade.create(p.info.game, {seed: p.seed, difficulty: p.difficulty});
        if (!g) return base.reset.call(this, p);
        p.classic = g;
        p.history = [];
    };
    const own = g => g && Object.hasOwn(names, g.kind);

    function done(p) {
        if (p.classic.won) a.complete(p); else if (p.classic.lost) p.finish(false);
    }

    a.render = function (p) {
        const g = p.classic;
        if (!own(g)) {
            const result = base.render.call(this, p);
            if (p.info.node === 'F_OXYGEN') {
                const old = document.createElement('p');
                old.className = 'old-record-interference';
                old.textContent = '残留录音 · “饭给你留着。”　当前指令：保持入口至出口完整密封。';
                p.controls.append(old);
            }
            return result;
        }
        p.description.textContent = a.descriptions[g.kind];
        const root = document.createElement('div');
        root.className = 'arcade-board arcade-' + g.kind;
        p.controls.append(root);
        const b = (text, fn, parent = root) => p.button(text, fn, parent), refresh = () => {
            p.render();
            done(p);
        }, bad = () => p.wrong('这一步不符合规则，查看目标后再试。');
        if (g.kind === 'mines') {
            root.style.setProperty('--cols', g.w);
            g.cells.forEach((c, i) => {
                const el = b(c.open ? (c.mine ? '✹' : c.n || '') : c.flag ? '⚑' : '', () => {
                    MoonArcade.mineClick(g, i, g.flagMode);
                    refresh();
                });
                el.className = c.open ? 'mine-open' : 'mine-covered';
                el.dataset.number = c.n;
                el.setAttribute('aria-label', '排查格 ' + (i + 1));
                el.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    MoonArcade.mineClick(g, i, true);
                    refresh();
                });
            });
            b(g.flagMode ? '标记模式 · 切回翻开' : '翻开模式 · 切换标记', () => {
                g.flagMode = !g.flagMode;
                p.render();
            }, p.controls);
            p.feedback.textContent = '雷 ' + g.mineCount + ' · 已标记 ' + g.cells.filter(v => v.flag).length;
        } else if (['memory', 'link'].includes(g.kind)) {
            root.style.setProperty('--cols', g.w);
            const symbols = ['☾', '✦', '☀', '◈', '♧', '△', '◉', '⚙', '▣', '◇', '⌘', '♜', '♞', '♟', '✚', '❖', '○', '□', '☆', '♤', '♢', '♣', '♠', '♥'];
            g.cells.forEach((v, i) => {
                const shown = g.kind === 'link' || g.face.includes(i) || g.matched.includes(i),
                    el = b(shown ? symbols[v - 1] : '✥', () => {
                        const ok = MoonArcade.pairClick(g, i);
                        if (ok === false) bad();
                        refresh();
                    });
                el.setAttribute('aria-label', '配对格 ' + (i + 1));
                el.className = 'pair-cell' + (g.selected === i ? ' selected' : '') + (!v || g.matched.includes(i) ? ' cleared' : '');
                el.disabled = !v || g.matched.includes(i) || g.wait > 0;
                if (shown) el.dataset.symbol = v; else el.dataset.symbol = 'back';
                if (g.kind === 'memory') el.classList.add(shown ? 'face-up' : 'face-down');
                if (false) {
                    const labels = p.info.node === 'E_MAP' ? ['在岗维护者 / 当前操作员', '旧签注 / 新签名', '地球许可 / 外部授权', '生存曲线 / 连续日志', '编号 / 项目对象', '旁证 / 见证声明', '唤醒日 / 连续起点', '值班员 / 申请人', '生物样本 / 当前身体', '时标 / 工程时间', '计划结束 / 终止', '载荷 / 独立乘员'] : p.info.node === 'K_ISOLATE' ? ['儿童行为模型', '成年影像', '公共家庭照片', '儿童绘画', '成年信件', '原始家庭音轨', '八岁阶段记忆', '外部时间元数据'] : ['滤芯', '扳手', '密封圈', '螺栓', '压力计', '电池', '绝缘夹', '探针'];
                    const parts = labels[(v - 1) % labels.length].split(' / ');
                    el.textContent = g.kind === 'link' ? parts[i % parts.length] : labels[(v - 1) % labels.length];
                    el.textContent += ' · ' + v;
                    el.classList.add('label-pair');
                }
            });
            p.feedback.textContent = '剩余 ' + g.remaining / 2 + ' 对' + (g.kind === 'memory' ? ' · 翻牌 ' + (g.flips || 0) + ' 次 · 失配 ' + (g.mismatches || 0) + ' / ' + g.maxMistakes : '');
        } else if (['wordle', 'number-wordle'].includes(g.kind)) {
            root.style.setProperty('--cols', g.length);
            for (let row = 0; row < g.max; row++) for (let col = 0; col < g.length; col++) {
                const cell = document.createElement('div'), v = g.guesses[row];
                cell.className = 'word-cell';
                cell.dataset.mark = v ? v.marks[col] : 'empty';
                cell.textContent = v ? v.text[col] : '';
                if (v) {
                    const mark = document.createElement('small');
                    mark.textContent = ['×', '↔', '✓'][v.marks[col]];
                    cell.append(mark);
                }
                root.append(cell);
            }
            const form = document.createElement('form');
            form.className = 'guess-form';
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = g.length;
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.setAttribute('aria-label', g.kind === 'wordle' ? '输入五字母单词' : '输入数字码');
            input.inputMode = g.kind === 'wordle' ? 'text' : 'numeric';
            input.value = g.entry;
            input.addEventListener('input', () => g.entry = input.value.toUpperCase());
            form.append(input);
            const send = b('提交猜测', () => {
            }, form);
            send.type = 'submit';
            form.addEventListener('submit', e => {
                e.preventDefault();
                const message = MoonArcade.guess(g, input.value);
                if (message) {
                    p.feedback.textContent = message;
                    return;
                }
                p.render();
                done(p);
                p.controls.querySelector('input')?.focus();
            });
            p.controls.append(form);
            if (g.kind === 'wordle') {
                const d = document.createElement('details'), s = document.createElement('summary'),
                    list = document.createElement('p');
                s.textContent = '查看站内词库';
                list.textContent = MoonArcade.words.join(' · ');
                d.className = 'word-dictionary';
                d.append(s, list);
                p.controls.append(d);
            }
            p.feedback.textContent = '✓ 位置正确　↔ 存在但错位　× 数量不符 · 已猜 ' + g.guesses.length + ' / ' + g.max;
        } else if (g.kind === 'match3') {
            root.style.setProperty('--cols', 7);
            g.cells.forEach((v, i) => {
                const el = b(['◆', '●', '▲', '✦', '■', '⬟'][v - 1], () => {
                    if (g.animation) return;
                    if (g.selected === i) {
                        g.selected = null;
                        p.render();
                        return;
                    }
                    if (g.selected === null) {
                        g.selected = i;
                        p.render();
                        return;
                    }
                    const first = g.selected;
                    g.selected = null;
                    if (!MoonArcade.swapMatch(g, first, i)) bad();
                    refresh();
                });
                el.dataset.symbol = v;
                el.className = g.selected === i ? 'selected' : '';
                el.setAttribute('aria-label', '噪声格 ' + (i + 1));
                el.disabled = !!g.animation;
                if (g.animation?.phase === 'clear' && g.animation.indices.includes(i)) el.classList.add('match-clearing');
                if (g.animation?.phase === 'fall') {
                    const fall = g.falls?.find(v => v.i === i);
                    if (fall) el.style.setProperty('--fall', fall.dy);
                    el.classList.add('match-falling');
                }
            });
            p.feedback.textContent = '已清除 ' + g.cleared + ' / ' + g.target + ' · 剩余 ' + g.turns + ' 步';
        } else if (g.kind === 'huarong') {
            g.pieces.forEach((v, i) => {
                const el = b(v.name, () => {
                    g.selected = i;
                    p.render();
                });
                el.style.cssText = 'left:' + v.x * 25 + '%;top:' + v.y * 20 + '%;width:' + v.w * 25 + '%;height:' + v.h * 20 + '%';
                el.className = 'huarong-piece' + (g.selected === i ? ' selected' : '');
            });
            const pad = document.createElement('div');
            pad.className = 'arcade-pad';
            p.controls.append(pad);
            ['↑', '→', '↓', '←'].forEach((v, i) => b(v, () => {
                MoonArcade.slide(g, i);
                refresh();
            }, pad));
            b('撤回一步', () => {
                if (g.history.length) g.pieces = g.history.pop();
                p.render();
            }, p.controls);
            p.feedback.textContent = '底部中央是出口 · 已移动 ' + g.moves + ' 步';
        } else if (['spider', 'solitaire'].includes(g.kind)) {
            const toolbar = document.createElement('div');
            toolbar.className = 'card-toolbar';
            p.controls.prepend(toolbar);
            b('翻牌 / 发牌（' + g.stock.length + '）', () => {
                if (!MoonArcade.deal(g)) p.feedback.textContent = '牌库为空，或仍有空列需要填入。'; else refresh();
            }, toolbar);
            b('撤销', () => {
                MoonArcade.cardUndo(g);
                p.render();
            }, toolbar);
            const suits = ['♠', '♥', '♣', '♦'];
            if (g.kind === 'solitaire') {
                g.foundation.forEach((v, i) => b(suits[i] + ' 归档 ' + v, () => {
                    if (!MoonArcade.foundation(g, i)) bad();
                    refresh();
                }, toolbar));
                if (g.waste.length) {
                    const c = g.waste.at(-1);
                    b('翻牌区 ' + suits[c.suit] + rank(c.rank), () => {
                        MoonArcade.cardSelect(g, -1, g.waste.length - 1);
                        p.render();
                    }, toolbar);
                }
            }
            root.style.setProperty('--cols', g.cols.length);
            g.cols.forEach((col, c) => {
                const column = document.createElement('section');
                column.className = 'card-column';
                root.append(column);
                col.forEach((card, i) => {
                    const el = b(card.up ? suits[card.suit] + rank(card.rank) : '◇', () => {
                        if (!MoonArcade.cardSelect(g, c, i)) bad();
                        p.render();
                    }, column);
                    el.disabled = !card.up;
                    el.className = 'playing-card' + (card.suit % 2 ? ' red' : '') + (!card.up ? ' facedown' : '') + (g.selected?.col === c && i >= g.selected.index ? ' selected' : '');
                    el.setAttribute('aria-label', '第 ' + (c + 1) + ' 列第 ' + (i + 1) + ' 张' + (card.up ? ' ' + suits[card.suit] + rank(card.rank) : ' 背面'));
                });
                b('移至列 ' + (c + 1), () => {
                    if (!MoonArcade.cardMove(g, c)) bad();
                    refresh();
                }, column);
            });
            p.feedback.textContent = g.kind === 'spider' ? '本局目标：收齐 ' + g.target + ' 组同花 K—A · 已收 ' + g.completed : '本局目标：归档 ' + g.target + ' 张 · 已归档 ' + g.foundation.reduce((a, b) => a + b, 0);
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = g.kind === 'tetris' ? 300 : 600;
            canvas.height = g.kind === 'tetris' ? 540 : 300;
            canvas.setAttribute('aria-label', names[g.kind] + '画面');
            root.append(canvas);
            p.newCanvas = canvas;
            if (g.kind === 'tetris') {
                const pad = document.createElement('div');
                pad.className = 'arcade-pad';
                p.controls.append(pad);
                [['←', 'left'], ['→', 'right'], ['旋转', 'rotate'], ['↓', 'down'], ['直接落下', 'drop']].forEach(([name, action]) => b(name, () => {
                    MoonArcade.tetrisMove(g, action);
                    a.drawNew(p);
                    done(p);
                }, pad));
            }
            if (g.kind === 'jump') {
                const el = b('按住蓄力 · 松开跳跃', () => {
                }, p.controls);
                el.className = 'jump-hold';
                el.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    el.setPointerCapture(e.pointerId);
                    if (g.flight) return;
                    g.holding = true;
                    g.charge = 0;
                });
                el.addEventListener('pointerup', () => {
                    MoonArcade.jumpRelease(g);
                    a.drawNew(p);
                    done(p);
                });
                el.addEventListener('pointercancel', () => {
                    g.holding = false;
                    g.charge = 0;
                });
            }
            if (g.kind === 'parkour') {
                const pad = document.createElement('div');
                pad.className = 'arcade-pad';
                p.controls.append(pad);
                ['左移', '跳跃', '滑行', '右移'].forEach((v, i) => b(v, () => this.newKey(p, ['ArrowLeft', 'Space', 'ArrowDown', 'ArrowRight'][i]), pad));
            }
            a.drawNew(p);
        }
    };

    function rank(n) {
        return n === 1 ? 'A' : n === 11 ? 'J' : n === 12 ? 'Q' : n === 13 ? 'K' : n;
    }

    a.drawNew = function (p) {
        const g = p.classic, c = p.newCanvas?.getContext('2d');
        if (!c) return;
        c.fillStyle = '#101e24';
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
        c.strokeStyle = '#46544f';
        c.lineWidth = 1;
        if (g.kind === 'tetris') {
            const cells = [...g.cells];
            g.piece.forEach((r, j) => r.forEach((v, i) => {
                if (v) cells[(g.y + j) * 10 + g.x + i] = g.type + 1;
            }));
            cells.forEach((v, i) => {
                c.fillStyle = v ? ['', '#b9a677', '#8db2a6', '#a499ba', '#78a29e', '#c69777', '#a8ae79', '#8eacc0'][v] : '#172a30';
                c.fillRect(i % 10 * 30 + 1, Math.floor(i / 10) * 30 + 1, 28, 28);
            });
            p.feedback.textContent = '清除 ' + g.lines + ' / ' + g.target + ' 行 · 下一个 ' + ['长条', '方形', 'T', 'S', 'Z', 'J', 'L'][g.bag.at(-1) ?? 0];
        }
        if (g.kind === 'jump') {
            c.fillStyle = '#788c80';
            c.fillRect(40, 210, 90, 70);
            const x = 80 + g.distance;
            c.fillRect(x - g.width / 2, 210, g.width, 70);
            c.fillStyle = '#dfc694';
            c.fillRect(70, 173, 22, 37);
            c.fillStyle = '#2d4146';
            c.fillRect(50, 35, 470, 16);
            c.fillStyle = '#ccb575';
            c.fillRect(50, 35, g.charge / 1.5 * 470, 16);
            c.strokeStyle = '#d3c4a1';
            const target = (g.distance - 100) / 270 * 470 + 50;
            c.beginPath();
            c.moveTo(target, 27);
            c.lineTo(target, 58);
            c.stroke();
            c.fillStyle = '#d3c4a1';
            c.font = '16px sans-serif';
            c.fillText('跃迁距离 ' + Math.round(100 + g.charge * 180) + ' · 目标 ' + Math.round(g.distance), 50, 84);
            p.feedback.textContent = g.last + ' · 平台 ' + g.progress + '/' + g.target + ' · 保护 ' + g.lives;
        }
        if (g.kind === 'parkour') {
            c.strokeStyle = '#5b6d6d';
            for (let i = 0; i < 4; i++) {
                c.beginPath();
                c.moveTo(180 + i * 80, 0);
                c.lineTo(i * 200, 300);
                c.stroke();
            }
            for (const o of g.obstacles) {
                const x = 100 + o.lane * 200, y = o.z * 265;
                c.fillStyle = ['#b6a474', '#88a8ac', '#806764'][o.kind];
                c.fillRect(x - 32, y - 12, 64, o.kind === 1 ? 10 : 28);
                c.fillStyle = '#162025';
                c.font = '14px sans-serif';
                c.fillText(['低栏', '横梁', '箱体'][o.kind], x - 15, y + 5);
            }
            c.fillStyle = '#d4c8a2';
            c.fillRect(89 + g.lane * 200, 250 - (g.jump ? 35 : 0), 22, g.slide ? 10 : 28);
            p.feedback.textContent = '通过 ' + g.passed + ' / ' + g.target + ' · 保护 ' + g.lives;
        }
    };
    a.newKey = function (p, code) {
        const g = p.classic;
        if (!own(g) || !p.started || p.result) return false;
        if (g.kind === 'tetris') {
            const action = {
                ArrowLeft: 'left',
                ArrowRight: 'right',
                ArrowDown: 'down',
                ArrowUp: 'rotate',
                Space: 'drop'
            }[code];
            if (!action) return false;
            MoonArcade.tetrisMove(g, action);
            a.drawNew(p);
            done(p);
            return true;
        }
        if (g.kind === 'huarong') {
            const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(code);
            if (d < 0) return false;
            MoonArcade.slide(g, d);
            p.render();
            done(p);
            return true;
        }
        if (g.kind === 'jump' && code === 'Space') {
            if (!g.holding && !g.flight) {
                g.holding = true;
                g.charge = 0;
            }
            return true;
        }
        if (g.kind === 'parkour') {
            if (code === 'ArrowLeft') g.lane = Math.max(0, g.lane - 1); else if (code === 'ArrowRight') g.lane = Math.min(2, g.lane + 1); else if (code === 'Space' && !g.jump && !g.slide) g.jump = .9; else if (code === 'ArrowDown' && !g.slide && !g.jump) g.slide = .9; else return false;
            a.drawNew(p);
            return true;
        }
        return false;
    };
    a.expandedKey = function (p, code) {
        return this.newKey(p, code) || base.key.call(this, p, code);
    };
    a.newRelease = function (p, code) {
        if (p.classic?.kind === 'jump' && p.started && !p.result && code === 'Space') {
            MoonArcade.jumpRelease(p.classic);
            this.drawNew(p);
            done(p);
        }
    };
    a.tick = function (p, dt) {
        if (!own(p.classic)) return base.tick.call(this, p, dt);
        const changed = MoonArcade.tick(p.classic, dt);
        if (changed) {
            if (['memory', 'match3', 'link'].includes(p.classic.kind)) p.render(); else this.drawNew(p);
        }
        done(p);
    };
    a.reveal = function (p) {
        if (!own(p.classic)) return base.reveal.call(this, p);
        const g = p.classic;
        if (g.kind === 'mines' && !g.armed) MoonArcade.mineClick(g, 0);
        const el = document.createElement('div');
        el.className = 'classic-solution';
        el.textContent = ['wordle', 'number-wordle'].includes(g.kind) ? '正确结果：' + g.answer : g.kind === 'mines' ? '所有危险点已标注，辅助程序完成剩余排查。' : g.kind === 'huarong' ? '辅助机械臂移开边柜，从底部中央撤出主舱。先用小箱轮换空位，再移长柜。' : names[g.kind] + '：保护程序接管剩余步骤，任务资料保留。可以按 R 重新挑战。';
        if (g.kind === 'mines') {
            const grid = document.createElement('div');
            grid.className = 'arcade-board arcade-mines';
            grid.style.setProperty('--cols', g.w);
            g.cells.forEach(c => {
                const cell = document.createElement('span');
                cell.textContent = c.mine ? '✹' : c.n || '·';
                grid.append(cell);
            });
            el.append(grid);
        }
        p.controls.append(el);
    };
    globalThis.MoonArcadeGuide = {names, rules};
})();