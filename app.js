function H(){return Array.prototype.slice.call(arguments).join("");}
async function get(url,ms){
  ms=ms||7000;
  var c=typeof AbortController!=="undefined"?new AbortController():null;
  var t=c?setTimeout(function(){try{c.abort();}catch(e){}},ms):null;
  try{
    var r=await fetch(url,{cache:"no-store",signal:c?c.signal:undefined});
    if(!r.ok) throw 0;
    return await r.json();
  }catch(e){return null;}finally{if(t)clearTimeout(t);}
}
var A=[
  {id:"btc",sym:"BTC",name:"Bitcoin",bb:"BTCUSDT"},
  {id:"eth",sym:"ETH",name:"Ethereum",bb:"ETHUSDT"},
  {id:"xau",sym:"XAU",name:"Gold",bb:"XAUTUSDT"}
];
var S={tab:"desk",sid:"btc",live:{},sig:{},mac:{},setup:null,j:[],feed:"boot",st:"off"};
A.forEach(function(x){S.live[x.id]={px:null,chg:0};S.sig[x.id]=null;});
try{var jr=localStorage.getItem("ppro_j");if(jr)S.j=JSON.parse(jr);}catch(e){}
function fmt(n){if(n==null||!isFinite(n))return "-";if(n>=1000)return n.toLocaleString("en-US",{maximumFractionDigits:2});return n>=1?n.toFixed(2):n.toFixed(4);}
function save(){try{localStorage.setItem("ppro_j",JSON.stringify(S.j.slice(0,80)));}catch(e){}}
function ist(){
  var p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  function g(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return p[i].value;return "";}
  var hh=+g("hour");if(hh===24)hh=0;var m=hh*60+ +g("minute");var we=g("weekday")==="Sat"||g("weekday")==="Sun";
  var clk=String(hh).padStart(2,"0")+":"+g("minute");
  var W=[["Asia",330,870,"normal","Asia quiet"],["London",810,1170,"normal","Liquidity up"],["US overlap",1170,1470,"high","High vol. NQ must agree"],["US close",1470,1530,"normal","ETF flow"],["Thin overnight",120,360,"thin","No A"]];
  function cov(a,b){return b<=1440?(m>=a&&m<b):(m>=a||m<b-1440);}
  var cur=null;if(!we)for(var i=0;i<W.length;i++)if(cov(W[i][1],W[i][2])){cur=W[i];break;}
  return {clk:clk,we:we,cur:cur,risk:cur?cur[3]:"normal"};
}
function goldOk(){
  var z=function(tz){var p=new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
    function g(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return p[i].value;return "";}
    var hh=+g("hour");if(hh===24)hh=0;return {wd:g("weekday"),m:hh*60+ +g("minute")};};
  var L=z("Europe/London"),N=z("America/New_York");
  var lo=L.wd!=="Sat"&&L.wd!=="Sun"&&L.m>=480&&L.m<1020;
  var ny=N.wd!=="Sat"&&N.wd!=="Sun"&&N.m>=510&&N.m<1020;
  return lo||ny;
}
function ema(v,n){if(!v.length)return[];var k=2/(n+1),o=[v[0]];for(var i=1;i<v.length;i++)o.push(v[i]*k+o[i-1]*(1-k));return o;}
function rsi(v,n){n=n||14;if(v.length<n+1)return 50;var g=0,l=0,i,d;for(i=1;i<=n;i++){d=v[i]-v[i-1];if(d>=0)g+=d;else l-=d;}g/=n;l/=n;for(i=n+1;i<v.length;i++){d=v[i]-v[i-1];g=(g*(n-1)+Math.max(d,0))/n;l=(l*(n-1)+Math.max(-d,0))/n;}return l?100-100/(1+g/l):100;}
function swings(c,N){N=N||2;var hi=[],lo=[];for(var i=N;i<c.length-N;i++){var ph=1,pl=1;for(var j=1;j<=N;j++){if(c[i].h<=c[i-j].h||c[i].h<=c[i+j].h)ph=0;if(c[i].l>=c[i-j].l||c[i].l>=c[i+j].l)pl=0;}if(ph)hi.push(c[i].h);if(pl)lo.push(c[i].l);}return {hi:hi,lo:lo};}
function trend(sw){var h=sw.hi.slice(-2),l=sw.lo.slice(-2);if(h.length<2||l.length<2)return "RANGE";var u=h[1]>h[0],v=l[1]>l[0];if(u&&v)return "UP";if(!u&&!v)return "DOWN";return "RANGE";}
function lvl(sw,px){var pts=sw.hi.concat(sw.lo).sort(function(a,b){return a-b;}),z=[];for(var i=0;i<pts.length;i++){var p=pts[i],hit=null;for(var k=0;k<z.length;k++)if(Math.abs(p-z[k])/z[k]<0.0016){hit=k;break;}if(hit!=null)z[hit]=(z[hit]+p)/2;else z.push(p);}var res=null,sup=null;for(i=0;i<z.length;i++){if(z[i]>px&&(res==null||z[i]<res))res=z[i];if(z[i]<px&&(sup==null||z[i]>sup))sup=z[i];}return {res:res,sup:sup};}
function pat(pr,la){if(!pr||!la)return null;var b=Math.abs(la.c-la.o),r=la.h-la.l||1e-9,up=la.h-Math.max(la.c,la.o),dn=Math.min(la.c,la.o)-la.l,g=la.c>la.o,rd=la.c<la.o,pb=Math.abs(pr.c-pr.o);
  if(g&&pr.c<pr.o&&la.c>=pr.o&&la.o<=pr.c&&b>pb)return {n:"Bull engulf",d:"long"};
  if(rd&&pr.c>pr.o&&la.o>=pr.c&&la.c<=pr.o&&b>pb)return {n:"Bear engulf",d:"short"};
  if(dn>b*2&&dn>up*1.5&&b/r<0.4)return {n:"Hammer",d:"long"};
  if(up>b*2&&up>dn*1.5&&b/r<0.4)return {n:"Star",d:"short"};return null;}
