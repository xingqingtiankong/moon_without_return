"use strict";

(function defineDialogueScopes() {
    const branchGroups = {
        "chapter1:H04": ["V_CACHE_CLEAR", "V_CACHE_HASH"],
        "chapter1:H06": ["V_AZHI_DIRECT", "V_AZHI_DEFER"],
        "chapter2:M02": ["V_ID_SUCCESSOR", "V_ID_DEFER"],
        "chapter2:M03": ["V_TRACE_REPLAY", "V_TRACE_SYSTEM", "V_TRACE_OFF"],
        "chapter3:S02": ["V_WITNESS", "V_W1", "V_W2", "V_W3", "V_W4", "V_W_PAUSE0", "V_W_PAUSE1", "V_W_PAUSE2", "V_W_PAUSE3", "V_W_COMPLETE", "V_DB_SEAL", "V_DB_SUMMARY", "V_DB_CONNECT", "V_DB_BLIND", "V_DB_16"],
        "chapter3:S04": ["V_DISCLOSE", "V_TELL_SUMMARY", "V_MODEL_ONLY", "V_PRIVATE", "V_CRISIS", "V_CRISIS_REPAIR", "V_CRISIS_STAY", "V_SNAPSHOT_CONFIRM", "V_SNAPSHOT_DONE", "V_CRISIS_AUTONOMY", "V_AZHI_NIGHT1"],
        "chapter3:S05": ["V_REPLY_SENT", "V_REPLY_DRAFT"]
    };
    const branches = new Map(Object.entries(branchGroups).flatMap(([scope, ids]) => ids.map(id => [id, scope])));
    function forEvent(eventId) {
        const id = String(eventId || "").replace(/^(campaign_|v5_choice_)/, "");
        if (branches.has(id)) return branches.get(id);
        if (id === "H02_D3_COMPLETE") return "chapter1:H02_D4";
        if (/^h01_/.test(id) || id === "H01" || id === "H01_COMPLETE") return "chapter1:H01";
        if (/^h02_d3_/.test(id)) return "chapter1:H02_D3";
        const day = id.match(/^H02_D([3-6])(?:_|$)/);
        if (day) return `chapter1:H02_D${day[1]}`;
        const part = id.match(/^(P0[0-2]|H0[3-6]|M0[0-3]|S0[0-5])(?:_|$)/);
        if (part) {
            const chapter = {P: 0, H: 1, M: 2, S: 3}[part[1][0]];
            return `chapter${chapter}:${part[1]}`;
        }

        return `event:${id}`;
    }
    globalThis.MoonDialogueScopes = Object.freeze({forEvent});
})();
