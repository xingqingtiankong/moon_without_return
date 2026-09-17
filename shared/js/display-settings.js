"use strict";
(function(){
    function apply(value){
        if(!value)return;
        const root=document.documentElement;
        root.style.setProperty("--display-scale", String(value.scale ?? 1));
        root.style.setProperty("--display-brightness", String(value.brightness ?? 1));
        root.style.setProperty("--display-scanlines", value.scanlines === false ? "0" : "1");
        root.style.setProperty("--display-grain", value.grain === false ? "0" : "1");
        document.body.classList.toggle("reduced-motion", value.reducedMotion === true);
    }
    window.MoonDisplaySettings=Object.freeze({apply});
    const start=()=>{if(window.MoonStorage)apply(MoonStorage.loadSettings());};
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
    window.addEventListener("moon:settings-changed", event=>apply(event.detail));
    window.addEventListener("storage", event=>{if(event.key===window.MoonStorage?.SETTINGS_KEY)try{apply(JSON.parse(event.newValue||"null"));}catch{}});
})();
