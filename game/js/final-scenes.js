"use strict";
globalThis.MoonFinalScene = {
    draw(ctx, s, map, position) {
        ctx.save();
        if (map === 'B04' && s.flags.core_rule_count) {
            ctx.strokeStyle = s.flags.plan_terminated ? '#738279' : '#b3a275';
            ctx.lineWidth = 3;
            for (let i = 0; i < s.flags.core_rule_count; i++) {
                const x = 680 + i * 42;
                ctx.beginPath();
                ctx.moveTo(x, 345);
                ctx.lineTo(x, 420);
                ctx.lineTo(820, 455);
                ctx.stroke();
            }
            ctx.fillStyle = '#d2bf92';
            ctx.font = '18px sans-serif';
            ctx.fillText(s.flags.plan_terminated ? '终止已执行' : '规则仍在执行 · ' + s.flags.core_rule_count + ' / 7', 650, 315);
        }
        if (map === 'B05' && s.flags.bio_stopped) {
            ctx.fillStyle = '#061115aa';
            ctx.fillRect(0, 0, 1672, 941);
            ctx.fillStyle = '#afc2b5';
            ctx.font = '20px sans-serif';
            ctx.fillText('循环批次已封存 · 撤离生命支持运行中', 590, 310);
        }
        if (map === 'B02' && s.flags.plan_terminated) {
            ctx.fillStyle = '#091116b0';
            ctx.fillRect(490, 245, 730, 92);
            ctx.fillStyle = '#c4b48f';
            ctx.font = '20px monospace';
            ctx.fillText('18: CANCELLED    TEMPLATE: READ ONLY', 515, 280);
            ctx.fillText('ACTIVATION QUEUE: EMPTY', 515, 312);
        }
        if (map === 'F01' && s.family_state === 'S3') {
            ctx.fillStyle = '#6c7575';
            ctx.fillRect(230, 65, 315, 115);
            ctx.fillRect(975, 80, 240, 125);
            ctx.strokeStyle = '#b6b0a0';
            ctx.lineWidth = 5;
            ctx.strokeRect(276, 85, 60, 65);
            ctx.fillStyle = '#323b3d';
            ctx.fillRect(281, 90, 50, 55);
        }
        if (map === 'A02' && s.flags.archive_missing) {
            ctx.fillStyle = s.flags.archive_missing > 1 ? '#777f80dd' : '#131e26aa';
            ctx.fillRect(1040, 240, 530, 420);
            ctx.fillStyle = '#ded9c5';
            ctx.font = '17px monospace';
            if (s.flags.archive_missing > 2) ctx.fillText('WUKANG PERSONALITY RECONSTRUCTION', 1040, 420);
        }
        if (s.flags.epilogue) {
            ctx.fillStyle = '#35464f';
            ctx.fillRect(0, 0, 1672, 941);
            ctx.fillStyle = '#87979b';
            ctx.beginPath();
            ctx.moveTo(230, 360);
            ctx.lineTo(1310, 360);
            ctx.lineTo(1500, 800);
            ctx.lineTo(170, 800);
            ctx.fill();
            ctx.fillStyle = '#b6c0bc';
            ctx.fillRect(230, 140, 1080, 220);
            ctx.fillStyle = '#7198a099';
            ctx.fillRect(1070, 140, 240, 610);
            ctx.strokeStyle = '#e0e9df';
            ctx.lineWidth = 7;
            ctx.strokeRect(1070, 140, 240, 610);
            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#263d47';
            ctx.fillText('隔离观察室', 300, 245);
            if (['F_REPLY', 'F_BLACK', 'F_AZHI_BOOT', 'GAME_COMPLETE'].includes(s.node)) {
                ctx.fillStyle = '#b9ab93';
                ctx.beginPath();
                ctx.arc(1190, 410, 32, 0, 7);
                ctx.fill();
                ctx.fillStyle = '#545f62';
                ctx.fillRect(1160, 443, 65, 115);
                ctx.fillStyle = '#33444a';
                ctx.fillRect(1161, 558, 24, 66);
                ctx.fillRect(1200, 558, 24, 66);
            }
            if (s.flags.epilogue_black) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 1672, 941);
            }
        }
        ctx.restore();
    }
};