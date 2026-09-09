"use strict";
(function () {
    const a = MoonActivities, proto = MoonPuzzles.prototype, reset = a.reset, render = a.render, tick = a.tick,
        key = proto.key, open = proto.open, scoreResult = proto.renderScoreResult;
    const symbols = ['☾', '✦', '☀', '◈', '♧', '△', '◉', '⚙', '▣', '◇', '⌘', '♜', '♞', '♟', '✚', '❖', '○', '□', '☆', '♤', '♢', '♣', '♠', '♥'];
    for (const d of Object.values(MoonCampaign.nodes)) {
        if (d.game === 'solitaire') {
            d.game = 'nonogram';
            d.title = '从扫描图像核验身份字段';
        }
        if (d.game === 'clip-order') {
            d.game = 'maze';
            d.title = '沿12号留下的痕迹复原检修路线';
        }
        if (d.game === 'anchors') {
            d.game = 'loop';
            d.title = '连接隔离回路，保护家庭空间与读取窗口';
        }
        d.targets?.forEach(t => {
            if (t.kind === 'campaign') t.label = d.title;
        });
    }
    a.reset = function (p) {
        const oldRemaining = p.remaining, wasStarted = p.started;
        reset.call(this, p);
        const g = p.classic;
        p.untimed = g?.kind === 'spider';
        if (p.untimed) p.total = 0; else if (g?.kind === 'sudoku' && p.difficulty === 'hard') p.total = 500; else if (g?.kind === 'logic-grid' && p.difficulty === 'hard') p.total = MoonClassic.levels.hard.time + 60; else if (g?.kind === 'nonogram' && p.difficulty === 'hard') p.total = MoonClassic.levels.hard.time + 120; else if (g?.kind?.includes('maze') && p.difficulty === 'hard') p.total = 360;
        if (g?.kind === 'memory') {
            g.maxMistakes = [14, 18, 22][g.tier];
            g.flips = 0;
            g.mismatches = 0;
            g.attempts = 0;
        }
        if (g?.kind === 'runner' && p.difficulty === 'hard') {
            g.speed = 230;
            g.target = 18;
        }
        p.remaining = wasStarted && !p.untimed ? oldRemaining : p.total;
        p.motionCache = null;
        p.memoryFaces = null;
        p.pipeMasks = null;
    };
    proto.configureDifficulty = function () {
        const tier = ['easy', 'normal', 'hard'].indexOf(this.difficulty);
        this.noteStep = [1.05, .78, .52][tier];
        this.hitWindow = [.28, .23, .2][tier];
        this.lanes = tier === 2 ? 8 : 4;
        this.sequence = tier === 2 ? [0, 2, 4, 6, 1, 3, 5, 7, 2, 5, 1, 6, 0, 4, 3, 7, 7, 5, 3, 1, 6, 4, 2, 0, 3, 6, 2, 5, 1, 7, 0, 4] : [0, 1, 2, 1, 0, 2, 3, 2, 1, 0, 1, 3, 2, 1, 0, 0];
    };
    delete a.descriptions.solitaire;

    proto.key = function (code) {
        if (document.activeElement?.matches('input,textarea,[contenteditable="true"]')) return;
        if (['runner', 'flier', 'parkour', 'jump'].includes(this.classic?.kind) && code === 'KeyW') code = 'Space';
        if (!this.info.game.startsWith('piano')) code = ({
            KeyW: 'ArrowUp',
            KeyA: 'ArrowLeft',
            KeyS: 'ArrowDown',
            KeyD: 'ArrowRight'
        })[code] || code;
        return key.call(this, code);
    };
    proto.updateScore = function () {
        if (!this.scoreLabel) return;
        if (this.result) {
            this.scoreLabel.textContent = this.result.grade + ' · ' + this.result.score + ' / 1000 分';
            return;
        }
        const g = this.classic;
        if (this.info.game.startsWith('piano')) this.scoreLabel.textContent = 'Perfect ' + (this.scoring.perfect || 0) + ' · Great ' + (this.scoring.great || 0) + ' · Good ' + (this.scoring.good || 0) + ' · 连击 ' + this.scoring.combo; else if (g?.kind === 'memory') this.scoreLabel.textContent = '翻牌 ' + g.flips + ' 次 · 失配 ' + g.mismatches + ' / ' + g.maxMistakes; else if (g?.kind === 'spider') this.scoreLabel.textContent = '步数 ' + g.moves + ' · 收齐 ' + g.completed + ' / ' + g.target + ' 组'; else this.scoreLabel.textContent = '完成后评定成绩 · 失误 ' + this.scoring.errors + ' 次';
    };
    proto.finish = function (success, assisted = false) {
        if (this.result) return;
        this.pouring = false;
        this.result = MoonRating.evaluate(this, success, assisted);
        this.scoring.closed = true;
        this.resultTime = 0;
        this.render();
    };
    proto.renderScoreResult = function () {
        scoreResult.call(this);
        const box = document.createElement('div');
        box.className = 'rating-breakdown';
        const heading = document.createElement('strong');
        heading.textContent = this.result.category + ' · ' + ({
            easy: '轻松最高 A',
            normal: '普通最高 A+',
            hard: '困难最高 S+'
        })[this.difficulty];
        box.append(heading);
        for (const line of this.result.explanation || []) {
            const el = document.createElement('p');
            el.textContent = line;
            box.append(el);
        }
        this.controls.insertBefore(box, this.continueButton);
    };
    proto.renderPiano = function () {
        const bindings = MoonStorage.loadSettings().bindings.minigame;
        this.codes = this.lanes === 8 ? ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'] : [1, 2, 3, 4].map(i => bindings['rhythmLane' + i]);
        this.description.textContent = this.lanes + '轨演奏：音符到线按键。Perfect ±75ms，Great ±140ms，Good在判定窗口内。';
        this.board = document.createElement('div');
        this.board.className = 'piano-board';
        this.board.style.setProperty('--lanes', this.lanes);
        this.controls.append(this.board);
        this.sequence.forEach((lane, i) => {
            const note = document.createElement('i');
            note.dataset.note = i;
            note.style.left = (lane + .2) * 100 / this.lanes + '%';
            note.style.width = 60 / this.lanes + '%';
            this.board.append(note);
        });
        this.board.insertAdjacentHTML('beforeend', '<span class="piano-hit-line"></span>');
        const keys = document.createElement('div');
        keys.className = 'piano-keys';
        keys.style.gridTemplateColumns = 'repeat(' + this.lanes + ',1fr)';
        this.controls.append(keys);
        this.codes.forEach((code, i) => this.button(code === 'Semicolon' ? ';' : MoonStorage.keyLabel(code), () => this.hit(i), keys));
    };
    proto.hit = function (lane) {
        if (!this.running || !this.started || this.result || !this.info.game.startsWith('piano')) return;
        MoonSound.note(lane % 4);
        let nearest = -1, delta = Infinity;
        this.sequence.forEach((v, i) => {
            const d = Math.abs(this.time - (2 + i * this.noteStep));
            if (v === lane && !this.hits.has(i) && !this.misses.has(i) && d < delta) {
                delta = d;
                nearest = i;
            }
        });
        let word;
        if (nearest >= 0 && delta <= this.hitWindow) {
            this.hits.add(nearest);
            word = delta <= .075 ? 'Perfect' : delta <= .14 ? 'Great' : 'Good';
            const k = word.toLowerCase();
            this.scoring[k] = (this.scoring[k] || 0) + 1;
            this.scoring.combo++;
            this.scoring.maxCombo = Math.max(this.scoring.maxCombo, this.scoring.combo);
        } else {
            this.stray++;
            this.scoring.mistake();
            word = 'Miss';
        }
        this.feedback.textContent = word + ' · 连击 ' + this.scoring.combo;
        this.feedback.dataset.judgment = word;
        this.feedback.animate?.([{opacity: .4, scale: '1.12'}, {opacity: 1, scale: '1'}], {duration: 190});
        this.updateScore();
    };

    function linkTrace(p, root, g) {
        if (!g.path?.length) return;
        const tiles = [...root.querySelectorAll('.pair-cell')], rect = root.getBoundingClientRect(),
            first = tiles[0]?.getBoundingClientRect(), next = tiles[1]?.getBoundingClientRect(),
            down = tiles[g.w]?.getBoundingClientRect();
        if (!first) return;
        const dx = next.left - first.left, dy = down.top - first.top,
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('link-trace');
        svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
        const line = document.createElementNS(svg.namespaceURI, 'polyline');
        line.setAttribute('points', g.path.map(v => [first.left - rect.left + first.width / 2 + (v.x - 1) * dx, first.top - rect.top + first.height / 2 + (v.y - 1) * dy].join(',')).join(' '));
        svg.append(line);
        root.append(svg);
    }

    a.render = function (p) {
        render.call(this, p);
        const g = p.classic;
        if (!g) return;
        if (g.kind === 'memory') {
            const faces = [];
            p.controls.querySelectorAll('.pair-cell').forEach((el, i) => {
                const visible = g.face.includes(i) || g.matched.includes(i);
                el.textContent = visible ? symbols[g.cells[i] - 1] : '✥';
                el.dataset.symbol = visible ? 'face' : 'back';
                el.classList.toggle('face-up', visible);
                el.classList.toggle('face-down', !visible);
                if (p.memoryFaces && p.memoryFaces[i] !== visible) el.classList.add('flipping');
                faces.push(visible);
            });
            p.memoryFaces = faces;
        }
        if (g.kind === 'link') {
            const root = p.controls.querySelector('.arcade-link');
            p.controls.querySelectorAll('.pair-cell').forEach((el, i) => {
                el.textContent = g.cells[i] ? symbols[g.cells[i] - 1] : '';
                el.classList.remove('label-pair');
                el.removeAttribute('data-symbol');
            });
            linkTrace(p, root, g);
            if (p.info.node === 'E_MAP') p.feedback.textContent = '匹配相同认证图标 · 名称对应在通过后逐项核对。剩余 ' + g.remaining / 2 + ' 对';
        }
        if (g.kind === 'pipe') {
            const root = p.controls.querySelector('.classic-grid');
            p.controls.querySelectorAll('.pipe-tile small').forEach((el, i) => el.textContent = i ? '出口（右）' : '入口（左）');
            p.controls.querySelectorAll('.pipe-tile').forEach((el, i) => {
                el.dataset.mask = g.cells[i];
                if (p.pipeMasks && p.pipeMasks[i] !== g.cells[i]) el.querySelector('svg').animate?.([{rotate: '-90deg'}, {rotate: '0deg'}], {duration: 180});
            });
        }
        if (g.kind === 'pipe') p.pipeMasks = [...g.cells];
        if (g.kind === 'spider') {
            p.feedback.textContent += ' · 已用 ' + g.moves + ' 步（发牌、撤销均计步，不限时）';
        }
    };
    const renderP = proto.render;
    proto.render = function () {
        const scroll = this.root.scrollTop;
        renderP.call(this);
        this.root.scrollTop = scroll;
        if (this.result && this.info.game.startsWith('piano')) this.description.textContent = '演奏结束 · 本次按节奏准确率评价';
        if (this.untimed) {
            this.controls.querySelectorAll('.puzzle-result span').forEach(el => {
                if (el.textContent.startsWith('用时')) el.textContent = '总移动 ' + this.classic.moves + ' 步';
            });
            this.timer.textContent = '不计时 · 按有效移动、发牌与撤销步数评分';
            const hint = this.controls.querySelector('.difficulty-hint');
            if (hint) hint.textContent = '蜘蛛纸牌不设倒计时，难度改变需要收齐的牌组数量。';
        }
        if (this.started && !this.result) {
            const help = this.button('直接协助 · 跳过本局', () => {
                this.finish(false, true);
                this.continueButton.disabled = false;
                this.confirm();
            });
            help.className = 'direct-assist';
        }
        if (!this.started && this.introPhase === 'rules') {
            const el = document.createElement('p');
            el.className = 'control-note';
            el.textContent = '方向操作支持 WASD / 方向键；可拖动的棋子支持鼠标拖动。R 重试，协助完成不计成绩。';
            this.controls.append(el);
        }
    };
    MoonArcadeGuide.rules.memory.push('每两张翻牌算一次配对尝试。失配上限：轻松14次、普通18次、困难22次；达到上限则本局结束，可重试或协助。');
    MoonActivities.descriptions.memory = '翻开两张相同图案即可配对。背面无图案提示；失配会扣回，位置保持不变。失配上限：轻松14次／普通18次／困难22次。';
    MoonArcadeGuide.rules.link[2] = '消除后其余图案位置不变。棋盘保证可以逐对清空；连线可走外侧边缘。';
    MoonArcadeGuide.rules.spider.push('无倒计时。移动牌组、发一行牌、有效撤销各计一步；无效操作不增加步数。');
    const desc = '黄色：这个字母或数字存在，但当前位置不对；答案可能含重复项，需要结合其他格判断数量。黄色本身不表示一定有多个。';
    MoonArcadeGuide.rules.wordle[1] = desc;
    MoonArcadeGuide.rules['number-wordle'][1] = desc;
    MoonActivities.descriptions.wordle = '单词推断：绿色位置与字符都正确；' + desc + ' 灰色表示剩余数量不足。';
    MoonActivities.descriptions['number-wordle'] = '数字推断：允许重复数字。' + desc;
    globalThis.MoonPolishV6 = {symbols};
})();