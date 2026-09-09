"use strict";

function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor(total % 3600 / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function renderSaveSlots() {
    const root = document.getElementById("save-slots");
    const slots = [{id: 'auto', data: MoonStorage.loadGame()}, ...MoonStorage.listSlots()];
    document.getElementById("archive-count").textContent = `LOCAL MISSION RECORDS // ${slots.filter(s => s.data).length} DETECTED`;
    root.replaceChildren();
    slots.forEach(({id, data}) => {
        const item = document.createElement("li"), number = document.createElement("p"),
            detail = document.createElement("p"), actions = document.createElement("div");
        item.className = "save-slot";
        number.className = "save-slot__number";
        detail.className = "save-slot__detail";
        actions.className = "save-slot__actions";
        number.textContent = id === 'auto' ? 'AUTO / 自动存档' : `SLOT ${String(id).padStart(2, "0")}`;
        if (data) {
            const saved = data.savedAt ? new Date(data.savedAt).toLocaleString("zh-CN", {hour12: false}) : "时间未知";
            detail.textContent = `${data.flags.player_name ? data.flags.player_name + ' · ' : ''}第 ${data.chapter} 章 · Day ${data.day} · ${data.currentMap} · 精神 ${data.mental_value} · ${formatTime(data.playTime)} · ${saved}`;
            const load = document.createElement("button");
            load.type = "button";
            load.textContent = "读取";
            load.onclick = () => MoonSystem.navigateTo(`../game/index.html?load=${id}`);
            actions.append(load);
            if (id !== 'auto') {
                const remove = document.createElement("button");
                remove.type = "button";
                remove.textContent = "删除";
                remove.onclick = () => {
                    MoonStorage.deleteSave(id);
                    renderSaveSlots();
                };
                actions.append(remove);
            }
        } else {
            detail.textContent = "暂无记录";
            const empty = document.createElement("span");
            empty.textContent = "EMPTY";
            actions.append(empty);
        }
        item.append(number, detail, actions);
        root.append(item);
    });
}

function initialize() {
    renderSaveSlots();
    MoonSystem.initializeSystemClock();
    MoonSystem.bindBackButton();
    MoonSystem.bindEscapeToMain();
}

initialize();
