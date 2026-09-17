"use strict";
(function(){
const query=new URLSearchParams(location.search),testing=MoonHistory.testing,flowing=MoonHistory.flowing,flowchartOnly=query.get('flowchart')==='1';
const historyKey='moon_without_return_flow_history_v1';
const runtimeSeen=new Set();
const manual=[
 {id:'H01',title:'第一天 · 回到家中',chapter:1,next:'H01_COMPLETE'},{id:'H01_COMPLETE',title:'第一天结束 · 离家提示',chapter:1,next:'H02_D3_WAKE'},
 {id:'H02_D3_WAKE',title:'第三天 · 休眠区苏醒',chapter:1,next:'H02_D3_REAL'},{id:'H02_D3_REAL',title:'第三天 · 维修温控',chapter:1,next:'H02_D3_RETURN'},
 {id:'H02_D3_RETURN',title:'第三天 · 返回休眠舱',chapter:1,next:'H02_D3_HOME'},{id:'H02_D3_HOME',title:'第三天 · 给盆栽浇水',chapter:1,next:'H02_D3_WATERED'},
 {id:'H02_D3_WATERED',title:'第三天 · 晚餐对话',chapter:1,next:'H02_D3_DEPART_HOME'},{id:'H02_D3_DEPART_HOME',title:'第三天 · 结束休息',chapter:1,next:'H02_D3_NEXT_REST'},
 {id:'H02_D3_NEXT_REST',title:'第四天 · 返回休眠舱',chapter:1,next:'H02_D3_COMPLETE'},{id:'H02_D3_COMPLETE',title:'第四天 · 再次回家',chapter:1,next:'H02_D5_DEPART'}
];
const definitions=new Map([...manual.map(d=>[d.id,d]),...Object.values(MoonCampaign.nodes).map(d=>[d.id,d])]);
function readBook(){try{const value=JSON.parse(localStorage.getItem(historyKey)||'null');if(!value||typeof value!=='object'||Array.isArray(value))return{lineage:'pending',nodes:{},lineages:{}};if(!value.lineages||typeof value.lineages!=='object'){value.lineages={};if(value.lineage)value.lineages[value.lineage]={nodes:value.nodes||{}};}if(!value.nodes||typeof value.nodes!=='object')value.nodes={};if(!value.lineage)value.lineage='pending';return value;}catch{return{lineage:'pending',nodes:{},lineages:{}};}}
function readBookFor(lineage){
 const book=readBook();
 const stored=lineage&&book.lineages&&book.lineages[lineage]?(book.lineages[lineage].nodes||{}):(book.lineage===lineage?(book.nodes||{}):{});
 let logNodes={};
 if(lineage){
  try{
   const raw=localStorage.getItem('moon_log_'+lineage),rows=raw?JSON.parse(raw):null;
   if(Array.isArray(rows))for(const row of rows){if(!row||!row.node||logNodes[row.node])continue;logNodes[row.node]={node:row.node,day:Number.isFinite(row.day)?row.day:1,schemaVersion:3,chapter:1,flags:{log_id:lineage},choices:{},evidence:[],completedTasks:[],currentMap:'F01',playerPosition:{x:755.4,y:743.7},checkpointId:row.node,_placeholder:true};}
  }catch(error){}
 }
 return{lineage:lineage||book.lineage||'pending',nodes:{...logNodes,...stored}};
}
function writeBook(book){try{if(!book.lineages||typeof book.lineages!=='object')book.lineages={};if(book.lineage)book.lineages[book.lineage]={...book.lineages[book.lineage],nodes:book.nodes||book.lineages[book.lineage]?.nodes||{}};localStorage.setItem(historyKey,JSON.stringify(book));}catch{}}
function snapshot(){const s=story.state;return MoonStorage.migrateSave({...s,currentMap:mapId,playerPosition:{...position}})||s;}
function record(){if(testing||flowing||flowchartOnly)return;const state=snapshot(),lineage=state.flags.log_id||'pending',book=readBook();runtimeSeen.add(state.node);if(!book.lineages||typeof book.lineages!=='object')book.lineages={};if(!book.lineages[lineage])book.lineages[lineage]={nodes:{}};book.lineages[lineage].nodes[state.node]=state;book.lineage=lineage;book.nodes=book.lineages[lineage].nodes;writeBook(book);}
setTimeout(record,80);window.addEventListener('moon:progress-changed',event=>{if(event.detail?.node)runtimeSeen.add(event.detail.node);if(activeOverlay==='story-flow')render();setTimeout(record,80);});window.addEventListener('moon:game-saved',event=>{if(event.detail?.node)runtimeSeen.add(event.detail.node);if(activeOverlay==='story-flow')render();setTimeout(record,30);});

const probe=()=>{const s=MoonStorage.clone(story.state);s.flags={...s.flags,bio17:true,index12:true,lift_unlocked:true,independent17:true,core_access:true,bio_area_access:true,wrist_acquired:true,h01_started:true,azhi_night1:true,azhi_night2:true,azhi_night3:true,auth_restored:true,termination_draft:true,family_plan_ready:true,copy_permission:true,rescue_confirmed:true,unmanned_ship:true,witness_complete:true};s.evidence=Object.keys(MoonEvidence.entries);s.choices={C01:'C01B',C02:'C02B',C03:'C03B',C04:'C04B',C05:'C05A',C06:'C06A',C07:'C07B',C08:'C08B',C09:'C09A',C10:'C10A',C12:'C12A',C13:'C13B',C14:'C14A',C15:'C15A',C16:'C16A',FINAL:'F-A'};return s;};
for(const [chapter,entry]of Object.entries(MoonLater.chapters))if(entry.next)definitions.set('CHAPTER'+chapter+'_COMPLETE',{id:'CHAPTER'+chapter+'_COMPLETE',title:entry.title+' · 结束',next:entry.next});
definitions.set('GAME_COMPLETE',{id:'GAME_COMPLETE',title:'结局 · 故事结束'});
function resolved(def,state){try{return def.prepare?{...def,...(def.prepare(state)||{})}:def;}catch{return def;}}


function testRoute(current){
 const pending=[{id:'P00',cost:0,path:[],choices:{}}],best=new Map();
 const fallback=probe();fallback.choices={...fallback.choices,...current.choices};
 while(pending.length){
  pending.sort((a,b)=>a.cost-b.cost);
  const item=pending.shift();if(best.has(item.id))continue;best.set(item.id,item);
  const path=[...item.path,item.id];
  if(item.id===current.node)return{nodes:path,choices:item.choices};
  const def=definitions.get(item.id);if(!def)continue;
  const variants=[resolved(def,current),resolved(def,fallback)];
  for(const [variant,d]of variants.entries()){
   const choices=[d.choice,...(d.queue||[]).filter(x=>x.type==='choice')].filter(Boolean);
   const edges=choices.flatMap(choice=>choice.options.filter(o=>o.effects?.node).map(option=>({id:option.effects.node,choice:choice.id,option:option.id})));
   if(!edges.length&&d.next)edges.push({id:d.next});
   for(const edge of edges){
    if(best.has(edge.id))continue;
    const mismatch=edge.choice&&current.choices?.[edge.choice]&&current.choices[edge.choice]!==edge.option;
    pending.push({id:edge.id,cost:item.cost+1+(mismatch?10000:0)+variant*1000,path,choices:edge.choice?{...item.choices,[edge.choice]:edge.option}:item.choices});
   }
  }
 }


 const entry=Number(current.chapter)>1?MoonLater.chapters[Number(current.chapter)-1]?.next:'P00';
 const prefix=best.get(entry);
 return{nodes:[...new Set([...(prefix?[...prefix.path,entry]:['P00']),current.node])],choices:prefix?.choices||{}};
}

const layer=document.createElement('section');layer.id='story-flow';layer.className='overlay ui-layer story-flow-overlay';layer.hidden=true;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','story-flow-title');
layer.innerHTML='<div class="panel-large story-flow-panel"><header class="panel-heading"><div><small>STORY ROUTE</small><h1 id="story-flow-title">剧情流程图</h1></div><button type="button" class="flow-close">返回</button></header><div class="flow-toolbar"><input type="search" aria-label="搜索剧情节点" placeholder="搜索剧情或节点编号"><button type="button" class="flow-latest" hidden>返回最新进度</button></div><p class="flow-note"></p><div class="story-flow-chart"></div></div>';
document.querySelector('#map-game').append(layer);
const launch=document.createElement('button');launch.type='button';launch.textContent='剧情流程';launch.className='flow-launch';document.querySelector('.pause-panel').append(launch);
let returnFrom=null;
function navigate(url){if(window.self!==window.top)window.parent.postMessage({type:'moon-menu-shell:navigate',url:new URL(url,location.href).href},'*');else location.assign(url);}
function latest(){sessionStorage.removeItem('moon_flow_state');navigate('./index.html?story=1');}
function jump(id,state){
 if(testing){location.assign('./index.html?test=1&story=0&selector=1&target='+encodeURIComponent(id));return;}
 if(!state)return;sessionStorage.setItem('moon_flow_state',JSON.stringify(state));navigate('./index.html?flow=1&story=1');
}
function escapeFlowText(value){
 return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function render(){
 const current=snapshot(),requestedLineage=query.get('flowlineage')||current.flags?.log_id||'',route=testing?testRoute(current):null,book=testing?{nodes:{}}:readBookFor(requestedLineage),states=book.nodes||{},chart=layer.querySelector('.story-flow-chart'),term=layer.querySelector('input[type="search"]').value.trim().toLowerCase();
 for(const id of route?.nodes||runtimeSeen){if(!states[id])states[id]={node:id,schemaVersion:3,chapter:1,day:1,flags:{log_id:requestedLineage},choices:{},evidence:[],completedTasks:[],currentMap:'F01',playerPosition:{x:755.4,y:743.7},checkpointId:id,_placeholder:true};}
 if(!states[current.node])states[current.node]=current;
 chart.replaceChildren();
 const v5=globalThis.MoonStoryFlowV5;
 if(!v5){layer.querySelector('.flow-note').textContent='V5 流程图数据未加载。';layer.querySelector('.flow-latest').hidden=!flowing;return;}
 const targetState=target=>{const s=states[target];return s&&!s._placeholder?s:(target===current.node?current:null);};
 const isReached=target=>!!target&&(!!states[target]||target===current.node);
 const optionReached=optionId=>{const mapped=v5.optionTargets?.[optionId];if(!mapped)return false;if(testing)return route.choices[mapped.choice]===optionId;const choiceId=mapped.choice,values=[current.choices?.[choiceId],...Object.values(states).map(s=>s?.choices?.[choiceId])].filter(v=>v!==undefined);if(values.length)return values.includes(optionId);return isReached(mapped.target);};
 const routeReached=route=>{const ending=v5.routeEndings?.[route.id];if(!ending)return false;if(testing&&!['V_END_ROUTE','GAME_COMPLETE'].includes(current.node))return false;const endingOf=state=>state?.flags?.ending;return endingOf(current)===ending||Object.values(states).some(s=>endingOf(s)===ending);};
 const matches=text=>!term||String(text).toLowerCase().includes(term);
 const makeNode=spec=>{
  const active=!!spec.active,visible=!!spec.visible,currentTarget=active&&!spec.dimmed&&!!spec.target&&spec.target===current.node,searchText=(spec.search||[spec.id,spec.title,spec.sub,spec.target]).filter(Boolean).join(' ');
  const show=visible&&matches(searchText);
  const button=document.createElement('button');
  button.type='button';
  button.className='flow-node '+(active?'is-unlocked':'is-locked')+(spec.dimmed?' is-unselected':'')+(currentTarget?' is-current':'')+' '+(spec.kind||'is-main');
  button.disabled=!active;
  button.hidden=!show;
  button.dataset.flowOrder=String(spec.order||0);
  button.dataset.flowId=spec.id;
  button.dataset.flowTarget=spec.target||'';
  if(currentTarget)button.setAttribute('aria-current','step');
  button.innerHTML=spec.dimmed?'<span class="flow-node__id"></span><span class="flow-node__title">?</span>':'<span class="flow-node__id">'+escapeFlowText(spec.id)+'</span><span class="flow-node__title">'+escapeFlowText(spec.title)+'</span>';
  button.title=spec.dimmed?'尚未选择此分支':active?(testing?'测试模式：直接进入此节点':'进入已解锁节点的独立回看'):'尚未到达';
  if(active&&!spec.dimmed&&spec.target)button.onclick=()=>jump(spec.target,targetState(spec.target)||{...current,node:spec.target});
  return button;
 };
 let flowOrderCounter=0;const make=spec=>makeNode({...spec,order:++flowOrderCounter});
 let chapterIndex=0,currentSection=null;
 const startChapter=(title,sub)=>{
  const section=document.createElement('section');section.className='flow-chapter';
  section.innerHTML='<header><b>'+String(++chapterIndex).padStart(2,'0')+'</b><h2>'+escapeFlowText(title)+'</h2><small></small></header><div class="flow-nodes"></div>';
  chart.append(section);return {section,nodes:section.querySelector('.flow-nodes')};
 };
 const finishChapter=section=>{
  const nodes=section.querySelector('.flow-nodes'),all=nodes.querySelectorAll('.flow-node'),unlocked=nodes.querySelectorAll('.flow-node.is-unlocked').length,small=section.querySelector('header small');
  if(small)small.textContent=unlocked+' / '+all.length+' 已解锁';
  if(!nodes.querySelector('.flow-node:not([hidden])'))section.hidden=true;
 };
 currentSection=startChapter('剧情流程','按照 V5 整合版剧情顺序');
 for(const event of v5.events){
  if(event.kind==='chapter'){finishChapter(currentSection.section);currentSection=startChapter(event.title,event.sub);continue;}
  if(event.kind==='choice'){
   const choice=v5.choices[event.id];if(!choice)continue;
   const step=document.createElement('div');step.className='flow-step';
   const host=(choice.options||[]).map(o=>v5.optionTargets?.[o.id]?.host).find(Boolean)||'',hostActive=isReached(host);
   step.append(make({id:choice.id,title:choice.title,sub:(host?'['+host+'] ':'')+'选择节点',kind:'is-choice',target:host,active:hostActive,visible:hostActive}));
   const branch=document.createElement('div');branch.className='flow-branch';branch.dataset.label='可选分支';branch.style.setProperty('--cols',String((choice.options||[]).length||1));
   for(const option of choice.options||[]){const mapped=v5.optionTargets?.[option.id]||{},selected=optionReached(option.id);branch.append(make({id:option.id,title:option.title,sub:(mapped.target?'['+mapped.target+'] ':'')+(option.sub||''),kind:'is-option',target:mapped.target,active:selected,visible:hostActive,dimmed:(hostActive)&&!selected}));}
   if(!branch.querySelector('.flow-node:not([hidden])'))branch.hidden=true;step.append(branch);if(!step.querySelector('.flow-node:not([hidden])'))step.hidden=true;currentSection.nodes.append(step);continue;
  }
  if(event.kind==='witness'||event.kind==='crisis'||event.kind==='final'){
   const key=event.kind==='witness'?'W':event.kind==='crisis'?'K':'F',options=(v5.specialChoices&&v5.specialChoices[key])||[],fallbackTitle={W:'查阅十六份记录',K:'家庭危机处理',F:'第十七次决定'}[key];
   const step=document.createElement('div');step.className='flow-step';
   const host=options.map(o=>v5.optionTargets?.[o.id]?.host).find(Boolean)||'',hostActive=isReached(host);
   step.append(make({id:key,title:event.title||fallbackTitle,sub:(host?'['+host+'] ':'')+'关键选择',kind:'is-choice',target:host,active:hostActive,visible:hostActive}));
   const branch=document.createElement('div');branch.className='flow-branch';branch.dataset.label='关键分支';branch.style.setProperty('--cols',String(options.length||1));
   for(const option of options){const mapped=v5.optionTargets?.[option.id]||{},selected=optionReached(option.id);branch.append(make({id:option.id,title:option.title,sub:(mapped.target?'['+mapped.target+'] ':'')+(option.sub||''),kind:'is-option',target:mapped.target,active:selected,visible:hostActive,dimmed:(hostActive)&&!selected}));}
   if(!branch.querySelector('.flow-node:not([hidden])'))branch.hidden=true;step.append(branch);if(!step.querySelector('.flow-node:not([hidden])'))step.hidden=true;currentSection.nodes.append(step);continue;
  }
  const target=v5.eventTargets?.[event.id]||'',kind=event.kind==='reveal'?'is-reveal':event.kind==='truth'?'is-truth':event.kind==='optional'?'is-optional':'is-main',reached=isReached(target);
  const step=document.createElement('div');step.className='flow-step';
  step.append(make({id:event.id,title:event.title||event.id,sub:(target?'['+target+'] ':'')+(event.sub||''),kind,target,active:reached,visible:reached}));
  if(!step.querySelector('.flow-node:not([hidden])'))step.hidden=true;
  currentSection.nodes.append(step);
 }
 finishChapter(currentSection.section);
 const routeSection=document.createElement('section');routeSection.className='flow-chapter';routeSection.innerHTML='<header><b>EX</b><h2>全部结局 / ROUTE INDEX</h2><small></small></header><div class="flow-nodes flow-route-grid"></div>';chart.append(routeSection);
 const routeNodes=routeSection.querySelector('.flow-route-grid');
 for(const route of v5.routes||[]){const reached=routeReached(route);if(!reached)continue;routeNodes.append(make({id:route.id,title:route.name,sub:'[V_END_ROUTE] '+(route.condition||''),kind:'is-ending is-route',target:'V_END_ROUTE',active:true,visible:true}));}
 finishChapter(routeSection);
 let previousStep=null;
 for(const id of route?.nodes||Object.keys(states)){
  const cards=[...chart.querySelectorAll('.flow-node.is-unlocked:not(.is-unselected)')];
  const existing=cards.find(card=>card.dataset.flowTarget===id);
  if(existing){previousStep=existing.closest('.flow-step');continue;}
  const def=definitions.get(id);if(!def&&id!==current.node)continue;
  const step=document.createElement('div');step.className='flow-step';
  step.append(make({id,title:def?.title||id,sub:'['+id+']',kind:'is-main',target:id,active:true,visible:true}));
  if(!step.querySelector('.flow-node:not([hidden])'))step.hidden=true;
  if(previousStep)previousStep.after(step);else chart.querySelector('.flow-nodes').append(step);
  previousStep=step;
 }
 for(const section of chart.querySelectorAll('.flow-chapter')){section.hidden=false;finishChapter(section);}
 const currentCard=chart.querySelector('.flow-node.is-current:not([hidden])');
 if(currentCard&&!term)requestAnimationFrame(()=>currentCard.scrollIntoView({block:'center',behavior:'smooth'}));
 layer.querySelector('.flow-note').textContent=testing?'测试模式：按当前选项显示从开头到当前情节的完整路径，当前情节高亮；后续情节不显示。':flowing?'正在独立回看，操作不会覆盖正式存档。':'仅显示已经到达过的 V5 剧情节点；未选择的选项会变暗并隐藏内容。';
 layer.querySelector('.flow-latest').hidden=!flowing;
}

function open(){returnFrom=activeOverlay;render();openOverlay('story-flow');}
launch.onclick=open;layer.querySelector('.flow-close').onclick=()=>{if(flowchartOnly){navigate('../main/index.html');return;}const target=returnFrom;returnFrom=null;if(target)openOverlay(target);else closeOverlay('story-flow');};layer.querySelector('input[type="search"]').oninput=render;layer.querySelector('.flow-latest').onclick=latest;
if(flowing){const banner=document.createElement('aside');banner.className='flow-replay-banner';banner.innerHTML='<span>独立剧情回看</span><button type="button">剧情流程</button><button type="button">返回最新进度</button>';banner.querySelectorAll('button')[0].onclick=open;banner.querySelectorAll('button')[1].onclick=latest;document.querySelector('#map-game').append(banner);}
if(flowchartOnly)requestAnimationFrame(()=>open());
globalThis.MoonStoryFlow={open,record,history:()=>readBook()};
})();
