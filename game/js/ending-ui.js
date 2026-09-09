"use strict";
(function () {
    function gallery(root) {
        const unlocked = MoonEndings.load();
        root.replaceChildren();
        for (const e of Object.values(MoonEndings.entries)) {
            const card = document.createElement('article'), open = !!unlocked[e.id];
            card.className = 'medal-card' + (open ? '' : ' locked');
            card.innerHTML = MoonEndings.medal(e.id, !open);
            const title = document.createElement('h3');
            title.textContent = e.title;
            const label = document.createElement('p');
            label.textContent = e.medal + ' · ' + (open ? '已获得' : '未获得');
            card.append(title, label);
            const details = document.createElement('details'), summary = document.createElement('summary');
            summary.textContent = open ? '查看结局记录' : '查看内容（含剧透）';
            const text = document.createElement('p');
            text.textContent = e.intro + ' ' + e.text;
            details.append(summary, text);
            card.append(details);
            root.append(card);
        }
    }

    const panel = document.createElement('section');
    panel.className = 'overlay ui-layer achievement-overlay';
    panel.id = 'achievements';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.innerHTML = '<div class="panel-large"><header><h1>结局勋章</h1><button data-close="achievements">返回游戏</button></header><p>每个结局一枚独立勋章。跨存档保留，重新开始不会清空。</p><div class="medal-gallery"></div></div>';
    document.getElementById('map-game').append(panel);
    const button = document.createElement('button');
    button.textContent = '结局与成就';
    button.addEventListener('click', () => {
        gallery(panel.querySelector('.medal-gallery'));
        openOverlay('achievements');
    });
    document.querySelector('.pause-panel').append(button);
    panel.querySelector('button').addEventListener('click', () => closeOverlay('achievements'));
    window.addEventListener('moon:ending-visible', e => {
        const s = e.detail, entry = MoonEndings.entries[s.flags.ending], root = document.querySelector('.ending-panel');
        root.querySelector('.ending-medal')?.remove();
        const badge = document.createElement('div');
        badge.className = 'ending-medal';
        badge.innerHTML = MoonEndings.medal(entry.id);
        const text = document.createElement('p');
        text.textContent = '成就勋章 · ' + entry.medal;
        badge.append(text);
        root.prepend(badge);
        MoonEndings.unlock([entry.id, ...(s.flags.ending_overlays || '').split(',')]);
    });
    window.addEventListener('moon:achievement-unlocked', e => {
        const toast = document.createElement('div');
        toast.className = 'medal-toast';
        toast.textContent = '获得勋章：' + e.detail.map(id => MoonEndings.entries[id].medal).join('、');
        document.body.append(toast);
        setTimeout(() => toast.remove(), 4500);
    });
})();