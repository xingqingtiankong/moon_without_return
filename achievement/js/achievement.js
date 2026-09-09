"use strict";
(function () {
    const records = MoonEndings.load(), root = document.querySelector('.achievement-panel');
    root.innerHTML = '<h2>结局勋章</h2><p class="medal-count"></p><div class="medal-gallery"></div>';
    root.querySelector('.medal-count').textContent = Object.keys(records).filter(id => MoonEndings.entries[id]).length + ' / ' + Object.keys(MoonEndings.entries).length + ' · 跨存档保留';
    const gallery = root.querySelector('.medal-gallery');
    for (const e of Object.values(MoonEndings.entries)) {
        const card = document.createElement('article'), open = !!records[e.id];
        card.className = 'medal-card' + (open ? '' : ' locked');
        card.innerHTML = MoonEndings.medal(e.id, !open);
        const title = document.createElement('h3');
        title.textContent = e.title;
        const p = document.createElement('p');
        p.textContent = e.medal + ' · ' + (open ? '已获得' : '未获得');
        const details = document.createElement('details'), summary = document.createElement('summary'),
            body = document.createElement('p');
        summary.textContent = open ? '结局记录' : '查看内容（含剧透）';
        body.textContent = e.intro + ' ' + e.text;
        details.append(summary, body);
        card.append(title, p, details);
        gallery.append(card);
    }
    document.body.dataset.achievementCount = Object.keys(records).length;
    MoonSystem.initializeSystemClock();
    MoonSystem.bindBackButton();
    MoonSystem.bindEscapeToMain();
})();