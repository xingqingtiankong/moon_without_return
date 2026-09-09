"use strict";
(function () {
    const a = MoonActivities, oldDraw = a.drawArcade, oldNew = a.drawNew;
    a.drawArcade = function (p) {
        const g = p.classic;
        if (!['runner', 'flier'].includes(g.kind)) return oldDraw.call(this, p);
        const c = p.arcadeCanvas.getContext('2d'), gradient = c.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#0b1c28');
        gradient.addColorStop(1, '#34515b');
        c.fillStyle = gradient;
        c.fillRect(0, 0, 600, 300);
        for (let i = 0; i < 7; i++) {
            let x = (i * 120 - g.elapsed * 35) % 840;
            if (x < 0) x += 840;
            c.strokeStyle = '#58737a';
            c.lineWidth = 5;
            c.strokeRect(x - 80, 15, 90, 266);
            c.fillStyle = '#a9c3b3';
            c.fillRect(x - 65, 22, 58, 3);
            c.fillStyle = '#152c38';
            c.fillRect(x - 60, 65, 60, 100);
            c.strokeStyle = '#466673';
            c.lineWidth = 1;
            for (let y = 74; y < 156; y += 10) {
                c.beginPath();
                c.moveTo(x - 55, y);
                c.lineTo(x - 5, y);
                c.stroke();
            }
        }
        c.fillStyle = '#1d3138';
        c.fillRect(0, 258, 600, 42);
        c.strokeStyle = '#7e8b82';
        for (let i = 0; i < 17; i++) {
            const x = (i * 50 - g.elapsed * g.speed) % 850;
            c.beginPath();
            c.moveTo(x, 259);
            c.lineTo(x - 20, 300);
            c.stroke();
        }
        for (const o of g.obstacles) {
            const segments = g.kind === 'flier' ? [[0, o.center - g.gap / 2], [o.center + g.gap / 2, 300 - o.center - g.gap / 2]] : [[258 - o.height, o.height]];
            for (const [y, h] of segments) {
                c.fillStyle = '#71847d';
                c.fillRect(o.x, y, 34, h);
                c.fillStyle = '#243c44';
                c.fillRect(o.x + 6, y + 4, 22, Math.max(0, h - 8));
                c.fillStyle = '#c1a46a';
                c.fillRect(o.x, y, 34, 5);
                c.fillRect(o.x, y + h - 5, 34, 5);
                c.strokeStyle = '#172e37';
                c.lineWidth = 4;
                for (let k = 0; k < 4; k++) {
                    c.beginPath();
                    c.moveTo(o.x + k * 10, y);
                    c.lineTo(o.x + k * 10 + 5, y + 5);
                    c.stroke();
                }
            }
        }
        c.save();
        c.translate(92, g.y);
        if (g.invulnerable && Math.floor(g.elapsed * 15) % 2) c.globalAlpha = .5;
        c.fillStyle = '#c5c1a6';
        c.beginPath();
        c.roundRect(-18, -13, 37, 22, 5);
        c.fill();
        c.fillStyle = '#1c3c50';
        c.fillRect(-4, -9, 18, 10);
        c.fillStyle = '#a1d2d1';
        c.fillRect(7, -7, 5, 3);
        c.strokeStyle = '#d6cbaa';
        c.lineWidth = 3;
        if (g.kind === 'runner') {
            for (const x of [-12, 12]) {
                c.fillStyle = '#1e2b32';
                c.beginPath();
                c.arc(x, 11, 7, 0, 7);
                c.fill();
                c.strokeStyle = '#8d9f98';
                c.beginPath();
                c.moveTo(x, 11);
                c.lineTo(x + Math.cos(g.elapsed * 12) * 5, 11 + Math.sin(g.elapsed * 12) * 5);
                c.stroke();
            }
        } else {
            c.beginPath();
            c.moveTo(-25, -18);
            c.lineTo(25, -18);
            c.stroke();
            c.strokeStyle = '#e7d2a399';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-30 - Math.sin(g.elapsed * 40) * 5, -21);
            c.lineTo(30 + Math.sin(g.elapsed * 40) * 5, -21);
            c.stroke();
            c.fillStyle = '#8dccce66';
            c.beginPath();
            c.moveTo(-9, 12);
            c.lineTo(0, 23 + Math.sin(g.elapsed * 30) * 6);
            c.lineTo(8, 12);
            c.fill();
        }
        c.restore();
        p.feedback.textContent = '已通过 ' + g.passed + ' / ' + g.target + ' · 剩余保护 ' + g.lives;
    };
    a.drawNew = function (p) {
        const g = p.classic;
        if (g.kind === 'jump') return drawJump(p);
        if (g.kind !== 'tetris') return oldNew.call(this, p);
        const c = p.newCanvas?.getContext('2d');
        if (!c) return;
        const colors = ['', '#b9a677', '#8db2a6', '#a499ba', '#78a29e', '#c69777', '#a8ae79', '#8eacc0'];
        c.fillStyle = '#0e1e29';
        c.fillRect(0, 0, 300, 540);

        function cell(x, y, v, alpha = 1) {
            c.globalAlpha = alpha;
            c.fillStyle = colors[v];
            c.fillRect(x * 30 + 1, y * 30 + 1, 28, 28);
            c.strokeStyle = '#e5dac177';
            c.strokeRect(x * 30 + 4, y * 30 + 4, 21, 21);
            c.globalAlpha = 1;
        }

        g.cells.forEach((v, i) => {
            if (v) cell(i % 10, Math.floor(i / 10), v); else {
                c.strokeStyle = '#435b612a';
                c.strokeRect(i % 10 * 30, Math.floor(i / 10) * 30, 30, 30);
            }
        });
        let landing = g.y;
        while (MoonArcade.pieceFits(g, g.piece, g.x, landing + 1)) landing++;
        g.piece.forEach((r, y) => r.forEach((v, x) => {
            if (v) cell(g.x + x, landing + y, g.type + 1, .2);
        }));
        if (g.visualY === undefined || g.y < g.visualY - 2) {
            g.visualY = g.y;
            g.visualX = g.x;
        }
        g.visualX += (g.x - g.visualX) * .45;
        g.visualY += (g.y - g.visualY) * .45;
        g.piece.forEach((r, y) => r.forEach((v, x) => {
            if (v) cell(g.visualX + x, g.visualY + y, g.type + 1);
        }));
        p.feedback.textContent = '清除 ' + g.lines + ' / ' + g.target + ' 行 · 透明轮廓为落点';
    };

    function drawJump(p) {
        const g = p.classic, c = p.newCanvas?.getContext('2d');
        if (!c) return;
        const grad = c.createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, '#101f2a');
        grad.addColorStop(1, '#425c64');
        c.fillStyle = grad;
        c.fillRect(0, 0, 600, 300);
        c.fillStyle = '#b2c5b64f';
        for (let i = 0; i < 18; i++) {
            let sx = (i * 73 - p.time * 9) % 640;
            if (sx < 0) sx += 640;
            c.fillRect(sx, 20 + (i * 41) % 130, 2, 2);
        }
        c.strokeStyle = '#6e83776b';
        for (let x = -(p.time * 18) % 50; x < 600; x += 50) {
            c.beginPath();
            c.moveTo(x, 110);
            c.lineTo(x + 30, 300);
            c.stroke();
        }
        const distance = g.flight?.platform ?? g.distance;
        for (const [x, width] of [[80, 90], [80 + distance, g.width]]) {
            c.fillStyle = '#667c78';
            c.fillRect(x - width / 2, 214, width, 86);
            c.fillStyle = x === 80 ? '#b9a16a' : '#74c391';
            c.fillRect(x - width / 2 - 4, 208, width + 8, 10);
            c.fillStyle = '#1c363d';
            for (let xx = x - width / 2 + 5; xx < x + width / 2; xx += 15) c.fillRect(xx, 227, 6, 55);
            c.fillStyle = '#bee0ce';
            c.fillRect(x - width / 2, 204, 6, 4);
            c.fillRect(x + width / 2 - 6, 204, 6, 4);
        }
        const phase = g.flight ? Math.min(1, g.flight.elapsed / .65) : 0, x = 80 + (g.flight?.distance || 0) * phase,
            y = 207 - Math.sin(phase * Math.PI) * 105;
        c.fillStyle = '#0c1b24aa';
        c.beginPath();
        c.ellipse(x, 213, 15, 4, 0, 0, 7);
        c.fill();
        c.fillStyle = '#c2c3a9';
        c.beginPath();
        c.roundRect(x - 15, y - 27, 30, 24, 5);
        c.fill();
        c.fillStyle = '#244451';
        c.fillRect(x - 10, y - 23, 20, 11);
        c.fillStyle = '#bee3d8';
        c.fillRect(x + 4, y - 21, 4, 4);
        c.strokeStyle = '#cbbd98';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x - 10, y - 4);
        c.lineTo(x - 17, y);
        c.moveTo(x + 10, y - 4);
        c.lineTo(x + 17, y);
        c.stroke();
        c.fillStyle = '#142e39';
        c.fillRect(45, 30, 470, 15);
        c.fillStyle = '#d0b476';
        c.fillRect(45, 30, g.charge / 1.5 * 470, 15);
        c.fillStyle = '#67c58a88';
        const goalX = 45 + (distance - g.width / 2 - 100) / 270 * 470, goalWidth = g.width / 270 * 470;
        c.fillRect(goalX, 26, goalWidth, 23);
        c.font = '15px sans-serif';
        c.fillStyle = '#d4c7a6';
        c.fillText('探针跃迁 · 目标 ' + Math.round(distance) + ' / 当前蓄力 ' + Math.round(100 + g.charge * 180), 45, 77);
        p.feedback.textContent = g.last + ' · 平台 ' + g.progress + '/' + g.target + ' · 保护 ' + g.lives;
    }
})();