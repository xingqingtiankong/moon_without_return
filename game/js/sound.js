"use strict";
globalThis.MoonSound=(()=>{
 const menuFlow=new URLSearchParams(location.search).get('flowchart')==='1';
 let context=null,clock=0,lastDish=0,lastStep=0;
 let homeVoice=null;
 let homeVoiceActive=false;
 let baseMusic=null;
 let baseMusicActive=false;
 let doorSfx=null;
 let baseDoorSfx=null;
 let balconyDoorSfx=null;
 let echoMusic=null;
 let echoMusicActive=false;
 let archiveMusic=null;
 let archiveMusicActive=false;
 let cloneMusic=null;
 let cloneMusicActive=false;
 let masterVolume=.4,musicVolume=1,sfxVolume=1;
 function setAudioVolumes(values={}){if(Number.isFinite(values.masterVolume))masterVolume=Math.max(0,Math.min(1,values.masterVolume));if(Number.isFinite(values.musicVolume))musicVolume=Math.max(0,Math.min(1,values.musicVolume));if(Number.isFinite(values.sfxVolume))sfxVolume=Math.max(0,Math.min(1,values.sfxVolume));if(homeVoice)homeVoice.volume=masterVolume*musicVolume;if(baseMusic)baseMusic.volume=masterVolume*musicVolume;if(echoMusic)echoMusic.volume=masterVolume*musicVolume;if(archiveMusic)archiveMusic.volume=masterVolume*musicVolume;if(cloneMusic)cloneMusic.volume=masterVolume*musicVolume;if(doorSfx)doorSfx.volume=masterVolume*sfxVolume;if(baseDoorSfx)baseDoorSfx.volume=masterVolume*sfxVolume;if(balconyDoorSfx)balconyDoorSfx.volume=masterVolume*sfxVolume;}
 window.addEventListener("moon:settings-changed",event=>setAudioVolumes(event.detail));
 window.addEventListener("storage",event=>{if(event.key!==globalThis.MoonStorage?.SETTINGS_KEY)return;try{setAudioVolumes(JSON.parse(event.newValue||"null"));}catch{}});
 setAudioVolumes(globalThis.MoonStorage?.loadSettings()??{});
 function unlock(){if(menuFlow)return;if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)context=new Audio();}context?.resume().catch(()=>{});}
 function tone(frequency,duration=.12,volume=.025,type='sine'){if(!context||context.state!=='running'||masterVolume<=0||sfxVolume<=0)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume*sfxVolume*masterVolume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(context.destination);o.start();o.stop(t+duration);}
 function noise(duration=.25,volume=.018){if(!context||context.state!=='running'||masterVolume<=0||sfxVolume<=0)return;const b=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const n=context.createBufferSource(),g=context.createGain();n.buffer=b;g.gain.value=volume*sfxVolume*masterVolume;n.connect(g).connect(context.destination);n.start();}
 function tick(dt,map,state,moving){clock+=dt;if(map.startsWith('F')&&!state.flags.dishes_silent&&clock-lastDish>5){lastDish=clock;if(state.family_state!=='S1'||Math.sin(clock)>.3){tone(1300,.12,.008);tone(1900,.08,.005);}}if(moving&&!state.flags.archive_missing&&clock-lastStep>.38){lastStep=clock;noise(.07,.006);}if(state.flags.carrying_cache&&map==='R02'&&clock-lastDish>1.1){lastDish=clock;noise(.12,.012);}}
 function note(lane){tone([261.63,293.66,329.63,392][lane],.55,.045,'triangle');}
 function playHomeVoice(){
  if(menuFlow)return;
  if(homeVoiceActive)return;
  if(!homeVoice){
   const AudioElement=window.Audio;
   if(!AudioElement)return;
   homeVoice=new AudioElement("./audio/home-voice.mp3");
  homeVoice.preload="auto";
  homeVoice.loop=false;
  homeVoice.volume=masterVolume*musicVolume;
 }
 homeVoice.volume=masterVolume*musicVolume;
 try{homeVoice.currentTime=0;}catch{}
  homeVoiceActive=true;
  homeVoice.play().catch(()=>{homeVoiceActive=false;});
 }
 function stopHomeVoice(){if(!homeVoice)return;homeVoiceActive=false;homeVoice.pause();try{homeVoice.currentTime=0;}catch{}}
 function playBaseMusic(){
  if(menuFlow)return;
  if(baseMusicActive)return;
  if(!baseMusic){
   const AudioElement=window.Audio;
   if(!AudioElement)return;
   baseMusic=new AudioElement("./audio/base-bgm.mp3");
   baseMusic.preload="auto";


   baseMusic.loop=false;
   baseMusic.addEventListener('ended',()=>{
    if(!baseMusicActive||menuFlow)return;
    baseMusic.currentTime=0;
    baseMusic.play().catch(()=>{baseMusicActive=false;});
   });
   baseMusic.volume=masterVolume*musicVolume;
  }
  try{baseMusic.currentTime=0;}catch{}
  baseMusicActive=true;
  baseMusic.play().catch(()=>{baseMusicActive=false;});
 }
 function playEchoMusic(){
  if(menuFlow||echoMusicActive)return;
  if(!echoMusic){const AudioElement=window.Audio;if(!AudioElement)return;echoMusic=new AudioElement('./audio/echo-bgm.mp3');echoMusic.preload='auto';echoMusic.loop=false;echoMusic.volume=masterVolume*musicVolume;echoMusic.addEventListener('ended',()=>{if(!echoMusicActive)return;echoMusic.currentTime=0;echoMusic.play().catch(()=>{echoMusicActive=false;});});}
  stopBaseMusic();
  echoMusicActive=true;echoMusic.currentTime=0;echoMusic.play().catch(()=>{echoMusicActive=false;});
 }
 function stopEchoMusic(){if(!echoMusic)return;echoMusicActive=false;echoMusic.pause();try{echoMusic.currentTime=0;}catch{} }
 function stopBaseMusic(){if(!baseMusic)return;baseMusicActive=false;baseMusic.pause();try{baseMusic.currentTime=0;}catch{}}
 function playArchiveMusic(){
  if(menuFlow||archiveMusicActive)return;
  if(!archiveMusic){
   if(!window.Audio)return;
   archiveMusic=new window.Audio('./audio/archive-bgm.mp3');
   archiveMusic.preload='auto';
   archiveMusic.loop=true;
   archiveMusic.volume=masterVolume*musicVolume;
  }
  archiveMusicActive=true;
  archiveMusic.play().catch(()=>{archiveMusicActive=false;});
 }
 function stopArchiveMusic(){
  if(!archiveMusic||!archiveMusicActive)return;
  archiveMusicActive=false;
  archiveMusic.pause();
  try{archiveMusic.currentTime=0;}catch{}
 }
 function playCloneMusic(){
  if(menuFlow||cloneMusicActive)return;
  if(!cloneMusic){
   const AudioElement=window.Audio;
   if(!AudioElement)return;
   cloneMusic=new AudioElement('./audio/发现克隆人.mp3');
   cloneMusic.preload='auto';
   cloneMusic.loop=true;
   cloneMusic.volume=masterVolume*musicVolume;
  }
  cloneMusicActive=true;
  try{cloneMusic.currentTime=0;}catch{}
  cloneMusic.play().catch(()=>{cloneMusicActive=false;});
 }
 function stopCloneMusic(){
  if(!cloneMusic||!cloneMusicActive)return;
  cloneMusicActive=false;
  cloneMusic.pause();
  try{cloneMusic.currentTime=0;}catch{}
 }
 function playDoorSfx(){
  if(masterVolume<=0||sfxVolume<=0)return;
  if(!doorSfx){
   const AudioElement=window.Audio;
   if(!AudioElement)return;
   doorSfx=new AudioElement("./audio/door-open.mp3");
   doorSfx.preload="auto";
   doorSfx.loop=false;
   doorSfx.volume=masterVolume*sfxVolume;
  }
  try{doorSfx.currentTime=0;}catch{}
  doorSfx.play().catch(()=>{});
 }
 function playBaseDoorSfx(){
  if(masterVolume<=0||sfxVolume<=0)return;
  if(!baseDoorSfx){
   const AudioElement=window.Audio;
   if(!AudioElement)return;
   baseDoorSfx=new AudioElement("./audio/base-door-open.mp3");
   baseDoorSfx.preload="auto";
   baseDoorSfx.loop=false;
   baseDoorSfx.volume=masterVolume*sfxVolume;
  }
  try{baseDoorSfx.currentTime=0;}catch{}
  baseDoorSfx.play().catch(()=>{});
 }
 function playBalconyDoorSfx(){
  if(masterVolume<=0||sfxVolume<=0)return;
  if(!balconyDoorSfx){
   if(!window.Audio)return;
   balconyDoorSfx=new window.Audio('./audio/balcony-door.mp3');
   balconyDoorSfx.preload='auto';
   balconyDoorSfx.loop=false;
  }
  balconyDoorSfx.volume=masterVolume*sfxVolume;
  try{balconyDoorSfx.currentTime=0;}catch{}
  balconyDoorSfx.play().catch(()=>{});
 }
 return Object.freeze({unlock,tone,noise,note,tick,setAudioVolumes,playHomeVoice,stopHomeVoice,playBaseMusic,stopBaseMusic,playEchoMusic,stopEchoMusic,playArchiveMusic,stopArchiveMusic,playCloneMusic,stopCloneMusic,playDoorSfx,playBaseDoorSfx,playBalconyDoorSfx});
})();
