"use strict";
(function () {
    const Previous = MoonStory, aliases = {
        review_then_backup: 'C01B',
        verify_together: 'C02B',
        verify_then_register: 'C03B',
        check_angles: 'C04B',
        preserve_no_play: 'C05A',
        show_dates_first: 'C06A',
        confirm_send: 'C07B',
        listen: 'C08B',
        read_first: 'C09A',
        send_verified: 'C12A'
    };

    function upgrade(state) {
        const s = MoonStorage.clone(state);
        if (s.flags?.v5_migrated) return s;
        s.flags = {...s.flags, v5_migrated: true};
        s.choices = {...s.choices};
        for (const [k, v] of Object.entries(s.choices)) if (aliases[v]) s.choices[k] = aliases[v];
        const done = id => s.completedTasks?.includes(id);
        if (!s.choices.C13 && done('T_NAME')) s.choices.C13 = 'C13C';
        if (!s.choices.C14 && s.evidence?.includes('U2')) s.choices.C14 = 'C14C';
        if (!s.choices.C15 && done('E_SUBMIT')) s.choices.C15 = 'C15A';
        if (!s.choices.C16 && done('E_DECLARATION')) s.choices.C16 = 'C16A';
        if (!s.choices.FINAL && s.flags.plan_terminated) s.choices.FINAL = 'F-A';
        if (s.flags.azhi_read_complete) s.flags.azhi_night1 = true;
        if (done('K_AZHI') && s.flags.azhi_night1) s.flags.azhi_night2 = true;
        if (done('E_UNBIND')) s.flags.azhi_statement = 'leave';
        return s;
    }

    globalThis.MoonStory = class extends Previous {
        constructor(options = {}) {
            super({...options, state: upgrade(options.state || MoonStorage.defaultGameState())});
        }
    };
    globalThis.MoonV5Migration = {upgrade};
})();