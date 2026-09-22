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
var S={tab:"desk",sid:"btc",live:{},sig:{},mac:{},setup:null,j:[],news:[],feed:"boot",st:"off"};
A.forEach(function(x){S.live[x.id]={px:null,chg:0};S.sig[x.id]=null;});
try{var jr=localStorage.getItem("ppro_j");if(jr)S.j=JSON.parse(jr);}catch(e){}
function fmt(n){if(n==null||!isFinite(n))return "-";if(n>=1000)return n.toLocaleString("en-US",{maximumFractionDigits:1});return n>=1?n.toFixed(2):n.toFixed(4);}function usd(n){return n==null||!isFinite(n)?"-":"$"+fmt(n);}
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
function venues(){
  var V=[["New York","Equities","America/New_York",570,960],["London","Metals","Europe/London",480,990],["Frankfurt","DAX","Europe/Berlin",540,1050],["Tokyo","Nikkei","Asia/Tokyo",540,900],["Hong Kong","HSI","Asia/Hong_Kong",570,960]];
  return V.map(function(v){
    var p=new Intl.DateTimeFormat("en-US",{timeZone:v[2],weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
    function g(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return p[i].value;return "";}
    var hh=+g("hour");if(hh===24)hh=0;var m=hh*60+ +g("minute");var we=g("weekday")==="Sat"||g("weekday")==="Sun";
    var open=!we&&m>=v[3]&&m<v[4];
    var clk=String(hh).padStart(2,"0")+":"+g("minute");
    var lab=we?"Weekend":open?"Open":"Opens next session";
    if(!we&&!open&&m<v[3]){var w=v[3]-m;lab="Opens "+Math.floor(w/60)+"h "+(w%60)+"m";}
    return {n:v[0],c:v[1],open:open,clk:clk,lab:lab};
  });
}
async function loadNews(){
  var feeds=["https://www.coindesk.com/arc/outboundfeeds/rss/"];
  var rows=[];
  var j=await get("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(feeds[0]),8000);if(1){
    var items=j&&j.items?j.items:[];
    for(var k=0;k<items.length&&k<8;k++){
      rows.push({src:j.feed&&j.feed.title?j.feed.title:"News",t:items[k].title||"",when:items[k].pubDate?items[k].pubDate.slice(5,16):""});
    }
  }
  S.news=rows.slice(0,16);if(S.tab==="news")paint();
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