function atr(c,n){n=n||14;var s=0,k=0;for(var i=Math.max(1,c.length-n);i<c.length;i++){s+=Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c));k++;}return k?s/k:0;}
function analyze(ex,cx,md,px){
  var last=ex[ex.length-2]||ex[ex.length-1];px=px||last.c;
  var se=swings(ex),sc=swings(cx),sm=swings(md);
  var tE=trend(se),tC=trend(sc),tM=trend(sm),lv=lvl(se,px),p=pat(ex[ex.length-3],ex[ex.length-2]);
  var cl=ex.map(function(k){return k.c;});var e20=ema(cl,20),e50=ema(cl,50),rs=rsi(cl,14);
  var a20=e20[e20.length-1],a50=e50[e50.length-1],stk=px>a20&&a20>a50?1:(px<a20&&a20<a50?-1:0);
  var a=atr(ex),dir=p?p.d:(tE==="UP"?"long":tE==="DOWN"?"short":null);
  var nS=!!(lv.sup&&Math.abs(px-lv.sup)/px<0.0035),nR=!!(lv.res&&Math.abs(px-lv.res)/px<0.0035);
  var scn=0;function add(ok,pts){if(ok)scn+=pts;}
  add((dir==="long"&&tC==="UP")||(dir==="short"&&tC==="DOWN"),20);
  add((dir==="long"&&tM==="UP")||(dir==="short"&&tM==="DOWN"),12);
  add((dir==="long"&&nS)||(dir==="short"&&nR),16);
  add(!!p,p&&((p.d==="long"&&nS)||(p.d==="short"&&nR))?16:5);
  add((dir==="long"&&stk===1)||(dir==="short"&&stk===-1),8);
  add(rs>35&&rs<65,8);add(a/px>0.0005&&a/px<0.016,8);
  var ent=dir?px:null,sl=null,tp=null,rr=null;
  if(dir&&ent!=null){var risk=a*1.15;if(dir==="long"){sl=ent-risk;tp=lv.res&&lv.res-ent>0?lv.res:ent+risk*2;rr=(tp-ent)/(ent-sl||1e-9);}else{sl=ent+risk;tp=lv.sup&&ent-lv.sup>0?lv.sup:ent-risk*2;rr=(ent-tp)/(sl-ent||1e-9);}}
  return {px:px,dir:dir,score:scn,tC:tC,tM:tM,rsi:rs,ent:ent,sl:sl,tp:tp,rr:rr,pat:p?p.n:null};
}
function nqC(id,dir){var n=S.mac.nq;if(!n||!dir||id==="xau")return "n/a";if(dir==="long"&&n.chg<=-0.35)return "diverge";if(dir==="short"&&n.chg>=0.35)return "diverge";if((dir==="long"&&n.chg>=0.1)||(dir==="short"&&n.chg<=-0.1))return "agree";return "n";}
function gate(a,id){
  var r=[],I=ist();
  if(!a.dir)r.push("no direction");if(a.score<78)r.push("score < 78");if(a.rr==null||a.rr<1.8)r.push("R:R < 1.8");
  if((a.dir==="long"&&a.tC==="DOWN")||(a.dir==="short"&&a.tC==="UP"))r.push("against HTF");
  if(a.tC==="RANGE")r.push("HTF range");
  if((a.dir==="long"&&a.tM!=="UP")||(a.dir==="short"&&a.tM!=="DOWN"))r.push("mid-TF off");
  if(id==="xau"&&!goldOk())r.push("gold off hours");
  if(I.risk==="thin")r.push("thin overnight");
  var nc=nqC(id,a.dir);if(nc==="diverge"&&id!=="xau")r.push("NQ diverges");
  if(r.length)return {ok:0,g:"WAIT",r:r};
  var Aplus=a.score>=88&&(a.rr||0)>=2&&!!a.pat&&I.risk!=="thin"&&nc!=="diverge";
  return {ok:1,g:Aplus?"A":"B",r:[]};
}
function bars(arr){return (arr||[]).map(function(k){return {t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]};}).sort(function(a,b){return a.t-b.t;});}
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
  return H('<div class="ch"><div class="mo mu" style="font-size:10px">',lab,'</div><div class="mo" style="font-size:15px;margin-top:4px">',fmt(px),'</div><div class="mo ',up?"up":"dn",'" style="font-size:11px">',up?"+":"",(chg||0).toFixed(2),"%</div></div>");
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
    if(!p)return H('<div class="cd"><div class="rw"><b>',s.name,'</b><span class="mo">',fmt(st.px),'</span></div><p class="mu">Scanning...</p></div>');
    var a=p.a,g=p.g,tk=g.ok,lng=tk&&a.dir==="long";
    var pc=lng?"var(--up)":tk?"var(--dn)":"var(--mu)";
    var pl=tk?(a.dir==="long"?"BUY":"SELL"):"WAIT";
    var msg=tk?g.g+" · SL "+fmt(a.sl)+" · TP "+fmt(a.tp):"Stand down. "+g.r.slice(0,2).join(" · ");
    return H('<div class="cd"><div class="rw"><div><b>',s.name,'</b> <span class="mo mu">',g.g,'</span><div class="mo mu" style="font-size:11px">',fmt(st.px)," · HTF ",a.tC,"</div></div>",pill(pc,pl),"</div>",
      '<div class="g3" style="margin-top:10px"><div class="st mo"><div class="a">Score</div><div class="b">',a.score,'</div></div><div class="st mo"><div class="a">RSI</div><div class="b">',a.rsi.toFixed(1),'</div></div><div class="st mo"><div class="a">R:R</div><div class="b">',a.rr?a.rr.toFixed(2):"-","</div></div></div>",
      '<p class="mu" style="font-size:13px;margin:10px 0 0">',msg,"</p>",
      tk?H('<button class="bt" data-log="',s.id,'">Log setup</button>'):"","</div>");
  }).join("");
  return H('<p class="se mo">Session</p>',sess,'<p class="se mo">Judgment</p>',cards,'<p class="su" style="font-size:11px">WAIT unless HTF+mid+R:R 1.8 + NQ agree.</p>');
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
    '<div class="mo" style="margin-top:8px">',fmt(S.live[S.sid].px),"</div></div>",
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
function paint(){
  tape();
  document.getElementById("view").innerHTML=S.tab==="desk"?desk():S.tab==="setup"?setup():logv();
  var bs=document.querySelectorAll(".nav button");
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",bs[i].getAttribute("data-t")===S.tab);
}
document.querySelector(".nav").onclick=function(e){var b=e.target.closest("button");if(!b)return;S.tab=b.getAttribute("data-t");if(S.tab==="setup")goSetup();paint();};
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
  macro();
  try{await sigs();}catch(e){S.feed="scan fail";paint();}
  setInterval(sigs,60000);setInterval(goldPx,20000);setInterval(macro,20000);
})();