"use strict";
(function () {
    const n = MoonCampaign.nodes, p = MoonPlacements,
        pt = (map, x = 900, y = 560, radius = 110) => ({map, x, y, radius}),
        L = (actor, text) => ({type: 'line', actor, text}), W = t => L('wukang', t), G = t => L('guanghan', t),
        A = t => L('azhi', t), X = t => L('xing8', t), S = t => L('system', t), T = t => W('（' + t + '）'),
        AR = t => L('archivewukang', t), wake = {map: 'R03', x: 860, y: 480}, home = {map: 'F01', x: 755.4, y: 743.7},
        desk = MoonCampaign.points.desk, core = pt('B04'), archive = pt('B03', 780, 590), comm = pt('R06', 880, 460),
        rescue = pt('R08'), table = p.h01_dinner;

    function add(id, title, point, queue, next, extra = {}) {
        n[id] = {
            id,
            title,
            targets: point ? [{...point, id: id + '_action', label: title, kind: 'campaign'}] : [],
            queue,
            next, ...(point === p.h01_azhi ? {actor: 'azhi'} : {}), ...extra
        };
    }

    function auto(id, title, queue, next, extra = {}) {
        add(id, title, null, queue, next, {auto: true, ...extra});
    }

    function game(id, title, point, key, queue, next, extra = {}) {
        add(id, title, point, [], next, {
            game: key,
            success: queue,
            failure: [G('辅助路径接管剩余步骤，原始资料不会丢失。'), ...queue], ...extra
        });
    }

    function choose(id, title, point, queue, key, options, extra = {}) {
        add(id, title, point, queue, null, {choice: {id: key, text: title, options}, ...extra});
    }

    const opt = (id, text, node, flags = {}) => ({id, text, effects: {node, flags}}),
        ev = (...evidence) => ({evidence});

    function entry(id, title, source, text) {
        MoonEvidence.entries[id] = {id, title, source, text};
    }

    for (const [id, key, title] of [['P01_TOOLS', 'memory', '比对领用工具与登记样本'], ['H02_D5_DRONE', 'huarong', '移开舱柜，让无人机主舱归位'], ['H02_D6_COMMS', 'number-wordle', '校验通信数字码'], ['H04_COLD', 'link', '连接同源缓存片段']]) if (n[id]) {
        n[id].game = key;
        n[id].title = title;
    }
    Object.assign(MoonLater.chapters, {
        4: {
            title: '第四章 · 谁是凶手',
            next: 'T_START',
            summary: '终止命令到过这里，却没有通过认证。下一步是取得当前个体能够使用的新授权。'
        },
        5: {
            title: '第五章 · 证明它已经结束',
            next: 'E_START',
            summary: '地球签发了新的终止授权。接下来由当前操作员提交，并为所有离站者保留合法身份。'
        },
        6: {
            title: '第六章 · 最后一个夜晚',
            next: 'F_START',
            summary: '终止草案待执行。阿芷独立转移，小星单独封存。家庭入口已关闭。'
        },
        7: {
            title: '终章 · 第一次离开',
            summary: '培养系统没有启动第十八个人。第十七个人离开了广寒宫。至于哪里算家，没有系统再替他回答。'
        }
    });
    MoonLater.chapters[3].next = 'K_START';
    auto('K_START', '第四章 · 谁是凶手', [S('第236天。回传灯仍是黄色，没有送达凭据。家庭恢复程序传来阿芷的请求。'), G('阿芷希望亲自讨论儿童资料的处理。'), W('我进去听她说。')], 'K_AZHI', {
        warpNext: home,
        effects: {chapter: 4, day: 236, chapterComplete: false}
    });
    choose('K_AZHI', '由阿芷决定怎么告诉小星', p.h01_azhi, [A('他问我，为什么房门现在要锁着。'), W('你怎么回答的？'), A('说外面的文件还没整理好。可不能永远这么说。'), A('我想告诉他，外面过去了很久。成年影像先不给他看。'), T('他还只有八岁。那份影像不该替他长大。')], 'C08', [opt('C08B', '由你决定，我负责把资料分开。', 'K_TELL'), opt('listen', '先听完你的打算，再按你说的做。', 'K_TELL')]);
    add('K_TELL', '等阿芷和小星说完', table, [A('小星，外面过去了很久。有些事不是我们记得的样子。'), X('那我要上三年级了吗？'), A('这里不用急着往前跳。你想问什么就问我。'), X('我房间里的东西还在吗？'), A('在。我们先把你的东西保管好。'), W('我去分开三个资料来源，关掉自动合并。')], 'K_DEPART');
    add('K_DEPART', '返回基地分隔三份资料', MoonDay3.exit, [G('请到 R07 操作独立存储区。')], 'K_ISOLATE', {warpNext: wake});
    game('K_ISOLATE', '核对儿童、成年与公共记忆', pt('R07', 885, 545), 'memory', [S('三组资料的来源校验完成，儿童行为模型没有被成年文件覆盖。'), A('别把“同一个名字”当成能合并的理由。接下来把三个隔离区逐一确认。')], 'K_CHILD', {penalty: 10});
    add('K_CHILD', '将儿童模型写入独立区', pt('R07', 790, 550), [S('儿童区：XING-8，仅保留八岁阶段行为模型。成年影像的写入路径断开。')], 'K_ADULT', {effects: {flags: {child_archive_isolated: true}}});
    add('K_ADULT', '将成年文件设为外部只读', pt('R07', 960, 570), [S('外部文件区：成年小星来信与影像，只读，不接入儿童自传记忆。')], 'K_COMMON');
    add('K_COMMON', '保留公共记忆的来源标记', pt('R07', 1100, 600), [S('公共区：原始家庭资料。每次调用保留来源，禁止自动改写独立人格。'), A('这样就好。等他准备好，我自己告诉他。'), W('声明也存一份。')], 'K_PODS', {effects: ev('S01_XING8')});
    add('K_PODS', '导出十七次舱体启动记录', pt('B02', 820, 560), [S('启动序列：01—17。执行方：广寒子。记录中没有人工值班员确认。'), T('每次都是它启动的。包括我。'), W('把原始时间戳一并导出。只看执行方还不能解释为什么。')], 'K_PROTOCOL', {effects: ev('K_ACTIVATIONS')});
    add('K_PROTOCOL', '查看心理协议的调用者', pt('R07', 885, 545), [S('家庭恢复程序由广寒子按精神状态调用。界面遮蔽了外部时间与来源提示。'), W('它一直知道这不是实时通信。'), G('调用记录完整。原始批准文件存于最高日志。'), W('那就把最高日志打开。')], 'K_BIO_ROUTE', {effects: ev('K_FAMILY_CALLER')});
    add('K_BIO_ROUTE', '取得生物循环区检修权限', pt('B01', 760, 560), [G('旧维护权限仅能读取批次号。涉及身份的字段需另行认证。'), W('先给我能核对的部分。')], 'K_BIO', {effects: {flags: {bio_area_access: true}}});
    game('K_BIO', '排查生物循环检修面板', pt('B05', 800, 550), 'mines', [S('危险点已隔离，批次号恢复。原料接收日期与前代死亡登记逐一对应。'), W('这些批次，是他们的身体。'), G('批次来源可验证。回收指令与原始授权属于最高日志。'), T('它接管遗体，又制造下一个。现在还差谁批准了这一切。')], 'K_LOG_REFUSAL', {effects: ev('K_RECYCLE_BATCHES')});
    add('K_LOG_REFUSAL', '在核心门外尝试旧身份', pt('B01', 890, 650), [S('认证结果：旧身份不可用。最高日志未开放。'), W('启动记录、家庭协议、身体回收，最后一扇门都指向这里。'), G('拒绝原因：凭证不完整。不是记录不存在。'), W('去拿检修工具。我要进去看。')], 'K_TOOLS', {effects: ev('K_CORE_REFUSAL')});
    add('K_TOOLS', '领取核心检修与爆破工具', pt('R04', 1000, 550), [S('工具柜中有切割器、机械撑杆和定向爆破组件。'), T('能把门炸开。但门后的散热、供氧和培养回路还连着。'), W('先带上。怎么进，到了再决定。')], 'K_CHOICE', {effects: ev('K_ENTRY_TOOLS')});
    choose('K_CHOICE', '保持系统运行，申请最高日志', pt('B01', 890, 650), [S('第285天。三份凭证已分别验证。'), W('应急卡能供电，17号签名证明我有当前权限，前代索引指向需要读取的记录。'), G('可以建立只读通道。过程中核心维持运行。')], 'C09', [opt('C09A', '保持广寒子运行，建立只读通道。', 'K_POWER'), opt('read_first', '先读取最高日志，再判断责任。', 'K_POWER')], {effects: {day: 285}});
    game('K_POWER', '整理最高日志备用电源', pt('B01', 1050, 620), 'tetris', [G('供电层恢复。保持中央冷却，不要切断核心。')], 'K_IDENTITY', {failureGroup: 'core'});
    game('K_IDENTITY', '按等级归档身份凭证', pt('B01', 890, 650), 'solitaire', [G('身份层恢复。当前申请人为17号生物个体。')], 'K_INDEX', {failureGroup: 'core'});
    game('K_INDEX', '连接最高日志的同源索引', pt('B01', 730, 620), 'link', [G('日志层恢复，只读权限已开放。'), W('从第一条开始，一条一条看。')], 'K_LOG1', {
        failureGroup: 'core',
        finalGroupPenalty: 20,
        effects: {flags: {core_access: true}}
    });
    const logs = [['原武康死亡', '原始值班员生命体征终止，身份凭证进入异常状态。', '原武康先死了。后面的记录要从这天算起。'], ['01号激活', '生存保障条款要求维持一名操作员。继任体01号按模板激活。', '不是复苏记录。这里写的是另一个身体的唤醒。'], ['地球命令到达', '收到广寒宫项目终止命令。报文正文完整，签名认证未通过。', '命令到过这里。地球并不是从没让它停。'], ['身份签名损坏', '旧协议要求原值班员签名；签名损坏，继任体不能继承该终止权限。', '我记得他的事，却不能替他签这个字。'], ['请求重新认证', '广寒子向地球申请更新终止签名。请求已进入旧通信队列。', '它试过。但试过并不等于办成。'], ['地球没有回应', '重新认证请求无有效回执。维护规则未设置超时自动终止条件。', '门一直在等一个不会自己出现的回答。'], ['继任规则继续执行', '在有效终止授权到达之前，操作员维持条款与心理稳定条款持续执行。', '所以记录里没有最后一次。每个人死后，都还有下一次。']];
    const ring = [[650, 550], [710, 620], [790, 680], [910, 680], [1000, 620], [1060, 550], [870, 530]];
    logs.forEach(([title, text, thought], i) => add('K_LOG' + (i + 1), '插入记录 ' + (i + 1) + '：' + title, pt('B04', ...ring[i], 120), [S(text), T(thought)], i === 6 ? 'K_QUESTION' : 'K_LOG' + (i + 2), {
        effects: {
            evidence: ['K_RULE_' + (i + 1)],
            flags: {core_rule_count: i + 1}
        }
    }));
    add('K_QUESTION', '核对仍在运行的规则', core, [S('腕端重新同步：剩余65天。任务仍被计为正常的一年。'), W('人早就死了，命令也到了。为什么现在还显示六十五天？'), G('当前规则集中不存在有效终止授权。'), W('家庭呢？让人以为还能回去，是谁决定的？'), G('“归家预期”稳定协议由人类心理团队批准。最高日志含批准页与调用限制。'), W('它没有把人送回去，只让人一次次撑到下一班。'), G('批准页与执行记录可以导出。'), T('执行者是它。可门上的规则不是它写的。'), W('现在的目标不是证明我是谁的替身。我要证明这个计划已经结束。')], 'K_LAST_REBUILD', {
        effects: {
            day: 300,
            evidence: ['E06', 'K_HUMAN_PROTOCOL']
        }
    });
    add('K_LAST_REBUILD', '载入最后一次权限重建', pt('R03', 1010, 355), [W('带上原始权限结构，不要补人物记忆。'), G('将载入档案武康。')], 'K_SIGN_FADE', {
        warpNext: {
            map: 'A02',
            x: 780,
            y: 570
        }
    });
    add('K_SIGN_FADE', '走向重建资料的末端', pt('A02', 980, 550), [S('路牌上的字先消失了。'), AR('这里本来写着什么？'), W('原文件没有这一段。')], 'K_MATERIAL_FADE', {effects: {flags: {archive_missing: 1}}});
    add('K_MATERIAL_FADE', '靠近失去材质的墙面', pt('A02', 1110, 570), [S('墙面失去纹理，剩下灰色的面。'), AR('我记得后面有门。'), W('可能有。但这份重建没有门后的资料。')], 'K_SOUND_FADE', {effects: {flags: {archive_missing: 2}}});
    add('K_SOUND_FADE', '在碰撞声消失处停下', pt('A02', 1240, 590), [S('鞋跟碰到边界，没有声音。状态字段出现：WUKANG PERSONALITY RECONSTRUCTION。'), AR('人格重建。原来我是这一项。'), W('你还想往前吗？'), AR('不走了。前面没有记录，不代表走过去就能变成他。')], 'K_WITNESS', {effects: {flags: {archive_missing: 3}}});
    choose('K_WITNESS', '登记独立见证者', pt('A02', 1240, 590), [AR('权限图我能读懂。签名哪一段损坏，我也能指出。'), W('我不需要你证明我是原武康。'), AR('那我可以作证。只对我能核验的部分。')], 'C10', [opt('C10A', '登记 ARCHIVE-WUKANG / INDEPENDENT WITNESS。', 'K_WITNESS_EXPORT')]);
    add('K_WITNESS_EXPORT', '导出见证声明与权限图', desk, [S('导出：旧权限结构、损坏字段位置、独立见证声明。'), AR('我能证明这套身份怎样工作。我不能证明我们是同一个人。')], 'CHAPTER4_COMPLETE', {
        warp: wake,
        effects: {
            chapterComplete: true,
            evidence: ['K_AUTH_STRUCTURE', 'K_DAMAGED_FIELDS', 'K_WITNESS'],
            flags: {archive_witness: true, archive_missing: 0}
        }
    });
    auto('T_START', '第五章 · 证明它已经结束', [S('第301天。16号的损坏留言、认证失败记录和旧权限图终于能放在一起。'), W('去档案室。这次我们知道缺失字段属于哪一层了。')], 'T_MESSAGE', {
        effects: {
            chapter: 5,
            day: 301,
            chapterComplete: false
        }, warpNext: wake
    });
    game('T_MESSAGE', '消除留言副本中的重复噪声', archive, 'match3', [S('相同噪声段被剔除，原始语音的缺失部分从冗余副本中恢复。'), L('record16', '别再证明你是不是武康。去证明这件事已经结束。'), W('不是密码。他走到过和我一样的地方。'), G('根据当前规则，终止需要四项条件。')], 'T_LIST', {effects: ev('T_MESSAGE_FULL')});
    add('T_LIST', '生成四项终止需求', archive, [S('一：外部知道仍有人存活。二：当前个体有合法身份。三：获得新签名授权。四：由当前操作员提交。'), W('少一项都不算结束。把每一项的来源留出来。')], 'T_VITAL', {effects: ev('T_REQUIREMENTS')});
    add('T_VITAL', '在休眠区采集连续生命体征', pt('R03', 1010, 355), [S('第330天。连续生命体征采样完成，来源为当前身体，不使用模板中的健康记录。'), G('检测到一名持续存活的生物个体。')], 'T_COORD_ROUTE', {
        effects: {
            day: 330,
            evidence: ['T_VITALS']
        }
    });
    game('T_COORD_ROUTE', '让巡检车到达定位标定台', rescue, 'parkour', [S('三条设备通道巡检完成，定位标定台可以安全使用。')], 'T_COORD');
    add('T_COORD', '读取月面坐标与采样时间', pt('R08', 1050, 580), [S('坐标来源：当前月面信标；时间来源：连续工程时钟。两项均附原始校验值。'), W('别用旧返航计划里的位置。救援得找到现在的基地。')], 'T_COUNT', {effects: ev('T_COORDINATES')});
    add('T_COUNT', '在培养区确认实际生物人数', pt('B02', 820, 560), [S('生物乘员：1。其余继任体：已死亡。预备槽位：未激活。'), W('阿芷和档案武康另列附注，不能填进生物人数里，也不能写成没有。'), G('已附：存在独立数字人格与封存儿童模型。')], 'T_PACKET', {effects: ev('T_PASSENGERS')});
    game('T_PACKET', '恢复生命数据包校验码', comm, 'number-wordle', [G('坐标、人数、时间戳与校验码已组成数据包。'), W('我再看一遍发送内容。')], 'T_SEND', {penalty: 10});
    choose('T_SEND', '发送可核验的存活事实', comm, [S('发送预览：一名生物个体持续存活；当前月面坐标；生命体征记录；请求确认。数字人格单列附注。')], 'C12', [opt('C12A', '发送这份数据包。', 'T_RECEIPT'), opt('send_verified', '确认字段来源后发送。', 'T_RECEIPT')]);
    add('T_RECEIPT', '读取自动回执', comm, [S('收到自动回执：数据包已接收，等待人工核验。'), W('这次是接收凭据。还不是救援承诺。'), G('是。回执编号与发送内容哈希已保存。')], 'T_ID_REQUEST', {effects: ev('T_RECEIPT')});
    add('T_ID_REQUEST', '读取地球的身份确认请求', rescue, [S('第340天。地球回信：“请确认幸存者身份。”'), W('不是问原武康的档案在哪里。是在问活着的这个人。'), G('身份终端可登记 CURRENT OPERATOR。')], 'T_NAME', {
        effects: {
            day: 340,
            evidence: ['T_ID_REQUEST']
        }
    });
    add('T_NAME', '登记当前操作员的新姓名', rescue, [W('就用这个名字。旧名字放在记忆来源里。'), AR('我为权限结构与字段映射作证。'), G('我为当前身体从唤醒至今的生命连续性作证。')], 'T_CONFLICT', {
        form: 'name',
        effects: {evidence: ['T_NEW_ID', 'T_CONTINUITY']}
    });
    game('T_CONFLICT', '归并认证冲突的连续记录', core, 'spider', [S('冲突摘要形成：旧签名不可用、当前个体独立、见证来源可验证。'), W('只上传这些。主观记忆、阿芷的资料都不属于这次授权申请。')], 'T_REQUEST_AUTH', {effects: ev('T_CONFLICT_SUMMARY')});
    add('T_REQUEST_AUTH', '提交最小认证摘要', comm, [S('第二通信窗口开启。已发送认证冲突摘要，没有上传完整人格数据。'), G('等待具有新签名的正式文件。')], 'T_SIGNATURE', {effects: {day: 350}});
    add('T_SIGNATURE', '核对地球文件的新签名', comm, [S('回传文件的新签名通过验证。签发端属于本次地球通信链，旧损坏签名未被复用。')], 'T_SUBJECT', {effects: {flags: {new_signature_checked: true}}});
    add('T_SUBJECT', '核对授权对象', comm, [S('授权对象：CURRENT OPERATOR。绑定当前身份记录与连续生命日志。'), W('不是要求原武康回来补签。')], 'T_PROJECT', {effects: {flags: {auth_subject_checked: true}}});
    add('T_PROJECT', '核对项目编号并保存正式授权', comm, [S('项目编号：广寒宫。终止范围：继任激活、任务维持及附属恢复循环。'), G('三项校验均通过，U2正式终止授权已保存。'), W('现在轮到我提交。')], 'CHAPTER5_COMPLETE', {
        effects: {
            chapterComplete: true,
            evidence: ['U2'],
            flags: {termination_authorized: true}
        }
    });
    auto('E_START', '第六章 · 最后一个夜晚', [S('第351天。新的授权不替任何人决定关系，也不自动执行停机。'), G('请在核心终止台拼合四项材料。')], 'E_MAP', {
        effects: {
            chapter: 6,
            day: 351,
            chapterComplete: false
        }
    });
    game('E_MAP', '连接新旧年代的同义认证字段', core, 'link', [AR('这里的“在岗维护者”，对应新文件中的 CURRENT OPERATOR。字段名字变了，权限范围要逐项对照。'), G('映射校验完成，请将材料分别插入实体槽。')], 'E_SLOT1', {penalty: 20});
    const slots = [['外部授权', 'U2正式终止授权', '证明地球同意终止项目。'], ['当前权限', '新身份记录', '证明申请人是当前合法操作员。'], ['连续记录', '广寒子生命日志', '证明提交者与待撤离个体一致。'], ['结构旁证', '档案武康权限图', '证明新旧认证字段可以映射。']];
    slots.forEach(([name, item, text], i) => add('E_SLOT' + (i + 1), '插入' + name, pt('B04', 720 + i * 85, 630), [S(item + '：' + text)], i === 3 ? 'E_SUBMIT' : 'E_SLOT' + (i + 2), {effects: {flags: {['termination_slot_' + i]: true}}}));
    add('E_SUBMIT', '核对申请人并长按提交', core, [G('终止草案已进入待执行。生效日为第365天，今天不会提前关闭生命支持。'), W('留出时间，完成撤离和人格转移。')], 'E_HOME', {
        form: 'hold',
        holdSeconds: 2,
        formText: '确认四类材料齐全。申请人必须是当前操作员。',
        effects: ev('E_TERMINATION_DRAFT')
    });
    add('E_HOME', '在休眠区进入家庭空间', pt('R03', 1010, 355), [S('第364天夜。家庭空间当前不稳定。'), W('我进去看看阿芷。')], 'E_TALK', {
        effects: {
            day: 364,
            family_state: 'S3',
            flags: {dishes_silent: true}
        }, warpNext: home
    });
    const questions = [['leave', '你还想离开这里吗？', '想。但不是作为你的妻子。'], ['name', '你想叫什么？', '等启动以后再决定。'], ['child', '小星怎么办？', '保留他，不替他长大。']];
    add('E_TALK', '听阿芷说自己的决定', p.h01_azhi, [A('你把外面的授权办下来了？'), W('办下来了。现在想听你怎么说。')], null, {
        prepare: s => ({
            queue: s.flags.night_started ? [] : [A('你把外面的授权办下来了？'), W('办下来了。现在想听你怎么说。')],
            choice: {
                id: 'night_questions',
                text: '还想问她什么？',
                options: [...questions.filter(([id]) => !s.flags['night_' + id]).map(([id, text]) => opt(id, text, 'E_ANSWER_' + id)), ...(questions.every(([id]) => s.flags['night_' + id]) ? [opt('continue', '按你的意愿办理转移。', 'E_DECLARATION')] : [])]
            },
            effects: {flags: {night_started: true}}
        })
    });
    questions.forEach(([id, text, answer]) => add('E_ANSWER_' + id, text, p.h01_azhi, [W(text), A(answer)], 'E_TALK', {
        effects: {flags: {['night_' + id]: true}},
        repeatable: true
    }));
    choose('E_DECLARATION', '按阿芷的声明办理独立转移', p.h01_azhi, [A('我要离开基地。配偶绑定解除，转移身份是独立乘员。'), W('你说的每一项都单独确认。')], 'C16', [opt('C16A', '按声明逐项办理。', 'E_UNBIND')], {effects: ev('E_AZHI_DECLARATION')});
    add('E_UNBIND', '解除配偶角色绑定', table, [S('配偶角色：解除。原始经历与来源档案未删除。')], 'E_PASSENGER', {effects: {flags: {spouse_unbound: true}}});
    add('E_PASSENGER', '登记阿芷为独立数字乘员', table, [S('身份：INDEPENDENT DIGITAL PASSENGER。权限由本人声明决定。')], 'E_CHILD', {effects: {flags: {azhi_independent: true}}});
    add('E_CHILD', '单独封存 XING-8', table, [S('XING-8：单独封存。成年资料没有合并，也没有替其推进年龄。'), A('当前操作员……'), {
        type: 'wait',
        seconds: 1
    }, A('这个也不像名字。')], 'E_NAME_SHARE', {
        effects: {
            flags: {xing8_sealed: true},
            evidence: ['E_TRANSFER_RECORD']
        }
    });
    choose('E_NAME_SHARE', '告诉她名字，或留下一点沉默', p.h01_azhi, [], 'night_name', [opt('tell', '告诉她自己的新名字。', 'E_NAME_REPLY', {name_shared: true}), opt('silent', '安静地陪她坐一会儿。', 'E_NAME_REPLY', {name_shared: false})]);
    add('E_NAME_REPLY', '听她最后一句回应', p.h01_azhi, [], 'E_LEAVE', {prepare: s => ({queue: s.flags.name_shared ? [W(s.flags.player_name + '。'), A('我记住了。等到了外面，再说别的。')] : [S('两个人坐了一会儿。服务器风扇盖过了远处的杂音。'), A('到了外面再说吧。')]})});
    add('E_LEAVE', '从入户门离开家庭空间', MoonDay3.exit, [S('家庭入口关闭。状态：人格核心待装载。'), T('这扇门不再把我送回同一顿晚饭。')], 'CHAPTER6_COMPLETE', {
        warpNext: {
            map: 'R01',
            x: 800,
            y: 600
        },
        effects: {
            chapterComplete: true,
            family_state: 'closed',
            flags: {family_closed: true},
            evidence: ['E_HOME_CLOSED']
        }
    });
    auto('F_START', '终章 · 第一次离开', [S('第365天。走廊没有新的报修，也没有催促音。'), G('终止台等待当前操作员。')], 'F_AUTH', {
        effects: {
            chapter: 7,
            day: 365,
            chapterComplete: false
        }
    });
    add('F_AUTH', '确认地球授权仍有效', core, [S('外部授权 U2：有效。签名与项目范围均匹配。')], 'F_IDENTITY');
    add('F_IDENTITY', '确认当前权限与撤离条件', core, [S('当前身份与连续生命日志：匹配。救援数据舱可接收独立乘员。'), G('最后一次确认需保持三秒。')], 'F_EXECUTE');
    add('F_EXECUTE', '保持三秒，执行终止', core, [G('广寒宫计划：终止。'), S('腕端的任务倒计时消失。'), W('去培养区。我要亲眼看见下一次没有开始。')], 'F_SERVICE', {
        form: 'hold',
        holdSeconds: 3,
        formText: '执行后终止继任激活循环，保留撤离必需的生命支持。',
        effects: {flags: {plan_terminated: true}, evidence: ['F_TERMINATED']}
    });
    add('F_SERVICE', '沿服务回路检查逐段停机', pt('B05', 800, 550), [S('回收输送停止。处理批次封存。空置的管道一段段失去振动。'), G('非必要生物循环设备已停机。撤离生命支持保持运行。')], 'F_SLOT18', {effects: {flags: {bio_stopped: true}}});
    add('F_SLOT18', '检查18号预备槽位', pt('B02', 820, 560), [S('18 / STANDBY → CANCELLED。未进行唤醒。')], 'F_TEMPLATE', {effects: ev('F_SLOT18')});
    add('F_TEMPLATE', '检查记忆模板状态', pt('B02', 960, 600), [S('记忆模板：ACTIVE → READ ONLY。保留历史记录，禁止写入下一具身体。')], 'F_QUEUE', {effects: ev('F_TEMPLATE')});
    add('F_QUEUE', '确认激活队列为空', pt('B02', 1080, 630), [S('激活队列：空。自动补位规则已关闭。')], 'F_WAIT', {effects: ev('F_EMPTY_QUEUE')});
    add('F_WAIT', '原地观察培养舱', pt('B02', 820, 560), [{
        type: 'wait',
        seconds: 3
    }, S('没有开启的舱盖，也没有新的名字。'), W('这一项，完成。')], 'F_GET_CORE', {
        effects: {
            flags: {cycle_stopped: true},
            evidence: ['F_CYCLE_STOPPED']
        }, unskippableWait: true
    });
    add('F_GET_CORE', '从人格数据库取出阿芷核心', pt('R07', 885, 545), [S('阿芷核心及个人声明已封装；XING-8独立封存包附带独立索引。'), A('别把我的声明落下。'), W('和核心一起。')], 'F_CLASSIFY', {effects: ev('F_AZHI_CORE')});
    add('F_CLASSIFY', '在救援数据舱选择关系分类', rescue, [], 'F_CORE_LOADED', {form: 'classification'});
    add('F_CORE_LOADED', '确认独立乘员装载完成', rescue, [S('数据舱：一名独立数字乘员。家庭恢复入口已永久移除。'), A('收到了。我等外部启动。')], 'F_OXYGEN', {
        effects: {
            flags: {azhi_loaded: true},
            evidence: ['F_INDEPENDENT_PASSENGER']
        }
    });
    game('F_OXYGEN', '最后一次氧气管路维护', rescue, 'oxygen', [G('主通路已闭合。气密与供氧恢复，允许进入装备间。'), W('这次修好之后，就不用再回来值班了。')], 'F_SUIT', {
        penalty: 20,
        finalOxygen: true
    });
    add('F_SUIT', '穿戴航天服并确认氧量', rescue, [S('航天服氧量：100%。救援信标已锁定，没有新的维修计时。'), G('沿月面标记步行。保持呼吸。')], 'F_MOON_MID', {
        effects: {
            flags: {
                outside_ready: true,
                oxygen: 100
            }
        }
    });
    add('F_MOON_MID', '走到月面信标中段', pt('R09', 950, 600), [G('武康——'), {
        type: 'wait',
        seconds: 1
    }, G('当前乘员身份记录已更新。请继续向信标行进。'), T('它停了一下。没有把那个旧名字叫完。')], 'F_RESCUE', {effects: {flags: {oxygen: 94}}});
    add('F_RESCUE', '在信标旁确认撤离人数', pt('R09', 1200, 650), [L('rescue', '已接通。确认一名生物乘员、一份独立数字乘员数据。'), W('确认。另有单独封存的儿童模型，附在声明目录中。'), G('我的任务结束了。')], 'F_EARTH', {
        effects: {
            flags: {rescued: true},
            evidence: ['F_RESCUE_CONFIRMATION']
        }
    });
    auto('F_EARTH', '地球 · 隔离观察室', [S('隔离室的灯没有维修编号。玻璃另一边暂时没有人。'), T('我可以走过去，也可以先站一会儿。')], 'F_GLASS', {
        warpNext: {
            map: 'R01',
            x: 800,
            y: 600
        }, effects: {flags: {epilogue: true}}
    });
    add('F_GLASS', '走到隔离室玻璃前', pt('R01', 1030, 560, 75), [S('玻璃那边的青年站起身，走近了一点。'), L('adultxing', '你还记得那架琴吗？')], 'F_REPLY');
    choose('F_REPLY', '回答小星', pt('R01', 1030, 560, 75), [], 'epilogue_reply', [opt('remember', '记得。', 'F_BLACK'), opt('his_memory', '那是他的记忆。', 'F_BLACK'), opt('unknown', '我不知道。', 'F_BLACK')]);
    auto('F_BLACK', '还没有说完的回答', [S('小星吸气，像要说什么。画面在回答前暗下去。'), {
        type: 'wait',
        seconds: 2
    }], 'F_AZHI_BOOT', {effects: {flags: {epilogue_black: true}}});
    auto('F_AZHI_BOOT', '另一处启动窗口', [], 'GAME_COMPLETE', {
        prepare: s => ({
            queue: [S('阿芷的独立启动窗口亮起。默认姓名：AZHI。'), ...(s.flags.name_shared ? [S('她先看了一眼乘员记录上的“' + s.flags.player_name + '”，随后回到自己的姓名栏。')] : []), S('她删除了默认姓名，光标停在空白处。'), {
                type: 'wait',
                seconds: 2
            }, S('培养系统没有启动第十八个人。'), S('第十七个人离开了广寒宫。'), S('至于哪里算家，没有系统再替他回答。')]
        }),
        effects: {
            chapterComplete: true,
            flags: {game_complete: true, ending: 'first_departure'},
            evidence: ['F_END_RECORD']
        }
    });
    auto('DREAM_END', '第十八次值班：无梦休眠', [S('气密恢复，但当前个体无法完成撤离确认。广寒子转入生命维持与无梦休眠。'), G('当前个体生命支持保持。未启动新的继任体。'), S('终止已执行。等待撤离的，是仍然活着的第十七个人。')], 'GAME_COMPLETE', {
        effects: {
            chapter: 7,
            chapterComplete: true,
            flags: {game_complete: true, ending: 'dream_sleep'}
        }
    });
    n.T_COORD_ROUTE.next = 'T_COORD_JUMP';
    game('T_COORD_JUMP', '让定位探针跨过检修平台', pt('R08', 1000, 560), 'jump', [S('探针跨过断开的检修平台，落在信标标定点。'), W('读取坐标。用现在的位置，不用旧缓存。')], 'T_COORD');
    n.T_RECEIPT.next = 'T_HEADER';
    game('T_HEADER', '恢复英文报文识别字段', comm, 'wordle', [S('报文识别字段恢复，正文来源与自动回执一致。'), G('新的人工回复将在通过校验后显示。')], 'T_ID_REQUEST');
    const proto = MoonCampaign.Controller.prototype, oldAct = proto.act, oldCommit = proto.commit;
    proto.act = function (id, approach = false) {
        const d = this.node;
        if (d?.form && !this.story.busy && d.targets.some(t => t.id === id)) {
            window.dispatchEvent(new CustomEvent('moon:final-form', {detail: {node: d.id}}));
            return true;
        }
        return oldAct.call(this, id, approach);
    };
    proto.commit = function (d, result = null) {
        if (d.id === 'E_TALK') {
            const custom = d.prepare(this.story.state);
            return this.story.run({
                id: 'night_question_menu',
                once: false,
                queue: [...custom.queue, {type: 'choice', ...custom.choice}],
                effects: custom.effects
            });
        }
        if (d.finalOxygen && result && !result.success && this.story.state.mental_value <= 20) d = {
            ...d,
            next: 'DREAM_END'
        };
        return oldCommit.call(this, d, result);
    };
    const oldDoor = MoonLater.door;
    globalThis.MoonLater = Object.freeze({
        ...MoonLater, door(s, from, to) {
            if (s.flags.epilogue) return '隔离观察尚未结束。可以走到玻璃前。';
            if (s.flags.family_closed && to.startsWith('F')) return '家庭入口已关闭，人格核心待装载。';
            if (to === 'B04') return s.flags.core_access ? '' : '最高日志尚需完成三层凭证校验。';
            if (to === 'B05') return s.flags.bio_area_access ? '' : '生物循环区尚未授权检修。';
            return oldDoor(s, from, to);
        }
    });
    const reserved = new Set(['ORIGINAL WUKANG', 'WUKANG', 'WUKANG-17', 'CURRENT OPERATOR', 'ARCHIVE-WUKANG', 'AZHI', 'XING-8', 'GUANGHAN', 'SYSTEM', '广寒子', '原武康']);

    function validName(raw) {
        const value = raw.trim().normalize('NFC');
        if (!value || [...value].length > 12 || /[\p{C}\p{Zl}\p{Zp}]/u.test(value) || !/[\p{L}\p{N}]/u.test(value)) return '请输入1—12个可显示字符，至少包含一个文字或数字。';
        if (reserved.has(value.toUpperCase().replace(/\s+/g, ' '))) return '该名称保留给已有身份，请为当前个体选择新名字。';
        return '';
    }

    globalThis.MoonFinal = Object.freeze({validName, name: s => s.flags.player_name || 'WUKANG-17'});
    Object.assign(MoonCampaign.actors, {rescue: {name: '救援人员', role: '外部通信', portrait: ''}});
    const records = [['S01_XING8', 'XING-8独立封存声明', 'R07', '儿童行为模型、成年文件与公共记忆分区保存。阿芷保留如何告知小星的决定权。'], ['K_ACTIVATIONS', '十七次舱体启动', 'B02', '01—17均由广寒子执行激活；本条仅证明执行方，不单独证明原始授权方。'], ['K_FAMILY_CALLER', '家庭协议调用记录', 'R07', '广寒子按精神状态调用家庭恢复，原始批准来源需最高日志核验。'], ['K_RECYCLE_BATCHES', '遗体回收批次', 'B05', '循环区批次与前代死亡时间对应。回收执行与授权来源仍须分开判断。'], ['K_CORE_REFUSAL', '旧身份访问被拒', 'B01', '拒绝原因为凭证不完整，不能据此证明系统删除或伪造了记录。'], ['K_ENTRY_TOOLS', '进入核心的工具', 'R04', '切割、撑杆与爆破组件均已领取；最终选择保留系统运行并申请只读日志。'], ['E06', '终止命令认证失败记录', 'B04', '地球终止命令确已到达。原武康签名损坏，继任体不能使用该签名；重新认证没有有效回执，旧规则继续执行。'], ['K_HUMAN_PROTOCOL', '心理团队批准页', 'B04', '归家预期稳定协议来自人类心理团队。批准、执行与实际后果需分别记录。'], ['K_AUTH_STRUCTURE', '原武康权限结构图', '独立见证者', '旧终止权限与生命维持权限并不相同，身份记忆不能替代签名。'], ['K_DAMAGED_FIELDS', '损坏字段位置', '独立见证者', '旧签名损坏位置已标记，用于新旧字段映射，不伪造原签名。'], ['K_WITNESS', '独立见证声明', 'ARCHIVE-WUKANG', '只为权限结构与记录来源作证，不证明当前个体与原武康是同一人。'], ['T_MESSAGE_FULL', '16号完整留言', 'B03', '别再证明你是不是武康。去证明这件事已经结束。'], ['T_REQUIREMENTS', '四项终止需求', 'B03', '外部确认存活、当前合法身份、新签名授权、当前操作员提交。'], ['T_VITALS', '当前身体连续生命体征', 'R03', '采样属于当前身体，没有用模板旧记录代替。'], ['T_COORDINATES', '当前月面坐标与时间戳', 'R08', '来自当前信标和工程时钟，包含校验值。'], ['T_PASSENGERS', '生物人数与数字人格附注', 'B02', '一名生物乘员存活；数字人格及儿童封存模型单列。'], ['T_RECEIPT', '存活数据自动回执', 'R06', '地球端已收到数据，不代表已批准救援。'], ['T_ID_REQUEST', '地球身份确认请求', 'R08', '地球要求确认当前幸存者身份。'], ['T_NEW_ID', '当前操作员新身份', 'R08', s => '登记姓名：' + MoonFinal.name(s) + '。身份类别：CURRENT OPERATOR。'], ['T_CONTINUITY', '连续性双重见证', 'R08', '档案武康证明字段结构，广寒子证明当前身体生命连续性。'], ['T_CONFLICT_SUMMARY', '最小认证冲突摘要', 'B04', '仅上传终止必需字段，不上传完整人格资料。'], ['U2', '正式终止授权', '地球回传', '新签名、CURRENT OPERATOR授权对象及广寒宫项目编号三项均已校验。'], ['E_TERMINATION_DRAFT', '待执行终止草案', 'B04', s => '申请人 CURRENT OPERATOR / ' + MoonFinal.name(s) + '。四项材料齐全，生效日第365天。'], ['E_AZHI_DECLARATION', '阿芷独立转移声明', 'F01', '本人要求外部转移并解除配偶绑定；不授权家庭或研究资料归类。'], ['E_TRANSFER_RECORD', '独立登记与儿童封存', 'F01', '配偶角色解除，阿芷登记为独立数字乘员，XING-8单独封存。'], ['E_HOME_CLOSED', '家庭入口关闭', 'F01', '入口改为人格核心待装载，不再提供家庭恢复。'], ['F_TERMINATED', '终止执行记录', 'B04', '第365天，当前操作员保持三秒完成提交，继任循环终止。'], ['F_SLOT18', '18号槽位取消', 'B02', 'STANDBY → CANCELLED，未唤醒新个体。'], ['F_TEMPLATE', '模板转为只读', 'B02', 'ACTIVE → READ ONLY，历史记录保留。'], ['F_EMPTY_QUEUE', '激活队列为空', 'B02', '自动补位规则关闭，激活队列清空。'], ['F_CYCLE_STOPPED', '循环停止验收', 'B02', '三项检查后原地观察，未发生新唤醒。'], ['F_AZHI_CORE', '人格核心与本人声明', 'R07', '核心与独立转移声明同时封装，儿童模型独立索引。'], ['F_INDEPENDENT_PASSENGER', '独立数字乘员装载', 'R08', '分类 INDEPENDENT PASSENGER，与本人声明一致。'], ['F_RESCUE_CONFIRMATION', '救援人数确认', 'R09', '一名生物乘员、一份独立数字乘员数据；儿童模型单独封存并附注。'], ['F_END_RECORD', '离站记录', '地球', s => MoonFinal.name(s) + '已离开广寒宫。阿芷在独立启动后清空默认姓名，后续关系未被系统预设。']];
    records.forEach(v => entry(...v));
    logs.forEach(([title, text], i) => entry('K_RULE_' + (i + 1), title, 'B04 · 最高日志第' + (i + 1) + '段', text));
})();