"use strict";
(function(){
const L=(actor,text)=>({type:'line',actor,text}),W=text=>L('wukang',text),G=text=>L('guanghan',text),A=text=>L('azhi',text),X=text=>L('xing8',text),S=text=>L('system',text),T=text=>({...W('（'+text+'）'),thought:true});
const nodes={};
const point=(map,x,y,radius=95)=>({map,x,y,radius});
const pod={...MoonDay3.pod},exit={...MoonDay3.exit};
const photo={...point('R01',515,270,100),interactX:540,interactY:470};
const desk={...point('R01',570,220,110),interactX:630,interactY:490};
const piano={...point('F01',1390,430,105),interactX:1305,interactY:580};
const cold={...point('R05',1040,295,110),interactX:1100,interactY:480};
const cache={...point('R02',970,410,95),interactX:975,interactY:530};
const database={...point('R07',690,455,100),interactX:885,interactY:545};
const child={...point('F03',1025,575,110),interactX:895,interactY:620};
const table={...MoonPlacements.h01_dinner};
function add(id,title,p,label,queue,next,extra={}){nodes[id]={id,title,targets:[{id:id+'_action',...p,label,kind:'campaign'}],queue,next,...extra};}
function auto(id,title,queue,next,extra={}){nodes[id]={id,title,queue,next,auto:true,targets:[],...extra};}
const wake={map:'R03',x:860,y:480},home={map:'F01',x:755.4,y:743.7};
function homeExit(id,title,queue,next,day){add(id,title,exit,'从楼道结束休息',queue,next,{effects:{day},warpNext:wake});}
function sleep(id,title,queue,next){add(id,title,pod,'进入休眠舱',queue,next,{warpNext:home});}

auto('P00','序章 · 苏醒',[S('第一天广寒宫基地，休眠区'),G('舱液排放完成，舱锁一、二、三，已释放'),{type:'wait',seconds:2},G('生命体征稳定，工程师武康，请确认你能听见我'),W('听得见……我睡了多久？这里怎么这么冷？'),G('你正在结束休眠，我是基地管理系统广寒子，负责环境监控与维护协助'),G('这里是月面广寒宫基地你负责站内维修，我监控环境并提供操作协助值班与休眠交替进行，未列出的日常检查会记入轮班记录'),G('当前任务剩余三百六十五天氧循环效率低于标准，需要人工校准'),W('我记得自己是来做维护的……阿芷和小星……'),G('家庭相关的心理恢复程序将在维修完成后开放，舱内氧气含量较低，先保证你能安全呼吸'),W('好，先告诉我该怎么做'),G('先活动手脚用 {move} 移动，走到舱旁腕端终端，按 {interact} 拾取')],'P00_WRIST',{warp:wake,effects:{day:1,flags:{tutorial_started:true}}});
add('P00_WRIST','取回腕端终端',pod,'拿起腕端终端',[W('屏幕亮了OPERATOR: WUKANG……任务剩余365天'),G('身份记录已载入肌肉状态符合唤醒标准，通道门已解锁'),G('靠近门后按 {interact} 通行按 {map} 查看当前位置与任务房间；按 {journal} 查看目标'),G('按 {pause} 暂停对白逐字显示时，Space先显示全文，再按一次继续'),W('从休眠区出去，穿过中央通道，到维修区'),G('维修台上有过滤器和扳手，请不要带压拆开设备')],'P01_TOOLS',{effects:{flags:{wrist_acquired:true}}});
add('P01_TOOLS','准备氧循环维修',point('R04',1080,445),'领取过滤器与扳手',[W('新的滤芯、扳手，都在'),G('先检查三路压差，确认异常支路，再更换滤芯'),W('得先看看数据，再考虑修哪一路'),G('正确终端会逐步显示检修顺序；首次接错只给出漏气提示，超时由维护机构接管')],'P01_OXYGEN');
add('P01_OXYGEN','恢复氧气循环',point('R04',760,385),'打开氧循环检修面板',[G('检修盖已打开比较三路压差，找出堵塞的过滤支路')],'P02_PHOTO',{game:'oxygen',success:[G('循环效率恢复至任务标准'),W('耳朵里的闷响轻了一点……刚才谢谢你'),G('维修记录已保存，请前往个人宿舍，核对个人物品，然后返回休眠区休息')],failure:[G('时间耗尽维护机构接管最后步骤：更换滤芯，按流向接管，锁定绿色区间'),W('我看见它按刚才的顺序做完了'),G('循环效率恢复至任务标准先去宿舍核对个人物品，再休息')]});
add('P02_PHOTO','宿舍里的家庭照片',photo,'查看桌边家庭照片',[W('阿芷，还有小星照片边角被磨白了'),W('小星那时候还要踮着脚才能把头凑进镜头里，阿芷还在笑我连拍照都要板着个脸'),G('个人物品目录核验完成'),W('这个你不用核验……我认得他们'),G('休息许可已开放请返回R03，在休眠舱启动休息，休眠舱将会将你的意识传回家中'),W('嗯……终于可以回家看看了吗')],'P02_SLEEP',{illustration:'photo',effects:{flags:{family_photo_seen:true}}});
sleep('P02_SLEEP','第一次入睡',[G('维修完成，休眠程序可以启动'),W('明天还有工作……不管了，今晚我只想看看他们，和他们说说话'),G('请放松，呼吸保持平稳')],'H01');
nodes.P02_SLEEP.effects={chapter:1};

homeExit('H02_D5_DEPART','第五天的值班提醒',[S('腕端提醒：第五天轮班将开始，中央通道有一架维修无人机需要归位'),W('上次的检查做完了，这次要看看无人机，先回去')],'H02_D5_WAKE',5);
auto('H02_D5_WAKE','第五天 · 唤醒',[G('第五天，唤醒完成无人机停在中央通道，尚未接入充电座'),W('看来得确认它断电了再搬回去')],'H02_D5_DRONE',{warp:wake});
add('H02_D5_DRONE','让维修无人机归位',MoonPlacements.h02_d5_drone,'断电并归位无人机',[W('旋翼没有转动，看来电源已经断开了'),G('充电触点对齐后再锁紧支架'),W('好了，机身固定，指示灯正常'),G('设备已归位值班记录完成，请返回休眠区')],'H02_D5_SLEEP',{asset:'../img/props/base/h02-drone.png',drawSize:55});
sleep('H02_D5_SLEEP','结束第五天值班',[W('今天没在没事没事，应该能早点回家'),G('休眠程序启动')],'H02_D5_HOME');
auto('H02_D5_HOME','小星的积木',[A('回来啦，今天回来得挺早，小星一下午都在房间里摆弄他的飞船，你去陪陪他吧'),W('嗯好，我正要进去看看呢'),X('爸爸，帮我收一下地毯上的积木吧！先别踩到那块蓝色的')],'H02_D5_BLOCKS');
add('H02_D5_BLOCKS','和小星收拾模型',MoonPlacements.h02_d5_blocks,'收拾地毯上的积木',[W('蓝色的放这里，尖顶朝上……这样就不会散了'),X('对！明天我还想加两个翅膀'),W('那先把它放好，留着明天接着搭'),X('说好了，你要记得')],'H02_D6_DEPART',{effects:{flags:{day5_model_tidy:true}}});
homeExit('H02_D6_DEPART','第六天的值班提醒',[A('先洗手吃饭，小星的东西放好了就别动它了'),S('休息时段结束，第六天，通信链路例行自检'),W('我得回去做通信检查了，希望今天也能早些回家陪你们')],'H02_D6_WAKE',6);
auto('H02_D6_WAKE','第六天 · 通信自检',[G('唤醒完成请前往通信与旧缓存室，运行本地链路自检'),W('只是例行检查？'),G('目前没有确认的外部故障，先取得自检结果')],'H02_D6_COMMS',{warp:wake});
add('H02_D6_COMMS','运行通信自检',MoonPlacements.h02_d6_comms,'运行本地链路自检',[G('发送测试帧回环响应完整，校验通过'),W('至少这一次，屏幕上的结果很清楚'),G('本地链路正常检查结束，请返回休眠区')],'H02_D6_SLEEP');
sleep('H02_D6_SLEEP','第六天回家',[W('检查做完了，今天答应陪他们吃饭，赶紧回去吧'),G('休眠程序启动')],'H02_D6_HOME');
auto('H02_D6_HOME','熟悉的餐桌',[A('回来啦，真巧，饭刚好'),W('小星呢？'),A('就在桌边等你呢')],'H02_D6_SEAT');
add('H02_D6_SEAT','在餐桌前坐下',table,'在餐桌前坐下',[T('桌椅的位置，好像每次都一样')],'H02_D6_REPLY');
auto('H02_D6_REPLY','一句熟悉的话',[A('等你回来'),{type:'wait',seconds:.8},A('今天也累了吧？先吃饭'),W('……嗯'),X('爸爸，别忘了你答应我的翅膀')],'H03_DEPART');
homeExit('H03_DEPART','第七天前的休息',[W('我记着呢，等我下次回来，我们一起把它搭完'),S('又一轮值班开始'),G('第七天的例行检查已完成，返回休眠区休息')],'H03_SLEEP',7);
sleep('H03_SLEEP','第七天回家',[W('已经过了几天了，小星说要给我看一样东西'),G('休眠程序启动')],'H03_HOME');
auto('H03_HOME','小星的新画',[X('爸爸！我画了你回来的样子，画就放在房间里'),A('他画了很久，说一定要让你亲眼看看'),W('哈哈哈好，我这就去欣赏欣赏')],'H03_DRAW');
add('H03_DRAW','看看小星的画',child,'查看小星的画',[X('这是飞船，这是我们家，你从这里下来，我们在门口等你'),W('已经过去七天了'),{type:'wait',seconds:1.5},X('这么快已经过去七天了吗？那太好了，爸爸马上回来了！'),W('小星……爸爸就在这'),X('我还没画完，等我把门也画上'),W('他又低下头了先别打断他')],'H03_LEAVE',{illustration:'drawing',effects:{flags:{drawing_seen:true,dishes_silent:true}}});
homeExit('H03_LEAVE','回去核对日期',[W('腕端明明已经记了七天，回去看看宿舍的家庭日志'),G('休息结束，准备唤醒')],'H03_LOG',7);
add('H03_LOG','核对两处计时',desk,'打开宿舍家庭日志',[W('腕端剩余358天这里却还是365'),G('家庭日志显示：任务剩余365天'),W('感觉不像是时间慢了七天，好像是根本没有变化……'),G('该页面可能读取了旧缓存，建议检查中央通道的计时同步记录'),W('先查来源，我确定我看到了一个模糊的人影')],'H04_PASS',{effects:{flags:{clock_compared:true}}});
add('H04_PASS','检查中央通道',point('R02',755,475,100),'检查通道计时记录',[W('墙上的编号和腕端一致，沿这段通道再走一遍试试')],'H04_PASS2',{approach:true});
add('H04_PASS2','再次经过中央通道',point('R02',755,475,100),'再次经过通道',[W('刚才前面是不是有人？'),G('未检测到新增人员，缓存可能残留了运动轨迹'),W('那个人影走路的样子……怎么这么像……')],null,{approach:true,choice:{id:'echo_response',text:'查看残影留下的方向',options:[{id:'follow',text:'跟过去看看',effects:{node:'H04_FOLLOW'}},{id:'inspect',text:'先检查升降梯前厅',effects:{node:'H04_LIFT'}}]}});
add('H04_FOLLOW','追踪残影',point('R02',845,510,70),'查看人影消失处',[W('到这里就没了……没有人走进门'),G('请在前厅终端核验定位缓存')],'H04_CACHE');
add('H04_LIFT','调查升降梯前厅',point('R02',745,525,65),'检查前厅记录',[W('门没有开过，可刚才的轨迹明明就停在这儿'),G('请在前厅终端核验定位缓存')],'H04_CACHE');
add('H04_CACHE','停止缓存写入',cache,'查看并停止预测缓存',[G('检测到重复运动样本，推荐清理预测缓存'),W('先停止写入，覆盖以后就更不可能不知道刚才是什么了'),G('写入已停止，清理可恢复导航；保留副本需要离线迁移')],null,{choice:{id:'C01',text:'如何处理这份缓存？',options:[{id:'C01B',text:'断开并完整备份（默认）',effects:{node:'H04_MEDIUM',flags:{backup_complete:true}}},{id:'review_then_backup',text:'先复查目录，再完整备份',effects:{node:'H04_MEDIUM',flags:{backup_complete:true}}}]}});
add('H04_MEDIUM','拔出实体介质',cache,'断开并取下备份介质',[G('请把介质送往B区维修间的冷存柜'),W('现在去R05吧')],'H04_COLD',{effects:{flags:{carrying_cache:true,navigation_off:true}}});
add('H04_COLD','将介质送入冷存柜',cold,'插入介质并校验',[W('开始校验了'),G('完整性校验通过，发现十六组相似轨迹，但时序各不相同'),W('这不是刚才那一次留下的吗？'),G('只能确认有十六组人员记录，但其身份无法确定'),W('把摘要发给我'),G('已生成轨迹摘要非计划迁移已记录，操作不予阻止')],'H05_REHAB',{effects:{evidence:['E01'],flags:{carrying_cache:false,navigation_off:false},day:30}});
add('H05_REHAB','第三十天 · 记忆康复',point('R03',1010,355,100),'开始记忆康复训练',[G('轮班已推进至第三十天，记忆康复训练可以开始进行'),W('记忆康复训练是干什么的？'),G('训练将重建已有的档案，在训练过程中，你可以读取其中的过程，但你不能改变过去发生的事情'),W('我试试')],'H05_ARCHIVE1',{warpNext:{map:'A02',x:800,y:600},effects:{flags:{archive_mode:true}}});
add('H05_ARCHIVE1','档案交接 · 一',point('A02',600,390,80),'听取第一位同事交接',[L('colleague1','武康，昨天的供氧工作我只进行了临时旁通，你记得签领一下正式滤芯'),W('好，我来换滤芯，再把气压校准一下'),L('colleague1','慢点做，别赶着下班')],'H05_ARCHIVE2');
add('H05_ARCHIVE2','档案交接 · 二',point('A02',800,310,80),'听取第二位同事交接',[L('colleague2','轮班表在维修台上，你休息的那天我会替你补通信记录'),W('谢谢你，回去以后我请你吃饭'),L('colleague2','这句话我会记着的')],'H05_ARCHIVE3');
add('H05_ARCHIVE3','档案交接 · 三',point('A02',1220,400,80),'听取第三位同事交接',[L('colleague3','家里又来消息了？刚才看你一直摸口袋'),W('小星说他刚刚学会了一个新成语，非要说给我听'),L('colleague3','那你快去签字吧，别让小星等你太久了')],'H05_SIGN');
add('H05_SIGN','档案维修区签字',point('A04',1100,450,100),'核对交接并签字',[W('滤芯、压差、轮班表……都核对过了'),L('colleague1','在这里签个字，剩下的工作由我们来做')],'H05_TRAIN',{warpNext:home});
add('H05_TRAIN','档案中的旋律',piano,'跟随提示弹奏',[X('爸爸，你弹一下刚才那个旋律！'),W('好，咱们先听这一段')],'H05_BACK',{game:'piano-practice',success:[X('爸爸弹得真好！我以后也要学钢琴！')],failure:[S('档案示范继续播放正确旋律'),X('爸爸弹得真好！我以后也要学钢琴！')],warpNext:{map:'R03',x:1010,y:355},effects:{flags:{archive_mode:false}}});
sleep('H05_BACK','结束康复训练',[G('重建结束'),W('虽然刚才的经历很真实，可现在想想，我感觉连他们的脸都没看清'),W('今天有点累了，回家看看吧')],'H05_HOME');
auto('H05_HOME','同一架钢琴',[X('爸爸，今天也弹一段吧！就昨天那个曲子'),W('哪一段曲子？我不记得我之前在家里弹过'),A('他期待一天了，你快试试吧')],'H05_PIANO');
add('H05_PIANO','弹奏熟悉的旋律',piano,'为小星弹琴',[T('难道是刚刚在记忆康复训练中他弹的那一曲？'),W('旋律应该一样，指法我应该也记得')],'H06_DEPART',{game:'piano',success:[X('就是这个！爸爸弹得真好！'),W('奇怪……')],failure:[X('好像和以前不一样了'),A('太久没练了，慢慢来'),T('钢琴出问题了？……先别乱想')]});
homeExit('H06_DEPART','第七十天的维护请求',[S('继续轮班，日次已经推进到了第七十天'),G('终端收到了人格数据库接口维护请求，请您先查看工单'),W('先去宿舍看看本次工作的要求')],'H06_REQUEST',70);
add('H06_REQUEST','查看维护工单',desk,'读取只读接口维护请求',[G('R07只读接口失效，授权范围：修复读取链路，核验关联条目，禁止修改其中的人格内容'),W('我知道了'),G('维修完成后，请依次查看模型名称、资料截止时间和当前运行位置')],'H06_INTERFACE');
add('H06_INTERFACE','修复只读接口',database,'校准三个读取通道',[G('按提示校准三条读取通道，不要修改源数据')],'H06_NAME',{game:'interface',success:[G('只读接口已恢复，请亲自打开三个字段')],failure:[G('超时，校准辅助已接管只读通道恢复，仍需你核验字段')]});
add('H06_NAME','字段一 · 模型名称',database,'打开模型名称字段',[S('模型名称：AZHI / XING-8关联场景：家庭'),T('阿芷……小星？为什么这里会有他们的名字？'),G('请继续核验来源信息')],'H06_CUTOFF');
add('H06_CUTOFF','字段二 · 资料截止',database,'打开资料截止时间字段',[S('资料截止时间：提供者离开地球之前，此后并未接入实时家庭更新'),T('没有实时更新？我每次回去看到的是什么？')],'H06_LOCATION');
add('H06_LOCATION','字段三 · 运行位置',database,'打开当前运行位置字段',[S('当前运行位置：广寒宫基地本地人格数据库'),W('我的意识不是传回家里了吗，为什么他们一直在这里运行？'),G('三个字段已核验，AZHI与XING-8条目摘要可以保存'),T('把摘要带回去，我要问问她到底怎么回事')],'H06_SLEEP',{effects:{evidence:['E02']}});
sleep('H06_SLEEP','带着条目回家',[G('休眠程序启动')],'H06_NORMAL');
add('H06_NORMAL','先与阿芷说说话',MoonPlacements.h01_azhi,'与阿芷交谈',[A('你回来啦？今天的菜还给你留着'),W('你今天……在家里做什么了？'),A('收拾屋子，陪小星玩积木，你怎么突然问起这个啦？'),W('没什么……'),A('你脸色不太好欸，在那边的工作出问题了吗？'),W('我在数据库里看见了一份资料，和你与小星有关')],'H06_CHOICE',{actor:'azhi'});
add('H06_CHOICE','一起查看条目',MoonPlacements.h01_azhi,'向阿芷出示条目',[A('什么资料啊？拿给我看看')],null,{actor:'azhi',choice:{id:'C02',text:'怎么处理这份记录？',options:[{id:'C02B',text:'和阿芷共同查看',effects:{node:'H06_DENY'}},{id:'verify_together',text:'说明核验过程，和阿芷共同查看',effects:{node:'H06_DENY'}}]}});
auto('H06_DENY','她记得的生活',[W('这两个模型名称是你们的名字，资料更新时间停止在我离开地球之前，运行位置就在基地，它根本没有实时更新'),A('不可能啊，昨天你还帮我收东西呢，上周小星把水洒了一桌，这些事情我都记得'),W('我也记得'),A('咱们有这些记忆，我感觉只凭一个模型名字说明不了什么……'),{type:'wait',seconds:1},A('等一下，我想自己看看那份摘要')],'H06_INDEX');
add('H06_INDEX','让阿芷核验记忆索引',table,'打开记忆索引给阿芷',[S('源资料索引末条：其后均为基地本地交互记录'),A('来源栏竟然不是地球……而是……本地'),A('昨天的事我明明记得那么清楚，可是这里发生的事情，竟然是本地交互产生的'),{type:'wait',seconds:2},S('阿芷关闭了索引窗口'),W('阿芷……'),A('让我自己冷静一会儿')],'H06_QUIET',{effects:{family_state:'S1',flags:{index_verified:true}}});
add('H06_QUIET','陪她坐一会儿',table,'留在餐桌旁',[A('小星还在玩积木……'),W('他还不知道这件事'),{type:'wait',seconds:2},A('今晚先到这里吧')],'CHAPTER1_COMPLETE',{effects:{chapterComplete:true,flags:{chapter1_complete:true}}});
nodes.H02_D3_COMPLETE={...nodes.H02_D5_DEPART,id:'H02_D3_COMPLETE',targets:nodes.H02_D5_DEPART.targets.map(o=>({...o,id:'H02_D3_COMPLETE_action'}))};

const familyExitReminder={...exit,id:'family_exit_reminder',label:'还有未完成的家庭互动',queue:[T('小星还等着让我看他的画')],kind:'campaign-optional',optional:true};
const modelReset={...MoonPlacements.h02_d5_blocks,id:'model_reset',label:'看看昨天收好的模型',queue:[W('模型怎么又乱了'),W('昨天放好的蓝色积木，竟然回到了原来的地方')],kind:'campaign-optional',optional:true};
const optional=[{id:'empty_pod',...point('R03',425,260,100),interactX:425,interactY:380,label:'看看旁边的空舱',queue:[W('舱里是空的')]},{id:'health_screen',...point('R03',1010,355,90),label:'查看体检屏',queue:[S('肌肉状态符合唤醒标准'),W('至少我现在还是自由的')]},{id:'family_voice',...desk,label:'听一段家庭留言',queue:[A('饭会给你留着'),W('录音很短，我却听了两遍')]},{id:'piano_note',...point('R01',560,320,100),interactX:550,interactY:500,label:'查看电子琴练习说明',queue:[S('四个声部按同一节拍轮流进入'),W('之前教小星时，我好像也说过这句话')]}];
class Campaign{
 constructor(story){this.story=story;this.approachArmed=false;this.lastNode=story.state.node;}
 get node(){return nodes[this.story.state.node];}
 get objects(){const s=this.story.state;const def=this.node;if(!def)return [];const items=(def.targets||[]).map(o=>({...o,actor:def.actor,asset:def.asset,drawSize:def.drawSize,approach:def.approach}));if(s.node.startsWith('P0'))items.push(...optional.filter(o=>!s.oneShotEvents.includes('optional_'+o.id)).map(o=>({...o,kind:'campaign-optional',optional:true})));if(!globalThis.MoonInvestigation&&s.flags.day5_model_tidy&&['H02_D6_HOME','H02_D6_SEAT','H02_D6_REPLY','H03_DEPART','H03_HOME','H03_DRAW','H03_LEAVE'].includes(s.node)&&!s.oneShotEvents.includes('optional_model_reset'))items.push({...modelReset});if(['H03_HOME','H03_DRAW'].includes(s.node))items.push({...familyExitReminder});return items;}
 automatic(){const def=this.node;return def?.auto?this.act(def.id+'_auto'):false;}
 act(id,fromApproach=false){const def=this.node;if(!def||this.story.busy||(def.approach&&!fromApproach))return false;const opt=[...optional,modelReset,familyExitReminder].find(o=>o.id===id&&this.objects.some(item=>item.id===id));if(opt)return this.story.run({id:'optional_'+id,once:id!=='family_exit_reminder',queue:opt.queue});if(!def.auto&&!def.targets.some(o=>o.id===id))return false;if(def.game){window.dispatchEvent(new CustomEvent('moon:campaign-game',{detail:{node:def.id,game:def.game,title:def.title}}));return true;}return this.commit(def);}
 commit(def,result=null){const queue=result?[]:[...(def.queue||[])];if(def.illustration&&queue.length)queue[0]={...queue[0],illustration:def.illustration};if(def.choice)queue.push({type:'choice',...def.choice});if(result)queue.push(...(result.success?def.success||[]:def.failure||[]));const effects={completedTasks:[def.id],checkpointId:def.id,...def.effects};if(result&&Number.isFinite(result.score))effects.minigameResults={[def.id]:result};if(def.next)effects.node=def.next;if(result&&def.game==='oxygen'&&!result.success)effects.mental_value=this.story.state.mental_value-10;if(result&&def.game==='piano'){effects.piano_clear=result.success;if(result.success)effects.mental_value=this.story.state.mental_value+10;}return this.story.run({id:'campaign_'+def.id,requires:{node:def.id},queue,effects});}
 finishGame(node,result){const def=this.node;if(!def||def.id!==node||!def.game)return false;return this.commit(def,result);}
 approach(map,x,y){const def=this.node;if(!def?.approach)return;const o=def.targets[0],inside=o.map===map&&Math.hypot(x-o.x,y-o.y)<o.radius;if(this.lastNode!==def.id){this.lastNode=def.id;this.approachArmed=false;}if(!inside)this.approachArmed=true;if(inside&&this.approachArmed&&!this.story.busy){this.approachArmed=false;this.act(o.id,true);}}
 destination(node,previous){return nodes[previous]?.warpNext||nodes[node]?.warp||null;}
}
const actors={guanghan:{name:'广寒子',role:'基地管理系统',portrait:''},colleague1:{name:'同事的声音',role:'档案交接',portrait:''},colleague2:{name:'同事的声音',role:'档案交接',portrait:''},colleague3:{name:'同事的声音',role:'档案交接',portrait:''}};
globalThis.MoonCampaign=Object.freeze({Controller:Campaign,nodes,actors,objectives:s=>nodes[s.node]?.targets||[],optional,points:{photo,desk,piano,cold,cache,database,child}});
})();
