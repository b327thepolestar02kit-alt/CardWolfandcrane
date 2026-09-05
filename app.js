/* CardWolf build v279 */
const firebaseConfig = window.FIREBASE_CONFIG || {};
if (window.CARDWOLF_BUILD_VERSION !== "v279") { window.CARDWOLF_BUILD_VERSION = "v279"; }
const versionEl = document.querySelector(".build-version");
if (versionEl) { versionEl.textContent = "v279"; versionEl.setAttribute("aria-label", "ゲームバージョン v279"); }

// Firebase is loaded lazily so a CDN/auth/database problem can never disable
// the basic game UI. The solo/setup buttons must remain usable even when the
// online service is temporarily unavailable.
let initializeApp=null, getDatabase=null, ref=null, set=null, update=null, get=null, onValue=null, off=null, remove=null, getAuth=null, signInAnonymously=null;
let firebaseApp = null, firebaseDb = null, firebaseAuth = null;
let firebaseUid = null;
let firebaseAuthPromise = null;
let firebaseServicesPromise = null;

async function ensureFirebaseServices(){
  if(firebaseDb && firebaseAuth) return;
  if(firebaseServicesPromise) return firebaseServicesPromise;
  firebaseServicesPromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js"),
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js")
  ]).then(([appMod, dbMod, authMod])=>{
    initializeApp=appMod.initializeApp;
    ({getDatabase,ref,set,update,get,onValue,off,remove}=dbMod);
    ({getAuth,signInAnonymously}=authMod);
    firebaseApp=initializeApp(firebaseConfig);
    firebaseDb=getDatabase(firebaseApp);
    firebaseAuth=getAuth(firebaseApp);
  }).catch(err=>{
    firebaseServicesPromise=null;
    console.error("Firebase SDK load failed:",err);
    throw err;
  });
  return firebaseServicesPromise;
}

function firebaseAuthErrorText(err){
  const code = err?.code ? String(err.code) : "unknown";
  const message = err?.message ? String(err.message) : String(err || "不明なエラー");
  return `Firebase認証に失敗しました。\\n\\nエラーコード: ${code}\\n${message}\\n\\nFirebaseコンソールの「Authentication → ログイン方法 → 匿名」が有効か確認してください。`;
}

async function ensureFirebaseAuth(){
  await ensureFirebaseServices();
  if(firebaseUid) return firebaseUid;
  if(firebaseAuthPromise) return firebaseAuthPromise;
  firebaseAuthPromise = signInAnonymously(firebaseAuth)
    .then(cred => {
      firebaseUid = cred.user.uid;
      return firebaseUid;
    })
    .catch(err => {
      firebaseAuthPromise = null;
      console.error("Firebase anonymous auth failed:", err);
      throw err;
    });
  return firebaseAuthPromise;
}

