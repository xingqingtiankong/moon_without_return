"use strict";

class MoonPuzzles {
    constructor(root, onFinish) {
        this.root = root;
        this.onFinish = onFinish;
        this.running = false;
        this.started = false;
        this.sequence = [0, 1, 2, 1, 0, 2, 3, 2, 1, 0, 1, 3, 2, 1, 0, 0];
    }

    open(info, {seed, difficulty} = {}) {
        this.info = info;
        this.difficulty = difficulty || MoonStorage.loadSettings().difficulty;
        this.seed = seed ?? Math.floor(Math.random() * 4294967296);
        this.configureDifficulty();
        this.tutorialState = {playing: false, time: 0};
        this.introPhase = "rules";
        this.workshopStep = 0;
        this.workshopAuto = false;
        this.demoSnapshots = null;
        this.running = true;
        this.started = false;
        this.arm = null;
        this.gauge = null;
        this.board = null;
        this.stage = 0;
        this.time = 0;
        this.elapsed = 0;
        this.remaining = info.game === 'oxygen' ? 240 : info.game === 'interface' ? 45 : 32;
        this.inspected = new Set();
        this.branch = null;
        this.pipes = [2, 2, 2];
        this.channels = [0, 0, 0];
        this.stray = 0;
        this.demoNote = -1;
        this.hits = new Set();
        this.misses = new Set();
        this.result = null;
        this.resultTime = 0;
        this.message = '';
        this.codes = null;
        this.total = MoonActivities.descriptions[info.game] ? MoonClassic.levels[this.difficulty].time : 2 + this.sequence.length * this.noteStep + 4;
        this.remaining = this.total;
        this.scoring = new MoonPuzzleScore(info.game.startsWith('piano'));
        this.untimed = false;
        MoonActivities.reset(this);
        this.render();
    }

    retry() {
        if (!this.running) return false;
        const {info, seed, difficulty} = this;
        const started = this.started;
        this.open(info, {seed, difficulty});
        this.message = '重新挑战 · 本局计时与成绩已重置';
        this.started = started;
        this.render();
        return true;
    }

