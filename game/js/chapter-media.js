"use strict";
(function () {
    let active = null;
    const captions = [
        "爸——如果这份录像还能被找到，我已经二十四岁了。",
        "家里的那架琴还在。妈有时会擦，但她很久没再问你哪天回来。",
        "她说，人不能一直过等待的日子。我以前听不懂，现在大概懂一点了。",
        "我不知道基地里还有没有人。如果有，请告诉我们发生了什么。",
        "这不是催你再说一次等我回来。我们需要知道，那里还有谁。"
    ];
    const layer = document.createElement("section");
    layer.id = "chapter-media";
    layer.className = "overlay ui-layer";
    layer.hidden = true;
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "成年小星旧影像");
    layer.innerHTML = '<div class="panel-large media-panel"><header class="panel-heading"><h1>接收缓存 · 小星</h1><button type="button" data-close="chapter-media">关闭</button></header><p class="media-subtitle">文件时间：十六年前 · 人物年龄记录：24 · 旧缓存，非实时连接</p><div class="received-screen"><video class="adult-video" preload="metadata" controls playsinline src="./audio/adult-xing-clean.mp4"></video><p class="media-caption" aria-live="polite"></p></div><p class="media-progress" role="status"></p><button class="media-hold" type="button">点击播放</button><button class="media-skip" type="button">跳过影像 ▸▸</button></div>';
    document.getElementById("map-game").append(layer);
    const video = layer.querySelector("video");
    const button = layer.querySelector(".media-hold");
    const progress = layer.querySelector(".media-progress");
    const caption = layer.querySelector(".media-caption");
    function volume(settings = MoonStorage.loadSettings()) {
        video.volume = Math.max(0, Math.min(1, settings.masterVolume * settings.sfxVolume));
    }
    function open(node, finish) {
        video.pause();
        video.currentTime = 0;
        active = {node, finish, playing: false};
        button.hidden = false;
        button.textContent = "点击播放";
        progress.textContent = "";
        caption.textContent = "";
        volume();
    }
    function start() {
        if (!active) return;
        const session = active;
        video.play().catch(() => {
            if (active !== session) return;
            progress.textContent = "视频加载失败，请重试。";
            button.hidden = false;
        });
    }
    function finish() {
        if (!active) return false;
        const done = active.finish;
        active = null;
        video.pause();
        done();
        return true;
    }
    function abort() { active = null; video.pause(); }
    function tick() {
        if (active && Number.isFinite(video.duration)) {
            progress.textContent = Math.floor(video.currentTime) + " / " + Math.ceil(video.duration) + " 秒";
            const index = Math.min(captions.length - 1, Math.floor(video.currentTime / (video.duration / captions.length)));
            caption.textContent = captions[index] || "";
        }
    }
    video.addEventListener("play", () => {
        if (!active) { video.pause(); return; }
        active.playing = true;
        button.hidden = true;
    });
    video.addEventListener("ended", finish);
    video.addEventListener("error", () => {
        if (active) { progress.textContent = "视频加载失败，请重试。"; button.hidden = false; }
    });
    button.addEventListener("click", start);
    layer.querySelector(".media-skip").addEventListener("click", finish);
    window.addEventListener("moon:settings-changed", event => volume(event.detail));

    new MutationObserver(() => {
        if (layer.hidden || layer.dataset.motion === "closing") video.pause();
    }).observe(layer, {attributes: true, attributeFilter: ["hidden", "data-motion"]});
    document.addEventListener("visibilitychange", () => { if (document.hidden) video.pause(); });
    globalThis.MoonChapterMedia = Object.freeze({
        open, tick, skip: finish, abort,
        get state() { return active ? {playing: !video.paused, time: video.currentTime, holding: false, hold: 0} : null; }
    });
})();
