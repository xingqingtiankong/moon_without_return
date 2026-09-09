"use strict";
(function () {
    const n = MoonCampaign.nodes;
    const stations = {
        B03: {x: 925, y: 445, interactX: 790, interactY: 545},
        B04: {x: 900, y: 742, interactX: 915, interactY: 635},
        R06: {x: 790, y: 210, interactX: 815, interactY: 380},
        R07: {x: 710, y: 455, interactX: 885, interactY: 545},
        B02: {x: 275, y: 382, interactX: 425, interactY: 450},
        B05: {x: 650, y: 430, interactX: 820, interactY: 550},
        R08: {x: 810, y: 275, interactX: 860, interactY: 435}
    };
    for (const d of Object.values(n)) {
        if (!d.targets) continue;
        for (const t of d.targets) {
            if (stations[t.map] && (/^[KTEFV]_/.test(d.id) || ['S02_TIME', 'S02_BODY', 'S02_SIGN', 'S02_SAVE', 'S02_BLIND', 'S03_REPAIR', 'S03_NOTICE', 'S03_AZHI', 'S03_VIDEO_INFO', 'S03_VIDEO', 'S05_SEND'].includes(d.id))) Object.assign(t, stations[t.map], {
                radius: 100,
                label: d.title
            });
        }
    }

    function place(id, data) {
        n[id]?.targets.forEach(t => Object.assign(t, data, {radius: 100, label: n[id].title}));
    }

    place('F_OXYGEN', {x: 1180, y: 713, interactX: 1180, interactY: 580});
    place('F_SUIT', {x: 750, y: 250, interactX: 775, interactY: 440});
    place('F_TEMPLATE', {x: 275, y: 650, interactX: 450, interactY: 580});
    place('F_QUEUE', {x: 1290, y: 330, interactX: 1320, interactY: 435});
    place('T_COORD', {x: 1230, y: 268, interactX: 1200, interactY: 450});
    place('V_LOOP_CONFIRM', {x: 290, y: 400, interactX: 420, interactY: 560});
    for (const id of ['S01_ID', 'S01_FAMILY', 'S01_CORE', 'S01_RETURN', 'S01_OTHERS']) place(id, {
        x: 650 + ['S01_ID', 'S01_FAMILY', 'S01_CORE', 'S01_RETURN', 'S01_OTHERS'].indexOf(id) * 100,
        y: 270,
        interactX: 650 + ['S01_ID', 'S01_FAMILY', 'S01_CORE', 'S01_RETURN', 'S01_OTHERS'].indexOf(id) * 100,
        interactY: 350
    });
    for (const id of ['V_TRACE_REPLAY', 'V_TRACE_OFF']) {
        const ref = n.M03_INDEX.targets[0];
        n[id].targets = n[id].targets.map(t => ({...t, ...ref, id: t.id, label: n[id].title}));
    }
    globalThis.MoonTaskStations = stations;
})();
