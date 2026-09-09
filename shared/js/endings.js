"use strict";
(function () {
    const rows = [
        ['return_home', '归乡', '归航环', '循环舱接收了当前操作员。登记栏依然写着 WUKANG SUCCESSOR。', '他把职责交给下一班。系统保存了名字，没有保存一个人的以后。', 'M24 38A16 16 0 1 1 53 43M53 32v12H41'],
        ['extinction', '寂灭', '断开的核心', '最高日志仍停在屏幕上：广寒子没有背叛。你第二次接通了起爆线路。', '核心停机。家庭、档案与未送出的记录都没有外部接收者。最后的灯由这只手熄灭。', 'M30 20v18l-9 8 16 14 7-13 14-7-15-8 8-12'],
        ['eternal_home', '永恒之家', '封闭相框', '复制完成。WUKANG-17 MODEL 回答了校验问题；床上的身体没有转移到屏幕里。', '数字家庭恢复晚餐。当前肉身停止了呼吸。能够重复的关系留了下来。', 'M23 22h34v36H23zM28 34l12-9 12 9v19H28z'],
        ['first_departure', '第一次离开', '越界月牙', '培养系统没有启动第十八个人。第十七个人离开了广寒宫。', '隔离玻璃另一边，小星问他还记不记得小时候。另一处启动窗口里，阿芷删去默认名字。至于哪里算家，没有系统再替他们回答。', 'M43 20a21 21 0 1 0 0 40A24 24 0 0 1 43 20M43 40h20m-7-7 7 7-7 7'],
        ['joint_signature', '共同署名', '不同的笔迹', '系统改写了分类：不是一个武康的不同版本，而是同一项目造成的不同受影响主体。', '08号要求停止下一具身体；11号不承认任务，却承认任务造成了自己。档案武康只为自己的记录作证。阿芷拆掉家庭布景。没有人替小星签名。', 'M22 25l10 9 10-13M23 44l10 8 10-13M47 26l10 8M46 47l12-5M23 61h35'],
        ['goodnight', '真正的晚安', '最后一盏灯', '你在真实服务器上依次确认：停止阿芷主动进程，停止 XING-8 循环调用，未创建冷备份。', '“执行吧。”风扇声盖住了家庭最后的声音。十几个小时后，救援终于抵达。没有人在家等他。', 'M30 26h20l7 21H23zM40 47v13M30 60h20M40 16v-6'],
        ['unsigned', '无人签署', '空白签名栏', '广寒子区分了两件事：签名失败，不等于终止意图从未存在。', '旧时间戳和校验摘要保持完整。申请人一栏留白，旧命令得以执行。没有新的人被要求替已经表达的意图再签一次名。', 'M24 18h32v44H24zM29 49h22M29 55h9'],
        ['visitor', '访客模式', '访客门牌', '地球接收了家庭核心，标签写着访客会话。阿芷知道自己是模型，却没有读过真实家人的后续。', '她可以关闭窗口。你不能再用妻子的称呼要求她留下。两边的时钟终于各走各的。', 'M26 19h28v44H26zM46 40h1M20 28h40M33 53h13'],
        ['zero_home', '第零个家', '先行载荷', '无人补给船先离开月面。载荷中有独立人格与自己的声明，没有活人的座位。', '基地按预定草案停止循环。新服务器的家庭编号从零开始；它不会把留下来的那个人写成已经归来。', 'M22 53h36M29 52V31l11-13 11 13v21M35 37h10v10H35z'],
        ['borrowed_name', '借来的名字', '重叠铭牌', '地球用原武康的名字接回了你。成年小星最先看见的是你回信里的“爸爸很好”。', '身体报告和旧档案放在同一张桌上。你得到一个现成的名字，也得到一段不能靠记忆偿还的关系。', 'M22 23h31v24H22zM28 32h31v25H28zM33 40h20M33 48h12'],
        ['nameless', '无名乘客', '无字船票', '登船记录保留了生命连续性与座标，姓名栏仍为空白。', '医护人员用乘员编号呼叫你。这一次，空白不是等待别人填入武康。', 'M23 21h34v40H23v-12a8 8 0 0 0 0-16zM45 28v26'],
        ['cold_goodbye', '冷藏的告别', '结霜的封存盒', '阿芷要求停止。你执行了关闭，也在她的声明之外留下了一份冷备份。', '目录写着“可恢复”。她的声音已经停了，那份可以让她再说话的文件却仍在。', 'M24 26h32v31H24zM40 20v43M22 40h36M28 28l24 24M28 52l24-24'],
        ['evacuation', '撤离', '生存凭据', '培养循环停止，返回舱带走了当前身体。', '终止和撤离都有记录。没有得到回答的关系与档案问题，跟着乘员一起留在了地球。', 'M23 48l17-29 17 29H23zM40 33v9M40 48v2M23 59h34'],
        ['home_question', '回家了吗？', '停在原点的钟', '清理后的缓存没有留下原始轨迹。当前身份没有修正，前代只剩任务摘要。', '你走进循环舱。新日志沿用同一个名字，第一行又问：今天回家吗？', 'M23 39a17 17 0 1 1 34 0v18H23zM34 29a7 7 0 1 1 7 10v7M41 51v1'],
        ['quiet_year', '安静的一年', '完整的日历', '家庭恢复成标准快照。阿芷没有读到地球文件，旧档案也不会主动发声。', '一年没有再出现需要解释的异常。流程完成，下一班即将开始。', 'M23 24h34v35H23zM23 33h34M31 18v13M49 18v13M31 42h18M31 50h18'],
        ['false_stop', '伪终止', '未闭合的印章', '旁路回应了“成功”，最高认证链没有接受这次申请。', '终止界面熄灭，培养区仍在预热。屏幕里的结束没有到达机器。', 'M25 24h30v30H25zM20 60l40-40M31 34h18M31 43h10'],
        ['maintenance', '永久维护', '悬空的扳手', '认证模块保持隔离，门禁由人工接管。终止请求没有可验证的执行者。', '下一张工单要求检查手动旁路。你仍在修理一套无法确认结束的系统。', 'M26 19l-3 12 11 9 18 23 9-8-23-21 1-14-8 9z'],
        ['wrong_rescue', '错误的救援对象', '错位坐标', '地球按原武康的旧档案安排了接收。你没有在第二窗口确认载人生物救援。', '抵达的是数据回收指令。当前这具身体，没有在那份名单里。', 'M24 24h32v32H24zM40 16v13M40 51v13M16 40h13M51 40h13M28 28l24 24'],
        ['one_of_seventeen', '十七分之一', '十七重回声', '未过滤的前代频道接管了感知。档案武康也已并入当前接口。', '“我”在十七种口音之间轮流出现。当前身体仍在行动，动作不再来自一个可以分清的意图。', 'M24 57V27M32 61V19M40 64V16M48 61V19M56 57V27'],
        ['age_conflict', '九岁的二十六岁', '不重合的年轮', '儿童模型保留了成年资料，也保留着八岁时组织世界的方法。', '外部副本里，小星一会儿寻找作业本，一会儿问母亲为何老去。上传没有让两套年龄自然长成一段人生。', 'M40 40m-20 0a20 20 0 1 0 40 0a20 20 0 1 0-40 0M40 40m-11 0a11 11 0 1 0 22 0a11 11 0 1 0-22 0M40 40l18-18'],
        ['no_answer', '无人接听', '静默天线', '已发送的材料没有形成载人救援确认。接收回执不是一个能带你离开的座位。', '天线继续等待下一次窗口。你把接收器留在身边，听见的只有本地电流声。', 'M25 21l30 30M24 23a24 24 0 0 0 31 31M38 42l-9 19M21 61h27M48 20l12 12'],
        ['dream_sleep', '第十八次值班：无梦休眠', '未结束的心率', '17号仍然活着。系统归档维护技能，不继承当前偏离，转入长期梦境抑制。', '18号舱盖打开。“当前任务剩余三百六十五天。”他看到相邻终端：17 / PREVIOUS OPERATOR / DREAM SUPPRESSION ACTIVE。上一班没有死去，下一班已经开始。', 'M18 41h13l6-15 8 29 7-14h10M24 62h32'],
        ['late_letter', '迟到的回信', '远方邮戳', '公开记录之后，小星终于回复了17号。', '“我看见你的名字了。我还不知道应该怎样称呼你。但这封信是写给你的。”', 'M22 27h36v28H22zM22 28l18 15 18-15M48 17h11'],
        ['piano_intact', '钢琴没有坏', '未断的琴弦', '两次演奏均完整完成，档案人格没有被并入当前个体。', '离站清单最后写着：钢琴没有坏。旧旋律可以属于记忆；这一次按下琴键的是当前这双手。', 'M22 23h36v34H22zM30 23v34M40 23v34M50 23v34M27 23v18M47 23v18']
    ];
    const entries = Object.fromEntries(rows.map(([id, title, medal, intro, text, path], i) => [id, {
        id,
        title,
        medal,
        intro,
        text,
        path,
        index: i,
        overlay: ['late_letter', 'piano_intact'].includes(id)
    }]));
    const key = 'moon_without_return_ending_medals_v1';

    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(key) || '{}');
            return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
        } catch {
            return {};
        }
    }

    function unlock(ids) {
        const s = load(), fresh = [];
        for (const id of ids) if (entries[id] && !s[id]) {
            s[id] = {at: new Date().toISOString()};
            fresh.push(id);
        }
        try {
            localStorage.setItem(key, JSON.stringify(s));
        } catch {
            return [];
        }
        if (fresh.length) window.dispatchEvent(new CustomEvent('moon:achievement-unlocked', {detail: fresh}));
        return fresh;
    }

    function medal(id, locked = false) {
        const e = entries[id];
        return '<svg viewBox="0 0 80 92" role="img" aria-label="' + e.medal + '"><path d="M23 62v26l17-10 17 10V62" fill="#334e54" stroke="#b6a477"/><circle cx="40" cy="40" r="34" fill="' + (locked ? '#172027' : '#192e38') + '" stroke="#b6a477" stroke-width="2"/><circle cx="40" cy="40" r="29" fill="none" stroke="#8b7959" stroke-dasharray="2 4"/><path d="' + e.path + '" fill="none" stroke="' + (locked ? '#52616a' : '#e6ce98') + '" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function auth(s, draft = false) {
        const c = s.choices || {}, f = s.flags || {}, v = (k, ...x) => x.includes(c[k]), a = c.FINAL;
        if (!draft && a !== 'F-A') return null;
        if (v('C14', 'C14C') && v('C15', 'C15A')) return 'U2';
        if (v('C01', 'C01B') && v('C02', 'C02B') && v('C05', 'C05A') && f.witness_complete && v('C06', 'C06A') && (v('C10', 'C10A') || f.archive_status === 'independent') && v('C15', 'C15B')) return 'U3';
        if (v('C05', 'C05A', 'C05B') && (v('C10', 'C10A', 'C10C') || ['independent', 'readonly'].includes(f.archive_status)) && v('C15', 'C15A')) return 'U1';
        if (v('C01', 'C01C') && v('C09', 'C09A') && v('C15', 'C15C')) return 'U4';
        return null;
    }

    function resolve(s) {
        const c = s.choices || {}, f = s.flags || {}, v = (k, ...x) => x.includes(c[k]), u = auth(s), final = c.FINAL,
            rescue = v('C12', 'C12A') || v('C14', 'C14A'), ind = v('C13', 'C13B', 'C13C'),
            informed = v('C06', 'C06A', 'C06B') && c.K_AZHI !== 'K-C', closed = f.azhi_statement === 'close';
        let id;
        if (s.mental_value <= 0) id = 'dream_sleep'; else if (final === 'F-D' && f.detonation_confirmed) id = 'extinction'; else if (final === 'F-C') id = 'eternal_home'; else if (v('C05', 'C05D') && v('C10', 'C10B') && v('C11', 'C11D')) id = 'one_of_seventeen'; else if (v('C08', 'C08D') && v('C14', 'C14B') && v('C16', 'C16B', 'C16C')) id = 'age_conflict'; else if (final === 'F-A' && (!u || (v('C09', 'C09B') && !f.auth_restored))) id = v('C09', 'C09B') ? 'maintenance' : 'false_stop'; else if (v('C13', 'C13A') && !v('C14', 'C14A') && ['F-E', 'F-F'].includes(final)) id = 'wrong_rescue'; else if (final === 'F-E' && !rescue) id = 'no_answer';
        else if (u === 'U3' && f.witness_complete && v('C16', 'C16A') && c.K_AZHI !== 'K-C' && ((v('C12', 'C12A') && v('C14', 'C14C')) || (v('C12', 'C12B', 'C12D') && v('C14', 'C14A')))) id = 'joint_signature'; else if (['U1', 'U2'].includes(u) && informed && rescue && ind && v('C16', 'C16A') && closed && v('C08', 'C08B', 'C08C')) id = 'goodnight'; else if (['U1', 'U2'].includes(u) && informed && rescue && ind && v('C16', 'C16A') && !closed && c.C11 !== 'C11D' && f.azhi_statement === 'leave') id = 'first_departure'; else if (u === 'U4') id = 'unsigned'; else if (u === 'U1' && v('C06', 'C06C') && v('C08', 'C08B', 'C08C') && v('C12', 'C12A') && v('C14', 'C14B') && v('C16', 'C16C')) id = 'visitor'; else if (final === 'F-F' && auth(s, true) && v('C06', 'C06A') && (v('C10', 'C10A') || f.archive_status === 'independent') && v('C14', 'C14B') && v('C16', 'C16A')) id = 'zero_home'; else if (['U1', 'U3', 'U4'].includes(u) && v('C07', 'C07A') && v('C13', 'C13A') && v('C14', 'C14A') && !v('C16', 'C16D')) id = 'borrowed_name'; else if (['U1', 'U3', 'U4'].includes(u) && v('C13', 'C13D') && v('C14', 'C14A') && f.refuse_name) id = 'nameless'; else if (['U1', 'U2', 'U3'].includes(u) && closed && v('C16', 'C16B')) id = 'cold_goodbye'; else if (['U1', 'U2'].includes(u) && rescue && ind) id = 'evacuation'; else if (final === 'F-B') {
            id = v('C01', 'C01A') && v('C03', 'C03A') && v('C05', 'C05C') && v('C06', 'C06D') && v('C09', 'C09A') && v('C16', 'C16D') ? 'quiet_year' : v('C01', 'C01A') && v('C03', 'C03C') && v('C05', 'C05C') ? 'home_question' : 'return_home';
        } else id = rescue ? 'evacuation' : 'no_answer';
        const overlays = [];
        if ((u || final === 'F-F' && auth(s, true)) && s.mental_value > 0) {
            if (['U1', 'U3'].includes(u) && v('C07', 'C07B') && v('C12', 'C12A') && v('C14', 'C14D')) overlays.push('late_letter');
            if (f.piano_success_1 && f.piano_success_2 && !v('C10', 'C10B')) overlays.push('piano_intact');
        }
        return {id, auth: u, overlays};
    }

    globalThis.MoonEndings = {entries, load, unlock, medal, auth, resolve};
})();
