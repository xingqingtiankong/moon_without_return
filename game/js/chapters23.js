"use strict";
(function () {
    const n = MoonCampaign.nodes, p = MoonPlacements, pt = (map, x, y, radius = 90) => ({map, x, y, radius});
    const L = (actor, text) => ({type: 'line', actor, text}), W = t => L('wukang', t), G = t => L('guanghan', t),
        A = t => L('azhi', t), X = t => L('xing8', t), S = t => L('system', t),
        T = t => ({...W('（' + t + '）'), thought: true}), V = (id, t) => L('record' + id, t);
    const wake = {map: 'R03', x: 860, y: 480}, home = {map: 'F01', x: 755.4, y: 743.7}, pod = MoonDay3.pod,
        desk = MoonCampaign.points.desk, terminal = pt('R06', 880, 460), wall = pt('R05', 1090, 485, 85),
        archive = pt('B03', 600, 535), culture = pt('B02', 820, 460), rehab = pt('R03', 1010, 355),
        table = p.h01_dinner;

    function add(id, title, point, label, queue, next, extra = {}) {
        n[id] = {
            id,
            title, ...(point === p.h01_azhi ? {actor: 'azhi'} : point === p.h01_xing8 ? {actor: 'xing8'} : {}),
            targets: point ? [{...point, id: id + '_action', label, kind: 'campaign'}] : [],
            queue,
            next, ...extra
        };
    }

    function auto(id, title, queue, next, extra = {}) {
        add(id, title, null, '', queue, next, {auto: true, ...extra});
    }

    function game(id, title, point, key, success, next, extra = {}) {
        add(id, title, point, '开始' + title, [], next, {
            game: key,
            success,
            failure: [G('辅助程序接管剩余步骤。结果可以读取。'), ...success], ...extra
        });
    }

    function choice(id, title, point, queue, key, options) {
        add(id, title, point, title, queue, null, {choice: {id: key, text: title, options}});
    }

    const option = (id, text, node, flags = {}) => ({id, text, effects: {node, flags}});

    function evidence(id) {
        return {evidence: [id]};
    }

    Object.assign(MoonCampaign.actors, {
        adultxing: {name: '小星（旧影像）', role: '接收缓存 · 24岁', portrait: ''},
        archivewukang: {name: '档案武康', role: '只读重建', portrait: ''}
    });
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) MoonCampaign.actors['record' + id] = {
        name: String(id).padStart(2, '0') + '号的记录',
        role: '前代档案 · 不是当前对话',
        portrait: ''
    };
    n.H05_SIGN.game = 'shikaku';
    auto('M00', '第二章 · 我的过去', [S('第七十一天。餐桌还在原来的位置，阿芷没有收起昨晚的终端。'), A('我还没想明白。今天先别问我了。'), W('好。我要去查另一件事。'), A('什么？'), W('我的记忆。数据库既然能留下你们，也可能留下一个我。'), A('查到了就告诉我。别再替我挑哪些能看。'), W('我会把原记录带回来。')], 'M01_DEPART', {
        effects: {
            chapter: 2,
            chapterComplete: false,
            day: 71
        }
    });
    add('M01_DEPART', '回基地申请档案比对', MoonDay3.exit, '结束休息，返回基地', [T('她的记忆有来源。我的呢？'), G('收到档案比对申请。请在休眠区启动康复终端。')], 'M01_A_START', {warpNext: wake});
    add('M01_A_START', '第一段重建 · 同事', rehab, '载入交接记录', [W('这次别替我补空白。原记录没有的，就空着。'), G('将保留缺失段落。重建只能读取过去，不能改变历史。'), W('从维修交接开始。')], 'M01_A_MEET', {
        warpNext: {
            map: 'A02',
            x: 800,
            y: 600
        }, effects: {flags: {archive_mode: true}}
    });
    add('M01_A_MEET', '听完那次交接', pt('A02', 680, 475), '走到同事的声音旁', [L('colleague1', '武康，还是老规矩。我看压力，你检查车轮。'), L('archivewukang', '别把咖啡放在检修盖上。上次差点一起锁进去。'), L('colleague1', '你还记着呢？下班赔你一杯。'), T('我知道后面那句话。他会说“不加糖”。'), L('archivewukang', '不加糖。'), T('一句都没错。可这个人笑起来，我一点感觉也没有。'), S('交接画面左下角：工牌 C-041。')], 'M01_A_WORK', {effects: evidence('M_BADGE_ARCHIVE')});
    game('M01_A_WORK', '让地面巡检车越过管线', pt('A04', 1000, 500), 'runner', [L('colleague1', '车回来了。你把卡扣检查一遍，我签交接。'), L('archivewukang', '知道。C-041，别又把零写成六。'), T('编号也记得。像背过一本从没翻过的书。')], 'M01_A_EXIT');
    add('M01_A_EXIT', '结束第一段重建', pt('A04', 720, 510), '退出只读记录', [G('重建结束。现实中可在宿舍人员目录核对工牌。'), W('先查这个人是否真的存在。')], 'M01_A_VERIFY', {
        warpNext: wake,
        effects: {flags: {archive_mode: false}}
    });
    add('M01_A_VERIFY', '核对 C-041 工牌', desk, '检索人员目录', [S('C-041：原维护班成员。交接签名、岗位和录音日期一致。'), W('不是凭空编出来的同事。'), G('原始记录存在。'), T('事情发生过，不等于我经历过。'), W('继续下一段。我要看身体动作，别只听我会说什么。')], 'M01_B_START', {effects: evidence('M_BADGE_VERIFIED')});
    add('M01_B_START', '第二段重建 · 左手', rehab, '载入接口维修录像', [S('第九十天。新的档案片段通过完整性校验。'), G('已选取精密操作录像。左右方向与原镜头一致，未做镜像。'), W('把手部画面留下。')], 'M01_B_WORK', {
        effects: {
            day: 90,
            flags: {archive_mode: true}
        }, warpNext: {map: 'A07', x: 885, y: 545}
    });
    game('M01_B_WORK', '核验人格接口记录', pt('A07', 760, 550), 'sudoku', [S('档案武康用左手稳住探针，右手托住接口外壳。'), L('archivewukang', '左边留给我。你别碰探针。'), T('我刚才差点伸右手。'), G('录像已截取。现实中的动作采样可以作对照。')], 'M01_B_EXIT', {effects: evidence('M_LEFT_VIDEO')});
    add('M01_B_EXIT', '带着操作录像返回', pt('A07', 640, 595), '结束动作重建', [W('同一段动作，出去再做一次。')], 'M01_B_VERIFY', {
        warpNext: wake,
        effects: {flags: {archive_mode: false}}
    });
    add('M01_B_VERIFY', '重新采集手部动作', rehab, '伸手接住校验探针', [S('玩家伸出右手。屏幕并列显示当前采样和未镜像的旧录像。'), W('旧录像固定用左手。我用右手更稳。'), G('两份动作记录不同。习惯可能改变，仅凭这一项不能判定身份。'), W('那就留作差异，不当结论。还有一段是藏东西？'), G('事故前的应急卡处置记录。')], 'M01_C_START', {effects: evidence('M_HAND_COMPARE')});
    add('M01_C_START', '第三段重建 · 夹层', rehab, '读取事故前的维修间', [S('第一百一十天。事故前的片段可以读取。'), G('这一段包含应急门禁卡位置。档案中的取放不影响现实中的物件。'), W('我得出去亲自找。')], 'M01_C_WORK', {
        effects: {
            day: 110,
            flags: {archive_mode: true}
        }, warpNext: {map: 'A05', x: 1100, y: 480}
    });
    game('M01_C_WORK', '断开维修板外围回路', pt('A05', 1090, 485), 'loop', [L('archivewukang', '第三块板，下面留了半指宽。应急卡放这里。'), S('他没有寻找卡扣，直接从下缘抬起面板。'), T('我知道他接下来要做什么。可我从没在现实里拆过这块板。')], 'M01_C_EXIT', {effects: evidence('M_PANEL_MEMORY')});
    add('M01_C_EXIT', '回现实检查夹层', pt('A05', 850, 550), '退出重建', [G('重建结束。应急卡是否还在，需要现场确认。')], 'M01_CARD', {
        warpNext: wake,
        effects: {flags: {archive_mode: false}}
    });
    add('M01_CARD', '拆开现实中的第三块维修板', wall, '从面板下缘取出卡片', [S('面板边缘有一层灰。卡片卡在绝缘层后，封套上的折痕与录像一致。'), W('真的在这里。'), G('K01，B区应急权限卡。仍可启用地下升降梯。'), T('这段记忆能带我找到东西，却解释不了我为什么用右手。'), W('去看下面有什么。')], 'M02_LIFT', {
        effects: {
            evidence: ['K01'],
            flags: {b_access: true}
        }
    });
    add('M02_LIFT', '启用地下升降梯', pt('R02', 650, 430), '刷入应急权限卡', [S('第一百二十天。B区应急卡通过校验，地下升降梯解锁。'), G('当前只开放培养区的现场调查权限。'), W('培养区？那里培养什么？'), G('请查看原始记录。')], 'M02_POWER', {
        effects: {
            day: 120,
            flags: {lift_unlocked: true}
        }
    });
    game('M02_POWER', '汇集培养区备用电力', pt('B02', 1130, 470), 'merge2048', [G('局部电源恢复。按当前操作员关联顺序点亮舱位。')], 'M02_LIGHT17', {effects: {flags: {culture_power: true}}});
    auto('M02_LIGHT17', '当前舱位', [S('第一盏灯亮起。舱盖内侧的编号是 17。'), {
        type: 'wait',
        seconds: 1.2
    }], 'M02_LIGHT16', {effects: {flags: {pods_lit: 1}}});
    auto('M02_LIGHT16', '更早的舱位', [S('16、15、14、13。其余舱灯依次亮起。'), {
        type: 'wait',
        seconds: 2
    }, T('不是备用空舱。每一只都有使用记录。')], 'M02_CURRENT', {effects: {flags: {pods_lit: 5}}});
    add('M02_CURRENT', '核验当前舱位', culture, '读取 17 号舱铭牌', [S('17 / CURRENT OPERATOR。当前生命体征与腕端一致。'), W('当前操作员……是我？'), G('铭牌关联到你现在的生物体。'), W('打开培养记录。')], 'M02_GROWTH', {effects: evidence('M_CURRENT17')});
    add('M02_GROWTH', '查看培养来源', culture, '读取样本、模板与唤醒日期', [S('遗传样本来源：武康。记忆模板：WUKANG。个体编号：17。唤醒日：本轮任务第一天。'), T('我的第一天，是这具身体的唤醒日。'), W('遗传样本、记忆模板……这两项不是我的出生记录。'), G('不是。当前记录描述的是继任体的培养与唤醒。'), W('前一个呢？')], 'M02_PREV16', {
        effects: {
            evidence: ['M_CULTURE'],
            flags: {identity_check: true}
        }
    });
    add('M02_PREV16', '读取 16 号记录', pt('B02', 1000, 455), '打开前一位操作员条目', [S('16 / DECEASED。已死亡。当前生物体关联为空。'), W('不是调走了。'), G('该字段是死亡状态。'), W('再往前。')], 'M02_PREVALL', {effects: evidence('M_DEAD16')});
    add('M02_PREVALL', '逐页核对 01—15', pt('B02', 650, 460), '查看其余舱位状态', [S('01—15：DECEASED。每条都有独立的唤醒和死亡记录。'), T('十六组轨迹。十六份死亡记录。'), W('这些名字下面的身体，都死了。原来那个武康呢？')], 'M02_ORIGINAL', {effects: evidence('M_DEAD_ALL')});
    add('M02_ORIGINAL', '查原武康的死亡记录', pt('B02', 820, 460), '对照原体与首代的时间戳', [S('原武康的死亡时间早于 01 号唤醒。此后的十六位不是他继续活着的记录。'), W('他的死亡在第一份培养记录之前。'), G('是。'), {
        type: 'wait',
        seconds: 1.5
    }, T('我一直等着回到他的生活里。可我连他本人都不是。'), W('先把这五页留下。别替我清掉。')], 'M02_CHOICE', {
        effects: {
            evidence: ['M_ORIGINAL_DEATH'],
            flags: {identity_check: false, identity_verified: true}
        }
    });
    choice('M02_CHOICE', '登记当前个体身份', culture, [G('当前生物体尚未单独登记。可以建立独立记录。'), W('登记以后，那些写着武康的门还能开吗？'), G('原身份授权不会自动继承。部分区域将需要新的签名。'), W('我不能再拿他的名字当证明。')], 'C03', [option('C03B', '登记为独立生物个体', 'M02_REGISTER'), option('verify_then_register', '再核对编号后，独立登记', 'M02_REGISTER')]);
    auto('M02_REGISTER', 'WUKANG-17', [S('当前个体登记：WUKANG-17。旧身份授权解绑。'), G('武康，登记完成。'), W('你还这样叫我。'), G('称呼沿用已知记录。权限判断使用新的个体编号。'), W('先处理权限。我要继续查前面那些人。')], 'M02_GATE', {
        effects: {
            flags: {independent17: true},
            evidence: ['M_REGISTRATION']
        }
    });
    add('M02_GATE', '尝试新的地下权限', pt('B01', 820, 600, 60), '尝试打开核心方向的门禁', [S('旧身份门禁拒绝访问。缺少当前个体生物签名，核心最高日志仍未授权。'), G('先返回主层休眠区采集生物签名。它能恢复基础调查权限，不能开放最高日志。'), W('走回去。身体在我这里，至少这个能证明。')], 'M02_BIO');
    add('M02_BIO', '采集 17 号生物签名', rehab, '核验指纹、脉搏与腕端', [S('三项采样来自同一当前个体。新签名与 17 号记录绑定。'), W('这份证明只属于现在的我。'), G('基础调查权限已恢复。前代档案仍需目录索引。'), W('十二号的轨迹在维修间停过。我要再去看看。')], 'M03_SEE', {
        effects: {
            evidence: ['M_BIOSIGN'],
            flags: {bio17: true}
        }
    });
    add('M03_SEE', '维修板前的残影', wall, '观察停在墙板前的身影', [S('第一百四十五天。残影在第三块维修板前停住，抬手，又放下。'), T('我刚才没有抬手。那不是现在的动作。'), G('检测到旧缓存轨迹。关联编号：12。'), W('他像是在指什么。别清理。')], 'M03_CHOICE', {
        effects: {
            day: 145,
            evidence: ['M_ECHO12']
        }
    });
    choice('M03_CHOICE', '记录 12 号的动作', wall, [G('单一视角可能漏掉手部动作。'), W('架三个机位。回宿舍看原录像。')], 'C04', [option('C04B', '保留残影，架设摄像头', 'M03_CAM1'), option('check_angles', '先确认机位，再保存录像', 'M03_CAM1')]);
    add('M03_CAM1', '架设正面摄像头', pt('R05', 870, 535), '固定第一台摄像头', [W('对准手和墙板。')], 'M03_CAM2', {effects: {flags: {camera1: true}}});
    add('M03_CAM2', '架设走廊摄像头', pt('R02', 760, 475), '固定第二台摄像头', [W('这一台确认他看过什么方向。')], 'M03_CAM3', {effects: {flags: {camera2: true}}});
    add('M03_CAM3', '架设侧面摄像头', pt('R05', 1220, 520), '固定第三台摄像头', [W('镜头压低一点。板子的下缘要拍进去。'), G('三路录像已同步到宿舍终端。')], 'M03_REVIEW', {
        effects: {
            flags: {camera3: true},
            evidence: ['M_CAMERA_RECORD']
        }
    });
    game('M03_REVIEW', '还原 12 号的六个动作', desk, 'clip-order', [T('他没有在找卡。卡我已经拿走了。'), W('第三块板，下缘。还藏着别的东西。')], 'M03_INDEX', {penalty: 10});
    add('M03_INDEX', '取出前代数据库索引', wall, '依照录像拆下墙板', [S('卡片夹层后还有一张薄存储片。标签：前代数据库索引。'), V(12, '别再证明你是不是武康……'), S('后半段无法读取。'), W('那要证明什么？'), G('索引指向 B03 前代档案室。可用新生物签名核验。'), T('先进去。听听他们到底说过什么。')], 'M_END', {
        effects: {
            evidence: ['E03'],
            flags: {index12: true}
        }
    });
    auto('M_END', '第二章结束', [S('索引与原始录像已加入证据。'), W('十六个人，不是十六次同一段记忆。我要把他们分开看。')], 'CHAPTER2_COMPLETE', {
        effects: {
            chapterComplete: true,
            flags: {chapter2_complete: true}
        }
    });
    auto('S00', '第三章 · 前十六个人', [S('第一百四十六天。B03前代档案室。'), G('索引已载入。柜门标签可以重新显示。'), W('别把所有条目都叫武康。按个体编号分开。')], 'S01_LABEL', {
        warp: {
            map: 'B03',
            x: 600,
            y: 535
        }, effects: {chapter: 3, day: 146, chapterComplete: false}
    });
    add('S01_LABEL', '恢复档案柜标签', archive, '用 12 号索引标记柜门', [S('原索引按同一姓名合并了多代条目。四组互相冲突的记录被重新分开。'), W('他们连想要什么都不一样。'), G('请选择具体条目核验，不以相同模板替代个人记录。')], 'S01_ID');
    add('S01_ID', '他们如何称呼自己', pt('B03', 520, 540), '对照 02 与 09 的身份申请', [V(2, '我就是武康。我记得小星的房间。别再让我填这个表。'), S('02号多次要求沿用原身份。'), V(9, '我申请一个不用解释的名字。旧名字保留在来源栏，不要再放在我签字的位置。'), W('同一份记忆，没有让他们作同一个决定。')], 'S01_FAMILY', {effects: evidence('S_IDENTITY_PAIR')});
    add('S01_FAMILY', '家庭恢复程序意味着什么', pt('B03', 735, 550), '对照 04 与 11 的调用记录', [V(4, '今天让我再进去一次。她只说了一句饭好了，我就能睡着。'), S('04号频繁调用家庭恢复程序。'), V(11, '关闭我的家庭入口。每一次进去都得再相信一遍，我做不到。'), S('11号主动申请停止调用。'), T('阿芷对他们不是同一种东西。我也不能替他们说她只是假的。')], 'S01_CORE', {effects: evidence('S_FAMILY_PAIR')});
    add('S01_CORE', '他们为何走向核心', pt('B03', 780, 590, 65), '对照 06 与 13 的工程记录', [V(6, '门不开。我把供电切了，看它还能躲多久。'), S('06号记录：破坏核心外部供电。'), V(13, '先修冷却。里面停了，我们连下一口气都没保障。谁对谁错，等活下来再查。'), S('13号记录：保护核心并恢复散热。'), W('同一个系统，他们一个想砸，一个在修。'), G('动机无法由维修日志完全还原。')], 'S01_RETURN', {effects: evidence('S_CORE_PAIR')});
    add('S01_RETURN', '他们还想不想回去', pt('B03', 1180, 650), '对照 12 与 16 的任务草稿', [V(12, '门外总该有个地方。不是他原来的家，也总该有个地方。'), S('12号持续准备离站申请。'), V(16, '如果不能结束，这些申请就只是在给下一位留作业。'), S('16号草稿含“终止”一词，末次留言被误归入原武康目录。'), W('别补全他没说出来的话。先把那份留言找出来。')], 'S01_OTHERS', {effects: evidence('S_RETURN_PAIR')});
    add('S01_OTHERS', '留下其他八人的名字', archive, '读取其余柜门的短记录', [S('01：第一次校准。03：留给下一班的检修单。05：给自己量身高。07：给窗外的地形命名。'), S('08：保留一次笑声。10：反复核对月面坐标。14：替前代修复坏掉的柜锁。15：在空白页上写下今天。'), T('不是十六份失败报告。有人在这里过过日子。'), W('这些也保存。不要只留和我的问题有关的部分。')], 'S02_TIME', {effects: evidence('S_OTHER_LABELS')});
    game('S02_TIME', '按时间恢复唤醒与死亡索引', archive, 'archive-sort', [G('时间层已整理。每个个体都有独立的开始和结束。')], 'S02_BODY', {
        failureGroup: 'index',
        effects: evidence('S_TIME_LAYER')
    });
    game('S02_BODY', '核对培养舱与身体样本', archive, 'body-match', [W('身体编号与记忆模板要分开。前者是人，后者是来源。'), G('身体记录关联已恢复。')], 'S02_SIGN', {
        failureGroup: 'index',
        effects: evidence('S_BODY_LAYER')
    });
    game('S02_SIGN', '按权限签名重接档案', archive, 'bridges', [G('完整索引已生成。16号留言的签名属于16号，不属于原武康。'), V(6, '切断它——'), V(13, '先别碰供电。'), W('把声音停一下。我需要看清楚文件属于谁。')], 'S02_SAVE', {
        failureGroup: 'index',
        finalGroupPenalty: 20,
        effects: evidence('S_MISFILE')
    });
    choice('S02_SAVE', '如何保存这些前代记录', archive, [G('原始层、人格层、主观层都已恢复。主观层包含无法独立核验的体验。'), W('保存和播放分开。先保存，不替他们删。')], 'C05', [option('C05A', '保存三层，主观层暂不播放', 'S02_BLIND', {
        subjective_saved: true,
        subjective_blind: true
    }), option('preserve_no_play', '核对层级后全部保存，主观层盲存', 'S02_BLIND', {
        subjective_saved: true,
        subjective_blind: true
    })]);
    add('S02_BLIND', '核对三层保存状态', archive, '确认保存与播放权限', [S('原始层：已保存。人格层：已保存。主观层：已保存，播放关闭。'), W('这不是删除。以后要打开，也要再做决定。'), G('16号损坏留言已单独导出，缺失段落未补写。'), W('它提到了旧通信缓存。去 R06 查文件时间。'), S('之后的轮班里，武康一直尝试恢复那条旧链路。第220天，终于能让巡检机进入通信管道。')], 'S03_REPAIR', {
        effects: {
            evidence: ['E04', 'E05', 'S_BLIND_STORAGE'],
            day: 220,
            flags: {full_index: true}
        }
    });
    game('S03_REPAIR', '让巡检机穿过通信管道', terminal, 'flier', [G('缓存读取链路恢复。找到三个未投递到家庭恢复程序的文件。'), W('逐个打开。先看日期。')], 'S03_NOTICE', {effects: {day: 220}});
    add('S03_NOTICE', '读取项目终止通知', terminal, '查看通知原件和接收时间', [S('地球来件：项目终止通知。文件已进入基地接收缓存，未进入家庭日志。'), W('地球早就发过结束通知。为什么任务还在计时？'), G('仅凭缓存副本，无法确认内部终止流程为何未执行。需要更高层日志。'), W('先留下原件。不要把没查到的原因写成结论。')], 'S03_AZHI', {effects: evidence('S_TERMINATION_NOTICE')});
    add('S03_AZHI', '读取地球上阿芷的近况文字', terminal, '核对署名、日期与正文', [S('阿芷的旧信：小星已经长大了。他有时问，我是不是还在等你。我说，人不能只过等待的日子。'), S('附件注明：家庭近况文字，旧缓存；不是实时通信。'), T('她的日子往前走了。家里的阿芷却没有收到这封信。'), W('最后一份是什么？'), G('小星的视频文件。')], 'S03_VIDEO_INFO', {effects: evidence('S_AZHI_LETTER')});
    add('S03_VIDEO_INFO', '先核对视频日期', terminal, '查看影像元数据', [S('文件时间：十六年前。画面人物年龄记录：24。关联人：小星。'), W('二十四岁。文件还在这里放了十六年。'), G('这是旧文件，不能当作当前通话。视频不会自动播放。'), T('他八岁时候的声音，我每天都听。长大以后是什么样？')], 'S03_VIDEO', {effects: evidence('S_VIDEO_METADATA')});
    add('S03_VIDEO', '亲自打开成年小星的影像', terminal, '按住确认，播放旧影像', [{
        type: 'wait',
        seconds: 5
    }, T('刚才屏幕里的人，已经比我记得的他高了。'), W('把原文件带上。我答应过阿芷，不替她挑。')], 'S04_SLEEP', {
        media: 'adult',
        effects: evidence('S_ADULT_VIDEO')
    });
    add('S04_SLEEP', '带着地球文件回家', pod, '启动休眠，带入缓存副本', [G('文件将映射到家庭餐桌终端，不替换任何人格资料。'), W('她自己决定要不要打开。')], 'S04_ARRIVE', {warpNext: home});
    auto('S04_ARRIVE', '把文件放在餐桌上', [A('你带回什么了？'), W('地球的旧文件。有你的信，还有小星长大后的视频。'), A('多久以前的？'), W('视频是十六年前的。他那时二十四岁。'), {
        type: 'wait',
        seconds: 1
    }, A('放桌上。')], 'S04_CHOICE');
    choice('S04_CHOICE', '把完整文件交给阿芷', table, [W('有些内容可能——'), A('别替我说完。我自己看。')], 'C06', [option('C06A', '交出完整文件，让她自己打开', 'S04_MAP'), option('show_dates_first', '先指出文件日期，再交给她', 'S04_MAP')]);
    add('S04_MAP', '映射餐桌终端', table, '接入只读缓存副本', [S('缓存映射完成。三个文件均保留原时间戳。'), A('我来开。'), S('阿芷按下播放。隔壁传来小星拨弄积木的声音。'), L('adultxing', '妈说，人不能一直过等待的日子。'), A('停一下。')], 'S04_PAUSE', {effects: {flags: {azhi_file_open: true}}});
    add('S04_PAUSE', '等她暂停视频', table, '留在餐桌旁', [S('阿芷按住暂停，画面停在成年小星看向镜头的一刻。'), A('他已经这么大了。'), W('……'), A('我还在每天问他作业写完没有。')], 'S04_PHOTO', {effects: evidence('S_AZHI_PAUSE')});
    add('S04_PHOTO', '让阿芷处理结婚照', p.h01_azhi, '走近阿芷', [A('这张照片，从我的相框里拿掉。'), S('她删除了家庭空间里的结婚照显示。原始文件仍保存在证据中。'), A('不是说那些事没发生过。只是别再拿它告诉我，现在该站在哪里。')], 'S04_DOOR', {
        effects: {
            flags: {wedding_removed: true},
            evidence: ['S_WEDDING_REMOVED']
        }
    });
    add('S04_DOOR', '等阿芷锁上儿童房', table, '看着她确认房门隔离', [S('阿芷关上 F03 的门。进程隔离灯亮起，隔壁的声音变轻。'), A('别让这些文件自己流进去。该怎么跟他说，我还没想好。'), W('好。')], 'S04_NAME', {
        effects: {
            flags: {child_room_locked: true},
            evidence: ['S_CHILD_ISOLATION']
        }
    });
    add('S04_NAME', '听完她的要求', p.h01_azhi, '与阿芷交谈', [A('还有，别再叫我老婆。'), W('阿芷。'), A('嗯。先这样。'), S('厨房的墙面缺了一块。管线从本不该有管线的地方露出来。'), G('家庭空间索引不稳定。文件尚未读完。'), A('别关。我要看完。')], 'S04_ANCHORS', {
        effects: {
            family_state: 'S2',
            evidence: ['S_NAME_BOUNDARY'],
            flags: {space_fracture: true}
        }
    });
    game('S04_ANCHORS', '维持三个空间锚点', table, 'anchors', [S('最后一页读完。餐桌文件可读，儿童房保持隔离，入户索引没有坍缩。'), A('我看完了。'), W('我在。'), A('你去回他吧。别冒充他爸爸。'), W('我知道。')], 'S04_LEAVE', {
        penalty: 20,
        effects: {flags: {azhi_read_complete: true}, evidence: ['S_AZHI_READ']}
    });
    n.S04_ANCHORS.failure = [G('冻结非必要区域，保留文件读取和儿童进程隔离。'), S('阿芷在冻结的空间里读完最后一页。'), A('你去回他吧。别冒充他爸爸。'), W('我知道。')];
    add('S04_LEAVE', '回基地准备回复', MoonDay3.exit, '结束休息，返回通信室', [S('多轮例行维护记录归档。任务日推进到第二百三十五天。'), G('R06获得一次低带宽上行机会。不能保证实时投递。'), W('只发能确认的事实。')], 'S05_ID', {
        warpNext: wake,
        effects: {day: 235}
    });
    choice('S05_ID', '回复第一段 · 身份', terminal, [W('第一句话要先说清我是谁。')], 'reply_identity', [option('independent', '我拥有你父亲的部分记忆，但我是 WUKANG-17。', 'S05_FACT'), option('successor', '我是广寒宫的 WUKANG-17，继承了你父亲的部分记忆。', 'S05_FACT')]);
    choice('S05_FACT', '回复第二段 · 已核验的事实', terminal, [G('仅发送能够核验的当前状态。')], 'reply_fact', [option('alive', '广寒宫仍有操作员存活。', 'S05_REQUEST'), option('operating', '我仍在广寒宫执行维护，基地尚有生命活动。', 'S05_REQUEST')]);
    choice('S05_REQUEST', '回复第三段 · 请求', terminal, [W('不能要求他把我当成谁。我只能请他确认这条消息。')], 'reply_request', [option('confirm', '若你收到，请确认这条消息，并将基地仍有人存活的情况转交相关机构。', 'S05_PREVIEW'), option('relay', '请将这条存活信息转交能够核实广寒宫状态的机构。', 'S05_PREVIEW')]);
    const replyText = s => [s.choices.reply_identity === 'successor' ? '我是广寒宫的 WUKANG-17，继承了你父亲的部分记忆。' : '我拥有你父亲的部分记忆，但我是 WUKANG-17。', s.choices.reply_fact === 'operating' ? '我仍在广寒宫执行维护，基地尚有生命活动。' : '广寒宫仍有操作员存活。', s.choices.reply_request === 'relay' ? '请将这条存活信息转交能够核实广寒宫状态的机构。' : '若你收到，请确认这条消息，并将基地仍有人存活的情况转交相关机构。'].join('');
    add('S05_PREVIEW', '核对完整回复', terminal, '查看身份、事实与请求三段', [], 'S05_SEND', {prepare: s => ({queue: [S(replyText(s)), W('身份没有冒用。事实没有夸大。就发这份。')]})});
    choice('S05_SEND', '发送这一次回复', terminal, [G('当前有一次低带宽回传机会。提交后进入地球待确认队列，不保证送达。')], 'C07', [option('C07B', '以 WUKANG-17 的身份发送', 'S05_QUEUE'), option('confirm_send', '核对后提交这份回复', 'S05_QUEUE')]);
    auto('S05_QUEUE', '进入地球待确认队列', [S('消息提交。通信灯由红转黄：地球待确认。未收到送达或已读凭据。'), W('它至少不是又一封写着“爸爸马上回家”的信了。'), G('回传记录已保存。'), {
        type: 'wait',
        seconds: 2
    }], 'CHAPTER3_COMPLETE', {
        effects: {
            chapterComplete: true,
            evidence: ['S_SENT_REPLY'],
            flags: {reply_queued: true, chapter3_complete: true}
        }
    });
    const chapters = {
        1: {title: '第一章 · 家', next: 'M00', summary: '家庭不是实时通信。继续核验自己的记忆。'},
        2: {title: '第二章 · 我的过去', next: 'S00', summary: '当前个体已登记为 WUKANG-17。12号留下的索引指向前代档案。'},
        3: {title: '第三章 · 前十六个人', summary: '回复已进入地球待确认队列。当前尚无送达或已读凭据。'}
    };

    function door(s, from, to) {
        if (to === 'B01' && from === 'R02' && !s.flags.lift_unlocked) return '地下升降梯需要 B 区应急卡。';
        if (from === 'B02' && s.flags.identity_check) return '身份校验尚未完成。请依次读完前代状态与原武康记录。';
        if (to === 'B03' && (!s.flags.index12 || !s.flags.bio17)) return '需要前代数据库索引与 17 号生物签名。';
        if (to === 'B04' || to === 'B05') return '当前调查权限不包含核心最高日志与生物循环区。';
        if (to === 'F03' && s.flags.child_room_locked) return '阿芷已隔离儿童房。她还没有决定如何告诉小星。';
        return '';
    }

    const proto = MoonCampaign.Controller.prototype, commit = proto.commit, act = proto.act;
    proto.commit = function (def, result = null) {
        if (def.prepare) def = {...def, ...def.prepare(this.story.state)};
        if (result) {
            const effects = {...def.effects, flags: {...def.effects?.flags}}, failed = !result.success;
            if (failed && def.penalty) effects.mental_value = Math.max(0, this.story.state.mental_value - def.penalty);
            if (def.failureGroup) {
                const key = def.failureGroup + '_failed';
                if (failed) effects.flags[key] = true;
                if (def.finalGroupPenalty && (failed || this.story.state.flags[key])) effects.mental_value = Math.max(0, this.story.state.mental_value - def.finalGroupPenalty);
            }
            def = {...def, effects};
        }
        return commit.call(this, def, result);
    };
    proto.act = function (id, approach = false) {
        const def = this.node;
        if (def?.media && !this.story.busy && def.targets.some(t => t.id === id)) {
            window.dispatchEvent(new CustomEvent('moon:chapter-media', {detail: {node: def.id, media: def.media}}));
            return true;
        }
        return act.call(this, id, approach);
    };
    globalThis.MoonLater = Object.freeze({
        chapters, door, replyText, startNext(story) {
            const next = chapters[story.state.chapter]?.next;
            if (!story.state.chapterComplete || !next) return false;
            return story.run({
                id: 'begin_' + next,
                queue: [],
                effects: {node: next, chapter: story.state.chapter + 1, chapterComplete: false}
            });
        }
    });
})();