    button(text, handler, parent = this.controls) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', () => {
            MoonSound.unlock();
            handler();
        });
        parent.append(b);
        return b;
    }

    render() {
        this.gauge = null;
        this.board = null;
        const r = this.root, scroll = r.scrollTop;
        r.replaceChildren();
        r.classList.add('puzzle-content');
        r.dataset.workshop = ['water', 'lamp', 'soil-check', 'model-check', 'piano', 'piano-practice'].includes(this.info.game) ? 'home' : 'base';
        r.dataset.activity = this.info.game;
        r.dataset.phase = !this.started ? 'intro' : this.result ? 'result' : 'play';
        this.heading = document.createElement('h2');
        this.heading.textContent = this.info.title;
        r.append(this.heading);
        this.timer = document.createElement('p');
        r.append(this.timer);
        this.description = document.createElement('p');
        this.description.className = 'puzzle-description';
        r.append(this.description);
        this.controls = document.createElement('div');
        this.controls.className = 'puzzle-controls';
        r.append(this.controls);
        this.feedback = document.createElement('p');
        this.feedback.setAttribute('aria-live', 'polite');
        this.feedback.textContent = this.message;
        r.append(this.feedback);
        this.scoreLabel = document.createElement('div');
        this.scoreLabel.className = 'puzzle-scorebar';
        r.insertBefore(this.scoreLabel, this.description);
        this.updateScore();
        if (!this.started) {
            this.description.textContent = MoonActivities.descriptions[this.info.game] || '跟随音符到达判定线的节拍演奏。';
            MoonTutorials.render(this);
            if (this.introPhase === 'rules') {
                this.renderDifficulty();
                if (this.classic) this.button('换一组布局', () => {
                    this.seed = Math.floor(Math.random() * 4294967296);
                    MoonActivities.reset(this);
                    this.render();
                });
                this.button('下一步：观看演示', () => {
                    this.introPhase = 'demo';
                    this.workshopStep = 0;
                    this.workshopAuto = false;
                    this.demoSnapshots = null;
                    this.render();
                });
            } else {
                this.button('返回规则', () => {
                    this.introPhase = 'rules';
                    this.workshopAuto = false;
                    this.render();
                });
                this.button('准备好了，开始', () => this.startFullscreen());
            }
            return;
        }
        if (this.started && !this.result) {
            const step = document.createElement('p');
            step.className = 'workshop-playing';
            step.textContent = '讲解规则 ✓　→　分步演示 ✓　→　③ 正式游戏';
            this.controls.append(step);
        }
        if (this.result) {
            this.description.textContent = this.result.success ? '完成。' : '本次未完成，下面显示正确结果。';
            this.renderScoreResult();
            return;
        }
        if (this.info.game === 'oxygen') this.renderOxygen(); else if (this.info.game === 'interface') this.renderInterface(); else if (MoonActivities.descriptions[this.info.game]) MoonActivities.render(this); else this.renderPiano();
    }

    configureDifficulty() {
        const tier = ['easy', 'normal', 'hard'].indexOf(this.difficulty);
        this.noteStep = [1.5, 1.2, .85][tier < 0 ? 1 : tier];
        this.hitWindow = [.5, .4, .28][tier < 0 ? 1 : tier];
    }

    renderDifficulty() {
        const group = document.createElement('div');
        group.className = 'difficulty-options';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', '游戏难度');
        this.controls.append(group);
        for (const [key, level] of Object.entries(MoonClassic.levels)) {
            const button = this.button(level.label, () => {
                this.difficulty = key;
                this.configureDifficulty();
                const settings = MoonStorage.loadSettings();
                settings.difficulty = key;
                const saved = MoonStorage.saveSettings(settings);
                this.total = this.classic ? level.time : 2 + this.sequence.length * this.noteStep + 4;
                this.remaining = this.total;
                MoonActivities.reset(this);
                this.message = saved ? '难度已保存，剧情与线索不变。' : '本局难度已调整，但浏览器未能保存。';
                this.render();
            }, group);
            button.setAttribute('aria-pressed', key === this.difficulty);
            button.insertAdjacentHTML('beforeend', '<small>' + level.detail + '</small>');
        }
        const hint = document.createElement('p');
        hint.className = 'difficulty-hint';
        hint.textContent = '当前：' + MoonClassic.levels[this.difficulty].label + ' · ' + Math.ceil(this.total) + ' 秒' + (this.info.game.startsWith('piano') ? ' · 音符间隔 ' + this.noteStep + ' 秒 / 判定 ±' + this.hitWindow + ' 秒' : ' · 开始后计时，失败可查看结果并继续剧情');
        this.controls.append(hint);
    }

    renderOxygen() {
        MoonActivities.render(this);
    }

    renderInterface() {
        MoonActivities.render(this);
    }

    renderPiano() {
        const bindings = MoonStorage.loadSettings().bindings.minigame;
        this.codes = [1, 2, 3, 4].map(i => bindings['rhythmLane' + i]);
        this.description.textContent = '音符到达横线时演奏。每个音只判定一次。';
        this.board = document.createElement('div');
        this.board.className = 'piano-board';
        this.controls.append(this.board);
        this.sequence.forEach((lane, i) => {
            const note = document.createElement('i');
            note.dataset.note = i;
            note.style.left = `${lane * 25 + 10}%`;
            this.board.append(note);
        });
        this.board.insertAdjacentHTML('beforeend', '<span class="piano-hit-line"></span>');
        const keys = document.createElement('div');
        keys.className = 'piano-keys';
        this.controls.append(keys);
        this.codes.forEach((code, i) => this.button(MoonStorage.keyLabel(code), () => this.hit(i), keys));
    }

    hit(lane) {
        if (!this.running || !this.started || this.result || !this.info.game.startsWith('piano')) return;
        MoonSound.note(lane);
        let nearest = -1, delta = Infinity;
        this.sequence.forEach((v, i) => {
            const d = Math.abs(this.time - (2 + i * this.noteStep));
            if (v === lane && !this.hits.has(i) && !this.misses.has(i) && d < delta) {
                delta = d;
                nearest = i;
            }
        });
        if (nearest >= 0 && delta <= this.hitWindow) {
            this.hits.add(nearest);
            this.feedback.textContent = this.scoring.hit(delta * .4 / this.hitWindow) + ' · 连击 ' + this.scoring.combo;
            this.updateScore();
        } else {
            this.stray++;
            this.scoring.mistake();
            this.updateScore();
            this.feedback.textContent = '跟随节拍，等音符到达横线。';
        }
    }

    key(code) {
        if (!this.running || !this.started || this.result) return;
        if (MoonActivities.expandedKey(this, code)) return;
        if (this.codes?.includes(code)) this.hit(this.codes.indexOf(code));
        if (this.classic?.kind === 'sokoban') {
            const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(code);
            if (d >= 0) MoonActivities.move(this, d);
        }
    }

    finish(success) {
        if (this.result) return;
        this.pouring = false;
        this.result = this.scoring.finish(success, this.remaining, this.total);
        this.resultTime = 0;
        this.render();
    }

    tick(dt) {
        if (!this.running) return;
        if (!this.started) {
            MoonTutorials.tick(this, dt);
            return;
        }
        if (this.result) {
            this.resultTime += dt;
            if (!this.result.success && this.info.game === 'piano-practice') {
                const i = Math.floor(this.resultTime / .3);
                if (i < this.sequence.length && i !== this.demoNote) {
                    this.demoNote = i;
                    MoonSound.note(this.sequence[i]);
                    this.feedback.textContent = '正确旋律示范 · ' + (i + 1) + ' / ' + this.sequence.length;
                }
            }
            if (this.resultTime > (this.result.success ? 1.2 : this.info.game === 'piano-practice' ? 5.2 : 4.2)) {
                this.continueButton.disabled = false;
            }
            return;
        }
        this.time += dt;
        if (!this.untimed) this.remaining -= dt;
        this.updateScore();
        if (MoonActivities.descriptions[this.info.game]) MoonActivities.tick(this, dt);
        if (this.result) return;
        this.timer.textContent = this.untimed ? `不计时 · ${this.classic?.moves || 0} 步` : `剩余 ${Math.max(0, Math.ceil(this.remaining))} 秒`;
        if (this.gauge && this.info.game === 'oxygen') this.gauge.querySelector('i').style.left = `${(50 + 45 * Math.sin(this.time * 1.2))}%`;
        if (this.info.game.startsWith('piano')) {
            this.sequence.forEach((lane, i) => {
                const beat = 2 + i * this.noteStep, note = this.board.querySelector(`[data-note="${i}"]`);
                note.style.top = `calc(${(this.time - beat + 2) / 2 * 80}% - 7.5px)`;
                note.hidden = this.hits.has(i) || this.time > beat + this.hitWindow || this.time < beat - 2;
                if (this.time > beat + this.hitWindow && !this.hits.has(i) && !this.misses.has(i)) {
                    this.misses.add(i);
                    this.scoring.mistake(true);
                    this.feedback.textContent = 'Miss · 漏音';
                    this.feedback.dataset.judgment = 'Miss';
                }
            });
            if (this.info.game === 'piano-practice') {
                const i = this.sequence.findIndex((_, i) => 2 + i * this.noteStep > this.time);
                this.description.textContent = i < 0 ? '保持节拍' : `下一音：${MoonStorage.keyLabel(this.codes[this.sequence[i]])}`;
            }
            if (this.time > 2 + (this.sequence.length - 1) * this.noteStep + .6) this.finish(this.hits.size === this.sequence.length && this.stray === 0);
        } else if (!this.untimed && this.remaining <= 0) this.finish(false);
    }

    async startFullscreen() {
        if (this.started || !this.running) return;
        this.started = true;
        this.render();
        const screen = document.getElementById('minigame');
        if (!document.fullscreenElement && screen?.requestFullscreen) {
            try {
                await screen.requestFullscreen();
                this.ownsFullscreen = true;
                if (!this.running) this.leaveFullscreen();
            } catch {
            }
        }
    }

    leaveFullscreen() {
        if (this.ownsFullscreen) {
            this.ownsFullscreen = false;
            if (document.fullscreenElement?.id === 'minigame') document.exitFullscreen?.().catch(() => {
            });
        }
    }

    updateScore() {
        if (this.scoreLabel) this.scoreLabel.textContent = (this.result?.score ?? this.scoring.score) + ' / 1000 分 · ' + (this.scoring.piano ? '连击 ' + this.scoring.combo + ' / 最高 ' + this.scoring.maxCombo : '失误 ' + this.scoring.errors + ' 次');
    }

    wrong(message) {
        this.scoring.mistake();
        this.message = message;
        this.feedback.textContent = message;
        this.updateScore();
        MoonSound.noise(.08, .008);
    }

    renderScoreResult() {
        const r = this.result;
        if (!r.success && this.classic) MoonActivities.reveal(this);
        const box = document.createElement('div');
        box.className = 'puzzle-result';
        box.innerHTML = '<b>' + r.grade + '</b><strong>' + r.score + ' / 1000</strong><span>准确率 ' + r.accuracy + '% · 失误 ' + r.errors + (this.scoring.piano ? ' · 漏音 ' + r.misses + '</span><span>最高连击 ' + r.combo : '</span><span>用时 ' + Math.round(this.time) + ' 秒') + '</span>';
        this.controls.append(box);
        this.continueButton = this.button('继续剧情', () => this.confirm());
        this.continueButton.disabled = r.assisted || (!r.success && this.info.game === 'piano-practice');
    }

    confirm() {
        if (!this.running || !this.result || this.continueButton.disabled) return false;
        this.running = false;
        this.leaveFullscreen();
        this.onFinish(this.info.node, this.result);
        return true;
    }

    abort() {
        this.running = false;
        this.started = false;
        this.pouring = false;
        this.leaveFullscreen();
    }
}

globalThis.MoonPuzzles = MoonPuzzles;