const CARD_POOL = Array.isArray(window.CARD_POOL_DATA) ? window.CARD_POOL_DATA.filter(card => card && card.name) : [];
const CARD_POOL_COUNT = CARD_POOL.length;
function normalizeCardPoolSize(value){const n=Number(value||100);return Math.min(CARD_POOL_COUNT,Math.max(40,Math.floor(n/10)*10));}
function getActiveCardPool(settings){return CARD_POOL.slice(0,normalizeCardPoolSize(settings?.cardPoolSize));}
const JP_NAMES = {"Blue-Eyes White Dragon":"青眼の白龍","Dark Magician":"ブラック・マジシャン","Red-Eyes Black Dragon":"真紅眼の黒竜","Dark Magician Girl":"ブラック・マジシャン・ガール","Summoned Skull":"デーモンの召喚","Gaia The Fierce Knight":"暗黒騎士ガイア","Curse of Dragon":"カース・オブ・ドラゴン","Celtic Guardian":"エルフの剣士","Kuriboh":"クリボー","Jinzo":"人造人間－サイコ・ショッカー","Buster Blader":"バスター・ブレイダー","Black Luster Soldier":"カオス・ソルジャー","Exodia the Forbidden One":"封印されしエクゾディア","Left Arm of the Forbidden One":"封印されし者の左腕","Right Arm of the Forbidden One":"封印されし者の右腕","Left Leg of the Forbidden One":"封印されし者の左脚","Right Leg of the Forbidden One":"封印されし者の右脚","Relinquished":"サクリファイス","Dark Magician Girl the Dragon Knight":"竜騎士ブラック・マジシャン・ガール","Toon Dark Magician Girl":"トゥーン・ブラック・マジシャン・ガール","Slifer the Sky Dragon":"オシリスの天空竜","Obelisk the Tormentor":"オベリスクの巨神兵","The Winged Dragon of Ra":"ラーの翼神竜","Dark Magician of Chaos":"混沌の黒魔術師","Sangan":"クリッター","Witch of the Black Forest":"黒き森のウィッチ","Mystical Elf":"ホーリー・エルフ","Baby Dragon":"ベビードラゴン","Time Wizard":"時の魔術師","Red-Eyes Black Metal Dragon":"レッドアイズ・ブラックメタルドラゴン","Dark Paladin":"超魔導剣士－ブラック・パラディン","Chaos Emperor Dragon - Envoy of the End":"混沌帝龍 －終焉の使者－","Black Luster Soldier - Envoy of the Beginning":"カオス・ソルジャー －開闢の使者－","Marshmallon":"マシュマロン","Magician of Faith":"聖なる魔術師","Cyber Dragon":"サイバー・ドラゴン","Elemental HERO Neos":"E・HERO ネオス","Stardust Dragon":"スターダスト・ドラゴン","Black Rose Dragon":"ブラック・ローズ・ドラゴン","Number 39: Utopia":"No.39 希望皇ホープ","Accesscode Talker":"アクセスコード・トーカー","Borreload Dragon":"ヴァレルロード・ドラゴン","Decode Talker":"デコード・トーカー","Firewall Dragon":"ファイアウォール・ドラゴン","Apollousa, Bow of the Goddess":"召命の神弓－アポロウーサ","I:P Masquerena":"I：Pマスカレーナ","Knightmare Unicorn":"トロイメア・ユニコーン","Underworld Goddess of the Closed World":"閉ザサレシ世界ノ冥神","Mekk-Knight Crusadia Avramax":"双穹の騎士アストラム","Borrelsword Dragon":"ヴァレルソード・ドラゴン","Number 107: Galaxy-Eyes Tachyon Dragon":"No.107 銀河眼の時空竜","Divine Arsenal AA-ZEUS - Sky Thunder":"天霆號アーゼウス","Red Dragon Archfiend":"レッド・デーモン・ドラゴン","Shooting Star Dragon":"シューティング・スター・ドラゴン","Junk Warrior":"ジャンク・ウォリアー","Cyber End Dragon":"サイバー・エンド・ドラゴン","Elemental HERO Flame Wingman":"E・HERO フレイム・ウィングマン","Blue-Eyes Alternative White Dragon":"青眼の亜白龍","Galaxy-Eyes Photon Dragon":"銀河眼の光子竜","Dark Armed Dragon":"ダーク・アームド・ドラゴン","Number C39: Utopia Ray":"CNo.39 希望皇ホープレイ","Odd-Eyes Pendulum Dragon":"オッドアイズ・ペンデュラム・ドラゴン","Clear Wing Synchro Dragon":"クリアウィング・シンクロ・ドラゴン","Dark Rebellion Xyz Dragon":"ダーク・リベリオン・エクシーズ・ドラゴン","Blue-Eyes Chaos MAX Dragon":"ブルーアイズ・カオス・MAX・ドラゴン","Harpie Lady":"ハーピィ・レディ","Destiny HERO - Plasma":"D-HERO Bloo-D","Blackwing - Gale the Whirlwind":"BF－疾風のゲイル","Salamangreat Gazelle":"転生炎獣ガゼル","Sky Striker Ace - Raye":"閃刀姫－レイ","Ash Blossom & Joyous Spring":"灰流うらら","Nibiru, the Primal Being":"原始生命態ニビル","Ancient Gear Golem":"古代の機械巨人","Blue-Eyes Ultimate Dragon":"青眼の究極竜","Cyber Twin Dragon":"サイバー・ツイン・ドラゴン","Elemental HERO Shining Flare Wingman":"E・HERO シャイニング・フレア・ウィングマン","Harpie Lady Sisters":"ハーピィ・レディ三姉妹","Harpie's Pet Dragon":"ハーピィズペット竜","Number 17: Leviathan Dragon":"No.17 リバイス・ドラゴン","Rainbow Dragon":"究極宝玉神 レインボー・ドラゴン","Red-Eyes Darkness Metal Dragon":"レッドアイズ・ダークネスメタルドラゴン","Shooting Quasar Dragon":"シューティング・クェーサー・ドラゴン","Thousand-Eyes Restrict":"サウザンド・アイズ・サクリファイス","Blue-Eyes Jet Dragon":"ブルーアイズ・ジェット・ドラゴン","Effect Veiler":"エフェクト・ヴェーラー","Droll & Lock Bird":"ドロール＆ロックバード","Blue-Eyes Spirit Dragon":"青眼の精霊龍","Red-Eyes Flare Metal Dragon":"真紅眼の鋼炎竜","Blue-Eyes Shining Dragon":"青眼の光龍","Red-Eyes Darkness Dragon":"真紅眼の闇竜","Dark Magician Knight":"ブラック・マジシャン・ナイト","Breaker the Magical Warrior":"魔導戦士 ブレイカー","Black Dragon's Chick":"黒竜の雛","Chaos Sorcerer":"カオス・ソーサラー","Dragon Spirit of White":"白き霊龍","Sage with Eyes of Blue":"青き眼の賢士","Maiden with Eyes of Blue":"青き眼の乙女","Red-Eyes Alternative Black Dragon":"真紅眼の亜黒竜","Blue-Eyes Solid Dragon":"ブルーアイズ・ソリッド・ドラゴン","Maxx \"C\"":"増殖するG"};
function jpName(card){return JP_NAMES[card.name]||card.name;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function isEffectMonster(card){return /Effect|Flip/.test(String(card?.type||""));}
function typeJa(card){const t=String(card.type||"");if(t.includes("Spell"))return "魔法カード";if(t.includes("Trap"))return "罠カード";if(t.includes("Fusion"))return isEffectMonster(card)?"融合・効果モンスター":"融合モンスター";if(t.includes("Synchro"))return isEffectMonster(card)?"シンクロ・効果モンスター":"シンクロモンスター";if(/Xyz|XYZ/.test(t))return isEffectMonster(card)?"エクシーズ・効果モンスター":"エクシーズモンスター";if(t.includes("Link"))return isEffectMonster(card)?"リンク・効果モンスター":"リンクモンスター";if(t.includes("Ritual"))return t.includes("Effect")?"儀式・効果モンスター":"儀式モンスター";if(isEffectMonster(card))return "効果モンスター";return "通常モンスター";}
function attributeJa(a){return ({LIGHT:"光",DARK:"闇",FIRE:"炎",WATER:"水",WIND:"風",EARTH:"地",DIVINE:"神"})[String(a||"").toUpperCase()]||"";}
function raceJa(r){return ({Dragon:"ドラゴン族",Spellcaster:"魔法使い族",Warrior:"戦士族",Fiend:"悪魔族",Beast:"獣族","Beast-Warrior":"獣戦士族",Machine:"機械族",Fairy:"天使族",Aqua:"水族",Pyro:"炎族",Plant:"植物族",Rock:"岩石族",Zombie:"アンデット族",Thunder:"雷族","Winged-Beast":"鳥獣族",Dinosaur:"恐竜族","Sea-Serpent":"海竜族",Reptile:"爬虫類族",Psychic:"サイキック族",Wyrm:"幻竜族",Cyberse:"サイバース族"})[r]||r||"";}
function cardInfo(card){const parts=[typeJa(card)],a=attributeJa(card.attribute),r=raceJa(card.race);if(a)parts.push(a+"属性");if(r)parts.push(r);if(String(card.type||"").includes("Link") && card.linkval!=null)parts.push("リンク"+card.linkval);else if(card.level!=null && card.level!=="")parts.push(/Xyz|XYZ/.test(String(card.type||""))?"ランク"+card.level:"レベル"+card.level);return parts.join(" / ");}
function isKnownStat(v){if(v===-1||v==="-1"||v===null||v===undefined||v==="")return false;const n=Number(v);return Number.isFinite(n)&&n>=0;}
function statDisplay(v,kind="atk"){if(v===-1||v==="-1")return kind==="def"?"－":"？";if(v===null||v===undefined||v==="")return "？";const n=Number(v);return Number.isFinite(n)?String(n):"？";}
function cardStats(card){const hasAtk=card.atk!==undefined&&card.atk!==null&&card.atk!=="";const hasDef=card.def!==undefined&&card.def!==null&&card.def!=="";const atk=hasAtk?`ATK ${statDisplay(card.atk,"atk")}`:"",def=hasDef?`DEF ${statDisplay(card.def,"def")}`:"";return [atk,def].filter(Boolean).join(" / ");}
function reverseGuessInfo(card){
  const type=typeJa(card);
  const attr=attributeJa(card.attribute);
  const race=raceJa(card.race);
  let level="";
  if(String(card.type||"").includes("Link")) level=card.linkval!=null?`リンク${card.linkval}`:"";
  else if(card.level!=null&&card.level!=="") level=String(card.type||"").includes("XYZ")?`ランク${card.level}`:`レベル${card.level}`;
  return [type,attr?`${attr}属性`:"",race,level,cardStats(card)].filter(Boolean).join(" / ");
}
function cardDisplay(card){return `<div class="card-name-jp">${escapeHtml(jpName(card))}</div><div class="card-info-ja">${escapeHtml(cardInfo(card))}</div>${cardStats(card)?`<div class="card-stats">${escapeHtml(cardStats(card))}</div>`:""}`;}
const CPU_NAMES=["遊戯","城之内","杏子","ヒロト","獏良","海馬","ペガサス","マリク"];
const setupScreen=document.getElementById("setupScreen"),gameScreen=document.getElementById("gameScreen"),restartButton=document.getElementById("restartButton"),playersElement=document.getElementById("players"),yourCardElement=document.getElementById("yourCard"),actionPanel=document.getElementById("actionPanel"),phaseLabel=document.getElementById("phaseLabel"),phaseTitle=document.getElementById("phaseTitle"),talkLog=document.getElementById("talkLog"),logCount=document.getElementById("logCount"),rulesDialog=document.getElementById("rulesDialog"),poolDialog=document.getElementById("poolDialog"),poolGrid=document.getElementById("poolGrid"),poolCountElement=document.getElementById("poolCount");
const speechCountSelect=document.getElementById("speechCount"),liePenaltyToggle=document.getElementById("liePenalty"),showLieCountToggle=document.getElementById("showLieCount");
if(liePenaltyToggle) liePenaltyToggle.checked=false;
if(showLieCountToggle) showLieCountToggle.checked=false;
const playerNameInput=document.getElementById("playerName"),winCountElement=document.getElementById("winCount"),lossCountElement=document.getElementById("lossCount"),medalCountElement=document.getElementById("medalCount"),gameWinCountElement=document.getElementById("gameWinCount"),gameLossCountElement=document.getElementById("gameLossCount"),gameMedalCountElement=document.getElementById("gameMedalCount");
const settingsDialog=document.getElementById("settingsDialog"),advancedSettingsButton=document.getElementById("advancedSettingsButton"),closeSettingsButton=document.getElementById("closeSettingsButton"),closeSettingsButtonBottom=document.getElementById("closeSettingsButtonBottom"),resetScoreButton=document.getElementById("resetScoreButton"),practicePlayerCountSelect=document.getElementById("practicePlayerCount"),cardPoolSizeSelect=document.getElementById("cardPoolSize");
const soloModeButton=document.getElementById("soloModeButton"),onlineModeButton=document.getElementById("onlineModeButton"),voiceModeButton=document.getElementById("voiceModeButton");
const onlineDialog=document.getElementById("onlineDialog"),closeOnlineButton=document.getElementById("closeOnlineButton"),createRoomButton=document.getElementById("createRoomButton"),joinRoomButton=document.getElementById("joinRoomButton"),roomCodeInput=document.getElementById("roomCodeInput"),onlineLobby=document.getElementById("onlineLobby"),onlineRoomCode=document.getElementById("onlineRoomCode"),onlinePlayerList=document.getElementById("onlinePlayerList"),onlineLobbyStatus=document.getElementById("onlineLobbyStatus"),onlineCpuCount=document.getElementById("onlineCpuCount"),onlineStartButton=document.getElementById("onlineStartButton"),leaveRoomButton=document.getElementById("leaveRoomButton");

let selectedPlayerCount=4,game=null,cpuTimer=null;
const MAX_MEDALS=99999;
let matchRecord=(()=>{try{const v=JSON.parse(localStorage.getItem("cardwolf.matchRecord")||"null");return {wins:Number(v?.wins)||0,losses:Number(v?.losses)||0,medals:Math.min(MAX_MEDALS,Math.max(0,Number(v?.medals)||0))};}catch{return {wins:0,losses:0,medals:0};}})();
function saveMatchRecord(){try{matchRecord.medals=Math.min(MAX_MEDALS,Math.max(0,Number(matchRecord.medals)||0));localStorage.setItem("cardwolf.matchRecord",JSON.stringify(matchRecord));}catch{}}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function randomItem(items){return items[Math.floor(Math.random()*items.length)];}
function cardImage(card){ if(document.documentElement.dataset.debugMode === "true" && location.protocol === "file:") return ""; return String(card?.image||""); }
function cardImageFallback(card){return `<div class="card-image-fallback"><strong>${escapeHtml(jpName(card))}</strong><span>${escapeHtml(cardInfo(card))}</span>${cardStats(card)?`<small>${escapeHtml(cardStats(card))}</small>`:""}</div>`;}
function cardShort(card){return jpName(card);}
const AMBIGUOUS_CLUES=[
{id:"vague-cool",label:"かっこいいカードです",ambiguous:true},
{id:"vague-cute",label:"かわいいカードです",ambiguous:true},
{id:"vague-smart",label:"賢そうなカードです",ambiguous:true},
{id:"vague-powerful",label:"強そうなカードです",ambiguous:true},
{id:"vague-mysterious",label:"不思議な雰囲気のカードです",ambiguous:true},
{id:"vague-used-to-use",label:"昔よく使っていたカードです",ambiguous:true},
{id:"vague-anime",label:"アニメで活躍したカードです",ambiguous:true},
{id:"vague-weapon",label:"武器を持っているモンスターです",ambiguous:true},
{id:"vague-biped",label:"二足歩行のモンスターです",ambiguous:true},
{id:"vague-fire-breath",label:"炎を吐きそうなモンスターです",ambiguous:true},
{id:"vague-flying",label:"飛行しそうなモンスターです",ambiguous:true}
];
const MAJOR_RACES=["Spellcaster","Dragon","Warrior","Fiend","Fairy","Beast","Winged-Beast","Machine"];
const ATTRIBUTE_OPTIONS=[
  ["LIGHT","光"],["DARK","闇"],["EARTH","地"],["WIND","風"],["FIRE","炎"],["WATER","水"],["DIVINE","神"]
];
const RACE_OPTIONS=[
  ["Spellcaster","魔法使い族"],["Dragon","ドラゴン族"],["Warrior","戦士族"],["Fiend","悪魔族"],
  ["Fairy","天使族"],["Beast","獣族"],["Winged-Beast","鳥獣族"],["Machine","機械族"]
];
const LEVEL_LINK_OPTIONS=Array.from({length:7},(_,i)=>i);
const LEVEL_ONLY_OPTIONS=Array.from({length:7},(_,i)=>i+7);
// v279: ATK/DEF clue choices first ask for the statement unit.
// Special values (unknown / no DEF) and 3001+ are always available.
const STAT_UNITS=[500,1000,1500];
function isUnknownStat(card,stat){
  const v=card?.[stat];
  if(v!==-1) return false;
  if(stat==="def" && String(card?.type||"").includes("Link")) return false;
  return true;
}
function isNoDef(card){return String(card?.type||"").includes("Link") && card?.def===-1;}
function statBuckets(stat,unit=500){
  const u=STAT_UNITS.includes(Number(unit))?Number(unit):500;
  const out=[{id:`${stat}-unknown`,label:"？（不明）",test:(v,c)=>isUnknownStat(c,stat)}];
  if(stat==="def") out.push({id:`${stat}-minus`,label:"－（守備力を持たない）",test:(v,c)=>isNoDef(c)});
  for(let low=0;low<3000;low+=u){
    const high=Math.min(low+u,3000);
    out.push({id:`${stat}-range-${low+1}-${high}`,label:`${low+1}～${high}`,test:v=>Number.isFinite(Number(v))&&Number(v)>=low+1&&Number(v)<=high});
  }
  // The first range is displayed as "N以下" for readability.
  const first=out.find(x=>x.id===`${stat}-range-1-${u}`);
  if(first) first.label=`${u}以下`;
  out.push({id:`${stat}-ge3001`,label:"3001以上",test:v=>Number.isFinite(Number(v))&&Number(v)>=3001});
  return out;
}
function statFeatureList(stat,unit){
  return statBuckets(stat,unit).map(bucket=>({id:bucket.id,label:`${stat==="atk"?"攻撃力":"守備力"}が${bucket.label}です`,test:c=>bucket.test(c?.[stat],c)}));
}
function allStatFeatureList(){return STAT_UNITS.flatMap(unit=>[...statFeatureList("atk",unit),...statFeatureList("def",unit)]);}
function getStatUnitFromSettings(settings){return STAT_UNITS.includes(Number(settings?.statStatementUnit))?Number(settings.statStatementUnit):500;}
const ATK_STAT_BUCKETS=statBuckets("atk",500);
const DEF_STAT_BUCKETS=statBuckets("def",500);
function positiveClueDefinition(id,label,test){return {id,label,test};}
function negativeClue(def){return {id:`not-${def.id}`,label:def.label.replace(/です$/, "ではありません"),test:c=>!def.test(c)};}
function negativeBasicClues(){
  const positives=[
    positiveClueDefinition("monster","モンスターカードです",c=>String(c.type||"").includes("Monster")),
    positiveClueDefinition("normal","通常モンスターカードです",c=>String(c.type||"").includes("Normal")),
    positiveClueDefinition("effect","効果モンスターです",c=>String(c.type||"").includes("Monster")&&isEffectMonster(c)),
    positiveClueDefinition("fusion","融合モンスターです",c=>String(c.type||"").includes("Fusion")),
    positiveClueDefinition("synchro","シンクロモンスターです",c=>String(c.type||"").includes("Synchro")),
    positiveClueDefinition("xyz","エクシーズモンスターです",c=>/Xyz|XYZ/.test(String(c.type||""))),
    positiveClueDefinition("link","リンクモンスターです",c=>String(c.type||"").includes("Link")),
    positiveClueDefinition("extra-deck","デュエル開始時にEXデッキに入るモンスターです",c=>/Fusion|Synchro|Xyz|XYZ|Link/.test(String(c.type||"")))
  ];
  return positives.map(d=>negativeClue(d));
}
function negativeAttributeClues(){return ATTRIBUTE_OPTIONS.map(([v,l])=>negativeClue(positiveClueDefinition(`attribute-${v.toLowerCase()}`,`${l}属性です`,c=>String(c.attribute||"").toUpperCase()===v)));}
function negativeRaceClues(){const raceIds={Spellcaster:"spellcaster",Dragon:"dragon",Warrior:"warrior",Fiend:"fiend",Fairy:"fairy",Beast:"beast","Winged-Beast":"winged-beast",Machine:"machine"};return RACE_OPTIONS.filter(([v])=>v!=="minor-race").map(([v,l])=>negativeClue(positiveClueDefinition(raceIds[v],`${l}です`,c=>String(c.race||"")===v)));}
function negativeClueOptions(category){if(category==="basic")return negativeBasicClues();if(category==="attribute")return negativeAttributeClues();if(category==="race")return negativeRaceClues();return [];}
function initialCharOptions(){
  const chars=[...new Set(CARD_POOL.map(c=>jpName(c).trim().charAt(0)).filter(Boolean))];
  return chars.sort((a,b)=>a.localeCompare(b,"ja"));
}
function endingCharOptions(){
  const chars=[...new Set(CARD_POOL.map(c=>jpName(c).trim().slice(-1)).filter(Boolean))];
  return chars.sort((a,b)=>a.localeCompare(b,"ja"));
}
function quickNameClues(card){
  const name=jpName(card).trim();
  const first=name.charAt(0), last=name.slice(-1);
  return [
    {id:`name-initial-${first.codePointAt(0).toString(16)}`,label:`カード名の最初は「${first}」です`,test:c=>jpName(c).trim().startsWith(first)},
    {id:`name-ending-${last.codePointAt(0).toString(16)}`,label:`カード名の最後は「${last}」です`,test:c=>jpName(c).trim().endsWith(last)}
  ];
}
function featureList(card,settings){
  const list=[
    {id:"monster",label:"モンスターカードです",test:c=>String(c.type||"").includes("Monster")},
    {id:"normal",label:"通常モンスターカードです",test:c=>String(c.type||"").includes("Normal")},
        {id:"effect",label:"効果モンスターです",test:c=>String(c.type||"").includes("Monster")&&isEffectMonster(c)},
    {id:"fusion",label:"融合モンスターです",test:c=>String(c.type||"").includes("Fusion")},
    {id:"synchro",label:"シンクロモンスターです",test:c=>String(c.type||"").includes("Synchro")},
    {id:"xyz",label:"エクシーズモンスターです",test:c=>/Xyz|XYZ/.test(String(c.type||""))},
    {id:"link",label:"リンクモンスターです",test:c=>String(c.type||"").includes("Link")},
    {id:"extra-deck",label:"デュエル開始時にEXデッキに入るモンスターです",test:c=>{const t=String(c.type||"");return /Fusion|Synchro|Xyz|XYZ|Link/.test(t);}},
    {id:"dragon",label:"ドラゴン族です",test:c=>String(c.race||"")==="Dragon"},
    {id:"spellcaster",label:"魔法使い族です",test:c=>String(c.race||"")==="Spellcaster"},
    {id:"warrior",label:"戦士族です",test:c=>String(c.race||"")==="Warrior"},
    {id:"fiend",label:"悪魔族です",test:c=>String(c.race||"")==="Fiend"},
    {id:"beast",label:"獣族です",test:c=>String(c.race||"")==="Beast"},
    {id:"winged-beast",label:"鳥獣族です",test:c=>String(c.race||"")==="Winged-Beast"},
    {id:"machine",label:"機械族です",test:c=>String(c.race||"")==="Machine"},
    {id:"fairy",label:"天使族です",test:c=>String(c.race||"")==="Fairy"},
    {id:"minor-race",label:"マイナーな種族です",test:c=>{const r=String(c.race||"");return Boolean(r)&&!MAJOR_RACES.includes(r);}},
    ...ATTRIBUTE_OPTIONS.map(([value,label])=>({id:`attribute-${value.toLowerCase()}`,label:`${label}属性です`,test:c=>String(c.attribute||"").toUpperCase()===value})),
    ...LEVEL_LINK_OPTIONS.map(level=>({id:`level-${level}`,label:`レベル／ランク／リンクが${level}です`,test:c=>{const t=String(c.type||"");return t.includes("Link") ? Number(c.linkval)===level : Number(c.level)===level;}})),
    ...LEVEL_ONLY_OPTIONS.map(level=>({id:`level-${level}`,label:`レベル／ランクが${level}です`,test:c=>Number(c.level)===level})),
    {id:"level-low",label:"レベル4以下のモンスターです。",test:c=>Number(c.level)>0&&Number(c.level)<=4},
    {id:"level-5-6",label:"レベル5または6のモンスターです。",test:c=>[5,6].includes(Number(c.level))},
    {id:"level-high",label:"レベル7以上のモンスターです。",test:c=>Number(c.level)>=7},
    {id:"level-none",label:"レベルを持たないモンスターです。",test:c=>Number(c.level)===0},
    ...statFeatureList("atk",getStatUnitFromSettings(settings)),
    ...statFeatureList("def",getStatUnitFromSettings(settings)),
    {id:"name-blue",label:"「青眼」に関係するカードです",test:c=>c.name.includes("Blue-Eyes")},
    {id:"name-dark",label:"「ブラック」または「ダーク」に関係する名前です",test:c=>c.name.includes("Dark")||c.name.includes("Black")},
    {id:"name-red",label:"「真紅眼」に関係するカードです",test:c=>c.name.includes("Red-Eyes")},
    {id:"toon",label:"「トゥーン」の名前を持ちます",test:c=>c.name.includes("Toon")},
    {id:"forbidden",label:"「封印されし」の名前を持ちます",test:c=>c.name.includes("Forbidden")},
    ...initialCharOptions().map(ch=>({id:`name-initial-${ch.codePointAt(0).toString(16)}`,label:`カード名の最初は「${ch}」です`,test:c=>jpName(c).trim().startsWith(ch)})),
    ...endingCharOptions().map(ch=>({id:`name-ending-${ch.codePointAt(0).toString(16)}`,label:`カード名の最後は「${ch}」です`,test:c=>jpName(c).trim().endsWith(ch)}))
  ];
  return list;
}
function statementsFor(card,settings){return featureList(card,settings).filter(f=>{try{return f.test(card);}catch{return false;}});}
function falseStatementsFor(card,settings){return featureList(card,settings).filter(f=>{try{return !f.test(card);}catch{return false;}});}
function chooseCardPair(settings){const cards=shuffle(getActiveCardPool(settings));for(let i=0;i<500;i++){const citizen=randomItem(cards),cf=statementsFor(citizen,settings).map(x=>x.id),candidates=cards.filter(c=>c.name!==citizen.name&&statementsFor(c,settings).some(f=>cf.includes(f.id)));if(candidates.length)return[citizen,randomItem(candidates)];}return cards.slice(0,2);}
function syncPracticePlayerCount(){
  const value=Number(practicePlayerCountSelect?.value||4);
  selectedPlayerCount=Math.min(8,Math.max(3,value));
  if(practicePlayerCountSelect) practicePlayerCountSelect.value=String(selectedPlayerCount);
}
function getSettings(){return{speechRounds:Number(speechCountSelect.value||2),liePenalty:Boolean(liePenaltyToggle.checked),showLieCount:Boolean(showLieCountToggle&& showLieCountToggle.checked),cardPoolSize:normalizeCardPoolSize(cardPoolSizeSelect?.value||100)};}
function randomPlayerName(){return randomItem(["ユウ","カイ","レン","アキラ","ナギ","ハヤト","ソラ","ミナ","リク","シン"]);}
function chooseCpuNames(count){return shuffle(CPU_NAMES).slice(0,Math.max(0,Number(count)||0));}
function getPlayerName(){const n=(playerNameInput?.value||"").trim();return n||randomPlayerName();}
function loadPersistentProfile(){try{const n=localStorage.getItem("cardwolf.playerName");if(n&&playerNameInput&&!playerNameInput.value)playerNameInput.value=n;}catch{}}
playerNameInput?.addEventListener("input",()=>{try{localStorage.setItem("cardwolf.playerName",playerNameInput.value);}catch{}});
loadPersistentProfile();
function renderPoolCount(settings=getSettings()){if(poolCountElement){const n=normalizeCardPoolSize(settings?.cardPoolSize);poolCountElement.textContent=String(n);}}
renderPoolCount();
function renderRecord(){saveMatchRecord();if(winCountElement)winCountElement.textContent=matchRecord.wins;if(lossCountElement)lossCountElement.textContent=matchRecord.losses;if(gameWinCountElement)gameWinCountElement.textContent=matchRecord.wins;if(gameLossCountElement)gameLossCountElement.textContent=matchRecord.losses;if(medalCountElement)medalCountElement.textContent=matchRecord.medals;if(gameMedalCountElement)gameMedalCountElement.textContent=matchRecord.medals;} 
function buildOrder(round){const forward=Array.from({length:selectedPlayerCount},(_,i)=>i);return Number(round)%2===0?forward.slice().reverse():forward;}
function startGame(){
  clearTimeout(cpuTimer);
  syncPracticePlayerCount();
  if(CARD_POOL.length<2){alert("カードデータがありません。先にカード準備を完了してください。");return;}
  const settings=getSettings(), activePool=getActiveCardPool(settings);
  if(activePool.length<2){alert("カードプールの設定が不正です。");return;}
  const [citizenCard,wolfCard]=chooseCardPair(settings);
  if(!citizenCard||!wolfCard){alert("カードの選出に失敗しました。カードプールを確認してください。");return;}
  const wolfIndex=Math.floor(Math.random()*selectedPlayerCount), humanName=getPlayerName();
  const cpuNames=chooseCpuNames(selectedPlayerCount-1);
  const players=Array.from({length:selectedPlayerCount},(_,index)=>({id:index,name:index===0?humanName:cpuNames[index-1],isHuman:index===0,isWolf:index===wolfIndex,card:index===wolfIndex?wolfCard:citizenCard,clues:[],lies:0,vote:null}));
  game={citizenCard,wolfCard,wolfIndex,players,settings:{...settings,statStatementUnit:500},round:1,order:buildOrder(1),orderIndex:0,phase:"clue",logs:[],usedClueIds:[],currentOptions:[],busy:false,tallies:null,eliminatedId:null,result:null,reverseGuess:null,recorded:false,clueMenu:"root"};
  try{
    setupScreen.hidden=true;
    gameScreen.hidden=false;
    renderGame();
    if(!actionPanel.innerHTML.trim()) throw new Error("Practice action panel was empty after render");
  }catch(error){
    console.error("Practice start failed",error);
    game=null; setupScreen.hidden=false; gameScreen.hidden=true;
    alert("プラクティスモードの初期化に失敗しました。カードデータを確認してください。");
    return;
  }
  const mainScroller=document.querySelector("main"); if(mainScroller) mainScroller.scrollTop=0; else window.scrollTo({top:0,behavior:"auto"});
}
function renderGame(){
  if(!game||!Array.isArray(game.players)||!game.players.length){console.error("Practice game render skipped: invalid game state",game);return;}
  try{renderPlayers();}catch(e){console.error("Practice player render failed",e);playersElement.innerHTML="";}
  try{renderYourCard();}catch(e){console.error("Practice card render failed",e);yourCardElement.className="playing-card ygo";yourCardElement.innerHTML=`<div class="ygo-card-face"><div class="card-image-fallback"><strong>カード表示エラー</strong><span>このカードはゲームを続けられます</span></div></div>`;}
  try{renderLog();}catch(e){console.error("Practice log render failed",e);}
  try{renderActionPanel();}catch(e){
    console.error("Practice action render failed",e);
    const current=currentPlayer(), fallback=safePracticeClues(current);
    game.currentOptions=fallback;
    actionPanel.innerHTML=`<div class="action-heading"><p>第${game.round}ラウンド</p><h2>何と発言しますか？</h2><span>発言候補を再表示しました。</span></div><div class="choice-list basic-clue-list">${fallback.map(s=>`<button class="choice-button" type="button" data-clue-id="${escapeHtml(String(s.id))}"><span>${escapeHtml(s.label)}</span><span>→</span></button>`).join("")}</div>`;
    actionPanel.querySelectorAll("[data-clue-id]").forEach(b=>b.addEventListener("click",()=>{
   const id=b.dataset.clueId;
   if(/^(atk|def)-(500|1000|1500)$/.test(id)){game.clueMenu=id;renderCluePhase();return;}
   submitHumanClue(id);
 }));
  }
}
function previousPlayer(){if(!game||game.orderIndex<=0)return null;return game.players[game.order[game.orderIndex-1]];}
function currentPlayer(){return game.players[game.order[game.orderIndex]];}
function renderPlayers(){playersElement.innerHTML=game.players.map(p=>{const current=game.phase==="clue"&&game.order[game.orderIndex]===p.id,reveal=game.phase==="result";const clues=p.clues||[];const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>');return `<article class="player-seat ${p.isHuman?"is-you":""} ${current?"is-current":""} ${game.eliminatedId===p.id?"is-eliminated":""} ${reveal?"is-reveal":""}"><div class="avatar">${p.isHuman?"YOU":String(p.id).padStart(2,"0")}</div><div class="seat-copy"><div class="seat-name"><strong>${escapeHtml(p.name)}</strong>${p.isHuman?"<span>あなた</span>":"<span>CPU</span>"}</div><div class="player-clues">${clueHtml}</div></div>${game.settings&&game.settings.showLieCount&&p.lies?`<span class="lie-count">嘘 ${p.lies}</span>`:""}${reveal?`<span class="vote-badge">${game.tallies&&game.tallies[p.id]!=null?game.tallies[p.id]:0}票</span><div class="result-meta"><span class="role-reveal ${p.isWolf?"wolf":"citizen"}">${p.isWolf?"狼":"市民"} · ${cardShort(p.card)}</span></div>`:""}</article>`;}).join("");}
function renderYourCard(){
  yourCardElement.className="playing-card ygo";
  const card=game?.players?.[0]?.card||game?.citizenCard||CARD_POOL[0]||null;
  if(!card){
    yourCardElement.innerHTML=`<div class="ygo-card-face"><div class="card-image-fallback"><strong>カードを準備できません</strong><span>カードデータを確認してください</span></div></div>`;
    return;
  }
  const src=cardImage(card), name=jpName(card);
  yourCardElement.innerHTML=`<div class="ygo-card-face">${src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}">`:cardImageFallback(card)}</div><div class="your-card-meta">${cardDisplay(card)}</div>`;
  const img=yourCardElement.querySelector(".ygo-card-face img");
  if(img) img.addEventListener("error",()=>{const face=img.closest(".ygo-card-face");if(face&&!face.querySelector(".card-image-fallback")){img.remove();face.insertAdjacentHTML("afterbegin",cardImageFallback(card));}}, {once:true});
}
function renderLog(){logCount.textContent=`${game.logs.length} 件`;talkLog.innerHTML=game.logs.length?game.logs.map((e,i)=>`<article class="log-entry ${e.type||""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.text)}</p></article>`).join(""):`<p class="empty-log">発言が始まると、ここに記録されます。</p>`;}
function renderActionPanel(){if(game.phase==="clue")renderCluePhase();else if(game.phase==="vote")renderVotePhase();else if(game.phase==="revote")renderRevotePhase();else if(game.phase==="reverse")renderReversePhase();else renderResultPhase();}
const CLUE_MENU_CATEGORIES=[
  {id:"basic",label:"基本の特徴"},
  {id:"level",label:"レベル／ランク／リンク"},
  {id:"attribute",label:"属性"},
  {id:"race",label:"種族"},
  {id:"atk",label:"攻撃力"},
  {id:"def",label:"守備力"}
];
function availableClues(player){
 const used=new Set(game.usedClueIds||[]);
 let truthful=shuffle(statementsFor(player.card,game.settings)).filter(s=>!used.has(s.id));
 let falsehoods=shuffle(falseStatementsFor(player.card,game.settings)).filter(s=>!used.has(s.id));
 const pinned=quickNameClues(player.card).filter(s=>!used.has(s.id));
 let options=[...pinned,...truthful.slice(0,3),...falsehoods.slice(0,2)];
 // Newly added negative forms participate in the quick suggestions as well.
 // Pick a small random subset so they appear naturally without dominating the list.
 const negativeQuick=shuffle([...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues()])
   .filter(s=>!used.has(s.id)&&!options.some(o=>o.id===s.id));
 options.push(...negativeQuick.slice(0,2));
 if(game.settings.speechRounds>=2 && !(player.clues||[]).some(c=>c.ambiguous)){
   const vague=shuffle(AMBIGUOUS_CLUES).filter(v=>!used.has(v.id));
   options.push(...vague.slice(0,2));
 }
 if(options.length<4){const extra=shuffle(featureList(player.card)).filter(s=>!used.has(s.id)&&!options.some(o=>o.id===s.id));options.push(...extra.slice(0,4-options.length));}
 const pinnedIds=new Set(pinned.map(s=>s.id));
 const others=shuffle(options.filter(s=>!pinnedIds.has(s.id)));
 return [...pinned,...others.slice(0,Math.max(0,6-pinned.length))];
}
function clueCategoryOptions(category){
 if(category==="basic") return [
   {id:"monster",label:"モンスターカードです"},
   {id:"normal",label:"通常モンスターカードです"},
   {id:"effect",label:"効果モンスターです"},
   {id:"fusion",label:"融合モンスターです"},
   {id:"synchro",label:"シンクロモンスターです"},
   {id:"xyz",label:"エクシーズモンスターです"},
   {id:"link",label:"リンクモンスターです"},
   {id:"extra-deck",label:"デュエル開始時にEXデッキに入るモンスターです"}
 ];
 if(category==="level") return [...LEVEL_LINK_OPTIONS.map(v=>({id:`level-${v}`,label:`レベル／ランク／リンクが${v}です` })),...LEVEL_ONLY_OPTIONS.map(v=>({id:`level-${v}`,label:`レベル／ランクが${v}です`}))];
 if(category==="attribute") return ATTRIBUTE_OPTIONS.map(([v,l])=>({id:`attribute-${v.toLowerCase()}`,label:`${l}属性です`}));
 if(category==="race") { const raceIds={Spellcaster:"spellcaster",Dragon:"dragon",Warrior:"warrior",Fiend:"fiend",Fairy:"fairy",Beast:"beast","Winged-Beast":"winged-beast",Machine:"machine"}; return RACE_OPTIONS.map(([v,l])=>({id:raceIds[v],label:`${l}です`})); }
 if(category==="atk"||category==="def") return STAT_UNITS.map(u=>({id:`${category}-${u}`,label:`${u}単位で発言`}));
 if(/^atk-(500|1000|1500)$/.test(category)) return statFeatureList("atk",Number(category.split("-")[1])).map(s=>({id:s.id,label:s.label}));
 if(/^def-(500|1000|1500)$/.test(category)) return statFeatureList("def",Number(category.split("-")[1])).map(s=>({id:s.id,label:s.label}));
 return [];
}
function findClueById(id){try{return [...featureList(game.players[game.order[game.orderIndex]].card,game.settings),...allStatFeatureList(),...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues(),...AMBIGUOUS_CLUES].find(s=>String(s.id)===String(id))||null;}catch(error){console.error("Practice clue lookup failed",error);return null;}}
function safePracticeClues(player){
  try{
    const opts=availableClues(player);
    if(Array.isArray(opts)&&opts.length)return opts;
  }catch(error){console.error("Practice clue generation failed; using fallback clues",error);}
  const used=new Set(game?.usedClueIds||[]);
  let fallback=[];
  try{fallback=featureList(player.card,game.settings).filter(s=>s&&!used.has(s.id)).slice(0,6);}catch(error){console.error("Practice clue fallback failed",error);}
  if(!fallback.length){
    fallback=[
      {id:"monster",label:"モンスターカードです",test:c=>String(c?.type||"").includes("Monster")},
      {id:"atk-unknown",label:"攻撃力が？（不明）です",test:c=>!isKnownStat(c?.atk)},
      {id:"def-unknown",label:"守備力が？（不明）または－です",test:c=>!isKnownStat(c?.def)}
    ].filter(s=>!used.has(s.id));
  }
  return fallback;
}

function renderCluePhase(){
 try {
 const current=currentPlayer(),roundLabel=`第${game.round}ラウンド${game.round>1?`（${game.round%2===0?"逆順":"順番"}）`:""}`;
 phaseLabel.textContent=`PHASE ${game.round} / ${roundLabel}・特徴を話す`;
 phaseTitle.textContent=current.isHuman?"あなたの特徴を話そう":`${current.name}の発言を聞こう`;
 if(!current.isHuman){
   actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">?</span><div><p>CPU TURN</p><h2>${current.name}が考えています</h2><span>前の発言とは違う特徴を選んでいます…</span></div></div>`;return;
 }
 const root=game.clueMenu||"root";
 if(root==="root"){
   const base=safePracticeClues(current);
   game.currentOptions=base;
   actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>何と発言しますか？</h2><span>左の「すぐに選べる特徴」から選ぶか、右の特徴一覧から詳しい条件を選べます。${game.settings.liePenalty?"狼が嘘発言を2回するか、曖昧発言と嘘発言をそれぞれ1回すると、逆転チャンスを失います。":"嘘の回数によるペナルティはありません。"}</span></div><div class="clue-choice-layout"><section class="quick-clue-column"><p class="clue-list-label">すぐに選べる特徴</p><div class="choice-list basic-clue-list">${base.map(s=>`<button class="choice-button ${clueChoiceClass(s,current.card)}" type="button" data-clue-id="${s.id}"><span>${s.label}</span><span>${s.ambiguous?"曖昧":"→"}</span></button>`).join("")}</div></section><section class="clue-menu-column"><p class="clue-list-label">特徴一覧</p><div class="clue-category-grid">${CLUE_MENU_CATEGORIES.map(c=>`<button class="choice-button clue-category-button" type="button" data-clue-category="${c.id}"><span>${c.label}</span><span>→</span></button>`).join("")}</div></section></div>`;
   actionPanel.querySelectorAll("[data-clue-category]").forEach(b=>b.addEventListener("click",()=>{game.clueMenu=b.dataset.clueCategory;renderCluePhase();}));
   actionPanel.querySelectorAll("[data-clue-negative-category]").forEach(b=>b.addEventListener("click",()=>{game.clueMenu=`${b.dataset.clueNegativeCategory}-negative`;renderCluePhase();}));
 }else{
   const initialOptions=clueCategoryOptions(root);
   const isStatUnitMenu=(root==="atk"||root==="def");
   const isStatRangeMenu=/^(atk|def)-(500|1000|1500)$/.test(root);
   game.currentOptions=initialOptions.map(o=>findClueById(o.id)).filter(Boolean);
   const usedIds=new Set(game.usedClueIds||[]);
   const negativeMode=String(root).endsWith("-negative");
   const baseCategory=negativeMode?String(root).replace(/-negative$/," ").trim():root;
   const categoryLabel=isStatUnitMenu?`${root==="atk"?"攻撃力":"守備力"}・発言単位を選択`:isStatRangeMenu?`${root.startsWith("atk-")?"攻撃力":"守備力"}・${root.split("-")[1]}単位`:CLUE_MENU_CATEGORIES.find(c=>c.id===baseCategory)?.label||"特徴を選択";
   const options=negativeMode?negativeClueOptions(baseCategory):clueCategoryOptions(baseCategory);
   const canToggleNegative=(baseCategory==="basic"||baseCategory==="attribute"||baseCategory==="race");
   const toggleButton=canToggleNegative?(negativeMode
     ?`<button class="choice-button clue-negative-button" type="button" data-clue-positive-category="${baseCategory}"><span>肯定形選択肢へ</span><span>→</span></button>`
     :`<button class="choice-button clue-negative-button" type="button" data-clue-negative-category="${baseCategory}"><span>否定形選択肢へ</span><span>→</span></button>`):"";
   actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>${categoryLabel}${negativeMode?"・否定形":""}</h2><span>一覧から選択してください。ほかのプレイヤーが発言済みの内容は選択できません。</span></div><div class="choice-list submenu-choice-list">${options.map(o=>{const used=usedIds.has(o.id);const statement=findClueById(o.id);return `<button class="choice-button ${used?"choice-used ":""}${statement?clueChoiceClass(statement,current.card):""}" type="button" data-clue-id="${o.id}" ${used?"disabled aria-disabled=\"true\"":""}><span>${o.label}</span><span>${used?"発言済み":statement?.ambiguous?"曖昧":"→"}</span></button>`;}).join("")}${toggleButton}</div><button class="secondary-button compact clue-back-button" id="clueBackButton" type="button">← 戻る</button>`;
   actionPanel.querySelector("#clueBackButton").addEventListener("click",()=>{game.clueMenu=isStatRangeMenu?root.split("-")[0]:"root";renderCluePhase();});
 }
 actionPanel.querySelectorAll("[data-clue-id]").forEach(b=>b.addEventListener("click",()=>{
   const id=b.dataset.clueId;
   if(/^(atk|def)-(500|1000|1500)$/.test(id)){game.clueMenu=id;renderCluePhase();return;}
   submitHumanClue(id);
 }));
} catch(error){
   console.error("Practice clue render failed",error);
   const current=currentPlayer();
   const fallback=safePracticeClues(current);
   game.currentOptions=fallback;
   actionPanel.innerHTML=`<div class="action-heading"><p>第${game.round}ラウンド</p><h2>何と発言しますか？</h2><span>発言候補を安全な形式で再表示しました。</span></div><div class="choice-list basic-clue-list">${fallback.map(s=>`<button class="choice-button" type="button" data-clue-id="${escapeHtml(s.id)}"><span>${escapeHtml(s.label)}</span><span>→</span></button>`).join("")}</div>`;
   actionPanel.querySelectorAll("[data-clue-id]").forEach(b=>b.addEventListener("click",()=>submitHumanClue(b.dataset.clueId)));
 }
}
function submitHumanClue(id){
 if(game.busy||game.phase!=="clue")return;
 game.busy=true;
 const current=currentPlayer();
 const statement=findClueById(id)||game.currentOptions.find(s=>String(s?.id)===String(id))||safePracticeClues(current).find(s=>String(s?.id)===String(id));
 if(!statement||game.usedClueIds.includes(statement.id)){game.busy=false;renderCluePhase();return;}
 const buttons=actionPanel.querySelectorAll("[data-clue-id]");buttons.forEach(b=>b.disabled=true);
 if(submitClue(current,statement))advanceClueTurn();else game.busy=false;
}
function submitClue(player,statement){if(!statement||game.usedClueIds.includes(statement.id))return false;const truthful=statement.ambiguous ? true : statement.test(player.card);player.clues.push(statement);game.usedClueIds.push(statement.id);if(!truthful)player.lies+=1;game.logs.push({name:player.name,text:`「${statement.label}」と発言しました。`});return true;}
function safeTest(statement, card){
  if(!statement || statement.ambiguous || typeof statement.test!=="function") return false;
  try{return Boolean(statement.test(card));}catch{return false;}
}
function clueChoiceClass(statement, card){
  if(statement?.ambiguous) return "ambiguous-choice";
  return safeTest(statement, card) ? "" : "lie-choice";
}
function availableCpuClues(player){
  const used=new Set(game.usedClueIds||[]);
  // CPU never uses ambiguous statements. They are reserved for the human player.
  let options=shuffle(featureList(player.card,game.settings)).filter(s=>!used.has(s.id));
  if(!options.length){
    options=shuffle(featureList(player.card,game.settings));
  }
  return options.slice(0,8);
}
function cpuFallbackStatement(player,used){
 const candidates=featureList(player.card,game.settings).filter(s=>!used.has(s.id));
 if(candidates.length)return randomItem(candidates);
 // This should be practically unreachable with the expanded feature pool,
 // but guarantees that a CPU turn can never silently disappear.
 return {id:`cpu-fallback-${player.id}-${game.round}-${game.orderIndex}`,label:"カードの特徴を持つカードです",test:()=>true};
}
function playNextCpuTurn(){
 if(!game||game.phase!=="clue"||game.busy)return;
 const turnRound=game.round,turnIndex=game.orderIndex,player=currentPlayer();
 game.busy=true;
 const used=new Set(game.usedClueIds||[]);
 let truthful=shuffle(statementsFor(player.card,game.settings)).filter(s=>!used.has(s.id));
 let falsehoods=shuffle(falseStatementsFor(player.card,game.settings)).filter(s=>!used.has(s.id));
 let statement=null;
 if(!player.isWolf){statement=truthful[0]||cpuFallbackStatement(player,used);}
 else{
   const citizen=game.citizenCard;
   const shared=truthful.filter(st=>safeTest(st,citizen));
   statement=shared[0]||truthful[0]||falsehoods[0]||cpuFallbackStatement(player,used);
 }
 setTimeout(()=>{
   if(!game||game.phase!=="clue"||game.round!==turnRound||game.orderIndex!==turnIndex){if(game)game.busy=false;return;}
   try{
     if(submitClue(player,statement)){advanceClueTurn();}
     else{game.busy=false;advanceClueTurn();}
   }catch(e){console.error("CPU clue failed",e);game.busy=false;advanceClueTurn();}
 },450);
}
function advanceClueTurn(){
 if(!game||game.phase!=="clue")return;
 game.busy=false;game.currentOptions=[];game.clueMenu="root";
 game.orderIndex+=1;
 if(game.orderIndex>=game.order.length){
   if(game.round<game.settings.speechRounds){
     game.round+=1;game.order=buildOrder(game.round);game.orderIndex=0;
     game.logs.push({type:"system",name:"ラウンド切替",text:`第${game.round}ラウンド。発言順を${game.round%2===0?"逆":"元"}にします。`});
     renderGame();
     if(!currentPlayer().isHuman)cpuTimer=setTimeout(playNextCpuTurn,650);
     return;
   }
   game.phase="vote";renderGame();return;
 }
 renderGame();
 if(!currentPlayer().isHuman)cpuTimer=setTimeout(playNextCpuTurn,650);
}
function renderVotePhase(){phaseLabel.textContent="PHASE / 狼に投票する";phaseTitle.textContent="違うカードの人は誰？";const candidates=game.players.filter(p=>!p.isHuman),rounds=Number(game.settings?.speechRounds||2);actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>${rounds}ラウンドの発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-vote-id="${p.id}"><span class="mini-avatar">${String(p.id).padStart(2,"0")}</span><span><strong>${escapeHtml(p.name)}</strong><small>${p.clues.map(c=>`「${escapeHtml(c.label)}」`).join(" / ")}</small></span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-vote-id]").forEach(b=>b.addEventListener("click",()=>submitVotes(Number(b.dataset.voteId))));}
function chooseCpuVote(voter){const candidates=game.players.filter(p=>p.id!==voter.id);return candidates.map(candidate=>{const contradictions=candidate.clues.filter(clue=>!clue.ambiguous && !safeTest(clue,voter.card)).length;const lies=candidate.lies;return{id:candidate.id,score:contradictions*2.2+lies*1.1+Math.random()*1.4};}).sort((a,b)=>b.score-a.score)[0].id;}
function canWolfReverse(wolf){
  if(!wolf) return false;
  if(!game?.settings?.liePenalty) return true;
  const clues=wolf.clues||[];
  const madeAmbiguous=clues.some(c=>c&&c.ambiguous);
  const madeLie=Number(wolf.lies||0)>=1;
  return !(Number(wolf.lies||0)>=2 || (madeAmbiguous&&madeLie));
}
function resolveVoteWinner(eliminated){game.eliminatedId=eliminated.id;if(eliminated.isWolf){if(!canWolfReverse(game.players[game.wolfIndex])||(game.settings.liePenalty&&game.players[game.wolfIndex].lies>=2)){game.result="citizen";game.phase="result";}else game.phase="reverse";}else{game.result="wolf";game.phase="result";}renderGame();}
function renderRevotePhase(){const candidates=game.revoteCandidates||[];phaseLabel.textContent="PHASE / 再投票";phaseTitle.textContent="同票のため再投票";actionPanel.innerHTML=`<div class="action-heading"><p>REVOTE</p><h2>同票だったプレイヤーから選ぶ</h2><span>もう一度、狼だと思うプレイヤーを選んでください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-revote-id="${p.id}"><span class="mini-avatar">${String(p.id).padStart(2,"0")}</span><span><strong>${escapeHtml(p.name)}</strong><small>前回 ${game.tallies?.[p.id]||0}票</small></span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-revote-id]").forEach(b=>b.addEventListener("click",()=>submitRevote(Number(b.dataset.revoteId))));}
function submitRevote(humanVoteId, forcedVotes=null){if(!game||game.phase!=="revote")return;const candidates=game.revoteCandidates||[];if(!candidates.some(p=>p.id===Number(humanVoteId)))return;game.players.forEach(p=>p.vote=null);game.players[0].vote=Number(humanVoteId);if(forcedVotes){game.players.forEach(p=>{if(forcedVotes[p.id]!=null)p.vote=forcedVotes[p.id];});}else{game.players.slice(1).forEach(p=>p.vote=randomItem(candidates).id);}const tallies=Object.fromEntries(game.players.map(p=>[p.id,0]));game.players.forEach(p=>{if(tallies[p.vote]!=null)tallies[p.vote]++;});game.tallies=tallies;const high=Math.max(...candidates.map(p=>tallies[p.id]||0));const winners=candidates.filter(p=>(tallies[p.id]||0)===high);const eliminated=randomItem(winners);game.logs.push({type:"system",name:"再投票",text:`再投票の結果、${eliminated.name}が最多票になりました。`});game.revoteCandidates=null;resolveVoteWinner(eliminated);}
function submitVotes(humanVoteId, forcedVotes=null){game.players[0].vote=humanVoteId;if(forcedVotes){game.players.forEach(p=>{if(forcedVotes[p.id]!=null)p.vote=forcedVotes[p.id];});}else{game.players.slice(1).forEach(p=>p.vote=chooseCpuVote(p));}const tallies=Object.fromEntries(game.players.map(p=>[p.id,0]));game.players.forEach(p=>{if(tallies[p.vote]!=null)tallies[p.vote]++;});game.tallies=tallies;const high=Math.max(...Object.values(tallies)),tied=game.players.filter(p=>tallies[p.id]===high);if(tied.length>1&&!game.settings.noRevote&&game.players.length>tied.length){game.revoteCandidates=tied;game.players.forEach(p=>p.vote=null);game.logs.push({type:"system",name:"再投票",text:`最多票が同数（${high}票）のため再投票を行います。`});game.phase="revote";renderGame();return;}resolveVoteWinner(randomItem(tied));}
function voteSummaryHtml(){
  if(!game||!game.tallies) return "";
  const rows=game.players.map(p=>`<div class="vote-row"><span>${escapeHtml(p.name)}</span><strong>${game.tallies[p.id]||0}票</strong></div>`).join("");
  return `<section class="vote-summary-panel"><h3>投票結果</h3><p>誰が何票集めたかを確認できます。</p>${rows}</section>`;
}
function renderReversePhase(){phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";const wolf=game.players[game.wolfIndex];phaseTitle.textContent=`${wolf.name}は狼だった！`;if(wolf.isHuman){actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="vote-tally">${game.players.map(p=>`<span>${p.name}: ${game.tallies?.[p.id]||0}票</span>`).join("")}</div><input class="reverse-search" id="reverseSearch" placeholder="カード名を検索（日本語）"><div class="guess-card-grid">${getActiveCardPool(game.settings).filter(c=>c.name!==wolf.card.name).map(c=>`<button class="guess-card-button" data-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span><small>${escapeHtml(reverseGuessInfo(c))}</small></button>`).join("")}</div>`;document.getElementById("reverseSearch")?.addEventListener("input",e=>{const q=e.target.value;actionPanel.querySelectorAll("[data-guess]").forEach(b=>b.style.display=(b.textContent.includes(q)?"":"none"));});return;}actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${wolf.name}が市民カードを推理します</h2><span>当てられたら、狼の逆転勝利です。</span></div></div><button class="primary-button compact" id="cpuGuessButton" type="button"><span>逆転宣言を見る</span><span>→</span></button>`;document.getElementById("cpuGuessButton").addEventListener("click",submitCpuGuess);}
function submitCpuGuess(){
  if(!game || game.phase!=="reverse") return;
  const wolf=game.players[game.wolfIndex];
  const clues=game.players.filter(p=>!p.isWolf).flatMap(p=>p.clues||[]);
  const candidates=getActiveCardPool(game.settings)
    .filter(c=>c.name!==wolf.card.name)
    .map(card=>{
      const score=clues.reduce((s,clue)=>{
        // Ambiguous statements are not objective card features, so they
        // must not be evaluated as clue.test().
        if(!clue || clue.ambiguous || typeof clue.test!=="function") return s;
        try { return s + (clue.test(card)?1:0); } catch(e) { return s; }
      },0) + Math.random()*0.35;
      return {card,score};
    })
    .sort((a,b)=>b.score-a.score);
  finishReverseGuess(candidates[0]?.card||game.citizenCard);
}
function finishReverseGuess(guess){game.reverseGuess=guess;const correct=guess&&guess.name===game.citizenCard.name;game.result=correct?"wolf-reversal":"citizen";game.logs.push({type:"system",name:"逆転宣言",text:`狼は「${guess?jpName(guess):"不明"}」と宣言しました。`});game.phase="result";renderGame();}
function recordFinishedGame(){if(!game||game.recorded)return;const wolfWon=game.result==="wolf"||game.result==="wolf-reversal";const won=game.players[0].isWolf===wolfWon;const reward=won?100:50;if(won){matchRecord.wins++;}else{matchRecord.losses++;}matchRecord.medals+=reward;game.rewardMedals=reward;game.recorded=true;renderRecord();}
function renderResultPhase(){recordFinishedGame();phaseLabel.textContent="GAME OVER / 答え合わせ";const wolfWon=game.result==="wolf"||game.result==="wolf-reversal";phaseTitle.textContent=wolfWon?"狼チームの勝利":"市民チームの勝利";const msg={wolf:"選ばれたプレイヤーは市民でした。狼は正体を隠し切りました。","wolf-reversal":`狼が市民カード「${jpName(game.citizenCard)}」を見事に当て、逆転しました。`,citizen:`狼の宣言は「${game.reverseGuess?jpName(game.reverseGuess):"不明"}」。正解は「${jpName(game.citizenCard)}」でした。`}[game.result];actionPanel.innerHTML=`<div class="result-banner ${wolfWon?"wolf-win":"citizen-win"}"><p>${wolfWon?"狼チームの勝利":"市民チームの勝利"}</p><h2>${wolfWon?"狼の勝利":"市民の勝利"}</h2><span>${msg}</span><strong class="reward-message"><img class="medal-icon" src="assets/medal-icon.png" alt=""> メダル +${game.rewardMedals||0}枚</strong></div><div class="answer-cards"><div><small>市民カード</small><img class="ygo-thumb" src="${cardImage(game.citizenCard)}"><strong>${jpName(game.citizenCard)}</strong><em>${cardInfo(game.citizenCard)}${cardStats(game.citizenCard)?" · "+cardStats(game.citizenCard):""}</em></div><div><small>狼カード</small><img class="ygo-thumb" src="${cardImage(game.wolfCard)}"><strong>${jpName(game.wolfCard)}</strong><em>${cardInfo(game.wolfCard)}${cardStats(game.wolfCard)?" · "+cardStats(game.wolfCard):""}</em></div></div><button class="primary-button compact" id="playAgainButton" type="button"><span>もう一度遊ぶ</span><span>↻</span></button>`;document.getElementById("playAgainButton").addEventListener("click",startGame);}
async function returnToSetup(){
  stopFreeMatch();
  clearTimeout(cpuTimer);
  clearTimeout(onlineCpuTimer);
  // Detach Firebase listeners immediately; cleanup is best-effort and never
  // blocks the UI from returning to the setup screen.
  if(onlineRoomUnsubscribe){try{onlineRoomUnsubscribe();}catch{}}
  if(onlineActionUnsubscribe){try{onlineActionUnsubscribe();}catch{}}
  onlineRoomUnsubscribe=null;
  onlineActionUnsubscribe=null;
  // Invalidate every queued Firebase callback before clearing the room state.
  onlineSessionEpoch++;
  onlineRoomSnapshotSeq++;
  const oldRoom=onlineRoomCodeValue;
  const oldWasHost=onlineHost;
  // Old room identity must never survive a return to the title/setup screen.
  // The caller that owns the room performs best-effort Firebase cleanup below, but the local identity is cleared first.
  onlineRoomCodeValue="";
  onlineHost=false;
  onlineHostProcessing=false;
  onlineMatchId="";
  onlineLoadedGameMatchId="";
  onlineTurnReadyKey="";
  onlineTurnReadyPendingKey="";
  onlinePendingAction=null;
  onlineClueMenu="root";
  onlineHostSecrets=null;
  onlineGame=null;
  onlineMyCard=null;
  onlineLastActionId="";
  onlineScoreRecorded=false;onlineRewardMedals=0;
  onlineLobby.hidden=true;
  onlineRoomCode.textContent="----";
  onlineLobbyStatus.textContent="新しい部屋を作成するか、ルームコードを入力してください";
  createRoomButton.hidden=false; joinRoomButton.hidden=false; roomCodeInput.hidden=false;
  onlineStartButton.hidden=true; onlineStartButton.disabled=true; roomCodeInput.value="";
  try{onlineDialog.close();}catch{}
  onlineDialog.removeAttribute("open");
  if(oldRoom){
    // Best-effort cleanup. Hosts remove the room; guests remove only their own membership.
    firebaseAuthPromise.then(()=>oldWasHost?remove(ref(firebaseDb,`rooms/${oldRoom}`)):remove(ref(firebaseDb,`rooms/${oldRoom}/players/${firebaseUid}`))).catch(()=>{});
  }
  onlineMode=false;
  window.cardWolfOnlineMode=false;
  soloModeButton.classList.remove("is-selected");
  onlineModeButton.classList.remove("is-selected");
  voiceModeButton.classList.remove("is-selected");
  document.getElementById("freeMatchButton")?.classList.remove("is-selected");
  document.querySelector(".room-code-card")?.removeAttribute("hidden");
  soloModeButton.setAttribute("aria-pressed","false");
  onlineModeButton.setAttribute("aria-pressed","false");
  voiceModeButton.setAttribute("aria-pressed","false");
  document.getElementById("freeMatchButton")?.setAttribute("aria-pressed","false");
  document.getElementById("freeMatchButton")?.setAttribute("aria-pressed","false");
  game=null;
  setupScreen.hidden=false;
  gameScreen.hidden=true;
  actionPanel.innerHTML="";
  talkLog.innerHTML="";
  logCount.textContent="0 messages";
  const mainScroller=document.querySelector("main"); if(mainScroller) mainScroller.scrollTop=0; else window.scrollTo({top:0,behavior:"auto"});
}
function openPool(){const activeSize=normalizeCardPoolSize((onlineMode&&onlineGame?.settings?.cardPoolSize)||getSettings().cardPoolSize);renderPoolCount({cardPoolSize:activeSize});poolGrid.innerHTML=CARD_POOL.map((c,i)=>{const active=i<activeSize;const statusLabel=active?"使用カード":"未使用カード";const unusedLabel=active?"":'<small class="pool-unused-label">今回のゲームでは不使用</small>';return `<div class="pool-card ${active?"is-active":"is-unused"}" aria-label="${statusLabel}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}">${cardDisplay(c)}${unusedLabel}</div>`;}).join("");poolDialog.showModal();}
// v133: Mobile touch scrolling must not activate a clue/vote button when the finger moved.
let cwTouchStart=null;
actionPanel.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch")return;const b=e.target.closest?.("button");cwTouchStart=b?{button:b,x:e.clientX,y:e.clientY,moved:false}:null;},{capture:true});
actionPanel.addEventListener("pointermove",e=>{if(!cwTouchStart||e.pointerType!=="touch")return;if(Math.hypot(e.clientX-cwTouchStart.x,e.clientY-cwTouchStart.y)>10)cwTouchStart.moved=true;},{capture:true});
actionPanel.addEventListener("click",e=>{if(!cwTouchStart)return;if(cwTouchStart.moved&&e.target.closest?.("button")===cwTouchStart.button){e.preventDefault();e.stopImmediatePropagation();}cwTouchStart=null;},{capture:true});
actionPanel.addEventListener("pointercancel",()=>{cwTouchStart=null;},{capture:true});

// v133: Keep practice clue-menu toggles on a stable parent so re-renders cannot drop the handler.
actionPanel.addEventListener("pointerdown",(event)=>{
  const neg=event.target.closest?.("[data-clue-negative-category]");
  const pos=event.target.closest?.("[data-clue-positive-category]");
  if(!actionPanel.contains(event.target))return;
  if(neg){ event.preventDefault(); if(game?.phase!=="clue"||!currentPlayer()?.isHuman)return; game.clueMenu=`${neg.dataset.clueNegativeCategory}-negative`; renderCluePhase(); return; }
  if(pos){ event.preventDefault(); if(game?.phase!=="clue"||!currentPlayer()?.isHuman)return; game.clueMenu=pos.dataset.cluePositiveCategory; renderCluePhase(); return; }
},{capture:true});

// v91: Online action buttons are rendered from Firebase snapshots. A snapshot can
// replace actionPanel.innerHTML between pointer-down and click, which makes the
// old button's click handler disappear and feels like the button is unresponsive.
// Handle the interaction at the stable parent on pointerdown instead. This runs
// before the usual click event and survives actionPanel re-renders.
actionPanel.addEventListener("pointerdown", async (event)=>{
  const clueCategory=event.target.closest?.("[data-online-clue-category]");
  if(clueCategory && actionPanel.contains(clueCategory)){
    event.preventDefault();
    if(!onlineGame || onlineGame.phase!=="clue" || String(onlineCurrentId())!==String(firebaseUid)) return;
    onlineClueMenu=clueCategory.dataset.onlineClueCategory;
    renderOnlineClue();
    return;
  }
  const clueNegativeCategory=event.target.closest?.("[data-online-clue-negative-category]");
  if(clueNegativeCategory && actionPanel.contains(clueNegativeCategory)){
    event.preventDefault();
    if(!onlineGame || onlineGame.phase!=="clue" || String(onlineCurrentId())!==String(firebaseUid)) return;
    onlineClueMenu=`${clueNegativeCategory.dataset.onlineClueNegativeCategory}-negative`;
    renderOnlineClue();
    return;
  }
  const cluePositiveCategory=event.target.closest?.("[data-online-clue-positive-category]");
  if(cluePositiveCategory && actionPanel.contains(cluePositiveCategory)){
    event.preventDefault();
    if(!onlineGame || onlineGame.phase!=="clue" || String(onlineCurrentId())!==String(firebaseUid)) return;
    onlineClueMenu=cluePositiveCategory.dataset.onlineCluePositiveCategory;
    renderOnlineClue();
    return;
  }
  const clueButton=event.target.closest?.("[data-online-clue]");
  if(clueButton && actionPanel.contains(clueButton)){
    event.preventDefault();
    if(clueButton.disabled)return;
    const clueId=clueButton.dataset.onlineClue;
    if(/^(atk|def)-(500|1000|1500)$/.test(clueId)){onlineClueMenu=clueId;renderOnlineClue();return;}
    await onlineSubmitClue(clueId);
    return;
  }
  const voteButton=event.target.closest?.("[data-online-vote]");
  if(voteButton && actionPanel.contains(voteButton)){
    event.preventDefault();
    if(voteButton.disabled || onlinePendingAction)return;
    if(!onlineGame || onlineGame.phase!=="vote")return;
    const voteId=String(voteButton.dataset.onlineVote);
    onlinePendingAction={type:"vote",voteId,round:Number(onlineGame.round),orderIndex:Number(onlineGame.orderIndex)};
    renderOnlineVote();
    const ok=await submitOnlineAction({type:"vote",voteId,round:onlineGame.round,at:Date.now()});
    if(!ok){onlinePendingAction=null;renderOnlineVote();}
  }
});

// v133: Reverse-card selection must distinguish a tap from a scroll gesture.
// On touch devices, activating on pointerdown makes the first touch of a card
// select it before the user has had a chance to start scrolling. We therefore
// remember the touched card and activate only on pointerup when the finger
// stayed within a small movement threshold. Desktop click remains supported.
let onlineReverseHandledActionKey="";
let reverseTouchStart=null;
let reverseTouchSuppressClick=false;
function findReverseButton(event){
  const path=typeof event.composedPath==="function"?event.composedPath():[];
  for(const node of path){
    if(node instanceof Element && node.matches?.("[data-online-guess], [data-guess]")) return node;
  }
  const target=event.target;
  return target instanceof Element?target.closest?.("[data-online-guess], [data-guess]"):null;
}
async function handleOnlineReverseSelection(button){
  if(!button || !actionPanel.contains(button)) return;
  if(button.disabled || onlinePendingAction) return;
  if(!onlineGame || onlineGame.phase!=="reverse") return;
  if(String(onlineGame.eliminatedId||"")!==String(firebaseUid)) return;
  const guess=String(button.dataset.onlineGuess||"");
  if(!guess) return;
  const actionKey=`${onlineGame.matchId||""}|${onlineGame.round||0}|${guess}`;
  if(onlineReverseHandledActionKey===actionKey) return;
  onlineReverseHandledActionKey=actionKey;
  button.disabled=true;
  onlinePendingAction={type:"reverse",guess,round:Number(onlineGame.round),orderIndex:Number(onlineGame.orderIndex||0)};
  const ok=await submitOnlineAction({type:"reverse",guess,round:onlineGame.round,orderIndex:onlineGame.orderIndex,at:Date.now()});
  if(!ok){
    onlinePendingAction=null;
    onlineReverseHandledActionKey="";
    renderOnlineReverse();
  }
}
function handleSoloReverseSelection(button){
  if(!button || !actionPanel.contains(button) || button.disabled || game?.phase!=="reverse") return;
  const guessName=String(button.dataset.guess||"");
  if(!guessName) return;
  const guess=getActiveCardPool(game.settings).find(c=>c.name===guessName);
  if(guess) finishReverseGuess(guess);
}
document.addEventListener("pointerdown", event=>{
  const button=findReverseButton(event);
  if(!button || !actionPanel.contains(button) || event.pointerType!=="touch") return;
  reverseTouchStart={button,x:event.clientX,y:event.clientY,moved:false};
  reverseTouchSuppressClick=false;
}, true);
document.addEventListener("pointermove", event=>{
  if(!reverseTouchStart || event.pointerType!=="touch") return;
  if(Math.hypot(event.clientX-reverseTouchStart.x,event.clientY-reverseTouchStart.y)>12) reverseTouchStart.moved=true;
}, true);
document.addEventListener("pointerup", event=>{
  if(!reverseTouchStart || event.pointerType!=="touch") return;
  const state=reverseTouchStart;
  reverseTouchStart=null;
  if(state.moved){ reverseTouchSuppressClick=true; return; }
  const button=state.button;
  if(!button || !actionPanel.contains(button)) return;
  reverseTouchSuppressClick=true;
  if(button.matches?.("[data-online-guess]")) void handleOnlineReverseSelection(button);
  else if(button.matches?.("[data-guess]")) handleSoloReverseSelection(button);
}, true);
document.addEventListener("pointercancel", ()=>{reverseTouchStart=null;reverseTouchSuppressClick=true;}, true);
document.addEventListener("click", event=>{
  const button=findReverseButton(event);
  if(!button || !actionPanel.contains(button)) return;
  if(reverseTouchSuppressClick){
    reverseTouchSuppressClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if(button.matches?.("[data-online-guess]")) void handleOnlineReverseSelection(button);
  else if(button.matches?.("[data-guess]")) handleSoloReverseSelection(button);
}, true);

practicePlayerCountSelect?.addEventListener("change",syncPracticePlayerCount);
restartButton.addEventListener("click",returnToSetup);document.getElementById("rulesButton").addEventListener("click",()=>rulesDialog.showModal());document.getElementById("closeRulesButton").addEventListener("click",()=>rulesDialog.close());document.getElementById("poolButton").addEventListener("click",openPool);document.getElementById("closePoolButton").addEventListener("click",()=>poolDialog.close());advancedSettingsButton.addEventListener("click",()=>settingsDialog.showModal());closeSettingsButton.addEventListener("click",()=>settingsDialog.close());closeSettingsButtonBottom.addEventListener("click",()=>settingsDialog.close());resetScoreButton.addEventListener("click",()=>{if(confirm("勝利数と敗北数をリセットしますか？\nメダルはリセットされず、そのまま残ります。")){matchRecord.wins=0;matchRecord.losses=0;renderRecord();}});rulesDialog.addEventListener("click",e=>{if(e.target===rulesDialog)rulesDialog.close();});poolDialog.addEventListener("click",e=>{if(e.target===poolDialog)poolDialog.close();});settingsDialog.addEventListener("click",e=>{if(e.target===settingsDialog)settingsDialog.close();});syncPracticePlayerCount();renderRecord();if(CARD_POOL.length===0)soloModeButton.disabled=true;







/* v26 ONLINE MODE
   Host-authoritative prototype using Firebase Realtime Database.
   Secrets (cards/roles) are kept locally by the host and each player's own
   card is also written to a per-user private node protected by Firebase rules.
*/
let onlineMode=false;
let onlineVoicePreset=false;
let freeMatchMode=false;
let freeMatchQueueUnsubscribe=null;
let freeMatchStartedAt=0;
let freeMatchTimer=null;
let freeMatchCreationInFlight=false;
let freeMatchRoomPollTimer=null;
let onlineFreeMatchedRoom=false;
let onlineRoomCodeValue="";
let onlineRoomUnsubscribe=null;
let onlineActionUnsubscribe=null;
let onlineGame=null;
let onlineMyCard=null;
let onlineHost=false;
let onlineHostSecrets=null;
let onlineCpuTimer=null;
let onlineLastActionId="";
const onlineProcessedActionIds=new Set();
const onlineActionPromises=new Map();
let onlineScoreRecorded=false;let onlineRewardMedals=0;
let onlinePendingAction=null;
let onlineDiscussionTimer=null;
let onlineDiscussionDeadlineAt=0;
let onlineHostActionQueue=Promise.resolve();
let onlineHostProcessing=false;
let onlineMatchId="";
let onlineClueMenu="root";
let onlineTurnReadyKey="";
let onlineTurnReadyTimer=null;
let onlineTurnReadyPendingKey="";
let onlineRoomSnapshotSeq=0;
let onlineLoadedGameMatchId="";
// Monotonic session token: callbacks from a room that was already left must never redraw the UI.
let onlineSessionEpoch=0;

function setMode(mode){
  const isOnline = mode===true || mode==="online" || mode==="voice" || mode==="free";
  onlineMode=Boolean(isOnline);
  onlineVoicePreset=(mode==="voice");
  freeMatchMode=(mode==="free");
  window.cardWolfOnlineMode=onlineMode;
  soloModeButton.classList.remove("is-selected");
  onlineModeButton.classList.remove("is-selected");
  voiceModeButton.classList.remove("is-selected");
  document.getElementById("freeMatchButton")?.classList.remove("is-selected");
  soloModeButton.setAttribute("aria-pressed","false");
  onlineModeButton.setAttribute("aria-pressed","false");
  voiceModeButton.setAttribute("aria-pressed","false");
  const title=document.getElementById("onlineDialogTitle");
  const note=document.getElementById("onlineDialogNote");
  const voiceRow=document.getElementById("onlineVoiceSettingRow");
  if(onlineMode){
    if(freeMatchMode){
      const b=document.getElementById("freeMatchButton"); if(b){b.classList.add("is-selected");b.setAttribute("aria-pressed","true");}
      if(title) title.textContent="フリーマッチング（対人戦）";
      if(note) note.textContent="最大30秒、同じフリーマッチングに参加したプレイヤーと自動でマッチします。4人部屋で、2〜3人ならCPUが参加します。";
      if(voiceRow) voiceRow.hidden=true;
      startFreeMatch();
      return;
    }
    if(onlineVoicePreset){
      voiceModeButton.classList.add("is-selected");
      voiceModeButton.setAttribute("aria-pressed","true");
      if(title) title.textContent="カード提示のみモード";
      if(note) note.textContent="ルームを作成・参加して、カードを提示しながらボイスチャットで自由に議論します。最大8人。人間が3人未満ならCPUを自動追加します。";
      if(voiceRow) voiceRow.hidden=false;
    }else{
      onlineModeButton.classList.add("is-selected");
      onlineModeButton.setAttribute("aria-pressed","true");
      if(title) title.textContent="オンラインモード";
      if(note) note.textContent="同じURLから参加し、ルームコードで同じゲームに入ります。最大8人。人間が3人未満ならCPUを自動追加します。";
      if(voiceRow) voiceRow.hidden=true;
    }
    if(!onlineRoomCodeValue){
      onlineSessionEpoch++;
      onlineRoomSnapshotSeq++;
      onlineLobby.hidden=true;
      onlineRoomCode.textContent="----";
      onlineLobbyStatus.textContent="新しい部屋を作成するか、ルームコードを入力してください";
      createRoomButton.hidden=false; joinRoomButton.hidden=false; roomCodeInput.hidden=false;
      onlineStartButton.hidden=true; onlineStartButton.disabled=true;
      roomCodeInput.value="";
    }
    try{
      if(!onlineDialog.open) onlineDialog.showModal();
    }catch(e){
      console.warn("showModal failed; using open fallback",e);
      onlineDialog.setAttribute("open","");
    }
  } else {
    if(title) title.textContent="オンラインモード";
    if(note) note.textContent="同じURLから参加し、ルームコードで同じゲームに入ります。最大8人。人間が3人未満ならCPUを自動追加します。";
    if(voiceRow) voiceRow.hidden=true;
    try{onlineDialog.close();}catch{}
    onlineDialog.removeAttribute("open");
  }
}

// Keep the mode buttons wired near their definition.
soloModeButton.addEventListener("click",()=>{ setMode(false); startGame(); });
onlineModeButton.addEventListener("click",()=>setMode("online"));
voiceModeButton.addEventListener("click",()=>setMode("voice"));
document.getElementById("freeMatchButton")?.addEventListener("click",()=>setMode("free"));
function freeMatchQueueRef(){return ref(firebaseDb,"freeMatchQueue");}
function freeMatchModeKey(){return "standard";}
function freeMatchRoomCode(uids){const text=[...uids].sort().join("|");let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";for(let i=0;i<6;i++){out+=chars[(h>>>((i%4)*5))%chars.length];h=Math.imul(h^i,16777619);}return out;}
function stopFreeMatch(){if(freeMatchQueueUnsubscribe){freeMatchQueueUnsubscribe();freeMatchQueueUnsubscribe=null;}if(freeMatchTimer){clearInterval(freeMatchTimer);freeMatchTimer=null;}if(freeMatchRoomPollTimer){clearInterval(freeMatchRoomPollTimer);freeMatchRoomPollTimer=null;}freeMatchStartedAt=0;freeMatchCreationInFlight=false;}
function renderFreeMatchQueuePlayers(players){
  if(!onlinePlayerList)return;
  const list=(players||[]).slice(0,4);
  if(!list.length){onlinePlayerList.innerHTML="<div class=\"muted\">対戦相手を探しています…</div>";return;}
  onlinePlayerList.innerHTML=list.map((p,i)=>`<div class="online-player-row"><span class="mini-avatar">${String(p.uid)===String(firebaseUid)?"YOU":"P"}</span><strong>${escapeHtml(p.name||"プレイヤー")}</strong><small>${String(p.uid)===String(firebaseUid)?"あなた":"参加待機中"}</small></div>`).join("");
}
async function startFreeMatch(){
  stopFreeMatch();
  freeMatchStartedAt=Date.now();
  onlineMode=true;onlineVoicePreset=false;onlineHost=false;onlineRoomCodeValue="";
  createRoomButton.hidden=true;joinRoomButton.hidden=true;roomCodeInput.hidden=true;
  onlineLobby.hidden=false;onlineLobbyStatus.textContent="マッチング中… 残り30秒";
  onlineDialog.classList.add("free-match-waiting");onlinePlayerList.innerHTML="<div class=\"muted\">対戦相手を探しています…</div>";
  document.querySelector(".room-code-card")?.setAttribute("hidden","");
  const freeLimitRow=document.getElementById("onlinePlayerLimitSettingRow");
  if(freeLimitRow){ freeLimitRow.hidden=true; freeLimitRow.style.display="none"; }
  const freeCpuRow=document.getElementById("onlineCpuSettingRow");
  if(freeCpuRow) freeCpuRow.hidden=true;
  const freeVoiceRow=document.getElementById("onlineVoiceSettingRow");
  if(freeVoiceRow) freeVoiceRow.hidden=true;
  onlineStartButton.hidden=true;
  if(!onlineDialog.open){try{onlineDialog.showModal();}catch{onlineDialog.setAttribute("open","");}}
  const startedAt=freeMatchStartedAt, deadline=startedAt+30000;
  freeMatchTimer=setInterval(async()=>{
    if(freeMatchStartedAt!==startedAt)return;
    const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    if(left>0){onlineLobbyStatus.textContent=`マッチング中… 残り${left}秒`;return;}
    clearInterval(freeMatchTimer);freeMatchTimer=null;
    const queueNow=await get(ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}`)).catch(()=>null);
    const now=Date.now();
    // The 30-second deadline belongs to the oldest player in the queue.
    // Do not discard that player's entry at the exact deadline: a tiny clock
    // difference was previously making the oldest entry fall outside the
    // `now - 30000` filter, so the room was treated as a failed one-player
    // match and everyone was returned to the title screen.
    const all=Object.values(queueNow?.val()||{})
      .filter(x=>x&&x.uid&&Number(x.joinedAt)<=now&&Number(x.joinedAt)>now-120000)
      .sort((a,b)=>Number(a.joinedAt)-Number(b.joinedAt))
      .slice(0,4);
    renderFreeMatchQueuePlayers(all);
    if(all.length>=2){await createFreeMatchRoom(all,true);return;}
    await finishFreeMatchWait(false);
  },250);
  try{await ensureFirebase();}catch(e){if(freeMatchStartedAt===startedAt){await finishFreeMatchWait(false);alert(firebaseAuthErrorText(e));}return;}
  if(freeMatchStartedAt!==startedAt)return;
  const uid=firebaseUid,name=getPlayerName();
  const entryRef=ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}/${uid}`);
  try{await set(entryRef,{uid,name,joinedAt:startedAt,mode:freeMatchModeKey()});}
  catch(e){await finishFreeMatchWait(false);const code=String(e?.code||e?.message||"");alert(code.includes("permission_denied")?"フリーマッチングの利用権限がFirebase側で許可されていません。":"マッチングサーバーへの接続に失敗しました。時間をおいて再度お試しください。");return;}
  freeMatchQueueUnsubscribe=onValue(ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}`),async snap=>{
    if(freeMatchStartedAt!==startedAt)return;
    const now=Date.now();
    // Keep the oldest queued player until the first player's 30-second
    // deadline. Entries older than two minutes are stale and ignored.
    const all=Object.values(snap.val()||{})
      .filter(x=>x&&x.uid&&Number(x.joinedAt)<=now&&Number(x.joinedAt)>now-120000)
      .sort((a,b)=>Number(a.joinedAt)-Number(b.joinedAt));
    renderFreeMatchQueuePlayers(all.slice(0,4));
    const knownRoom=all.find(x=>x.roomCode);
    if(knownRoom?.roomCode){
      const targetRoom=String(knownRoom.roomCode);
      const roomSnap=await get(ref(firebaseDb,`rooms/${targetRoom}`)).catch(()=>null);
      if(roomSnap?.exists()){
        await enterFreeMatchedRoom(targetRoom);
        return;
      }
    }
    const count=Math.min(4,all.length);
    const oldestJoined=all.length?Number(all[0].joinedAt):startedAt;
    onlineLobbyStatus.textContent=`マッチング中… ${count}/4人・残り${Math.max(0,Math.ceil((deadline-now)/1000))}秒`;
    // Wait for a full four-player group. If the oldest queued player reaches 30s first, start with 2-3 humans and fill the room with CPU.
    if(count>=4) await createFreeMatchRoom(all.slice(0,4),false);
    else if(count>=2 && now-oldestJoined>=30000) await createFreeMatchRoom(all.slice(0,4),true);
  });
}
async function finishFreeMatchWait(success){
  const uid=firebaseUid;
  const wasWaiting=Boolean(freeMatchStartedAt);
  stopFreeMatch();
  if(uid&&firebaseDb){try{await remove(ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}/${uid}`));}catch{}}
  document.querySelector(".room-code-card")?.removeAttribute("hidden");
  const limitRow=document.getElementById("onlinePlayerLimitSettingRow"); if(limitRow){ limitRow.hidden=false; limitRow.style.display=""; }
  onlineDialog.classList.remove("free-match-waiting");
  onlineFreeMatchedRoom=false;
  const cpuRow=document.getElementById("onlineCpuSettingRow"); if(cpuRow) cpuRow.hidden=false;
  const voiceRow=document.getElementById("onlineVoiceSettingRow"); if(voiceRow) voiceRow.hidden=!onlineVoicePreset;
  document.getElementById("freeMatchButton")?.classList.remove("is-selected");
  document.getElementById("freeMatchButton")?.setAttribute("aria-pressed","false");
  if(!success&&wasWaiting){onlineLobbyStatus.textContent="マッチングを終了しました";returnToSetup();}
}
async function enterFreeMatchedRoom(roomCode){
  if(!freeMatchStartedAt)return;
  const snap=await get(ref(firebaseDb,`rooms/${roomCode}`)).catch(()=>null);
  if(!snap?.exists())return;
  const data=snap.val();
  const players=Object.values(data.players||{});
  if(!players.some(p=>String(p.uid)===String(firebaseUid))) return;
  stopFreeMatch();
  await remove(ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}/${firebaseUid}`)).catch(()=>{});
  onlineRoomCodeValue=roomCode;
  onlineHost=String(firebaseUid)===String(data.hostUid);
  freeMatchMode=false;onlineVoicePreset=false;onlineFreeMatchedRoom=true;
  onlineDialog.classList.remove("free-match-waiting");
  openOnlineLobby();
}
async function createFreeMatchRoom(candidates,forceStart=false){
  if(!freeMatchStartedAt||candidates.length<2||freeMatchCreationInFlight)return;
  const startedAt=freeMatchStartedAt;
  const ordered=[...candidates].filter(x=>x&&x.uid).sort((a,b)=>Number(a.joinedAt)-Number(b.joinedAt)||String(a.uid).localeCompare(String(b.uid))).slice(0,4);
  const ids=ordered.map(x=>String(x.uid)).sort();
  const roomCode=freeMatchRoomCode(ids),hostUid=String(ordered[0].uid);

  // The oldest queued player is the only host. Other clients must not attempt
  // to create the room themselves. They can, however, deterministically derive
  // the same room code and wait for the host's room to appear. This is important
  // because the queue Rules intentionally allow each user to write only their
  // own queue entry, so the host cannot safely write roomCode into everybody's
  // queue entry.
  if(String(firebaseUid)!==hostUid){
    if(freeMatchRoomPollTimer)return;
    freeMatchRoomPollTimer=setInterval(async()=>{
      if(freeMatchStartedAt!==startedAt){clearInterval(freeMatchRoomPollTimer);freeMatchRoomPollTimer=null;return;}
      const snap=await get(ref(firebaseDb,`rooms/${roomCode}`)).catch(()=>null);
      if(snap?.exists()){
        clearInterval(freeMatchRoomPollTimer);freeMatchRoomPollTimer=null;
        await enterFreeMatchedRoom(roomCode);
      }
    },250);
    return;
  }

  freeMatchCreationInFlight=true;
  try{
    const uid=firebaseUid,entryRef=ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}/${uid}`);
    await update(entryRef,{roomCode,hostUid}).catch(e=>{throw e;});
    let roomSnap=await get(ref(firebaseDb,`rooms/${roomCode}`));
    if(!roomSnap.exists()){
      const players={};
      ordered.forEach(x=>players[x.uid]={uid:x.uid,name:x.name,host:String(x.uid)===hostUid});
      const settings={...getSettings(),voiceMode:false,discussionSeconds:120};
      await set(ref(firebaseDb,`rooms/${roomCode}`),{hostUid,status:"lobby",maxPlayers:4,createdAt:Date.now(),freeMatch:true,settings,players});
      for(const x of ordered) await set(ref(firebaseDb,`privateCards/${roomCode}/${x.uid}`),{cardName:null});
      roomSnap=await get(ref(firebaseDb,`rooms/${roomCode}`));
    }
    if(!roomSnap.exists())throw new Error("free-match-room-create-failed");

    // The room itself contains the complete human roster, so non-host clients
    // do not need the host to modify their queue entries. The UI never exposes
    // this internal room code.
    stopFreeMatch();
    document.querySelector(".room-code-card")?.setAttribute("hidden","");
    onlineRoomCodeValue=roomCode;onlineHost=true;freeMatchMode=false;onlineVoicePreset=false;onlineFreeMatchedRoom=true;
    onlineDialog.classList.add("free-match-waiting");
    onlineDialog.classList.remove("free-match-waiting");
    onlineRoomCode.textContent="----";
    openOnlineLobby();
    onlineRoomCode.textContent="----";

    // For 2–3 humans the oldest player's 30-second deadline starts the game
    // immediately with CPU fill. With 4 humans, start as soon as the full room
    // is assembled.
    if(forceStart || ordered.length>=4){
      setTimeout(()=>startOnlineHostGame().catch(e=>console.error("free-match start failed:",e)),250);
    }
  }catch(e){
    console.error("free-match room creation failed:",e);
    if(freeMatchStartedAt) await finishFreeMatchWait(false);
    else returnToSetup();
  }finally{
    freeMatchCreationInFlight=false;
  }
}

function onlineRoomRef(){return ref(firebaseDb,`rooms/${onlineRoomCodeValue}`);}
function makeRoomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<4;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s;}
function onlineSettings(){return {...getSettings(),statStatementUnit:500,voiceMode:false,discussionSeconds:120};}
function getOnlineLobbySettings(){
  const voice=Boolean(onlineVoicePreset);
  const seconds=Math.max(60,Number(document.getElementById("onlineDiscussionMinutes")?.value||120));
  return {...onlineSettings(),voiceMode:voice,discussionSeconds:seconds,cardPoolSize:normalizeCardPoolSize(document.getElementById("cardPoolSize")?.value||100)};
}
function syncOnlineLobbySettings(data){
  const s=data?.settings||onlineSettings();
  const isFree=Boolean(data?.freeMatch);
  const timeEl=document.getElementById("onlineDiscussionMinutes"), maxEl=document.getElementById("onlineMaxPlayers"), poolEl=document.getElementById("cardPoolSize");
  const roomIsVoice=Boolean(s.voiceMode);
  const voiceRow=document.getElementById("onlineVoiceSettingRow");
  if(voiceRow) voiceRow.hidden=isFree || !roomIsVoice;
  if(timeEl) timeEl.value=String(Number(s.discussionSeconds||120));
  if(maxEl) maxEl.value=String(Math.min(8,Math.max(3,Number(data?.maxPlayers||4))));
  if(poolEl) poolEl.value=String(normalizeCardPoolSize(s.cardPoolSize||100));
  renderPoolCount(s);
  if(onlineHost){
    const cpu=document.getElementById("onlineCpuSettingRow"); if(cpu) cpu.hidden=isFree;
    if(maxEl) { maxEl.disabled=false; if(isFree){ const row=maxEl.closest?.(".online-player-limit-setting"); if(row){ row.hidden=true; row.style.display="none"; } } }
  } else {
    const row=document.getElementById("onlineVoiceSettingRow"); if(row) row.hidden=true;
    const cpu=document.getElementById("onlineCpuSettingRow"); if(cpu) cpu.hidden=true;
    if(maxEl) maxEl.disabled=true;
  }
  if(isFree){
    const limit=document.getElementById("onlinePlayerLimitSettingRow"); if(limit){ limit.hidden=true; limit.style.display="none"; }
    const cpu=document.getElementById("onlineCpuSettingRow"); if(cpu) cpu.hidden=true;
    if(voiceRow) voiceRow.hidden=true;
  }
}
function onlinePublicPlayers(){
  return (onlineGame?.players||[]).map(p=>({id:p.id,name:p.name,isHuman:Boolean(p.isHuman),clues:(p.clues||[]).map(c=>({id:c.id,label:c.label,ambiguous:Boolean(c.ambiguous)})),vote:p.vote??null,...(onlineGame?.settings?.showLieCount?{lies:Number(p.lies||0)}:{})}));
}
function onlineSnapshot(extra={}){
  // Firebase rejects undefined values. Replay can receive an older snapshot
  // where reverseGuess is a card object or a string, so normalize both forms.
  const rg=onlineGame?.reverseGuess;
  const reverseGuessName=typeof rg==="string"?rg:(rg?.name||null);
  const revealSource=extra.reveal!==undefined?extra.reveal:(onlineGame?.reveal||null);
  const reveal=revealSource?{
    ...revealSource,
    reverseGuess:(typeof revealSource.reverseGuess==="string"?revealSource.reverseGuess:(revealSource.reverseGuess?.name||null))
  }:null;
  return {
    matchId:onlineGame.matchId||onlineMatchId||"",
    phase:onlineGame.phase, round:onlineGame.round, order:Array.isArray(onlineGame.order)?onlineGame.order:[],
    orderIndex:Number.isFinite(Number(onlineGame.orderIndex))?Number(onlineGame.orderIndex):0,
    discussionStartedAt:onlineGame.discussionStartedAt||null, discussionDeadlineAt:onlineGame.discussionDeadlineAt||null,
    transition:onlineGame.transition||null,
    usedClueIds:Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[],
    logs:Array.isArray(onlineGame.logs)?onlineGame.logs:[], settings:onlineGame.settings||onlineSettings(),
    players:onlinePublicPlayers(), tallies:onlineGame.tallies||null,
    eliminatedId:onlineGame.eliminatedId??null, result:onlineGame.result??null,
    reverseGuess:reverseGuessName, reveal, updatedAt:Date.now()
  };
}
async function hostWriteGame(){
  if(!onlineHost||!onlineRoomCodeValue||!onlineGame)return;
  await update(onlineRoomRef(),{game:onlineSnapshot({reveal:onlineGame.reveal||null})});
}
async function ensureFirebase(){
  try{
    return await ensureFirebaseAuth();
  }catch(e){
    alert(firebaseAuthErrorText(e));
    throw e;
  }
}
function lobbyPlayersFromValue(v){return Object.values(v?.players||{});}
function renderOnlineLobby(data){
  const players=lobbyPlayersFromValue(data);
  const isFree=Boolean(data?.freeMatch);
  const roomCard=document.querySelector(".room-code-card");
  const limitRow=document.getElementById("onlinePlayerLimitSettingRow");
  const cpuRow=document.getElementById("onlineCpuSettingRow");
  const voiceRow=document.getElementById("onlineVoiceSettingRow");
  if(roomCard) roomCard.hidden=isFree;
  if(limitRow){ limitRow.hidden=isFree; limitRow.style.display=isFree?"none":""; }
  if(cpuRow) cpuRow.hidden=isFree;
  if(voiceRow) voiceRow.hidden=isFree || !Boolean(data?.settings?.voiceMode);
  onlineRoomCode.textContent=(isFree||onlineFreeMatchedRoom)?"----":(onlineRoomCodeValue||"----");
  onlinePlayerList.innerHTML=players.map(p=>`<div class="online-player-row"><span class="mini-avatar">${p.host?"H":"P"}</span><strong>${escapeHtml(p.name)}</strong><small>${p.host?"ホスト":"参加中"}</small></div>`).join("");
  const max=Math.min(8,Math.max(3,Number(data?.maxPlayers||4)));
  const humanCount=players.length;
  const minCpu=Math.max(0,3-humanCount);
  const selected=Math.max(minCpu,Math.min(Number(onlineCpuCount.value||0),8-humanCount));
  onlineCpuCount.value=String(selected);
  onlineCpuCount.disabled=!onlineHost;
  syncOnlineLobbySettings(data);
  onlineStartButton.hidden=isFree || !onlineHost;
  onlineStartButton.disabled=!onlineHost||humanCount<1;
  onlineLobbyStatus.textContent=isFree
    ? `${humanCount}/4人・${data?.status==="playing"?"ゲーム中":"マッチング成立・ゲーム開始準備中"}`
    : `${humanCount}/${max}人・${data?.status==="playing"?"ゲーム中":"待機中"}`;
}
async function createOnlineRoom(){
  await ensureFirebase();
  let code=null;
  for(let i=0;i<12;i++){const c=makeRoomCode();const snap=await get(ref(firebaseDb,`rooms/${c}`));if(!snap.exists()){code=c;break;}}
  if(!code){alert("ルームコードを作成できませんでした。もう一度お試しください。");return;}
  onlineRoomCodeValue=code;onlineHost=true;onlineFreeMatchedRoom=false;
  const name=getPlayerName();
  const maxPlayers=Math.min(8,Math.max(3,Number(document.getElementById("onlineMaxPlayers")?.value||4)));
  const room={hostUid:firebaseUid,status:"lobby",maxPlayers,createdAt:Date.now(),settings:getOnlineLobbySettings(),players:{[firebaseUid]:{uid:firebaseUid,name,host:true}}};
  await set(ref(firebaseDb,`rooms/${code}`),room);
  await set(ref(firebaseDb,`privateCards/${code}/${firebaseUid}`),{cardName:null});
  openOnlineLobby();
}
async function joinOnlineRoom(){
  await ensureFirebase();
  const code=(roomCodeInput.value||"").trim().toUpperCase();
  if(!/^[A-Z0-9]{4}$/.test(code)){alert("4文字のルームコードを入力してください。");return;}
  const snap=await get(ref(firebaseDb,`rooms/${code}`));
  if(!snap.exists()){alert("そのルームは見つかりません。");return;}
  const data=snap.val(), players=lobbyPlayersFromValue(data);
  if(data.status!=="lobby"){alert("そのルームはすでにゲーム中です。");return;}
  if(players.length>=Math.min(8,Math.max(3,Number(data.maxPlayers||4)))){alert("このルームは満員です。");return;}
  onlineRoomCodeValue=code;onlineHost=false;onlineFreeMatchedRoom=false;
  const name=getPlayerName();
  await update(ref(firebaseDb,`rooms/${code}/players/${firebaseUid}`),{uid:firebaseUid,name,host:false});
  await set(ref(firebaseDb,`privateCards/${code}/${firebaseUid}`),{cardName:null});
  openOnlineLobby();
}
function openOnlineLobby(){
  const listenerEpoch=onlineSessionEpoch;
  const listenerRoom=onlineRoomCodeValue;
  onlineLobby.hidden=false;onlineRoomCode.textContent=onlineFreeMatchedRoom?"----":onlineRoomCodeValue;createRoomButton.hidden=true;joinRoomButton.hidden=true;roomCodeInput.hidden=true;
  if(onlineRoomUnsubscribe)onlineRoomUnsubscribe();
  onlineRoomUnsubscribe=onValue(onlineRoomRef(),snap=>{
    // Firebase can deliver an already queued snapshot after off()/unsubscribe().
    // Ignore it unless this exact room is still the active online session.
    if(listenerEpoch!==onlineSessionEpoch || listenerRoom!==onlineRoomCodeValue) return;
    const snapshotSeq=++onlineRoomSnapshotSeq;
    const data=snap.val();
    if(!data){onlineLobbyStatus.textContent="ルームが終了しました";return;}
    renderOnlineLobby(data);
    if(data.status==="playing" && data.game){
      // A replay creates a new matchId. Firebase listeners can still deliver a
      // previously queued snapshot after the host has already started the new
      // match. Never let that stale result screen overwrite the fresh game.
      const incomingMatchId=String(data.game.matchId||"");
      if(onlineMatchId && incomingMatchId && incomingMatchId!==onlineMatchId){
        const incomingStarted=Number(data.game.matchStartedAt||0);
        const currentStarted=Number(onlineGame?.matchStartedAt||0);
        if(currentStarted && incomingStarted && incomingStarted<currentStarted)return;
      }
      if(onlineHost && onlineHostProcessing)return;
      onlineMatchId=incomingMatchId||onlineMatchId;
      onlineGame={...data.game, usedClueIds:Array.isArray(data.game.usedClueIds)?data.game.usedClueIds:[], logs:Array.isArray(data.game.logs)?data.game.logs:[], players:Array.isArray(data.game.players)?data.game.players:[], settings:data.game.settings||onlineSettings(), order:Array.isArray(data.game.order)?data.game.order:[], orderIndex:Number.isFinite(data.game.orderIndex)?data.game.orderIndex:0};
      if(onlineGame.reverseGuess && typeof onlineGame.reverseGuess!=="string") onlineGame.reverseGuess=onlineGame.reverseGuess.name||null;
      if(onlineGame.reveal?.reverseGuess && typeof onlineGame.reveal.reverseGuess!=="string") onlineGame.reveal.reverseGuess=onlineGame.reveal.reverseGuess.name||null;
      const needsPrivateCard=!onlineMyCard || String(onlineLoadedGameMatchId)!==String(onlineGame.matchId||"");
      if(needsPrivateCard){
        const thisMatchId=String(onlineGame.matchId||"");
        loadOnlineOwnCard(data).then(()=>{
          if(snapshotSeq!==onlineRoomSnapshotSeq)return;
          if(!onlineGame || String(onlineGame.matchId||"")!==thisMatchId)return;
          onlineLoadedGameMatchId=thisMatchId;
          renderOnlineGame();
        });
      }else{
        // Do not perform a second asynchronous Firebase read for every public
        // game update. The private card is already known, so render the newest
        // room snapshot synchronously. This prevents an older private-card read
        // from redrawing a stale turn after a valid clue click.
        renderOnlineGame();
      }
      onlineDialog.close();
      setupScreen.hidden=true;gameScreen.hidden=false;
      if(onlineHost && !onlineActionUnsubscribe) attachOnlineHostActionListener();
      if(onlineHost && onlineGame.phase==="discussion") hostStartVoiceDiscussionTimer();
    }
  });
}
async function loadOnlineOwnCard(data){
  if(!firebaseUid||!onlineRoomCodeValue)return;
  const snap=await get(ref(firebaseDb,`privateCards/${onlineRoomCodeValue}/${firebaseUid}`));
  const cardName=snap.val()?.cardName;
  onlineMyCard=CARD_POOL.find(c=>c.name===cardName)||null;
}
async function leaveOnlineRoom(options={}){
  stopFreeMatch();
  if(!onlineRoomCodeValue)return;
  // Invalidate callbacks before awaiting any network operation.
  onlineSessionEpoch++;
  onlineRoomSnapshotSeq++;
  const roomCode=onlineRoomCodeValue, wasHost=onlineHost;
  if(onlineRoomUnsubscribe)onlineRoomUnsubscribe();
  if(onlineActionUnsubscribe)onlineActionUnsubscribe();
  clearTimeout(onlineCpuTimer);
  onlineRoomUnsubscribe=null;onlineActionUnsubscribe=null;
  try{
    const roomRef=ref(firebaseDb,`rooms/${roomCode}`);
    const snap=await get(roomRef);
    const data=snap.val();
    if(data){
      if(wasHost){
        // Private cards live outside /rooms so the public room read cannot expose them.
        // Remove the whole private-card bucket before deleting the room; after the
        // room is deleted the hostUid can no longer authorize this cleanup.
        await remove(ref(firebaseDb,`privateCards/${roomCode}`)).catch(e=>console.warn("private card cleanup skipped",e));
        // A host leaving must not leave an orphaned playing room behind.
        await remove(roomRef);
      }else if(firebaseUid){
        await remove(ref(firebaseDb,`rooms/${roomCode}/players/${firebaseUid}`));
        await remove(ref(firebaseDb,`privateCards/${roomCode}/${firebaseUid}`)).catch(()=>{});
      }
    }
  }catch(e){console.warn("online leave failed",e);}
  onlineRoomCodeValue="";onlineHost=false;onlineFreeMatchedRoom=false;onlineGame=null;onlineTurnReadyKey="";onlineTurnReadyPendingKey="";onlineLoadedGameMatchId="";if(onlineTurnReadyTimer){clearTimeout(onlineTurnReadyTimer);onlineTurnReadyTimer=null;}onlineMyCard=null;onlineClueMenu="root";onlineHostSecrets=null;onlineLastActionId=null;onlinePendingAction=null;
  onlineLobby.hidden=true;createRoomButton.hidden=false;joinRoomButton.hidden=false;roomCodeInput.hidden=false;
  try{onlineDialog.close();}catch{};onlineDialog.removeAttribute("open");
  if(options.returnToSetup) returnToSetup();
}
function onlineFeatureOptions(card,used,playerClues){
  const usedSet=new Set(Array.isArray(used)?used:[]);
  let truthful=shuffle(statementsFor(card,onlineGame.settings)).filter(s=>!usedSet.has(s.id));
  let falsehoods=shuffle(falseStatementsFor(card,onlineGame.settings)).filter(s=>!usedSet.has(s.id));
  const pinned=quickNameClues(card).filter(s=>!usedSet.has(s.id));
  let options=[...pinned,...truthful.slice(0,3),...falsehoods.slice(0,2)];
  // Negative basic/attribute/race clues are also eligible for quick suggestions.
  const negativeQuick=shuffle([...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues()])
    .filter(s=>!usedSet.has(s.id)&&!options.some(o=>o.id===s.id));
  options.push(...negativeQuick.slice(0,2));
  if((onlineGame?.settings?.speechRounds||2)>=2 && !(playerClues||[]).some(c=>c.ambiguous)){
    const vague=shuffle(AMBIGUOUS_CLUES).filter(v=>!usedSet.has(v.id));
    options.push(...vague.slice(0,2));
  }
  if(options.length<4){
    const extra=shuffle(featureList(card,onlineGame.settings)).filter(s=>!usedSet.has(s.id)&&!options.some(o=>o.id===s.id));
    options.push(...extra.slice(0,4-options.length));
  }
  const pinnedIds=new Set(pinned.map(s=>s.id));
  const others=shuffle(options.filter(s=>!pinnedIds.has(s.id)));
  return [...pinned,...others.slice(0,Math.max(0,6-pinned.length))];
}
function onlinePlayerById(id){return (onlineGame?.players||[]).find(p=>String(p.id)===String(id));}
function onlineCurrentId(){return onlineGame?.order?.[onlineGame.orderIndex];}
function onlineRoleMap(){return onlineGame?.reveal?.roles||{};}
function renderOnlinePlayers(){
  const reveal=onlineGame.phase==="result";
  const roles=onlineRoleMap(), cards=onlineGame.reveal?.cards||{};
  playersElement.innerHTML=(onlineGame.players||[]).map(p=>{
    const current=onlineGame.phase==="clue"&&String(onlineCurrentId())===String(p.id);
    const clues=p.clues||[];
    const voiceMode=Boolean(onlineGame.settings?.voiceMode);
    const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(voiceMode?"":(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>'));
    const votes=reveal&&onlineGame.tallies?onlineGame.tallies[p.id]||0:0;
    const lieBadge=onlineGame.settings?.showLieCount&&Number(p.lies||0)>0?`<span class="lie-count">嘘 ${Number(p.lies||0)}</span>`:"";
    const revealMeta=reveal?`<span class="role-reveal ${roles[p.id]==="wolf"?"wolf":"citizen"}">${roles[p.id]==="wolf"?"狼":"市民"} · ${escapeHtml(cards[p.id]?jpName(cards[p.id]):"")}</span>`:"";
    return `<article class="player-seat ${String(p.id)===String(firebaseUid)?"is-you":""} ${current?"is-current":""}">
      <div class="avatar">${String(p.id)===String(firebaseUid)?"YOU":"P"}</div>
      <div class="seat-copy"><div class="seat-name"><strong>${escapeHtml(p.name)}</strong><span>${String(p.id)===String(firebaseUid)?"あなた":(p.isHuman?"プレイヤー":"CPU")}</span></div><div class="player-clues">${clueHtml}</div></div>${lieBadge}
      ${reveal?`<span class="vote-badge">${votes}票</span><div class="result-meta">${revealMeta}</div>`:""}
    </article>`;
  }).join("");
}
function onlineDebug(event, details={}){
  const entry={t:new Date().toISOString(),event,...details};
  console.log("[CardWolf Online Debug]",entry);
  window.cardWolfOnlineDebug=window.cardWolfOnlineDebug||[];
  window.cardWolfOnlineDebug.push(entry);
  if(window.cardWolfOnlineDebug.length>200)window.cardWolfOnlineDebug.shift();
}
function renderOnlineCard(){
  yourCardElement.className="playing-card ygo";
  yourCardElement.innerHTML=onlineMyCard?`<div class="ygo-card-face"><img src="${cardImage(onlineMyCard)}" alt="${escapeHtml(jpName(onlineMyCard))}"></div><div class="your-card-meta">${cardDisplay(onlineMyCard)}</div>`:`<div class="online-card-wait">カードを準備しています…</div>`;
}
function renderOnlineLog(){
  logCount.textContent=`${(onlineGame.logs||[]).length} 件`;
  talkLog.innerHTML=(onlineGame.logs||[]).length?(onlineGame.logs||[]).map((e,i)=>`<article class="log-entry ${e.type||""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${escapeHtml(e.name||"")}</strong><p>${escapeHtml(e.text||"")}</p></article>`).join(""):`<p class="empty-log">発言が始まると、ここに記録されます。</p>`;
}
async function onlineSubmitClue(id){
  if(!onlineGame){onlineDebug("clue-rejected-client",{reason:"no-game",id});return;}
  if(onlineGame.phase!=="clue"||String(onlineCurrentId())!==String(firebaseUid)){onlineDebug("clue-rejected-client",{reason:"not-your-turn",id,phase:onlineGame.phase,current:onlineCurrentId(),uid:firebaseUid,round:onlineGame.round,orderIndex:onlineGame.orderIndex});return;}
  const card=onlineMyCard;if(!card){onlineDebug("clue-rejected-client",{reason:"no-card",id});return;}
  onlineDebug("clue-click",{id,round:onlineGame.round,orderIndex:onlineGame.orderIndex,current:onlineCurrentId()});
  if(onlinePendingAction){
    const sameTurn=onlinePendingAction.type==="clue" && Number(onlinePendingAction.round)===Number(onlineGame.round) && Number(onlinePendingAction.orderIndex)===Number(onlineGame.orderIndex);
    if(!sameTurn) onlinePendingAction=null;
  }
  if(onlinePendingAction){onlineDebug("clue-rejected-client",{reason:"pending",id,pending:onlinePendingAction});return;}
  const me=onlinePlayerById(firebaseUid);
  const usedIds=Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[];
  onlineGame.usedClueIds=usedIds;
  // The clicked button and the validation source must never come from two different
  // randomized option lists. Validate against the canonical statement set for this card.
  const canonical=[...featureList(card,onlineGame.settings),...allStatFeatureList(),...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues(),...AMBIGUOUS_CLUES];
  const st=canonical.find(s=>String(s.id)===String(id));
  if(!st){onlineDebug("clue-rejected-client",{reason:"invalid-option",id,used:usedIds,canonicalIds:canonical.map(s=>s.id),menu:onlineClueMenu});renderOnlineClue();return;}
  // A rendered menu can be one Firebase snapshot behind. Never silently discard a click merely because
  // usedClueIds changed after the button was painted. Send the exact turn/action to the host, which is
  // authoritative; if it is already used, refresh the menu and show the new state.
  if(usedIds.includes(st.id)) onlineDebug("clue-stale-menu",{id,used:usedIds});
  const turnRound=Number(onlineGame.round),turnIndex=Number(onlineGame.orderIndex);
  onlinePendingAction={type:"clue",clueId:String(id),round:turnRound,orderIndex:turnIndex};
  actionPanel.innerHTML=`<div class="thinking-state online-action-wait"><span class="thinking-card" aria-hidden="true">✓</span><div><p>CLUE SENT</p><h2>発言を送信しています</h2><span>ゲームの進行を確認しています…</span></div></div>`;
  const ok=await submitOnlineAction({type:"clue",clueId:st.id,round:turnRound,orderIndex:turnIndex,at:Date.now()});
  onlineDebug("clue-submit-finished",{id,ok,round:turnRound,orderIndex:turnIndex});
  if(!ok){onlinePendingAction=null;renderOnlineClue();}
}
function renderOnlineDiscussion(){
  phaseLabel.textContent="VOICE CHAT / DISCUSSION";
  phaseTitle.textContent="カードを見て、みんなで議論しよう";
  const seconds=Math.max(60,Number(onlineGame.settings?.discussionSeconds||120));
  // The host creates this deadline once when a match starts. Every client
  // displays the same absolute deadline using its own clock; the UI timer is
  // independent from Firebase re-renders.
  let deadline=Number(onlineGame.discussionDeadlineAt);
  if(!Number.isFinite(deadline)||deadline<=Date.now()-1000){
    deadline=Number(onlineGame.discussionStartedAt||Date.now())+seconds*1000;
    onlineGame.discussionDeadlineAt=deadline;
  }
  onlineDiscussionDeadlineAt=deadline;
  const existing=document.getElementById("voiceDiscussionTimer");
  if(!existing){
    actionPanel.innerHTML=`<div class="voice-discussion-state"><div class="voice-timer" id="voiceDiscussionTimer">--:--</div><p>ボイスチャットで自由に議論してください。</p><span>時間になると自動的に投票へ進みます。</span>${onlineHost?'<button class="secondary-button compact discussion-force-end" id="discussionForceEndButton" type="button">議論を強制終了</button>':''}</div>`;
    const force=document.getElementById("discussionForceEndButton");
    if(force) force.addEventListener("click",()=>hostForceEndDiscussion());
  }
  if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
  const updateTimer=()=>{
    if(!onlineGame||onlineGame.phase!=="discussion"){
      if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
      return;
    }
    const target=Number(onlineDiscussionDeadlineAt||onlineGame.discussionDeadlineAt);
    const left=Math.max(0,Math.ceil((target-Date.now())/1000));
    const timerEl=document.getElementById("voiceDiscussionTimer");
    if(timerEl){
      const m=Math.floor(left/60),sec=String(left%60).padStart(2,"0");
      timerEl.textContent=`${m}:${sec}`;
    }
    if(left<=0){
      if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
      if(onlineHost) hostEndDiscussion();
    }
  };
  updateTimer();
  if(onlineGame.phase==="discussion"){
    onlineDiscussionTimer=setInterval(updateTimer,250);
  }
}
async function hostEndDiscussion(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  onlineGame.phase="vote";onlineGame.orderIndex=0;onlineGame.discussionStartedAt=null;onlineGame.discussionDeadlineAt=null;
  await hostAssignCpuVotes();
  await hostWriteGame();
  renderOnlineGame();
}
async function hostForceEndDiscussion(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  if(!confirm("議論を終了して投票へ進みますか？"))return;
  await hostEndDiscussion();
}

