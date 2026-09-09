"use strict";
(function () {
    const query = new URLSearchParams(location.search), testing = query.get('test') === '1',
        flowing = query.get('flow') === '1', store = testing || flowing ? sessionStorage : localStorage;
    const proto = MoonStory.prototype, run = proto.run, choose = proto.choose, ids = new WeakMap();

    function id(story) {
        let value = story.state.flags.log_id || ids.get(story);
        if (!value) {
            value = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
            ids.set(story, value);
        }
        return value;
    }

    function rows(story) {
        try {
            return JSON.parse(store.getItem('moon_log_' + id(story)) || '[]');
        } catch {
            return [];
        }
    }

    function append(story, items) {
        const list = rows(story);
        for (const item of items) if (item.text) list.push({
            actor: item.actor || '记录',
            text: item.text,
            node: story.state.node,
            day: story.state.day
        });
        try {
            store.setItem('moon_log_' + id(story), JSON.stringify(list.slice(-4000)));
        } catch {
        }
    }

    proto.run = function (event) {
        if (!event) return run.call(this, event);
        const patched = {...event, effects: {...event.effects, flags: {...event.effects?.flags, log_id: id(this)}}};
        const ok = run.call(this, patched);
        if (ok) append(this, (event.queue || []).filter(x => x.type === 'line'));
        return ok;
    };
    proto.choose = function (value) {
        const option = this.current?.options?.find(x => x.id === value);
        const ok = choose.call(this, value);
        if (ok && option) append(this, [{actor: '选择', text: option.text || option.id}]);
        return ok;
    };
    if (testing) {
        const storage = MoonStorage;
        globalThis.MoonStorage = {
            ...storage, loadSettings() {
                const value = storage.loadSettings();
                value.difficulty = sessionStorage.getItem('moon_test_difficulty') || value.difficulty;
                return value;
            }, saveSettings(value) {
                sessionStorage.setItem('moon_test_difficulty', value.difficulty);
                return value;
            }
        };
        proto.save = proto.saveCheckpoint = function () {
            const state = this.state;
            sessionStorage.setItem('moon_test_state', JSON.stringify(state));
            return state;
        };
    }
    if (flowing) {
        proto.save = proto.saveCheckpoint = function () {
            const state = this.state;
            sessionStorage.setItem('moon_flow_state', JSON.stringify(state));
            return state;
        };
    }
    globalThis.MoonHistory = {rows, testing, flowing};
})();
