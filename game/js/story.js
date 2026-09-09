"use strict";
(function () {
    const storage = window.MoonStorage, config = globalThis.MoonMapConfig;
    const copy = storage.clone;

    class Story {
        #state;
        #pending = null;
        #tasks;

        constructor({state = storage.defaultGameState(), tasks = []} = {}) {
            this.#tasks = new Map(tasks.map(t => [t.id, copy(t)]));
            this.#state = storage.migrateSave(state) || storage.defaultGameState();
            const p = this.#state.playerPosition, f = config.getPlayerFootprint(this.#state.currentMap);
            this.positionReset = this.#state.configVersion !== config.CONFIG_VERSION || !config.isWalkable(this.#state.currentMap, p.x, p.y, f.radiusX, f.radiusY);
            if (this.positionReset) {
                this.#state.currentMap = 'F01';
                this.#state.playerPosition = {x: 755.4, y: 743.7};
            }
            this.#state.configVersion = config.CONFIG_VERSION;
        }

        get state() {
            return copy(this.#state);
        }

        get busy() {
            return this.#pending !== null;
        }

        get current() {
            return this.#pending ? copy(this.#pending.queue[0] || null) : null;
        }

        meets(requirements = {}, state = this.#state) {
            return (!requirements.node || requirements.node === state.node)
                && (!requirements.day || requirements.day === state.day)
                && (requirements.tasks || []).every(id => state.completedTasks.includes(id))
                && (requirements.evidence || []).every(id => state.evidence.includes(id))
                && Object.entries(requirements.flags || {}).every(([k, v]) => state.flags[k] === v)
                && Object.entries(requirements.choices || {}).every(([k, v]) => state.choices[k] === v)
                && (!requirements.family_state || requirements.family_state === state.family_state)
                && (requirements.piano_clear === undefined || requirements.piano_clear === state.piano_clear);
        }

        tasks() {
            return [...this.#tasks.values()].map(t => ({
                ...copy(t),
                status: this.#state.completedTasks.includes(t.id) ? 'complete' : this.meets(t.requires) ? 'active' : 'locked'
            }));
        }

        #publish() {
            window.dispatchEvent(new CustomEvent('moon:progress-changed', {detail: this.state}));
        }

        #present() {
            window.dispatchEvent(new CustomEvent('moon:story-presentation', {detail: this.current}));
        }

        #effects(state, effects = {}) {
            for (const key of ['chapter', 'node', 'day', 'mental_value', 'family_state', 'piano_clear', 'chapterComplete', 'checkpointId']) if (Object.hasOwn(effects, key)) state[key] = effects[key];
            for (const key of ['evidence', 'completedTasks']) state[key] = [...new Set([...state[key], ...(effects[key] || [])])];
            for (const key of ['flags', 'choices', 'minigameResults']) state[key] = {...state[key], ...effects[key]};
        }

        run(event) {
            if (this.busy || !event?.id || this.#state.oneShotEvents.includes(event.id) || !this.meets(event.requires)) return false;
            const queue = copy(event.queue || []);
            if (queue.some(item => !['line', 'choice', 'wait'].includes(item.type) || (item.type === 'wait' && (!Number.isFinite(item.seconds) || item.seconds < 0)) || (item.type === 'choice' && (!item.id || !Array.isArray(item.options) || !item.options.length || item.options.some(o => !o.id))))) return false;
            this.#pending = {event: copy(event), draft: this.state, queue};
            this.#drain();
            return true;
        }

        #drain() {
            if (!this.#pending) return;
            if (this.#pending.queue.length) {
                this.#present();
                return;
            }
            const {event, draft} = this.#pending;
            this.#effects(draft, event.effects);
            if (event.once !== false) draft.oneShotEvents.push(event.id);
            this.#state = storage.migrateSave(draft);
            this.#pending = null;
            this.#publish();
            this.#present();
        }

        advance() {
            if (this.current?.type !== 'line') return false;
            this.#pending.queue.shift();
            this.#drain();
            return true;
        }

        skipSegment() {
            const pending = this.#pending;
            if (!pending || pending.queue[0]?.type === 'choice') return false;
            while (pending.queue.length && pending.queue[0].type !== 'choice' && !pending.queue[0].unskippable) pending.queue.shift();
            this.#drain();
            return true;
        }

        saveCheckpoint(slot = 'auto') {
            return this.busy ? storage.saveGame(this.state, slot) : this.save(slot);
        }

        choose(id) {
            const item = this.current;
            if (item?.type !== 'choice') return false;
            const option = item.options.find(o => o.id === id);
            if (!option) return false;
            this.#pending.draft.choices[item.id] = id;
            this.#effects(this.#pending.draft, option.effects);
            this.#pending.queue.shift();
            this.#drain();
            return true;
        }

        tick(seconds) {
            if (!Number.isFinite(seconds) || seconds < 0) return;
            this.#state.playTime = Math.min(315360000, this.#state.playTime + seconds);
            if (this.#pending) this.#pending.draft.playTime = this.#state.playTime;
            if (this.current?.type === 'wait') {
                this.#pending.queue[0].seconds -= seconds;
                if (this.#pending.queue[0].seconds <= 0) {
                    this.#pending.queue.shift();
                    this.#drain();
                }
            }
        }

        completeTask(id) {
            const task = this.#tasks.get(id);
            if (!task || this.#state.completedTasks.includes(id)) return false;
            return this.run({
                id: `task-${id}`,
                requires: task.requires,
                queue: task.queue,
                effects: {...task.effects, completedTasks: [...(task.effects?.completedTasks || []), id]}
            });
        }

        setLocation(map, x, y) {
            if (this.busy || !config.MAPS[map]) return false;
            const f = config.getPlayerFootprint(map);
            if (!config.isWalkable(map, x, y, f.radiusX, f.radiusY)) return false;
            this.#state.currentMap = map;
            this.#state.playerPosition = {x, y};
            return true;
        }

        save(slot = 'auto', checkpointId = this.#state.checkpointId) {
            if (this.busy) return false;
            const candidate = {...this.state, checkpointId};
            const saved = storage.saveGame(candidate, slot);
            if (saved) this.#state = saved;
            return saved;
        }
    }

    globalThis.MoonStory = Story;
})();
