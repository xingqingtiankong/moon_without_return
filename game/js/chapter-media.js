"use strict";
(function () {
    let active = null;
    const captions = ['爸——如果这份录像还能被找到，我已经二十四岁了。', '家里的那架琴还在。妈有时会擦，但她很久没再问你哪天回来。', '她说，人不能一直过等待的日子。我以前听不懂，现在大概懂一点了。', '我不知道基地里还有没有人。如果有，请告诉我们发生了什么。', '这不是催你再说一次等我回来。我们需要知道，那里还有谁。'];

    function open(node, finish) {
        const root = document.getElementById('chapter-media');
        root.querySelector('.media-subtitle').textContent = '文件时间：十六年前 · 人物年龄记录：24 · 旧缓存，非实时连接';
        const screen = root.querySelector('.received-screen');
        screen.classList.remove('playing');
        screen.querySelector('.received-caption').textContent = '影像待播放';
        const button = root.querySelector('.media-hold');
        button.hidden = false;
        button.textContent = '按住 2 秒，播放旧影像';
        active = {node, finish, hold: 0, holding: false, playing: false, time: 0};
    }

    function holding(value) {
        if (!active || active.playing) return;
        active.holding = value;
        if (!value) {
            active.hold = 0;
            document.querySelector('.media-hold').textContent = '按住 2 秒，播放旧影像';
        }
    }

    function tick(dt) {
        if (!active) return;
        const root = document.getElementById('chapter-media');
        if (!active.playing) {
            if (active.holding) {
                active.hold += dt;
                root.querySelector('.media-hold').textContent = '确认播放 ' + Math.min(2, active.hold).toFixed(1) + ' / 2 秒';
                if (active.hold >= 2) {
                    active.playing = true;
                    root.querySelector('.media-hold').hidden = true;
                    root.querySelector('.received-screen').classList.add('playing');
                }
            }
            return;
        }
        active.time += dt;
        const i = Math.min(captions.length - 1, Math.floor(active.time / 4.5));
        root.querySelector('.received-caption').textContent = captions[i];
        root.querySelector('.media-progress').textContent = Math.min(23, Math.floor(active.time)) + ' / 23 秒';
        if (active.time >= 23) {
            const done = active.finish;
            active = null;
            done();
        }
    }

    function skip() {
        if (!active) return false;
        const done = active.finish;
        active = null;
        done();
        return true;
    }

    function initialize() {
        const layer = document.createElement('section');
        layer.id = 'chapter-media';
        layer.className = 'overlay ui-layer';
        layer.hidden = true;
        layer.setAttribute('role', 'dialog');
        layer.setAttribute('aria-modal', 'true');
        layer.setAttribute('aria-label', '成年小星旧影像');
        layer.innerHTML = '<div class="panel-large media-panel"><header class="panel-heading"><h1>接收缓存 · 小星</h1><button type="button" data-close="chapter-media">关闭</button></header><p class="media-subtitle"></p><div class="received-screen"><svg viewBox="0 0 600 300" aria-hidden="true"><path d="M0 0H600V300H0Z" fill="#19262c"/><path d="M42 0V300M487 0V300" stroke="#394846" stroke-width="10"/><path d="M178 300V230Q185 188 298 188Q415 189 424 230V300" fill="#737c73"/><path d="M280 175H320V212H280Z" fill="#b1a28d"/><ellipse cx="300" cy="123" rx="58" ry="75" fill="#c1b09a"/><path d="M242 120Q221 50 278 39Q345 19 360 86L352 115L331 76L259 91Z" fill="#343c3c"/><path d="M264 124h20M315 124h20M290 163h22" stroke="#53514a" stroke-width="4"/><path d="M252 216L297 252L346 215M299 250V300" fill="none" stroke="#a9b0a1" stroke-width="5"/></svg><span class="received-noise"></span><p class="received-caption" aria-live="polite"></p><small>缓存影像复原 · 缺损音轨以字幕呈现</small></div><p class="media-progress"></p><button class="media-hold" type="button">按住 2 秒，播放旧影像</button><button class="media-skip" type="button">跳过影像 ▸▸</button></div>';
        document.getElementById('map-game').append(layer);
        layer.querySelector('.media-skip').addEventListener('click', skip);
        const b = layer.querySelector('.media-hold');
        b.addEventListener('pointerdown', e => {
            e.preventDefault();
            b.setPointerCapture(e.pointerId);
            holding(true);
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => b.addEventListener(type, () => holding(false)));
        b.addEventListener('keydown', e => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!e.repeat) holding(true);
            }
        });
        b.addEventListener('keyup', e => {
            if (['Space', 'Enter'].includes(e.code)) {
                e.preventDefault();
                holding(false);
            }
        });
        window.addEventListener('blur', () => holding(false));
    }

    initialize();
    globalThis.MoonChapterMedia = Object.freeze({
        open, tick, skip, abort: () => active = null, get state() {
            return active ? {
                holding: active.holding,
                playing: active.playing,
                time: active.time,
                hold: active.hold
            } : null;
        }
    });
})();