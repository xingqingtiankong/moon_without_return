"use strict";


(function () {
    const a = MoonActivities;
    if (!globalThis.MoonAction) return;
    const prev = {
        reset: a.reset,
        render: a.render,
        tick: a.tick,
        reveal: a.reveal,
        key: a.expandedKey,
        release: a.newRelease
    };
    const NAMES = {
        'leak-hunt': '泄漏巡检',
        'surge-bank': '电涌调度',
        'credential-sort': '凭证分拣',
        'stream-merge': '时间线合流',
        'probe-steady': '探针采样',
        'energy-catch': '能量合流',
        'noise-filter': '降噪滤波',
        'wave-align': '信号对准',
        'purge': '进程清扫',
        'scan-sweep': '样本扫描',
        'packet-run': '校验包穿行',
        'parkour-run': '廊桥奔越'
    };
    const GAME_NAMES = Object.keys(NAMES), own = g => g && GAME_NAMES.includes(g.kind);
    const TIMERS = {
        'leak-hunt': 150,
        'surge-bank': 120,
        'credential-sort': 110,
        'stream-merge': 110,
        'probe-steady': 140,
        'energy-catch': 120,
        'noise-filter': 120,
        'wave-align': 150,
        'purge': 130,
        'scan-sweep': 130,
        'packet-run': 150,
        'parkour-run': 160
    };


    const KIND_ALIAS = {
        'mines': 'leak-hunt',
        'tetris': 'surge-bank',
        'solitaire': 'credential-sort',
        'spider': 'stream-merge',
        'match3': 'noise-filter',
        'wordle': 'wave-align',
        'sudoku': 'probe-steady',
        'loop': 'mouse-maze',
        'merge2048': 'energy-catch',
        'soil-check': 'scan-sweep'
    };
    const NODE_ALIAS = {
        'K_POWER': {'lights-out': 'surge-bank'},
        'V_W1': {'nonogram': 'wave-align'},
        'V_W2': {'maze': 'wave-align'},
        'V_W3': {'lights-out': 'wave-align'},
        'V_W4': {'logic-grid': 'wave-align'},
        'V_CRISIS_REPAIR': {'lights-out': 'purge'},
        'V_LATE_FIX': {'lights-out': 'purge'},
        'V_REPAIR_AUTH': {'lights-out': 'purge'},
        'T_PACKET': {'number-wordle': 'packet-run'}
    };

    function resolveAlias(info) {
        const m = info && NODE_ALIAS[info.node];
        if (m && m[info.game]) return m[info.game];
        return KIND_ALIAS[info.game] || null;
    }

    const C = {
        bg0: '#071723',
        bg1: '#1c2f38',
        panel: '#101e24',
        line: '#46544f',
        grid: '#3a535d',
        gold: '#dfc694',
        gold2: '#e0c48f',
        sand: '#b9a677',
        text: '#e4d1a9',
        dim: '#8a9384',
        teal: '#8db2a6',
        teal2: '#78a29e',
        blue: '#8eacc0',
        rust: '#c69777',
        red: '#b0685c',
        white: '#f0dbad'
    };
    const BAD = {
        lh: '压力上升，先处理亮起的泄漏点。',
        lh2: '护盾被喷发物击中！走位躲开弹幕再密封。',
        sb: '过载！能量表到绿区就该存入。',
        cs: '这份凭证去错了槽位。',
        sm: '记录被撕裂了，等两条都进窗再按。',
        ps: '探针碰到通道壁了。',
        ec: '颜色不合，能量泄漏了。',
        nf: '静态噪声上升了——在滤波窗内滤除噪声段，别碰到原始语音。',
        pg: '数据体撞上核心了，优先拦截。',
        pg2: '护盾受损！注意弹幕预警和数据体的贴身撞击。'
    };
    Object.assign(a.descriptions, {
        'leak-hunt': '泄漏巡检 · 用方向键在检修面板间移动，按空格发出声呐脉冲标记泄漏点；站在泄漏点上长按空格密封。被发现的泄漏点会以多种方式喷发液体弹幕——散射、环状、狙击、扇面，还有间隔很长但极难躲避的速射突袭，金圈预警后开火。被击中损失护盾，护盾耗尽或压力涨满任务失败。',
        'surge-bank': '电涌调度 · ←→ 移动接电滑轨接住下落电涌；能量表进入绿色区间后按空格存入备用电源。过载三次任务失败。',
        'credential-sort': '凭证分拣 · 凭证流入分拣窗口时按 1/2/3 送入对应槽位：17号生物个体→最高日志，原武康签注→销毁口，公共记录与见证声明→公开档案。错分三次任务失败。',
        'stream-merge': '时间线合流 · 新旧两份认证记录同步走带，两条记录同时进入中央闸门时按空格合流。撕裂三次任务失败。',
        'probe-steady': '探针采样 · 移动鼠标带动探针，保持在波形通道内完成采样；外壳过热时按空格托住。碰壁三次任务失败。',
        'energy-catch': '能量合流 · ←→ 移动合流滑板，接住与滑板同色的能量珠升压。错色或漏接会泄漏，三次任务失败。',
        'noise-filter': '降噪滤波 · 噪声段进入右侧滤波窗时按对应轨道键（J/K/L）消除；不要碰原始语音段。静态噪声累积过满任务失败。',
        'wave-align': '信号对准 · 按住 ←→ 调整频率、↑↓ 调整幅度，让金色波形与青色基准重合；保持重合即可锁存一段记录，共三段。',
        'purge': '进程清扫 · 方向键驾驶维护机，按住空格向射程圈内的最近目标连续发射净化脉冲（自动预判提前量）。异常数据体各有习性：漂移体冲核心途中开火，射击体保持距离打三连弹幕，重装体血厚速慢（击杀计2）、疾行体速快皮薄走蛇形，分裂体被击破会裂成两枚残片。中弹损失机体，机体过半射速减半——回核心旁静止两秒充能修复。机体耗尽或核心受损过重任务失败。',
        'packet-run': '校验包穿行 · 方向键操控数据包核心，依次接触坐标、人数、时间、校验四枚字段碎片完成锁定；全部锁定后右上开启上行端口，穿入即完成发送。途中躲开噪声涡流——每次被击中校验完整性受损，还可能震松已锁定的字段需要重新采集。完整性归零任务失败。',
        'scan-sweep': '样本扫描 · 移动扫描头缓慢划过面板，停怀疑区域上方积累确认度；移动过快无法成像。',
        'parkour-run': '廊桥奔越 · A/D 移动，W 或空格跳跃，空中再按一次即二段跳；S 速降、下穿薄板、在外部走廊低头躲无人机。沿外部廊桥前进：跨段、上升段、高空移动平台、下降检修道、无人机走廊，最后借弹跳板登上返回舱。蒸汽口喷发前有金色预警，无人机与蒸汽会损伤结构完整度；坠落或完整度归零任务失败，抵达尽头的返回舱即完成。'
    });

    for (const k of Object.keys(KIND_ALIAS)) a.descriptions[k] = a.descriptions[KIND_ALIAS[k]];
    const rules = {
        'leak-hunt': ['用方向键在检修面板间移动，破裂的阀门就是泄漏点。', '按空格发出声呐脉冲标记隐藏泄漏点；站在泄漏点上长按空格密封。', '弹幕花样很多：直射三连、环形、狙击快弹、扇面——金圈亮起时瞄准就已锁定，立刻走位。', '速射突袭最危险：三连快弹几乎无缝，好在间隔很长——预警期移动就能躲开。'],
        'surge-bank': ['←→ 移动接电滑轨，接住本车道下落的电涌。', '接住的电涌推高右侧能量表，按空格把表中的整组电涌存入备用电源。', '能量表涨破上限就会过载，过载三次任务失败；其他车道的电涌只是白白耗散。'],
        'credential-sort': ['凭证从左侧流入传送带，在金色分拣窗口内按键送入槽位。', '17号生物个体→① 最高日志；原武康签注→③ 销毁口。', '公共家庭记录与见证声明→② 公开档案。错分或放行流出都计入失误，三次失败。'],
        'stream-merge': ['上下两条记录道同步走带，同色的上下两块属于同一对。', '两条记录同时进入中央金色闸门时按空格合流。', '闸门内按空或放任记录走出画面都算撕裂，三次失败。'],
        'probe-steady': ['移动鼠标带动探针，青色波形通道会随时间起伏。', '探针在标记区间内会积累采样进度，采满一段自动完成记录。', '碰壁消耗外壳完整度并扣除进度；外壳过热时按空格托住。'],
        'energy-catch': ['←→ 移动合流滑板，接住与滑板描边同色的能量珠升压。', '滑板颜色每隔几秒轮换一次，必要时等它换色再接。', '接错颜色会泄漏并扣除电压，泄漏三次任务失败。'],
        'noise-filter': ['锈色噪声块进入右侧滤波窗时，按它所在轨道的键（J/K/L）滤除。', '金色「声」块是原始语音，绝不能滤除，误滤会推高静态噪声。', '噪声块漏出窗口左缘也会累积静态噪声，噪声过满任务失败。'],
        'wave-align': ['按住 ←→ 调整频率，↑↓ 调整幅度。', '让金色波形与青色虚线基准重合，右上重合度达到九成开始锁存。', '保持重合直到环形进度走满，共三段；基准会缓慢漂移，注意回拉。'],
        'purge': ['方向键驾驶维护机，按住空格连续发射净化脉冲；虚线圈是攻击范围，圈外打不到。', '重装体是六边装甲（血厚速慢、击杀计2分），疾行体是蓝色飞镖（速快皮薄、走蛇形）。', '射击体打三连弹幕，漂移体/分裂体冲核心途中也会开火，金闪与金环都是预警。', '机体过半时回核心旁完全静止两秒充能修复；机体耗尽或核心归零任务失败。'],
        'packet-run': ['信道里一次只有一枚字段碎片亮起，按坐标→人数→时间→校验的顺序逐项校验。', '用方向键操控数据包接触亮起的碎片；锁定瞬间会向外爆开一圈噪声，先撤再回。', '中弹会震松最近锁定的字段，校验顺序回退一位；集齐四枚开启上行端口。', '噪声涡流会造成校验损坏，穿入端口前别被打中。'],
        'scan-sweep': ['移动扫描头，鼠标或方向键都可以。', '停在怀疑区域上方且移动足够慢时，确认度才会推进。', '确认度满后区域自动标记，全部确认完成。'],
        'parkour-run': ['A/D 移动，W 或空格跳跃；按住跳跃键跳得更高，松手会提前收势。', '空中再按一次跳跃 = 二段跳；刚走出平台边缘的一瞬仍可起跳（土狼时间）。', '薄板从下方可以直接穿过；站在薄板上按 S 下穿，下落时按 S 加速坠降。', '蒸汽口喷发前有金色预警，无人机沿固定路线巡逻——外部走廊按住 S 低头可躲过扫掠。', '金色信标同步检查点，坠落或被撞都会损失结构完整度；抵达尽头的返回舱即完成。']
    };
    const caps = {
        'leak-hunt': ['这是检修面板，锈色圆点就是泄漏点。', '按空格发出声呐脉冲，扩散圈会标记范围内的泄漏。', '站上泄漏点长按空格，脚下的弧线走满即密封。', '泄漏点蓄力时脚下会亮金圈——先躲弹幕，再回来密封。'],
        'surge-bank': ['电涌沿四条车道下落，滑轨只能接住本车道。', '接住后能量表上升，先让它进绿色区间。', '按空格，把表中的整组电涌存入备用电源。', '表涨破上限就算过载，三次即失败；落空的电涌只是耗散。'],
        'credential-sort': ['凭证沿传送带流向中央的分拣窗口。', '进入窗口时按 1/2/3 送入对应槽位。', '17号→①最高日志，旧签注→③销毁口，公共与见证→②公开档案。', '放行流出也算失误，宁可让它停稳一拍。'],
        'stream-merge': ['上下两道记录同步走带，同色即同一对。', '只等上块进窗还不够，下块也到闸门才能合。', '两块同时进入金色闸门时按空格。', '按空或放走都算撕裂，三次任务失败。'],
        'probe-steady': ['探针跟随鼠标，青色通道随时间起伏。', '待在通道里，顶部进度条才会积累。', '外壳过热时按空格托住，避免扣进度。', '碰壁三次任务失败，跟着通道慢慢走。'],
        'energy-catch': ['能量珠沿三条车道下落。', '滑板描边要和能量珠同色才接。', '同色接取升压，错色会泄漏。', '凑满目标电压，合流闸门即恢复。'],
        'noise-filter': ['背景波形是原始语音，方块是流过的片段。', '锈色噪声块进滤波窗时按所在轨道键。', '金色「声」块绝对不能按键滤除。', '右上静态条涨满任务失败。'],
        'wave-align': ['金色是当前波形，青色虚线是基准。', '按住←→调频、↑↓调幅，看右上重合度。', '重合度到九成开始锁存环形进度。', '锁满三段完成；基准漂移时及时回拉。'],
        'purge': ['中央是核心，六种异常数据体从四周涌入。', '按住空格连射，自动预判提前量；虚线圈外打不到。', '认准体型：六边装甲要多吃几发，蓝色飞镖最快。', '机体过半回核心静止充能；机体或核心归零任务失败。'],
        'scan-sweep': ['面板是蓝图网格，样本区藏在其中。', '移动扫描头缓慢悬停在怀疑位置。', '停稳后确认度推进，圆圈逐渐显现。', '确认满自动标记，全部确认完成。'],
        'packet-run': ['信道里一次只有一枚字段碎片亮起，按坐标→人数→时间→校验的顺序逐项校验。', '用方向键操控数据包接触亮起的碎片；锁定瞬间会向外爆开一圈噪声，先撤再回。', '中弹会震松最近锁定的字段，校验顺序回退一位；集齐四枚开启上行端口。', '噪声涡流会造成校验损坏，穿入端口前别被打中。'],
        'parkour-run': ['起点在维修平台，A/D 起步，W 或空格起跳。', '上升段是阶梯薄板：从下方穿过、落在上面，空中可以再跳一次。', '高空段靠两座移动平台：横移台先上，竖升台看准再跳。', '外部走廊的无人机飞得低——按住 S 低头，等它扫过去再走。', '尽头的金色弹跳板会把你抛上返回舱平台，触碰对接环即完成。']
    };
    a.reset = function (p) {
        const target = resolveAlias(p.info);
        if (target) p.info.game = target;
        if (target === 'mouse-maze') return prev.reset.call(this, p);
        const g = MoonAction.create(p.info.game, {seed: p.seed, difficulty: p.difficulty});
        if (!g) return prev.reset.call(this, p);
        p.classic = g;
        p.history = [];
        p._lastBad = {};
        p._lastWrongAt = -9;
        const t = TIMERS[g.kind];
        if (t) {
            p.total = t;
            p.remaining = t;
        }
    };

    function done(p) {
        if (p.classic.won) a.complete(p); else if (p.classic.lost) p.finish(false);
    }

    const COUNTS = ['sealed', 'banked', 'routed', 'merges', 'samples', 'cleaned', 'locks', 'kills', 'found', 'charge', 'mistakes', 'tears', 'hits', 'leaks', 'overload'];

    function snap(g) {
        const v = [];
        for (const k of COUNTS) v.push(g[k] || 0);
        v.push(g.core ? g.core.hp : 100);
        v.push(g['static'] || 0);
        v.push(g.pressure || 0);
        return v;
    }

    a.tick = function (p, dt) {
        if (!own(p.classic)) return prev.tick.call(this, p, dt);
        const g = p.classic, before = snap(g);
        const changed = MoonAction.tick(g, dt);
        const after = snap(g), d = i => after[i] - before[i];
        if (d(0) > 0) p.scoring.award('lh密封' + g.sealed, 10);
        if (d(1) > 0) p.scoring.award('sb存入' + g.banked, 10);
        if (d(2) > 0) p.scoring.award('cs分拣' + g.routed, 10);
        if (d(3) > 0) p.scoring.award('sm合流' + g.merges, 10);
        if (d(4) > 0) p.scoring.award('ps采样' + g.samples, 10);
        if (d(5) > 0) p.scoring.award('nf滤除' + g.cleaned, 10);
        if (d(6) > 0) p.scoring.award('wa锁存' + g.locks, 10);
        if (d(7) > 0) p.scoring.award('pg清除' + g.kills, 10);
        if (d(8) > 0) p.scoring.award('ss确认' + g.found, 10);
        if (d(9) >= 14) p.scoring.award('ec电压' + g.charge, 10);
        if (!p._lastBad) p._lastBad = {};

        const bad = (key, text) => {
            const last = p._lastBad[key];
            if (last === undefined || g.elapsed - last >= 1.2) {
                p._lastBad[key] = g.elapsed;
                p._lastWrongAt = g.elapsed;
                p.wrong(text);
            } else p.scoring.mistake();
        };
        if (g.kind === 'credential-sort' && d(10) > 0) bad('cs', BAD.cs);
        if (g.kind === 'stream-merge' && (d(10) > 0 || d(11) > 0)) bad('sm', BAD.sm);
        if (g.kind === 'probe-steady' && d(12) > 0) bad('ps', BAD.ps);
        if (g.kind === 'energy-catch' && d(13) > 0) bad('ec', BAD.ec);
        if (g.kind === 'surge-bank' && d(14) > 0) bad('sb', BAD.sb);
        if (g.kind === 'noise-filter' && d(16) > 0) bad('nf', BAD.nf);
        if (g.kind === 'purge' && d(12) > 0) bad('pg2', BAD.pg2);
        if (g.kind === 'purge' && d(15) < 0) bad('pg', BAD.pg);
        if (g.kind === 'leak-hunt' && d(12) > 0) bad('lh2', BAD.lh2);
        if (g.kind === 'packet-run' && d(12) > 0) bad('pr', '校验完整性受损——躲开噪声涡流！');
        if (g.kind === 'leak-hunt' && before[17] <= 50 && after[17] > 50) bad('lh', BAD.lh);
        if (g.kind === 'parkour-run') {
            if (g.cells > (p._pkCells || 0)) {
                p.scoring.award('pk能量珠' + g.cells, 10);
                p._pkCells = g.cells;
            }
            if (g.hits > (p._pkHits || 0)) bad('pk', '被撞上了！无敌时间里快速撤离，从信标再出发。');
            if (g.falls > (p._pkFalls || 0)) bad('pk', '坠出廊桥！回到最近的信标重新出发。');
            p._pkHits = g.hits;
            p._pkFalls = g.falls;
        }
        if (changed) this.drawAction(p);
        done(p);
    };
    a.expandedKey = function (p, code) {
        if (!own(p.classic)) return prev.key ? prev.key.call(this, p, code) : false;
        if (!p.started || p.result) return false;
        return MoonAction.press(p.classic, code);
    };
    a.newRelease = function (p, code) {
        if (p.classic && own(p.classic) && p.started && !p.result) {
            MoonAction.release(p.classic, code);
            return;
        }
        if (prev.release) prev.release.call(this, p, code);
    };

    function tx(c, txt, x, y, size, color, align) {
        c.font = size + 'px sans-serif';
        c.fillStyle = color;
        c.textAlign = align || 'left';
        c.textBaseline = 'alphabetic';
        c.fillText(txt, x, y);
    }

    function bar(c, x, y, w, h, v, color) {
        v = Math.max(0, Math.min(1, v));
        c.fillStyle = '#22343c';
        c.fillRect(x, y, w, h);
        c.fillStyle = color;
        c.fillRect(x, y, w * v, h);
        c.strokeStyle = C.line;
        c.lineWidth = 1;
        c.strokeRect(x + .5, y + .5, w - 1, h - 1);
    }

    function ring(c, x, y, r, color, width, alpha) {
        c.globalAlpha = alpha === undefined ? 1 : alpha;
        c.strokeStyle = color;
        c.lineWidth = width || 2;
        c.beginPath();
        c.arc(x, y, r, 0, 6.2832);
        c.stroke();
        c.globalAlpha = 1;
    }

    function runner(c, x, y) {
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath();
        c.ellipse(x, y + 13, 10, 3.5, 0, 0, 6.2832);
        c.fill();
        c.fillStyle = '#546b74';
        c.fillRect(x - 7, y - 6, 14, 15);
        c.fillStyle = '#6d8791';
        c.fillRect(x - 9.5, y - 3, 3, 9);
        c.fillRect(x + 6.5, y - 3, 3, 9);
        c.fillStyle = '#e6c989';
        c.beginPath();
        c.arc(x, y - 11, 7, 0, 6.2832);
        c.fill();
        c.fillStyle = '#22333d';
        c.fillRect(x - 5, y - 13, 10, 4);
        c.fillStyle = C.teal;
        c.fillRect(x - 3, y - 12.2, 6, 2);
        c.strokeStyle = '#c9b285';
        c.lineWidth = 1;
        c.strokeRect(x - 7.5, y - 6.5, 15, 16);
    }

    function wavePath(c, f) {
        c.beginPath();
        for (let x = 40; x <= 560; x += 4) {
            const y = f(x);
            if (x === 40) c.moveTo(x, y); else c.lineTo(x, y);
        }
    }

    function bg(c, g) {
        c.save();
        const grad = c.createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, C.bg0);
        grad.addColorStop(1, C.bg1);
        c.fillStyle = grad;
        c.fillRect(0, 0, 600, 300);
        if (g.shake > 0) c.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
        c.strokeStyle = C.grid;
        c.lineWidth = 1;
        c.globalAlpha = .45;
        const off = (g.elapsed * 9) % 60;
        for (let x = -off; x < 600; x += 60) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, 300);
            c.stroke();
        }
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(141,178,166,.05)';
        c.fillRect(0, (g.elapsed * 26) % 340 - 20, 600, 26);
        c.fillStyle = 'rgba(228,209,169,.18)';
        for (let i = 0; i < 16; i++) c.fillRect((i * 137 + g.elapsed * (5 + i % 4 * 4)) % 600, (i * 211 + g.elapsed * (1.5 + i % 3)) % 300, 1.5, 1.5);
    }

    function fg(c, g) {
        c.restore();
        if (g.flash > 0) {
            c.fillStyle = 'rgba(240,219,173,' + Math.min(1, g.flash * .25).toFixed(3) + ')';
            c.fillRect(0, 0, 600, 300);
        }
    }

    function canvasPoint(cv, e) {
        const r = cv.getBoundingClientRect(), s = Math.min(r.width / 600, r.height / 300) || 1;
        return {
            x: (e.clientX - r.left - (r.width - 600 * s) / 2) / s,
            y: (e.clientY - r.top - (r.height - 300 * s) / 2) / s
        };
    }

    const SVG_ART = {
        drone: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0dcae"/><stop offset="1" stop-color="#c9a55e"/></linearGradient></defs><path d="M32 4 L44 26 L52 46 L38 40 L32 44 L26 40 L12 46 L20 26 Z" fill="url(#dg)" stroke="#8a7347" stroke-width="2"/><path d="M32 12 L38 26 L32 34 L26 26 Z" fill="#8db2a6" stroke="#5b7d76" stroke-width="1.5"/><circle cx="32" cy="20" r="3" fill="#f0dbad"/><path d="M22 46 L26 56 M42 46 L38 56" stroke="#8a7347" stroke-width="3" stroke-linecap="round"/></svg>',
        blob0: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="bg0" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#d8a184"/><stop offset="1" stop-color="#8a4f3d"/></radialGradient></defs><path d="M32 8 C46 10 56 22 54 36 C52 50 40 58 28 55 C14 52 8 40 12 27 C15 16 22 7 32 8 Z" fill="url(#bg0)" stroke="#5e3b2e" stroke-width="2"/><circle cx="27" cy="27" r="7" fill="#b0685c" opacity="0.7"/><circle cx="38" cy="40" r="4" fill="#5e3b2e" opacity="0.6"/></svg>',
        blob1: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4 L38 18 L52 10 L48 26 L60 32 L48 38 L52 54 L38 46 L32 60 L26 46 L12 54 L16 38 L4 32 L16 26 L12 10 L26 18 Z" fill="#a35b40" stroke="#5e3b2e" stroke-width="2"/><circle cx="32" cy="32" r="9" fill="#2c1b15"/><circle cx="32" cy="32" r="4.5" fill="#e0c48f"/></svg>',
        blob2: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6 L50 40 L32 58 L14 40 Z" fill="#c69777" stroke="#5e3b2e" stroke-width="3"/></svg>',
        blob3: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="24" cy="32" r="16" fill="#a35b40" stroke="#5e3b2e" stroke-width="2"/><circle cx="41" cy="32" r="16" fill="#c69777" stroke="#5e3b2e" stroke-width="2"/><circle cx="24" cy="32" r="5" fill="#5e3b2e" opacity="0.5"/><circle cx="41" cy="32" r="5" fill="#5e3b2e" opacity="0.5"/></svg>',
        blob4: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="tk" cx="0.38" cy="0.32" r="0.9"><stop offset="0" stop-color="#b3826a"/><stop offset="1" stop-color="#6e4232"/></radialGradient></defs><path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" fill="url(#tk)" stroke="#4a2c21" stroke-width="2.5"/><path d="M14 16 L50 16 M14 48 L50 48" stroke="#4a2c21" stroke-width="2" opacity="0.7"/><circle cx="20" cy="22" r="3" fill="#4a2c21"/><circle cx="44" cy="22" r="3" fill="#4a2c21"/><circle cx="20" cy="42" r="3" fill="#4a2c21"/><circle cx="44" cy="42" r="3" fill="#4a2c21"/><circle cx="32" cy="32" r="9" fill="#3a221a"/><path d="M28 32 L36 32 M32 28 L32 36" stroke="#c69777" stroke-width="2.5"/></svg>',
        blob5: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4 C44 20 48 34 44 48 L32 60 L20 48 C16 34 20 20 32 4 Z" fill="#8eacc0" stroke="#41618c" stroke-width="2"/><path d="M32 14 L38 36 L32 48 L26 36 Z" fill="#d7e8ef"/><circle cx="32" cy="24" r="4" fill="#213e4b"/></svg>',
        core: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#3f5a63" stroke-width="6"/><circle cx="48" cy="48" r="30" fill="#14262e" stroke="#8db2a6" stroke-width="3"/><circle cx="48" cy="48" r="18" fill="none" stroke="#78a29e" stroke-width="2" stroke-dasharray="6 5"/><path d="M48 34 L56 48 L48 62 L40 48 Z" fill="#8db2a6"/><circle cx="48" cy="48" r="4" fill="#e0c48f"/></svg>',
        lhSuit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="hull" cx="0.38" cy="0.32" r="0.9"><stop offset="0" stop-color="#ece6d0"/><stop offset="0.55" stop-color="#cfc9ae"/><stop offset="1" stop-color="#96917a"/></radialGradient><linearGradient id="pod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8468"/><stop offset="1" stop-color="#b8b39a"/></linearGradient></defs><ellipse cx="33" cy="35" rx="22" ry="20" fill="#0a141a" opacity="0.35"/><circle cx="32" cy="32" r="19" fill="url(#hull)" stroke="#6d7461" stroke-width="2"/><circle cx="32" cy="32" r="13.5" fill="#1b303a" stroke="#3f5a63" stroke-width="1.5"/><circle cx="32" cy="32" r="6.5" fill="#8db2a6"/><circle cx="30" cy="30" r="2.2" fill="#f0dbad"/><rect x="3" y="27" width="10" height="10" rx="3" fill="url(#pod)" stroke="#6d7461" stroke-width="1.5"/><rect x="51" y="27" width="10" height="10" rx="3" fill="url(#pod)" stroke="#6d7461" stroke-width="1.5"/><path d="M13 22 L21 26 M13 42 L21 38" stroke="#6d7461" stroke-width="2"/><path d="M51 22 L43 26 M51 42 L43 38" stroke="#6d7461" stroke-width="2"/><circle cx="32" cy="12" r="2.5" fill="#c69777"/><circle cx="32" cy="52" r="2.5" fill="#8db2a6"/></svg>',
        lhLeak: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="lk" cx="0.4" cy="0.35" r="0.85"><stop offset="0" stop-color="#d8a184"/><stop offset="1" stop-color="#8a4f3d"/></radialGradient></defs><rect x="6" y="24" width="52" height="16" rx="5" fill="#31525c" stroke="#46544f" stroke-width="2"/><circle cx="32" cy="32" r="13" fill="url(#lk)" stroke="#5e3b2e" stroke-width="2"/><path d="M26 26 L30 34 L24 38" stroke="#5e3b2e" stroke-width="2.5" fill="none"/><circle cx="37" cy="35" r="3.5" fill="#b0685c"/><path d="M30 40 q3 5 -1 9" stroke="#c69777" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
        lhSeal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="24" width="52" height="16" rx="5" fill="#31525c" stroke="#46544f" stroke-width="2"/><circle cx="32" cy="32" r="13" fill="#dfc694" stroke="#8a7347" stroke-width="2.5"/><circle cx="32" cy="32" r="7" fill="#e0c48f" stroke="#8a7347" stroke-width="1.5"/><path d="M27 32 L31 36 L38 28" stroke="#31443c" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="32" r="2.5" fill="#8a7347"/><circle cx="50" cy="32" r="2.5" fill="#8a7347"/></svg>',
        lhDrop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><radialGradient id="dp" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#e8b296"/><stop offset="1" stop-color="#a05a41"/></radialGradient></defs><path d="M16 3 C21 12 26 17 26 22 A10 10 0 0 1 6 22 C6 17 11 12 16 3 Z" fill="url(#dp)" stroke="#5e3b2e" stroke-width="1.5"/><ellipse cx="13" cy="21" rx="3" ry="4.5" fill="#e8ccb8" opacity="0.55"/></svg>',
        pkCore: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="pk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0c48f"/><stop offset="1" stop-color="#b08d52"/></linearGradient></defs><path d="M32 5 L55 18 L55 46 L32 59 L9 46 L9 18 Z" fill="url(#pk)" stroke="#8a7347" stroke-width="2.5"/><path d="M32 14 L46 22 L46 42 L32 50 L18 42 L18 22 Z" fill="#2c3f36" opacity="0.85"/><path d="M32 24 L40 28 L40 38 L32 42 L24 38 L24 28 Z" fill="#8db2a6"/><circle cx="32" cy="33" r="3.5" fill="#f0dbad"/></svg>',
        pkNoise: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="none" stroke="#a05a41" stroke-width="4" stroke-dasharray="9 7"/><circle cx="24" cy="24" r="7" fill="#6e3b2e"/><circle cx="21" cy="21" r="2.5" fill="#d8a184"/></svg>',
        pkOrb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><radialGradient id="po" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#f4e3b8"/><stop offset="0.6" stop-color="#dfc694"/><stop offset="1" stop-color="#a8865a"/></radialGradient></defs><circle cx="16" cy="16" r="11" fill="url(#po)" stroke="#8a7347" stroke-width="1.5"/><path d="M16 8 L19 14 L16 20 L13 14 Z" fill="#8db2a6"/><circle cx="12.5" cy="11.5" r="2" fill="#f0dbad"/></svg>',
        pkGoal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="pgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db2a6"/><stop offset="1" stop-color="#5b7d76"/></linearGradient></defs><path d="M32 10 L48 22 L44 44 L32 54 L20 44 L16 22 Z" fill="url(#pgl)" stroke="#3f5a63" stroke-width="2.5"/><path d="M32 18 L41 26 L32 40 L23 26 Z" fill="#14262e"/><circle cx="32" cy="28" r="4" fill="#e0c48f"/><path d="M23 46 L41 46" stroke="#3f5a63" stroke-width="2.5"/><path d="M27 46 L27 52 M37 46 L37 52" stroke="#3f5a63" stroke-width="3"/></svg>',
        pkPost: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64"><rect x="21" y="14" width="5" height="46" rx="2" fill="#546b74" stroke="#3a4c50" stroke-width="1.5"/><ellipse cx="23.5" cy="60" rx="9" ry="3" fill="#2c3f36"/><path d="M26 14 L42 20 L26 27 Z" fill="#8a7347"/><circle cx="23.5" cy="12" r="4" fill="#dfc694" stroke="#8a7347" stroke-width="1.5"/></svg>',
        pkRunner: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="pw" cx="0.35" cy="0.28" r="0.95"><stop offset="0" stop-color="#fbf8ec"/><stop offset="0.65" stop-color="#e3ddc8"/><stop offset="1" stop-color="#a8a288"/></radialGradient></defs><rect x="5" y="24" width="12" height="16" rx="5" fill="#c9c4ad" stroke="#6d7461" stroke-width="1.8"/><rect x="8" y="28" width="6" height="5" rx="2" fill="#e0a05a"/><circle cx="11" cy="37.5" r="2" fill="#8db2a6"/><rect x="13.5" y="31" width="8" height="14" rx="4" fill="#e9e4d0" stroke="#8a8570" stroke-width="1.4"/><rect x="44.5" y="31" width="8" height="14" rx="4" fill="#e9e4d0" stroke="#8a8570" stroke-width="1.4"/><rect x="19" y="28" width="28" height="21" rx="9" fill="url(#pw)" stroke="#7d7862" stroke-width="2"/><rect x="27" y="34" width="11" height="8.5" rx="2.5" fill="#e0a05a" stroke="#8a5a30" stroke-width="1.4"/><circle cx="30.2" cy="38.2" r="1.7" fill="#8db2a6"/><path d="M33.8 38.2 L36.2 38.2" stroke="#5c4322" stroke-width="1.5"/><path d="M25 4 L25 5.4" stroke="#8a7347" stroke-width="1.6"/><ellipse cx="32" cy="16" rx="15" ry="12.5" fill="url(#pw)" stroke="#7d7862" stroke-width="2"/><ellipse cx="36.5" cy="16.5" rx="8.8" ry="8" fill="#1a2830" stroke="#c9b285" stroke-width="1.6"/><circle cx="39.5" cy="13.5" r="2.2" fill="#e8f2f2" opacity="0.92"/><circle cx="35" cy="20" r="1.4" fill="#8db2a6"/><path d="M19.5 11.5 A14.5 11.5 0 0 1 24.5 5.5" stroke="#fbf8ec" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>'
    };
    const SPRITE = {};

    function sprite(name) {
        if (SPRITE[name]) return SPRITE[name];
        if (SPRITE[name] === null) return null;
        const art = SVG_ART[name];
        if (!art) return null;
        SPRITE[name] = null;
        try {
            const img = new Image();
            img.onload = () => {
                SPRITE[name] = img;
            };
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art);
        } catch (e) {
            return null;
        }
        return null;
    }

    const DRAW = {
        'leak-hunt'(c, g) {

            for (const [py, label] of [[46, '生物循环 · A 回路'], [254, '生物循环 · B 回路']]) {
                const grd = c.createLinearGradient(0, py, 0, py + 22);
                grd.addColorStop(0, '#2a4652');
                grd.addColorStop(.5, '#1f3844');
                grd.addColorStop(1, '#15242d');
                c.fillStyle = grd;
                c.beginPath();
                c.roundRect(20, py, 560, 22, 8);
                c.fill();
                c.strokeStyle = C.line;
                c.lineWidth = 1.5;
                c.stroke();
                c.fillStyle = '#3a5a66';
                c.fillRect(20, py - 2, 7, 26);
                c.fillRect(573, py - 2, 7, 26);
                for (let x = 44; x < 576; x += 48) {
                    c.beginPath();
                    c.arc(x, py + 11, 2, 0, 6.2832);
                    c.fill();
                }
                tx(c, label, 32, py - 6, 10, C.dim);
            }
            for (const u of g.pulses) ring(c, u.x, u.y, u.r, C.teal, 2, Math.max(0, 1 - u.age / 1.4));
            for (let i = 0; i < g.leaks.length; i++) {
                const le = g.leaks[i];
                if (le.sealed) {
                    const sIm = sprite('lhSeal');
                    if (sIm) c.drawImage(sIm, le.x - 18, le.y - 18, 36, 36);
                    else {
                        c.fillStyle = C.gold;
                        c.beginPath();
                        c.arc(le.x, le.y, 8, 0, 6.2832);
                        c.fill();
                    }
                } else if (le.found) {

                    if (le.timer < 0.5) {
                        const k = (0.5 - le.timer) / 0.5;
                        ring(c, le.x, le.y, 12 + k * 9, C.gold, 2.5, .35 + .55 * k);
                    }
                    const lIm = sprite('lhLeak');
                    if (lIm) {
                        const sz = 36 + Math.sin(g.elapsed * 6) * 3;
                        c.drawImage(lIm, le.x - sz / 2, le.y - sz / 2, sz, sz);
                    } else {
                        const r = 7 + Math.sin(g.elapsed * 6) * 2;
                        c.globalAlpha = .85;
                        c.fillStyle = C.rust;
                        c.beginPath();
                        c.arc(le.x, le.y, r, 0, 6.2832);
                        c.fill();
                        c.globalAlpha = 1;
                    }
                    ring(c, le.x, le.y, 15, C.gold, 1.5, .55 + .4 * Math.sin(g.elapsed * 6));

                    const dy = (g.elapsed * 40 + i * 17) % 30;
                    c.globalAlpha = Math.max(0, 1 - dy / 30);
                    c.fillStyle = C.rust;
                    c.beginPath();
                    c.arc(le.x + 4, le.y + 8 + dy, 2.2, 0, 6.2832);
                    c.fill();
                    c.globalAlpha = 1;
                }
            }
            for (const b of (g.shots || [])) {
                const ba = Math.atan2(b.vy, b.vx);
                c.strokeStyle = C.rust;
                c.globalAlpha = .45;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(b.x - b.vx * .05, b.y - b.vy * .05);
                c.lineTo(b.x, b.y);
                c.stroke();
                c.globalAlpha = 1;
                const dIm = sprite('lhDrop');
                if (dIm) {
                    c.save();
                    c.translate(b.x, b.y);
                    c.rotate(ba + 1.5708);
                    c.drawImage(dIm, -7, -7, 14, 14);
                    c.restore();
                } else {
                    c.fillStyle = C.rust;
                    c.beginPath();
                    c.arc(b.x, b.y, 5, 0, 6.2832);
                    c.fill();
                    c.fillStyle = C.white;
                    c.beginPath();
                    c.arc(b.x - 1.5, b.y - 1.5, 1.8, 0, 6.2832);
                    c.fill();
                }
            }
            if (g.hold > 0) {
                c.strokeStyle = C.gold;
                c.lineWidth = 3;
                c.beginPath();
                c.arc(g.player.x, g.player.y, 17, -1.5708, -1.5708 + 6.2832 * Math.min(1, g.hold / 1.0));
                c.stroke();
            }

            const hov = Math.sin(g.elapsed * 3) * 1.5;
            c.globalAlpha = .16 + .06 * Math.sin(g.elapsed * 3);
            c.fillStyle = C.teal;
            c.beginPath();
            c.ellipse(g.player.x, g.player.y + 14, 15, 5.5, 0, 0, 6.2832);
            c.fill();
            c.globalAlpha = 1;
            if (g.iT > 0 && Math.floor(g.elapsed * 14) % 2) c.globalAlpha = .45;
            const suitImg = sprite('lhSuit');
            if (suitImg) c.drawImage(suitImg, g.player.x - 20, g.player.y - 20 + hov, 40, 40);
            else runner(c, g.player.x, g.player.y);
            c.globalAlpha = 1;
            const sh = g.shield === undefined ? 3 : g.shield;
            tx(c, '泄漏压力', 14, 20, 12, C.text);
            bar(c, 14, 26, 150, 8, g.pressure / 100, g.pressure < 40 ? C.teal : g.pressure < 70 ? C.rust : C.red);
            tx(c, '密封 ' + g.sealed + ' / ' + g.leaks.length + ' · ' + (g.cd <= 0 ? '冷却就绪' : '充能中'), 586, 20, 12, C.text, 'right');
            tx(c, '护盾', 586, 42, 10, C.dim, 'right');
            for (let i = 0; i < sh; i++) {
                c.fillStyle = i === 0 && sh <= 1 ? C.red : C.gold;
                c.fillRect(578 - i * 13, 35, 8, 8);
            }

            const vg = c.createRadialGradient(300, 150, 130, 300, 150, 340);
            vg.addColorStop(0, 'rgba(4,10,14,0)');
            vg.addColorStop(1, 'rgba(4,10,14,.38)');
            c.fillStyle = vg;
            c.fillRect(0, 0, 600, 300);
        },
        'surge-bank'(c, g) {
            c.strokeStyle = C.grid;
            c.lineWidth = 1;
            c.globalAlpha = .4;
            c.beginPath();
            c.moveTo(10, 34);
            c.lineTo(10, 268);
            c.moveTo(530, 34);
            c.lineTo(530, 268);
            c.stroke();
            c.globalAlpha = 1;
            for (const x of [140, 270, 400]) {
                c.beginPath();
                c.moveTo(x, 34);
                c.lineTo(x, 268);
                c.stroke();
            }
            ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'].forEach((t, i) => tx(c, t, 75 + i * 130, 296, 13, C.sand, 'center'));
            c.strokeStyle = C.teal;
            c.globalAlpha = .5;
            c.setLineDash([6, 6]);
            c.beginPath();
            c.moveTo(10, 250);
            c.lineTo(530, 250);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = 1;
            for (const pk of g.packets) {
                const x = 75 + pk.lane * 130;
                c.fillStyle = C.teal;
                c.beginPath();
                c.roundRect(x - 13, pk.y - 8, 26, 16, 4);
                c.fill();
                c.strokeStyle = C.white;
                c.lineWidth = 1;
                c.stroke();
                tx(c, '⚡', x, pk.y + 4, 11, C.white, 'center');
            }
            const cx = 75 + g.cart * 130;
            c.fillStyle = C.gold;
            c.beginPath();
            c.roundRect(cx - 45, 256, 90, 26, 5);
            c.fill();
            c.strokeStyle = '#8a7347';
            c.lineWidth = 1.5;
            c.stroke();
            c.strokeStyle = C.gold2;
            c.beginPath();
            c.moveTo(cx, 256);
            c.lineTo(cx, 244);
            c.stroke();
            c.fillStyle = C.gold2;
            c.beginPath();
            c.arc(cx, 241, 3, 0, 6.2832);
            c.fill();
            tx(c, '接电滑轨', cx, 273, 10, '#1d2b26', 'center');
            const mx = 554, mt = 40, mh = 220;
            c.fillStyle = '#22343c';
            c.fillRect(mx, mt, 18, mh);
            c.fillStyle = 'rgba(141,178,166,.2)';
            c.fillRect(mx, mt, 18, mh * .66);
            const my = mt + mh * (1 - Math.min(100, g.meter) / 100);
            c.fillStyle = g.meter >= 34 ? C.teal : C.rust;
            c.fillRect(mx + 1, my, 16, mt + mh - my);
            c.strokeStyle = C.line;
            c.lineWidth = 1;
            c.strokeRect(mx + .5, mt + .5, 17, mh - 1);
            c.strokeStyle = C.gold;
            c.beginPath();
            c.moveTo(mx - 3, mt + mh * .66);
            c.lineTo(mx + 21, mt + mh * .66);
            c.stroke();
            tx(c, '能量表', mx + 9, mt - 8, 10, C.dim, 'center');
            tx(c, '已存入 ' + g.banked + ' / ' + [6, 8, 10][g.tier] + ' · 过载 ' + g.overload + ' / 3', 14, 20, 12, C.text);
        },
        'credential-sort'(c, g) {
            c.fillStyle = '#152831';
            c.fillRect(0, 128, 600, 44);
            c.strokeStyle = C.grid;
            c.globalAlpha = .6;
            c.lineWidth = 1.5;
            const ao = (g.elapsed * 40) % 36;
            for (let x = -36 + ao; x < 600; x += 36) {
                c.beginPath();
                c.moveTo(x, 142);
                c.lineTo(x + 12, 150);
                c.lineTo(x, 158);
                c.stroke();
            }
            c.globalAlpha = 1;
            c.strokeStyle = C.gold;
            c.lineWidth = 1.5;
            c.setLineDash([5, 4]);
            c.beginPath();
            c.moveTo(260, 116);
            c.lineTo(260, 184);
            c.moveTo(340, 116);
            c.lineTo(340, 184);
            c.moveTo(260, 116);
            c.lineTo(274, 116);
            c.moveTo(340, 116);
            c.lineTo(326, 116);
            c.moveTo(260, 184);
            c.lineTo(274, 184);
            c.moveTo(340, 184);
            c.lineTo(326, 184);
            c.stroke();
            c.setLineDash([]);
            tx(c, '分拣窗口', 300, 110, 11, C.gold, 'center');
            const chip = [C.teal, C.rust, C.blue, C.sand];
            for (const cd of g.cards) {
                if (cd.routed) continue;
                c.fillStyle = '#efe6cd';
                c.beginPath();
                c.roundRect(cd.x - 22, 137, 44, 26, 4);
                c.fill();
                c.strokeStyle = C.gold;
                c.lineWidth = 1.5;
                c.stroke();
                c.fillStyle = chip[cd.type % 4] || C.teal;
                c.fillRect(cd.x - 17, 142, 5, 16);
                tx(c, (g.names[cd.type] || '凭证').slice(0, 2), cd.x + 5, 155, 12, '#2c3a33', 'center');
            }
            [['① 最高日志', '键 1', 100], ['② 公开档案', '键 2', 300], ['③ 销毁口', '键 3', 500]].forEach(s => {
                c.strokeStyle = C.line;
                c.lineWidth = 1;
                c.strokeRect(s[2] - 70, 234, 140, 36);
                tx(c, s[0], s[2], 250, 12, C.text, 'center');
                tx(c, s[1], s[2], 263, 10, C.dim, 'center');
            });
            tx(c, '已分拣 ' + g.routed + ' / ' + [8, 10, 12][g.tier] + ' · 失误 ' + g.mistakes + ' / 3', 14, 20, 12, C.text);
        },
        'stream-merge'(c, g) {
            const cols = [C.teal, C.sand, C.blue, C.gold2];
            for (const y of [95, 205]) {
                c.strokeStyle = C.grid;
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(20, y);
                c.lineTo(580, y);
                c.stroke();
                c.globalAlpha = .4;
                const to = (g.elapsed * 40) % 24;
                for (let x = 20 - to; x < 580; x += 24) {
                    c.beginPath();
                    c.moveTo(x + 12, y - 4);
                    c.lineTo(x, y);
                    c.lineTo(x + 12, y + 4);
                    c.stroke();
                }
                c.globalAlpha = 1;
            }
            const active = g.pairs.some(pr => !pr.merged && Math.abs(pr.x - 300) <= 28);
            c.strokeStyle = active ? C.white : C.gold;
            c.lineWidth = active ? 2.5 : 1.5;
            c.globalAlpha = active ? 1 : .75;
            c.setLineDash([6, 4]);
            c.beginPath();
            c.moveTo(272, 56);
            c.lineTo(272, 244);
            c.moveTo(328, 56);
            c.lineTo(328, 244);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = 1;
            if (active) {
                ring(c, 300, 150, 84, C.gold, 1, .25 + .2 * Math.sin(g.elapsed * 8));
                tx(c, '按空格合流', 300, 46, 12, C.white, 'center');
            } else tx(c, '中央闸门', 300, 46, 11, C.dim, 'center');
            for (const pr of g.pairs) {
                const col = cols[pr.color % 4];
                if (pr.merged) {
                    c.strokeStyle = col;
                    c.globalAlpha = .45 + .3 * Math.abs(Math.sin(g.elapsed * 9));
                    c.lineWidth = 2;
                    c.beginPath();
                    c.moveTo(pr.x, 95);
                    c.lineTo(pr.x, 205);
                    c.stroke();
                    c.globalAlpha = 1;
                }
                c.fillStyle = col;
                c.beginPath();
                c.roundRect(pr.x - 11, 88, 22, 14, 3);
                c.fill();
                c.beginPath();
                c.roundRect(pr.x - 11, 198, 22, 14, 3);
                c.fill();
            }
            tx(c, '已合流 ' + g.merges + ' / ' + [7, 9, 11][g.tier] + ' · 撕裂 ' + g.tears + ' / 3', 14, 20, 12, C.text);
        },
        'probe-steady'(c, g) {
            const gap = [26, 20, 15][g.tier],
                cy = 150 + Math.sin(g.elapsed * .7) * 24 + Math.sin(g.elapsed * 1.13 + 2) * 12;
            c.strokeStyle = C.grid;
            c.globalAlpha = .3;
            c.lineWidth = 1;
            for (let x = -300; x < 600; x += 14) {
                c.beginPath();
                c.moveTo(x, 0);
                c.lineTo(x + 300, 300);
                c.stroke();
            }
            c.globalAlpha = 1;
            c.fillStyle = 'rgba(141,178,166,.12)';
            c.fillRect(0, cy - gap, 600, gap * 2);

            c.strokeStyle = C.teal;
            c.globalAlpha = .55;
            c.lineWidth = 1.5;
            c.beginPath();
            for (let x = 0; x <= 600; x += 6) {
                const y = cy - gap * .45 * Math.sin(x * .045 - g.elapsed * 3);
                if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
            c.stroke();
            c.globalAlpha = 1;
            c.strokeStyle = g.heat > 0 ? C.rust : C.line;
            c.lineWidth = g.heat > 0 ? 2.5 : 1.5;
            c.beginPath();
            c.moveTo(0, cy - gap);
            c.lineTo(600, cy - gap);
            c.moveTo(0, cy + gap);
            c.lineTo(600, cy + gap);
            c.stroke();
            c.strokeStyle = C.teal;
            c.globalAlpha = .5;
            c.setLineDash([3, 5]);
            c.beginPath();
            c.moveTo(60, 10);
            c.lineTo(60, cy - gap - 6);
            c.moveTo(540, 10);
            c.lineTo(540, cy - gap - 6);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = 1;
            c.strokeStyle = C.dim;
            c.globalAlpha = .3;
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(g.probe.x, g.probe.y);
            c.lineTo(g.pointer.x, g.pointer.y);
            c.stroke();
            c.globalAlpha = 1;
            const px = g.probe.x, py = g.probe.y;
            c.strokeStyle = C.gold;
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(px, py, 9, 0, 6.2832);
            c.stroke();
            c.beginPath();
            c.moveTo(px - 15, py);
            c.lineTo(px - 5, py);
            c.moveTo(px + 5, py);
            c.lineTo(px + 15, py);
            c.moveTo(px, py - 15);
            c.lineTo(px, py - 5);
            c.moveTo(px, py + 5);
            c.lineTo(px, py + 15);
            c.stroke();
            c.fillStyle = C.gold;
            c.fillRect(px - 1.5, py - 1.5, 3, 3);
            bar(c, 60, 20, 480, 7, g.progress / 100, C.teal);
            tx(c, '采样进度', 586, 27, 10, C.dim, 'right');
            for (let i = 0; i < 3; i++) {
                if (i < g.samples) {
                    c.fillStyle = C.teal;
                    c.beginPath();
                    c.arc(24 + i * 13, 23, 4.5, 0, 6.2832);
                    c.fill();
                } else {
                    c.strokeStyle = C.dim;
                    c.lineWidth = 1;
                    c.beginPath();
                    c.arc(24 + i * 13, 23, 4.5, 0, 6.2832);
                    c.stroke();
                }
            }
            if (g.heat > 0) tx(c, '外壳过热 —— 按空格托住', 300, 288, 13, C.rust, 'center');
            tx(c, '外壳完整 ' + (3 - g.hits) + ' / 3', 14, 44, 12, C.text);
        },
        'energy-catch'(c, g) {
            const cols = [C.teal, C.sand, C.blue];
            c.strokeStyle = C.line;
            c.lineWidth = 1.5;
            c.globalAlpha = .85;
            c.beginPath();
            c.moveTo(200, 30);
            c.lineTo(200, 262);
            c.moveTo(400, 30);
            c.lineTo(400, 262);
            c.stroke();
            c.globalAlpha = .55;
            c.beginPath();
            c.moveTo(8, 30);
            c.lineTo(8, 262);
            c.moveTo(592, 30);
            c.lineTo(592, 262);
            c.stroke();
            c.globalAlpha = 1;
            c.strokeStyle = C.teal;
            c.globalAlpha = .45;
            c.setLineDash([6, 6]);
            c.beginPath();
            c.moveTo(20, 256);
            c.lineTo(580, 256);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = 1;
            for (const o of g.orbs) {
                const x = 100 + o.lane * 200, col = cols[o.color % 3];
                c.globalAlpha = .13;
                c.fillStyle = col;
                c.beginPath();
                c.arc(x, o.y, 17, 0, 6.2832);
                c.fill();
                c.globalAlpha = .9;
                c.beginPath();
                c.arc(x, o.y, 7, 0, 6.2832);
                c.fill();
                c.globalAlpha = 1;
                c.fillStyle = C.white;
                c.beginPath();
                c.arc(x - 2, o.y - 2, 2, 0, 6.2832);
                c.fill();
            }
            const sx = 100 + g.sled.lane * 200, sc = cols[g.sled.color % 3];
            if (g.autoColor) c.globalAlpha = .45 + .55 * Math.abs(Math.sin(g.elapsed * 4));
            c.fillStyle = 'rgba(20,32,38,.55)';
            c.beginPath();
            c.roundRect(sx - 46, 266, 92, 26, 6);
            c.fill();
            c.strokeStyle = sc;
            c.lineWidth = 2.5;
            c.beginPath();
            c.roundRect(sx - 46, 266, 92, 26, 6);
            c.stroke();
            c.globalAlpha = 1;
            tx(c, '合流闸门', sx, 283, 10, sc, 'center');
            const target = [70, 90, 110][g.tier];
            bar(c, 60, 30, 480, 8, Math.min(1, g.charge / target), C.teal);
            c.strokeStyle = C.gold;
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(540, 26);
            c.lineTo(540, 42);
            c.stroke();
            tx(c, '电压 ' + g.charge + ' / ' + target + ' · 泄漏 ' + g.leaks + ' / 3', 14, 20, 12, C.text);
        },
        'noise-filter'(c, g) {
            const damp = 1 - g['static'] / 140;
            c.strokeStyle = C.gold;
            c.globalAlpha = .7;
            c.lineWidth = 1.5;
            c.beginPath();
            for (let x = 0; x <= 600; x += 6) {
                const y = 150 + Math.sin(x * .045 + g.elapsed * 2.2) * 30 * damp + Math.sin(x * .013 - g.elapsed * 1.1) * 14 * damp;
                if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
            c.stroke();
            c.globalAlpha = 1;
            c.strokeStyle = C.grid;
            c.lineWidth = 1;
            for (const y of [90, 150, 210]) {
                c.beginPath();
                c.moveTo(20, y);
                c.lineTo(580, y);
                c.stroke();
            }
            ['J', 'K', 'L'].forEach((k, i) => tx(c, k, 24, 80 + i * 60, 12, C.sand));
            c.fillStyle = 'rgba(141,178,166,.06)';
            c.fillRect(430, 56, 70, 188);
            c.strokeStyle = C.teal;
            c.lineWidth = 2;
            c.globalAlpha = .8;
            c.beginPath();
            c.moveTo(430, 56);
            c.lineTo(430, 244);
            c.moveTo(500, 56);
            c.lineTo(500, 244);
            c.stroke();
            c.globalAlpha = 1;
            tx(c, '滤波窗', 465, 48, 11, C.teal, 'center');
            for (const pk of g.packets) {
                const y = 90 + pk.lane * 60;
                if (pk.type === 'noise') {
                    c.fillStyle = C.rust;
                    c.beginPath();
                    c.roundRect(pk.x - 11, y - 6, 22, 12, 3);
                    c.fill();
                    tx(c, ['Ⅰ', 'Ⅱ', 'Ⅲ'][pk.lane], pk.x, y + 4, 9, '#20313a', 'center');
                } else {
                    c.fillStyle = C.gold;
                    c.beginPath();
                    c.roundRect(pk.x - 11, y - 10, 22, 20, 3);
                    c.fill();
                    tx(c, '声', pk.x, y + 4, 10, '#20313a', 'center');
                }
            }
            const st = g['static'];
            if (st > 0) {
                c.fillStyle = 'rgba(205,196,168,.45)';
                const n = Math.floor(st * 3.8);
                for (let i = 0; i < n; i++) c.fillRect(Math.random() * 600, Math.random() * 300, 1.5, 1.5);
            }
            tx(c, '静态', 432, 21, 10, C.dim, 'right');
            bar(c, 438, 14, 148, 7, st / 100, st < 50 ? C.rust : C.red);
            tx(c, Math.round(st) + '%', 438, 32, 10, C.text, 'left');
            tx(c, '已滤除 ' + g.cleaned + ' / ' + [10, 13, 16][g.tier], 14, 20, 12, C.text);
        },
        'wave-align'(c, g) {
            c.strokeStyle = C.grid;
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(40, 150);
            c.lineTo(560, 150);
            c.stroke();
            c.strokeStyle = C.teal;
            c.lineWidth = 1.5;
            c.setLineDash([7, 5]);
            wavePath(c, x => 150 - 60 * g.targetA * Math.sin(g.targetF * (x - 40) * .02));
            c.stroke();
            c.setLineDash([]);
            c.strokeStyle = C.gold;
            c.lineWidth = 2;
            wavePath(c, x => 150 - 60 * g.amp * Math.sin(g.freq * (x - 40) * .02));
            c.stroke();
            const overlap = 1 - Math.min(1, Math.abs(g.freq - g.targetF) / 1.4 + Math.abs(g.amp - g.targetA) / .9);
            tx(c, Math.round(overlap * 100) + '%', 586, 42, 26, overlap >= .9 ? C.teal : C.dim, 'right');
            tx(c, '重合度', 586, 58, 10, C.dim, 'right');
            for (let i = 0; i < 3; i++) {
                if (i < g.locks) {
                    c.fillStyle = C.gold;
                    c.beginPath();
                    c.arc(28 + i * 26, 32, 9, 0, 6.2832);
                    c.fill();
                    tx(c, String(i + 1), 28 + i * 26, 36, 11, '#20313a', 'center');
                } else {
                    c.strokeStyle = C.dim;
                    c.lineWidth = 1;
                    c.beginPath();
                    c.arc(28 + i * 26, 32, 9, 0, 6.2832);
                    c.stroke();
                    tx(c, String(i + 1), 28 + i * 26, 36, 11, C.dim, 'center');
                }
            }
            c.strokeStyle = C.grid;
            c.lineWidth = 4;
            c.beginPath();
            c.arc(300, 256, 14, 0, 6.2832);
            c.stroke();
            c.strokeStyle = C.gold;
            c.beginPath();
            c.arc(300, 256, 14, -1.5708, -1.5708 + 6.2832 * Math.min(1, g.lockProgress / 100));
            c.stroke();
            tx(c, '锁存中', 300, 288, 10, C.dim, 'center');
            tx(c, '←→ 调频 · ↑↓ 调幅', 586, 290, 11, C.dim, 'right');
        },
        'purge'(c, g, p) {
            const hp = g.core.hp;

            for (let i = 0; i < 36; i++) {
                const sx = (i * 167) % 600, sy = (i * 97) % 300;
                c.globalAlpha = .18 + .14 * Math.sin(g.elapsed * 2 + i * 1.7);
                c.fillStyle = C.text;
                c.fillRect(sx, sy, 1.5, 1.5);
            }
            c.globalAlpha = 1;

            const coreImg = sprite('core');
            if (coreImg) c.drawImage(coreImg, 250, 100, 100, 100);
            else {
                ring(c, 300, 150, 36, 'rgba(141,178,166,.35)', 1.5);
                ring(c, 300, 150, 26, C.teal, 2);
                tx(c, '核心', 300, 154, 11, C.text, 'center');
            }
            c.strokeStyle = hp > 50 ? C.teal : hp > 25 ? C.rust : C.red;
            c.lineWidth = 4;
            c.beginPath();
            c.arc(300, 150, 50, -1.5708, -1.5708 + 6.2832 * hp / 100);
            c.stroke();
            if (g.next < .4 && g.next > 0) {
                c.strokeStyle = C.rust;
                c.globalAlpha = (.4 - g.next) * 2;
                c.lineWidth = 3;
                c.strokeRect(2, 2, 596, 296);
                c.globalAlpha = 1;
            }
            for (const b of g.blobs) {
                const bt = b.type || 0, rot = g.elapsed * (bt === 1 ? 1.1 : 1.6) + b.wob;

                if (bt === 1 && b.charge > 0) {
                    const k = (0.55 - b.charge) / 0.55;
                    ring(c, b.x, b.y, b.r + 4 + (1 - k) * 10, C.gold, 2.5, .4 + .5 * k);
                }
                const spr = sprite('blob' + bt);
                if (spr) {
                    const sz = b.r * 2.7;
                    c.save();
                    c.translate(b.x, b.y);
                    if (bt === 5) {
                        const va = Math.atan2(b.vy || 0.001, b.vx || 0.001);
                        c.rotate(va + 1.5708);
                        c.strokeStyle = '#8eacc0';
                        c.globalAlpha = .5;
                        c.lineWidth = 1.5;
                        c.beginPath();
                        c.moveTo(4, -sz * .55);
                        c.lineTo(4, -sz * .85);
                        c.moveTo(-4, -sz * .55);
                        c.lineTo(-4, -sz * .85);
                        c.stroke();
                        c.globalAlpha = 1;
                    } else c.rotate(rot * .2);
                    c.drawImage(spr, -sz / 2, -sz / 2, sz, sz);
                    c.restore();
                    if ((b.flash || 0) > 0) {
                        c.globalAlpha = Math.min(1, b.flash * 6);
                        c.fillStyle = C.white;
                        c.beginPath();
                        c.arc(b.x, b.y, b.r, 0, 6.2832);
                        c.fill();
                        c.globalAlpha = 1;
                    }
                } else {
                    c.fillStyle = C.rust;
                    c.beginPath();
                    const sides = {0: 4, 1: 5, 2: 3, 3: 4, 4: 6, 5: 3}[bt] || 4;
                    for (let k = 0; k < sides; k++) {
                        const ang = rot + k * 6.2832 / sides, rr = b.r * (k % 2 ? .78 : 1.05),
                            bx = b.x + Math.cos(ang) * rr, by = b.y + Math.sin(ang) * rr;
                        if (k) c.lineTo(bx, by); else c.moveTo(bx, by);
                    }
                    c.closePath();
                    c.fill();
                    c.strokeStyle = '#7d5343';
                    c.lineWidth = 1;
                    c.stroke();
                }
                if (bt === 1 && (!spr || b.charge > 0)) {
                    c.fillStyle = C.white;
                    c.beginPath();
                    c.arc(b.x, b.y, 3, 0, 6.2832);
                    c.fill();
                }

                if (bt !== 1 && (b.blink || 0) > 0) ring(c, b.x, b.y, b.r + 5, C.gold, 2, .4 + .5 * Math.abs(Math.sin(g.elapsed * 18)));
                if (bt === 3) ring(c, b.x, b.y, b.r * .55, C.white, 1.5, .6);
                if (b.hp > 1) {
                    c.fillStyle = C.white;
                    for (let k = 0; k < b.hp; k++) {
                        c.beginPath();
                        c.arc(b.x + (k - (b.hp - 1) / 2) * 8, b.y - b.r - 7, 2, 0, 6.2832);
                        c.fill();
                    }
                }
            }
            for (const e of (g.ebullets || [])) {
                c.strokeStyle = C.red;
                c.globalAlpha = .5;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(e.x - e.vx * .04, e.y - e.vy * .04);
                c.lineTo(e.x, e.y);
                c.stroke();
                c.globalAlpha = 1;
                c.fillStyle = C.red;
                c.beginPath();
                c.arc(e.x, e.y, 4.5, 0, 6.2832);
                c.fill();
                c.fillStyle = C.white;
                c.beginPath();
                c.arc(e.x - 1.2, e.y - 1.2, 1.6, 0, 6.2832);
                c.fill();
            }
            for (const s of g.shots) {
                c.strokeStyle = C.gold;
                c.globalAlpha = .5;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(s.x - s.vx * .028, s.y - s.vy * .028);
                c.lineTo(s.x, s.y);
                c.stroke();
                c.globalAlpha = 1;
                c.fillStyle = C.gold2;
                c.beginPath();
                c.arc(s.x, s.y, 3, 0, 6.2832);
                c.fill();
                c.fillStyle = C.white;
                c.globalAlpha = .8;
                c.beginPath();
                c.arc(s.x, s.y, 1.4, 0, 6.2832);
                c.fill();
                c.globalAlpha = 1;
            }
            for (const s of (g.sparks || [])) {
                const k = 1 - s.age / s.life;
                c.globalAlpha = k;
                c.fillStyle = s.col;
                c.beginPath();
                c.arc(s.x, s.y, 1.2 + k * 1.8, 0, 6.2832);
                c.fill();
            }
            c.globalAlpha = 1;

            let near = null, nd = 1e9;
            for (const b of g.blobs) {
                const d = Math.hypot(b.x - g.player.x, b.y - g.player.y);
                if (d < nd) {
                    nd = d;
                    near = b;
                }
            }
            const pa = (g.vx || g.vy) ? Math.atan2(g.vy, g.vx) : near ? Math.atan2(near.y - g.player.y, near.x - g.player.x) : -1.5708;

            c.strokeStyle = C.line;
            c.globalAlpha = .35;
            c.setLineDash([4, 7]);
            c.lineWidth = 1;
            c.beginPath();
            c.arc(g.player.x, g.player.y, 268, 0, 6.2832);
            c.stroke();
            c.setLineDash([]);
            c.globalAlpha = 1;
            c.save();
            c.translate(g.player.x, g.player.y);
            c.rotate(pa + 1.5708);
            if (g.iT > 0 && Math.floor(g.elapsed * 14) % 2) c.globalAlpha = .45;
            const fl = 6 + Math.random() * 5;
            c.fillStyle = C.rust;
            c.beginPath();
            c.moveTo(-4, 13);
            c.lineTo(0, 13 + fl);
            c.lineTo(4, 13);
            c.closePath();
            c.fill();
            c.fillStyle = C.gold2;
            c.beginPath();
            c.moveTo(-2, 13);
            c.lineTo(0, 13 + fl * .6);
            c.lineTo(2, 13);
            c.closePath();
            c.fill();
            const droneImg = sprite('drone');
            if (droneImg) c.drawImage(droneImg, -17, -17, 34, 34);
            else {
                c.fillStyle = C.gold;
                c.beginPath();
                c.moveTo(0, -12);
                c.lineTo(8, 9);
                c.lineTo(0, 4);
                c.lineTo(-8, 9);
                c.closePath();
                c.fill();
            }
            c.restore();
            c.globalAlpha = 1;
            if ((g.muzzle || 0) > 0 && near && nd <= 268) {
                const ma = Math.atan2(near.y - g.player.y, near.x - g.player.x), mpx = g.player.x + Math.cos(ma) * 17,
                    mpy = g.player.y + Math.sin(ma) * 17;
                c.globalAlpha = g.muzzle / .06 * .9;
                c.fillStyle = C.white;
                c.beginPath();
                c.arc(mpx, mpy, 3.5, 0, 6.2832);
                c.fill();
                ring(c, mpx, mpy, 6.5, C.gold, 1.5, .7);
                c.globalAlpha = 1;
            }

            const hpm = g.hpMax || 5, hpv = g.hp === undefined ? hpm : g.hp;
            if ((g.chargeT || 0) > 0 && hpv < hpm) {
                c.strokeStyle = C.teal;
                c.globalAlpha = .5;
                c.lineWidth = 1.5;
                c.setLineDash([3, 4]);
                c.beginPath();
                c.moveTo(g.player.x, g.player.y);
                c.lineTo(300, 150);
                c.stroke();
                c.setLineDash([]);
                c.globalAlpha = 1;
                ring(c, 300, 150, 58, C.teal, 3, g.chargeT / 2.2);
                tx(c, '充能 ' + Math.round(g.chargeT / 2.2 * 100) + '%', 300, 208, 12, C.teal, 'center');
            }

            const vg = c.createRadialGradient(300, 150, 120, 300, 150, 340);
            vg.addColorStop(0, 'rgba(4,10,14,0)');
            vg.addColorStop(1, 'rgba(4,10,14,.42)');
            c.fillStyle = vg;
            c.fillRect(0, 0, 600, 300);
            const low = hpv <= hpm / 2;
            tx(c, '清除 ' + g.kills + ' / ' + [12, 15, 18][g.tier] + ' · 核心 ' + Math.round(hp) + '%', 14, 20, 12, C.text);
            tx(c, (g.chargeT || 0) > 0 ? '充能中 · 保持静止' : low ? '机体过热 · 射速减半' : g.cd <= 0 ? '武器就绪 · 按住空格连射' : '充能中', 586, 20, 12, low ? C.rust : C.dim, 'right');
            tx(c, '机体', 586, 42, 10, low ? C.red : C.dim, 'right');
            for (let i = 0; i < hpm; i++) {
                c.fillStyle = i < hpv ? (i === hpv - 1 && low ? C.rust : C.gold) : 'rgba(138,147,132,.25)';
                c.fillRect(578 - i * 13, 35, 8, 8);
            }
            if (low && p && !p._lowNoted) {
                p._lowNoted = true;
                p.wrong('机体受损过半——回核心旁静止充能！');
                p._lastWrongAt = g.elapsed;
            }
            if (!low && p) p._lowNoted = false;
        },
        'packet-run'(c, g, p) {

            for (let i = 0; i < 7; i++) {
                const sx = 30 + i * 82, cy2 = (g.elapsed * (40 + i * 9)) % 340 - 20;
                c.strokeStyle = C.grid;
                c.globalAlpha = .35;
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(sx, cy2 - 26);
                c.lineTo(sx, cy2);
                c.stroke();
                c.globalAlpha = 1;
            }

            if (g.portOpen) {
                ring(c, g.port.x, g.port.y, 24 + Math.sin(g.elapsed * 5) * 3, C.gold, 2.5, .8);
                ring(c, g.port.x, g.port.y, 34, C.gold, 1.5, .3);
                tx(c, '上行端口', g.port.x, g.port.y - 44, 11, C.gold, 'center');
                const aa = Math.atan2(g.port.y - p.y, g.port.x - p.x);
                const axp = p.x + Math.cos(aa) * 46, ayp = p.y + Math.sin(aa) * 46;
                c.save();
                c.translate(axp, ayp);
                c.rotate(aa);
                c.fillStyle = C.gold;
                c.beginPath();
                c.moveTo(8, 0);
                c.lineTo(-4, 5);
                c.lineTo(-4, -5);
                c.closePath();
                c.fill();
                c.restore();
            } else {
                ring(c, g.port.x, g.port.y, 22, C.dim, 1.5, .4);
                c.setLineDash([4, 5]);
                c.strokeStyle = C.dim;
                c.beginPath();
                c.arc(g.port.x, g.port.y, 30, 0, 6.2832);
                c.stroke();
                c.setLineDash([]);
                tx(c, '上行端口 · 未开启', g.port.x, g.port.y - 44, 10, C.dim, 'center');
            }

            const cur = g.shards[g.order];
            if (cur && !cur.locked) {
                c.globalAlpha = .22 + .12 * Math.sin(g.elapsed * 4);
                c.fillStyle = C.teal;
                c.beginPath();
                c.arc(cur.x, cur.y, 22, 0, 6.2832);
                c.fill();
                c.globalAlpha = 1;
                ring(c, cur.x, cur.y, 26, C.teal, 1.5, .5 + .3 * Math.sin(g.elapsed * 5));
                c.fillStyle = '#22343c';
                c.beginPath();
                c.roundRect(cur.x - 24, cur.y - 11, 48, 22, 5);
                c.fill();
                c.strokeStyle = C.teal;
                c.lineWidth = 1.5;
                c.stroke();
                tx(c, cur.label, cur.x, cur.y + 4, 12, C.text, 'center');
                if (g.order > 0) tx(c, '当前校验：' + cur.label, cur.x, cur.y - 30, 10, C.teal, 'center');
            }
            for (const b of (g.noises || [])) {
                const nIm = sprite('pkNoise');
                if (nIm) {
                    c.save();
                    c.translate(b.x, b.y);
                    c.rotate(b.age * 2.4);
                    c.drawImage(nIm, -b.r - 4, -b.r - 4, (b.r + 4) * 2, (b.r + 4) * 2);
                    c.restore();
                } else {
                    c.strokeStyle = C.rust;
                    c.lineWidth = 2;
                    c.beginPath();
                    c.arc(b.x, b.y, b.r, 0, 6.2832);
                    c.stroke();
                    c.fillStyle = '#6e3b2e';
                    c.beginPath();
                    c.arc(b.x, b.y, b.r * .45, 0, 6.2832);
                    c.fill();
                }
            }
            for (const s of (g.sparks || [])) {
                const k = 1 - s.age / s.life;
                c.globalAlpha = k;
                c.fillStyle = s.col;
                c.beginPath();
                c.arc(s.x, s.y, 1.2 + k * 1.8, 0, 6.2832);
                c.fill();
            }
            c.globalAlpha = 1;

            for (let k = 0; k < g.shards.length; k++) {
                const s = g.shards[k];
                if (!s.locked) continue;
                const ang = g.elapsed * 1.6 + k * 1.5708, ox = g.player.x + Math.cos(ang) * 26,
                    oy = g.player.y + Math.sin(ang) * 26;
                c.fillStyle = '#22343c';
                c.beginPath();
                c.roundRect(ox - 16, oy - 9, 32, 18, 4);
                c.fill();
                c.strokeStyle = C.gold;
                c.lineWidth = 1;
                c.stroke();
                tx(c, s.label, ox, oy + 4, 10, C.gold, 'center');
            }
            if (g.iT > 0 && Math.floor(g.elapsed * 14) % 2) c.globalAlpha = .45;
            const coreImg = sprite('pkCore');
            if (coreImg) c.drawImage(coreImg, g.player.x - 16, g.player.y - 16, 32, 32);
            c.globalAlpha = 1;
            tx(c, '校验完整性', 14, 20, 12, C.text);
            bar(c, 14, 26, 150, 8, g.integrity / 100, g.integrity > 60 ? C.teal : g.integrity > 30 ? C.rust : C.red);
            tx(c, '已锁定 ' + g.locked + ' / 4', 586, 20, 12, C.text, 'right');
            tx(c, g.portOpen ? '上行端口已开启' : g.locked > 0 ? '字段校验中' : '采集四项字段', 586, 42, 10, g.portOpen ? C.gold : C.dim, 'right');
            const vg = c.createRadialGradient(300, 150, 130, 300, 150, 340);
            vg.addColorStop(0, 'rgba(4,10,14,0)');
            vg.addColorStop(1, 'rgba(4,10,14,.4)');
            c.fillStyle = vg;
            c.fillRect(0, 0, 600, 300);
        },
        'scan-sweep'(c, g, p) {
            c.strokeStyle = C.grid;
            c.globalAlpha = .4;
            c.lineWidth = 1;
            for (let x = 0; x <= 600; x += 20) {
                c.beginPath();
                c.moveTo(x, 0);
                c.lineTo(x, 300);
                c.stroke();
            }
            for (let y = 0; y <= 300; y += 20) {
                c.beginPath();
                c.moveTo(0, y);
                c.lineTo(600, y);
                c.stroke();
            }
            c.globalAlpha = 1;
            c.strokeStyle = C.line;
            c.strokeRect(4.5, 4.5, 591, 291);
            for (const z of g.zones) {
                if (z.found) {
                    c.strokeStyle = C.gold;
                    c.lineWidth = 2;
                    c.beginPath();
                    c.arc(z.x, z.y, z.r, 0, 6.2832);
                    c.stroke();
                    ring(c, z.x, z.y, z.r - 6, C.gold, 1, .5);
                    c.lineWidth = 2.5;
                    c.beginPath();
                    c.moveTo(z.x - 8, z.y);
                    c.lineTo(z.x - 2, z.y + 6);
                    c.lineTo(z.x + 9, z.y - 7);
                    c.stroke();
                    tx(c, p.info.node === 'H02_D4_SOIL' ? '干土区域' : '变动零件', z.x, z.y - z.r - 8, 11, C.gold, 'center');
                } else if (z.hint) {
                    c.strokeStyle = C.dim;
                    c.setLineDash([5, 5]);
                    c.lineWidth = 1;
                    c.beginPath();
                    c.arc(z.x, z.y, z.r, 0, 6.2832);
                    c.stroke();
                    c.setLineDash([]);
                } else if (z.progress > 0) {
                    c.fillStyle = 'rgba(141,178,166,' + (.3 * z.progress / 100).toFixed(3) + ')';
                    c.beginPath();
                    c.arc(z.x, z.y, z.r, 0, 6.2832);
                    c.fill();
                    c.strokeStyle = C.teal;
                    c.lineWidth = 2;
                    c.beginPath();
                    c.arc(z.x, z.y, z.r, -1.5708, -1.5708 + 6.2832 * z.progress / 100);
                    c.stroke();
                }
            }
            const slow = g.scanV < 230;
            c.strokeStyle = slow ? C.teal : C.dim;
            c.globalAlpha = slow ? 1 : .6;
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(g.scan.x, g.scan.y, 11, 0, 6.2832);
            c.stroke();
            c.beginPath();
            c.arc(g.scan.x, g.scan.y, 17, 0, 6.2832);
            c.stroke();
            c.beginPath();
            c.moveTo(g.scan.x - 24, g.scan.y);
            c.lineTo(g.scan.x - 13, g.scan.y);
            c.moveTo(g.scan.x + 13, g.scan.y);
            c.lineTo(g.scan.x + 24, g.scan.y);
            c.moveTo(g.scan.x, g.scan.y - 24);
            c.lineTo(g.scan.x, g.scan.y - 13);
            c.moveTo(g.scan.x, g.scan.y + 13);
            c.lineTo(g.scan.x, g.scan.y + 24);
            c.stroke();
            c.globalAlpha = 1;
            if (!slow) tx(c, '放慢', g.scan.x, g.scan.y + 38, 11, C.rust, 'center');
            tx(c, '已确认 ' + g.found + ' / ' + g.zones.length, 14, 20, 12, C.text);
        },
        'parkour-run'(c, g, p) {
            const cam = g.cam || {x: 0, y: 0}, pl = g.player, duck = pl.onGround && g.keys.ArrowDown;

            for (let i = 0; i < 22; i++) {
                const sx = ((i * 211 - cam.x * .06) % 640 + 640) % 640 - 20, sy = (i * 127) % 280;
                c.globalAlpha = .1 + .1 * Math.sin(g.elapsed * 1.5 + i * 1.7);
                c.fillStyle = C.text;
                c.fillRect(sx, sy, 1.5, 1.5);
            }
            c.globalAlpha = 1;
            const par = -cam.x * .18;
            c.fillStyle = 'rgba(28,47,56,.55)';
            c.beginPath();
            c.arc(par + 150, 320, 95, Math.PI, 0);
            c.fill();
            c.beginPath();
            c.arc(par + 460, 320, 62, Math.PI, 0);
            c.fill();
            c.fillStyle = 'rgba(70,84,79,.4)';
            for (const dx of [255, 330, 540]) c.fillRect(par + dx, 244, 3, 76);

            c.save();
            c.translate(-cam.x, -cam.y);
            for (const s of g.plats) {
                if (s.one) {
                    const grd = c.createLinearGradient(0, s.y, 0, s.y + s.h);
                    grd.addColorStop(0, '#2f4d58');
                    grd.addColorStop(1, '#16262e');
                    c.fillStyle = grd;
                    c.beginPath();
                    c.roundRect(s.x, s.y, s.w, s.h, 4);
                    c.fill();
                    c.strokeStyle = C.line;
                    c.lineWidth = 1;
                    c.stroke();
                    c.fillStyle = C.teal;
                    c.globalAlpha = .75;
                    c.fillRect(s.x + 2, s.y, s.w - 4, 2);
                    c.globalAlpha = 1;
                    c.fillStyle = '#3a5a66';
                    for (let rx = s.x + 10; rx < s.x + s.w - 8; rx += 26) c.fillRect(rx, s.y + s.h / 2 - 1, 3, 2);
                } else {
                    const grd = c.createLinearGradient(0, s.y, 0, s.y + 70);
                    grd.addColorStop(0, '#2a4652');
                    grd.addColorStop(1, '#13232b');
                    c.fillStyle = grd;
                    c.fillRect(s.x, s.y, s.w, Math.min(s.h, 300));
                    c.strokeStyle = C.line;
                    c.lineWidth = 1;
                    c.strokeRect(s.x + .5, s.y + .5, s.w - 1, Math.min(s.h, 300) - 1);
                    c.fillStyle = 'rgba(224,196,143,.5)';
                    c.fillRect(s.x, s.y, s.w, 2.5);
                    c.strokeStyle = C.grid;
                    c.globalAlpha = .5;
                    for (let hx = s.x + 16; hx < s.x + s.w; hx += 34) {
                        c.beginPath();
                        c.moveTo(hx, s.y + 8);
                        c.lineTo(hx - 8, s.y + Math.min(s.h, 64));
                        c.stroke();
                    }
                    c.globalAlpha = 1;
                }
            }

            for (const m of g.movers) {
                c.strokeStyle = C.grid;
                c.setLineDash([3, 4]);
                c.lineWidth = 1;
                c.globalAlpha = .45;
                c.beginPath();
                if (m.axis === 'x') {
                    c.moveTo(m.cx - m.range - 8, m.y + 7);
                    c.lineTo(m.cx + m.range + m.w + 8, m.y + 7);
                } else {
                    c.moveTo(m.x + m.w / 2, m.cy - m.range - 8);
                    c.lineTo(m.x + m.w / 2, m.cy + m.range + m.h + 8);
                }
                c.stroke();
                c.setLineDash([]);
                c.globalAlpha = 1;
                const grd = c.createLinearGradient(0, m.y, 0, m.y + m.h);
                grd.addColorStop(0, '#39616f');
                grd.addColorStop(1, '#1a2e37');
                c.fillStyle = grd;
                c.beginPath();
                c.roundRect(m.x, m.y, m.w, m.h, 4);
                c.fill();
                c.strokeStyle = C.teal;
                c.lineWidth = 1.2;
                c.stroke();
                c.fillStyle = C.gold;
                c.fillRect(m.x + 2, m.y, m.w - 4, 2);
            }

            for (const pd of g.pads) {
                const k = pd.t > 0 ? Math.sin(pd.t / 0.3 * 3.14) : 0, yy = pd.y - k * 8;
                c.fillStyle = '#22343c';
                c.beginPath();
                c.roundRect(pd.x - 20, pd.y + 2, 40, 6, 2);
                c.fill();
                c.fillStyle = k > 0 ? C.gold2 : '#39616f';
                c.beginPath();
                c.roundRect(pd.x - 16, yy - 6, 32, 8, 4);
                c.fill();
                c.strokeStyle = k > 0 ? C.gold : C.line;
                c.lineWidth = 1.2;
                c.stroke();
                c.globalAlpha = .45 + .4 * Math.sin(g.elapsed * 4);
                c.fillStyle = C.gold;
                c.beginPath();
                c.moveTo(pd.x - 6, yy - 10);
                c.lineTo(pd.x, yy - 17);
                c.lineTo(pd.x + 6, yy - 10);
                c.closePath();
                c.fill();
                c.globalAlpha = 1;
            }

            for (const v of g.vents) {
                c.fillStyle = '#1c3038';
                c.beginPath();
                c.roundRect(v.x - 13, v.y - 6, 26, 8, 2);
                c.fill();
                c.strokeStyle = C.line;
                c.lineWidth = 1;
                c.stroke();
                c.fillStyle = C.rust;
                c.fillRect(v.x - 2, v.y - 4, 4, 3);
                if (v.warn) {
                    const k = (Math.sin(g.elapsed * 14) + 1) / 2;
                    c.globalAlpha = .35 + .4 * k;
                    c.fillStyle = C.gold;
                    c.beginPath();
                    c.arc(v.x, v.y - 12, 4.5 + 3 * k, 0, 6.2832);
                    c.fill();
                    c.globalAlpha = 1;
                    tx(c, '!', v.x, v.y - 26, 13, C.gold, 'center');
                }
                if (v.fire) {
                    for (let i = 0; i < 5; i++) {
                        const ph2 = g.elapsed * 9 + i * 1.7;
                        c.globalAlpha = .15 + .09 * Math.sin(ph2);
                        c.fillStyle = C.teal;
                        const w = 8 + 3 * Math.sin(ph2 * 1.3);
                        c.fillRect(v.x - w / 2 + Math.sin(ph2) * 4, v.y - 95, w, 95);
                    }
                    c.globalAlpha = .5;
                    c.fillStyle = '#d7e8ef';
                    c.fillRect(v.x - 3, v.y - 88, 6, 86);
                    c.globalAlpha = 1;
                }
            }

            for (let i = 0; i < g.orbs.length; i++) {
                const o = g.orbs[i];
                if (o.taken) continue;
                const oy = o.y + Math.sin(g.elapsed * 3 + i) * 3;
                c.globalAlpha = .15;
                c.fillStyle = C.gold;
                c.beginPath();
                c.arc(o.x, oy, 13, 0, 6.2832);
                c.fill();
                c.globalAlpha = 1;
                const oIm = sprite('pkOrb');
                if (oIm) c.drawImage(oIm, o.x - 9, oy - 9, 18, 18);
                else {
                    c.fillStyle = C.gold;
                    c.beginPath();
                    c.arc(o.x, oy, 5.5, 0, 6.2832);
                    c.fill();
                }
            }

            for (const q of g.posts) {
                c.strokeStyle = C.line;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(q.x, q.y);
                c.lineTo(q.x, q.y - 34);
                c.stroke();
                const fl = q.active ? C.gold : '#546b74';
                c.fillStyle = fl;
                c.beginPath();
                c.moveTo(q.x, q.y - 34);
                c.lineTo(q.x + 16, q.y - 28);
                c.lineTo(q.x, q.y - 22);
                c.closePath();
                c.fill();
                if (q.active) ring(c, q.x, q.y - 28, 10 + 2 * Math.sin(g.elapsed * 4), C.gold, 1.5, .5);
            }

            const gl = g.goal;
            c.save();
            c.translate(gl.x, gl.y - 30);
            c.globalAlpha = .13 + .05 * Math.sin(g.elapsed * 3);
            c.fillStyle = C.gold;
            c.beginPath();
            c.arc(0, 0, 30, 0, 6.2832);
            c.fill();
            c.globalAlpha = 1;
            c.strokeStyle = C.gold;
            c.lineWidth = 3;
            c.beginPath();
            c.arc(0, 0, 26, 0, 6.2832);
            c.stroke();
            c.strokeStyle = C.teal;
            c.lineWidth = 1.5;
            c.setLineDash([5, 4]);
            c.beginPath();
            c.arc(0, 0, 18, g.elapsed * 1.4, g.elapsed * 1.4 + 6.28);
            c.stroke();
            c.setLineDash([]);
            const gIm = sprite('pkGoal');
            if (gIm) c.drawImage(gIm, -13, -13, 26, 26);
            c.restore();
            tx(c, '返回舱', gl.x, gl.y - 72, 11, C.gold, 'center');

            for (const d of g.drones) {
                c.strokeStyle = C.line;
                c.globalAlpha = .2;
                c.setLineDash([2, 6]);
                c.lineWidth = 1;
                c.beginPath();
                if (d.axis === 'y') {
                    c.moveTo(d.x, d.y0 - 10);
                    c.lineTo(d.x, d.y1 + 10);
                } else {
                    c.moveTo(d.x0 - 10, d.y);
                    c.lineTo(d.x1 + 10, d.y);
                }
                c.stroke();
                c.setLineDash([]);
                c.globalAlpha = 1;
                c.globalAlpha = .1 + .07 * Math.sin(g.elapsed * 6);
                c.fillStyle = C.red;
                c.beginPath();
                c.moveTo(d.x - 6, d.y + 8);
                c.lineTo(d.x + 6, d.y + 8);
                c.lineTo(d.x, d.y + 30);
                c.closePath();
                c.fill();
                c.globalAlpha = 1;
                const dIm = sprite('drone');
                if (dIm) c.drawImage(dIm, d.x - 14, d.y - 14 + Math.sin(g.elapsed * 5 + d.x) * 2, 28, 28);
                else {
                    c.fillStyle = C.gold;
                    c.beginPath();
                    c.moveTo(d.x, d.y - 9);
                    c.lineTo(d.x + 7, d.y + 7);
                    c.lineTo(d.x, d.y + 3);
                    c.lineTo(d.x - 7, d.y + 7);
                    c.closePath();
                    c.fill();
                }
            }

            for (const s of g.sparks) {
                const k = 1 - s.age / s.life;
                c.globalAlpha = k;
                c.fillStyle = s.col;
                c.beginPath();
                c.arc(s.x, s.y, 1.2 + k * 1.8, 0, 6.2832);
                c.fill();
            }
            c.globalAlpha = 1;


            c.fillStyle = 'rgba(0,0,0,.35)';
            c.beginPath();
            c.ellipse(pl.x, pl.y + 2, 11, 3.2, 0, 0, 6.2832);
            c.fill();
            if (g.iT > 0 && Math.floor(g.elapsed * 14) % 2) c.globalAlpha = .45;
            c.save();
            c.translate(pl.x, pl.y);

            if (g.spin > 0) {
                const k = g.spin / 0.35;
                ring(c, 0, -26, 12 + (1 - k) * 24, C.teal, 2.2, k * .75);
                ring(c, 0, -26, 8 + (1 - k) * 14, '#d7e8ef', 1.5, k * .5);
            }
            const sq = g.squash > 0 ? 1 - g.squash * .9 : 1, sy = duck ? 0.7 : (g.spin > 0 ? sq * 1.06 : sq);
            c.scale(pl.face * (1 + (1 - sq) * .5), sy);
            const running = pl.onGround && Math.abs(pl.vx) > 20;
            if (running) c.rotate(Math.sin(g.elapsed * 13) * 0.08);
            const bob = running ? Math.abs(Math.sin(g.elapsed * 13)) * 2.4 : 0;
            if (!pl.onGround && g.jumps >= 2) {
                c.globalAlpha = .6;
                c.fillStyle = C.teal;
                c.beginPath();
                c.moveTo(-5, -8);
                c.lineTo(0, 5 + Math.random() * 6);
                c.lineTo(5, -8);
                c.closePath();
                c.fill();
                c.globalAlpha = .9;
                c.fillStyle = '#d7e8ef';
                c.beginPath();
                c.moveTo(-2.5, -8);
                c.lineTo(0, 1 + Math.random() * 4);
                c.lineTo(2.5, -8);
                c.closePath();
                c.fill();
                c.globalAlpha = g.iT > 0 && Math.floor(g.elapsed * 14) % 2 ? .45 : 1;
            }
            const rIm = sprite('pkRunner');
            if (rIm) {

                const hip = -13, lp = g.elapsed * 13;
                const leg = (lx, footDx, lift) => {
                    c.strokeStyle = '#e9e4d0';
                    c.lineWidth = 4;
                    c.lineCap = 'round';
                    c.beginPath();
                    c.moveTo(lx, hip);
                    c.lineTo(lx + footDx, -3 - lift);
                    c.stroke();
                    c.fillStyle = '#c98a4e';
                    c.beginPath();
                    c.roundRect(lx + footDx - 3.4, -4.6 - lift, 7.6, 4.6, 2);
                    c.fill();
                };
                if (running) {
                    leg(-3.5, Math.sin(lp) * 5.5, Math.max(0, Math.sin(lp)) * 2.2);
                    leg(3.5, Math.sin(lp + Math.PI) * 5.5, Math.max(0, Math.sin(lp + Math.PI)) * 2.2);
                } else if (pl.onGround) {
                    leg(-3.5, 0, 0);
                    leg(3.5, 0, 0);
                } else {
                    leg(-3.5, -2.5, 1.5);
                    leg(3.5, 2.5, 1.5);
                }
                c.drawImage(rIm, -19, -58 - bob, 38, 58);
            } else {
                c.strokeStyle = '#546b74';
                c.lineWidth = 3.5;
                c.lineCap = 'round';
                if (running) {
                    const runP = g.elapsed * 11;
                    c.beginPath();
                    c.moveTo(-2, -9);
                    c.lineTo(-2 + Math.sin(runP) * 6, -1);
                    c.stroke();
                    c.beginPath();
                    c.moveTo(2, -9);
                    c.lineTo(2 - Math.sin(runP) * 6, -1);
                    c.stroke();
                } else if (pl.onGround) {
                    c.beginPath();
                    c.moveTo(-3, -9);
                    c.lineTo(-4, -1);
                    c.moveTo(3, -9);
                    c.lineTo(4, -1);
                    c.stroke();
                } else {
                    c.beginPath();
                    c.moveTo(-2, -9);
                    c.lineTo(-5, -4);
                    c.moveTo(2, -9);
                    c.lineTo(5, -5);
                    c.stroke();
                }
                const bh2 = duck ? 11 : 16;
                c.fillStyle = '#546b74';
                c.fillRect(-7, -bh2 - 8, 14, bh2);
                const hy2 = -bh2 - 13;
                c.fillStyle = '#e6c989';
                c.beginPath();
                c.arc(0, hy2, 7, 0, 6.2832);
                c.fill();
            }
            c.restore();
            c.globalAlpha = 1;
            c.restore();

            tx(c, '结构完整', 14, 20, 12, C.text);
            for (let i = 0; i < g.hpMax; i++) {
                c.fillStyle = i < g.integrity ? C.gold : 'rgba(138,147,132,.25)';
                c.fillRect(82 + i * 15, 12, 10, 10);
            }
            tx(c, '能量珠 ' + g.cells + ' / ' + g.orbs.length, 300, 20, 12, C.gold, 'center');
            bar(c, 392, 14, 150, 7, Math.min(1, pl.x / g.goal.x), C.teal);
            tx(c, '→ 返回舱', 548, 21, 10, C.dim);
            tx(c, 'A/D 移动 · W/空格 跳跃(空中再按=二段) · S 速降/低头/下穿', 586, 290, 10, C.dim, 'right');
            if (g.msgT > 0) {
                c.globalAlpha = Math.min(1, g.msgT);
                c.fillStyle = 'rgba(16,30,36,.88)';
                c.beginPath();
                c.roundRect(150, 42, 300, 26, 6);
                c.fill();
                c.strokeStyle = C.gold;
                c.lineWidth = 1;
                c.stroke();
                tx(c, g.msg, 300, 59, 12, C.text, 'center');
                c.globalAlpha = 1;
            }
            const vg = c.createRadialGradient(300, 150, 150, 300, 150, 360);
            vg.addColorStop(0, 'rgba(4,10,14,0)');
            vg.addColorStop(1, 'rgba(4,10,14,.4)');
            c.fillStyle = vg;
            c.fillRect(0, 0, 600, 300);
        }
    };
    const FB = {
        'leak-hunt': g => '已密封 ' + g.sealed + ' / ' + g.leaks.length + ' · 压力 ' + Math.round(g.pressure) + '% · 护盾 ' + (g.shield === undefined ? '—' : g.shield),
        'surge-bank': g => '已存入 ' + g.banked + ' / ' + [6, 8, 10][g.tier] + ' · 过载 ' + g.overload + ' / 3',
        'credential-sort': g => '已分拣 ' + g.routed + ' / ' + [8, 10, 12][g.tier] + ' · 失误 ' + g.mistakes + ' / 3',
        'stream-merge': g => '已合流 ' + g.merges + ' / ' + [7, 9, 11][g.tier] + ' · 撕裂 ' + g.tears + ' / 3',
        'probe-steady': g => '采样 ' + g.samples + ' / 3 · 外壳完整 ' + (3 - g.hits) + ' / 3',
        'energy-catch': g => '电压 ' + g.charge + ' / ' + [70, 90, 110][g.tier] + ' · 泄漏 ' + g.leaks + ' / 3',
        'noise-filter': g => '已滤除 ' + g.cleaned + ' / ' + [10, 13, 16][g.tier] + ' · 静态 ' + Math.round(g['static']) + '%',
        'wave-align': g => '已锁存 ' + g.locks + ' / 3 · 频率 ' + g.freq.toFixed(2) + ' · 幅度 ' + g.amp.toFixed(2),
        'purge': g => '已清除 ' + g.kills + ' / ' + [12, 15, 18][g.tier] + ' · 核心 ' + Math.round(g.core.hp) + '% · 机体 ' + (g.hp === undefined ? '—' : g.hp) + '/' + (g.hpMax || '?') + ((g.chargeT || 0) > 0 ? ' · 充能中' : ''),
        'packet-run': g => '已锁定 ' + g.locked + ' / 4 · 完整性 ' + Math.round(g.integrity) + '%' + (g.portOpen ? ' · 前往上行端口' : ''),
        'scan-sweep': g => '已确认 ' + g.found + ' / ' + g.zones.length,
        'parkour-run': g => '进度 ' + Math.min(100, Math.round(g.player.x / g.goal.x * 100)) + '% · 能量珠 ' + g.cells + ' / ' + g.orbs.length + ' · 完整 ' + g.integrity + ' / ' + g.hpMax + (g.msgT > 0 ? ' · ' + g.msg : '')
    };
    const PADS = {
        'leak-hunt': [['↑', 'ArrowUp', 1], ['←', 'ArrowLeft', 1], ['↓', 'ArrowDown', 1], ['→', 'ArrowRight', 1], ['按住 · 密封/脉冲', 'Space', 1]],
        'surge-bank': [['←', 'ArrowLeft', 1], ['→', 'ArrowRight', 1], ['存入', 'Space', 0]],
        'credential-sort': [['① 最高日志', 'Digit1', 0], ['② 公开档案', 'Digit2', 0], ['③ 销毁口', 'Digit3', 0]],
        'stream-merge': [['合流', 'Space', 0]],
        'probe-steady': [['托住外壳', 'Space', 0]],
        'energy-catch': [['←', 'ArrowLeft', 1], ['→', 'ArrowRight', 1]],
        'noise-filter': [['轨道一 · J', 'KeyJ', 0], ['轨道二 · K', 'KeyK', 0], ['轨道三 · L', 'KeyL', 0]],
        'wave-align': [['↑', 'ArrowUp', 1], ['←', 'ArrowLeft', 1], ['↓', 'ArrowDown', 1], ['→', 'ArrowRight', 1]],
        'purge': [['↑', 'ArrowUp', 1], ['←', 'ArrowLeft', 1], ['↓', 'ArrowDown', 1], ['→', 'ArrowRight', 1], ['发射', 'Space', 0]],
        'packet-run': [['↑', 'ArrowUp', 1], ['←', 'ArrowLeft', 1], ['↓', 'ArrowDown', 1], ['→', 'ArrowRight', 1]],
        'scan-sweep': [],
        'parkour-run': [['←', 'ArrowLeft', 1], ['→', 'ArrowRight', 1], ['跳跃', 'Space', 0], ['↓ 速降/低头', 'ArrowDown', 1]]
    };
    a.render = function (p) {
        const g = p.classic;
        if (!own(g)) return prev.render.call(this, p);
        p.description.textContent = a.descriptions[g.kind] || NAMES[g.kind];
        const root = document.createElement('div');
        root.className = 'action-board action-' + g.kind;
        p.controls.append(root);
        const strip = document.createElement('p');
        strip.className = 'action-strip';
        strip.innerHTML = '<span class="action-badge">广寒子 · 远程辅助链路</span>' + MoonClassic.levels[p.difficulty].label + ' · ' + NAMES[g.kind];
        root.append(strip);
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 600;
        canvas.className = 'action-canvas';
        canvas.setAttribute('aria-label', NAMES[g.kind] + '操作画面');
        root.append(canvas);
        p.actionCanvas = canvas;
        const move = e => {
            if (!p.started || p.result) return;
            const v = canvasPoint(canvas, e);
            MoonAction.point(g, v.x, v.y);
        };
        if (g.kind === 'probe-steady' || g.kind === 'scan-sweep') {
            canvas.addEventListener('pointermove', move);
            canvas.addEventListener('pointerdown', move);
        }
        if (g.kind === 'leak-hunt') {
            canvas.addEventListener('pointerdown', e => {
                e.preventDefault();
                if (!p.started || p.result) return;
                MoonAction.press(g, 'Space');
            });
            const up = () => {
                if (!p.started || p.result) return;
                MoonAction.release(g, 'Space');
            };
            canvas.addEventListener('pointerup', up);
            canvas.addEventListener('pointercancel', up);
            canvas.addEventListener('pointerleave', up);
        }
        if (g.kind === 'purge') canvas.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!p.started || p.result) return;
            MoonAction.press(g, 'Space');
            MoonAction.release(g, 'Space');
        });
        const defs = PADS[g.kind] || [];
        if (defs.length) {
            const pad = document.createElement('div');
            pad.className = 'action-pad' + (g.kind === 'credential-sort' ? ' action-slots' : '');
            root.append(pad);
            const tap = (text, code) => p.button(text, () => {
                if (!p.started || p.result) return;
                MoonAction.press(g, code);
                MoonAction.release(g, code);
                this.drawAction(p);
                done(p);
            }, pad);
            const hold = (text, code) => {
                const el = p.button(text, () => {
                }, pad);
                el.className = 'action-hold';
                el.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    if (!p.started || p.result) return;
                    if (el.setPointerCapture) {
                        try {
                            el.setPointerCapture(e.pointerId);
                        } catch (err) {
                        }
                    }
                    MoonAction.press(g, code);
                });
                const up = () => {
                    if (!p.started || p.result) return;
                    MoonAction.release(g, code);
                };
                el.addEventListener('pointerup', up);
                el.addEventListener('pointercancel', up);
                el.addEventListener('pointerleave', up);
                return el;
            };
            for (const d of defs) (d[2] ? hold : tap)(d[0], d[1]);
        }
        this.drawAction(p);
    };
    a.drawAction = function (p) {
        const g = p.classic, c = p.actionCanvas && p.actionCanvas.getContext('2d');
        if (!c || !own(g)) return;
        const k = (p.actionCanvas && p.actionCanvas.width / 600) || 1;
        c.setTransform(k, 0, 0, k, 0, 0);
        c.clearRect(0, 0, 600, 300);
        bg(c, g);
        (DRAW[g.kind] || function () {
        })(c, g, p);
        fg(c, g);
        const last = p._lastWrongAt === undefined ? -9 : p._lastWrongAt;
        if (g.elapsed - last >= 1.4) p.feedback.textContent = FB[g.kind](g);
    };
    a.reveal = function (p) {
        const g = p.classic;
        if (!own(g)) return prev.reveal.call(this, p);
        MoonAction.assist(g);
        const el = document.createElement('p');
        el.className = 'classic-solution';
        el.textContent = g.assistText || '辅助程序已接管剩余步骤。';
        p.controls.append(el);
    };

    const DEMO = {
        'leak-hunt': (g, s) => {
            g.player.x = 200;
            g.player.y = 150;
            g.leaks = [{x: 200, y: 150, found: true, sealed: false, timer: 3, seed: 1, pattern: 0}, {
                x: 430,
                y: 110,
                found: true,
                sealed: s >= 2,
                timer: 2,
                seed: 2,
                pattern: 1
            }, {x: 330, y: 220, found: s >= 2, sealed: false, timer: 2.6, seed: 3, pattern: 0}];
            g.sealed = s >= 2 ? 1 : 0;
            g.pulses = s >= 1 ? [{x: 200, y: 150, r: 46, age: .3}] : [];
            g.pressure = 14 + s * 8;
            g.hold = s >= 3 ? .7 : 0;
            g.cd = 0;
            g.shield = s >= 3 ? 4 : 5;
            g.shots = s >= 2 ? [{x: 300, y: 130, vx: 70, vy: 36}, {x: 360, y: 170, vx: -55, vy: 30}] : [];
        },
        'surge-bank': (g, s) => {
            g.cart = 1;
            g.packets = [{lane: 1, y: 150, v: 95}, {lane: 0, y: 60, v: 95}, {lane: 3, y: 212, v: 95}];
            g.meter = s >= 1 ? 68 : 20;
            g.banked = s >= 2 ? 2 : 0;
            g.overload = s >= 3 ? 1 : 0;
        },
        'credential-sort': (g, s) => {
            g.cards = [{x: 150, type: 0, routed: false}, {x: 300, type: 1, routed: false}, {
                x: 470,
                type: 2,
                routed: false
            }];
            g.routed = 0;
            g.mistakes = 0;
        },
        'stream-merge': (g, s) => {
            g.pairs = [{x: s >= 1 ? 300 : 210, color: 1, merged: s >= 3}, {x: 470, color: 0, merged: false}, {
                x: 90,
                color: 3,
                merged: false
            }];
            g.merges = s >= 3 ? 1 : 0;
            g.tears = 0;
        },
        'probe-steady': (g, s) => {
            g.probe = {x: 250, y: 150};
            g.pointer = {x: 250, y: 150};
            g.progress = s >= 1 ? 55 : 12;
            g.samples = s >= 3 ? 1 : 0;
            g.heat = s >= 2 ? .65 : 0;
            g.hits = 0;
            g.iT = 0;
        },
        'energy-catch': (g, s) => {
            g.orbs = [{lane: 1, y: 150, color: 1, v: 140}, {lane: 0, y: 80, color: 0, v: 140}, {
                lane: 2,
                y: 210,
                color: 2,
                v: 140
            }];
            g.sled = {lane: 1, color: s >= 2 ? 1 : 0};
            g.charge = s >= 3 ? 42 : 14;
            g.leaks = s >= 3 ? 1 : 0;
            g.autoColor = false;
        },
        'noise-filter': (g, s) => {
            g.packets = [{x: s >= 1 ? 465 : 560, lane: 0, type: 'noise', v: 160}, {
                x: 380,
                lane: 1,
                type: 'voice',
                v: 160
            }, {x: 250, lane: 2, type: 'noise', v: 160}];
            g.cleaned = s >= 2 ? 4 : 0;
            g['static'] = s >= 3 ? 58 : 16;
        },
        'wave-align': (g, s) => {
            g.targetF = 1.1;
            g.targetA = .45;
            if (s >= 3) {
                g.freq = 1.1;
                g.amp = .45;
                g.lockProgress = 62;
                g.locks = 1;
            } else if (s === 2) {
                g.freq = 1.32;
                g.amp = .56;
                g.lockProgress = 0;
                g.locks = 0;
            } else {
                g.freq = 2.9;
                g.amp = .9;
                g.lockProgress = 0;
                g.locks = 0;
            }
        },
        'purge': (g, s) => {
            g.player.x = 300;
            g.player.y = 235;
            g.vx = 0;
            g.vy = 0;
            g.core.hp = s >= 3 ? 76 : 100;
            g.hp = s >= 3 ? 2 : 4;
            g.hpMax = 5;
            g.chargeT = 0;
            g.blobs = [{
                x: 150,
                y: 80,
                r: 20,
                hp: 5,
                wob: 1.2,
                touch: 0,
                type: 4,
                fire: 999,
                charge: 0,
                vx: 0,
                vy: 0,
                px: 0,
                py: 0,
                flash: 0,
                blink: 0
            }, {
                x: 470,
                y: 210,
                r: 9,
                hp: 1,
                wob: 4,
                touch: 0,
                type: 5,
                fire: 999,
                charge: 0,
                vx: -60,
                vy: 30,
                px: 0,
                py: 0,
                flash: 0,
                blink: 0
            }, {
                x: 440,
                y: 200,
                r: 14,
                hp: 2,
                wob: 4,
                touch: 0,
                type: 1,
                fire: s >= 1 ? 9 : .2,
                charge: s >= 1 && s <= 2 ? .3 : 0,
                vx: 0,
                vy: 0,
                px: 0,
                py: 0,
                flash: 0,
                blink: 0
            }];
            g.shots = s >= 1 && s <= 2 ? [{x: 235, y: 165, vx: 150, vy: -80, age: .2, life: .55}] : [];
            g.ebullets = s >= 2 ? [{x: 380, y: 170, vx: -70, vy: 40, age: 0}] : [];
            g.kills = s >= 2 ? 2 : 0;
            g.cd = 0;
            g.next = 1.5;
        },
        'scan-sweep': (g, s) => {
            g.zones = [{x: 170, y: 110, r: 46, progress: s >= 2 ? 70 : 0, found: s >= 3, hint: s >= 1}, {
                x: 420,
                y: 190,
                r: 46,
                progress: 0,
                found: false,
                hint: false
            }, {x: 330, y: 60, r: 46, progress: 0, found: false, hint: false}];
            g.scan.x = 170;
            g.scan.y = 110;
            g.pointer = {x: 170, y: 110};
            g.scanV = s >= 1 ? 60 : 0;
            g.found = s >= 3 ? 1 : 0;
        },
        'packet-run': (g, s) => {
            g.shards = [{x: 160, y: 100, vx: 20, vy: 12, label: '坐标', locked: s >= 2}, {
                x: 420,
                y: 180,
                vx: -16,
                vy: 20,
                label: '人数',
                locked: false
            }, {x: 300, y: 60, vx: 10, vy: -14, label: '时间', locked: false}, {
                x: 480,
                y: 80,
                vx: -20,
                vy: 8,
                label: '校验',
                locked: false
            }];
            g.order = s >= 2 ? 1 : 0;
            g.locked = s >= 2 ? 1 : 0;
            g.noises = s >= 1 ? [{x: 260, y: 170, vx: 70, vy: 20, r: 11, age: 0}] : [];
            g.integrity = s >= 3 ? 66 : 100;
            g.portOpen = false;
            g.player.x = 120;
            g.player.y = 180;
        },
        'parkour-run': (g, s) => {
            if (s === 0) {
                g.player.x = 260;
                g.player.y = 520;
            } else if (s === 1) {
                g.player.x = 1355;
                g.player.y = 396;
                g.checkpoint = {x: 940, y: 520};
                g.posts[1].active = true;
            } else if (s === 2) {
                g.player.x = 1945;
                g.player.y = 282;
                g.checkpoint = {x: 1680, y: 300};
                g.posts[1].active = true;
                g.posts[2].active = true;
                g.movers[0].ph = 1.2;
                g.movers[1].ph = 2.6;
            } else {
                g.player.x = 3450;
                g.player.y = 480;
                g.checkpoint = {x: 2930, y: 520};
                g.posts.forEach(q => q.active = true);
                g.player.vy = -140;
            }
            g.cam.x = Math.max(0, Math.min(3020, g.player.x - 300));
            g.cam.y = Math.max(0, Math.min(340, g.player.y - 200));
        }
    };

    function demoPaint(canvas, g, p) {
        const c = canvas.getContext('2d');
        if (!c) return;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = C.panel;
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.save();
        c.translate(130, 0);
        c.scale(.5, .5);
        bg(c, g);
        (DRAW[g.kind] || function () {
        })(c, g, p);
        fg(c, g);
        c.restore();
    }

    const tut = MoonTutorials;
    MoonTutorials = {
        ...tut,
        render(p) {
            const g = p.classic;
            if (!own(g)) return tut.render(p);
            const root = document.createElement('section');
            root.className = 'workshop-guide';
            root.innerHTML = '<ol class="workshop-phases"><li>① 讲解规则</li><li>② 分步演示</li><li>③ 正式游戏</li></ol>';
            p.controls.append(root);
            if (p.introPhase === 'rules') {
                p.demoGame = null;
                p.demoCanvas = null;
                (rules[g.kind] || []).forEach((v, i) => {
                    const el = document.createElement('p');
                    el.className = 'rule-row';
                    el.textContent = (i + 1) + '. ' + v;
                    root.append(el);
                });
                return;
            }

            const startBar = document.createElement('div');
            startBar.className = 'guide-toolbar';
            root.append(startBar);
            const startBtn = p.button('准备好了，开始', () => p.startFullscreen(), startBar);
            startBtn.className = 'action-start';
            const step = Math.max(0, Math.min(3, p.workshopStep || 0)),
                dg = MoonAction.create(g.kind, {seed: 13, difficulty: 'easy'});
            if (dg && DEMO[g.kind]) DEMO[g.kind](dg, step);
            p.demoGame = dg || null;
            const canvas = document.createElement('canvas');
            canvas.width = 560;
            canvas.height = 150;
            canvas.className = 'action-canvas';
            canvas.setAttribute('aria-label', NAMES[g.kind] + '分步演示');
            p.demoCanvas = canvas;
            const note = document.createElement('p');
            note.className = 'demo-caption';
            note.textContent = (step + 1) + ' / 4 · ' + ((caps[g.kind] || [])[step] || '');
            root.append(canvas, note);
            if (dg) demoPaint(canvas, dg, p);
            const barEl = document.createElement('div');
            barEl.className = 'guide-toolbar';
            root.append(barEl);
            [['上一步', Math.max(0, step - 1)], ['下一步', Math.min(3, step + 1)], ['从头重播', 0]].forEach(v => p.button(v[0], () => {
                p.workshopStep = v[1];
                p.workshopElapsed = 0;
                p.render();
            }, barEl));
            p.button(p.workshopAuto ? '暂停演示' : '自动演示', () => {
                p.workshopAuto = !p.workshopAuto;
                p.workshopElapsed = 0;
                p.render();
            }, barEl);
        },
        tick(p, dt) {
            if (!own(p.classic)) return tut.tick(p, dt);
            const dg = p.demoGame;
            if (dg) {
                dg.elapsed += dt;
                if (dg.kind === 'probe-steady') {
                    if (!dg.pointer) dg.pointer = {x: 250, y: 150};
                    dg.pointer.x = 250 + Math.sin(dg.elapsed * .6) * 180;
                    dg.probe.x += (dg.pointer.x - dg.probe.x) * Math.min(1, 6 * dt);
                    dg.probe.y = 150 + Math.sin(dg.elapsed * .7) * 24 + Math.sin(dg.elapsed * 1.13 + 2) * 12;
                    dg.pointer.y = dg.probe.y + Math.sin(dg.elapsed * .9) * 10;
                }

                if (dg.kind === 'parkour-run') {
                    for (const m of dg.movers) {
                        m.ph += dt * m.speed / m.range;
                        if (m.axis === 'x') m.x = m.cx + Math.sin(m.ph) * m.range; else m.y = m.cy + Math.sin(m.ph) * m.range;
                    }
                    for (const d of dg.drones) {
                        const v = d.sp * .8;
                        if (d.axis === 'y') {
                            d.y += d.dir * v * dt;
                            if (d.y < d.y0 || d.y > d.y1) {
                                d.y = Math.max(d.y0, Math.min(d.y1, d.y));
                                d.dir *= -1;
                            }
                        } else {
                            d.x += d.dir * v * dt;
                            if (d.x < d.x0 || d.x > d.x1) {
                                d.x = Math.max(d.x0, Math.min(d.x1, d.x));
                                d.dir *= -1;
                            }
                        }
                    }
                }
                if (p.demoCanvas) demoPaint(p.demoCanvas, dg, p);
            }
            if (p.workshopAuto) {
                p.workshopElapsed = (p.workshopElapsed || 0) + dt;
                if (p.workshopElapsed >= 3) {
                    p.workshopElapsed = 0;
                    p.workshopStep = Math.min(3, (p.workshopStep || 0) + 1);
                    if (p.workshopStep >= 3) p.workshopAuto = false;
                    p.render();
                }
            }
        }
    };


    let pkFinishDone = false;
    const pkFinishPatch = () => {
        if (typeof puzzles === 'undefined' || pkFinishDone) return;
        pkFinishDone = true;
        const orig = puzzles.onFinish;
        puzzles.onFinish = (node, result) => {
            if (node === 'PARKOUR_PREVIEW' || node === 'PARKOUR_GATE') {
                if (typeof closeOverlay === 'function') closeOverlay('minigame');
                return;
            }
            orig(node, result);
        };
    };
    const pkGateInstall = () => {
        if (pkGateInstall.done || typeof puzzles === 'undefined') return;
        const rt = globalThis.MoonStoryRuntime;
        if (!rt || !rt.setLocation) return;
        pkGateInstall.done = true;
        const origSet = rt.setLocation.bind(rt);
        rt.setLocation = (map, x, y) => {
            const ok = origSet(map, x, y);
            try {
                if (ok && map === 'R09' && rt.state.node === 'F_MOON_MID' && !rt.state.flags.parkour_gate_done && !puzzles.running) {

                    rt.run({
                        id: 'parkour_gate_done',
                        once: false,
                        queue: [],
                        effects: {flags: {parkour_gate_done: true}}
                    });
                    setTimeout(() => {
                        if (typeof openDailyGame === 'function') openDailyGame('PARKOUR_GATE', 'parkour-run', '廊桥奔越 · 舱门开启演练');
                    }, 900);
                }
            } catch (e) {
            }
            return ok;
        };
    };
    const pkSoilPatch = () => {
        try {
            const soilDef = globalThis.MoonCampaign && MoonCampaign.nodes && MoonCampaign.nodes.H02_D4_SOIL;
            if (soilDef && soilDef.game) {
                soilDef.queue = [...(soilDef.queue || []), ...(soilDef.success || [])];
                delete soilDef.game;
                delete soilDef.success;
                delete soilDef.failure;
            }
        } catch (e) {
        }
    };
    const pkInstallAll = () => {
        pkFinishPatch();
        pkGateInstall();
        pkSoilPatch();
        if (!(globalThis.MoonHistory && MoonHistory.testing)) return;
        const pkPanel = document.querySelector('.pause-panel');
        if (!pkPanel || pkPanel.querySelector('[data-pk-preview]')) return;
        const pkBtn = document.createElement('button');
        pkBtn.type = 'button';
        pkBtn.setAttribute('data-pk-preview', '1');
        pkBtn.className = 'flow-launch';
        pkBtn.textContent = '廊桥奔越 · 试玩';
        pkBtn.addEventListener('click', () => {
            if (typeof puzzles === 'undefined' || typeof openDailyGame !== 'function') return;
            pkFinishPatch();
            openDailyGame('PARKOUR_PREVIEW', 'parkour-run', '廊桥奔越 · 试玩');
        });
        pkPanel.append(pkBtn);
    };
    if (document.readyState === 'complete') pkInstallAll();
    else window.addEventListener('load', pkInstallAll);
})();
