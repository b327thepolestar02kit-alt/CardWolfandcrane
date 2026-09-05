(()=>{
"use strict";
if(document.documentElement.dataset.debugMode!=="true")return;
const MAX_MEDALS=99999;
const make=()=>{
  if(document.getElementById("debugPanel"))return;
  const p=document.createElement("aside");
  p.id="debugPanel";
  p.className="debug-panel";
  p.innerHTML='<div class="debug-panel-header"><strong>DEBUG MODE</strong><span>再投票・逆転テスト</span></div><p class="debug-state" id="debugState">ゲーム未開始</p><div id="debugPlayers"></div><div class="debug-actions"><button type="button" data-debug-command="revote">再投票テスト</button><button type="button" data-debug-command="reverse">逆転宣言テスト</button><button type="button" data-debug-command="result">結果画面テスト</button><button type="button" data-debug-command="max-medals">メダルを上限（99,999枚）まで獲得</button><button type="button" data-debug-command="refresh">状態を再読込</button></div><p class="debug-message" id="debugMessage"></p>';
  document.body.appendChild(p);
};
const init=()=>{
  make();
  const panel=document.getElementById("debugPanel"),state=document.getElementById("debugState"),players=document.getElementById("debugPlayers"),msg=document.getElementById("debugMessage");
  const api=()=>window.CARDWOLF_DEBUG_API;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const render=()=>{
    const a=api(),g=a?.getState?.();
    if(!g){state.textContent="ゲーム未開始 / デバッグAPI待機中";players.innerHTML='<p class="debug-muted">プラクティスモードを開始すると操作できます。4人以上で再投票テストが利用できます。</p>';return;}
    state.textContent=`フェーズ: ${g.phase} / ラウンド: ${g.round} / 手番: ${g.order?.[g.orderIndex]??"-"}`;
    players.innerHTML=(g.players||[]).map(p=>`<div class="debug-player-row"><div><strong>${esc(p.name)}</strong><small>${p.isWolf?"狼":"市民"}${p.isHuman?" / あなた":""}</small></div></div>`).join("");
  };
  document.addEventListener("pointerdown",e=>{
    const b=e.target?.closest?.("[data-debug-command]");
    if(!b||!panel.contains(b))return;
    e.preventDefault();e.stopImmediatePropagation();
    const command=b.dataset.debugCommand;
    if(command==="max-medals"){
      const KEY="cardwolf.matchRecord";
      let record={wins:0,losses:0,medals:0};
      try{record={...record,...JSON.parse(localStorage.getItem(KEY)||"{}")} }catch{}
      record.medals=MAX_MEDALS;
      const serialized=JSON.stringify(record);
      localStorage.setItem(KEY,serialized);
      window.dispatchEvent(new StorageEvent("storage",{key:KEY,newValue:serialized}));
      msg.textContent="メダルを上限の99,999枚に設定しました。";
      return;
    }
    const a=api();
    if(!a){msg.textContent="デバッグAPIが初期化されていません。";return;}
    if(command==="revote"){const ok=!!a.triggerRevote?.();msg.textContent=ok?"再投票画面へ移行しました。":"4人以上のプラクティスゲームを開始してください。";}
    else if(command==="reverse"){const ok=!!a.triggerReverse?.();msg.textContent=ok?"逆転宣言画面へ移行しました。":"ゲームを開始してください。";}
    else if(command==="result"){const ok=!!a.triggerResult?.();msg.textContent=ok?"結果画面を表示しました。":"ゲームを開始してください。";}
    else{a.refresh?.();msg.textContent="状態を再読込しました。";}
    render();
  },true);
  document.addEventListener("click",e=>{const b=e.target?.closest?.("[data-debug-command]");if(b&&panel.contains(b))e.preventDefault();},true);
  window.addEventListener("cardwolf:debug-state",render);
  setInterval(render,300);
  render();
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
