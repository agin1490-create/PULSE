async function kl(sym,tf){
  var map={"1m":"1","5m":"5","15m":"15","1h":"60","4h":"240"};
  var bb=await get("https://api.bybit.com/v5/market/kline?category=spot&symbol="+sym+"&interval="+(map[tf]||"5")+"&limit=160",8000);
  if(bb&&bb.result&&bb.result.list&&bb.result.list.length)return bars(bb.result.list);
  var bn=await get("https://api.binance.com/api/v3/klines?symbol="+sym+"&interval="+tf+"&limit=160",8000);
  if(Array.isArray(bn)&&bn.length)return bars(bn);
  return [];
}
async function yq(sym){
  var u="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(sym)+"?interval=1m&range=1d";
  var j=await get(u,6000);
  if(!j)j=await get("https://api.allorigins.win/raw?url="+encodeURIComponent(u),7000);
  var res=j&&j.chart&&j.chart.result&&j.chart.result[0];
  if(!res)return null;
  var m=res.meta||{},px=m.regularMarketPrice,pv=m.previousClose||m.chartPreviousClose;
  if(px==null)return null;
  return {px:+px,chg:pv?((px-pv)/pv)*100:0};
}
async function runOne(id,mode){
  var spec=A.filter(function(x){return x.id===id;})[0];
  var exT=mode==="m15"?"15m":"5m",cxT=mode==="m15"?"4h":"1h",mdT=mode==="m15"?"1h":"15m";
  var ex=await kl(spec.bb,exT),cx=await kl(spec.bb,cxT),md=await kl(spec.bb,mdT);
  if(!ex.length||!cx.length)throw 0;
  var a=analyze(ex,cx,md,S.live[id].px||undefined);
  return {a:a,g:gate(a,id)};
}
async function goldPx(){
  var g=await get("https://api.gold-api.com/price/XAU",6000);
  if(g&&g.price)S.live.xau.px=g.price;
}
async function macro(){
  var nq=await yq("NQ=F"),ix=await yq("^IXIC");
  if(nq)S.mac.nq=nq;if(ix)S.mac.ix=ix;
  tape();if(S.tab==="desk")paint();
}
function chip(lab,px,chg){
  var up=(chg||0)>=0;
  return H('<div class="ch"><div class="mo mu" style="font-size:10px">',lab,'</div><div class="mo" style="font-size:15px;margin-top:4px">',usd(px),'</div><div class="mo ',up?"up":"dn",'" style="font-size:11px">',up?"+":"",(chg||0).toFixed(2),"%</div></div>");
}
function tape(){
  var html="";
  A.forEach(function(s){html+=chip(s.sym,S.live[s.id].px,S.live[s.id].chg);});
  html+=chip("NQ",S.mac.nq&&S.mac.nq.px,S.mac.nq?S.mac.nq.chg:0);
  html+=chip("NASDAQ",S.mac.ix&&S.mac.ix.px,S.mac.ix?S.mac.ix.chg:0);
  document.getElementById("tape").innerHTML=html;
  document.getElementById("dot").style.background=S.st==="live"?"var(--up)":S.st==="err"?"var(--dn)":"var(--su)";
  document.getElementById("feed").textContent=S.st==="live"?S.feed:(S.st==="err"?"reconnect":S.feed);
}
function pill(col,lab){return H('<span class="pi" style="background:var(--el);color:',col,'">',lab,"</span>");}
function desk(){
  var I=ist();
  var col=I.risk==="high"?"var(--dn)":I.risk==="thin"?"var(--wn)":"var(--mu)";
  var lab=I.risk==="high"?"HIGH VOL":I.risk==="thin"?"THIN":"SESSION";
  var name=I.cur?I.cur[0]:(I.we?"Weekend":"Gap");
  var hint=I.cur?I.cur[4]:"NQ confirms, not a target.";
  var sess=H('<div class="cd"><div class="rw"><div><div class="mo mu" style="font-size:11px">',I.clk," IST</div><b>",name,"</b></div>",pill(col,lab),'</div><p class="mu" style="font-size:13px;margin:8px 0 0">',hint,"</p></div>");
  var cards=A.map(function(s){
    var p=S.sig[s.id],st=S.live[s.id];
    if(!p)return H('<div class="cd"><div class="rw"><b>',s.name,'</b><span class="mo">',usd(st.px),'</span></div><p class="mu">Scanning...</p></div>');
    var a=p.a,g=p.g,tk=g.ok,lng=tk&&a.dir==="long";
    var pc=lng?"var(--up)":tk?"var(--dn)":"var(--mu)";
    var pl=tk?(a.dir==="long"?"BUY":"SELL"):"WAIT";
    var msg=tk?g.g+" · SL "+fmt(a.sl)+" · TP "+fmt(a.tp):"Stand down. "+g.r.slice(0,2).join(" · ");
    return H('<div class="cd"><div class="rw"><div><b>',s.name,'</b> <span class="mo mu">',g.g,'</span><div class="mo mu" style="font-size:11px">',usd(st.px)," · HTF ",a.tC,"</div></div>",pill(pc,pl),"</div>",
      '<div class="g3" style="margin-top:10px"><div class="st mo"><div class="a">Score</div><div class="b">',a.score,'</div></div><div class="st mo"><div class="a">RSI</div><div class="b">',a.rsi.toFixed(1),'</div></div><div class="st mo"><div class="a">R:R</div><div class="b">',a.rr?a.rr.toFixed(2):"-","</div></div></div>",
      '<p class="mu" style="font-size:13px;margin:10px 0 0">',msg,"</p>",
      tk?H('<button class="bt" data-log="',s.id,'">Log setup</button>'):"","</div>");
  }).join("");
  var vs=venues();
  var openN=vs.filter(function(x){return x.open;}).length;
  var world=H('<p class="se mo">World openings · ',openN,' open</p><div class="g2">',vs.map(function(v){
    return H('<div class="th"><div class="rw"><b>',v.n,'</b><span class="dot" style="background:',v.open?"var(--up)":"var(--su)",'"></span></div><div class="mo mu" style="font-size:11px;margin-top:4px">',v.c,'</div><div class="rw" style="margin-top:6px"><span class="mo">',v.clk,'</span><span class="',v.open?"up":"mu",'" style="font-size:12px">',v.lab,'</span></div></div>');
  }).join(""),"</div>");
  return H('<p class="se mo">Session</p>',sess,'<p class="se mo">Judgment</p>',cards,world,'<p class="su" style="font-size:11px">WAIT unless HTF+mid+R:R 1.8 + NQ agree.</p>');
}
function setup(){
  var segs=A.map(function(s){return H("<button data-sid='",s.id,"' class='",S.sid===s.id?"on":"","'>",s.sym,"</button>");}).join("");
  var p=S.setup;
  if(!p)return H('<p class="se mo">Setup</p><div class="sg">',segs,'</div><p class="mu">Scanning...</p>');
  var a=p.a,g=p.g;
  var head=g.ok?g.g+" SETUP · "+(a.dir||"").toUpperCase():"STAND DOWN";
  var body=g.ok?"R:R "+(a.rr||0).toFixed(2)+" · SL "+fmt(a.sl)+" · TP "+fmt(a.tp):g.r.join(" · ");
  return H('<p class="se mo">Setup</p><div class="sg">',segs,"</div>",
    '<div class="cd"><div class="mo" style="color:',g.ok?"var(--up)":"var(--mu)","\">",head,"</div>",
    '<p class="mu" style="margin:8px 0 0">',body,"</p>",
    '<div class="mo" style="margin-top:8px">',usd(S.live[S.sid].px),"</div></div>",
    '<button class="bt" id="go" style="background:var(--el);color:var(--mu)">Re-run</button>',
    g.ok?H('<button class="bt" data-log="',S.sid,'">Log setup</button>'):"",
    '<p class="su" style="font-size:11px;margin-top:10px">Closed bar only. NQ is a veto.</p>');
}
function logv(){
  var cl=S.j.filter(function(x){return x.st!=="OPEN"&&x.r!=null;});
  var w=cl.filter(function(x){return x.r>0;});
  var wr=cl.length?Math.round(100*w.length/cl.length):null;
  var avg=cl.length?cl.reduce(function(a,b){return a+(b.r||0);},0)/cl.length:null;
  var rows=S.j.slice(0,30).map(function(j){
    var cls=j.st==="TP"?"up":j.st==="SL"?"dn":"mu";
    var lab=j.st==="OPEN"?"OPEN":j.st+" "+((j.r||0)>=0?"+":"")+(j.r||0).toFixed(2)+"R";
    var btns=j.st==="OPEN"?H('<div class="g3" style="margin-top:8px"><button class="bt" data-c="',j.id,'" data-s="TP">TP</button><button class="bt" style="background:#3a2020;color:var(--dn)" data-c="',j.id,'" data-s="SL">SL</button><button class="bt" style="background:var(--el);color:var(--mu)" data-c="',j.id,'" data-s="BE">BE</button></div>'):"";
    return H('<div class="th"><div class="rw"><b>',j.sym,'</b><span class="mo ',cls,'">',lab,'</span></div><div class="mo mu" style="font-size:12px;margin-top:6px">',fmt(j.ent)," · SL ",fmt(j.sl)," · TP ",fmt(j.tp),"</div>",btns,"</div>");
  }).join("");
  return H('<p class="se mo">Journal</p><div class="g3" style="margin-bottom:10px"><div class="st mo"><div class="a">Closed</div><div class="b">',cl.length,'</div></div><div class="st mo"><div class="a">Win</div><div class="b">',wr==null?"-":wr+"%",'</div></div><div class="st mo"><div class="a">Exp</div><div class="b">',avg==null?"-":avg.toFixed(2)+"R","</div></div></div>",S.j.length?rows:'<div class="cd"><b>No logs</b><p class="mu">Log an A/B from Desk.</p></div>');
}
function newsv(){
  if(!S.news.length)return '<p class="se mo">News</p><div class="cd"><p class="mu">Headlines load in a few seconds.</p></div>';
  return H('<p class="se mo">News</p>',S.news.map(function(n){
    return H('<div class="th"><div class="mo mu" style="font-size:10px">',n.src,' · ',n.when,'</div><div style="margin-top:4px">',n.t,"</div></div>");
  }).join(""));
}
function paint(){
  tape();
  document.getElementById("view").innerHTML=S.tab==="desk"?desk():S.tab==="setup"?setup():S.tab==="news"?newsv():logv();
  var bs=document.querySelectorAll(".nav button");
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",bs[i].getAttribute("data-t")===S.tab);
}
document.querySelector(".nav").onclick=function(e){var b=e.target.closest("button");if(!b)return;S.tab=b.getAttribute("data-t");if(S.tab==="setup")goSetup();if(S.tab==="news"&&!S.news.length)loadNews();paint();};
document.getElementById("view").onclick=function(e){
  var L=e.target.closest("[data-log]");
  if(L){var id=L.getAttribute("data-log");var p=S.sig[id]||(id===S.sid?S.setup:null);if(p&&p.a.dir){S.j.unshift({id:"j"+Date.now(),sym:id.toUpperCase(),ent:p.a.ent,sl:p.a.sl,tp:p.a.tp,st:"OPEN",r:null});save();S.tab="log";paint();}return;}
  var sid=e.target.closest("[data-sid]");if(sid){S.sid=sid.getAttribute("data-sid");goSetup();return;}
  if(e.target.id==="go"){goSetup();return;}
  var c=e.target.closest("[data-c]");
  if(c){var id2=c.getAttribute("data-c"),st=c.getAttribute("data-s");S.j.forEach(function(j){if(j.id!==id2)return;var rk=Math.abs(j.ent-j.sl)||1e-9;if(st==="TP"){j.st="TP";j.r=Math.abs(j.tp-j.ent)/rk;}else if(st==="SL"){j.st="SL";j.r=-1;}else{j.st="BE";j.r=0;}});save();paint();}
};
async function goSetup(){S.setup=null;paint();try{S.setup=await runOne(S.sid,"m5");}catch(e){S.setup={a:{px:S.live[S.sid].px,dir:null,score:0,tC:"-",tM:"-",rsi:50,rr:null},g:{ok:0,g:"WAIT",r:["no candles"]}};}paint();}
async function sigs(){
  await Promise.all(A.map(async function(s){try{S.sig[s.id]=await runOne(s.id,"m5");}catch(e){S.sig[s.id]={a:{px:S.live[s.id].px,dir:null,score:0,tC:"-",tM:"-",rsi:50,rr:null},g:{ok:0,g:"WAIT",r:["feed blocked"]}};}}));
  paint();
}
function ws(){
  function apply(id,px){S.live[id].px=px;tape();}
  var w;
  try{w=new WebSocket("wss://stream.bybit.com/v5/public/spot");}catch(e){S.st="err";tape();return;}
  w.onopen=function(){S.st="live";S.feed="Bybit";tape();w.send(JSON.stringify({op:"subscribe",args:["publicTrade.BTCUSDT","tickers.BTCUSDT","publicTrade.ETHUSDT","tickers.ETHUSDT"]}));};
  w.onclose=function(){S.st="err";tape();};
  w.onmessage=function(ev){
    var m=JSON.parse(ev.data),t=m.topic||"",d=m.data;if(!d)return;
    var id=t.indexOf("BTC")>=0?"btc":t.indexOf("ETH")>=0?"eth":null;if(!id)return;
    if(t.indexOf("publicTrade")===0){var x=Array.isArray(d)?d[0]:d;apply(id,+x.p);}
    else if(t.indexOf("tickers")===0){var y=Array.isArray(d)?d[0]:d;S.live[id].px=+y.lastPrice;S.live[id].chg=(+y.price24hPcnt)*100;tape();}
  };
}
(async function(){
  paint();ws();
  try{await goldPx();}catch(e){}
  loadNews();
  macro();
  try{await sigs();}catch(e){S.feed="scan fail";paint();}
  setInterval(sigs,60000);setInterval(goldPx,20000);setInterval(macro,20000);
})();