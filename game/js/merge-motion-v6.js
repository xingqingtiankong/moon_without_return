"use strict";
(function () {
    const a = MoonActivities, render = a.render;
    a.render = function (p) {
        render.call(this, p);
        const g = p.classic;
        if (g?.kind !== 'merge' || !g.tileMotions?.length) return;
        const root = p.controls.querySelector('.expanded-merge'), tiles = [...root.querySelectorAll('.energy-cell')],
            rect = root.getBoundingClientRect();
        for (const m of g.tileMotions) {
            if (m.from === m.to) continue;
            const from = tiles[m.from].getBoundingClientRect(), to = tiles[m.to].getBoundingClientRect(),
                ghost = document.createElement('div');
            ghost.className = 'energy-cell tile-flight';
            ghost.textContent = m.value;
            ghost.dataset.power = m.value;
            ghost.style.cssText = 'left:' + (from.left - rect.left) + 'px;top:' + (from.top - rect.top) + 'px;width:' + from.width + 'px;height:' + from.height + 'px';
            root.append(ghost);
            ghost.animate([{
                transform: 'translate(0,0)',
                opacity: 1
            }, {
                transform: 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px)',
                opacity: .8
            }], {duration: 190, easing: 'ease-out'}).finished.finally(() => ghost.remove());
        }
        tiles[g.lastSpawn]?.animate([{scale: '.2', opacity: 0}, {scale: '1', opacity: 1}], {duration: 230, delay: 160});
        g.tileMotions = null;
    };
})();