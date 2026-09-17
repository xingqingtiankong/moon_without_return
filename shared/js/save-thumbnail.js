"use strict";

(function createMoonSaveThumbnail() {
    const imageCache = new Map();
    const SPACESUIT_DIRECTIONS = Object.freeze({
        0: {row: 0, mirror: false},
        1: {row: 1, mirror: false},
        2: {row: 5, mirror: false},
        3: {row: 3, mirror: true},
        4: {row: 4, mirror: false},
        5: {row: 3, mirror: false},
        6: {row: 2, mirror: false},
        7: {row: 1, mirror: true}
    });

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
    }

    function loadImage(path) {
        if (!path) return Promise.reject(new Error("Missing image path."));
        if (imageCache.has(path)) return imageCache.get(path);
        const promise = new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Unable to load ${path}`));
            image.src = encodeURI(path);
        });
        imageCache.set(path, promise);
        return promise;
    }

    function drawPlaceholder(ctx, width, height, scene) {
        const background = ctx.createLinearGradient(0, 0, width, height);
        background.addColorStop(0, "#0a1a1e");
        background.addColorStop(0.5, "#061114");
        background.addColorStop(1, "#020708");
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(133,181,184,.14)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }

        const mapId = String(scene?.mapId || "ARCHIVE");
        ctx.fillStyle = "rgba(3,9,11,.78)";
        ctx.fillRect(12, 12, width - 24, 26);
        ctx.fillStyle = "rgba(205,221,218,.78)";
        ctx.font = "12px 'Cascadia Mono', Consolas, monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(mapId, 20, 25);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(151,190,190,.58)";
        ctx.fillText("LAST FRAME ARCHIVE", width - 20, 25);
    }

    function drawOverlay(ctx, width, height) {
        ctx.fillStyle = "rgba(195,223,222,.045)";
        for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
        const vignette = ctx.createRadialGradient(width / 2, height / 2, 18, width / 2, height / 2, width * 0.72);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,.58)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    function drawMarker(ctx, x, y) {
        ctx.fillStyle = "rgba(218,190,124,.24)";
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ead9a8";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    async function drawPlayer(ctx, scene, width, height, mapSize) {
        const config = globalThis.MoonMapConfig;
        const walk = globalThis.MoonWalkAnimation;
        if (!config || !config.MAPS?.[scene.mapId]) return;
        const mapX = clamp(scene.x, 0, mapSize.width);
        const mapY = clamp(scene.y, 0, mapSize.height);
        const scaleX = width / mapSize.width;
        const scaleY = height / mapSize.height;
        const playerX = mapX * scaleX;
        const playerY = mapY * scaleY;
        const playerScale = config.getPlayerScale ? config.getPlayerScale(scene.mapId) : 1;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,.38)";
        ctx.beginPath();
        ctx.ellipse(playerX, playerY, 22 * playerScale * scaleX, 9 * playerScale * scaleY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const drawSize = config.getCharacterDrawSize ? config.getCharacterDrawSize(scene.mapId) : {width: 120, height: 120};
        const drawWidth = drawSize.width * scaleX;
        const drawHeight = drawSize.height * scaleY;
        const facingRow = Number.isInteger(scene.facingRow) ? Math.max(0, Math.min(7, scene.facingRow)) : 0;
        let sheetPath = "";
        let frameWidth = 256;
        let frameHeight = 256;
        let sourceX = 0;
        let sourceY = 0;
        let footRatio = 1;
        let direction = {row: 0, mirror: false};
        let useWalkSheet = false;

        if (scene.mapId === "R09" || scene.sprite === "spacesuit") {
            sheetPath = config.SPACESUIT_IMAGE;
            frameWidth = config.SPRITE.frameWidth;
            frameHeight = config.SPRITE.frameHeight;
            direction = SPACESUIT_DIRECTIONS[facingRow] || SPACESUIT_DIRECTIONS[0];
            sourceY = direction.row * frameHeight;
        } else if (walk) {
            sheetPath = walk.idleImage;
            frameWidth = walk.frameSize;
            frameHeight = walk.frameSize;
            direction = walk.directions[facingRow] || walk.directions[0];
            sourceY = direction.row * frameHeight;
            footRatio = walk.footY / 256;
            useWalkSheet = true;
        } else {
            drawMarker(ctx, playerX, playerY);
            return;
        }

        let sheet;
        try {
            sheet = await loadImage(sheetPath);
        } catch (error) {
            drawMarker(ctx, playerX, playerY);
            return;
        }
        const drawY = playerY - drawHeight * (useWalkSheet ? footRatio : 1);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (direction.mirror) {
            ctx.translate(playerX, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(sheet, sourceX, sourceY, frameWidth, frameHeight, -drawWidth / 2, drawY, drawWidth, drawHeight);
        } else {
            ctx.drawImage(sheet, sourceX, sourceY, frameWidth, frameHeight, playerX - drawWidth / 2, drawY, drawWidth, drawHeight);
        }
        ctx.restore();
    }

    async function render(canvas, scene) {
        if (!canvas || !scene) return false;
        const width = 480;
        const height = 270;
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;
        const config = globalThis.MoonMapConfig;
        drawPlaceholder(ctx, width, height, scene);
        if (!config || !config.MAPS?.[scene.mapId]) return false;
        const mapSize = config.MAP_SIZE || {width: 1672, height: 941};
        const map = config.MAPS[scene.mapId];
        if (map?.file) {
            try {
                const mapImage = await loadImage(map.file);
                ctx.drawImage(mapImage, 0, 0, width, height);
            } catch (error) {
            }
        }
        await drawPlayer(ctx, scene, width, height, mapSize);
        drawOverlay(ctx, width, height);
        return true;
    }

    function showPlaceholder(frame, text) {
        for (const visual of frame.querySelectorAll("img,canvas")) visual.remove();
        frame.classList.add("is-placeholder");
        if (!frame.querySelector(".save-thumb-placeholder")) {
            const placeholder = document.createElement("span");
            placeholder.className = "save-thumb-placeholder";
            placeholder.textContent = text || "NO FRAME";
            frame.append(placeholder);
        }
    }

    function create(data, className, options = {}) {
        const frame = document.createElement("figure");
        frame.className = className || "save-thumb";
        if (data?.snapshotScene) {
            const canvas = document.createElement("canvas");
            canvas.className = "save-thumb-canvas";
            canvas.setAttribute("aria-label", options.label || "存档最后一刻画面");
            frame.append(canvas);
            render(canvas, data.snapshotScene).catch(() => showPlaceholder(frame, options.placeholder));
        } else if (typeof data?.snapshot === "string" && data.snapshot) {
            const image = document.createElement("img");
            image.src = data.snapshot;
            image.alt = options.label || "存档最后一刻画面";
            image.loading = "lazy";
            image.decoding = "async";
            image.addEventListener("error", () => showPlaceholder(frame, options.placeholder));
            frame.append(image);
        } else {
            showPlaceholder(frame, options.placeholder);
        }
        return frame;
    }

    globalThis.MoonSaveThumbnail = Object.freeze({create, render, loadImage});
}());
