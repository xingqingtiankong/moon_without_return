"use strict";

const {
    MAPS,
    GROUPS,
    MAP_SIZE,
    OVERVIEW_IMAGE,
    FIGURE_IMAGE,
    SPACESUIT_IMAGE,
    SPRITE,
    isWalkable,
    isDoorInRange,
    getPlayerScale,
    getCharacterDrawSize,
    getPlayerFootprint,
    reciprocalSpawn
} = globalThis.MoonMapConfig;
const InputManager = globalThis.MoonInputManager;

const $ = selector => document.querySelector(selector);
const canvas = $("#scene");
const ctx = canvas.getContext("2d");
const input = new InputManager(window.MoonStorage.loadSettings().bindings);
const dialogueReveal = new MoonDialogueReveal($('#dialogue-text'));
const params = new URLSearchParams(location.search);
const debugMode = params.get("debug") === "1";
let storyMode = params.get('story') === '1' || (!debugMode && !params.has('ui') && params.get('story') !== '0');
const runtimeReturnKey = "moon_without_return_runtime_return_v1";
let runtimeReturn = null;
if (params.get("resume") === "1") {
    try {
        runtimeReturn = JSON.parse(sessionStorage.getItem(runtimeReturnKey) || "null");
    } catch (error) {
        runtimeReturn = null;
    }
}
if (typeof runtimeReturn?.storyMode === 'boolean') storyMode = runtimeReturn.storyMode;
let overviewProgress = runtimeReturn?.overviewProgress || (params.get("new") === "1" ? null : MoonStorage.loadGame(params.get("load") || params.get("slot") || "auto")) || MoonStorage.defaultGameState();
if (storyMode && !runtimeReturn && (params.get('new') === '1' || !MoonStorage.loadGame(params.get('load') || params.get('slot') || 'auto'))) overviewProgress = {
    ...MoonStorage.defaultGameState(),
    chapter: 0,
    node: 'P00',
    currentMap: 'R03',
    playerPosition: {x: 860, y: 480},
    configVersion: MoonMapConfig.CONFIG_VERSION,
    checkpointId: 'prologue-start'
};
if (params.get('test') === '1') {
    try {
        overviewProgress = JSON.parse(sessionStorage.getItem('moon_test_state') || 'null') || overviewProgress;
    } catch {
    }
}
if (params.get('flow') === '1') {
    try {
        overviewProgress = JSON.parse(sessionStorage.getItem('moon_flow_state') || 'null') || overviewProgress;
    } catch {
    }
}
const recoveryMap = overviewProgress.currentMap;
const story = new MoonStory({state: overviewProgress, tasks: [...MoonH01.tasks, ...MoonDay3.tasks]});
const h01 = new MoonH01.Controller(story);
const day3 = new MoonDay3.Controller(story);
const campaign = new MoonCampaign.Controller(story);
const puzzles = new MoonPuzzles($('.minigame-stage'), (node, result) => {
    if (node === 'H01_LAMP') h01.interact('h01_lamp_f00', result); else if (node === 'H02_TEMP') day3.resetTemperature(result); else if (node === 'H02_WATER') day3.water(result); else if (node.startsWith('h01_block_')) h01.interact(node, result); else campaign.finishGame(node, result);
});
let awakening = storyMode && story.state.node === 'P00', awakeningTime = -1, awakeningLock = 0;
let lastStoryNode = story.state.node;
let echoTime = 0;
let initialized = false;
let nearestInteraction = null;
let journalEvidence = false;
let pausedFrom = null;
let overwriteSlot = null;
const taskImages = {};
window.MoonStoryRuntime = story;
const persisted = localStorage.getItem("moon_without_return_map_test_v1");
let mapId = MAPS[runtimeReturn?.mapId] ? runtimeReturn.mapId : (MAPS[params.get("map")] ? params.get("map") : (params.get("new") === "1" ? "R02" : MAPS[persisted] ? persisted : "R02"));
let position = Number.isFinite(runtimeReturn?.position?.x) && Number.isFinite(runtimeReturn?.position?.y) ? runtimeReturn.position : {
    x: 836,
    y: 620
};
if (params.has("load") && !runtimeReturn) {
    mapId = story.state.currentMap;
    position = story.state.playerPosition;
    overviewProgress = story.state;
}
if (storyMode) {
    mapId = story.state.currentMap;
    position = story.state.playerPosition;
    overviewProgress = story.state;
}
if (storyMode && story.positionReset) {
    const target = MoonDay3.destination(story.state.node);
    if (target) {
        mapId = target.map;
        position = {x: target.x, y: target.y};
    }
}
if (storyMode && story.positionReset && campaign.node) {
    const resetMap = MAPS[recoveryMap] ? recoveryMap : (campaign.node.targets[0]?.map || 'R03');
    const target = campaign.node.warp || {map: resetMap, ...MAPS[resetMap].doors[0].spawn};
    mapId = target.map;
    position = {x: target.x, y: target.y};
}
const saveStory = story.save.bind(story);
story.save = (...args) => {
    if (!story.setLocation(mapId, position.x, position.y)) return false;
    return saveStory(...args);
};
let velocity = {x: 0, y: 0};
let facingRow = storyMode && (params.get('new') === '1' || (story.state.node === 'H01' && !story.state.flags.h01_started)) ? 4 : 0;
let animationTime = 0;
const walkAnimation = globalThis.MoonWalkAnimation;
const familyPatrol = new globalThis.MoonFamilyPatrol();
const familySprites = {};
let walkSheet = null, idleSheet = null;
let moving = false;
let showCollision = params.get("collision") === "1";
let showDoorInteractions = params.get("doors") === "1";
let coordinatePicking = false;
let selectedCoordinate = null;
let activeOverlay = null;
let overlayReturnFocus = null;
let overlayRevision = 0;
let statusHuds = null;
let leavingGame = false;
let mapUnavailableTimer = 0;
let nearestDoor = null;
let lastTime = performance.now();
let mapImage = new Image();
let mapReady = false;
let spriteSheet = null;
let spriteReady = false;
let spacesuitSheet = null;
let spacesuitReady = false;
const spacesuitDirections = Object.freeze({
    0: {row: 0, mirror: false},
    1: {row: 1, mirror: false},
    2: {row: 5, mirror: false},
    3: {row: 3, mirror: true},
    4: {row: 4, mirror: false},
    5: {row: 3, mirror: false},
    6: {row: 2, mirror: false},
    7: {row: 1, mirror: true}
});

