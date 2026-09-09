"use strict";
(function () {
    const n = MoonCampaign.nodes, p = MoonPlacements;
    const L = (actor, text) => ({type: 'line', actor, text}), W = t => L('wukang', t), A = t => L('azhi', t),
        X = t => L('xing8', t), G = t => L('guanghan', t), S = t => L('system', t),
        T = t => ({...W('（' + t + '）'), thought: true});

    function add(id, title, point, label, queue, next, extra = {}) {
        n[id] = {id, title, targets: [{...point, id: id + '_action', label, kind: 'campaign'}], queue, next, ...extra};
    }

    function auto(id, title, queue, next, extra = {}) {
        n[id] = {id, title, targets: [], auto: true, queue, next, ...extra};
    }

    auto('H02_D3_COMPLETE', '第四天夜 · 阳台', [A('回来了？水壶还在阳台，进门别踢着。'), W('我去收。'), T('昨晚浇了不少水。去看看，别把根泡坏了。')], 'H02_D4_SOIL', {effects: {flags: {soil_question: true}}});
    add('H02_D4_SOIL', '看看昨晚浇过的花', p.h02_d3_plant, '查看花盆', [], 'H02_D4_ASK', {
        game: 'soil-check',
        success: [T('干的。和昨天浇水前一样。'), T('连中间那道裂纹都还在。可昨晚水都流进接水盘了……'), W('阿芷？你动过这盆花吗？')],
        effects: {flags: {soil_checked: true}}
    });
    add('H02_D4_ASK', '问阿芷有没有动过花盆', p.h01_azhi, '问问阿芷', [A('没有啊，怎么了？'), W('昨天刚浇透，今天又干成这样。'), A('你昨天浇过？'), W('你让我浇的。后来我们还在桌边坐了一会儿。'), A('哦……是吗。'), {
        type: 'wait',
        seconds: .6
    }, A('那今天先别浇了，过来吧。'), T('她怎么连这也不记得了。')], 'H02_D5_DEPART', {
        actor: 'azhi',
        effects: {flags: {soil_reviewed: true}}
    });
    n.H02_D5_DEPART.queue = [S('腕端震动。第五天的轮班提醒。'), T('明明浇过的……算了，先回去上班。')];
    n.H02_D5_DRONE.game = 'drone';
    n.H02_D5_DRONE.success = [G('充电触点已接通。'), W('这下不会堵在过道上了。'), G('本次工单完成。')];
    n.H02_D5_BLOCKS.queue = [W('你扶着船身，我把这块蓝色的卡进去。'), X('慢点，白色那块还没放稳。'), W('这样呢？'), X('好了！爸爸，别拆，明天还要装尾巴。'), W('谁拆谁是小狗。'), X('你也算！'), W('我也算。'), T('蓝色这块卡得有点紧。明天拿的时候得轻一点。')];
    n.H02_D5_BLOCKS.effects = {flags: {day5_model_tidy: true, model_baseline: true}};
    n.H02_D6_COMMS.game = 'comms';
    n.H02_D6_COMMS.success = [G('站内回环正常。'), W('今天能收到地球的消息吗？'), G('本次检查不包含地月链路。'), W('……知道了。')];
    n.H02_D6_HOME.queue = [A('小星等你半天了，说要装什么尾巴。'), W('飞船的。他昨天还不让我拆呢。')];
    n.H02_D6_HOME.next = 'H02_D6_MODEL_CHECK';
    add('H02_D6_MODEL_CHECK', '去拿昨晚搭好的飞船', p.h02_d5_blocks, '查看飞船', [T('拆了？'), T('蓝色的又在地毯边上。白色的在桌脚……和昨天收拾以前，一模一样。')], 'H02_D6_MODEL_ASK', {effects: {flags: {model_question: true}}});
    add('H02_D6_MODEL_ASK', '问小星是谁拆了飞船', p.h01_xing8, '问问小星', [W('飞船怎么拆了？不是说谁拆谁是小狗吗？'), X('我没拆。'), W('你拿下来玩过？'), X('没有！我一直等你装尾巴。'), W('好，爸爸没怪你。'), X('昨天还是你把蓝色那块按进去的。可紧了。'), T('他记得。连那块积木很紧都记得。'), T('那是谁拆的？')], 'H02_D6_SEAT', {
        actor: 'xing8',
        effects: {flags: {model_reviewed: true}}
    });
    n.H02_D6_REPLY.next = 'H02_D6_REPEAT';
    add('H02_D6_REPEAT', '问问刚才那句话', p.h01_dinner, '和阿芷说话', [W('你刚才说什么？'), A('先吃饭啊。'), W('前一句。'), A('等你回来。怎么了？'), W('我不是已经回来了？'), A('……顺口嘛。'), T('连停顿都一样。第一晚，她也是这么说的。')], 'H03_DEPART', {effects: {flags: {repeat_reviewed: true}}});
    n.H03_DEPART.queue = [T('花盆、积木……还有这句话。怎么每次回来，都像从同一个晚上开始。'), S('第七天。例行值守结束。'), G('请返回休眠舱。')];
    n.H03_DRAW.queue = [X('这里是飞船。你从这里下来，我和妈妈就在门口。'), W('已经过去七天了。'), {
        type: 'wait',
        seconds: 1.5
    }, X('真的吗？那太好了，爸爸马上回来了！'), W('小星……爸爸就在这儿。'), X('门还没画好。爸爸，你等一下。'), T('他没听见？'), T('腕端已经少了七天。宿舍那本家庭日志呢？我得回去看看。')];
    n.H03_DRAW.effects.flags = {...n.H03_DRAW.effects.flags, drawing_question: true};
    n.H03_LOG.queue = [S('腕端：剩余358天。家庭日志：剩余365天。'), T('一边少了七天，一边一天都没动。'), W('广寒子，这个数字为什么没变？'), G('家庭日志可能仍在读取旧缓存。'), W('最后一次更新是什么时候？'), G('中央通道的同步节点存有来源记录。'), W('我自己去看。先别清。')];
    n.H03_LOG.effects.flags = {...n.H03_LOG.effects.flags, clock_verified: true};
    n.H04_PASS.queue = [G('来源记录读取中。退出感应范围，指示灯复位后再靠近。'), W('好。')];
    n.H04_PASS2.title = '退开后重新靠近读取器';
    n.H04_PASS2.queue = [T('前面那是谁？'), G('未检测到其他人员。'), W('我看见他走过去了。'), G('可能是运动预测缓存重叠，也可能是定位器故障。'), T('走路的样子……怎么那么像我。')];
    n.H04_FOLLOW.queue = [W('人呢？'), T('门没开过。他在这里就没了。'), G('前厅终端可以读取定位缓存。')];
    n.H04_LIFT.queue = [T('门没开过。地上也没有脚印。'), G('前厅终端可以读取定位缓存。')];
    n.H04_CACHE.queue = [G('检测到重复运动样本。建议清理预测缓存。'), W('别清。先停写入。'), G('已停止。保留副本需要取出介质，转入冷存柜。'), W('那就取出来。')];
    n.H04_MEDIUM.queue = [S('连接灯熄灭。'), W('拔下来了。'), G('导航路线暂时停用。冷存柜在R05，可按房间编号前往。'), W('R05。知道了。')];
    n.H03_LEAVE.queue = [T('七天。我得看看那本日志，到底记到了哪一天。'), G('准备唤醒。')];
    n.H03_SLEEP.queue = [T('小星说给我画了一张画。'), G('休眠程序启动。')];
    n.H02_D5_SLEEP.queue = [T('今天收工早。答应小星搭飞船，别又忘了。'), G('休眠程序启动。')];
    n.H02_D6_DEPART.queue = [W('明天接着搭，别让妈妈收走了。'), A('听见了。你放心上班吧。'), S('第六天。通信例检。')];
    n.H02_D6_SLEEP.queue = [T('昨天那架飞船，该装尾巴了。'), G('休眠程序启动。')];
    n.H04_COLD.queue = [G('完整性校验通过。共十六组运动轨迹。'), W('十六组？不是刚才那一条？'), G('十六组，时间不同。'), T('屏幕上的步幅、转身……都像是同一个人。'), W('把它们留下。'), G('已保存。非计划迁移已记录。')];
    n.H05_REHAB.queue = [S('第三十天。十六组轨迹仍在冷存柜里。'), G('你申请查看的旧日工作档案已开放。'), W('我想看看，以前的我到底是怎么干活的。'), G('这是只读重建，不能改变过去。'), W('开始吧。')];
    auto('H05_REFLECT', '离开康复终端', [G('档案重建结束。'), T('那些话，我怎么接得那么顺。连想都没想。'), T('可那几个人的脸……我一张都想不起来。'), W('今天先到这儿。我想休息。')], 'H05_BACK');
    n.H05_TRAIN.next = 'H05_REFLECT';
    n.H05_TRAIN.warpNext = {map: 'R03', x: 1010, y: 355};
    n.H05_BACK.queue = [T('刚才那首曲子，小星小时候总让我弹。'), G('休眠程序启动。')];
    n.H05_PIANO.queue = [T('手放上来，应该就会了。')];
    n.H05_PIANO.success = [X('就是这个！再来一次！'), A('先让爸爸歇歇。'), T('刚才那一下，手总算跟上了。')];
    n.H05_PIANO.failure = [X('好像和以前不一样了。'), A('太久没练了。慢慢来。'), T('钢琴出问题了？'), T('不对……是我的手没跟上。')];
    n.H05_PIANO.effects = {flags: {piano_question: true}};
    n.H06_DEPART.queue = [S('第七十天。腕端收到一份新工单。'), G('你提交的家庭记录查询已获批准。关联的只读接口需要维修。'), T('他们记得我说过的话，家里的东西却留不住昨天。'), W('这次能查到来源了？'), G('维修完成后可以查看。')];
    n.H06_REQUEST.queue = [S('工单：修复R07只读接口。关联目录：家庭。禁止写入。'), W('只读就够了。'), G('接口恢复后，依次打开名称、资料截止时间和运行位置。')];
    n.H06_NAME.queue = [S('模型名称：AZHI / XING-8。关联场景：家庭。'), T('阿芷。小星。'), W('为什么叫“模型”？'), G('请继续查看来源字段。')];
    n.H06_CUTOFF.queue = [S('源资料截止：离开地球之前。未接入此后的实时家庭更新。'), W('可我昨天还和他们说过话。'), G('那些属于本地交互记录。'), T('昨天的话是新的。那他们呢？')];
    n.H06_LOCATION.queue = [S('运行位置：广寒宫基地，本地人格数据库。'), T('不是地球。就在这座基地里。'), W('把这三页给我。'), G('已保存条目副本。'), T('阿芷……你知道吗？')];
    n.H06_SLEEP.queue = [W('我想见她。'), G('休眠程序启动。')];
    n.H06_NORMAL.queue = [A('怎么这么晚？锅里给你留着。'), W('你今天做什么了？'), A('洗衣服，收拾小星那一地积木。还能做什么。'), W('……嗯。'), A('你怎么了？'), W('我查到一份记录。上面有你和小星的名字。')];
    n.H06_CHOICE.queue = [A('什么记录？拿来我看看。')];
    n.H06_DENY.queue = [W('它说，你们的资料停在我离开地球之前。现在……在基地里运行。'), A('你看错了吧。'), A('昨天你还在这儿吃饭。上周小星打翻水，也是咱俩擦的。'), W('我记得。'), A('结婚那天呢？下那么大雨，你连伞都忘了。最后是我把外套顶在头上，拉着你跑。'), W('我记得。'), {
        type: 'wait',
        seconds: 1
    }, A('……记忆索引在哪儿？'), W('这里。'), A('打开。让我看。')];
    n.H06_INDEX.queue = [S('源资料末条：离开地球之前。此后：本地交互。'), A('昨天的晚饭在这里。'), {
        type: 'wait',
        seconds: 1
    }, A('来源……本地。'), T('她往下翻了一页，又翻了一页。'), A('全是本地。'), {
        type: 'wait',
        seconds: 2
    }, A('可我记得啊。'), W('阿芷……'), A('先别说。'), S('阿芷合上了窗口。')];
    n.H06_INDEX.effects.flags = {...n.H06_INDEX.effects.flags, family_source_verified: true};
    n.H06_QUIET.queue = [W('我陪你坐一会儿。'), A('……嗯。'), {
        type: 'wait',
        seconds: 2
    }, A('小星还没睡。先别跟他说。'), W('好。'), A('今晚先到这里。')];
    for (const [id, game] of [['P01_TOOLS', 'tools'], ['H04_COLD', 'cache-match'], ['H05_SIGN', 'archive-sort']]) {
        n[id].game = game;
        n[id].success = n[id].queue;
        n[id].queue = [];
    }
    for (const id of ['P01_TOOLS', 'H02_D5_DRONE', 'H02_D6_COMMS', 'H02_D4_SOIL', 'H04_COLD', 'H05_SIGN']) n[id].failure = [S('协助完成。'), ...n[id].success];

    function notes(s) {
        const f = s.flags, rows = [];
        if (f.soil_question) rows.push(f.soil_reviewed ? '花盆：浇透后又变干，裂纹未变。阿芷说没动过。' : '花盆：昨晚浇过水，去阳台查看。');
        if (f.model_baseline) rows.push(f.model_reviewed ? '飞船：零件回到了收拾前的位置。小星记得搭建，说没拆过。' : '飞船：昨晚已拼好，小星说今天继续装尾巴。');
        if (f.repeat_reviewed) rows.push('餐桌：阿芷再次说“等你回来”，连停顿都一样。');
        if (f.drawing_question) rows.push(f.clock_verified ? '日期：腕端358天，家庭日志365天。' : '画：小星说“爸爸马上回来了”。去宿舍对照日期。');
        if (s.evidence.includes('E01')) rows.push('冷存柜：保存了十六组不同时间的轨迹。');
        if (f.piano_question) rows.push('钢琴：档案和家中演奏的是同一段曲子。');
        if (s.evidence.includes('E02')) rows.push(f.family_source_verified ? '家庭条目：阿芷亲自看过索引，截止之后的记录都来自本地。' : '家庭条目：资料截止于离开地球前，运行在基地本地。');
        return rows;
    }

    globalThis.MoonInvestigation = Object.freeze({
        thought: () => '', notes, notice(story, map, x) {
            if (story.state.node === 'H04_COLD' && map === 'R02' && x < 900 && !story.state.flags.heard_cache_steps) return story.run({
                id: 'cache_steps_thought',
                queue: [T('我停了。为什么还有脚步声？')],
                effects: {flags: {heard_cache_steps: true}}
            });
            return false;
        }
    });
})();