function hostStartVoiceDiscussionTimer(){
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  const seconds=Math.max(60,Number(onlineGame.settings?.discussionSeconds||120));
  let deadline=Number(onlineGame.discussionDeadlineAt);
  if(!Number.isFinite(deadline)||deadline<=Date.now()-1000){
    deadline=Date.now()+seconds*1000;
    onlineGame.discussionStartedAt=Date.now();
    onlineGame.discussionDeadlineAt=deadline;
    onlineDiscussionDeadlineAt=deadline;
  }else{
    onlineDiscussionDeadlineAt=deadline;
  }
  // Rendering owns the visible countdown. This timeout is only an
  // authoritative host fallback in case the UI timer is throttled.
  const delay=Math.max(0,deadline-Date.now());
  onlineCpuTimer=setTimeout(async()=>{
    if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
    await hostEndDiscussion();
  },delay+100);
}
function onlineTurnKey(){
  if(!onlineGame)return "";
  return `${onlineGame.matchId||onlineMatchId}|${onlineGame.phase}|${onlineGame.round}|${onlineGame.orderIndex}|${onlineCurrentId()}`;
}
function scheduleOnlineTurnReady(){
  const key=onlineTurnKey();
  if(!onlineGame||onlineGame.phase!=="clue"||String(onlineCurrentId())!==String(firebaseUid)||onlineGame.transition)return;
  // IMPORTANT: Firebase may deliver several identical snapshots during the
  // first 500ms of a new turn. The old implementation restarted the 500ms
  // timer on every snapshot, so a busy room could keep the button permanently
  // in "preparing" state. Keep one timer per turn instead.
  if(onlineTurnReadyKey===key)return;
  if(onlineTurnReadyPendingKey===key && onlineTurnReadyTimer)return;
  if(onlineTurnReadyTimer){clearTimeout(onlineTurnReadyTimer);onlineTurnReadyTimer=null;}
  onlineTurnReadyKey="";
  onlineTurnReadyPendingKey=key;
  onlineTurnReadyTimer=setTimeout(()=>{
    onlineTurnReadyTimer=null;
    onlineTurnReadyPendingKey="";
    if(onlineTurnKey()===key && onlineGame && onlineGame.phase==="clue" && String(onlineCurrentId())===String(firebaseUid) && !onlineGame.transition){
      onlineTurnReadyKey=key;
      renderOnlineClue();
    }
  },500);
}
function isOnlineTurnReady(){return onlineTurnReadyKey!=="" && onlineTurnReadyKey===onlineTurnKey();}
// IMPORTANT v115: turn-readiness is visual feedback only. It must never be a
// prerequisite for accepting a user click. A visible button can survive a
// Firebase snapshot while the cosmetic 500ms readiness key is being rebuilt;
// previously that made a perfectly valid click silently return. The host
// validates the exact round/orderIndex, so accepting the click here is safe.


