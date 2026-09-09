"use strict";

globalThis.MoonOverview = (() => {
    const rooms = Object.freeze({
        F00: [.455, .80],
        F01: [.455, .635],
        F02: [.235, .305],
        F03: [.48, .31],
        F04: [.698, .29],
        F05: [.862, .515],
        R01: [.425, .865],
        R02: [.405, .46],
        R03: [.395, .205],
        R04: [.135, .505],
        R05: [.145, .165],
        R06: [.69, .19],
        R07: [.69, .435],
        R08: [.695, .69],
        R09: [.925, .69],
        B01: [.49, .34],
        B02: [.21, .265],
        B03: [.745, .28],
        B04: [.495, .72],
        B05: [.20, .715]
    });
    const zoneNames = {F: "家庭", R: "基地主层", B: "地下层", A: "档案重建"};

    function objectives(state) {
        if (!state || state.chapterComplete) return [];
        if (globalThis.MoonCampaign?.nodes[state.node]) return MoonCampaign.objectives(state);
        if (globalThis.MoonDay3?.active(state)) return MoonDay3.objectives(state);
        if (state.node === 'H01' && state.flags?.h01_started && globalThis.MoonH01) return MoonH01.objectives(state);
        const completed = new Set(state.completedTasks || []);
        return Object.entries(MoonChapter1.interactions).filter(([id, item]) =>
            item.node === state.node && !completed.has(item.task) && !completed.has(id) &&
            (!item.hiddenUntilReady || (item.requires || []).every(task => completed.has(task)))
        ).map(([id, item]) => ({id, ...item}));
    }

    function render(mapId, state) {
        const root = document.getElementById("overview-markers"), summary = document.getElementById("overview-targets");
        root.replaceChildren();
        summary.replaceChildren();
        const zone = mapId[0], targets = objectives(state), groups = new Map();
        const current = rooms[mapId];

        function marker(type, map, point, text, label, offset = 0) {
            const element = document.createElement("span");
            element.className = "overview-marker overview-marker--" + type;
            element.style.left = `${point[0] * 100}%`;
            element.style.top = `${point[1] * 100}%`;
            element.style.setProperty("--marker-offset", `${offset}px`);
            element.dataset.map = map;
            element.setAttribute("role", "img");
            element.setAttribute("aria-label", label);
            element.title = label;
            const dot = document.createElement("b");
            dot.textContent = type === "player" ? "●" : "!";
            const caption = document.createElement("span");
            caption.textContent = text;
            element.append(dot, caption);
            root.append(element);
        }

        if (current) marker("player", mapId, current, "你在这里", `当前位置：${mapId} · ${MoonMapConfig.MAPS[mapId].name}`);
        for (const target of targets) {
            if (!groups.has(target.map)) groups.set(target.map, []);
            groups.get(target.map).push(target);
        }
        for (const [room, items] of groups) {
            const name = MoonMapConfig.MAPS[room]?.name || room;
            const labels = items.map(item => item.label).join("、");
            if (room[0] === zone && rooms[room]) marker("task", room, rooms[room], items.length > 1 ? `任务 ×${items.length}` : "任务", `${room} ${name}：${labels}`, room === mapId ? 42 : 0);
            const item = document.createElement("li");
            item.dataset.map = room;
            item.textContent = `${room[0] === zone ? "◆" : "↗"} ${room} ${name}：${labels}${room[0] === zone ? "" : `（位于${zoneNames[room[0]] || "其他区域"}）`}`;
            summary.append(item);
        }
        if (!targets.length) {
            const item = document.createElement("li");
            item.textContent = "当前没有待完成的任务目标。";
            summary.append(item);
        }
    }

    return Object.freeze({rooms, objectives, render});
})();