"use strict";
(function () {
    const query = new URLSearchParams(location.search), testing = MoonHistory.testing, flowing = MoonHistory.flowing,
        flowchartOnly = query.get('flowchart') === '1';
    const historyKey = 'moon_without_return_flow_history_v1';
    const runtimeSeen = new Set();
    const manual = [
        {id: 'H01', title: '第一天 · 回到家中', chapter: 1, next: 'H01_COMPLETE'}, {
            id: 'H01_COMPLETE',
            title: '第一天结束 · 离家提示',
            chapter: 1,
            next: 'H02_D3_WAKE'
        },
        {id: 'H02_D3_WAKE', title: '第三天 · 休眠区苏醒', chapter: 1, next: 'H02_D3_REAL'}, {
            id: 'H02_D3_REAL',
            title: '第三天 · 维修温控',
            chapter: 1,
            next: 'H02_D3_RETURN'
        },
        {id: 'H02_D3_RETURN', title: '第三天 · 返回休眠舱', chapter: 1, next: 'H02_D3_HOME'}, {
            id: 'H02_D3_HOME',
            title: '第三天 · 给盆栽浇水',
            chapter: 1,
            next: 'H02_D3_WATERED'
        },
        {
            id: 'H02_D3_WATERED',
            title: '第三天 · 晚餐对话',
            chapter: 1,
            next: 'H02_D3_DEPART_HOME'
        }, {id: 'H02_D3_DEPART_HOME', title: '第三天 · 结束休息', chapter: 1, next: 'H02_D3_NEXT_REST'},
        {
            id: 'H02_D3_NEXT_REST',
            title: '第四天 · 返回休眠舱',
            chapter: 1,
            next: 'H02_D3_COMPLETE'
        }, {id: 'H02_D3_COMPLETE', title: '第四天 · 再次回家', chapter: 1, next: 'H02_D5_DEPART'}
    ];
    const definitions = new Map([...manual.map(d => [d.id, d]), ...Object.values(MoonCampaign.nodes).map(d => [d.id, d])]);

    function readBook() {
        try {
            const value = JSON.parse(localStorage.getItem(historyKey) || 'null');
            if (!value || typeof value !== 'object' || Array.isArray(value)) return {
                lineage: 'pending',
                nodes: {},
                lineages: {}
            };
            if (!value.lineages || typeof value.lineages !== 'object') {
                value.lineages = {};
                if (value.lineage) value.lineages[value.lineage] = {nodes: value.nodes || {}};
            }
            if (!value.nodes || typeof value.nodes !== 'object') value.nodes = {};
            if (!value.lineage) value.lineage = 'pending';
            return value;
        } catch {
            return {lineage: 'pending', nodes: {}, lineages: {}};
        }
    }

    function readBookFor(lineage) {
        const book = readBook();
        const stored = lineage && book.lineages && book.lineages[lineage] ? (book.lineages[lineage].nodes || {}) : (book.lineage === lineage ? (book.nodes || {}) : {});
        let logNodes = {};
        if (lineage) {
            try {
                const raw = localStorage.getItem('moon_log_' + lineage), rows = raw ? JSON.parse(raw) : null;
                if (Array.isArray(rows)) for (const row of rows) {
                    if (!row || !row.node || logNodes[row.node]) continue;
                    logNodes[row.node] = {
                        node: row.node,
                        day: Number.isFinite(row.day) ? row.day : 1,
                        schemaVersion: 3,
                        chapter: 1,
                        flags: {log_id: lineage},
                        choices: {},
                        evidence: [],
                        completedTasks: [],
                        currentMap: 'F01',
                        playerPosition: {x: 755.4, y: 743.7},
                        checkpointId: row.node,
                        _placeholder: true
                    };
                }
            } catch (error) {
            }
        }
        return {lineage: lineage || book.lineage || 'pending', nodes: {...logNodes, ...stored}};
    }

    function writeBook(book) {
        try {
            if (!book.lineages || typeof book.lineages !== 'object') book.lineages = {};
            if (book.lineage) book.lineages[book.lineage] = {
                ...book.lineages[book.lineage],
                nodes: book.nodes || book.lineages[book.lineage]?.nodes || {}
            };
            localStorage.setItem(historyKey, JSON.stringify(book));
        } catch {
        }
    }

    function snapshot() {
        const s = story.state;
        return MoonStorage.migrateSave({...s, currentMap: mapId, playerPosition: {...position}}) || s;
    }

    function record() {
        if (flowing || flowchartOnly) return;
        const state = snapshot(), lineage = testing ? '__testing__' : (state.flags.log_id || 'pending'),
            book = readBook();
        runtimeSeen.add(state.node);
        if (!book.lineages || typeof book.lineages !== 'object') book.lineages = {};
        if (!book.lineages[lineage]) book.lineages[lineage] = {nodes: {}};
        book.lineages[lineage].nodes[state.node] = state;
        if (!testing) {
            book.lineage = lineage;
            book.nodes = book.lineages[lineage].nodes;
        }
        writeBook(book);
    }

    setTimeout(record, 80);
    window.addEventListener('moon:progress-changed', event => {
        if (event.detail?.node) runtimeSeen.add(event.detail.node);
        if (activeOverlay === 'story-flow') render();
        setTimeout(record, 80);
    });
    window.addEventListener('moon:game-saved', event => {
        if (event.detail?.node) runtimeSeen.add(event.detail.node);
        if (activeOverlay === 'story-flow') render();
        setTimeout(record, 30);
    });

    const probe = () => {
        const s = MoonStorage.clone(story.state);
        s.flags = {
            ...s.flags,
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
            witness_complete: true
        };
        s.evidence = Object.keys(MoonEvidence.entries);
        s.choices = {
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
        return s;
    };
    for (const [chapter, entry] of Object.entries(MoonLater.chapters)) if (entry.next) definitions.set('CHAPTER' + chapter + '_COMPLETE', {
        id: 'CHAPTER' + chapter + '_COMPLETE',
        title: entry.title + ' · 结束',
        next: entry.next
    });
    definitions.set('GAME_COMPLETE', {id: 'GAME_COMPLETE', title: '结局 · 故事结束'});

    function resolved(def, state) {
        try {
            return def.prepare ? {...def, ...(def.prepare(state) || {})} : def;
        } catch {
            return def;
        }
    }


    function testRoute(current) {
        const pending = [{id: 'P00', cost: 0, path: [], choices: {}}], best = new Map();
        const fallback = probe();
        fallback.choices = {...fallback.choices, ...current.choices};
        while (pending.length) {
            pending.sort((a, b) => a.cost - b.cost);
            const item = pending.shift();
            if (best.has(item.id)) continue;
            best.set(item.id, item);
            const path = [...item.path, item.id];
            if (item.id === current.node) return {nodes: path, choices: item.choices};
            const def = definitions.get(item.id);
            if (!def) continue;
            const variants = [resolved(def, current), resolved(def, fallback)];
            for (const [variant, d] of variants.entries()) {
                const choices = [d.choice, ...(d.queue || []).filter(x => x.type === 'choice')].filter(Boolean);
                const edges = choices.flatMap(choice => choice.options.filter(o => o.effects?.node).map(option => ({
                    id: option.effects.node,
                    choice: choice.id,
                    option: option.id
                })));
                if (!edges.length && d.next) edges.push({id: d.next});
                for (const edge of edges) {
                    if (best.has(edge.id)) continue;
                    const mismatch = edge.choice && current.choices?.[edge.choice] && current.choices[edge.choice] !== edge.option;
                    pending.push({
                        id: edge.id,
                        cost: item.cost + 1 + (mismatch ? 10000 : 0) + variant * 1000,
                        path,
                        choices: edge.choice ? {...item.choices, [edge.choice]: edge.option} : item.choices
                    });
                }
            }
        }


        const entry = Number(current.chapter) > 1 ? MoonLater.chapters[Number(current.chapter) - 1]?.next : 'P00';
        const prefix = best.get(entry);
        return {
            nodes: [...new Set([...(prefix ? [...prefix.path, entry] : ['P00']), current.node])],
            choices: prefix?.choices || {}
        };
    }

    const layer = document.createElement('section');
    layer.id = 'story-flow';
    layer.className = 'overlay ui-layer story-flow-overlay';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'story-flow-title');
    layer.innerHTML = '<div class="panel-large story-flow-panel"><header class="panel-heading"><div><small>STORY ROUTE</small><h1 id="story-flow-title">剧情流程图</h1></div><button type="button" class="flow-close">返回</button></header><div class="flow-toolbar"><input type="search" aria-label="搜索剧情节点" placeholder="搜索剧情或节点编号"><button type="button" class="flow-latest" hidden>返回最新进度</button></div><p class="flow-note"></p><div class="story-flow-chart"></div></div>';
    document.querySelector('#map-game').append(layer);

    const flowChartEl = layer.querySelector('.story-flow-chart');
    let flowDrag = null;
    flowChartEl.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.pointerType !== 'mouse') return;
        flowDrag = {x: e.clientX, y: e.clientY, sl: flowChartEl.scrollLeft, st: flowChartEl.scrollTop, moved: false};
    });
    window.addEventListener('pointermove', e => {
        if (!flowDrag) return;
        const dx = e.clientX - flowDrag.x, dy = e.clientY - flowDrag.y;
        if (!flowDrag.moved && Math.hypot(dx, dy) > 5) {
            flowDrag.moved = true;
            flowChartEl.classList.add('is-dragging');
        }
        if (flowDrag.moved) {
            flowChartEl.scrollLeft = flowDrag.sl - dx;
            flowChartEl.scrollTop = flowDrag.st - dy;
        }
    });
    window.addEventListener('pointerup', () => {
        if (!flowDrag) return;
        if (flowDrag.moved) {
            const blockClick = ev => {
                ev.stopPropagation();
                ev.preventDefault();
            };
            flowChartEl.addEventListener('click', blockClick, true);
            setTimeout(() => flowChartEl.removeEventListener('click', blockClick, true), 0);
        }
        flowDrag = null;
        flowChartEl.classList.remove('is-dragging');
    });
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.textContent = '剧情流程';
    launch.className = 'flow-launch';
    document.querySelector('.pause-panel').append(launch);
    let returnFrom = null, flowFit = null;

    function navigate(url) {
        if (window.self !== window.top) window.parent.postMessage({
            type: 'moon-menu-shell:navigate',
            url: new URL(url, location.href).href
        }, '*'); else location.assign(url);
    }

    function latest() {
        sessionStorage.removeItem('moon_flow_state');
        navigate('./index.html?story=1');
    }

    function jump(id, state) {
        if (testing) {
            location.assign('./index.html?test=1&story=0&selector=1&target=' + encodeURIComponent(id));
            return;
        }
        if (!state) return;
        sessionStorage.setItem('moon_flow_state', JSON.stringify(state));
        navigate('./index.html?flow=1&story=1');
    }

    function escapeFlowText(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function render() {
        const current = snapshot(), requestedLineage = query.get('flowlineage') || current.flags?.log_id || '',
            route = testing ? testRoute(current) : null,
            book = testing ? {nodes: {...((readBook().lineages || {})['__testing__']?.nodes || {})}} : readBookFor(requestedLineage),
            states = book.nodes || {}, chart = layer.querySelector('.story-flow-chart'),
            term = layer.querySelector('input[type="search"]').value.trim().toLowerCase();
        for (const id of route?.nodes || runtimeSeen) {
            if (!states[id]) states[id] = {
                node: id,
                schemaVersion: 3,
                chapter: 1,
                day: 1,
                flags: {log_id: requestedLineage},
                choices: {},
                evidence: [],
                completedTasks: [],
                currentMap: 'F01',
                playerPosition: {x: 755.4, y: 743.7},
                checkpointId: id,
                _placeholder: true
            };
        }
        if (!states[current.node]) states[current.node] = current;
        chart.replaceChildren();
        const v5 = globalThis.MoonStoryFlowV5;
        const note = layer.querySelector('.flow-note');
        if (!v5) {
            note.textContent = 'V5 流程图数据未加载。';
            layer.querySelector('.flow-latest').hidden = !flowing;
            return;
        }
        const targetState = target => {
            const s = states[target];
            return s && !s._placeholder ? s : (target === current.node ? current : null);
        };
        const isReached = target => !!target && (!!states[target] || target === current.node);
        const matches = text => !term || String(text).toLowerCase().includes(term);


        const events = v5.events.slice();
        {
            const p2 = events.findIndex(e => e.id === 'piano2');
            if (p2 >= 0) {
                const ev2 = events.splice(p2, 1)[0];
                const p1 = events.findIndex(e => e.id === 'piano1');
                events.splice(p1 + 1, 0, ev2);
            }
        }

        const evtIdx = new Map();
        for (let i = 0; i < events.length; i++) {
            const t = v5.eventTargets?.[events[i].id];
            if (t) evtIdx.set(t, i);
        }
        let lastIdx = -1;
        {
            const reachedNodes = new Set([current.node, ...Object.keys(states)]);
            for (const n of reachedNodes) {
                const i = evtIdx.get(n);
                if (i !== undefined && i > lastIdx) lastIdx = i;
            }
        }


        const FLAG_CHOICE = {
            WITNESS: {'W-A': 'witness_complete', 'W-B': 'subjective_blind', 'W-C': 'only16'},
            K_AZHI: {'K-C': 'snapshot_restored', 'K-D': 'azhi_autonomy'}
        };
        const probeChoices = testing ? (probe().choices || {}) : null;
        const chosenFor = choiceId => {
            if (!choiceId) return null;
            if (current.choices?.[choiceId]) return current.choices[choiceId];
            if (testing && route.choices?.[choiceId]) return route.choices[choiceId];
            if (testing && probeChoices?.[choiceId]) return probeChoices[choiceId];
            for (const s of Object.values(states)) {
                if (s?.choices?.[choiceId]) return s.choices[choiceId];
            }
            const fm = FLAG_CHOICE[choiceId];
            if (fm) {
                const pools = [current.flags || {}, ...Object.values(states).map(s => s?.flags || {})];
                for (const fl of pools) for (const [opt, f] of Object.entries(fm)) if (fl[f]) return opt;
            }
            return null;
        };
        const specialKinds = ['witness', 'crisis', 'final'];
        const isForkKind = kind => kind === 'choice' || specialKinds.includes(kind);
        const make = spec => {
            const active = !!spec.active, muted = !!spec.muted,
                currentTarget = active && !muted && !!spec.target && spec.target === current.node,
                searchText = (spec.search || [spec.id, spec.title, spec.sub, spec.target]).filter(Boolean).join(' ');
            const show = spec.visible && matches(searchText);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'flow-node ' + (active && !muted ? 'is-unlocked' : 'is-locked') + (muted ? ' is-muted' : '') + (currentTarget ? ' is-current' : '') + ' ' + (spec.kind || 'is-main');
            button.disabled = !active || muted;
            button.hidden = !show;
            button.dataset.flowId = spec.id;
            button.dataset.flowTarget = spec.target || '';
            if (currentTarget) button.setAttribute('aria-current', 'step');
            button.innerHTML = '<span class="flow-node__id">' + escapeFlowText(spec.id) + '</span><span class="flow-node__title">' + escapeFlowText(spec.title) + '</span>';
            button.title = muted ? '未探索的分支' : active ? (testing ? '测试模式：直接进入此节点' : '进入已解锁节点的独立回看') : '尚未到达';
            if (active && !muted && spec.target) button.onclick = () => jump(spec.target, targetState(spec.target) || {
                ...current,
                node: spec.target
            });
            return button;
        };


        const tree = document.createElement('div');
        tree.className = 'flow-tree';
        chart.append(tree);
        const forkOf = ev => {
            const key = specialKinds.includes(ev.kind) ? ({witness: 'W', crisis: 'K', final: 'F'})[ev.kind] : ev.id;
            const choice = specialKinds.includes(ev.kind) ? null : v5.choices[ev.id];
            const list = choice ? (choice.options || []) : ((v5.specialChoices && v5.specialChoices[key]) || []);
            const options = list.map(o => ({option: o, mapped: v5.optionTargets?.[o.id] || {}}));
            return {key, choice, choiceId: choice ? choice.id : key, options};
        };


        const renderChain = (startIdx, container) => {
            for (let k = startIdx; k < events.length; k++) {
                const ev = events[k];
                if (ev.kind === 'chapter') continue;
                if (isForkKind(ev.kind)) {
                    if (k > lastIdx) return;
                    const {key, choice, choiceId, options} = forkOf(ev);

                    const stateChoiceId = options.map(x => x.mapped.choice).find(Boolean) || choiceId;
                    const chosenId = chosenFor(stateChoiceId);

                    if (!chosenId) continue;
                    const host = options.map(x => x.mapped.host).find(Boolean) || '';
                    const fallbackTitle = {W: '查阅十六份记录', K: '家庭危机处理', F: '第十七次决定'}[key];
                    const title = choice ? (choice.title || ev.id) : (ev.title || fallbackTitle || key);
                    const step = document.createElement('div');
                    step.className = 'flow-step has-fork';
                    step.append(make({
                        id: key,
                        title,
                        sub: '选择节点 · 分支',
                        kind: 'is-choice',
                        target: host,
                        active: true,
                        visible: true
                    }));
                    const row = document.createElement('div');
                    row.className = 'flow-fork-row';
                    row.style.setProperty('--cols', String(options.length));
                    step.append(row);
                    let chosenCol = null;
                    options.forEach((x, i) => {
                        const isChosen = !!chosenId && x.option.id === chosenId;
                        const col = document.createElement('div');
                        col.className = 'flow-fork-col' + (isChosen ? ' is-chosen' : '') + (i === 0 ? ' is-first' : '') + (i === options.length - 1 ? ' is-last' : '') + (options.length > 2 && i > 0 && i < options.length - 1 ? ' is-mid' : '');
                        row.append(col);
                        col.append(make({
                            id: x.option.id,
                            title: isChosen ? x.option.title : '?',
                            sub: isChosen ? (x.mapped.target ? '[' + x.mapped.target + '] ' : '') + (x.option.sub || '') : '',
                            kind: 'is-option',
                            target: isChosen ? x.mapped.target || '' : '',
                            active: isChosen,
                            visible: true,
                            muted: !isChosen
                        }));
                        if (isChosen) {
                            chosenCol = document.createElement('div');
                            chosenCol.className = 'flow-sub';
                            col.append(chosenCol);
                        }
                    });
                    container.append(step);
                    if (chosenCol) {
                        renderChain(k + 1, chosenCol);
                        if (key === 'F') {
                            const endingKey = (!testing || ['V_END_ROUTE', 'GAME_COMPLETE'].includes(current.node)) ? (current.flags?.ending || Object.values(states).map(s => s?.flags?.ending).find(Boolean) || '') : '';
                            const routeEntry = Object.entries(v5.routeEndings || {}).find(([, endKey]) => endKey === endingKey);
                            const routeDef = (v5.routes || []).find(r => r.id === routeEntry?.[0]);
                            if (routeDef) {
                                const endStep = document.createElement('div');
                                endStep.className = 'flow-step';
                                endStep.append(make({
                                    id: 'END_' + routeDef.id,
                                    title: '结局 · ' + routeDef.name,
                                    sub: routeDef.group || '',
                                    kind: 'is-truth',
                                    target: '',
                                    active: true,
                                    visible: true
                                }));
                                chosenCol.append(endStep);
                            }
                        }
                        return;
                    }
                    continue;
                }
                const target = v5.eventTargets?.[ev.id] || '';
                if (k > lastIdx) return;

                if (ev.kind === 'optional' && target && !isReached(target)) continue;
                const step = document.createElement('div');
                step.className = 'flow-step';
                step.append(make({
                    id: ev.id,
                    title: ev.title || ev.id,
                    sub: (target ? '[' + target + '] ' : '') + (ev.sub || ''),
                    kind: ev.kind === 'reveal' ? 'is-reveal' : ev.kind === 'truth' ? 'is-truth' : ev.kind === 'optional' ? 'is-optional' : 'is-main',
                    target,
                    active: true,
                    visible: true
                }));
                container.append(step);
            }
        };
        renderChain(0, tree);


        const fitFlowTree = () => {
            const treeR = tree.getBoundingClientRect();
            if (!treeR.width) return;
            const cs = getComputedStyle(tree);
            const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0,
                padB = parseFloat(cs.paddingBottom) || 0;
            let overL = 0, overR = 0, overB = 0;
            tree.querySelectorAll('.flow-sub,.flow-fork-row,.flow-step,.flow-node').forEach(s => {
                const r = s.getBoundingClientRect();
                if (!r.width && !r.height) return;
                overL = Math.max(overL, treeR.left - r.left);
                overR = Math.max(overR, r.right - treeR.right);
                overB = Math.max(overB, r.bottom - treeR.bottom);
            });
            if (overL > 1 || overR > 1) {
                const pad = Math.ceil(Math.max(padL, padR) + Math.max(overL, overR) + 16);
                tree.style.paddingLeft = pad + 'px';
                tree.style.paddingRight = pad + 'px';
            }
            if (overB > 1) tree.style.paddingBottom = Math.ceil(padB + overB + 24) + 'px';
        };

        const centerOnCard = el => {
            const margin = 26;
            const r0 = el.getBoundingClientRect(), c0 = chart.getBoundingClientRect();
            chart.scrollLeft = Math.max(0, chart.scrollLeft + r0.left - c0.left - (c0.width - r0.width) / 2);
            chart.scrollTop = Math.max(0, chart.scrollTop + r0.top - c0.top - (c0.height - r0.height) / 2);
            const r = el.getBoundingClientRect(), c = chart.getBoundingClientRect();
            if (r.left < c.left + margin) chart.scrollLeft = Math.max(0, chart.scrollLeft - (c.left + margin - r.left));
            if (r.right > c.right - margin) chart.scrollLeft = chart.scrollLeft + (r.right - (c.right - margin));
            if (r.top < c.top + margin) chart.scrollTop = Math.max(0, chart.scrollTop - (c.top + margin - r.top));
            if (r.bottom > c.bottom - margin) chart.scrollTop = chart.scrollTop + (r.bottom - (c.bottom - margin));
        };
        const locateFlow = () => {
            fitFlowTree();
            const currentCard = tree.querySelector('.flow-node.is-current:not([hidden])');
            if (currentCard && !term) centerOnCard(currentCard);
            else if (!term) chart.scrollTo({left: Math.max(0, (tree.scrollWidth - chart.clientWidth) / 2), top: 0});
        };
        if (!layer.hidden) requestAnimationFrame(locateFlow);
        flowFit = locateFlow;
        note.textContent = '主线剧情居中向下；走过的选择题按选项顺序分出多列，已选选项向下延续后续剧情并以其为中心；没有做过的选择不在图中出现。按住鼠标左键拖动可平移画面。';
        layer.querySelector('.flow-latest').hidden = !flowing;
    }

    function open() {
        returnFrom = activeOverlay;
        render();
        const shown = openOverlay('story-flow');
        if (shown && shown.then) shown.then(() => {
            if (flowFit) flowFit();
        }).catch(() => {
        }); else if (flowFit) requestAnimationFrame(() => flowFit());
    }

    launch.onclick = open;
    layer.querySelector('.flow-close').onclick = () => {
        if (flowchartOnly) {
            navigate('../main/index.html');
            return;
        }
        const target = returnFrom;
        returnFrom = null;


        if (target === 'pause') {
            closeOverlay('story-flow').then(() => {
                if (!activeOverlay) openOverlay('pause');
            });
            return;
        }
        if (target) openOverlay(target); else closeOverlay('story-flow');
    };
    layer.querySelector('input[type="search"]').oninput = render;
    layer.querySelector('.flow-latest').onclick = latest;
    if (flowing) {
        const banner = document.createElement('aside');
        banner.className = 'flow-replay-banner';
        banner.innerHTML = '<span>独立剧情回看</span><button type="button">剧情流程</button><button type="button">返回最新进度</button>';
        banner.querySelectorAll('button')[0].onclick = open;
        banner.querySelectorAll('button')[1].onclick = latest;
        document.querySelector('#map-game').append(banner);
    }
    if (flowchartOnly) requestAnimationFrame(() => open());
    globalThis.MoonStoryFlow = {open, record, history: () => readBook()};
})();
