"use strict";
const epilogueImage = new Image();
epilogueImage.src = "../img/scenes/earth-isolation.png";
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

        if (map === 'A02' && s.flags.archive_missing) {
            ctx.fillStyle = s.flags.archive_missing > 1 ? '#777f80dd' : '#131e26aa';
            ctx.fillRect(1040, 240, 530, 420);
            ctx.fillStyle = '#ded9c5';
            ctx.font = '17px monospace';
            if (s.flags.archive_missing > 2) ctx.fillText('WUKANG PERSONALITY RECONSTRUCTION', 1040, 420);
        }
        const epilogueScene = s.flags.epilogue || s.node === 'F_EARTH';
        if (epilogueScene) {
            if (epilogueImage.complete && epilogueImage.naturalWidth) ctx.drawImage(epilogueImage, 0, 0, 1672, 941); else {
                ctx.fillStyle = '#0d1216';
                ctx.fillRect(0, 0, 1672, 941);
            }
        }
        if (s.flags.epilogue_black) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 1672, 941);
        }
        ctx.restore();
    }
};