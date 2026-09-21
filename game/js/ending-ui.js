"use strict";
(function () {
    const DARK_MS = 700;
    const CARD_IN_MS = 900;
    const CARD_HOLD_MS = 2200;
    const CARD_OUT_MS = 520;
    const pendingAchievements = new Set();
    let revealActive = false;
    let endingVisible = false;
    let suppressToast = false;

    function gallery(root) {
        const unlocked = MoonEndings.load();
        root.replaceChildren();
        for (const e of Object.values(MoonEndings.entries)) {
            const card = document.createElement("article"), open = !!unlocked[e.id];
            card.className = "medal-card" + (open ? "" : " locked");
            card.innerHTML = MoonEndings.medal(e.id, !open);
            const title = document.createElement("h3");
            title.textContent = e.title;
            const label = document.createElement("p");
            label.textContent = e.medal + " · " + (open ? "已获得" : "未获得");
            card.append(title, label);
            const details = document.createElement("details"), summary = document.createElement("summary");
            summary.textContent = open ? "查看结局记录" : "查看内容（含剧透）";
            const text = document.createElement("p");
            text.textContent = e.intro + " " + e.text;
            details.append(summary, text);
            card.append(details);
            root.append(card);
        }
    }

    const panel = document.createElement("section");
    panel.className = "overlay ui-layer achievement-overlay";
    panel.id = "achievements";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = '<div class="panel-large"><header><h1>结局勋章</h1><button data-close="achievements">返回游戏</button></header><p>每个结局一枚独立勋章。跨存档保留，重新开始不会清空。</p><div class="medal-gallery"></div></div>';
    document.getElementById("map-game").append(panel);
    const button = document.createElement("button");
    button.textContent = "结局与成就";
    button.addEventListener("click", () => {
        gallery(panel.querySelector(".medal-gallery"));
        openOverlay("achievements");
    });
    document.querySelector(".pause-panel").append(button);
    panel.querySelector("button").addEventListener("click", () => closeOverlay("achievements"));

    function startAchievementBgm(id) {
        if (window.MoonAchievementBgm?.start) {
            window.MoonAchievementBgm.start(id);
            return;
        }
        if (window.MoonSound?.playAchievementBgm) {
            window.MoonSound.playAchievementBgm(id);
            return;
        }
        window.dispatchEvent(new CustomEvent("moon:achievement-bgm", {detail: {id}}));
    }

    function stopAchievementBgm() {
        if (window.MoonAchievementBgm?.stop) {
            window.MoonAchievementBgm.stop();
            return;
        }
        if (window.MoonSound?.stopAchievementBgm) {
            window.MoonSound.stopAchievementBgm();
            return;
        }
        window.dispatchEvent(new CustomEvent("moon:achievement-bgm-stop"));
    }

    function ensureRevealLayer() {
        let layer = document.querySelector(".achievement-reveal-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.className = "achievement-reveal-layer";
            layer.hidden = true;
            layer.setAttribute("aria-live", "polite");
            layer.innerHTML = '<div class="achievement-reveal-card"></div>';
            document.body.append(layer);
        }
        return layer;
    }

    function showRevealCard(layer, entry) {
        const card = layer.querySelector(".achievement-reveal-card");
        card.innerHTML = '<div class="achievement-reveal-card__badge">' + MoonEndings.medal(entry.id) + '</div>' +
            '<p class="achievement-reveal-card__kicker">成就解锁</p>' +
            '<h2 class="achievement-reveal-card__title">' + entry.title + '</h2>' +
            '<p class="achievement-reveal-card__medal">' + entry.medal + '</p>';
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                card.classList.add("is-visible");
                setTimeout(resolve, CARD_IN_MS);
            });
        });
    }

    function hideRevealCard(layer) {
        const card = layer.querySelector(".achievement-reveal-card");
        card.classList.remove("is-visible");
        return new Promise(resolve => setTimeout(resolve, CARD_OUT_MS));
    }

    async function revealAchievements(ids, onDone) {
        const entries = ids.map(id => MoonEndings.entries[id]).filter(Boolean);
        if (!entries.length) {
            onDone?.();
            return;
        }
        revealActive = true;
        const layer = ensureRevealLayer();
        layer.hidden = false;
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                layer.classList.add("is-dark");
                setTimeout(resolve, DARK_MS);
            });
        });
        for (const entry of entries) {
            startAchievementBgm(entry.id);
            await showRevealCard(layer, entry);
            await new Promise(resolve => setTimeout(resolve, CARD_HOLD_MS));
            await hideRevealCard(layer);
        }
        stopAchievementBgm();
        layer.classList.remove("is-dark");
        await new Promise(resolve => setTimeout(resolve, DARK_MS));
        layer.hidden = true;
        revealActive = false;
        onDone?.();
        if (pendingAchievements.size) startPendingReveal();
    }

    function queueAchievements(ids) {
        for (const id of ids) if (MoonEndings.entries[id]) pendingAchievements.add(id);
        if (endingVisible && !revealActive) startPendingReveal();
    }

    function startPendingReveal() {
        if (revealActive || !pendingAchievements.size) return;
        const ids = [...pendingAchievements];
        pendingAchievements.clear();
        revealAchievements(ids, () => {
        });
    }

    function addEndingMedal(entry) {
        const root = document.querySelector(".ending-panel");
        if (!root) return;
        root.classList.remove("is-pre-reveal");
        root.classList.add("is-revealed");
        root.querySelector(".ending-medal")?.remove();
        const badge = document.createElement("div");
        badge.className = "ending-medal is-revealed";
        badge.innerHTML = MoonEndings.medal(entry.id);
        const text = document.createElement("p");
        text.textContent = "成就勋章 · " + entry.medal;
        badge.append(text);
        root.prepend(badge);
    }

    window.addEventListener("moon:ending-visible", event => {
        const state = event.detail;
        const entry = MoonEndings.entries[state.flags.ending];
        if (!entry) return;
        endingVisible = true;
        const ids = [entry.id, ...(state.flags.ending_overlays || "").split(",").filter(Boolean)];
        suppressToast = true;
        const fresh = MoonEndings.unlock(ids);
        suppressToast = false;
        for (const id of fresh) pendingAchievements.add(id);
        const all = [...new Set([...ids, ...pendingAchievements])];
        pendingAchievements.clear();
        revealAchievements(all, () => addEndingMedal(entry));
    });

    window.addEventListener("moon:achievement-unlocked", event => {
        const ids = (event.detail || []).filter(id => MoonEndings.entries[id]);
        if (!ids.length || suppressToast || revealActive) return;
        const atEnding = endingVisible || (typeof activeOverlay !== "undefined" && activeOverlay === "ending") || globalThis.MoonStoryRuntime?.state?.flags?.game_complete;
        if (atEnding) {
            queueAchievements(ids);
            return;
        }
        const toast = document.createElement("div");
        toast.className = "medal-toast";
        toast.textContent = "获得勋章：" + ids.map(id => MoonEndings.entries[id].medal).join("、");
        document.body.append(toast);
        setTimeout(() => toast.remove(), 4500);
    });
})();