function buildMapSelect() {
    const select = $("#map-select");
    GROUPS.forEach(group => {
        const optgroup = document.createElement("optgroup");
        optgroup.label = group.label;
        group.maps.forEach(id => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${id} · ${MAPS[id].name}`;
            optgroup.append(option);
        });
        select.append(optgroup);
    });
    select.value = mapId;
    select.addEventListener("change", () => enterMap(select.value, null, true));
}

function updateHud() {
    const map = MAPS[mapId];
    const zoneLabel = mapId.startsWith("F") ? "家庭" : map.zone;
    $("#room-id").textContent = mapId;
    $("#room-name").textContent = map.name;
    $("#zone-name").textContent = zoneLabel;
    $("#map-select").value = mapId;
    $("#overview-current").textContent = `当前位置：${mapId} · ${map.name}`;
    const list = $("#connection-list");
    list.replaceChildren();
    map.doors.forEach(door => {
        const item = document.createElement("li");
        item.textContent = `${door.to} ${MAPS[door.to].name}`;
        list.append(item);
    });
    const bindings = input.bindings.exploration;
    $("#key-move").textContent = [bindings.moveUp, bindings.moveLeft, bindings.moveDown, bindings.moveRight].map(window.MoonStorage.keyLabel).join("");
    $("#key-interact").textContent = window.MoonStorage.keyLabel(bindings.interact);
    $("#key-map").textContent = window.MoonStorage.keyLabel(bindings.map);
    $("#key-journal").textContent = window.MoonStorage.keyLabel(bindings.journal);
    $("#key-pause").textContent = window.MoonStorage.keyLabel(bindings.pause);
    $("#key-dialogue").textContent = window.MoonStorage.keyLabel("Space");
    $("#collision-toggle").setAttribute("aria-pressed", String(showCollision));
    $("#collision-toggle").textContent = showCollision ? "隐藏碰撞层" : "显示碰撞层";
    $("#door-shape-toggle").setAttribute("aria-pressed", String(showDoorInteractions));
    $("#door-shape-toggle").textContent = showDoorInteractions ? "隐藏门范围" : "显示门范围";
    updateOverview();
}

function updateStoryHud() {
    $('.evidence-cards')?.remove();
    const journalList = $('.journal-entry ul');
    if (journalList) journalList.hidden = false;
    updateStoryHudBase();
    if (storyMode) {
        if (journalEvidence) MoonEvidence.render($('.journal-entry'), story.state); else updateInvestigationJournal();
    }
}

function updateStoryHudBase() {
    if (!storyMode) return;
    const s = story.state, n = MoonH01.count(s), complete = s.flags.h01_complete;
    $('#chapter-day').textContent = `第一章 · 第 ${s.day} 天`;
    const remaining = s.day === 1 ? 365 : 365 - s.day;
    if (campaign.node || s.chapterComplete) {
        $('#chapter-day').textContent = `${s.flags.archive_mode ? '档案重建 · 只读' : s.chapter === 0 ? '序章' : (MoonLater.chapters[s.chapter]?.title || '第一章')} · 第 ${s.day} 天 · ${s.flags.player_name || (s.flags.independent17 ? "WUKANG-17" : "WUKANG")} ${s.flags.plan_terminated ? '' : ('· 剩余 ' + remaining + ' 天')}`;
        const def = campaign.node, targets = def?.targets || [], list = $('#task-list');
        list.replaceChildren();
        $('#task-count').textContent = s.chapterComplete ? '完成' : `${targets.length ? 0 : 1}/1`;
        for (const text of s.chapterComplete ? [(MoonLater.chapters[s.chapter]?.title || '第一章') + ' · 已完成'] : targets.length ? targets.map(o => o.label) : [def.title]) {
            const li = document.createElement('li');
            li.textContent = text;
            list.append(li);
        }
        const entry = $('.journal-entry');
        entry.querySelector('h2').textContent = journalEvidence ? '证据档案' : def?.title || (MoonLater.chapters[s.chapter]?.title + ' · 完成');
        entry.querySelector('b').textContent = journalEvidence ? String(s.evidence.length) : `精神 ${s.mental_value}`;
        entry.querySelector('p').textContent = journalEvidence ? '这里只记录已经亲自核验的物证。' : s.chapterComplete ? (MoonLater.chapters[s.chapter]?.summary || '本章完成。') : targets[0]?.label || '正在交谈';
        const ul = entry.querySelector('ul');
        ul.replaceChildren();
        for (const text of journalEvidence ? s.evidence.map(id => ({
            E01: 'E01 · 十六组轨迹摘要：样本时序不同，身份尚未确认。',
            E02: 'E02 · AZHI与XING-8条目：本地运行，源资料截止于离开地球前。'
        }[id] || id)) : targets.map(o => `${o.map} · ${o.label}`)) {
            const li = document.createElement('li');
            li.textContent = text;
            ul.append(li);
        }
        return;
    }
    if (MoonDay3.active(s)) {
        const rows = s.node === 'H01_COMPLETE' ? [{text: '结束休息，返回基地', done: false}] : [{
            text: '复位温控回路',
            done: s.completedTasks.includes('h02_temp')
        }, {text: '给盆栽浇水', done: s.completedTasks.includes('h02_plant')}];
        const summary = MoonDay3.objectives(s)[0]?.label || (s.flags.h02_d3_complete ? '本次轮班已完成' : '休眠唤醒中');
        $('#task-count').textContent = `${rows.filter(r => r.done).length}/${rows.length}`;
        const list = $('#task-list');
        list.replaceChildren();
        for (const row of rows) {
            const li = document.createElement('li');
            li.textContent = `${row.done ? '✓' : '□'} ${row.text}`;
            list.append(li);
        }
        if (!rows.some(r => r.text === summary)) {
            const li = document.createElement('li');
            li.textContent = summary;
            list.append(li);
        }
        const entry = $('.journal-entry');
        entry.querySelector('h2').textContent = journalEvidence ? '证据' : '第三天 · 轮班';
        entry.querySelector('b').textContent = journalEvidence ? String(s.evidence.length) : `${rows.filter(r => r.done).length}/${rows.length}`;
        entry.querySelector('p').textContent = journalEvidence ? '本段没有新增物证。' : summary;
        const ul = entry.querySelector('ul');
        ul.replaceChildren();
        for (const text of journalEvidence ? s.evidence : rows.map(r => `${r.done ? '✓' : '□'} ${r.text}`)) {
            const li = document.createElement('li');
            li.textContent = text;
            ul.append(li);
        }
        return;
    }
    const rows = [{
        text: `找齐三件积木（${s.completedTasks.includes('h01_blocks') ? 3 : n}/3）`,
        done: s.completedTasks.includes('h01_blocks')
    }, {text: '修复入户楼道灯', done: s.completedTasks.includes('h01_lamp')}];
    const list = $('#task-list');
    list.replaceChildren();
    if (complete) {
        const li = document.createElement('li');
        li.textContent = '第一次回家 · 已完成';
        list.append(li);
    } else if (s.flags.h01_started) for (const row of rows) {
        const li = document.createElement('li');
        li.textContent = `${row.done ? '✓' : '□'} ${row.text}`;
        list.append(li);
    }
    if (!complete && MoonH01.ready(s)) {
        const li = document.createElement('li');
        li.textContent = '前往餐桌吃饭';
        list.append(li);
    }
    $('#task-count').textContent = `${rows.filter(r => r.done).length}/2`;
    const entry = $('.journal-entry');
    entry.querySelector('h2').textContent = journalEvidence ? '证据' : '第一次回家';
    entry.querySelector('b').textContent = journalEvidence ? String(s.evidence.length) : `${rows.filter(r => r.done).length}/2`;
    entry.querySelector('p').textContent = journalEvidence ? '本段没有新增物证。' : complete ? '这一晚，一家人吃上了饭。进度已记录。' : MoonH01.ready(s) ? '两件事都完成了，回餐桌吃饭。' : '帮家里做两件饭前小事，完成后回餐桌吃饭。';
    const ul = entry.querySelector('ul');
    ul.replaceChildren();
    for (const text of journalEvidence ? s.evidence : rows.map(r => `${r.done ? '✓' : '□'} ${r.text}`)) {
        const li = document.createElement('li');
        li.textContent = text;
        ul.append(li);
    }
}

function updateInvestigationJournal() {
    const entry = $('.journal-entry');
    entry.querySelector('.investigation-records')?.remove();
    const panel = document.createElement('div');
    panel.className = 'investigation-records';
    const notes = MoonInvestigation.notes(story.state);
    if (notes.length) {
        const h = document.createElement('h3');
        h.textContent = '我的观察与待解问题';
        panel.append(h);
        notes.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            panel.append(p);
        });
    }
    entry.append(panel);
}

function configureFamilyStage() {
    const node = story.state.node,
        atTable = /^H02_D6_(HOME|SEAT|REPLY)$/.test(node) || ['H05_TRAIN', 'H05_HOME', 'H05_PIANO'].includes(node);
    const actor = familyPatrol.actors.find(a => a.id === 'xing8');
    if (atTable && actor.map !== 'F01') Object.assign(actor, {
        map: 'F01',
        x: 560,
        y: 540,
        points: [[560, 540], [650, 540], [680, 650], [570, 650]],
        target: 1,
        wait: 3,
        moving: false,
        phase: 0
    });
    if (!atTable && actor.map === 'F01') Object.assign(actor, new MoonFamilyPatrol().actors.find(a => a.id === 'xing8'));
}

function updateOverview() {
    const map = MAPS[mapId];
    const zone = mapId[0];
    const sources = {
        F: "../img/maps/00_总图/记忆中的家.png",
        R: "../img/maps/00_总图/基地主层.png",
        B: "../img/maps/00_总图/地下层.png"
    };
    const labels = {F: "家庭", R: "基地主层", B: "地下层"};
    if (!sources[zone]) return;
    $("#overview-title").textContent = labels[zone];
    $("#overview-image").src = encodeURI(sources[zone]);
    $("#overview-image").alt = `${labels[zone]}分区图`;
    $("#overview-current").textContent = `当前位置：${mapId} · ${map.name}`;
    MoonOverview.render(mapId, overviewProgress);
}

function loadMapImage() {
    mapReady = false;
    $("#load-error").hidden = true;
    mapImage = new Image();
    mapImage.onload = () => {
        mapReady = true;
    };
    mapImage.onerror = () => {
        const error = $("#load-error");
        error.textContent = `地图加载失败：${MAPS[mapId].file}`;
        error.hidden = false;
    };
    mapImage.src = encodeURI(MAPS[mapId].file);
}

function nearestWalkable(point) {
    const foot = getPlayerFootprint(mapId);
    if (point && playerCanWalk(mapId, point.x, point.y, foot.radiusX, foot.radiusY)) return {...point};
    const start = point || {x: MAP_SIZE.width / 2, y: MAP_SIZE.height / 2};
    for (let radius = 0; radius <= 600; radius += 15) {
        const steps = Math.max(8, Math.ceil(radius / 12));
        for (let i = 0; i < steps; i++) {
            const angle = i / steps * Math.PI * 2, x = start.x + Math.cos(angle) * radius,
                y = start.y + Math.sin(angle) * radius;
            if (playerCanWalk(mapId, x, y, foot.radiusX, foot.radiusY)) return {x, y};
        }
    }
    return {x: 836, y: 600};
}

function enterMap(nextId, spawn = null, fromSelector = false) {
    if (!MAPS[nextId]) return;
    const previous = mapId;
    mapId = nextId;
    const desired = spawn || (!fromSelector && MAPS[previous] ? reciprocalSpawn(nextId, previous) : null);
    position = nearestWalkable(desired);
    velocity = {x: 0, y: 0};
    moving = false;
    animationTime = 0;
    if (!MoonHistory.testing) localStorage.setItem("moon_without_return_map_test_v1", mapId);
    loadMapImage();
    updateHud();
    input.clear();
    clearCoordinateSelection();
    if (storyMode && initialized && !story.busy) story.save();
}

function loadSprite(path, onLoad) {
    const source = new Image();
    source.onload = () => onLoad(source);
    source.onerror = () => {
        const error = $("#load-error");
        error.textContent = `人物图像加载失败：${path}`;
        error.hidden = false;
    };
    source.src = encodeURI(path);
}

function prepareSprites() {
    loadSprite('../img/props/base/h02-drone.png', source => taskImages.drone = source);
    for (const suffix of ['livingroom', 'bathroom', 'balcony']) loadSprite(`../img/props/family/h01-block-${suffix}.png`, source => taskImages[suffix] = source);
    for (const [id, asset] of Object.entries(globalThis.MoonFamilyAnimation)) {
        familySprites[id] = {};
        loadSprite(asset.image, source => {
            familySprites[id].walk = source;
        });
        loadSprite(`../img/characters/${id}/${id}-npc.png`, source => {
            familySprites[id].idle = source;
        });
    }
    loadSprite(FIGURE_IMAGE, source => {
        spriteSheet = source;
        spriteReady = true;
    });
    loadSprite(SPACESUIT_IMAGE, source => {
        spacesuitSheet = source;
        spacesuitReady = true;
    });
    loadSprite(walkAnimation.image, source => {
        walkSheet = source;
    });
    loadSprite(walkAnimation.idleImage, source => {
        idleSheet = source;
    });
}

function setFacing(dx, dy) {
    if (dy > .25 && dx < -.25) facingRow = 1;
    else if (dy > .25 && dx > .25) facingRow = 7;
    else if (dy < -.25 && dx < -.25) facingRow = 5;
    else if (dy < -.25 && dx > .25) facingRow = 3;
    else if (Math.abs(dx) > Math.abs(dy)) facingRow = dx < 0 ? 2 : 6;
    else facingRow = dy < 0 ? 4 : 0;
}

function updateMovement(dt) {
    const startX = position.x, startY = position.y;
    let dx = (input.action("moveRight") ? 1 : 0) - (input.action("moveLeft") ? 1 : 0);
    let dy = (input.action("moveDown") ? 1 : 0) - (input.action("moveUp") ? 1 : 0);
    const hasInput = Boolean(dx || dy);
    if (hasInput) {
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;
        setFacing(dx, dy);
    }
    const speed = 235, rate = hasInput ? 1500 : 1900;
    const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
    velocity.x = approach(velocity.x, dx * speed, rate * dt);
    velocity.y = approach(velocity.y, dy * speed, rate * dt);
    const travelX = velocity.x * dt, travelY = velocity.y * dt;
    const foot = getPlayerFootprint(mapId);
    const steps = Math.max(1, Math.ceil(Math.hypot(travelX, travelY) / 5));
    for (let i = 0; i < steps; i++) {
        const stepX = travelX / steps, stepY = travelY / steps;
        const diagonalOk = playerCanWalk(mapId, position.x + stepX, position.y + stepY, foot.radiusX, foot.radiusY);
        if (diagonalOk) {
            position.x += stepX;
            position.y += stepY;
            continue;
        }
        if (playerCanWalk(mapId, position.x + stepX, position.y, foot.radiusX, foot.radiusY)) position.x += stepX; else velocity.x = 0;
        if (playerCanWalk(mapId, position.x, position.y + stepY, foot.radiusX, foot.radiusY)) position.y += stepY; else velocity.y = 0;
    }
    const distance = Math.hypot(position.x - startX, position.y - startY);
    moving = distance > 0.001;
    if (moving) animationTime = walkAnimation.advance(animationTime, distance, getPlayerScale(mapId));
    else animationTime = 0;
}

function storyObjects() {
    let objects = campaign.node ? campaign.objects.concat(!globalThis.MoonInvestigation && story.state.node === 'H02_D3_COMPLETE' ? day3.objects.filter(o => o.optional) : []) : [...h01.objects, ...day3.objects];
    return objects.map(o => {
        if (!o.actor) return o;
        const actor = familyPatrol.actors.find(a => a.id === o.actor);
        return actor ? {...o, map: actor.map, x: actor.x, y: actor.y, interactX: actor.x, interactY: actor.y} : o;
    });
}

function updateDoor() {
    nearestDoor = null;
    let best = Infinity;
    MAPS[mapId].doors.forEach(door => {
        const distance = Math.hypot(door.x - position.x, door.y - position.y);
        if (isDoorInRange(door, position.x, position.y) && distance < best) {
            nearestDoor = door;
            best = distance;
        }
    });
    const prompt = $("#door-prompt");
    prompt.hidden = !nearestDoor;
    if (nearestDoor) prompt.textContent = `[${window.MoonStorage.keyLabel(input.code("interact"))}] ${nearestDoor.label} → ${nearestDoor.to}`;
    nearestInteraction = null;
    if (storyMode && !story.busy && campaign.node) {
        nearestInteraction = storyObjects().filter(o => !o.approach && o.map === mapId && Math.hypot((o.interactX ?? o.x) - position.x, (o.interactY ?? o.y) - position.y) <= o.radius).sort((a, b) => Number(Boolean(a.optional)) - Number(Boolean(b.optional)))[0] || null;
        if (nearestInteraction) {
            prompt.hidden = false;
            prompt.textContent = `[${MoonStorage.keyLabel(input.code('interact'))}] ${nearestInteraction.label}`;
        }
        return;
    }
    if (storyMode && !story.busy && MoonDay3.active(story.state)) {
        nearestInteraction = day3.objects.find(o => o.map === mapId && Math.hypot((o.interactX ?? o.x) - position.x, (o.interactY ?? o.y) - position.y) <= o.radius) || null;
        if (nearestInteraction) {
            prompt.hidden = false;
            prompt.textContent = `[${MoonStorage.keyLabel(input.code('interact'))}] ${nearestInteraction.label}`;
        }
        return;
    }
    if (!storyMode || story.busy || story.state.node !== 'H01' || !story.state.flags.h01_started) return;
    const targets = h01.objects.filter(o => o.map === mapId);
    if (!MoonH01.ready(story.state) && mapId === 'F01') targets.push({
        ...MoonPlacements.h01_dinner,
        label: '餐桌',
        kind: 'dinner'
    });
    const inRange = o => Math.hypot((o.interactX ?? o.x) - position.x, (o.interactY ?? o.y) - position.y) <= o.radius;
    nearestInteraction = targets.filter(inRange).sort((a, b) => Math.hypot(a.x - position.x, a.y - position.y) - Math.hypot(b.x - position.x, b.y - position.y))[0] || null;
    if (!nearestInteraction && !nearestDoor) {
        const actor = familyPatrol.visible(mapId).filter(a => Math.hypot(a.x - position.x, a.y - position.y) <= 80).sort((a, b) => Math.hypot(a.x - position.x, a.y - position.y) - Math.hypot(b.x - position.x, b.y - position.y))[0];
        if (actor) nearestInteraction = {
            id: actor.id,
            kind: 'npc',
            label: `与${actor.id === 'azhi' ? '阿芷' : '小星'}交谈`
        };
    }
    if (nearestInteraction) {
        prompt.hidden = false;
        prompt.textContent = `[${MoonStorage.keyLabel(input.code('interact'))}] ${nearestInteraction.label}`;
    }
}

function renderTaskObjects() {
    if (!storyMode) return;
    for (const o of storyObjects().filter(o => o.map === mapId && !o.optional)) {
        if (o.asset?.includes('h02-drone') && taskImages.drone) ctx.drawImage(taskImages.drone, o.x - 27.5, o.y - 27.5, 55, 55);
        if (o.kind === 'block') {
            const suffix = {F01: 'livingroom', F04: 'bathroom', F05: 'balcony'}[o.map], img = taskImages[suffix];
            if (img) ctx.drawImage(img, o.x - o.drawSize / 2, o.y - o.drawSize / 2, o.drawSize, o.drawSize);
        }
        if (o.kind === 'lamp' && Math.hypot(position.x - o.interactX, position.y - o.interactY) > o.radius) continue;
        ctx.save();
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e6c58a';
        ctx.strokeStyle = '#30271e';
        ctx.lineWidth = 4;
        ctx.strokeText('!', o.x, o.y - (o.kind === 'block' ? 24 : 30));
        ctx.fillText('!', o.x, o.y - (o.kind === 'block' ? 24 : 30));
        ctx.restore();
    }
}

function shapePath(shape) {
    ctx.beginPath();
    if (shape.type === "rect") ctx.rect(shape.x, shape.y, shape.w, shape.h);
    else if (shape.type === "ellipse") ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
    else {
        shape.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath();
    }
}

function renderCollision() {
    ctx.save();
    MAPS[mapId].ground.forEach(shape => {
        shapePath(shape);
        ctx.fillStyle = "rgba(55,210,139,.17)";
        ctx.fill();
        ctx.strokeStyle = "rgba(104,255,184,.65)";
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    MAPS[mapId].obstacles.forEach(shape => {
        shapePath(shape);
        ctx.fillStyle = "rgba(238,70,70,.23)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,105,105,.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    ctx.restore();
}

function renderDoorInteractions() {
    ctx.save();
    MAPS[mapId].doors.forEach(door => {
        shapePath(door.interaction);
        ctx.fillStyle = "rgba(255,181,77,.2)";
        ctx.fill();
        ctx.strokeStyle = "#ffb54d";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(door.x, door.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff0cf";
        ctx.fill();
    });
    ctx.restore();
}

function renderPlayer() {
    const scale = getPlayerScale(mapId), drawSize = getCharacterDrawSize(mapId), drawWidth = drawSize.width,
        drawHeight = drawSize.height;
    const foot = getPlayerFootprint(mapId);
    const useSpacesuit = mapId === "R09", useNewWalk = !useSpacesuit && walkSheet && idleSheet;
    const activeSheet = useSpacesuit ? spacesuitSheet : useNewWalk ? (moving ? walkSheet : idleSheet) : spriteSheet;
    const activeReady = useSpacesuit ? spacesuitReady : useNewWalk || spriteReady;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.38)";
    ctx.beginPath();
    ctx.ellipse(position.x, position.y, 22 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    if (activeReady) {
        const frame = moving ? (useNewWalk ? walkAnimation.frame(animationTime, facingRow) : Math.floor(animationTime * SPRITE.columns)) : 0;
        const drawY = position.y - drawHeight * (useNewWalk ? walkAnimation.footY / 256 : 1);
        const direction = useSpacesuit ? spacesuitDirections[facingRow] : useNewWalk ? walkAnimation.directions[facingRow] : {
            row: facingRow,
            mirror: false
        };
        ctx.imageSmoothingEnabled = false;
        if (direction.mirror) {
            ctx.save();
            ctx.translate(position.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(activeSheet, frame * SPRITE.frameWidth, direction.row * SPRITE.frameHeight, SPRITE.frameWidth, SPRITE.frameHeight, -drawWidth / 2, drawY, drawWidth, drawHeight);
            ctx.restore();
        } else ctx.drawImage(activeSheet, frame * SPRITE.frameWidth, direction.row * SPRITE.frameHeight, SPRITE.frameWidth, SPRITE.frameHeight, position.x - drawWidth / 2, drawY, drawWidth, drawHeight);
    } else {
        ctx.fillStyle = "#bfe4e5";
        ctx.beginPath();
        ctx.arc(position.x, position.y - 28 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    if (showCollision) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(position.x, position.y, foot.radiusX, foot.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function playerCanWalk(id, x, y, rx, ry) {
    return isWalkable(id, x, y, rx, ry) && !familyPatrol.blocks(id, x, y, rx, ry);
}

function renderFamilyActor(actor) {
    const sprites = familySprites[actor.id];
    if (!sprites) return;
    const walk = actor.moving && sprites.walk, image = walk ? sprites.walk : sprites.idle;
    if (!image) return;
    const size = getCharacterDrawSize(mapId), scale = getPlayerScale(mapId);
    const direction = walk ? walkAnimation.directions[actor.facing] : {row: 0, mirror: false};
    const frame = walk ? walkAnimation.frame(actor.phase, actor.facing) : 0;
    const foot = familyPatrol.footprint(actor);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath();
    ctx.ellipse(actor.x, actor.y, foot.rx, foot.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(actor.x, actor.y);
    if (direction.mirror) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, frame * 256, direction.row * 256, 256, 256, -size.width / 2, -size.height * 244 / 256, size.width, size.height);
    if (showCollision) {
        ctx.strokeStyle = "#ffcd73";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, foot.rx, foot.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function render() {
    document.body.dataset.moonWalk = String(storyMode && mapId === 'R09' && story.state.flags.outside_ready);
    if (storyMode && mapId === 'R09' && story.state.flags.outside_ready) {
        const s = story.state,
            text = MoonFinal.name(s) + ' · 氧量 ' + s.flags.oxygen + '% · 信标 ' + (Math.round(Math.hypot(position.x - 1200, position.y - 650) / 10) * 10) + ' m';
        if ($('#chapter-day').textContent !== text) $('#chapter-day').textContent = text;
    }
    const pixelRatio = devicePixelRatio || 1, targetW = Math.round(canvas.clientWidth * pixelRatio),
        targetH = Math.round(canvas.clientHeight * pixelRatio);
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const width = canvas.clientWidth, height = canvas.clientHeight;
    ctx.fillStyle = "#010203";
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / MAP_SIZE.width, height / MAP_SIZE.height), drawW = MAP_SIZE.width * scale,
        drawH = MAP_SIZE.height * scale, offsetX = (width - drawW) / 2, offsetY = (height - drawH) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (mapReady) ctx.drawImage(mapImage, 0, 0, MAP_SIZE.width, MAP_SIZE.height);
    if (storyMode && ['S1', 'S2', 'S3'].includes(story.state.family_state) && mapId === 'F01' && Math.floor(performance.now() / 1500) % 6 === 0) {
        ctx.fillStyle = '#020303';
        ctx.fillRect(225, 38, 265, 102);
    }
    if (storyMode && story.state.node === 'H04_PASS2' && story.busy && mapId === 'R02' && walkSheet && echoTime < 5) {
        const frame = walkAnimation.frame(echoTime, 2), direction = walkAnimation.directions[2],
            size = getCharacterDrawSize(mapId);
        ctx.save();
        ctx.globalAlpha = .3 * Math.min(1, 5 - echoTime);
        ctx.drawImage(walkSheet, frame * 256, direction.row * 256, 256, 256, 965 - echoTime * 35 - size.width / 2, 510 - size.height * 244 / 256, size.width, size.height);
        ctx.restore();
    }
    if (storyMode) {
        renderChapterEnvironment();
        MoonFinalScene.draw(ctx, story.state, mapId, position);
    }
    renderTaskObjects();
    if (showCollision) renderCollision();
    if (showDoorInteractions) renderDoorInteractions();
    const actors = familyPatrol.visible(mapId).map(actor => ({y: actor.y, draw: () => renderFamilyActor(actor)}));
    actors.push({y: position.y, draw: renderPlayer});
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    if (storyMode && story.state.flags.epilogue_black) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1672, 941);
    }
    ctx.restore();
}

function focusableElements(root) {
    return [...root.querySelectorAll('button:not([disabled]),summary,a[href],select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden);
}

function openOverlay(id) {
    const layer = $("#" + id);
    if (!layer) return false;
    if (leavingGame) return false;
    if (id === 'pause') {
        if (!['pause', 'save-game', 'leave-confirm'].includes(activeOverlay)) pausedFrom = activeOverlay;
        if (pausedFrom === 'minigame') puzzles.leaveFullscreen();
        if (pausedFrom === 'final-form') MoonFinalForms.release();
        $('#pause-save').disabled = !storyMode;
        if (storyMode && !story.busy) story.save();
    }
    if (id === 'save-game') renderGameSaves();
    if (!activeOverlay) overlayReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (activeOverlay && activeOverlay !== id) MoonUiMotion.hide($("#" + activeOverlay));
    const revision = ++overlayRevision;
    activeOverlay = id;
    MoonUiMotion.show(layer);
    document.body.classList.add("has-modal");
    statusHuds?.obscure(true);
    velocity = {x: 0, y: 0};
    moving = false;
    input.clear();
    requestAnimationFrame(() => {
        if (revision !== overlayRevision || activeOverlay !== id) return;
        const target = focusableElements(layer)[0] || layer;
        if (target === layer && !layer.hasAttribute("tabindex")) layer.tabIndex = -1;
        target.focus({preventScroll: true});
    });
    return true;
}

function closeOverlay(id, restoreFocus = true) {
    if (id === 'save-game' || (id === 'leave-confirm' && pausedFrom)) {
        openOverlay('pause');
        return Promise.resolve(true);
    }
    if (id === 'pause' && pausedFrom) {
        const target = pausedFrom;
        pausedFrom = null;
        openOverlay(target);
        if (target === 'minigame' && puzzles.started) restorePuzzleFullscreen();
        return Promise.resolve(true);
    }
    if (id === 'final-form') MoonFinalForms.abort();
    if (id === 'chapter-media') MoonChapterMedia.abort();
    if (story.busy && (id === "dialogue" || id === "choice")) return Promise.resolve(false);
    if (id === 'minigame') {
        if (puzzles.running && puzzles.result) return Promise.resolve(puzzles.confirm());
        puzzles.abort();
    }
    const layer = $("#" + id);
    if (!layer || leavingGame) return Promise.resolve(false);
    if (activeOverlay !== id) return MoonUiMotion.hide(layer);
    if (layer.dataset.motion === "closing") return Promise.resolve(false);
    const revision = ++overlayRevision;
    input.clear();
    return MoonUiMotion.hide(layer).then(finished => {
        if (!finished || revision !== overlayRevision || activeOverlay !== id) return false;
        activeOverlay = null;
        document.body.classList.remove("has-modal");
        statusHuds?.obscure(false);
        input.clear();
        if (restoreFocus && overlayReturnFocus?.isConnected) overlayReturnFocus.focus({preventScroll: true});
        if (id === 'ending' && storyMode) {
            if (story.state.flags.game_complete) {
                location.assign('../main/index.html');
                return true;
            }
            MoonLater.startNext(story);
        }
        return true;
    });
}

function openDailyGame(node, game, title) {
    $('#minigame-title').textContent = title;
    puzzles.open({node, game, title});
    openOverlay('minigame');
}

function openMap() {
    if (mapId.startsWith("A")) {
        const notice = $("#map-unavailable");
        notice.hidden = false;
        clearTimeout(mapUnavailableTimer);
        mapUnavailableTimer = setTimeout(() => {
            notice.hidden = true;
        }, 1800);
        return false;
    }
    if (story.state.flags.epilogue) return false;
    updateOverview();
    return openOverlay("overview");
}

function toggleCollision() {
    showCollision = !showCollision;
    updateHud();
}

function toggleDoorInteractions() {
    showDoorInteractions = !showDoorInteractions;
    updateHud();
}

function clearCoordinateSelection() {
    selectedCoordinate = null;
    const output = $("#coordinate-output"), button = $("#copy-coordinate"), status = $("#coordinate-status");
    if (output) output.value = "";
    if (button) button.disabled = true;
    if (status && coordinatePicking) status.textContent = "点击地图，读取未经吸附的逻辑坐标。";
}

function coordinateDraft() {
    if (!selectedCoordinate) return null;
    const objectId = $("#coordinate-object-id").value.trim() || "待填写", shape = $("#coordinate-shape").value;
    const draft = {
        objectId,
        map: mapId,
        x: selectedCoordinate.x,
        y: selectedCoordinate.y,
        walkable: selectedCoordinate.walkable
    };
    if (shape === "circle") draft.interaction = {
        type: "circle",
        cx: selectedCoordinate.x,
        cy: selectedCoordinate.y,
        radius: Number($("#coordinate-radius").value) || 80
    };
    else {
        const width = Number($("#coordinate-width").value) || 160,
            height = Number($("#coordinate-height").value) || 120;
        draft.interaction = {
            type: "rect",
            x: Math.round((selectedCoordinate.x - width / 2) * 10) / 10,
            y: Math.round((selectedCoordinate.y - height / 2) * 10) / 10,
            width,
            height
        };
    }
    return draft;
}

function refreshCoordinateDraft() {
    const draft = coordinateDraft();
    $("#coordinate-output").value = draft ? JSON.stringify(draft, null, 2) : "";
    $("#copy-coordinate").disabled = !draft;
}

function toggleCoordinatePicking() {
    coordinatePicking = !coordinatePicking;
    $("#coordinate-toggle").setAttribute("aria-pressed", String(coordinatePicking));
    $("#coordinate-toggle").textContent = coordinatePicking ? "关闭坐标采集" : "开启坐标采集";
    $("#coordinate-panel").hidden = !coordinatePicking;
    $("#map-game").classList.toggle("is-coordinate-picking", coordinatePicking);
    clearCoordinateSelection();
}

function captureCoordinate(event) {
    if (!debugMode || !coordinatePicking) return;
    const rect = canvas.getBoundingClientRect(),
        scale = Math.min(rect.width / MAP_SIZE.width, rect.height / MAP_SIZE.height);
    const drawWidth = MAP_SIZE.width * scale, drawHeight = MAP_SIZE.height * scale,
        offsetX = (rect.width - drawWidth) / 2, offsetY = (rect.height - drawHeight) / 2;
    const x = (event.clientX - rect.left - offsetX) / scale, y = (event.clientY - rect.top - offsetY) / scale;
    if (x < 0 || y < 0 || x > MAP_SIZE.width || y > MAP_SIZE.height) {
        selectedCoordinate = null;
        $("#coordinate-status").textContent = "点击位置在地图画面之外。";
        refreshCoordinateDraft();
        return;
    }
    const roundedX = Math.round(x * 10) / 10, roundedY = Math.round(y * 10) / 10;
    selectedCoordinate = {x: roundedX, y: roundedY, walkable: isWalkable(mapId, roundedX, roundedY)};
    $("#coordinate-status").textContent = `${mapId} · x ${roundedX} · y ${roundedY} · ${selectedCoordinate.walkable ? "可行走" : "不可行走"}`;
    refreshCoordinateDraft();
}

async function copyCoordinateDraft() {
    const text = $("#coordinate-output").value;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        const output = $("#coordinate-output");
        output.focus();
        output.select();
        document.execCommand("copy");
    }
    $("#coordinate-status").textContent += " · 已复制草稿";
}

function update(now) {
    const dt = Math.min(.05, (now - lastTime) / 1000);
    lastTime = now;
    if (awakening) {
        if (awakeningTime >= 0) {
            awakeningTime += dt;
            const lock = Math.floor(awakeningTime / .6);
            if (lock > awakeningLock && lock <= 3) {
                awakeningLock = lock;
                MoonSound.tone(100 + lock * 30, .13, .03, 'square');
            }
            if (awakeningTime > 2.3) {
                $('#wake-screen').classList.add('wake-glass');
                $('#wake-screen p').textContent = '舱盖上的水汽正在散去……';
            }
            if (awakeningTime > 4.5) {
                awakening = false;
                $('#wake-screen').classList.remove('wake-glass');
                $('#wake-screen').hidden = true;
                statusHuds?.obscure(false);
            }
        }
        render();
        input.endFrame();
        requestAnimationFrame(update);
        return;
    }
    if (!document.hidden && story.state.node === 'H04_PASS2' && story.busy) echoTime += dt;
    if (!document.hidden && activeOverlay === 'minigame') puzzles.tick(dt);
    if (!document.hidden && activeOverlay === 'chapter-media') MoonChapterMedia.tick(dt);
    if (!document.hidden && activeOverlay === 'final-form') MoonFinalForms.tick(dt);
    if (storyMode && !document.hidden) MoonSound.tick(dt, mapId, story.state, moving && !activeOverlay);
    if (!document.hidden && activeOverlay === 'dialogue') {
        dialogueReveal.tick(dt);
        $('#dialogue footer span').textContent = dialogueReveal.complete ? '继续' : '显示全文';
    }
    if (!document.hidden && (!activeOverlay || ['dialogue', 'choice'].includes(activeOverlay))) story.tick(dt);
    if (storyMode && mapReady && !activeOverlay && !story.busy && story.state.node === 'H01' && !story.state.flags.h01_started) h01.start();
    if (storyMode && mapReady && !activeOverlay && !story.busy) {
        if (campaign.node) campaign.automatic(); else day3.automatic();
    }
    if (!activeOverlay) {
        updateMovement(dt);
        if (storyMode) {
            campaign.approach(mapId, position.x, position.y);
            if (!story.busy) MoonInvestigation.notice(story, mapId, position.x);
        }
        const playerFoot = getPlayerFootprint(mapId);
        familyPatrol.update(dt, mapId, {...position, rx: playerFoot.radiusX, ry: playerFoot.radiusY});
        updateDoor();
        if (input.consume("interact")) {
            if (nearestInteraction) {
                if (nearestInteraction.kind === 'campaign' || nearestInteraction.kind === 'campaign-optional') campaign.act(nearestInteraction.id);
                else if (nearestInteraction.kind === 'temperature') {
                    openDailyGame('H02_TEMP', 'temperature', '温控回路 · 消除过热');
                } else if (nearestInteraction.kind === 'lamp') {
                    openDailyGame('H01_LAMP', 'lamp', '楼道灯 · 检查接线');
                } else if (nearestInteraction.kind === 'legacy-temperature') {
                    $('#terminal-title').textContent = '温控终端';
                    $('.terminal-panel .panel-heading small').textContent = '维修区';
                    $('.terminal-body h2').textContent = '温控回路等待复位';
                    $('.terminal-body > p:last-of-type').textContent = '确认后执行回路复位。';
                    $('.terminal-body .primary-action').textContent = '确认复位';
                    openOverlay('terminal');
                } else if (nearestInteraction.kind === 'block') h01.interact(nearestInteraction.id); else if (nearestInteraction.kind === 'plant') openDailyGame('H02_WATER', 'water', '阳台滴灌 · 接通水路');
                else if (nearestInteraction.kind === 'depart') day3.depart();
                else if (nearestInteraction.kind === 'rest') day3.rest();
                else if (nearestInteraction.kind === 'evening') day3.evening();
                else if (nearestInteraction.kind === 'plant-inspect') day3.inspect();
                else if (nearestInteraction.kind === 'npc') h01.talk(nearestInteraction.id); else h01.interact(nearestInteraction.id);
            } else if (nearestDoor) {
                if (storyMode && story.state.node.startsWith('P00')) story.run({
                    id: 'wrist_door_reminder',
                    once: false,
                    queue: [{type: 'line', actor: 'guanghan', text: '先拿起舱旁的腕端终端，完成体征确认后才能离开。'}]
                }); else {
                    const reason = storyMode ? MoonLater.door(story.state, mapId, nearestDoor.to) : '';
                    if (reason) story.run({
                        id: 'door_access_notice',
                        once: false,
                        queue: [{type: 'line', actor: 'guanghan', text: reason}]
                    }); else enterMap(nearestDoor.to);
                }
            }
        }
        if (story.busy) {
            render();
            input.endFrame();
            requestAnimationFrame(update);
            return;
        }
        if (input.consume("map")) openMap();
        if (input.consume("journal")) openOverlay("journal");
        if (debugMode && input.justPressed.has("KeyC")) {
            input.justPressed.delete("KeyC");
            toggleCollision();
        }
        if (input.consume("pause")) openOverlay("pause");
    } else {
        if (activeOverlay === "overview" && input.consume("map")) closeOverlay("overview");
        else if (activeOverlay === "journal" && input.consume("journal")) closeOverlay("journal");
        else if (activeOverlay === "dialogue" && input.justPressed.has("Space")) {
            input.justPressed.delete("Space");
            advanceDialogue();
        } else if (input.consume("pause")) {
            if (["dialogue", "choice", "minigame", "chapter-media", "final-form"].includes(activeOverlay)) openOverlay("pause"); else closeOverlay(activeOverlay);
        }
    }
    render();
    input.endFrame();
    requestAnimationFrame(update);
}

function showChapterEnd() {
    const state = story.state, entry = globalThis.MoonEndings?.entries[state.flags.ending], chapter = entry ? {
        title: entry.title,
        summary: entry.intro
    } : MoonLater.chapters[state.chapter] || MoonLater.chapters[1];
    $('#ending-title').textContent = chapter.title;
    $('#ending .ending-panel small').textContent = entry ? '结局已记录' : '章节完成';
    $('#ending .ending-panel p').textContent = chapter.summary + ' 已保存 ' + MoonEvidence.collected(state).length + ' 项重要记录。';
    $('#ending [data-close]').textContent = state.flags.game_complete ? '返回主菜单' : chapter.next ? '继续第' + (state.chapter + 1) + '章' : '返回基地';
    openOverlay('ending');
    if (entry) window.dispatchEvent(new CustomEvent('moon:ending-visible', {detail: state}));
}

function advanceDialogue() {
    if (activeOverlay !== 'dialogue') return;
    if (story.busy) {
        if (!dialogueReveal.finish()) story.advance();
    } else closeOverlay('dialogue');
}

function bindUi() {
    window.addEventListener('keyup', e => {
        if (e.code === 'Space') puzzles.pouring = false;
        MoonActivities.newRelease?.(puzzles, e.code === 'KeyW' && puzzles.classic?.kind === 'jump' ? 'Space' : e.code);
    });
    window.addEventListener('blur', () => puzzles.pouring = false);
    window.addEventListener('pointerdown', () => MoonSound.unlock(), {once: true});
    window.addEventListener('keydown', () => MoonSound.unlock(), {once: true});
    $('#wake-start').addEventListener('click', () => {
        MoonSound.unlock();
        MoonSound.noise(1.5, .02);
        awakeningTime = 0;
        $('#wake-start').hidden = true;
        $('#wake-screen p').textContent = '舱液排放中……';
    });
    window.addEventListener('moon:campaign-game', event => {
        $('#minigame-title').textContent = event.detail.title;
        puzzles.open(event.detail);
        openOverlay('minigame');
    });
    window.addEventListener('moon:chapter-media', event => {
        const def = MoonCampaign.nodes[event.detail.node];
        if (story.state.node !== def.id) return;
        MoonChapterMedia.open(def.id, () => closeOverlay('chapter-media').then(() => {
            if (story.state.node === def.id) campaign.commit(def);
        }));
        openOverlay('chapter-media');
    });
    window.addEventListener('moon:final-form', event => {
        const def = MoonCampaign.nodes[event.detail.node];
        MoonFinalForms.open(def, story.state, flags => {
            closeOverlay('final-form').then(() => {
                if (story.state.node === def.id) campaign.commit({
                    ...def,
                    effects: {...def.effects, flags: {...def.effects?.flags, ...flags}}
                });
            });
        });
        openOverlay('final-form');
    });
    $('#dialogue .dialogue-box').addEventListener('click', advanceDialogue);
    $('#skip-dialogue').addEventListener('click', () => {
        if (activeOverlay === 'dialogue') {
            dialogueReveal.finish();
            if (!story.skipSegment()) closeOverlay('dialogue');
        }
    });
    $('#pause-save').addEventListener('click', () => openOverlay('save-game'));
    $('#retry-minigame').addEventListener('click', () => {
        if (activeOverlay === 'minigame' && puzzles.retry()) restorePuzzleFullscreen();
    });
    $('.terminal-body .primary-action').addEventListener('click', () => {
        if (storyMode && activeOverlay === 'terminal' && nearestInteraction?.kind === 'temperature' && !story.busy) day3.resetTemperature();
    });
    window.addEventListener("moon:story-presentation", event => {
        const item = event.detail;
        $('#dialogue').dataset.wait = String(item?.type === 'wait');
        $('#story-detail').hidden = !item?.illustration;
        if (item?.illustration) {
            const detail = $('#story-detail');
            detail.replaceChildren();
            detail.classList.toggle('photo-detail', item.illustration === 'photo');
            const img = document.createElement('img');
            if (item.illustration === 'photo') {
                img.src = '../img/props/family/family-photo.png';
                img.alt = '武康、阿芷和小星的家庭合照';
            } else if (item.illustration === 'drawing') {
                img.src = '../img/props/family/xing8-drawing.png';
                img.alt = '小星画的飞船、房屋和在门口等候的一家人';
            }
            if (img.src) detail.append(img);
        }
        if (!item) {
            const closing = activeOverlay === 'dialogue' || activeOverlay === 'choice' ? closeOverlay(activeOverlay) : Promise.resolve();
            if (storyMode && story.state.chapterComplete) closing.then(() => {
                showChapterEnd();
            });
            return;
        }
        if (item.type === "choice") {
            const list = $(".choice-list");
            list.replaceChildren();
            $("#choice-title").textContent = item.text || "请选择回应";
            item.options.forEach(option => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = option.text || option.id;
                button.addEventListener("click", () => story.choose(option.id));
                list.append(button);
            });
            openOverlay("choice");
        } else {
            if (item.type === "line") {
                const actor = MoonCampaign.actors[item.actor] || MoonChapter1.actors[item.actor] || MoonChapter1.actors.system;
                $("#dialogue-speaker").textContent = item.actor === 'wukang' && story.state.flags.player_name ? story.state.flags.player_name : actor.name;
                $("#dialogue-role").textContent = actor.role;
                const labels = {
                    move: ['moveUp', 'moveLeft', 'moveDown', 'moveRight'].map(a => MoonStorage.keyLabel(input.code(a))).join('/'),
                    interact: MoonStorage.keyLabel(input.code('interact')),
                    map: MoonStorage.keyLabel(input.code('map')),
                    journal: MoonStorage.keyLabel(input.code('journal')),
                    pause: MoonStorage.keyLabel(input.code('pause'))
                };
                dialogueReveal.start((item.text || '').replace(/\{(move|interact|map|journal|pause)\}/g, (_, key) => labels[key]));
                const portrait = $("#dialogue-portrait");
                portrait.hidden = !actor.portrait;
                if (actor.portrait) portrait.src = actor.portrait;
                portrait.alt = actor.name;
            }
            openOverlay("dialogue");
        }
    });
    $("#collision-toggle").addEventListener("click", toggleCollision);
    $("#door-shape-toggle").addEventListener("click", toggleDoorInteractions);
    $("#coordinate-toggle").addEventListener("click", toggleCoordinatePicking);
    canvas.addEventListener("click", captureCoordinate);
    $("#coordinate-shape").addEventListener("change", () => {
        $(".coordinate-radius").hidden = $("#coordinate-shape").value !== "circle";
        $(".coordinate-rect").hidden = $("#coordinate-shape").value !== "rect";
        refreshCoordinateDraft();
    });
    ["#coordinate-object-id", "#coordinate-radius", "#coordinate-width", "#coordinate-height"].forEach(selector => $(selector).addEventListener("input", refreshCoordinateDraft));
    $("#copy-coordinate").addEventListener("click", copyCoordinateDraft);
    $("#resume").addEventListener("click", () => closeOverlay("pause"));
    document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => closeOverlay(button.dataset.close)));
    $("#request-main-menu").addEventListener("click", () => openOverlay("leave-confirm"));
    $("#cancel-leave").addEventListener("click", () => openOverlay("pause"));
    $("#pause a[href*='settings']").addEventListener("click", () => {
        if (storyMode) story.save();
        sessionStorage.setItem(runtimeReturnKey, JSON.stringify({
            mapId,
            position: {...position},
            facingRow,
            overviewProgress,
            storyMode
        }));
    });
    document.querySelectorAll('.ui-layer a[href]').forEach(link => link.addEventListener("click", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (leavingGame) return;
        leavingGame = true;
        input.clear();
        MoonUiMotion.hide($("#" + activeOverlay)).then(() => location.assign(link.href));
    }));
    $("#overview").addEventListener("click", event => {
        if (event.target === $("#overview")) closeOverlay("overview");
    });
    document.querySelectorAll('.journal-tabs [role="tab"]').forEach((tab, index) => tab.addEventListener("click", () => {
        document.querySelectorAll('.journal-tabs [role="tab"]').forEach(item => item.setAttribute("aria-selected", String(item === tab)));
        journalEvidence = index === 1;
        updateStoryHud();
    }));
    document.addEventListener("keydown", event => {
        if (event.code === 'Enter' && ['dialogue', 'chapter-media'].includes(activeOverlay) && !input.isEditable(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            input.clear();
            if (!event.repeat) {
                if (activeOverlay === 'dialogue') $('#skip-dialogue').click(); else MoonChapterMedia.skip();
            }
            return;
        }
        if (event.code === 'KeyR' && activeOverlay === 'minigame' && !input.isEditable(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            input.clear();
            if (!event.repeat && puzzles.retry()) restorePuzzleFullscreen();
            return;
        }
        if (activeOverlay === 'minigame' && !input.isEditable(event.target)) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) event.preventDefault();
            if ((['sokoban', 'merge'].includes(puzzles.classic?.kind) && event.code.startsWith('Arrow')) || (['flier', 'runner'].includes(puzzles.classic?.kind) && ['Space', 'ArrowUp'].includes(event.code))) event.preventDefault();
            if (!event.repeat) puzzles.key(event.code);
        }
        if (activeOverlay === "overview" && event.code === input.code("map")) {
            event.preventDefault();
            event.stopPropagation();
            closeOverlay("overview");
            return;
        }
        if (!activeOverlay) return;
        const layer = $("#" + activeOverlay);
        if ((event.code === "ArrowDown" || event.code === "ArrowUp") && activeOverlay === "choice") {
            const choices = focusableElements(layer), current = Math.max(0, choices.indexOf(document.activeElement));
            choices[(current + (event.code === "ArrowDown" ? 1 : -1) + choices.length) % choices.length]?.focus();
            event.preventDefault();
            return;
        }
        if (event.code !== "Tab" || activeOverlay === "overview") return;
        const items = focusableElements(layer);
        if (!items.length) {
            event.preventDefault();
            return;
        }
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            last.focus();
            event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
            first.focus();
            event.preventDefault();
        }
    });
    window.addEventListener("moon:settings-changed", updateHud);
    window.addEventListener("moon:progress-changed", event => {
        const state = MoonStorage.migrateSave(event.detail);
        if (!state) return;
        if (storyMode && state.node !== lastStoryNode) {
            const previous = lastStoryNode;
            lastStoryNode = state.node;
            const target = campaign.destination(state.node, previous) || MoonDay3.destination(state.node);
            if (target) {
                enterMap(target.map, {x: target.x, y: target.y}, true);
                if (target.map === 'F01') facingRow = 4;
            }
        }
        overviewProgress = state;
        updateOverview();
        updateStoryHud();
        configureFamilyStage();
        if (storyMode && initialized && !story.busy) story.save();
    });
    window.addEventListener("moon:game-saved", event => {
        overviewProgress = event.detail;
        updateOverview();
    });
}

function initialize() {
    buildMapSelect();
    bindUi();
    prepareSprites();
    configureFamilyStage();
    if (!debugMode && !params.has("ui")) {
        document.querySelectorAll('.dev-mark').forEach(element => element.hidden = true);
        $("#task-hud small").textContent = "任务";
        $("#task-count").textContent = "0/0";
        $("#task-list").replaceChildren();
        const empty = document.createElement('li');
        empty.textContent = "暂无进行中的任务";
        $("#task-list").append(empty);
        $(".journal-entry p").textContent = "暂无任务记录";
        $(".journal-entry ul").replaceChildren();
        $(".journal-entry b").textContent = "0/0";
    }
    $("#debug-tools").hidden = !debugMode;
    document.querySelectorAll(".debug-key").forEach(item => {
        item.hidden = !debugMode;
    });
    enterMap(mapId, position, true);
    if (runtimeReturn) {
        facingRow = Number.isInteger(runtimeReturn.facingRow) ? runtimeReturn.facingRow : facingRow;
        sessionStorage.removeItem(runtimeReturnKey);
    }
    updateHud();
    statusHuds = MoonUiMotion.statusHuds(document.querySelectorAll("[data-status-hud]"));
    if (storyMode) {
        $('.journal-panel .panel-heading small').textContent = '任务与证据';
        updateStoryHud();
        story.save();
    }
    if (storyMode && params.get('new') === '1') {
        const resumeUrl = new URL(location.href);
        resumeUrl.searchParams.delete('new');
        history.replaceState(null, '', resumeUrl);
    }
    initialized = true;
    if (storyMode && story.state.chapterComplete) requestAnimationFrame(showChapterEnd);
    if (awakening) {
        $('#wake-screen').hidden = false;
        statusHuds.obscure(true);
    }
    window.MoonMapDebug = {
        getState: () => {
            const foot = getPlayerFootprint(mapId);
            return {
                mapId,
                position: {...position},
                velocity: {...velocity},
                playerScale: getPlayerScale(mapId),
                walkable: isWalkable(mapId, position.x, position.y, foot.radiusX, foot.radiusY),
                facingRow,
                mapReady,
                spriteReady,
                spriteSize: spriteReady ? {width: spriteSheet.width, height: spriteSheet.height} : null,
                spacesuitReady,
                spacesuitSize: spacesuitReady ? {width: spacesuitSheet.width, height: spacesuitSheet.height} : null,
                activeSprite: mapId === "R09" ? "spacesuit" : "standard",
                nearestDoor: nearestDoor?.to || null,
                showCollision,
                showDoorInteractions,
                coordinatePicking,
                selectedCoordinate: selectedCoordinate ? {...selectedCoordinate} : null
            };
        }, setMap: id => enterMap(id, null, true), setPosition: (x, y) => {
            position = nearestWalkable({x, y});
            velocity = {x: 0, y: 0};
        }, isWalkable: (id, x, y) => {
            const foot = getPlayerFootprint(id);
            return isWalkable(id, x, y, foot.radiusX, foot.radiusY);
        }, maps: MAPS
    };
    window.MoonUiDebug = {
        open: openOverlay, close: closeOverlay, openMap, get active() {
            return activeOverlay;
        }, states: ["journal", "overview", "pause", "choice", "dialogue", "terminal", "minigame", "ending"]
    };
    const preview = params.get("ui");
    if (window.MoonUiDebug.states.includes(preview)) requestAnimationFrame(() => preview === "overview" ? openMap() : openOverlay(preview));
    requestAnimationFrame(update);
}

initialize();

function renderChapterEnvironment() {
    const s = story.state;
    if (mapId === 'B02' && s.chapter >= 2) {
        ctx.save();
        if (!s.flags.culture_power) {
            ctx.fillStyle = '#000b';
            ctx.fillRect(0, 0, 1672, 941);
        }
        const count = s.flags.pods_lit || 0;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        [1180, 1000, 820, 650, 465].forEach((x, i) => {
            ctx.fillStyle = i < count ? '#ddc886' : '#202b2c';
            ctx.fillRect(x - 40, 372, 80, 30);
            if (i < count) {
                ctx.fillStyle = '#192629';
                ctx.fillText(String(17 - i), x, 395);
            }
        });
        ctx.restore();
    }
    if (mapId === 'F01' && ['S2', 'S3'].includes(s.family_state)) {
        ctx.save();
        ctx.fillStyle = '#030b0ed9';
        ctx.fillRect(225, 38, 265, 102);
        ctx.fillRect(76, 245, 210, 110);
        ctx.strokeStyle = '#54737a';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(230, 65);
        ctx.lineTo(545, 65);
        ctx.lineTo(545, 205);
        ctx.lineTo(1060, 205);
        ctx.stroke();
        ctx.strokeStyle = '#a18b60';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#04141c55';
        ctx.fillRect(0, 0, 1672, 941);
        ctx.restore();
    }
    if (mapId === 'R06' && s.flags.reply_queued) {
        ctx.save();
        ctx.fillStyle = '#d6b557';
        ctx.beginPath();
        ctx.arc(910, 340, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '18px sans-serif';
        ctx.fillText('地球待确认', 930, 348);
        ctx.restore();
    }
    if (mapId === 'R05' && s.node === 'M03_SEE' && walkSheet) {
        const size = getCharacterDrawSize(mapId);
        ctx.save();
        ctx.globalAlpha = .28;
        ctx.drawImage(walkSheet, 0, 4 * 256, 256, 256, 1000 - size.width / 2, 490 - size.height * 244 / 256, size.width, size.height);
        ctx.restore();
    }
}

function restorePuzzleFullscreen() {
    const screen = $('#minigame');
    if (!document.fullscreenElement && screen.requestFullscreen) screen.requestFullscreen().then(() => {
        puzzles.ownsFullscreen = true;
        if (activeOverlay !== 'minigame') puzzles.leaveFullscreen();
    }).catch(() => {
    });
}

function renderGameSaves() {
    overwriteSlot = null;
    $('#save-game-status').textContent = '';
    $('#save-game-note').textContent = story.busy ? '本段对话尚未结束。保存已确认的进度，读档后从本段开始。' : puzzles.running ? '保存当前任务与证据；读档后，本次小游戏从头开始。' : '保存当前所在位置、任务、证据与选择。';
    const root = $('#game-save-slots');
    root.replaceChildren();
    MoonStorage.listSlots().forEach(({id, data}) => {
        const card = document.createElement('article'), label = document.createElement('strong'),
            detail = document.createElement('p'), button = document.createElement('button');
        card.className = 'game-save-slot';
        label.textContent = '存档 ' + String(id).padStart(2, '0');
        detail.textContent = data ? (data.flags.player_name ? data.flags.player_name + ' · ' : '') + '第 ' + data.chapter + ' 章 · 第 ' + data.day + ' 天 · ' + data.currentMap + ' · ' + new Date(data.savedAt).toLocaleString('zh-CN', {hour12: false}) : '空存档';
        button.type = 'button';
        button.dataset.slot = id;
        button.textContent = data ? '覆盖此存档' : '存入此处';
        button.setAttribute('aria-label', '保存到存档 ' + id);
        button.addEventListener('click', () => {
            if (MoonStorage.loadGame(id) && overwriteSlot !== id) {
                overwriteSlot = id;
                root.querySelectorAll('button').forEach(b => b.textContent = MoonStorage.loadGame(Number(b.dataset.slot)) ? '覆盖此存档' : '存入此处');
                button.textContent = '确认覆盖';
                $('#save-game-status').textContent = '再次点击确认覆盖存档 ' + id + '。';
                return;
            }
            if (!story.busy) story.setLocation(mapId, position.x, position.y);
            const saved = story.saveCheckpoint(id);
            if (saved) {
                renderGameSaves();
                $('#save-game-status').textContent = '已保存到存档 ' + id + '。';
                root.querySelector('[data-slot="' + id + '"]').focus();
            } else $('#save-game-status').textContent = '保存失败，浏览器未能写入本地存储，请重试。';
        });
        card.append(label, detail, button);
        root.append(card);
    });
}