function renderOnlineClue(){
  // A clue action belongs to one exact turn. If Firebase has already advanced
  // to another round/index, never let the old pending flag block the new
  // buttons. This was the main cause of the intermittent "button does nothing"
  // behavior, especially when the same human speaks twice in succession.
  if(onlinePendingAction?.type==="clue") {
    const sameTurn=Number(onlinePendingAction.round)===Number(onlineGame.round) && Number(onlinePendingAction.orderIndex)===Number(onlineGame.orderIndex);
    if(!sameTurn || onlineGame.transition) onlinePendingAction=null;
  }
  const current=onlinePlayerById(onlineCurrentId()), roundLabel=`第${onlineGame.round}ラウンド${onlineGame.round>1?`（${onlineGame.round%2===0?"逆順":"順番"}）`:""}`;
  // Once a clue was accepted for submission, keep this exact turn visually frozen.
  // Firebase echoes can otherwise render the next menu for a fraction of a second.
  if(onlinePendingAction?.type==="clue" && Number(onlinePendingAction.round)===Number(onlineGame.round) && Number(onlinePendingAction.orderIndex)===Number(onlineGame.orderIndex)){
    phaseLabel.textContent="PHASE / 発言送信"; phaseTitle.textContent="発言を送信しています";
    actionPanel.innerHTML=`<div class="thinking-state online-action-wait"><span class="thinking-card" aria-hidden="true">✓</span><div><p>CLUE SENT</p><h2>発言を送信しています</h2><span>ゲームの進行を確認しています…</span></div></div>`;
    return;
  }
  if(onlineGame.transition?.type==="round") {
    phaseLabel.textContent="ROUND CHANGE / 発言順切替";
    phaseTitle.textContent=onlineGame.transition.text||"次のラウンドへ切り替えています…";
    actionPanel.innerHTML=`<div class="thinking-state round-transition-state"><span class="thinking-card" aria-hidden="true">↕</span><div><p>ROUND CHANGE</p><h2>発言順を入れ替えています</h2><span>次の発言を選ぶまで少しお待ちください。</span></div></div>`;
    return;
  }
  phaseLabel.textContent=`PHASE ${onlineGame.round} / ${roundLabel}・特徴を話す`;
  phaseTitle.textContent=String(onlineCurrentId())===String(firebaseUid)?"あなたの特徴を話そう":`${current?.name||"プレイヤー"}の発言を聞こう`;
  if(String(onlineCurrentId())!==String(firebaseUid)){
    actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">?</span><div><p>ONLINE TURN</p><h2>${escapeHtml(current?.name||"プレイヤー")}が発言中</h2><span>前の発言とは違う特徴を選んでいます…</span></div></div>`;return;
  }
  const usedIds=new Set(onlineGame.usedClueIds||[]);
  const findOnlineClue=id=>[...featureList(onlineMyCard||{},onlineGame.settings),...allStatFeatureList(),...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues(),...AMBIGUOUS_CLUES].find(s=>s.id===id)||null;
  const root=onlineClueMenu||"root";
  if(root==="root"){
    const opts=onlineFeatureOptions(onlineMyCard,onlineGame.usedClueIds,current?.clues);
    actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>何と発言しますか？</h2><span>左の「すぐに選べる特徴」から選ぶか、右の特徴一覧から詳しい条件を選べます。${onlineGame.settings.liePenalty?"狼が嘘発言を2回するか、曖昧発言と嘘発言をそれぞれ1回すると、逆転チャンスを失います。":"嘘の回数によるペナルティはありません。"}</span></div><div class="clue-choice-layout"><section class="quick-clue-column"><p class="clue-list-label">すぐに選べる特徴</p><div class="choice-list basic-clue-list">${opts.map(s=>`<button class="choice-button ${clueChoiceClass(s,onlineMyCard)}" type="button" data-online-clue="${s.id}"><span>${s.label}</span><span>${s.ambiguous?"曖昧":"→"}</span></button>`).join("")}</div></section><section class="clue-menu-column"><p class="clue-list-label">特徴一覧</p><div class="clue-category-grid">${CLUE_MENU_CATEGORIES.map(c=>`<button class="choice-button clue-category-button" type="button" data-online-clue-category="${c.id}"><span>${c.label}</span><span>→</span></button>`).join("")}</div></section></div>`;
  }else{
    const canonical=new Map([...featureList(onlineMyCard||{},onlineGame.settings),...allStatFeatureList(),...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues(),...AMBIGUOUS_CLUES].map(s=>[String(s.id),s]));
    const isStatUnitMenu=(root==="atk"||root==="def");
    const isStatRangeMenu=/^(atk|def)-(500|1000|1500)$/.test(root);
    const negativeMode=String(root).endsWith("-negative");
    const baseCategory=negativeMode?String(root).replace(/-negative$/," ").trim():root;
    const options=(negativeMode?negativeClueOptions(baseCategory):clueCategoryOptions(baseCategory)).filter(o=>canonical.has(String(o.id)) || /^(atk|def)-(500|1000|1500)$/.test(String(o.id)));
    const canToggleNegative=(baseCategory==="basic"||baseCategory==="attribute"||baseCategory==="race");
    const toggleButton=canToggleNegative?(negativeMode
      ?`<button class="choice-button clue-negative-button" type="button" data-online-clue-positive-category="${baseCategory}"><span>肯定形選択肢へ</span><span>→</span></button>`
      :`<button class="choice-button clue-negative-button" type="button" data-online-clue-negative-category="${baseCategory}"><span>否定形選択肢へ</span><span>→</span></button>`):"";
    actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>${isStatUnitMenu?`${baseCategory==="atk"?"攻撃力":"守備力"}・発言単位を選択`:isStatRangeMenu?`${baseCategory.startsWith("atk-")?"攻撃力":"守備力"}・${baseCategory.split("-")[1]}単位`:CLUE_MENU_CATEGORIES.find(c=>c.id===baseCategory)?.label||"特徴を選択"}${negativeMode?"・否定形":""}</h2><span>一覧から選択してください。ほかのプレイヤーが発言済みの内容は選択できません。</span></div><div class="choice-list submenu-choice-list">${options.map(o=>{const used=usedIds.has(o.id);const statement=canonical.get(String(o.id));return `<button class="choice-button ${used?"choice-used ":""}${statement?clueChoiceClass(statement,onlineMyCard):""}" type="button" data-online-clue="${o.id}" ${used?"disabled aria-disabled=\"true\"":""}><span>${o.label}</span><span>${used?"発言済み":statement?.ambiguous?"曖昧":"→"}</span></button>`;}).join("")}${toggleButton}</div><button class="secondary-button compact clue-back-button" id="onlineClueBackButton" type="button">← 戻る</button>`;
    actionPanel.querySelector("#onlineClueBackButton").addEventListener("click",()=>{onlineClueMenu=isStatRangeMenu?root.split("-")[0]:"root";renderOnlineClue();});
  }
}

