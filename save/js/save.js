"use strict";

function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor(total % 3600 / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatSavedAt(value) {
    if (!value) return "时间未知";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "时间未知";
    return date.toLocaleString("zh-CN", {hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"});
}

function createThumb(data, id) {
    const figure = MoonSaveThumbnail.create(data, "save-slot__thumb", {
        placeholder: "NO FRAME",
        label: `${id === "auto" ? "自动存档" : "存档 " + id} 的最后一刻画面`
    });
    if (data?.snapshotScene || data?.snapshot) {
        const note = document.createElement("span");
        note.className = "save-slot__thumb-note";
        note.textContent = formatSavedAt(data.savedAt);
        figure.append(note);
    }
    return figure;
}

function buildLoadedSlot(id, data) {
    const item = document.createElement("li");
    item.className = "save-slot is-loaded";
    const body = document.createElement("div");
    body.className = "save-slot__body";
    const head = document.createElement("div");
    head.className = "save-slot__head";
    const number = document.createElement("p");
    number.className = "save-slot__number";
    number.textContent = id === "auto" ? "AUTO / 自动存档" : `SLOT ${String(id).padStart(2, "0")}`;
    const chapter = document.createElement("p");
    chapter.className = "save-slot__chapter";
    chapter.textContent = data.chapterTitle || (data.chapter === 0 ? "序章" : `第 ${data.chapter} 章`);
    head.append(number, chapter);
    const title = document.createElement("h3");
    title.className = "save-slot__title";
    title.textContent = data.storyTitle || "未记录情节";
    const plot = document.createElement("p");
    plot.className = "save-slot__plot";
    plot.textContent = data.storySummary || "任务正在进行，已保存当前探索位置与状态。";
    const meta = document.createElement("p");
    meta.className = "save-slot__meta";
    meta.textContent = `${data.flags.player_name ? data.flags.player_name + " · " : ""}Day ${data.day} · ${data.currentMap} · 精神 ${data.mental_value} · ${formatTime(data.playTime)} · ${formatSavedAt(data.savedAt)}`;
    body.append(head, title, plot, meta);

    const actions = document.createElement("div");
    actions.className = "save-slot__actions";
    const load = document.createElement("button");
    load.type = "button";
    load.className = "save-slot__load";
    load.textContent = "读取";
    load.onclick = () => {
        MoonMenuBgm.stop();
        MoonSystem.navigateTo(`../game/index.html?load=${id}`);
    };
    actions.append(load);
    if (id !== "auto") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "save-slot__delete";
        remove.textContent = "删除";
        remove.onclick = () => {
            MoonStorage.deleteSave(id);
            renderSaveSlots();
        };
        actions.append(remove);
    }
    item.append(createThumb(data, id), body, actions);
    return item;
}

function buildEmptySlot(id) {
    const item = document.createElement("li");
    item.className = "save-slot is-empty";
    const body = document.createElement("div");
    body.className = "save-slot__body";
    const head = document.createElement("div");
    head.className = "save-slot__head";
    const number = document.createElement("p");
    number.className = "save-slot__number";
    number.textContent = id === "auto" ? "AUTO / 自动存档" : `SLOT ${String(id).padStart(2, "0")}`;
    const chapter = document.createElement("p");
    chapter.className = "save-slot__chapter";
    chapter.textContent = "NO RECORD";
    head.append(number, chapter);
    const title = document.createElement("h3");
    title.className = "save-slot__title";
    title.textContent = "暂无记录";
    const plot = document.createElement("p");
    plot.className = "save-slot__plot";
    plot.textContent = "未检测到本地任务快照，进入游戏后保存即可写入画面与情节。";
    body.append(head, title, plot);
    const actions = document.createElement("div");
    actions.className = "save-slot__actions";
    const empty = document.createElement("span");
    empty.className = "save-slot__empty";
    empty.textContent = "EMPTY";
    actions.append(empty);
    item.append(createThumb(null, id), body, actions);
    return item;
}

function renderSaveSlots() {
    const root = document.getElementById("save-slots");
    const slots = [{id: "auto", data: MoonStorage.loadGame()}, ...MoonStorage.listSlots()];
    document.getElementById("archive-count").textContent = `LAST FRAME ARCHIVE // ${slots.filter(s => s.data).length} DETECTED`;
    root.replaceChildren();
    slots.forEach(({id, data}) => {
        root.append(data ? buildLoadedSlot(id, data) : buildEmptySlot(id));
    });
}

function initialize() {
    renderSaveSlots();
    MoonSystem.initializeSystemClock();
    MoonSystem.bindBackButton();
    MoonSystem.bindEscapeToMain();
}

initialize();
