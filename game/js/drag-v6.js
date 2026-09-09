"use strict";
(function () {
    let drag = null, suppress = 0, suppressInfo = null;
    const editable = el => el?.closest('input,textarea');
    const gridOf = el => el?.closest('.huarong-piece,.playing-card,.arcade-match3,.expanded-merge,.shikaku-cell,.nonogram-grid,.classic-sokoban,.classic-sliding');
    document.addEventListener('pointerdown', e => {
        if (e.button !== 0 || typeof puzzles === 'undefined' || !puzzles.running || !puzzles.started || puzzles.result || editable(e.target)) return;
        const hit = gridOf(e.target);
        if (!hit) return;
        const g = puzzles.classic, kind = g.kind, el = e.target.closest('button') || hit;
        drag = {kind, x: e.clientX, y: e.clientY, el, g, moved: false, paint: new Set()};
        if (kind === 'huarong') {
            drag.index = [...puzzles.controls.querySelectorAll('.huarong-piece')].indexOf(el);
            g.selected = drag.index;
        }
        if (kind === 'spider') {
            const col = el.closest('.card-column');
            drag.col = [...puzzles.controls.querySelectorAll('.card-column')].indexOf(col);
            drag.index = [...col.querySelectorAll('.playing-card')].indexOf(el);
            if (!MoonArcade.cardSelect(g, drag.col, drag.index)) drag = null;
        }
        if (kind === 'match3') drag.index = [...puzzles.controls.querySelectorAll('.arcade-match3 button')].indexOf(el);
        if (kind === 'shikaku') drag.index = [...puzzles.controls.querySelectorAll('.shikaku-cell')].indexOf(el);
        if (kind === 'nonogram') {
            drag.value = g.mark ? -1 : 1;
            drag.index = [...puzzles.controls.querySelectorAll('.nonogram-grid button')].indexOf(el);
            if (drag.index < 0) drag = null;
        }
    }, {capture: true});
    document.addEventListener('pointermove', e => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) < 10) return;
        drag.moved = true;
        e.preventDefault();
        if (['huarong', 'spider'].includes(drag.kind)) {
            drag.el.style.translate = dx + 'px ' + dy + 'px';
            drag.el.classList.add('dragging-piece');
        }
        if (drag.kind === 'nonogram') {
            const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.nonogram-grid button'),
                i = [...puzzles.controls.querySelectorAll('.nonogram-grid button')].indexOf(el);
            if (i >= 0 && !drag.paint.has(i)) {
                drag.paint.add(i);
                drag.g.cells[i] = drag.value;
                drag.g.moves++;
                el.classList.toggle('filled', drag.value === 1);
                el.textContent = drag.value === -1 ? '×' : '';
            }
        }
    }, {passive: false});
    document.addEventListener('pointerup', e => {
        const d = drag;
        drag = null;
        if (!d?.moved) return;
        suppress = performance.now() + 150;
        suppressInfo = puzzles.info;
        e.preventDefault();
        d.el.style.translate = '';
        d.el.classList.remove('dragging-piece');
        const dx = e.clientX - d.x, dy = e.clientY - d.y,
            dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0, g = d.g;
        let changed = false;
        if (d.kind === 'huarong') {
            const board = puzzles.controls.querySelector('.arcade-huarong').getBoundingClientRect(),
                step = dir % 2 ? board.width / 4 : board.height / 5,
                count = Math.max(1, Math.round(Math.abs(dir % 2 ? dx : dy) / step));
            for (let k = 0; k < count; k++) changed = MoonArcade.slide(g, dir) || changed;
        }
        if (d.kind === 'spider') {
            const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.card-column'),
                col = [...puzzles.controls.querySelectorAll('.card-column')].indexOf(target);
            if (col >= 0) changed = MoonArcade.cardMove(g, col);
        }
        if (d.kind === 'match3') {
            const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.arcade-match3 button'),
                i = [...puzzles.controls.querySelectorAll('.arcade-match3 button')].indexOf(target);
            if (i >= 0) changed = MoonArcade.swapMatch(g, d.index, i);
            g.selected = null;
        }
        if (d.kind === 'merge') {
            MoonActivities.expandedKey(puzzles, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][dir]);
            return;
        }
        if (d.kind === 'shikaku') {
            const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.shikaku-cell'),
                i = [...puzzles.controls.querySelectorAll('.shikaku-cell')].indexOf(el);
            if (i >= 0) changed = MoonExpanded.placeRegion(g, MoonExpanded.rectangle(g, d.index, i));
            g.start = null;
            g.won = MoonExpanded.shikakuWin(g);
        }
        if (d.kind === 'nonogram') {
            g.cells[d.index] = d.value;
            g.won = g.cells.every((v, i) => (v === 1 ? 1 : 0) === g.answer[i]);
            changed = true;
        }
        if (d.kind === 'sokoban') {
            MoonActivities.move(puzzles, dir);
            return;
        }
        if (d.kind === 'sliding') {
            const zero = g.cells.indexOf(0), i = zero + [g.width, -1, -g.width, 1][dir];
            changed = MoonClassic.slide(g, i);
            g.won = g.cells.every((v, k) => v === (k + 1) % g.cells.length);
        }
        if (!changed && !g.won) puzzles.wrong('这一步无法移动，检查空位与连接条件。');
        puzzles.render();
        if (g.won) MoonActivities.complete(puzzles);
    }, {capture: true});
    document.addEventListener('click', e => {
        if (performance.now() < suppress && puzzles.info === suppressInfo && e.target.closest('.puzzle-controls')) {
            suppress = 0;
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);
    document.addEventListener('pointercancel', () => {
        if (drag) {
            drag.el.style.translate = '';
            drag.el.classList.remove('dragging-piece');
            drag = null;
        }
    });
})();