function isOnlineVoteReady(){
  const voteKey=`${onlineGame?.matchId||onlineMatchId}|vote|${onlineGame?.round}|${onlineGame?.orderIndex}`;
  return onlineTurnReadyKey===voteKey;
}
function renderOnlineVote(){
  phaseLabel.textContent="PHASE / 狼に投票する";phaseTitle.textContent="違うカードの人は誰？";
  // A clue action can finish at exactly the moment the vote phase appears.
  // Never carry that stale pending state into voting. Likewise, a rejected
  // vote must not leave the vote UI permanently locked.
  if(onlinePendingAction?.type==="vote") { const sameVoteTurn=Number(onlinePendingAction.round)===Number(onlineGame.round) && Number(onlinePendingAction.orderIndex||0)===Number(onlineGame.orderIndex||0); if(!sameVoteTurn) onlinePendingAction=null; } else if(onlinePendingAction) onlinePendingAction=null;
  const me=onlinePlayerById(firebaseUid);
  const hasVote=me?.vote!==null&&me?.vote!==undefined&&String(me.vote)!=="";
  if(hasVote || onlinePendingAction?.type==="vote"){
    actionPanel.innerHTML=`<div class="thinking-state online-action-wait"><span class="thinking-card" aria-hidden="true">✓</span><div><p>VOTE SENT</p><h2>投票しました</h2><span>${hasVote?"他のプレイヤーの投票を待っています…":"投票を送信しています…"}</span></div></div>`;
    if(hasVote) onlinePendingAction=null;
    return;
  }
  const candidates=onlineGame.players.filter(p=>String(p.id)!==String(firebaseUid));
  actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>全員の発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-online-vote="${escapeHtml(String(p.id))}"><span class="mini-avatar">P</span><span><strong>${escapeHtml(p.name)}</strong><small>${(p.clues||[]).map(c=>`「${escapeHtml(c.label)}」`).join(" / ")}</small></span></button>`).join("")}</div>`;

}
function renderOnlineReverse(){
  if(onlinePendingAction && onlinePendingAction.type!=="reverse") onlinePendingAction=null;
  const wolfId=onlineGame.reveal?.wolfId||onlineGame.wolfUid||onlineGame.eliminatedId;
  const wolf=onlinePlayerById(wolfId);
  phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";phaseTitle.textContent=`${wolf?.name||"狼"}は狼だった！`;
  if(String(wolfId)!==String(firebaseUid)){
    actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${escapeHtml(wolf?.name||"狼")}の逆転宣言を待っています</h2><span>狼が市民カードを推理します。</span></div></div>`;return;
  }
  actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="guess-card-grid">${getActiveCardPool(onlineGame?.settings).filter(c=>!onlineMyCard||c.name!==onlineMyCard.name).map(c=>`<button class="guess-card-button" data-online-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span><small>${escapeHtml(reverseGuessInfo(c))}</small></button>`).join("")}</div>`;
}
function renderOnlineResult(){
  const wolfWon=onlineGame.result==="wolf"||onlineGame.result==="wolf-reversal";
  phaseLabel.textContent="GAME OVER / 答え合わせ";phaseTitle.textContent=wolfWon?"狼チームの勝利":"市民チームの勝利";
  const revName=typeof onlineGame.reveal?.reverseGuess==="string"?onlineGame.reveal.reverseGuess:(onlineGame.reveal?.reverseGuess?.name||null);
  const rev=revName?getActiveCardPool(onlineGame?.settings).find(c=>c.name===revName)||null:null;
  const citizen=onlineGame.reveal?.citizenCard,wolfCard=onlineGame.reveal?.wolfCard;
  const msg=onlineGame.result==="wolf"? "選ばれたプレイヤーは市民でした。狼は正体を隠し切りました。":onlineGame.result==="wolf-reversal"?`狼が市民カード「${jpName(citizen)}」を見事に当て、逆転しました。`:`狼の宣言は「${jpName(rev||{})}」。正解は「${jpName(citizen||{})}」でした。`;
  const replayButton=onlineHost?`<button class="primary-button compact" id="onlineReplayButton" type="button"><span>同じ部屋でもう一度遊ぶ</span><span>↻</span></button>`:`<div class="online-replay-wait">ホストがもう一度ゲームを開始するのを待っています。</div>`;
  actionPanel.innerHTML=`<div class="result-banner ${wolfWon?"wolf-win":"citizen-win"}"><p>${wolfWon?"狼チームの勝利":"市民チームの勝利"}</p><h2>${wolfWon?"狼の勝利":"市民の勝利"}</h2><span>${msg}</span><strong class="reward-message"><img class="medal-icon" src="assets/medal-icon.png" alt=""> メダル +${onlineRewardMedals||0}枚</strong></div><div class="answer-cards">${citizen?`<div><small>市民カード</small><img class="ygo-thumb" src="${cardImage(citizen)}"><strong>${jpName(citizen)}</strong><em>${cardInfo(citizen)}${cardStats(citizen)?" · "+cardStats(citizen):""}</em></div>`:""}${wolfCard?`<div><small>狼カード</small><img class="ygo-thumb" src="${cardImage(wolfCard)}"><strong>${jpName(wolfCard)}</strong><em>${cardInfo(wolfCard)}${cardStats(wolfCard)?" · "+cardStats(wolfCard):""}</em></div>`:""}</div>${replayButton}<button class="secondary-button compact" id="onlineBackButton" type="button"><span>ロビーへ戻る</span><span>↩</span></button>`;
  if(onlineHost){document.getElementById("onlineReplayButton").addEventListener("click",async()=>{if(confirm("同じ部屋のメンバーでもう一度ゲームを開始しますか？")){await startOnlineHostGame();}});}
  document.getElementById("onlineBackButton").addEventListener("click",async()=>{if(confirm("オンライン対戦を終了して部屋から退出しますか？")){await leaveOnlineRoom({returnToSetup:true});}});
  if(!onlineScoreRecorded){const myRole=onlineGame.reveal?.roles?.[firebaseUid];const won=(myRole==="wolf"&&wolfWon)||(myRole==="citizen"&&!wolfWon);const reward=won?100:50;if(won){matchRecord.wins++;}else{matchRecord.losses++;}matchRecord.medals+=reward;onlineRewardMedals=reward;onlineScoreRecorded=true;renderRecord();}
}
function renderOnlineGame(){
  if(!onlineGame)return;
  renderOnlinePlayers();renderOnlineCard();renderOnlineLog();
  if(onlineGame.phase==="discussion")renderOnlineDiscussion();else if(onlineGame.phase==="clue")renderOnlineClue();else if(onlineGame.phase==="vote")renderOnlineVote();else if(onlineGame.phase==="reverse")renderOnlineReverse();else renderOnlineResult();
}
async function submitOnlineActionOnce(action){
  if(!onlineRoomCodeValue||!firebaseUid||!onlineGame)return false;
  const roomCode=onlineRoomCodeValue;
  const actionId=`${firebaseUid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const actionRef=ref(firebaseDb,`rooms/${roomCode}/actions/${firebaseUid}/${actionId}`);
  const resultRef=ref(firebaseDb,`rooms/${roomCode}/actionResults/${firebaseUid}/${actionId}`);
  return await new Promise(async(resolve)=>{
    let settled=false,timer=null;
    const finish=ok=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);try{off(resultRef,"value",listener);}catch{}onlineActionPromises.delete(actionId);resolve(Boolean(ok));};
    const listener=snap=>{const result=snap.val();if(result){onlineDebug("action-result",{actionId,accepted:result.accepted===true,reason:result.reason||null,result});finish(result.accepted===true);}};
    onlineActionPromises.set(actionId,finish);
    try{
      onValue(resultRef,listener);
      await set(actionRef,{...action,matchId:onlineGame.matchId||onlineMatchId||"",uid:firebaseUid,actionId,clientVersion:"v279",createdAt:Date.now()});
    }catch(e){console.error("online action write failed",e);finish(false);return;}
    timer=setTimeout(()=>{onlineDebug("action-timeout",{actionId,action});finish(false);},8000);
  });
}
function onlineActionAlreadyApplied(action){
  const me=onlinePlayerById(firebaseUid);
  if(!onlineGame||!me)return false;
  if(action.type==="clue")return Array.isArray(me.clues)&&me.clues.some(c=>String(c.id)===String(action.clueId));
  if(action.type==="vote")return me.vote!==null&&me.vote!==undefined&&String(me.vote)!=="";
  if(action.type==="reverse")return Boolean(onlineGame?.phase==="result");
  return false;
}
async function refreshOnlineGameBeforeActionRetry(){
  try{
    const snap=await get(onlineRoomRef()),data=snap.val();
    if(!data?.game)return false;
    const g=data.game;
    onlineMatchId=String(g.matchId||onlineMatchId||"");
    onlineGame={...g,usedClueIds:Array.isArray(g.usedClueIds)?g.usedClueIds:[],logs:Array.isArray(g.logs)?g.logs:[],players:Array.isArray(g.players)?g.players:[],settings:g.settings||onlineSettings(),order:Array.isArray(g.order)?g.order:[],orderIndex:Number.isFinite(g.orderIndex)?g.orderIndex:0};
    renderOnlineGame();
    return true;
  }catch(e){console.warn("online retry refresh failed",e);return false;}
}
async function submitOnlineAction(action){
  if(!onlineRoomCodeValue||!firebaseUid||!onlineGame)return false;
  const originalMatchId=onlineGame.matchId||onlineMatchId||"";
  const first={...action,matchId:originalMatchId};
  if(await submitOnlineActionOnce(first))return true;

  // Do not ask the player to hammer the button. A stale public snapshot can
  // legitimately make the host reject the first request. Refresh the room and
  // automatically retry once if the action is still valid.
  await refreshOnlineGameBeforeActionRetry();
  if(onlineActionAlreadyApplied(action))return true;
  const canRetry=(action.type==="clue"&&onlineGame.phase==="clue"&&String(onlineCurrentId())===String(firebaseUid))||
                 (action.type==="vote"&&onlineGame.phase==="vote")||
                 (action.type==="reverse"&&onlineGame.phase==="reverse"&&String(onlineGame.eliminatedId||"")===String(firebaseUid));
  if(canRetry){
    const retry={...action,matchId:onlineGame.matchId||onlineMatchId||"",round:Number(onlineGame.round),orderIndex:Number(onlineGame.orderIndex||0)};
    if(await submitOnlineActionOnce(retry))return true;
    await refreshOnlineGameBeforeActionRetry();
    if(onlineActionAlreadyApplied(action))return true;
  }
  alert("操作を受け付けられませんでした。通信が安定してから、もう一度お試しください。");
  return false;
}
function hostChooseCpuVote(voter){
  const candidates=onlineGame.players.filter(p=>String(p.id)!==String(voter.id));
  const voterCard=onlineHostSecrets.cards[voter.id];
  return candidates.map(c=>{
    const contradictions=(c.clues||[]).filter(cl=>!cl.ambiguous && (()=>{const st=[...featureList(voterCard,onlineGame.settings),...allStatFeatureList()].find(x=>x.id===cl.id);return st&&!st.test(voterCard);})()).length;
    return {id:c.id,score:contradictions*2.2+Math.random()*1.2};
  }).sort((a,b)=>b.score-a.score)[0]?.id;
}
function hostCpuClue(player){
  const card=onlineHostSecrets.cards[player.id],used=new Set(onlineGame.usedClueIds||[]);
  let truthful=shuffle(statementsFor(card,onlineGame.settings)).filter(s=>!used.has(s.id));
  let falsehoods=shuffle(falseStatementsFor(card,onlineGame.settings)).filter(s=>!used.has(s.id));
  let st=null;
  if(!onlineHostSecrets.wolves[player.id]){
    st=truthful[0]||null; // citizens strongly prefer truth
  }else{
    const shared=truthful.filter(s=>s.test(onlineHostSecrets.citizenCard));
    st=shared[0]||truthful[0]||falsehoods[0]||null;
  }
  return st;
}
async function hostApplyClue(uid,clueId,action={}){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="clue")return false;
  if(String(uid)!==String(onlineCurrentId()))return false;
  // Reject stale clicks from a previous render/turn. This is especially important
  // around the final clue of round 2, where Firebase can deliver an older snapshot.
  if(Number.isFinite(Number(action.round)) && Number(action.round)!==Number(onlineGame.round))return false;
  if(Number.isFinite(Number(action.orderIndex)) && Number(action.orderIndex)!==Number(onlineGame.orderIndex))return false;
  const player=onlinePlayerById(uid),card=onlineHostSecrets.cards[uid];if(!player||!card)return;
  onlineGame.usedClueIds=Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[];
  onlineGame.logs=Array.isArray(onlineGame.logs)?onlineGame.logs:[];
  let st=[...featureList(card,onlineGame.settings),...allStatFeatureList(),...negativeBasicClues(),...negativeAttributeClues(),...negativeRaceClues(),...AMBIGUOUS_CLUES].find(s=>String(s.id)===String(clueId));
  if(!st||onlineGame.usedClueIds.includes(st.id))return false;
  if(st.ambiguous && (player.clues||[]).some(c=>c.ambiguous))return false;
  const truthful=st.ambiguous?true:Boolean(st.test(card));
  player.clues=[...(player.clues||[]),{id:st.id,label:st.label,ambiguous:Boolean(st.ambiguous)}];
  if(onlineGame.settings?.showLieCount) player.lies=Number(onlineHostSecrets.lies[uid]||0)+(truthful?0:1);
  onlineGame.usedClueIds.push(st.id);onlineGame.logs.push({name:player.name,text:`「${st.label}」と発言しました。`});
  if(!truthful)onlineHostSecrets.lies[uid]=(onlineHostSecrets.lies[uid]||0)+1;
  await advanceOnlineClueHost();
  return true;
}
const sleepMs=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function advanceOnlineClueHost(){
  const lastTurn = onlineGame.orderIndex >= onlineGame.order.length - 1;
  if(!lastTurn){
    onlineGame.orderIndex += 1;
    await hostWriteGame();
    hostMaybeCpuTurn();
    return;
  }

  // The final speaker of a round needs an explicit, atomic-looking transition.
  // Do not briefly leave the old clue turn in Firebase, otherwise another client
  // can render the same speaker's buttons again.
  if(onlineGame.round < onlineGame.settings.speechRounds){
    const previousSpeakerId=onlineCurrentId();
    const nextOrder=[...onlineGame.order].reverse();
    const sameSpeakerAgain=String(nextOrder[0])===String(previousSpeakerId);
    // Always publish an explicit transition state BEFORE changing the order.
    // This keeps the round-change UI visible for every client, and prevents
    // the final speaker's menu from jumping straight to the next turn.
    // When the same human speaks twice in succession, this is especially
    // important: the user should see a clear transition instead of a brief
    // blank/preparing state.
    const nextRound=onlineGame.round+1;
    onlineGame.transition={type:"round",text:`第${nextRound}ラウンドへ切り替えます`};
    await hostWriteGame();
    // The host ignores its own room snapshot while processing the action.
    // Render the transition locally immediately so the host sees the same
    // explicit round-change screen as the other clients.
    renderOnlineGame();
    await sleepMs(sameSpeakerAgain ? 1200 : 900);
    onlineGame.round += 1;
    onlineGame.order = nextOrder;
    onlineGame.orderIndex = 0;
    onlineGame.transition=null;
    onlineGame.logs.push({type:"system",name:"ラウンド切替",text:`第${onlineGame.round}ラウンド。発言順を${onlineGame.round%2===0?"逆":"元"}にします。`});
    await hostWriteGame();
    hostMaybeCpuTurn();
    return;
  }

  onlineGame.phase="vote";
  onlineGame.orderIndex=0;
  await hostAssignCpuVotes();
  await hostWriteGame();
}
async function hostAssignCpuVotes(){
  if(onlineGame.phase!=="vote")return;
  for(const p of onlineGame.players.filter(x=>!x.isHuman)){
    p.vote=hostChooseCpuVote(p);
  }
}
async function hostMaybeCpuTurn(){
  clearTimeout(onlineCpuTimer);
  if(!onlineHost||!onlineGame||onlineGame.phase!=="clue")return;
  const expectedId=String(onlineCurrentId());
  const p=onlinePlayerById(expectedId);
  if(!p||p.isHuman)return;
  onlineCpuTimer=setTimeout(async()=>{
    try{
      // Re-check the state immediately before acting. Firebase listeners can
      // redraw onlineGame while this timer is waiting.
      if(!onlineHost||!onlineGame||onlineGame.phase!=="clue"||String(onlineCurrentId())!==expectedId)return;
      const current=onlinePlayerById(expectedId);
      const st=hostCpuClue(current);
      if(st){
        await hostApplyClue(expectedId,st.id);
      }else{
        const fallback={id:`cpu-fallback-${expectedId}-${onlineGame.round}-${onlineGame.orderIndex}`,label:"カードの特徴を慎重に考えています",ambiguous:true};
        current.clues=[...(current.clues||[]),fallback];
        onlineGame.usedClueIds.push(fallback.id);
        onlineGame.logs.push({type:"system",name:current.name,text:"CPUの発言が選べなかったため、代替発言を行いました。"});
        await advanceOnlineClueHost();
      }
    }catch(e){
      console.error("online CPU turn failed",e);
      // Never leave the online game on a permanent "CPU thinking" state.
      if(onlineHost&&onlineGame&&onlineGame.phase==="clue"&&String(onlineCurrentId())===expectedId){
        const current=onlinePlayerById(expectedId);
        if(current){
          current.clues=current.clues||[];
          current.clues.push({id:`cpu-fallback-${Date.now()}`,label:"慎重に考えています",ambiguous:true});
          onlineGame.logs.push({type:"system",name:current.name,text:"CPUの発言処理を再試行します。"});
        }
        await advanceOnlineClueHost();
      }
    }
  },700);
}
async function hostEvaluateVotes(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="vote")return;
  const humanCount=onlineGame.players.filter(p=>p.isHuman).length;
  const voted=onlineGame.players.filter(p=>p.isHuman&&p.vote!==null&&p.vote!==undefined&&String(p.vote)!=="").length;
  if(voted<humanCount){
    await hostWriteGame();
    return;
  }
  const tallies=Object.fromEntries(onlineGame.players.map(p=>[p.id,0]));
  onlineGame.players.forEach(p=>{if(p.vote&&tallies[p.vote]!=null)tallies[p.vote]++;});
  onlineGame.tallies=tallies;
  const high=Math.max(...Object.values(tallies)),tied=onlineGame.players.filter(p=>tallies[p.id]===high);
  const eliminated=randomItem(tied);onlineGame.eliminatedId=eliminated.id;
  onlineGame.logs.push({type:"system",name:"投票結果",text:tied.length>1?`${high}票で同票。抽選により${eliminated.name}が選ばれました。`:`${eliminated.name}が${high}票で選ばれました。`});
  const wolfId=onlineHostSecrets.wolfUid;
  if(String(eliminated.id)===String(wolfId)){
    const wolfPlayer=onlinePlayerById(wolfId);
    const blockedByAmbiguousLie=Boolean(onlineGame.settings.liePenalty)&&(wolfPlayer?.clues||[]).some(c=>c.ambiguous)&&(onlineHostSecrets.lies[wolfId]||0)>=1;
    if(blockedByAmbiguousLie){onlineGame.result="citizen";onlineGame.phase="result";onlineGame.logs.push({type:"system",name:"ペナルティ",text:"狼は曖昧発言と嘘発言を行ったため、逆転チャンスを失いました。"});await hostFinishResult(null);}
    else if(onlineGame.settings.liePenalty&&(onlineHostSecrets.lies[wolfId]||0)>=2){onlineGame.result="citizen";onlineGame.phase="result";onlineGame.logs.push({type:"system",name:"ペナルティ",text:"狼は2回以上の嘘をついたため、逆転チャンスを失いました。"});await hostFinishResult(null);}
    else {
      onlineGame.phase="reverse";
      await hostWriteGame();
      renderOnlineGame();
      if((onlinePlayerById(onlineHostSecrets.wolfUid)?.isHuman)===false){
        const wolf=onlinePlayerById(onlineHostSecrets.wolfUid);
        onlineCpuTimer=setTimeout(async()=>{
          const clues=onlineGame.players.filter(p=>String(p.id)!==String(onlineHostSecrets.wolfUid)).flatMap(p=>p.clues||[]);
          const candidates=getActiveCardPool(onlineGame?.settings).filter(c=>c.name!==onlineHostSecrets.wolfCard.name).map(card=>{
            const score=clues.reduce((s,cl)=>{
              if(cl.ambiguous)return s;
              const st=[...featureList(card,onlineGame.settings),...allStatFeatureList()].find(x=>x.id===cl.id);
              return s+(st&&st.test(card)?1:0);
            },0)+Math.random()*0.35;
            return {card,score};
          }).sort((a,b)=>b.score-a.score);
          await hostFinishResult(candidates[0]?.card?.name||onlineHostSecrets.citizenCard.name);
        },1200);
      }
    }
  }else{onlineGame.result="wolf";await hostFinishResult(null);}
}
async function hostFinishResult(reverseGuess){
  onlineGame.reverseGuess=reverseGuess?getActiveCardPool(onlineGame?.settings).find(c=>c.name===reverseGuess)||null:null;
  if(reverseGuess){
    onlineGame.result=String(reverseGuess)===String(onlineHostSecrets.citizenCard?.name)?"wolf-reversal":"citizen";
  }
  const citizen=onlineHostSecrets.citizenCard,wolfCard=onlineHostSecrets.wolfCard;
  const reveal={citizenCard:citizen,wolfCard,reverseGuess:onlineGame.reverseGuess?.name||onlineGame.reverseGuess||null,roles:{},cards:{},wolfId:onlineHostSecrets.wolfUid};
  onlineGame.players.forEach(p=>{reveal.roles[p.id]=onlineHostSecrets.wolves[p.id]?"wolf":"citizen";reveal.cards[p.id]=onlineHostSecrets.cards[p.id];});
  onlineGame.reveal=reveal;onlineGame.phase="result";
  await hostWriteGame();
  renderOnlineGame();
}
async function hostProcessAction(action){
  if(!onlineHost||!onlineGame||!action)return false;
  let reason="rejected";
  if(!action.matchId || String(action.matchId)!==String(onlineGame.matchId)){
    reason="match-mismatch";
    if(action.actionId&&action.uid) await set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actionResults/${action.uid}/${action.actionId}`),{accepted:false,reason,processedAt:Date.now()});
    return false;
  }
  let accepted=false;
  if(action.type==="clue"){
    accepted=await hostApplyClue(action.uid,action.clueId,action); reason=accepted?"accepted":"clue-rejected";
  }else if(action.type==="vote"&&onlineGame.phase==="vote"){
    const p=onlinePlayerById(action.uid);
    if(!p||!p.isHuman){reason="invalid-voter";}
    else if(Number.isFinite(Number(action.round)) && Number(action.round)!==Number(onlineGame.round)){reason="round-mismatch";}
    else if(p.vote!==null&&p.vote!==undefined&&String(p.vote)!==""){reason="already-voted";}
    else{
      const voteId=String(action.voteId??"");
      const validTarget=onlineGame.players.some(x=>String(x.id)===voteId);
      if(!validTarget||voteId===String(action.uid)){reason="invalid-target";}
      else{
        p.vote=voteId; accepted=true; reason="accepted";
        await hostEvaluateVotes();
        if(onlineGame.phase==="vote") await hostWriteGame();
      }
    }
  }else if(action.type==="reverse"&&onlineGame.phase==="reverse"&&String(action.uid)===String(onlineHostSecrets.wolfUid)){
    const guess=getActiveCardPool(onlineGame?.settings).find(c=>c.name===action.guess);
    if(guess){accepted=true;reason="accepted";await hostFinishResult(guess.name);}
  }
  if(action.actionId&&action.uid){
    try{
      await set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actionResults/${action.uid}/${action.actionId}`),{accepted,reason,processedAt:Date.now()});
    }catch(e){console.warn("online action acknowledgement failed",e);}
  }
  return accepted;
}

function attachOnlineHostActionListener(){
  if(onlineActionUnsubscribe||!onlineRoomCodeValue)return;
  onlineActionUnsubscribe=onValue(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions`),snap=>{
    const data=snap.val()||{};
    const pending=[];
    for(const [uid,queue] of Object.entries(data)){
      if(!queue||typeof queue!=='object')continue;
      for(const [actionId,action] of Object.entries(queue)){
        if(!action||action.actionId!==actionId)continue;
        if(actionId===onlineLastActionId || onlineProcessedActionIds.has(actionId))continue;
        onlineLastActionId=actionId;
        onlineProcessedActionIds.add(actionId);
        pending.push({uid,actionId,action});
      }
    }
    if(!pending.length)return;
    // Serialize host actions. Firebase can deliver a new snapshot while the
    // previous action is still awaiting a write; processing both concurrently
    // can make the second human's clue look like a stale/out-of-turn action.
    for(const item of pending){
      onlineHostActionQueue=onlineHostActionQueue.then(async()=>{
        onlineHostProcessing=true;
        try{
          await hostProcessAction(item.action);
        }catch(e){
          console.error("online host action failed",e);
        }finally{
          // The host is now allowed to clean up processed actions. Keep the
          // acknowledgement briefly so the client can confirm the result.
          try{await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions/${item.uid}/${item.actionId}`));}catch(e){
            console.warn("online action cleanup failed",e);
          }
          onlineHostProcessing=false;
          if(onlineHost&&onlineGame) renderOnlineGame();
        }
      });
    }
  });
}
async function startOnlineHostGame(){
  if(!onlineHost||!onlineRoomCodeValue)return;
  // Freeze the host listener while the new match is built. This prevents the
  // previous result snapshot from overwriting the fresh local replay state.
  onlineHostProcessing=true;
  let snap=await get(onlineRoomRef()),room=snap.val();if(!room){onlineHostProcessing=false;return;}

  // Free-match rooms are created from the shared queue rather than from a
  // normal lobby join. On a slow/contended Firebase connection it is possible
  // for the room write to be observed before the complete human roster is
  // visible to the host. Do not turn that transient state into the fatal
  // "2人以上でプレイ可能" path. Rebuild the roster once from the queue, using
  // the same deterministic room-code rule, then re-read the room.
  if(room.freeMatch && lobbyPlayersFromValue(room).length<2){
    try{
      const q=await get(ref(firebaseDb,`freeMatchQueue/${freeMatchModeKey()}`));
      const now=Date.now();
      const queued=Object.values(q.val()||{})
        .filter(x=>x&&x.uid&&Number(x.joinedAt)<=now&&Number(x.joinedAt)>now-120000)
        .sort((a,b)=>Number(a.joinedAt)-Number(b.joinedAt)||String(a.uid).localeCompare(String(b.uid)))
        .slice(0,4);
      if(queued.length>=2 && freeMatchRoomCode(queued.map(x=>String(x.uid)).sort())===String(onlineRoomCodeValue)){
        const repairedPlayers={};
        queued.forEach(x=>{
          repairedPlayers[String(x.uid)]={uid:String(x.uid),name:String(x.name||"プレイヤー"),host:String(x.uid)===String(room.hostUid)};
        });
        if(Object.keys(repairedPlayers).length>=2){
          await update(onlineRoomRef(),{players:repairedPlayers,hostUid:String(room.hostUid),freeMatch:true,maxPlayers:4});
          snap=await get(onlineRoomRef());
          room=snap.val();
        }
      }
    }catch(e){
      console.warn("free-match roster repair skipped",e);
    }
  }

  const humans=lobbyPlayersFromValue(room);
  const wantedCpu=Math.max(0,Math.min(Number(onlineCpuCount.value||0),8-humans.length));
  const cpuNeeded=room.freeMatch?Math.max(0,4-humans.length):Math.max(wantedCpu,3-humans.length);
  const total=humans.length+cpuNeeded;
  const maxPlayers=room.freeMatch?4:Math.min(8,Math.max(3,Number(room.maxPlayers||4)));
  if(room.freeMatch && humans.length<2){
    // A queue/room snapshot can be briefly incomplete at the exact 30-second
    // boundary. Keep the room alive and retry instead of sending one player
    // back to the title screen or starting a one-human game.
    onlineHostProcessing=false;
    setTimeout(()=>startOnlineHostGame().catch(e=>console.error("free-match retry failed",e)),500);
    return;
  }
  if(total<3 || total>maxPlayers){alert("オンラインは合計3〜"+maxPlayers+"人で開始します。");onlineHostProcessing=false;return;}

  const settings=room.settings||onlineSettings();
  const activePool=getActiveCardPool(settings);
  if(activePool.length<2){onlineHostProcessing=false;alert("カードプールの設定が不正です。");return;}
  const [citizenCard,wolfCard]=chooseCardPair(settings);
  const ids=humans.map(p=>p.uid);
  for(let i=0;i<cpuNeeded;i++)ids.push(`cpu-${i}`);
  const wolfUid=randomItem(ids);
  const publicPlayers=humans.map(p=>({id:p.uid,name:p.name,isHuman:true,clues:[],vote:null}));
  const cpuNames=chooseCpuNames(cpuNeeded);
  for(let i=0;i<cpuNeeded;i++)publicPlayers.push({id:`cpu-${i}`,name:cpuNames[i]||`CPU${i+1}`,isHuman:false,clues:[],vote:null});
  const order=shuffle(ids);
  const cards={},wolves={},lies={};
  ids.forEach(id=>{cards[id]=String(id)===String(wolfUid)?wolfCard:citizenCard;wolves[id]=String(id)===String(wolfUid);lies[id]=0;});

  // A replay is a completely new match inside the same room. Do this reset
  // locally BEFORE any Firebase awaits so the host cannot remain on the old
  // result screen while the new cards are being written.
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;
  onlinePendingAction=null;
  onlineTurnReadyKey=""; if(onlineTurnReadyTimer){clearTimeout(onlineTurnReadyTimer);onlineTurnReadyTimer=null;}
  onlineLastActionId="";
  onlineProcessedActionIds.clear();
  onlineActionPromises.clear();
  onlineHostActionQueue=Promise.resolve();
  // Keep the host listener frozen until the new Firebase game snapshot has
  // been published. Do not clear this flag during local replay initialization.
  onlineScoreRecorded=false;onlineRewardMedals=0;

  const matchStartedAt=Date.now();
  const matchId=`${matchStartedAt}-${Math.random().toString(36).slice(2,10)}`;
  const discussionSeconds=Math.max(60,Number(settings.discussionSeconds||120));
  const isVoice=Boolean(settings.voiceMode);
  const phase=isVoice?"discussion":"clue";
  const discussionStartedAt=isVoice?matchStartedAt:null;
  const discussionDeadlineAt=isVoice?matchStartedAt+discussionSeconds*1000:null;

  onlineMatchId=matchId;
  onlineClueMenu="root";
  onlineHostSecrets={cards,wolves,lies,wolfUid,citizenCard,wolfCard};
  onlineMyCard=cards[firebaseUid]||null;
  onlineGame={
    matchId,matchStartedAt,phase,round:1,order,orderIndex:0,
    discussionStartedAt,discussionDeadlineAt,
    usedClueIds:[],logs:[],settings,players:publicPlayers,transition:null,
    tallies:null,eliminatedId:null,result:null,reveal:null,reverseGuess:null
  };
  onlineDiscussionDeadlineAt=discussionDeadlineAt||0;

  // Clear the old result/action UI immediately. This is intentionally before
  // the network writes so the host sees the new timer/phase without waiting
  // for Firebase to echo its own update.
  setupScreen.hidden=true;
  gameScreen.hidden=false;
  onlineDialog.close();
  renderOnlineGame();
  if(isVoice) hostStartVoiceDiscussionTimer(); else hostMaybeCpuTurn();

  // Publish the NEW public game state before doing any cleanup.
  // The old implementation removed action queues first; if Firebase rejected
  // either removal, execution stopped after private cards had already changed.
  // That produced the exact bug where the card changed but the old result
  // screen and missing timer remained. The new match is now written first, and
  // cleanup is best-effort afterwards.
  try{
    await Promise.all(humans.map(p=>set(ref(firebaseDb,`privateCards/${onlineRoomCodeValue}/${p.uid}`),{cardName:cards[p.uid].name})));
    await update(onlineRoomRef(),{status:"playing",game:onlineSnapshot()});
  }catch(e){
    console.error("online replay publish failed",e);
    alert("新しいゲームを開始できませんでした。Firebaseとの通信を確認して、もう一度お試しください。\n\n"+(e?.message||e));
    onlineHostProcessing=false;
    return;
  }

  // Old actions/results are no longer needed. Never let cleanup failure block
  // the new game because every action also carries matchId and is rejected if
  // it belongs to an earlier match.
  await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions`)).catch(e=>console.warn("old action cleanup skipped",e));
  await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actionResults`)).catch(e=>console.warn("old action result cleanup skipped",e));

  // Echo/render once more after the room write. This also repairs any visual
  // state that a slow browser may have retained from the previous result.
  renderOnlineGame();
  if(isVoice) hostStartVoiceDiscussionTimer(); else hostMaybeCpuTurn();
  // The room listener intentionally ignores snapshots while the host is
  // building a new match. Therefore it cannot be relied on to attach the
  // action listener for the first turn. Attach it explicitly before releasing
  // the processing lock; otherwise human clue buttons can appear to work only
  // after some later room update happens to trigger the listener.
  if(!onlineActionUnsubscribe) attachOnlineHostActionListener();
  // New match is authoritative now; resume Firebase listener processing.
  onlineHostProcessing=false;
}
async function syncOnlinePrivateAndGame(data){
  await loadOnlineOwnCard(data);
  if(data.game){onlineGame=data.game;renderOnlineGame();}
}
closeOnlineButton.addEventListener("click",()=>{
  try{onlineDialog.close();}catch{}
  if(onlineRoomCodeValue) leaveOnlineRoom().catch(e=>console.warn("online leave failed",e));
  setMode(false);
});
document.getElementById("onlineMaxPlayers")?.addEventListener("change",async()=>{
  if(!onlineHost||!onlineRoomCodeValue)return;
  const maxPlayers=Math.min(8,Math.max(3,Number(document.getElementById("onlineMaxPlayers").value||4)));
  const snap=await get(onlineRoomRef()); const room=snap.val();
  const humanCount=lobbyPlayersFromValue(room).length;
  if(humanCount>maxPlayers){alert(`現在${humanCount}人参加しているため、${maxPlayers}人には変更できません。`);syncOnlineLobbySettings(room);return;}
  const currentCpu=Math.min(Number(onlineCpuCount.value||0),maxPlayers-humanCount);
  onlineCpuCount.value=String(Math.max(0,Math.min(currentCpu,maxPlayers-humanCount)));
  await update(onlineRoomRef(),{maxPlayers});
});
createRoomButton.addEventListener("click",()=>{
  createOnlineRoom().catch(e=>console.error("create room failed:",e));
});
joinRoomButton.addEventListener("click",()=>{
  joinOnlineRoom().catch(e=>console.error("join room failed:",e));
});
leaveRoomButton.addEventListener("click",async(e)=>{
  e.preventDefault(); e.stopPropagation();
  if(freeMatchStartedAt){ await finishFreeMatchWait(false); return; }
  if(!onlineRoomCodeValue)return;
  if(!confirm("このオンライン対戦の部屋から退出しますか？"))return;
  await leaveOnlineRoom({returnToSetup:true});
});
// Do not leave an online room when the user clicks the dialog backdrop or
// presses Escape. Those are easy accidental interactions, especially on
// mobile. Leaving the room is an explicit action via the close/leave buttons.
onlineDialog.addEventListener("click",e=>{
  if(e.target===onlineDialog) e.preventDefault();
});
onlineDialog.addEventListener("cancel",e=>{
  if(onlineRoomCodeValue) e.preventDefault();
});
onlineStartButton.addEventListener("click",startOnlineHostGame);
onlineCpuCount.addEventListener("change",()=>{if(onlineHost&&onlineRoomCodeValue){update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{cpuWanted:Number(onlineCpuCount.value||0)});}});
document.getElementById("onlineDiscussionMinutes")?.addEventListener("change",async()=>{if(onlineHost&&onlineRoomCodeValue&&onlineVoicePreset){const settings=getOnlineLobbySettings();await update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{settings});}});
for(const id of ["speechCount","liePenalty","showLieCount","cardPoolSize"]){document.getElementById(id)?.addEventListener("change",async()=>{if(onlineHost&&onlineRoomCodeValue){const settings=getOnlineLobbySettings();await update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{settings});}});}


// Initialize the mode only after the online state variables and listeners exist.
// Calling setMode() earlier hit the temporal-dead-zone of let onlineMode, which
// stopped the rest of the script and made Online appear unresponsive.
setMode(false);


/* v20 reverse safety */

window.addEventListener("error", function(e){
  if(game && game.phase==="reverse" && !game.players[game.wolfIndex].isHuman){
    const b=document.getElementById("cpuGuessButton");
    if(b){ b.disabled=false; b.classList.remove("loading"); }
  }
});

/* v42: acknowledge every online action and prevent stale vote/clue requests from hanging clients. */

/* v115 debug bridge: local-file-safe and connected to the real practice state. */
if (document.documentElement.dataset.debugMode === "true") {
  const debugApi = {
    getState(){ return game; },
    refresh(){ if(game) renderGame(); },
    triggerRevote(){
      if(!game || !Array.isArray(game.players) || game.players.length < 4) return false;
      const others=game.players.filter(p=>!p.isHuman);
      if(others.length<2) return false;
      const a=others[0], b=others[1], c=others[2];
      game.settings={...game.settings,noRevote:false};
      const forcedVotes={};
      forcedVotes[game.players[0].id]=a.id;
      forcedVotes[a.id]=b.id;
      forcedVotes[b.id]=a.id;
      forcedVotes[c.id]=b.id;
      game.players.slice(3).forEach((p,i)=>{forcedVotes[p.id]=i%2===0?a.id:b.id;});
      const tallies=Object.fromEntries(game.players.map(p=>[p.id,0]));
      game.players.forEach(p=>{if(tallies[forcedVotes[p.id]]!=null)tallies[forcedVotes[p.id]]++;});
      // Guarantee the first two non-human players are tied at the highest count.
      game.players.forEach(p=>p.vote=null);
      game.players[0].vote=a.id; a.vote=b.id; b.vote=a.id; c.vote=b.id;
      game.tallies=tallies; game.revoteCandidates=[a,b]; game.phase="revote"; game.eliminatedId=null; game.result=null; game.reverseGuess=null; game.busy=false;
      game.logs=game.logs||[]; game.logs.push({type:"system",name:"デバッグ",text:`再投票テスト：${a.name}と${b.name}に${tallies[a.id]}票ずつ入れ、再投票画面を表示しました。`});
      renderGame(); window.dispatchEvent(new Event("cardwolf:debug-state")); return true;
    },
    triggerReverse(){
      if(!game || !Array.isArray(game.players) || game.players.length<2) return false;
      const citizen=getActiveCardPool(game.settings).find(c=>c.name!==game.players[0].card?.name)||getActiveCardPool(game.settings)[0];
      const wolfCard=getActiveCardPool(game.settings).find(c=>c.name!==citizen.name)||citizen;
      game.citizenCard=citizen; game.wolfCard=wolfCard; game.wolfIndex=0;
      game.players.forEach((p,i)=>{p.isWolf=i===0;p.card=i===0?wolfCard:citizen;p.vote=null;});
      game.eliminatedId=0; game.tallies=Object.fromEntries(game.players.map(p=>[p.id,0])); game.phase="reverse"; game.result=null; game.reverseGuess=null; game.busy=false;
      game.logs=game.logs||[]; game.logs.push({type:"system",name:"デバッグ",text:"逆転宣言テスト：あなたを狼にして逆転宣言画面を表示しました。"});
      renderGame(); window.dispatchEvent(new Event("cardwolf:debug-state")); return true;
    },
    triggerResult(){
      if(!game) return false; game.phase="result"; game.result="citizen"; game.reverseGuess=null; game.eliminatedId=game.wolfIndex; game.tallies=game.tallies||Object.fromEntries(game.players.map(p=>[p.id,0])); renderGame(); window.dispatchEvent(new Event("cardwolf:debug-state")); return true;
    }
  };
  window.CARDWOLF_DEBUG_API=debugApi;
  window.dispatchEvent(new Event("cardwolf:debug-state"));
}
