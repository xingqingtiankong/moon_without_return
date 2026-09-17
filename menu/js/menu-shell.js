"use strict";

(function createMoonMenuShell() {
    const iframe = document.getElementById("menu-frame");
    const routes = {
        main: "../main/index.html",
        settings: "../settings/index.html",
        about: "../about/index.html",
        achievements: "../achievement/index.html",
        save: "../save/index.html",
        flowchart: "../game/index.html"
    };

    function readRoute() {
        const route = location.hash.replace(/^#\/?/, "").split("?")[0];
        return routes[route] ? route : "main";
    }

    function routeFromUrl(url) {
        const path = String(url || "").replace(/\\/g, "/").split(/[?#]/)[0].toLowerCase();

        if (path.endsWith("/main/index.html")) return "main";
        if (path.endsWith("/settings/index.html")) return "settings";
        if (path.endsWith("/about/index.html")) return "about";
        if (path.endsWith("/achievement/index.html")) return "achievements";
        if (path.endsWith("/save/index.html")) return "save";
        if (path.endsWith("/game/index.html") && new URL(url, location.href).searchParams.get("flowchart") === "1") return "flowchart";
        return null;
    }

    function showRoute(route) {
        const search = route === "flowchart" ? location.hash.split("?")[1] || "flowchart=1&story=0" : "";
        const routeKey = route + (search ? "?" + search : "");
        if (!routes[route] || iframe.dataset.route === routeKey) {
            return;
        }

        iframe.dataset.route = routeKey;
        iframe.src = routes[route] + (search ? "?" + search : "");
    }

    function navigate(route, options = {}) {
        const nextRoute = routes[route] ? route : "main";
        const nextHash = `#/${nextRoute}${nextRoute === "flowchart" ? options.search || "?flowchart=1&story=0" : ""}`;

        if (location.hash !== nextHash) {
            if (options.replace) {
                history.replaceState(null, "", nextHash);
            } else {
                location.hash = nextHash;
            }
        }

        showRoute(nextRoute);
    }

    window.addEventListener("hashchange", () => showRoute(readRoute()));
    window.addEventListener("message", (event) => {
        if (event.source !== iframe.contentWindow || !event.data) {
            return;
        }

        if (event.data.type === "moon-menu-bgm:start") {
            window.MoonMenuBgm?.start();
            return;
        }

        if (event.data.type === "moon-menu-bgm:startPreview") {
            window.MoonMenuBgm?.startPreview();
            return;
        }

        if (event.data.type === "moon-menu-bgm:stop") {
            window.MoonMenuBgm?.stop();
            return;
        }

        if (event.data.type === "moon-menu-bgm:setVolume") {
            window.MoonMenuBgm?.setVolume();
            return;
        }

        if (event.data.type === "moon-menu-shell:navigate") {
            const route = routeFromUrl(event.data.url);

            if (route) {
                navigate(route, {search: new URL(event.data.url, location.href).search});
            } else {
                window.location.href = event.data.url;
            }
        }
    });

    const initialRoute = readRoute();
    navigate(initialRoute, {replace: true, search: location.hash.includes("?") ? "?" + location.hash.split("?")[1] : ""});
    window.MoonMenuShell = Object.freeze({navigate});
}());
