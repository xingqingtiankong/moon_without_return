"use strict";
(function () {
    let active = null;
    const layer = document.createElement('section');
    layer.id = 'final-form';
    layer.className = 'overlay ui-layer';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.innerHTML = '<div class="panel-large final-form-panel"><header class="panel-heading"><h1 id="final-form-title"></h1><button type="button" data-close="final-form">关闭</button></header><p class="form-context"></p><div class="final-form-content"></div><p class="form-feedback" role="status"></p></div>';
    document.getElementById('map-game').append(layer);
    layer.setAttribute('aria-labelledby', 'final-form-title');
    const root = layer.querySelector('.final-form-content'), feedback = layer.querySelector('.form-feedback');

    function open(def, state, complete) {
        active = {def, state, complete, holding: false, held: 0, draft: null};
        root.replaceChildren();
        feedback.textContent = '';
        layer.querySelector('h1').textContent = def.title;
        layer.querySelector('.form-context').textContent = 'APPLICANT: CURRENT OPERATOR / ' + MoonFinal.name(state);
        const b = (text, fn) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.textContent = text;
            el.addEventListener('click', fn);
            root.append(el);
            return el;
        };
        if (def.form === 'name') {
            const label = document.createElement('label'), input = document.createElement('input');
            label.textContent = '新姓名 · 1—12个字符';
            input.type = 'text';
            input.maxLength = 36;
            input.value = state.flags.player_name || '';
            input.autocomplete = 'off';
            input.setAttribute('aria-label', '当前操作员新姓名');
            label.append(input);
            root.append(label);
            const confirm = b('核对姓名', () => {
                const error = MoonFinal.validName(input.value);
                if (error) {
                    feedback.textContent = error;
                    return;
                }
                const value = input.value.trim().normalize('NFC');
                if (active.draft !== value) {
                    active.draft = value;
                    feedback.textContent = '登记预览：' + value + ' · CURRENT OPERATOR。确认前仍可修改。';
                    confirm.textContent = '确认登记';
                    return;
                }
                finish({player_name: value});
            });
            input.addEventListener('input', () => {
                if (active) {
                    active.draft = null;
                    confirm.textContent = '核对姓名';
                }
            });
        } else if (def.form === 'classification') {
            layer.querySelector('.form-context').textContent = '按阿芷本人声明登记转移类别。';
            const conflicts = {
                SPOUSE: '配偶绑定已解除。',
                FAMILY: '本人未授权家庭归属。',
                'RESEARCH DATA': '本人拒绝作为研究数据转移。'
            };
            for (const v of ['SPOUSE', 'FAMILY', 'RESEARCH DATA', 'INDEPENDENT PASSENGER']) b(v, () => {
                if (conflicts[v]) feedback.textContent = conflicts[v]; else finish({});
            });
        } else {
            const context = document.createElement('p');
            context.textContent = def.formText;
            root.append(context);
            const hold = b('按住 ' + def.holdSeconds + ' 秒提交', () => {
            });
            hold.className = 'final-hold';
            active.button = hold;
            hold.addEventListener('pointerdown', e => {
                e.preventDefault();
                hold.setPointerCapture(e.pointerId);
                if (active) {
                    active.holding = true;
                    active.held = 0;
                }
            });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(v => hold.addEventListener(v, release));
            hold.addEventListener('keydown', e => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (!e.repeat && active) active.holding = true;
                }
            });
            hold.addEventListener('keyup', e => {
                if (e.code === 'Space') release();
            });
        }
    }

    function release() {
        if (active) {
            active.holding = false;
            active.held = 0;
            if (active.button) active.button.textContent = '按住 ' + active.def.holdSeconds + ' 秒提交';
        }
    }

    function tick(dt) {
        if (!active?.holding) return;
        active.held += dt;
        active.button.textContent = '保持 ' + Math.min(active.def.holdSeconds, active.held).toFixed(1) + ' / ' + active.def.holdSeconds + ' 秒';
        if (active.held >= active.def.holdSeconds) finish({});
    }

    function finish(flags) {
        if (!active) return;
        const cb = active.complete;
        active = null;
        cb(flags);
    }

    window.addEventListener('blur', release);
    globalThis.MoonFinalForms = {open, tick, release, abort: () => active = null};
})();