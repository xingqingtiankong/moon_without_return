"use strict";
(function () {
    const query = new URLSearchParams(location.search), testing = MoonHistory.testing, flowing = MoonHistory.flowing;
    const historyKey = 'moon_without_return_flow_history_v1';
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
    const definitions = new Map([...Object.values(MoonCampaign.nodes).map(d => [d.id, d]), ...manual.map(d => [d.id, d])]);
    const chapterTitles = {
        0: '序章',
        1: '第一章 · 家',
        2: '第二章 · 我的过去',
        3: '第三章 · 前十六个人',
        4: '第四章 · 谁是凶手',
        5: '第五章 · 证明它已经结束',
        6: '第六章 · 最后一个夜晚',
        7: '终章 · 第一次离开'
    };

    function readBook() {
        try {
            const value = JSON.parse(localStorage.getItem(historyKey) || 'null');
            return value && typeof value === 'object' && !Array.isArray(value) && value.nodes ? value : {
                lineage: 'pending',
                nodes: {}
            };
        } catch {
            return {lineage: 'pending', nodes: {}};
        }
    }

    function writeBook(book) {
        try {
            localStorage.setItem(historyKey, JSON.stringify(book));
        } catch {
        }
    }

    function snapshot() {
        const s = story.state;
        return MoonStorage.migrateSave({...s, currentMap: mapId, playerPosition: {...position}}) || s;
    }

    function record() {
        if (testing || flowing) return;
        const state = snapshot(), lineage = state.flags.log_id || 'pending', book = readBook();
        if (lineage === 'pending' && book.lineage !== 'pending') {
            book.lineage = 'pending';
            book.nodes = {};
        } else if (book.lineage !== 'pending' && lineage !== 'pending' && book.lineage !== lineage) {
            book.lineage = lineage;
            book.nodes = {};
        } else if (book.lineage === 'pending' && lineage !== 'pending') book.lineage = lineage;
        book.nodes[state.node] = state;
        writeBook(book);
    }

    setTimeout(record, 80);
    window.addEventListener('moon:progress-changed', () => setTimeout(record, 80));
    window.addEventListener('moon:game-saved', () => setTimeout(record, 30));

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

    function resolved(def) {
        try {
            return def.prepare ? {...def, ...(def.prepare(probe()) || {})} : def;
        } catch {
            return def;
        }
    }

    function outgoing(def) {
        const d = resolved(def),
            choices = [d.choice, ...(d.queue || []).filter(x => x.type === 'choice')].filter(Boolean),
            ids = choices.flatMap(c => c.options.map(o => o.effects?.node)).filter(Boolean);
        if (!ids.length && d.next) ids.push(d.next);
        return [...new Set(ids)];
    }

    const chapterByNode = new Map(manual.map(d => [d.id, d.chapter])), order = new Map(), walk = [];

    function seed(id, chapter) {
        if (!id || chapterByNode.has(id)) return;
        chapterByNode.set(id, chapter);
        walk.push(id);
    }

    seed('P00', 0);
    seed('H02_D5_DEPART', 1);
    for (const [chapter, entry] of Object.entries(MoonLater.chapters)) if (entry.next) seed(entry.next, Number(chapter) + 1);
    for (let i = 0; i < walk.length; i++) {
        const id = walk[i], d = definitions.get(id);
        order.set(id, i);
        if (d) for (const next of outgoing(d)) if (!chapterByNode.has(next)) {
            chapterByNode.set(next, d.effects?.chapter ?? chapterByNode.get(id));
            walk.push(next);
        }
    }
    manual.forEach((d, i) => order.set(d.id, -100 + i));

    function chapterOf(id) {
        if (chapterByNode.has(id)) return chapterByNode.get(id);
        if (/^M/.test(id)) return 2;
        if (/^S/.test(id)) return 3;
        if (/^K/.test(id)) return 4;
        if (/^T/.test(id)) return 5;
        if (/^E/.test(id)) return 6;
        if (/^F|GAME|DREAM/.test(id)) return 7;
        return 7;
    }

    const layer = document.createElement('section');
    layer.id = 'story-flow';
    layer.className = 'overlay ui-layer story-flow-overlay';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'story-flow-title');
    layer.innerHTML = '<div class="panel-large story-flow-panel"><header class="panel-heading"><div><small>STORY ROUTE</small><h1 id="story-flow-title">剧情流程图</h1></div><button type="button" class="flow-close">返回</button></header><div class="flow-toolbar"><input type="search" aria-label="搜索剧情节点" placeholder="搜索剧情或节点编号"><label><input type="checkbox" class="flow-unlocked-only"> 只看已解锁</label><button type="button" class="flow-latest" hidden>返回最新进度</button></div><p class="flow-note"></p><div class="story-flow-chart"></div></div>';
    document.querySelector('#map-game').append(layer);
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.textContent = '剧情流程';
    launch.className = 'flow-launch';
    document.querySelector('.pause-panel').append(launch);
    let returnFrom = null;

    function latest() {
        sessionStorage.removeItem('moon_flow_state');
        location.assign('./index.html?story=1');
    }

    function jump(id, state) {
        if (testing) {
            location.assign('./index.html?test=1&story=0&selector=1&target=' + encodeURIComponent(id));
            return;
        }
        if (!state) return;
        sessionStorage.setItem('moon_flow_state', JSON.stringify(state));
        location.assign('./index.html?flow=1&story=1');
    }

    function render() {
        const chart = layer.querySelector('.story-flow-chart'), book = readBook(), states = book.nodes || {},
            current = snapshot(), term = layer.querySelector('input[type="search"]').value.trim().toLowerCase(),
            only = layer.querySelector('.flow-unlocked-only').checked;
        if (!testing && !states[current.node]) states[current.node] = current;
        const groups = new Map();
        for (const d of definitions.values()) {
            const unlocked = testing || !!states[d.id], text = (d.id + ' ' + d.title).toLowerCase();
            if (term && !text.includes(term) || only && !unlocked) continue;
            const chapter = states[d.id]?.chapter ?? chapterOf(d.id);
            if (!groups.has(chapter)) groups.set(chapter, []);
            groups.get(chapter).push({d, unlocked, state: states[d.id]});
        }
        chart.replaceChildren();
        for (const [chapter, items] of [...groups].sort((a, b) => a[0] - b[0])) {
            const lane = document.createElement('section');
            lane.className = 'flow-chapter';
            lane.innerHTML = '<header><b>' + String(chapter).padStart(2, '0') + '</b><h2>' + (chapterTitles[chapter] || '支线流程') + '</h2><small>' + items.filter(x => x.unlocked).length + ' / ' + items.length + ' 已解锁</small></header>';
            const nodes = document.createElement('div');
            nodes.className = 'flow-nodes';
            items.sort((a, b) => (order.get(a.d.id) ?? 9999) - (order.get(b.d.id) ?? 9999));
            for (const item of items) {
                const button = document.createElement('button'), links = outgoing(item.d);
                button.type = 'button';
                button.className = 'flow-node ' + (item.unlocked ? 'is-unlocked' : 'is-locked') + (item.d.id === current.node ? ' is-current' : '');
                button.disabled = !item.unlocked;
                button.innerHTML = '<span>' + item.d.title + '</span><small>' + item.d.id + '</small>' + (links.length > 1 ? '<em>◇ ' + links.length + ' 条分支</em>' : '');
                button.title = item.unlocked ? (testing ? '测试模式：直接进入此节点' : '进入已通过节点的独立回看') : '尚未通过';
                button.onclick = () => jump(item.d.id, item.state);
                nodes.append(button);
            }
            lane.append(nodes);
            chart.append(lane);
        }
        layer.querySelector('.flow-note').textContent = testing ? '测试模式已全解锁：所有剧情节点均可跳转。' : flowing ? '正在独立回看，操作不会覆盖正式存档。' : '已通过节点以亮色显示；跳转后进入独立回看，不会覆盖当前正式进度。';
        layer.querySelector('.flow-latest').hidden = !flowing;
    }

    function open() {
        returnFrom = activeOverlay;
        render();
        openOverlay('story-flow');
    }

    launch.onclick = open;
    layer.querySelector('.flow-close').onclick = () => {
        const target = returnFrom;
        returnFrom = null;
        if (target) openOverlay(target); else closeOverlay('story-flow');
    };
    layer.querySelector('input[type="search"]').oninput = render;
    layer.querySelector('.flow-unlocked-only').onchange = render;
    layer.querySelector('.flow-latest').onclick = latest;
    if (flowing) {
        const banner = document.createElement('aside');
        banner.className = 'flow-replay-banner';
        banner.innerHTML = '<span>独立剧情回看</span><button type="button">剧情流程</button><button type="button">返回最新进度</button>';
        banner.querySelectorAll('button')[0].onclick = open;
        banner.querySelectorAll('button')[1].onclick = latest;
        document.querySelector('#map-game').append(banner);
    }
    globalThis.MoonStoryFlow = {open, record, history: () => readBook()};
})();
