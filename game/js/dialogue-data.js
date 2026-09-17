"use strict";

(function applyDialogueData() {
    const data = globalThis.MoonDialogueOverrides;
    if (!data || !Array.isArray(data.entries) || !data.entries.length) return;

    function hashText(value) {
        let hash = 2166136261;
        const text = String(value ?? "");
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    const exact = new Map(data.entries.map(entry => [entry.key, entry]));
    const scoped = new Map();
    for (const entry of data.entries) {
        if (entry.kind !== "line" || typeof entry.sourceText !== "string" || !entry.scope) continue;
        if (!scoped.has(entry.scope)) scoped.set(entry.scope, new Map());
        const texts = scoped.get(entry.scope);
        if (texts.has(entry.sourceText) && texts.get(entry.sourceText) !== entry.text) {
            throw new Error(`Conflicting dialogue edits in ${entry.scope}`);
        }
        texts.set(entry.sourceText, entry.text);
    }
    const byContent = new Map();
    for (const entry of data.entries) {
        const parts = entry.key.split("|");
        if (entry.kind !== "line" || parts.length !== 4) continue;
        const signature = `${parts[0]}|${parts[3]}`;
        if (!byContent.has(signature)) byContent.set(signature, []);
        byContent.get(signature).push(entry);
    }
    const originalRun = globalThis.MoonStory.prototype.run;
    globalThis.MoonStory.prototype.run = function runWithDialogueData(event) {
        if (!event?.id || !Array.isArray(event.queue)) return originalRun.call(this, event);
        const prepared = MoonStorage.clone(event);
        prepared.queue = prepared.queue || [];
        const counts = new Map();
        for (const item of prepared.queue) {
            if (item.type !== "line") continue;
            const hash = hashText(`${item.actor || "system"}\u0000${item.text || ""}`);
            counts.set(hash, (counts.get(hash) || 0) + 1);
        }
        prepared.queue.forEach((item, index) => {
            if (item.type === "line") {
                const scope = globalThis.MoonDialogueScopes?.forEvent(event.id);
                const texts = scoped.get(scope);
                if (texts?.has(item.text)) {
                    item.text = texts.get(item.text);
                    return;
                }
                const hash = hashText(`${item.actor || "system"}\u0000${item.text || ""}`);
                const key = [event.id, "line", index, hash].join("|");
                let override = exact.get(key);
                if (!override && counts.get(hash) === 1) {

                    const candidates = byContent.get(`${event.id}|${hash}`) || [];
                    if (candidates.length && candidates.every(entry =>
                        entry.actor === candidates[0].actor && entry.text === candidates[0].text)) {
                        override = candidates[0];
                    }
                }
                if (override) {
                    if (typeof override.actor === "string" && override.actor) item.actor = override.actor;
                    if (typeof override.text === "string") item.text = override.text;
                }
            }
            if (item.type === "choice") {
                const key = [event.id, "choice", item.id || "prompt", hashText(item.text || "")].join("|");
                const override = data.entries.find(entry => entry.key === key && entry.kind === "choice");
                if (override) item.text = override.text;
                item.options = item.options || [];
                item.options.forEach(option => {
                    const optionKey = [event.id, "option", item.id || "prompt", option.id, hashText(option.text || "")].join("|");
                    const optionOverride = data.entries.find(entry => entry.key === optionKey && entry.kind === "option");
                    if (optionOverride) option.text = optionOverride.text;
                });
            }
        });
        return originalRun.call(this, prepared);
    };
})();
