"use strict";
(function () {
    const el = (tag, text, className) => {
        const e = document.createElement(tag);
        if (text) e.textContent = text;
        if (className) e.className = className;
        return e;
    };

    function panel(id, title) {
        const layer = el('section', null, 'overlay ui-layer log-overlay');
        layer.id = id;
        layer.hidden = true;
        layer.setAttribute('role', 'dialog');
        layer.setAttribute('aria-modal', 'true');
        layer.setAttribute('aria-label', title);
        const box = el('div', null, 'panel-large test-jump-panel'), head = el('header', null, 'panel-heading');
        head.append(el('h2', title));
        const close = el('button', '返回');
        head.append(close);
        box.append(head);
        layer.append(box);
        document.querySelector('#map-game').append(layer);
        return {layer, box, close};
    }

    const log = panel('story-log', 'LOG · 剧情回看'), search = el('input'), list = el('div');
    search.placeholder = '搜索角色或对白';
    search.setAttribute('aria-label', '搜索剧情');
    log.box.append(search, list);
    let returnFrom = null;
    const names = {
        wukang: '武康',
        azhi: '阿芷',
        xing8: '小星',
        xing26: '小星',
        system: '系统',
        guanghan: '广寒子',
        archive: '档案武康'
    };

    function renderLog() {
        list.replaceChildren();
        const rows = MoonHistory.rows(story).filter(r => !search.value || (r.text + (names[r.actor] || r.actor)).includes(search.value));
        if (!rows.length) list.append(el('p', '还没有符合条件的剧情记录。'));
        for (const r of rows) {
            const row = el('article', null, 'log-row');
            row.append(el('b', (names[r.actor] || r.actor) + ' · 第 ' + r.day + ' 天'), el('p', r.text.replace(/\{(move|interact|map|journal|pause)\}/g, (_, k) => ({
                move: 'W / A / S / D',
                interact: MoonStorage.keyLabel(input.code('interact')),
                map: MoonStorage.keyLabel(input.code('map')),
                journal: MoonStorage.keyLabel(input.code('journal')),
                pause: MoonStorage.keyLabel(input.code('pause'))
            })[k])));
            list.append(row);
        }
    }

    function showLog() {
        returnFrom = activeOverlay;
        renderLog();
        openOverlay('story-log');
        if (!search.value) requestAnimationFrame(() => log.box.scrollTop = log.box.scrollHeight);
    }

    log.close.onclick = () => {
        const target = returnFrom;
        returnFrom = null;
        if (target) openOverlay(target); else closeOverlay('story-log');
    };
    search.oninput = renderLog;
    for (const parent of [document.querySelector('#pause .pause-panel') || document.querySelector('#pause>div'), document.querySelector('#dialogue')]) {
        const b = el('button', 'LOG · 回看');
        b.className = 'story-log-button';
        b.onclick = showLog;
        parent?.append(b);
    }
    document.addEventListener('keydown', e => {
        if (e.code === 'KeyL' && !input.isEditable(e.target) && !['minigame', 'final-form', 'chapter-media'].includes(activeOverlay)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            input.clear();
            if (activeOverlay === 'story-log') log.close.click(); else showLog();
        }
        if (e.code === 'Escape' && activeOverlay === 'story-log') {
            e.preventDefault();
            e.stopImmediatePropagation();
            input.clear();
            log.close.click();
        }
    }, true);
    const pause = document.querySelector('#pause>div'), testLink = el('a', '测试跳转 · 章节 / 小游戏');
    testLink.href = './test.html';
    testLink.target = '_blank';
    testLink.rel = 'noopener';
    pause?.append(testLink);
    const selectorMode = MoonHistory.testing && new URLSearchParams(location.search).get('selector') === '1';
    if (selectorMode) {
        document.body.classList.add('test-selector-mode');
        const test = panel('test-jump', '测试跳转'),
            notice = el('p', '测试模式已全解锁。可修改全部剧情选项、跳过前置剧情、直接进入任意节点或按当前选项进入结局；获得的结局成就会正常保留。'),
            toolbar = el('div', null, 'test-toolbar'), filter = el('input'), difficulty = el('select'),
            tabs = el('select'), grid = el('div', null, 'test-node-grid');
        filter.placeholder = '搜索节点、任务、选项或小游戏';
        filter.setAttribute('aria-label', '搜索测试项目');
        for (const [v, t] of [['story', '剧情节点'], ['choices', '全部剧情选项'], ['games', '单独小游戏'], ['maps', '自由查看地图'], ['endings', '结局与成就']]) {
            const o = el('option', t);
            o.value = v;
            tabs.append(o);
        }
        tabs.setAttribute('aria-label', '测试分类');
        for (const [v, t] of [['easy', '轻松'], ['normal', '普通'], ['hard', '困难']]) {
            const o = el('option', t);
            o.value = v;
            difficulty.append(o);
        }
        difficulty.value = MoonStorage.loadSettings().difficulty;
        difficulty.setAttribute('aria-label', '测试难度');
        toolbar.append(tabs, filter, difficulty);
        test.box.append(notice, toolbar, grid);
        test.close.textContent = '退出测试';
        test.close.onclick = () => location.replace('../main/index.html');

        function spawn(map, target) {
            const f = MoonMapConfig.getPlayerFootprint(map), x = target?.interactX ?? target?.x ?? 836,
                y = target?.interactY ?? target?.y ?? 550;
            for (let r = 0; r < 900; r += 8) for (let a = 0; a < Math.PI * 2; a += .18) {
                const p = {x: x + Math.cos(a) * r, y: y + Math.sin(a) * r};
                if (MoonMapConfig.isWalkable(map, p.x, p.y, f.radiusX, f.radiusY)) return p;
            }
            return MoonMapConfig.MAPS[map].doors[0]?.spawn || {x: 836, y: 550};
        }

        const defaultChoices = {
            C01: 'C01B',
            C02: 'C02B',
            C03: 'C03B',
            C04: 'C04B',
            C05: 'C05A',
            C06: 'C06A',
            C07: 'C07B',
            C08: 'C08B',
            C09: 'C09A',
            C10: 'C10A',
            C12: 'C12A',
            C13: 'C13B',
            C14: 'C14A',
            C15: 'C15A',
            C16: 'C16A',
            FINAL: 'F-A'
        };
        const richFlags = {
            bio17: true,
            index12: true,
            lift_unlocked: true,
            independent17: true,
            core_access: true,
            bio_area_access: true,
            wrist_acquired: true,
            h01_started: true,
            azhi_night1: true,
            azhi_night2: true,
            azhi_night3: true,
            auth_restored: true,
            termination_draft: true,
            family_plan_ready: true,
            copy_permission: true,
            rescue_confirmed: true,
            unmanned_ship: true,
            witness_complete: true,
            refuse_name: true,
            detonation_confirmed: true,
            piano_success_1: true,
            piano_success_2: true,
            archive_status: 'independent',
            azhi_statement: 'leave',
            v5_migrated: true
        };
        const mergeEffects = (state, effects = {}) => {
            const next = MoonStorage.clone(state);
            for (const key of ['chapter', 'day', 'mental_value', 'family_state', 'piano_clear', 'chapterComplete', 'checkpointId']) if (Object.hasOwn(effects, key)) next[key] = effects[key];
            for (const key of ['evidence', 'completedTasks']) next[key] = [...new Set([...next[key], ...(effects[key] || [])])];
            for (const key of ['flags', 'choices', 'minigameResults']) next[key] = {...next[key], ...(effects[key] || {})};
            return next;
        };
        const routeStates = new Map(), routeRequirements = new Map(), routeQueue = [];

        function seedRoute(id, chapter, day) {
            const s = MoonStorage.defaultGameState();
            Object.assign(s, {
                node: id,
                chapter,
                day,
                family_state: 'S2',
                mental_value: 100,
                evidence: Object.keys(globalThis.MoonEvidence?.entries || {}),
                choices: {...defaultChoices},
                flags: {...richFlags}
            });
            if (!routeStates.has(id)) {
                routeStates.set(id, s);
                routeRequirements.set(id, {});
                routeQueue.push(id);
            }
        }

        seedRoute('P00', 0, 1);
        seedRoute('H02_D5_DEPART', 1, 5);
        for (const [chapter, entry] of Object.entries(MoonLater.chapters)) if (entry.next) seedRoute(entry.next, Number(chapter) + 1, MoonCampaign.nodes[entry.next]?.effects?.day || 1);
        for (let k = 0; k < routeQueue.length; k++) {
            const id = routeQueue[k], source = routeStates.get(id), original = MoonCampaign.nodes[id];
            if (!original) continue;
            let d = original;
            try {
                if (d.prepare) d = {...d, ...(d.prepare(source) || {})};
            } catch {
            }
            let after = mergeEffects(source, {...d.effects, completedTasks: [d.id]});
            after.node = id;
            after.chapter = d.effects?.chapter ?? after.chapter;
            after.day = d.effects?.day ?? after.day;
            const choices = [d.choice, ...(d.queue || []).filter(item => item.type === 'choice')].filter(Boolean);
            const edges = choices.length ? choices.flatMap(choice => choice.options.map(option => ({
                node: option.effects?.node,
                choice,
                option
            }))) : [{node: d.next}];
            for (const edge of edges) {
                if (!edge.node || routeStates.has(edge.node)) continue;
                let candidate = MoonStorage.clone(after), requirements = {...routeRequirements.get(id)};
                if (edge.choice) {
                    candidate.choices[edge.choice.id] = edge.option.id;
                    requirements[edge.choice.id] = edge.option.id;
                    candidate = mergeEffects(candidate, edge.option.effects);
                }
                candidate.node = edge.node;
                routeStates.set(edge.node, candidate);
                routeRequirements.set(edge.node, requirements);
                routeQueue.push(edge.node);
            }
        }
        const choiceCatalog = new Map();

        function rememberChoice(choice) {
            if (!choice?.id || !Array.isArray(choice.options)) return;
            const saved = choiceCatalog.get(choice.id) || {
                id: choice.id,
                text: choice.text || choice.id,
                options: new Map()
            };
            if (choice.text) saved.text = choice.text;
            for (const option of choice.options) saved.options.set(option.id, option);
            choiceCatalog.set(choice.id, saved);
        }

        function inspectChoiceDef(def, state) {
            let d = def;
            try {
                if (d.prepare) d = {...d, ...(d.prepare(state) || {})};
            } catch {
            }
            rememberChoice(d.choice);
            for (const item of d.queue || []) if (item.type === 'choice') rememberChoice(item);
        }

        const probeState = MoonStorage.defaultGameState();
        Object.assign(probeState, {
            chapter: 7,
            node: 'V_FINAL',
            family_state: 'S2',
            mental_value: 100,
            evidence: Object.keys(globalThis.MoonEvidence?.entries || {}),
            choices: {...defaultChoices},
            flags: {...richFlags}
        });
        for (const d of Object.values(MoonCampaign.nodes)) inspectChoiceDef(d, probeState);
        for (let pass = 0; pass < 2; pass++) {
            const probes = [probeState, {...MoonStorage.clone(probeState), flags: {v5_migrated: true}}];
            for (const choice of choiceCatalog.values()) for (const option of choice.options.values()) {
                const p = MoonStorage.clone(probeState);
                p.choices[choice.id] = option.id;
                if (option.effects?.flags) Object.assign(p.flags, option.effects.flags);
                probes.push(p);
            }
            for (const p of probes) for (const d of Object.values(MoonCampaign.nodes)) inspectChoiceDef(d, p);
        }
        let selectedChoices = {};
        try {
            selectedChoices = JSON.parse(sessionStorage.getItem('moon_test_choices') || '{}') || {};
        } catch {
        }
        for (const choice of choiceCatalog.values()) {
            const options = [...choice.options.keys()];
            if (!options.includes(selectedChoices[choice.id])) selectedChoices[choice.id] = options.includes(defaultChoices[choice.id]) ? defaultChoices[choice.id] : options[0];
        }

        function saveChoices() {
            sessionStorage.setItem('moon_test_choices', JSON.stringify(selectedChoices));
        }

        function buildState(node, respectRoute = true) {
            const d = MoonCampaign.nodes[node], routed = routeStates.get(node);
            let s = routed ? MoonStorage.clone(routed) : MoonStorage.defaultGameState();
            s.node = node;
            s.day = routed?.day ?? d?.effects?.day ?? 1;
            s.chapter = routed?.chapter ?? d?.effects?.chapter ?? (/^[KE]/.test(node) ? 4 : /^[VF]/.test(node) ? 6 : 1);
            if (node.startsWith('H02_D3')) {
                s.chapter = 1;
                s.day = 3;
            }
            s.mental_value = 100;
            s.chapterComplete = false;
            s.family_state = s.family_state === 'S0' ? 'S2' : s.family_state;
            s.flags = {...richFlags, ...s.flags, h01_started: node !== 'H01'};
            s.choices = {...defaultChoices, ...s.choices, ...selectedChoices, ...(respectRoute ? routeRequirements.get(node) : {})};
            for (const choice of choiceCatalog.values()) {
                const option = choice.options.get(s.choices[choice.id]);
                if (option) s = mergeEffects(s, option.effects);
            }
            s.node = node;
            s.evidence = [...new Set([...s.evidence, ...Object.keys(globalThis.MoonEvidence?.entries || {})])];
            s.configVersion = MoonMapConfig.CONFIG_VERSION;
            return s;
        }

        function jump(node, mapOnly) {
            const d = MoonCampaign.nodes[node], s = buildState(node), special = {
                H01: {map: 'F01', x: 755.4, y: 743.7},
                H01_COMPLETE: {map: 'F01', x: 755.4, y: 743.7},
                H02_D3_DEPART_HOME: {map: 'F01', x: 755.4, y: 743.7}
            };
            const target = d?.warp || d?.targets?.[0] || MoonDay3.destination(node) || special[node] || {
                map: 'R03',
                x: 860,
                y: 480
            };
            s.currentMap = mapOnly || target.map;
            s.playerPosition = spawn(s.currentMap, target);
            sessionStorage.setItem('moon_test_state', JSON.stringify(s));
            sessionStorage.setItem('moon_test_difficulty', difficulty.value);
            location.href = './index.html?test=1&story=' + (mapOnly ? '0&map=' + mapOnly : '1');
        }

        function enterCalculatedEnding() {
            const s = buildState('V_END_ROUTE', false), result = MoonEndings.resolve(s);
            Object.assign(s, {
                node: 'V_END_ROUTE',
                chapter: 7,
                chapterComplete: false,
                currentMap: 'B04',
                playerPosition: spawn('B04', {x: 820, y: 520})
            });
            s.flags = {...s.flags, game_complete: false, ending: result.id};
            sessionStorage.setItem('moon_test_state', JSON.stringify(s));
            sessionStorage.setItem('moon_test_difficulty', difficulty.value);
            location.href = './index.html?test=1&story=1';
        }

        function renderChoices() {
            grid.className = 'test-choice-grid';
            const preview = el('section', null, 'test-ending-preview'),
                result = MoonEndings.resolve(buildState('V_END_ROUTE', false)), ending = MoonEndings.entries[result.id];
            preview.innerHTML = MoonEndings.medal(ending.id);
            preview.append(el('div', null));
            preview.lastChild.append(el('b', '当前组合：' + ending.title), el('p', ending.intro));
            const enter = el('button', '按当前选项进入结局剧情并获得成就');
            enter.onclick = enterCalculatedEnding;
            preview.append(enter);
            grid.append(preview);
            for (const choice of [...choiceCatalog.values()].filter(c => (c.id + ' ' + c.text + [...c.options.values()].map(o => o.text).join(' ')).toLowerCase().includes(filter.value.toLowerCase()))) {
                const card = el('label', null, 'test-choice-card'), title = el('span', choice.text),
                    id = el('small', choice.id), select = el('select');
                select.setAttribute('aria-label', choice.id + ' ' + choice.text);
                for (const option of choice.options.values()) {
                    const o = el('option', option.text || option.id);
                    o.value = option.id;
                    select.append(o);
                }
                select.value = selectedChoices[choice.id];
                select.onchange = () => {
                    selectedChoices[choice.id] = select.value;
                    saveChoices();
                    fill();
                };
                card.append(title, id, select);
                grid.append(card);
            }
        }

        function fill() {
            grid.replaceChildren();
            grid.className = 'test-node-grid';
            if (tabs.value === 'choices') {
                renderChoices();
                return;
            }
            const releasedGames = new Set(Object.values(MoonCampaign.nodes).map(d => d.game).filter(Boolean));
            ['water', 'lamp', 'temperature'].forEach(id => releasedGames.add(id));
            let entries = tabs.value === 'endings' ? Object.values(MoonEndings.entries).map(d => ({
                id: d.id,
                title: d.title
            })) : tabs.value === 'games' ? Object.entries(MoonActivities.descriptions).filter(([id]) => releasedGames.has(id)).map(([id, title]) => ({
                id,
                title
            })) : tabs.value === 'maps' ? Object.entries(MoonMapConfig.MAPS).map(([id, d]) => ({
                id,
                title: d.name
            })) : Object.values(MoonCampaign.nodes).map(d => ({id: d.id, title: d.title})).concat([{
                id: 'H01',
                title: '第一天 · 回到家中'
            }, {id: 'H01_COMPLETE', title: '第一天结束 · 离家提示'}, {
                id: 'H02_D3_WAKE',
                title: '第三天 · 休眠区苏醒'
            }, {id: 'H02_D3_REAL', title: '第三天 · 维修温控'}, {
                id: 'H02_D3_RETURN',
                title: '第三天 · 返回休眠舱'
            }, {id: 'H02_D3_HOME', title: '第三天 · 给盆栽浇水'}, {
                id: 'H02_D3_WATERED',
                title: '第三天 · 晚餐对话'
            }, {id: 'H02_D3_DEPART_HOME', title: '第三天 · 结束休息'}, {
                id: 'H02_D3_NEXT_REST',
                title: '第四天 · 返回休眠舱'
            }, {id: 'H02_D3_COMPLETE', title: '第四天 · 再次回家'}]);
            if (tabs.value === 'games') entries.push({id: 'piano', title: '钢琴 · 节奏演奏'});
            for (const item of entries.filter(d => (d.id + ' ' + d.title).toLowerCase().includes(filter.value.toLowerCase()))) {
                const b = el('button', item.title);
                b.append(el('small', item.id));
                b.onclick = () => {
                    if (tabs.value === 'endings') {
                        const s = buildState('GAME_COMPLETE');
                        Object.assign(s, {
                            node: 'GAME_COMPLETE',
                            chapter: 7,
                            chapterComplete: true,
                            currentMap: 'R03',
                            playerPosition: {x: 860, y: 480},
                            configVersion: MoonMapConfig.CONFIG_VERSION,
                            flags: {
                                ...s.flags,
                                game_complete: true,
                                ending: item.id,
                                ending_overlays: '',
                                v5_migrated: true
                            }
                        });
                        sessionStorage.setItem('moon_test_state', JSON.stringify(s));
                        location.href = './index.html?test=1&story=1';
                        return;
                    }
                    if (tabs.value === 'games') {
                        puzzles.open({
                            node: 'TEST_' + item.id,
                            game: item.id,
                            title: item.title
                        }, {difficulty: difficulty.value});
                        openOverlay('minigame');
                    } else jump(item.id, tabs.value === 'maps' ? item.id : null);
                };
                grid.append(b);
            }
        }

        filter.oninput = fill;
        tabs.onchange = fill;
        fill();
        const requested = new URLSearchParams(location.search).get('target');
        if (requested && (MoonCampaign.nodes[requested] || requested.startsWith('H0'))) setTimeout(() => jump(requested), 0); else setTimeout(() => openOverlay('test-jump'), 0);
        const confirm = puzzles.confirm.bind(puzzles);
        puzzles.confirm = function () {
            if (this.info.node.startsWith('TEST_') && this.result && !this.continueButton.disabled) {
                this.running = false;
                this.leaveFullscreen();
                openOverlay('test-jump');
                return true;
            }
            return confirm();
        };
    }
    const guide = el('aside', null, 'basement-guide');
    guide.hidden = true;
    guide.setAttribute('aria-label', '地下层引导');
    const dismiss = el('button', '知道了'), text = el('p'), route = el('button', 'TAB · 查看路线');
    guide.append(dismiss, text, route);
    document.querySelector('#map-game').append(guide);
    const seen = new Set();
    dismiss.onclick = () => {
        seen.add(mapId);
        guide.hidden = true;
    };
    route.onclick = () => {
        seen.add(mapId);
        guide.hidden = true;
        openMap();
    };
    setInterval(() => {
        if (!mapId.startsWith('B') || activeOverlay || seen.has(mapId)) {
            guide.hidden = true;
            return;
        }
        const target = campaign.node?.targets?.[0];
        text.textContent = '地下层 · ' + MAPS[mapId].name + '。' + (target ? '当前目标：' + campaign.node.title + '，位于 ' + (MAPS[target.map]?.name || target.map) + '。' : '先查看终端与门旁标识。') + ' 靠近设备或门按 F；TAB 地图显示当前位置和任务标记，Q 查看证据。';
        guide.hidden = false;
    }, 500);
    globalThis.MoonTestUI = {showLog};
})();
