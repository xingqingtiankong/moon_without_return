"use strict";
(function () {
    const entries = {};

    function add(id, title, source, text, when) {
        entries[id] = {id, title, source, text, when};
    }

    add('E01', '十六组轨迹摘要', '第一章 · R05 冷存柜', '保存了十六组不同时间的相似运动轨迹。取得时尚未确认这些轨迹的个体身份。');
    add('E02', 'AZHI 与 XING-8 条目', '第一章 · R07 人格数据库', '两个家庭人格在基地本地运行。源资料截止于原武康离开地球之前，此后的家庭交互不等于地球实时更新。');
    add('I_WRIST', '腕端与轮班安排', '序章 · R03 腕端终端', '当前任务以维修和休眠交替。家庭入口由心理恢复程序提供，不与基地房门物理相连。', s => s.flags.wrist_acquired);
    add('I_PHOTO', '家庭照片', '序章 · R01 宿舍', '照片中的人物为阿芷、小星与原武康。照片是旧物，不能证明家庭当前状态。', s => s.flags.family_photo_seen);
    add('I_SOIL', '浇透后重新变干的土', '第一章 · F05 花盆及阿芷回应', '昨晚浇透并有水流入接水盘，次日土壤又干燥，裂纹与浇水前相同。阿芷说未移动花盆，且不记得让玩家浇过水。', s => s.flags.soil_reviewed);
    add('I_MODEL', '飞船回到拆散状态', '第一章 · F01 / F03，模型与小星回应', '前一晚搭好的飞船被拆散，零件回到收拾前的位置。小星记得搭建细节，否认拆动。原因尚未核实。', s => s.flags.model_reviewed);
    add('I_REPEAT', '重复的餐桌对白', '第一章 · F01 餐桌', '阿芷再次说出“等你回来”，停顿与第一晚相同。她将其解释为顺口，并未给出新的来源说明。', s => s.flags.repeat_reviewed);
    add('I_DRAWING', '小星画中的归家', '第一章 · F03 小星的画', '玩家就在身旁，小星却说“爸爸马上回来了”。画和现场回应已经核验。', s => s.flags.drawing_question);
    add('I_CLOCK', '358 与 365 的计时差异', '第一章 · 腕端 / R01 家庭日志', '任务经过七天，腕端显示剩余358天，家庭日志仍为365天。旧缓存是广寒子的暂时解释，不是已验证原因。', s => s.flags.clock_verified);
    add('I_FAMILY_INDEX', '阿芷亲自核对的记忆索引', '第一章 · F01 餐桌终端', '源资料末条截止于离开地球前；其后条目均标为本地交互。阿芷亲自打开、翻阅并关闭索引。', s => s.flags.family_source_verified || s.flags.index_verified);
    const rows = [
        ['M_BADGE_ARCHIVE', '档案中的 C-041 工牌', 'A02 交接重建', '档案武康熟悉同事与交接习惯。玩家能预知对白，却没有对应的亲近感。工牌编号已截取。'],
        ['M_BADGE_VERIFIED', 'C-041 的现实目录对照', 'R01 人员目录', '工牌、岗位、日期与原始签名一致。可以证明原事件存在，不能据此证明当前玩家亲历过。'],
        ['M_LEFT_VIDEO', '固定使用左手的操作录像', 'A07 只读接口重建', '原镜头未镜像，精密操作固定由左手完成。'],
        ['M_HAND_COMPARE', '当前右手与旧录像左手', 'R03 动作采样', '当前玩家接探针时右手更稳，与旧录像不同。习惯可能改变，因此该差异不是独立的身份结论。'],
        ['M_PANEL_MEMORY', '第三块维修板下缘', 'A05 事故前档案', '档案武康从第三块维修板下缘藏入应急卡；现实位置仍待验证时，仅作为寻找线索。'],
        ['K01', 'B 区应急权限卡', 'R05 第三块维修板夹层', '现实中的卡片、封套折痕与档案一致。用于地下升降梯，不自动提供核心最高权限。'],
        ['M_CURRENT17', '17 / CURRENT OPERATOR', 'B02 当前培养舱', '当前体征与17号舱关联，编号属于现在的身体。'],
        ['M_CULTURE', '17号培养来源', 'B02 培养记录', '遗传样本来源为原武康，记忆模板为 WUKANG。个体编号17，唤醒日为本轮任务第一天。'],
        ['M_DEAD16', '16号死亡状态', 'B02 前一代条目', '16号记录标记为 DECEASED，不是调离或当前休眠。'],
        ['M_DEAD_ALL', '01—15 的独立生命记录', 'B02 前代状态列表', '01—15均标记死亡，每位拥有独立唤醒及死亡记录。与16号合计为十六位前代。'],
        ['M_ORIGINAL_DEATH', '原武康早于继任体死亡', 'B02 原体与01号时间戳', '原武康死亡时间在01号唤醒之前。当前身体不等于原武康存活至今。'],
        ['M_REGISTRATION', 'WUKANG-17 独立个体登记', 'B02 身份终端', '当前身体已独立登记，旧身份授权解绑。广寒子的习惯称呼与权限身份并不是一回事。'],
        ['M_BIOSIGN', '17号生物签名', 'R03 生物采样', '指纹、脉搏、腕端一致，绑定当前17号个体。恢复基础调查权限，不开放核心最高日志。'],
        ['M_ECHO12', '不同步的12号残影', 'R05 维修板前', '玩家未抬手时残影抬手。缓存关联到12号，需摄像核验动作。'],
        ['M_CAMERA_RECORD', '三个机位的原始录像', 'R05 / R02 摄像头，R01 回放', '录像记录六个动作：确认走廊、关闭灯光、数墙板、触摸第三块、后退等待、指向下缘。'],
        ['E03', '前代数据库索引', '第二章 · R05 墙板后存储片', '12号留下通往 B03 的索引及损坏片段：“别再证明你是不是武康……”后半句尚未恢复。'],
        ['S_IDENTITY_PAIR', '02与09：同名还是改名', 'B03 身份申请组', '02坚持自己就是武康；09要求独立名字。相同记忆来源没有带来同一选择。'],
        ['S_FAMILY_PAIR', '04与11：依赖还是关闭家庭', 'B03 心理协议组', '04频繁依赖家庭恢复，11主动要求关闭入口。调用次数与申请均保存。'],
        ['S_CORE_PAIR', '06与13：破坏还是保护核心', 'B03 工程记录组', '06破坏供电，13恢复散热。工程日志确认行为，但不能独自证明全部动机。'],
        ['S_RETURN_PAIR', '12与16：离站与终止', 'B03 末次草稿组', '12继续准备离站，16讨论终止。16号末次留言被误归入原武康目录，缺失内容尚待修复。'],
        ['S_OTHER_LABELS', '其余八人的生活片段', 'B03 柜门标签', '01、03、05、07、08、10、14、15的短记录已保留，包含维修、测量、命名和私人片段。'],
        ['S_TIME_LAYER', '唤醒与死亡时间层', 'B03 索引重组第一轮', '各代开始与结束的工程时间戳已分开，禁止用同一模板名称合并成一个人的连续生平。'],
        ['S_BODY_LAYER', '培养舱与身体对应', 'B03 索引重组第二轮', '样本 BIO 编号对应个体培养舱。身体关联与记忆模板分列。'],
        ['S_MISFILE', '被误归档的16号签名', 'B03 索引重组第三轮', '权限签名归属于16号个体，而非原武康。留言的目录位置错误已确认。'],
        ['E04', '十六代完整记录', '第三章 · B03 重组索引', '原始层、人格层、主观层均完整保存。主观层默认盲存，保存不代表已经播放。'],
        ['E05', '16号损坏留言', '第三章 · B03 独立导出', '已找到并导出16号原留言。缺失段落不推测、不补写；当前尚不知道完整内容。'],
        ['S_BLIND_STORAGE', '三层保存与盲存声明', 'B03 权限确认', '三层均保存。主观层的播放权限关闭，没有删除任何已恢复文件。'],
        ['S_TERMINATION_NOTICE', '地球项目终止通知', 'R06 旧通信缓存', '基地接收缓存中有终止通知。为什么内部流程未执行尚无结论，需要更高层日志。'],
        ['S_AZHI_LETTER', '地球上阿芷的旧信', 'R06 旧通信缓存', '信中写小星已经长大，人不能只过等待的日子。此信为旧文件，不代表实时近况。'],
        ['S_VIDEO_METADATA', '成年小星影像的日期', 'R06 视频元数据', '文件时间为十六年前，人物年龄记录为24。元数据不表示当前年龄或即时连接。'],
        ['S_ADULT_VIDEO', '已观看的成年小星旧影像', 'R06 玩家手动播放', '成年小星谈到自己长大和母亲的生活，询问基地是否仍有人。原文件已保存，不能据此确认地球当前状态。'],
        ['S_AZHI_PAUSE', '阿芷主动暂停影像', 'F01 餐桌终端', '阿芷亲自打开并暂停文件，确认影像中的小星已经长大。她没有被自动替换为地球上的阿芷。'],
        ['S_WEDDING_REMOVED', '阿芷移除家庭结婚照', 'F01 家庭显示', '她删除的是家庭空间中的照片显示；原始照片仍保存在证据里。她拒绝让旧关系决定当前位置。'],
        ['S_CHILD_ISOLATION', '儿童房进程隔离', 'F01 → F03 房门', '阿芷锁上儿童房，阻止成年资料自动写入 XING-8。后续如何告诉他尚未决定。'],
        ['S_NAME_BOUNDARY', '阿芷要求改变称呼', 'F01 对话', '阿芷要求不再称她“老婆”，玩家以阿芷称呼。这个边界已明确提出。'],
        ['S_AZHI_READ', '三个锚点与完整阅读', 'F01 空间维护', '阿芷读完全部文件。餐桌读取、儿童进程隔离和入户空间索引保留，非必要区域可能由辅助程序冻结。'],
        ['S_SENT_REPLY', '致成年小星的回传副本', 'R06 · 第235天', s => MoonLater.replyText(s) + ' 状态：地球待确认；无送达或已读凭据。']
    ];
    rows.forEach(([id, title, source, text]) => add(id, title, source, text));

    function collected(s) {
        const ids = new Set(s.evidence || []);
        Object.values(entries).forEach(e => {
            if (e.when?.(s)) ids.add(e.id);
        });
        return [...ids].map(id => entries[id] || {id, title: id, source: '旧存档', text: '该记录已保存。'});
    }

    function render(root, s) {
        root.replaceChildren();
        const h = document.createElement('h2'), count = document.createElement('b'),
            intro = document.createElement('p'), list = document.createElement('div'), rows = collected(s);
        h.textContent = '证据档案';
        count.textContent = rows.length + ' 项';
        intro.textContent = '按调查线索整理。展开查看来源、已确认的事实与尚未解决的问题。';
        list.className = 'evidence-cards';
        const ul = document.createElement("ul");
        ul.hidden = true;
        root.append(h, count, intro, ul, list);
        rows.forEach(e => {
            const card = document.createElement('details'), summary = document.createElement('summary'),
                source = document.createElement('small'), body = document.createElement('p');
            card.dataset.evidence = e.id;
            summary.textContent = e.title;
            source.textContent = e.id + ' · ' + e.source;
            body.textContent = typeof e.text === 'function' ? e.text(s) : e.text;
            card.append(summary, source, body);
            list.append(card);
        });
        if (!rows.length) intro.textContent = '尚未取得重要记录。核验后的信息会自动保存在这里。';
    }

    globalThis.MoonEvidence = Object.freeze({entries, collected, render});
})();