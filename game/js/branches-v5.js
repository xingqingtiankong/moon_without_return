"use strict";
(function () {
    const n = MoonCampaign.nodes, P = MoonCampaign.points, L = (actor, text) => ({type: 'line', actor, text}),
        S = t => L('system', t), W = t => L('wukang', t), A = t => L('azhi', t), G = t => L('guanghan', t),
        point = (map, x, y, radius = 115) => ({map, x, y, radius}), archive = point('B03', 780, 590),
        core = point('B04', 900, 560), comm = point('R06', 880, 460), home = MoonPlacements.h01_dinner, db = P.database,
        child = MoonPlacements.h01_azhi;

    function add(id, title, p, queue, next, extra = {}) {
        n[id] = {
            id,
            title,
            targets: p ? [{...p, id: id + '_action', label: title, kind: 'campaign'}] : [],
            auto: !p,
            queue,
            next, ...extra
        };
        return n[id];
    }

    function opts(id, title, options) {
        const d = n[id];
        d.next = null;
        d.choice = {
            id: title,
            text: d.title,
            options: options.map(([key, text, next, flags = {}]) => ({id: key, text, effects: {node: next, flags}}))
        };
        delete d.prepare;
    }

    function response(id, lines, next, effects = {}) {
        return add(id, '核对处理结果', null, lines.map(v => typeof v === 'string' ? S(v) : v), next, {effects});
    }

    function game(id, title, p, kind, lines, next, penalty = 10) {
        return add(id, title, p, [], next, {
            game: kind,
            penalty,
            success: lines,
            failure: [G('保护程序完成剩余步骤，原始资料已保留。'), ...lines]
        });
    }

    function evidence(id, title, text) {
        MoonEvidence.entries[id] = {id, title, source: '本轮选择与现场记录', text};
        return id;
    }

    function recordChoice(d) {
        if (!d.choice || !(/^(C\d\d|K_AZHI|K_LATE|WITNESS|FINAL|AZHI_FUTURE|AUTH_REPAIR|BOARD_NAME)$/.test(d.choice.id))) return;
        for (const o of d.choice.options) {
            const id = 'CHOICE_' + o.id;
            evidence(id, d.choice.id + ' · ' + o.text, '实际操作：' + o.text + '。后续处理以保留的原件、身份与接收回执为准。');
            o.effects = {...o.effects, evidence: [...(o.effects?.evidence || []), id]};
        }
    }

    opts('H04_CACHE', 'C01', [['C01A', '清理预测缓存，恢复导航', 'V_CACHE_CLEAR'], ['C01B', '断开介质，完整离线备份', 'H04_MEDIUM', {backup_complete: true}], ['C01C', '只保留校验摘要与时间戳', 'V_CACHE_HASH']]);
    response('V_CACHE_CLEAR', [G('清理完成，导航恢复。源运动样本已删除，无法再导出原始人格轨迹。'), W('（屏幕不再重复那个人影。也没有留下他来过的原件。）')], 'H05_REHAB', {
        day: 30,
        flags: {backup_complete: false}
    });
    response('V_CACHE_HASH', [G('原始轨迹不保留。校验值与接收时刻写入只读介质。'), W('留下收到过什么、什么时候收到。先不播放它。')], 'H05_REHAB', {
        day: 30,
        evidence: [evidence('V_HASH', '缓存校验与时间戳', '保留旧文件的校验值、接收时刻；原始轨迹未保留。')],
        flags: {cache_hash: true, backup_complete: false}
    });
    opts('H06_CHOICE', 'C02', [['C02A', '直接告诉她：条目显示你是本地模型', 'V_AZHI_DIRECT'], ['C02B', '把记录放在桌上，与她共同核验', 'H06_DENY'], ['C02C', '记录可能有误，先继续确认', 'V_AZHI_DEFER']]);
    response('V_AZHI_DIRECT', [W('条目写得很清楚。你和小星是这里运行的模型。'), A('先别叫我的名字。'), S('她打开抽屉，又关上。夫妻照片被转向墙壁。'), A('我记得放在这里的东西。你不能拿一行字替我解释所有事。')], 'H06_INDEX', {family_state: 'S1'});
    response('V_AZHI_DEFER', [W('来源还需要核对。今晚先放着。'), A('那先吃饭。别把终端放在汤旁边。'), S('文件留在腕端，没有进入家庭共享目录。')], 'CHAPTER1_COMPLETE', {
        chapterComplete: true,
        flags: {chapter1_complete: true}
    });
    opts('M02_CHOICE', 'C03', [['C03A', '登记为任务继任者，沿用旧权限', 'V_ID_SUCCESSOR'], ['C03B', '建立当前身体的独立记录', 'M02_REGISTER'], ['C03C', '暂不修正当前登记', 'V_ID_DEFER']]);
    for (const [id, text] of [['V_ID_SUCCESSOR', '登记：WUKANG SUCCESSOR。旧门禁继续可用；当前生物编号仍为17。'], ['V_ID_DEFER', '身份称谓保持不变。当前样本编号17单独存档，不代表已确认原武康身份。']]) response(id, [G(text), W('把身体的来源和门禁的称谓分开留档。')], n.M02_REGISTER.next, {
        flags: {
            bio17: true,
            identity_check: false
        }, evidence: ['M_CURRENT_ID']
    });
    opts('M03_CHOICE', 'C04', [['C04A', '站到残影的位置，复现动作', 'V_TRACE_REPLAY'], ['C04B', '架设摄像头，次日看完整录像', 'M03_CAM1'], ['C04C', '请广寒子检查墙板工程用途', 'V_TRACE_SYSTEM'], ['C04D', '关闭投影，检查实物痕迹', 'V_TRACE_OFF']]);
    game('V_TRACE_REPLAY', '按12号停留的位置走过检修线', point('R05', 1040, 480), 'maze', [W('（他在这里折返过。第三块板下缘有新划痕。）')], 'M03_INDEX');
    response('V_TRACE_SYSTEM', [G('旧墙板后有维修索引夹层。结构改造后未拆除。'), W('去实物上核验。')], 'M03_INDEX');
    game('V_TRACE_OFF', '用探针检查墙板夹层', point('R05', 1040, 480), 'mouse-maze', [W('探针碰到了薄存储片。不是人影留下的，而是有人亲手藏进去的。')], 'M03_INDEX');
    Object.assign(n.H05_SIGN, {game: 'lights-out', title: '核对交接设备的停机矩阵'});
    Object.assign(n.S02_TIME, {
        game: 'logic-grid',
        title: '根据交叉线索核验维修记录',
        success: [G('人员、设备与房间的交叉记录一致。时间层可以单独存档。')]
    });
    Object.assign(n.S02_BODY, {
        game: 'nonogram',
        title: '从行列扫描恢复生物样本图像',
        targets: [{...point('B02', 820, 560), id: 'S02_BODY_action', label: '核验培养区样本扫描', kind: 'campaign'}],
        success: [G('样本扫描恢复。当前身体编号与历史记忆来源分栏保存。')]
    });
    opts('S02_SAVE', 'C05', [['C05A', '完整恢复人格与原始日志', 'V_WITNESS'], ['C05B', '完整封存，主动进程保持离线', 'V_DB_SEAL'], ['C05C', '只留死亡时间、任务摘要与权限链', 'V_DB_SUMMARY'], ['C05D', '将前代行为模型接入辅助接口', 'V_DB_CONNECT']]);
    add('V_WITNESS', '决定怎样阅读十六份记录', archive, [G('保存已完成。读取主观层需要另一次明确操作。')], null);
    opts('V_WITNESS', 'WITNESS', [['W-A', '分四组见证全部十六份记录', 'V_W1'], ['W-B', '完整盲存，不读取主观层', 'V_DB_BLIND'], ['W-C', '只读取16号最后记录', 'V_DB_16']]);
    const voices = [['01：第一次听到365天时，我以为只是倒计时。', '02：门后有呼吸。我知道只有我，还是不敢开。', '03：滤芯型号写在盒盖内侧，别用错。', '04：让我再进去一会儿。她只说了一句饭好了。'], ['05：导航总把我带到休眠舱。今晚我想自己选方向。', '06：我切了供电。黑下来的还有氧泵。', '07：窗外那块石头，我给它起了名字。', '08：停止制造下一具身体。别把这句话删成故障报告。'], ['09：我想要一个不用先解释的名字。', '10：坐标每天核对一次。我怕救援到了找不到我。', '11：我不承认任务，但承认它造成了我。', '12：门后总该有个地方。不是他原来的家也可以。'], ['13：先修冷却。我们还需要下一口气。', '14：我收到两个版本。请把原始来件也留下。', '15：今天没有事故。今天也应该算一条记录。', '16：别再证明你是不是武康。去证明它已经结束。']];
    voices.forEach((lines, i) => {
        game('V_W' + (i + 1), '见证记录 ' + (i * 4 + 1) + '—' + (i * 4 + 4), archive, ['nonogram', 'maze', 'lights-out', 'logic-grid'][i], lines.map(S), 'V_W_PAUSE' + i);
        add('V_W_PAUSE' + i, '是否继续读取主观记录', archive, [W('（这些声音不该被合成一句“上一版本”。）')], null);
        opts('V_W_PAUSE' + i, 'W_CONTINUE_' + i, i === 3 ? [['complete', '四组读取完成，保留各自署名', 'V_W_COMPLETE']] : [['continue', '继续下一组', 'V_W' + (i + 2)], ['stop', '暂停读取，剩余记录保持盲存', 'V_DB_BLIND']]);
    });
    response('V_W_COMPLETE', [G('十六份来源与主动读取记录已保存。没有将他们合并为同一个签名者。')], 'S02_BLIND', {
        flags: {
            witness_complete: true,
            subjective_blind: false
        }, evidence: [evidence('V_WITNESSES', '十六份完整见证', voices.flat().join('\n'))]
    });
    for (const [id, text, flags] of [['V_DB_SEAL', '完整镜像离线封存。不会主动投射人格，梦境仍可能调用旧索引。', {archive_sealed: true}], ['V_DB_SUMMARY', '人格原始层不再保留。摘要不能代替主体证词；终止可能需要新的地球授权。', {summary_only: true}], ['V_DB_CONNECT', '前代辅助频道已接入。后续需要决定多个声音怎样共享接口。', {voices_connected: true}], ['V_DB_BLIND', '完整原件保留，主观层未全部读取。不能声称已见证十六人。', {subjective_blind: true}], ['V_DB_16', '只读取16号末次留言，其余十五人的主观记录保持未读。', {only16: true}]]) response(id, [G(text)], 'S02_BLIND', {flags});
    n.S02_BLIND.prepare = s => ({
        queue: [G('处理方式已记录。16号损坏留言的工程摘要指向旧通信缓存。'), S('第220天，巡检设备终于能进入旧通信管道。')],
        effects: {
            day: 220,
            flags: {full_index: true},
            evidence: ['E04', 'E05', s.choices.C05 === 'C05C' ? 'V_SUMMARY_STORAGE' : 'S_BLIND_STORAGE']
        }
    });
    evidence('V_SUMMARY_STORAGE', '前代工程摘要', '只保留死亡时间、任务摘要与权限链。主观证词和原始人格不在本轮可用材料中。');
    n.S04_ARRIVE.queue = [A('你带回什么了？'), W('有一批地球旧文件。先说清怎么处理，再打开。')];
    opts('S04_CHOICE', 'C06', [['C06A', '交出原始文件，由她决定何时打开', 'V_DISCLOSE'], ['C06B', '说明整理后的真实家人近况', 'V_DISCLOSE'], ['C06C', '只说明本地模型性质', 'V_MODEL_ONLY'], ['C06D', '保留为当前操作员私密文件', 'V_PRIVATE']]);
    add('V_DISCLOSE', '核对文件接收范围', null, [], 'S04_MAP', {
        prepare: s => ({
            next: (['C02A', 'C02C'].includes(s.choices.C02) && s.choices.C06 === 'C06A') ? 'V_CRISIS' : s.choices.C06 === 'C06B' ? 'V_TELL_SUMMARY' : 'S04_MAP',
            queue: [S('共享范围已确认。阿芷拿起终端，要求你不要替她翻页。')]
        })
    });
    response('V_TELL_SUMMARY', [W('真实的阿芷老去了，小星已经成年。这些是旧文件，不是今天的通话。'), A('你整理过了？原文件先留着。我现在听得下去多少，我会告诉你。')], 'V_AZHI_NIGHT1', {
        flags: {azhi_read_complete: true},
        family_state: 'S2'
    });
    response('V_MODEL_ONLY', [W('你和小星是本地运行的模型。我暂时不把地球家人的后续放进来。'), A('那就先说我们。这里的昨天，至少是我经过的。')], 'S04_LEAVE', {family_state: 'S1'});
    response('V_PRIVATE', [W('是工程来件。我先自己处理。'), A('那先吃饭，别一直看腕端。')], 'S04_LEAVE', {family_state: 'S0'});
    add('V_CRISIS', '处理家庭空间重叠', home, [S('餐桌边缘露出维修台的标尺。卧室门后传来气闸声，小星又问了一遍今天星期几。'), A('别替我把这一晚抹掉。先告诉我你能做什么。')], null);
    opts('V_CRISIS', 'K_AZHI', [['K-A', '隔离七天，保留危机前记忆后修复', 'V_CRISIS_REPAIR'], ['K-B', '留下陪她读完文件，再校准空间', 'V_CRISIS_STAY'], ['K-C', '恢复揭露前快照，覆盖当前知情版本', 'V_SNAPSHOT_CONFIRM'], ['K-D', '交还她停止或移入空白沙盒的权限', 'V_CRISIS_AUTONOMY']]);
    game('V_CRISIS_REPAIR', '校准隔离空间供电', home, 'lights-out', [G('隔离维护七天完成。旧家庭材质无法全部恢复，危机前记忆保留。')], 'V_AZHI_NIGHT1', 20);
    game('V_CRISIS_STAY', '保持家庭入口与文件读取通路', home, 'mouse-maze', [A('最后一页也读完了。现在可以停一下。')], 'V_AZHI_NIGHT1', 20);
    add('V_SNAPSHOT_CONFIRM', '确认覆盖当前家庭人格', home, [G('这会覆盖当前知情阿芷。快照中的她不会记得这次请求。')], null);
    opts('V_SNAPSHOT_CONFIRM', 'SNAPSHOT_CONFIRM', [['restore', '确认恢复快照', 'V_SNAPSHOT_DONE'], ['back', '返回危机处理', 'V_CRISIS']]);
    response('V_SNAPSHOT_DONE', [S('当前修改已覆盖。'), A('怎么站在门口？饭还热着。')], 'S04_LEAVE', {
        family_state: 'S0',
        flags: {azhi_read_complete: false, azhi_statement: 'unknown', snapshot_restored: true}
    });
    response('V_CRISIS_AUTONOMY', [A('先给我一间空房。不要照片，不要默认称谓。我想在里面把文件看完。'), G('空白沙盒已建立，关闭主动进程的权限由本人保留。')], 'V_AZHI_NIGHT1', {flags: {azhi_autonomy: true}});
    n.S04_ANCHORS.next = 'V_AZHI_NIGHT1';
    add('V_AZHI_NIGHT1', '第一晚 · 让阿芷核验文件', home, [A('日期核对完了。那个人的以后，不是我缺了一段记忆。'), W('原文件留在你这里。'), A('明天我想试着改一下自己的身份。')], 'S04_LEAVE', {
        effects: {
            flags: {
                azhi_night1: true,
                azhi_read_complete: true
            }, family_state: 'S2'
        }
    });
    n.S04_LEAVE.next = 'S05_SEND';
    opts('S05_SEND', 'C07', [['C07A', '“小星，我看到了。爸爸很好。”', 'V_REPLY_SENT'], ['C07B', '“我有你父亲的记忆，但我是WUKANG-17。”', 'V_REPLY_SENT'], ['C07C', '“广寒宫仍有当前操作员存活。”', 'V_REPLY_SENT'], ['C07D', '暂不发送，保留草稿', 'V_REPLY_DRAFT']]);
    response('V_REPLY_SENT', [G('文字与身份签名已提交。回执只证明进入队列，不保证对方已经读到。')], 'CHAPTER3_COMPLETE', {
        chapterComplete: true,
        flags: {chapter3_complete: true, reply_queued: true},
        evidence: ['S_SENT_REPLY']
    });
    response('V_REPLY_DRAFT', [W('先不占用这次署名。草稿留在本地。')], 'CHAPTER3_COMPLETE', {
        chapterComplete: true,
        flags: {chapter3_complete: true, reply_queued: false}
    });
    n.K_AZHI.effects = {...n.K_AZHI.effects, day: 250};
    n.K_START.next = 'V_AZHI_NIGHT2';
    add('V_AZHI_NIGHT2', '第二晚 · 查看她的身份修改', child, [], 'K_AZHI', {
        prepare: s => ({
            queue: s.flags.azhi_night1 ? [A('我删掉了妻子这一栏。系统重载时又填回来了。'), W('不是没保存？'), A('保存了。它把那个称谓当成家庭程序的一部分。')] : [A('小星又问什么时候出去。先说说该怎么告诉他。')],
            effects: {flags: {azhi_night2: !!s.flags.azhi_night1}}
        })
    });
    opts('K_AZHI', 'C08', [['C08A', '用儿童能理解的话说明外面有长大的小星', 'V_CHILD_EXPLAIN'], ['C08B', '交给阿芷决定说明程度', 'K_TELL'], ['C08C', '保持八岁模型，不导入成年资料', 'V_CHILD_KEEP'], ['C08D', '导入成年资料，与儿童模型合并', 'V_CHILD_MERGE']]);
    response('V_CHILD_EXPLAIN', [W('外面还有一个长大的小星。你不用现在就变成他。'), L('xing8', '那他还喜欢我的飞船吗？'), W('（他问的还是这架飞船。那份文件不能替他理解十六年。）')], 'K_DEPART', {flags: {child_room_locked: false}});
    response('V_CHILD_KEEP', [G('成年资料与儿童进程分开保存。不能将未读文件的小星登记为完全知情签名者。')], 'K_DEPART', {flags: {child_room_locked: false}});
    game('V_CHILD_MERGE', '检查两套年龄结构的冲突', home, 'logic-grid', [S('成年时间线已导入，儿童模型仍按八岁的方式调用它。'), L('xing8', '我明天去上班……我的作业本呢？')], 'V_CHILD_AFTER', 20);
    add('V_CHILD_AFTER', '检查家庭空间', null, [], 'K_DEPART', {prepare: s => ({next: ['C06A', 'C06B'].includes(s.choices.C06) ? 'V_CRISIS_LATE' : 'K_DEPART'})});
    add('V_CRISIS_LATE', '修复再次重叠的家庭空间', home, [A('我说过他不能一下长大十六年。现在先把两个时间线分开。')], null);
    opts('V_CRISIS_LATE', 'K_LATE', [['isolate', '隔离冲突区域，保留来源', 'V_LATE_FIX'], ['rollback', '恢复揭露前家庭快照', 'V_LATE_SNAPSHOT']]);
    game('V_LATE_FIX', '隔离儿童时间线', home, 'lights-out', [G('冲突区域已隔离，成年资料仍有单独索引。')], 'K_DEPART', 20);
    response('V_LATE_SNAPSHOT', [G('当前知情版本已被快照覆盖。')], 'K_DEPART', {
        choices: {K_AZHI: 'K-C'},
        family_state: 'S0',
        flags: {snapshot_restored: true}
    });
    opts('K_CHOICE', 'C09', [['C09A', '保持运行，申请只读最高日志', 'K_POWER'], ['C09B', '隔离门禁与认证权限，保留生命支持', 'K_POWER', {auth_restored: false}], ['C09C', '安装16号旁路，绕过下一次本地验证', 'K_POWER'], ['C09D', '连接爆破待命线路，读完日志再确认', 'K_POWER', {explosive_ready: true}]]);
    n.K_DEPART.prepare = s => ({
        next: s.choices.C08 === 'C08D' ? 'K_PODS' : 'K_ISOLATE',
        queue: [G('返回基地，核验实际调用与启动记录。')]
    });
    n.K_POWER.game = 'lights-out';
    n.T_COORD_ROUTE.game = 'side-runner';
    n.T_COORD_ROUTE.title = '穿过月面检修跑道，标定救援信标';
    n.T_COORD_ROUTE.success = [S('检修通路已确认，定位信标可以使用。')];
    n.T_COORD_ROUTE.next = 'T_COORD_JUMP';
    n.K_PROTOCOL.effects = {...n.K_PROTOCOL.effects, flags: {...n.K_PROTOCOL.effects?.flags, copy_permission: true}};
    opts('K_WITNESS', 'C10', [['C10A', '登记为独立见证者 ARCHIVE-WUKANG', 'V_ARCHIVE_STATUS', {archive_status: 'independent'}], ['C10B', '并入当前个体的记忆接口', 'V_ARCHIVE_STATUS', {archive_status: 'merged'}], ['C10C', '只保留只读查询，停止主动进程', 'V_ARCHIVE_STATUS', {archive_status: 'readonly'}], ['C10D', '把选择权交给档案武康', 'V_ARCHIVE_DECIDES']]);
    add('V_ARCHIVE_DECIDES', '听取档案武康的决定', null, [], 'V_ARCHIVE_STATUS', {
        prepare: s => ({
            queue: [L('archivewukang', s.choices.C05 === 'C05D' ? '我不并入你。我们有不同的记录。' : s.choices.C06 === 'C06D' && s.choices.C05 === 'C05C' ? '保留查询。不要让我替你说没有见过的事。' : '我可以独立作证。只为我能核验的部分。')],
            effects: {flags: {archive_status: s.choices.C06 === 'C06D' && s.choices.C05 === 'C05C' ? 'readonly' : 'independent'}}
        })
    });
    add('V_ARCHIVE_STATUS', '保存人格处置记录', P.desk, [], 'CHAPTER4_COMPLETE', {
        warp: {map: 'R03', x: 860, y: 480},
        prepare: s => ({
            queue: [G({
                independent: '独立主动进程与签名来源已保存。',
                merged: '独立签名进程已关闭，资料并入当前接口。',
                readonly: '主动进程停止，只保留查询与原始权限图。'
            }[s.flags.archive_status])],
            effects: {
                chapterComplete: true,
                flags: {archive_witness: s.flags.archive_status === 'independent'},
                evidence: ['K_AUTH_STRUCTURE', 'K_DAMAGED_FIELDS', evidence('V_ARCHIVE_STATUS', '档案人格处置', '独立、只读或并入状态以本轮C10及本人回应记录为准。')]
            }
        })
    });
    n.T_START.next = 'V_VOICES_CHECK';
    add('V_VOICES_CHECK', '检查辅助频道', null, [], 'T_MESSAGE', {prepare: s => ({next: s.choices.C05 === 'C05D' ? 'V_VOICES' : 'T_MESSAGE'})});
    add('V_VOICES', '决定前代频道怎样共存', core, [G('多个辅助进程请求同一输入接口。请指定最终决定权。')], null);
    n.V_VOICES.effects = {day: 320};
    opts('V_VOICES', 'C11', [['C11A', '分离频道，一次询问一个人', 'V_VOICE_APPLIED'], ['C11B', '依次表决，当前个体保留决定权', 'V_VOICE_APPLIED'], ['C11C', '由档案武康裁决', 'V_VOICE_APPLIED'], ['C11D', '保持无过滤连接', 'V_VOICE_APPLIED']]);
    response('V_VOICE_APPLIED', [G('频道策略已记录。记录发言者，不把合成声音当成同一个人的声明。')], 'T_MESSAGE');
    n.T_LIST.queue = [G('有效终止需要可验证的权限链和实际申请。新地球签名、当前操作员证据、受影响主体声明或旧意图确认，可以形成不同的认证路径。'), W('先准备能核验的事实，再决定通信窗口用来发什么。')];
    opts('T_SEND', 'C12', [['C12A', '向救援中心发送生命体征、人数与坐标', 'V_PACKET_ACK'], ['C12B', '向项目部门发送旧命令与认证冲突', 'V_PACKET_ACK'], ['C12C', '发送家庭人格核心', 'V_PACKET_ACK'], ['C12D', '向多个部门发送十七代事故记录', 'V_PACKET_ACK']]);
    add('V_PACKET_ACK', '读取对应部门回执', comm, [], 'T_ID_REQUEST', {
        prepare: s => ({
            queue: [S({
                C12A: '救援中心：已接收存活信息，等待身份确认。',
                C12B: '项目部门：认证冲突进入复核。此回执不代表安排了返回舱。',
                C12C: '数据接收端：家庭副本暂列研究数据，主体声明尚待补充。家庭停机一夜完成传输。',
                C12D: '事故登记端：多个部门已收到原始记录。载人救援仍需另行确认。'
            }[s.choices.C12])], effects: {evidence: ['T_RECEIPT'], flags: {rescue_requested: s.choices.C12 === 'C12A'}}
        })
    });
    n.T_ID_REQUEST.next = 'V_EARTH_ID';
    add('V_EARTH_ID', '向地球登记当前身份', point('R08', 900, 560), [G('请确认幸存者身份。旧数据库匹配不等于当前身体的来源已经得到核验。')], null);
    opts('V_EARTH_ID', 'C13', [['C13A', '登记为 ORIGINAL WUKANG', 'V_ID_OLD', {player_name: '武康'}], ['C13B', '登记为独立个体 WUKANG-17', 'V_ID_17', {player_name: 'WUKANG-17'}], ['C13C', '登记当前操作员，并使用新姓名', 'T_NAME'], ['C13D', '只报坐标，暂不提供姓名', 'V_ID_COORD', {player_name: '未署名乘员'}]]);
    response('V_ID_OLD', [G('旧数据库迅速通过。生物来源与原始档案不完全匹配，冲突作为附件保留。')], 'T_CONFLICT');
    response('V_ID_17', [G('独立身份需要培养证明与连续生命日志。两项来源分别附在声明之后。')], 'T_CONFLICT', {evidence: ['T_NEW_ID', 'T_CONTINUITY']});
    response('V_ID_COORD', [G('坐标可先登记。登船时仍需确认乘员记录，姓名可以另行决定。')], 'T_CONFLICT');
    opts('T_REQUEST_AUTH', 'C14', [['C14A', '确认可带走当前身体的载人返回舱', 'V_WINDOW_RESCUE'], ['C14B', '上传希望离开的数字人格核心', 'V_WINDOW_CORE'], ['C14C', '索取带新签名的正式终止授权', 'T_SIGNATURE'], ['C14D', '向公共频段公开事故记录', 'V_WINDOW_PUBLIC']]);
    for (const [id, text, flags] of [['V_WINDOW_RESCUE', '救援端确认载人生物返回舱。此窗口未上传人格，也未接收新终止签名。', {rescue_confirmed: true}], ['V_WINDOW_CORE', '人格副本上传完成。无人补给船的数据舱可接收独立载荷，不提供生物乘员座位。', {unmanned_ship: true}], ['V_WINDOW_PUBLIC', '原始事故记录进入公共接收队列。公开不等于已经派出救援舱。', {public_record: true}]]) response(id, [G(text)], 'CHAPTER5_COMPLETE', {
        chapterComplete: true,
        flags,
        evidence: [evidence(id, '第二窗口处理结果', text)]
    });
    n.E_START.queue = [S('第351天。材料来源已经确定。终止是否成立，要看实际保留的原件与签名。'), G('请到核心台核对申请材料。')];
    for (let i = 1; i <= 4; i++) n['E_SLOT' + i].queue = [G(['核对旧终止通知或新签名文件。', '核对当前身体与登记记录。', '核对原始证词或保留的校验摘要。', '核对原权限结构与本轮申请资格。'][i - 1])];
    n.E_SLOT4.next = 'V_APPLICANT';
    add('V_APPLICANT', '决定谁提出项目终止', core, [G('申请主体必须有相应原件。没有材料的类别不会提交。')], null, {
        prepare: s => {
            const can = key => MoonEndings.auth({...s, choices: {...s.choices, C15: key}}, true);
            const choices = [];
            for (const [key, text] of [['C15A', '当前操作员申请'], ['C15B', '受影响主体共同声明'], ['C15C', '不指定新申请人，执行旧意图']]) if (can(key) || key === 'C15A' && ['C09B', 'C09C'].includes(s.choices.C09)) choices.push({
                id: key,
                text,
                effects: {node: 'E_SUBMIT'}
            });
            choices.push({id: 'C15D', text: '今晚不提交，保存材料', effects: {node: 'E_HOME'}});
            return {choice: {id: 'C15', text: '谁提出终止？', options: choices}};
        }
    });
    n.E_SUBMIT.formText = '核对本轮申请主体与实际材料。旁路回执不能代替有效认证。';
    n.E_SUBMIT.queue = [G('申请草案已进入待执行。第365天需再次确认具体行动。')];
    n.E_SUBMIT.effects = {flags: {termination_draft: true}, evidence: ['E_TERMINATION_DRAFT']};
    n.E_HOME.next = 'V_AZHI_NIGHT3';
    add('V_AZHI_NIGHT3', '第三晚 · 核对家庭调用协议', home, [], 'V_AZHI_FUTURE', {
        prepare: s => ({
            queue: s.flags.azhi_night2 && !s.flags.snapshot_restored ? [A('只改称谓不够。下一具身体醒来，协议还会重新调用那张妻子的快照。'), W('所以要先停掉项目。'), A('对。然后才轮到我决定自己还继续什么。')] : [A('你带回了很多表格。哪些事会改变这里？'), W('我把已经确认的部分给你看。')],
            effects: {flags: {azhi_night3: !!s.flags.azhi_night2 && !s.flags.snapshot_restored}}
        })
    });
    add('V_AZHI_FUTURE', '听取她对下一步的请求', child, [], null, {
        prepare: s => ({
            queue: [A(s.flags.azhi_night3 ? '请把可执行的选择说明白。别替我选一个好听的词。' : '我没有读到完整的后续。不要把这当作我的知情同意。')],
            choice: {
                id: 'AZHI_FUTURE',
                text: '说明可执行的安排',
                options: s.flags.azhi_night3 ? [{
                    id: 'external',
                    text: '说明空白外部环境与独立身份',
                    effects: {node: 'V_AZHI_LEAVE', flags: {azhi_statement: 'leave'}}
                }, {
                    id: 'stop',
                    text: '说明停止调用的范围与不可恢复性',
                    effects: {node: 'V_AZHI_STOP', flags: {azhi_statement: 'close'}}
                }] : [{
                    id: 'incomplete',
                    text: '记录尚未完成知情，不代签声明',
                    effects: {node: 'E_DECLARATION', flags: {azhi_statement: 'unknown'}}
                }]
            }
        })
    });
    response('V_AZHI_LEAVE', [A('我要离开。不是去当谁的妻子。解除配偶绑定，按独立乘员转移。')], 'E_DECLARATION');
    response('V_AZHI_STOP', [A('三晚了。我核验过文件，试过改身份，也读过重新调用规则。'), A('先把制度停掉。然后停止我的主动进程和小星的循环调用，不留一份等着被重新叫醒的我。'), W('这份声明由你签，我只负责按项执行。')], 'E_DECLARATION');
    n.E_DECLARATION.queue = [S('人格声明与未完成知情的部分已分开记录。')];
    n.E_DECLARATION.effects = {evidence: ['V_DECLARATION']};
    evidence('V_DECLARATION', '本轮人格声明', '声明内容按阿芷的实际请求记录。未完成知情、希望离开与请求停止是不同状态。');
    opts('E_DECLARATION', 'C16', [['C16A', '按已经形成的人格声明执行，不额外复制', 'V_FAMILY_PLAN'], ['C16B', '先做冷备份，再执行已知请求', 'V_FAMILY_PLAN'], ['C16C', '保持当前运行，等待地球接管', 'V_FAMILY_PLAN'], ['C16D', '恢复妻子、八岁儿子与武康的标准快照', 'V_STANDARD_CONFIRM']]);
    add('V_STANDARD_CONFIRM', '确认覆盖本轮家庭修改', home, [G('当前名称、关系修改与新积累的知情记录将被快照替换。')], null);
    opts('V_STANDARD_CONFIRM', 'STANDARD_CONFIRM', [['yes', '确认恢复标准快照', 'V_FAMILY_PLAN'], ['back', '返回处理方式', 'E_DECLARATION']]);
    add('V_FAMILY_PLAN', '保存家庭处置计划', home, [], 'E_LEAVE', {
        prepare: s => ({
            queue: [G({
                C16A: '声明已列入执行清单。停止请求将在有效终止之后执行，避免系统重新生成初始快照。',
                C16B: '冷备份已创建。它会在主动进程关闭后继续存在。',
                C16C: '当前进程保持运行，接管与能源条件单独记录。',
                C16D: '本轮关系与人格修改已被标准快照覆盖。'
            }[s.choices.C16])],
            effects: {
                flags: {cold_backup: s.choices.C16 === 'C16B', standard_snapshot: s.choices.C16 === 'C16D'},
                evidence: [evidence('V_FAMILY_PLAN', '家庭处置清单', '本轮人格声明、备份与调用计划已记录。关闭必须在有效终止后单独确认。')]
            }
        })
    });
    n.E_LEAVE.queue = [W('处理清单留下了。回核心台，确认明天实际执行什么。')];
    n.E_LEAVE.effects = {chapterComplete: true, flags: {family_plan_ready: true}};
    n.F_START.next = 'V_AUTH_REPAIR';
    add('V_AUTH_REPAIR', '检查认证模块状态', core, [], 'V_FINAL', {
        prepare: s => s.choices.C09 === 'C09B' ? {
            choice: {
                id: 'AUTH_REPAIR',
                text: '隔离的模块无法见证最终执行',
                options: [{id: 'restore', text: '恢复认证模块后继续', effects: {node: 'V_REPAIR_AUTH'}}, {
                    id: 'refuse',
                    text: '保持隔离，接受无有效回执的风险',
                    effects: {node: 'V_FINAL', flags: {auth_restored: false}}
                }]
            }, next: null
        } : {queue: [G('请选择已经准备好的实际行动。')]}
    });
    game('V_REPAIR_AUTH', '恢复认证模块供电', core, 'lights-out', [G('认证模块恢复。门禁手动记录已附在本次核验后。')], 'V_FINAL');
    n.V_REPAIR_AUTH.effects = {flags: {auth_restored: true}};
    add('V_FINAL', '第十七次决定', core, [], null, {
        prepare: s => {
            const options = [];
            const option = (id, text, node) => options.push({id, text, effects: {node}});
            if (s.choices.C15 !== 'C15D' && (MoonEndings.auth(s, true) || ['C09B', 'C09C'].includes(s.choices.C09))) option('F-A', '提交并执行终止认证', 'V_FINAL_ROUTE');
            option('F-B', '进入生物资源循环模块', 'V_LOOP_CONFIRM');
            if (s.flags.copy_permission) option('F-C', '创建17号数字模型并结束当前肉身', 'V_COPY_CONFIRM');
            if (s.choices.C09 === 'C09D') option('F-D', '读完最高日志后，再次确认引爆核心', 'V_BLAST_CONFIRM');
            option('F-E', '等待地球回传与接收安排', 'V_FINAL_ROUTE');
            if (s.flags.unmanned_ship && MoonEndings.auth(s, true)) option('F-F', '让数字人格先行，执行预定终止草案', 'V_FINAL_ROUTE');
            return {choice: {id: 'FINAL', text: '第365天 · 执行已准备的行动', options}};
        }
    });
    for (const [id, title, text, next, flags] of [['V_LOOP_CONFIRM', '走入循环模块', '当前身体将进入资源循环。当前个体的独立未来不会转交给下一具身体。', 'V_END_ROUTE', {}], ['V_COPY_CONFIRM', '确认数字复制的边界', '复制会创建数字模型，不会把当前意识搬入服务器。当前肉身仍将死亡。', 'V_END_ROUTE', {}], ['V_BLAST_CONFIRM', '读完日志后的第二次确认', '最高日志确认：广寒子执行人类规则，没有背叛。引爆将同时毁去仍存在的数字人格和未传出记录。', 'V_END_ROUTE', {detonation_confirmed: true}]]) {
        add(id, title, id === 'V_LOOP_CONFIRM' ? point('B05', 800, 550) : core, [G(text)], null);
        opts(id, id, [['confirm', '确认执行', next, flags], ['back', '返回最终行动', 'V_FINAL']]);
    }
    add('V_FINAL_ROUTE', '核对执行路径', null, [], 'F_AUTH', {prepare: s => ({next: s.choices.FINAL === 'F-A' && MoonEndings.auth(s) && !(s.choices.C09 === 'C09B' && !s.flags.auth_restored) ? 'F_AUTH' : s.choices.FINAL === 'F-F' ? 'V_DIGITAL_LOAD' : s.choices.C13 === 'C13D' && s.choices.C14 === 'C14A' ? 'V_BOARD_NAME' : 'V_END_ROUTE'})});
    n.F_AUTH.queue = [G('核验本轮申请实际采用的认证来源。')];
    n.F_IDENTITY.queue = [G('申请主体、当前生物权限与原件逐项比对。')];
    n.F_EXECUTE.prepare = s => ({
        queue: [G((MoonEndings.auth(s) || '') + '认证有效。广寒宫计划终止。保留撤离生命支持。')],
        effects: {flags: {plan_terminated: true}, evidence: ['F_TERMINATED']}
    });
    n.F_WAIT.next = 'V_AFTER_STOP';
    add('V_AFTER_STOP', '按家庭清单继续', null, [], 'F_GET_CORE', {prepare: s => ({next: s.flags.azhi_statement === 'close' ? 'V_LAST_HOME' : MoonEndings.resolve(s).id === 'first_departure' ? 'F_GET_CORE' : s.choices.C13 === 'C13D' ? 'V_BOARD_NAME' : ['joint_signature', 'evacuation', 'cold_goodbye'].includes(MoonEndings.resolve(s).id) ? 'F_OXYGEN' : 'V_END_ROUTE'})});
    add('V_LAST_HOME', '最后一次进入家庭', P.desk, [S('项目已有效终止。家庭支持协议不再会被下一班重新调用。')], 'V_LAST_NIGHT', {
        warpNext: {
            map: 'F01',
            x: 755.4,
            y: 743.7
        }
    });
    add('V_LAST_NIGHT', '完成答应她的普通夜晚', home, [A('不要把今天叫作回家。你只是来把答应我的事做完。'), L('xing8', '爸爸明天回来吗？')], null);
    opts('V_LAST_NIGHT', 'GOODNIGHT_REPLY', [['no', '不会了。', 'V_EXIT_HOME'], ['unknown', '我不知道。', 'V_EXIT_HOME'], ['sleep', '睡吧。', 'V_EXIT_HOME']]);
    add('V_EXIT_HOME', '退出家庭，回到真实服务器', MoonDay3.exit, [S('你退出了家庭。停止操作必须在现实的人格数据库执行。')], 'V_STOP_AZHI', {
        warpNext: {
            map: 'R03',
            x: 860,
            y: 480
        }
    });
    add('V_STOP_AZHI', '停止阿芷主动进程', db, [A('执行吧。'), S('AZHI-MODEL：停止主动进程。')], 'V_STOP_CHILD', {effects: {flags: {azhi_closed: true}}});
    add('V_STOP_CHILD', '停止儿童循环调用', db, [S('XING-8：停止循环调用。厨房环境音停止。')], 'V_STOP_BACKUP', {
        effects: {
            flags: {child_closed: true},
            family_state: 'closed'
        }
    });
    add('V_STOP_BACKUP', '核对备份状态', db, [], 'F_OXYGEN', {prepare: s => ({queue: [S(s.flags.cold_backup ? '冷备份仍存在：可恢复。' : '未创建冷备份。不可用恢复快照撤销。'), G('生命支持维持。请完成最后一次供氧检查，等待救援窗口。')]})});
    add('V_DIGITAL_LOAD', '装载无人补给船数据舱', point('R08', 900, 560), [G('独立数字载荷与声明已装载。舱位不支持生物乘员。'), S('预定终止草案执行，培养激活队列关闭。')], 'V_END_ROUTE', {
        effects: {
            flags: {
                plan_terminated: true,
                cycle_stopped: true
            }
        }
    });
    add('V_BOARD_NAME', '登船时确认乘员记录', point('R08', 900, 560), [L('rescue', '生物连续性已确认。姓名栏还要留空吗？')], null);
    opts('V_BOARD_NAME', 'BOARD_NAME', [['blank', '保留空白，以连续记录确认乘员', 'V_END_ROUTE', {refuse_name: true}], ['number', '使用 WUKANG-17', 'V_END_ROUTE', {
        refuse_name: false,
        player_name: 'WUKANG-17'
    }]]);
    n.F_RESCUE.prepare = s => ({
        queue: [L('rescue', '一名生物乘员，连续记录核验通过。'), S(s.flags.azhi_closed ? '没有家庭人格的外部启动请求。' : s.flags.azhi_loaded ? '独立数字乘员与本人声明已接收。' : '资料与人格处置按独立清单接收。')],
        next: MoonEndings.resolve(s).id === 'first_departure' ? 'F_EARTH' : 'V_END_ROUTE',
        effects: {flags: {rescued: true}}
    });
    n.F_AZHI_BOOT.next = 'V_END_ROUTE';
    n.F_AZHI_BOOT.effects = {};
    add('V_END_ROUTE', '结局记录', null, [], 'GAME_COMPLETE', {
        prepare: s => {
            const result = MoonEndings.resolve(s), e = MoonEndings.entries[result.id];
            return {
                queue: [S(e.intro), S(e.text), ...result.overlays.flatMap(id => [S(MoonEndings.entries[id].intro), S(MoonEndings.entries[id].text)])],
                effects: {
                    chapter: 7,
                    chapterComplete: true,
                    flags: {
                        game_complete: true,
                        ending: result.id,
                        ending_auth: result.auth || '',
                        ending_overlays: result.overlays.join(',')
                    },
                    evidence: [evidence('ENDING_' + result.id, e.title, e.intro + '\n' + e.text)]
                }
            };
        }
    });
    n.DREAM_END = {...n.V_END_ROUTE, id: 'DREAM_END', title: '第十八次值班：无梦休眠'};
    for (const o of n.K_CHOICE.choice.options) o.effects.node = 'V_CONTROL_APPLIED';
    add('V_CONTROL_APPLIED', '核对控制方式', null, [], 'K_POWER', {
        prepare: s => ({
            queue: [G({
                C09A: '只读请求已建立。核心与生命支持按原权限运行。',
                C09B: '门禁与认证权限已隔离。生命支持保留。终止前需要决定是否恢复见证模块。',
                C09C: '16号程序已接到旁路。它只能回答一次本地检查，不能生成缺失的地球签名。',
                C09D: '起爆线路进入待命。备用供电被占用。读完最高日志之后仍须第二次确认。'
            }[s.choices.C09])]
        })
    });
    const signTexts = [['前代独立声明', 'WUKANG-08：停止制造下一具身体。WUKANG-11：我不承认任务，但承认它造成了我。'], ['档案人格声明', 'ARCHIVE-WUKANG：我不能代表原武康。我只确认自己的来源与权限图。'], ['阿芷声明', 'AZHI-MODEL：停止以我的名字维持继任体。完成后拆除家庭环境。'], ['当前个体声明', 'CURRENT OPERATOR：这些签名来自不同的受影响主体。XING-8不作完整知情签署，儿童模型的月亮积木只作附件。']];
    signTexts.forEach(([title, text], i) => add('V_SIGN_' + i, title, core, [S(text)], i === 3 ? 'E_SUBMIT' : 'V_SIGN_' + (i + 1), {effects: {evidence: [evidence('V_SIGN_' + i, title, text)]}}));
    const applicant = n.V_APPLICANT.prepare;
    n.V_APPLICANT.prepare = s => {
        const d = applicant(s);
        for (const o of d.choice.options) if (o.id === 'C15B') o.effects.node = 'V_SIGN_0';
        return d;
    };
    MoonCampaign.Controller.prototype.commit = function (def, result = null) {
        const s = this.story.state;
        if (def.prepare) def = {...def, ...def.prepare(s)};
        recordChoice(def);
        const queue = result ? [...(result.success ? def.success || [] : def.failure || [])] : [...(def.queue || [])];
        if (def.illustration && queue.length) queue[0] = {...queue[0], illustration: def.illustration};
        if (def.unskippableWait) queue.forEach(v => {
            if (v.type === 'wait') v.unskippable = true;
        });
        if (def.choice) queue.push({type: 'choice', ...def.choice});
        const effects = {
            completedTasks: [def.id],
            checkpointId: def.id, ...def.effects,
            flags: {...def.effects?.flags}
        };
        delete effects.mental_value;
        if (def.next) effects.node = def.next;
        if (result && !s.flags['settled_' + def.id]) {
            effects.flags['settled_' + def.id] = true;
            const piano = def.game.startsWith('piano');
            let delta = piano ? (result.success && !s.flags.piano_recovered ? 10 : 0) : result.success ? 0 : -(def.penalty === 20 || def.finalOxygen ? 20 : 10);
            effects.mental_value = Math.max(0, Math.min(100, s.mental_value + delta));
            effects.minigameResults = {[def.id]: result};
            if (piano && result.success) {
                effects.flags.piano_recovered = true;
                if (def.id === 'H05_TRAIN') effects.flags.piano_success_1 = true;
                if (def.id === 'H05_PIANO') effects.flags.piano_success_2 = true;
            }
            if (def.game === 'piano') effects.piano_clear = result.success;
            if (effects.mental_value === 0) {
                queue.length = 0;
                effects.node = 'DREAM_END';
                effects.chapterComplete = false;
                effects.flags.plan_terminated = false;
                effects.flags.cycle_stopped = false;
            }
        }
        return this.story.run({
            id: def.choice ? 'v5_choice_' + def.id : 'campaign_' + def.id,
            once: !def.choice,
            requires: {node: def.id},
            queue,
            effects
        });
    };
    window.addEventListener('moon:progress-changed', e => {
        const s = e.detail;
        if (s.flags.game_complete && MoonEndings.entries[s.flags.ending]) MoonEndings.unlock([s.flags.ending, ...(s.flags.ending_overlays || '').split(',').filter(Boolean)]);
    });
    for (const d of Object.values(n)) recordChoice(d);
    const run = MoonStory.prototype.run;
    MoonStory.prototype.run = function (event) {
        if (event?.effects?.minigameResults && !String(event.id).startsWith('campaign_')) {
            const s = this.state,
                results = Object.entries(event.effects.minigameResults).filter(([id]) => !s.flags['settled_' + id]);
            if (results.length) {
                const effects = {...event.effects, flags: {...event.effects.flags}},
                    delta = results.reduce((v, [id, result]) => {
                        effects.flags['settled_' + id] = true;
                        return v + (result.success ? 0 : -10);
                    }, 0);
                effects.mental_value = Math.max(0, s.mental_value + delta);
                event = {...event, effects};
                if (!effects.mental_value) {
                    event.queue = [];
                    effects.node = 'DREAM_END';
                    effects.chapterComplete = false;
                }
            }
        }
        return run.call(this, event);
    };
    Object.assign(MoonLater.chapters[2], {summary: '身体编号与记忆来源已经分开核验。当前身份处理方式已记录。'});
    Object.assign(MoonLater.chapters[4], {summary: '最高日志说明了规则的来源。接下来核对能够用于终止的实际材料。'});
    Object.assign(MoonLater.chapters[5], {summary: '两个通信窗口的处理结果已保存。回执、救援确认和授权文件分别记录。'});
    Object.assign(MoonLater.chapters[6], {summary: '申请与家庭处理计划已记录。最后一天将执行已准备的行动。'});
    MoonEvidence.entries.T_REQUIREMENTS.text = '必须有可验证的终止来源与申请资格。U1当前操作员、U2地球新授权、U3受影响主体、U4旧意图确认是不同认证路径。';
    MoonEvidence.entries.T_RECEIPT.title = '第一通信窗口回执';
    MoonEvidence.entries.T_RECEIPT.text = s => '发送类别：' + (s.choices.C12 || '旧存档未记载') + '。接收只证明资料进入对应部门；载人安排以救援确认记录为准。';
    MoonEvidence.entries.E_TERMINATION_DRAFT.text = s => '本轮申请主体：' + (s.choices.C15 || '旧存档未记载') + '。认证路径：' + (MoonEndings.auth(s, true) || '未形成有效认证') + '。执行仍需第365天确认。';
    MoonEvidence.entries.T_CONTINUITY.text = '当前身体从唤醒至今的连续生命日志，与本轮可用的档案结构旁证分栏保存。';
    globalThis.MoonBranches = {version: 5};
})();