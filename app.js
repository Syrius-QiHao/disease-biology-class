(function(){
'use strict';
var data=null;
var quiz=null;
var previousRoute=null;
var pptFiles=window.PPT_FILES||[];
var updateLog=[{
date:'2026-11-06',title:'题库与学习功能更新',items:[
'学习通免疫题去重后收录 283 题，标注题目来源与对应课件；存疑题暂不收录。',
'整合发病学总论及应激、缺氧、休克、发热、缺血再灌注损伤五个专题，补充课件、题目和背诵卡。',
'新增免疫知识点梳理，按细胞查看相关分子、作用和易混点。',
'选择题支持选好后手动提交，显示对错与解析；答错自动加入错题本，方便回头复习。',
'首页移除三个统计卡片，新增更新日志，方便查看网站变化。'
]}];
var state={bankTab:'practice',bankChapter:'all',bankType:'all',bankTopic:'all',bankSource:'all',bankPageIndex:1,reciteChapter:'all',mapModule:'immunology',bankModule:'immunology',reciteModule:'immunology',pptModule:'immunology',mistakeModule:'all',mistakeType:'all',mistakeStatus:'pending'};
var mastery=new Set();
try{mastery=new Set(JSON.parse(localStorage.getItem('disease-biology-mastery-v1')||'[]'));}catch(e){}
var app=document.getElementById('app');
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clean(v){return String(v||'').replace(/\*\*/g,'');}
function icon(name){
var paths={
notebook:'<path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4M12 16h3"/>',
home:'<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-7h6v7"/>',
map:'<circle cx="12" cy="4" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 6v6M5 17v-5h14v5"/>',
bank:'<path d="M4 4h7a3 3 0 0 1 3 3v14H7a3 3 0 0 0-3 0zM20 4h-3a3 3 0 0 0-3 3v14h3a3 3 0 0 1 3 0z"/>',
recite:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
slides:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9h10M7 12h7"/>',
layers:'<path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
menu:'<path d="M3 6h18M3 12h18M3 18h18"/>'
};
return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.home)+'</svg>';
}
function route(){var r=decodeURIComponent((location.hash||'#home').slice(1));var p=r.split('?');return {path:p[0]||'home',query:new URLSearchParams(p[1]||'')};}
function go(hash){location.hash=hash;}
function chapter(id){return data.chapters.concat(data.pathogenesisChapters||[]).find(function(c){return c.id===id;});}
function module(id){return data.modules.find(function(m){return m.id===id;});}
function sourceText(cit){return String(cit||'').replace(/[SP]\d{2}/g,function(id){return data.files[id]||id;});}
function sourceChip(cit){return '<div class="citation"><span>来源 · </span>'+esc(sourceText(cit))+'</div>';}
function statusClass(s){return (s==='已整理'||s==='已学完')?'ready':s==='学习中'?'current':'';}
function selected(v,target){return v===target?' selected':'';}
function navItem(href,name,label,active){return '<a class="nav-item'+(active?' active':'')+'" href="#'+href+'">'+icon(name)+'<span>'+label+'</span></a>';}
function shell(content,r){
var key=r.path.split('/')[0];
var crumbs={home:'课程首页',map:'思维导图',bank:'题库',recite:'问答背诵',ppt:'课件 PPT',knowledge:'知识点梳理',mistakes:'错题本',module:'课程模块',chapter:'章节学习',search:'搜索结果'};
var crumb=crumbs[key]||'课程首页';
if(key==='module'){var m=module(r.path.split('/')[1]);if(m)crumb=m.name;}
if(key==='chapter'){var c=chapter(r.path.split('/')[1]);if(c)crumb=c.title;}
return '<div class="layout">'+
'<div class="overlay" id="overlay"></div><aside class="side" id="side">'+
'<a class="brand" href="#home"><span class="brand-symbol">生</span><span class="brand-text"><strong>疾病的生物学基础</strong><small>CLASS STUDY ATLAS</small></span></a>'+
'<div class="nav-label">学习空间</div>'+
navItem('home','home','课程首页',key==='home')+
navItem('map','map','思维导图',key==='map')+
navItem('knowledge','layers','知识点梳理',key==='knowledge')+
navItem('bank','bank','题库',key==='bank')+
navItem('mistakes','notebook','错题本',key==='mistakes')+
navItem('recite','recite','问答背诵',key==='recite')+
navItem('ppt','slides','课件 PPT',key==='ppt')+
'<div class="nav-label">课程模块</div>'+
navItem('module/immunology','layers','免疫学',r.path==='module/immunology'||key==='chapter')+
navItem('module/pathogenesis','layers','发病学',r.path==='module/pathogenesis')+
navItem('module/parasitology','layers','寄生虫学',r.path==='module/parasitology')+
'<div class="side-footer"><strong>资料持续整理中</strong>课件与题目保留来源。免疫学及发病学资料已整合，考试回忆仅供复习定位。</div></aside>'+
'<div class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:10px;min-width:0"><button class="mobile-menu" aria-label="打开菜单" id="menuBtn">'+icon('menu')+'</button><div class="crumb">疾病的生物学基础 / <strong>'+esc(crumb)+'</strong></div></div>'+
'<div class="top-actions"><form class="search-form" id="globalSearch">'+icon('search')+'<input aria-label="搜索知识点" name="q" placeholder="搜索知识点、题目..." autocomplete="off"></form><div class="avatar" title="班级学习站">学</div></div></header>'+
'<main class="container">'+content+'<footer class="site-footer">《疾病的生物学基础》班级学习站 · 资料依课件整理，页码指幻灯片顺序。考试回忆并非正式试卷。<br>免疫学按幻灯片序号标注，发病学按PDF页码并列幻灯片序号。其余模块随课程进度补充。</footer></main></div></div>';
}
function home(){
var cards=[
{href:'map',icon:'☷',title:'思维导图',desc:'从整门课进入，沿着章节与机制线索梳理知识。'},
{href:'bank',icon:'▤',title:'题库',desc:'按模块、题源和题型查找课件自测、考试回忆与旧资料核对题。'},
{href:'recite',icon:'▣',title:'问答题背诵',desc:'遮住答案先回忆，再按来源页码查缺补漏。'},
{href:'ppt',icon:'▧',title:'课件 PPT',desc:'按授课顺序找到原始课件，下载后查看。'}
];
return '<section class="hero"><div class="hero-copy"><div class="eyebrow">DISEASE BIOLOGY · COURSE ATLAS</div><h1>疾病的生物学基础</h1><p>免疫学和发病学按课件整理，学习通题目、资料题和考试回忆分开标明来源。通过知识梳理、练习和错题复习串起学习进度。</p><div class="hero-actions"><a class="btn btn-primary" href="#map">打开思维导图 <span>↗</span></a><a class="btn btn-secondary" href="#module/immunology">开始学免疫</a></div></div><div class="hero-art"><div class="orbit"><div class="orbit-core">疾病的<br>生物学基础</div><span class="orbit-node a">知识结构</span><span class="orbit-node b">考点定位</span><span class="orbit-node c">机制串联</span></div><div class="hero-small">LEARN · CONNECT · RECALL</div></div></section>'+
'<div class="section-heading"><div><div class="eyebrow">CHOOSE YOUR PATH</div><h2>从这里开始</h2><p>导图、知识梳理、练习和背诵，按学习需要进入。</p></div></div>'+
'<div class="gateway-grid">'+cards.map(function(c){return '<a class="gateway" href="#'+c.href+'"><span class="gate-icon">'+c.icon+'</span><span class="arrow">↗</span><h3>'+c.title+'</h3><p>'+c.desc+'</p></a>';}).join('')+'</div>'+
'<a class="kg-home-banner" href="#knowledge"><div><span class="eyebrow">细胞与分子</span><strong>知识点梳理</strong><p>CD4 T、CD8 T、B细胞…按细胞找分子，按分子查作用。</p></div><span class="kg-home-action">打开免疫学梳理 →</span></a>'+
'<a class="notebook-entry-banner" href="#mistakes"><span><strong>错题本</strong><small>把做错的题留下，选好答案后提交，再回看解析。</small></span><span class="notebook-entry-count"><b data-notebook-count>'+quiz.pendingCount()+'</b> 题待复习 →</span></a>'+
'<div class="section-heading" id="modules"><div><div class="eyebrow">COURSE MODULES</div><h2>课程模块</h2><p>先把已学内容整理清楚，其余内容随着课程推进补充。</p></div><span class="link">共 8 个模块</span></div>'+
'<div class="module-grid">'+data.modules.map(function(m,i){return '<a class="module-card'+(i===0?' featured':'')+'" href="#module/'+m.id+'"><div class="mod-top"><span class="number">'+String(i+1).padStart(2,'0')+' / MODULE</span><span class="status '+statusClass(m.status)+'">'+m.status+'</span></div><h3>'+esc(m.name)+'</h3><p>'+esc(m.description)+'</p><div class="mod-foot">'+(i===0?'进入 15 章目录 →':i===1?'查看已讲主题 →':'查看模块 →')+'</div></a>';}).join('')+'</div>'+
'<div class="study-banner"><div><strong>发病学五个专题已学完</strong><p>应激、缺氧、休克、发热、缺血再灌注损伤，已按六份PDF整理总论与专题。</p></div><a class="link" href="#module/pathogenesis">查看发病学 →</a></div>'+homeUpdateLog();
}
function homeUpdateLog(){
return '<section class="update-log" aria-labelledby="update-log-title"><div class="section-heading"><div><div class="eyebrow">WHAT’S NEW</div><h2 id="update-log-title">更新日志</h2><p>记录新增资料与功能变化。</p></div></div><ol class="update-log-list">'+updateLog.map(function(entry,i){return '<li class="update-log-entry"><div class="update-log-meta"><time datetime="'+esc(entry.date)+'">'+esc(entry.date)+'</time>'+(i===0?'<span class="update-log-latest">最新</span>':'')+'</div><div class="update-log-content"><h3>'+esc(entry.title)+'</h3><ul>'+entry.items.map(function(item){return '<li>'+esc(item)+'</li>';}).join('')+'</ul></div></li>';}).join('')+'</ol></section>';
}
function modulePage(id){
var m=module(id);if(!m)return notFound();
if(id==='pathogenesis'){
return '<div class="module-hero"><div><div class="eyebrow">MODULE 02 · 五专题已学完</div><h1>发病学</h1><p>总论加应激、缺氧、休克、发热、缺血再灌注损伤。按PDF页码回看知识点，再到题库和背诵卡复习。</p></div><div class="module-number">02</div></div><div class="quick-links"><a href="#bank" data-bank-module="pathogenesis" data-bank-tab="legacy">进入发病学题库 ↗</a><a href="#ppt" data-open-module="ppt" data-open-value="pathogenesis">六份PDF课件 ↗</a><a href="#recite" data-open-module="recite" data-open-value="pathogenesis">问答背诵 ↗</a><a href="#map" data-open-module="map" data-open-value="pathogenesis">专题导图 ↗</a></div><div class="chapter-grid">'+(data.pathogenesisChapters||[]).map(function(c){var n=(data.legacy||[]).filter(function(q){return q.chapter===c.id;}).length;return '<a class="chapter-card" href="#chapter/'+c.id+'"><small>CHAPTER '+String(c.number).padStart(2,'0')+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(c.topics[0].body)+'</p><div class="foot">'+c.topics.length+' 节 · 资料题 '+n+' 条 · '+esc(c.filename)+'</div></a>';}).join('')+'</div>';
}
if(id!=='immunology'){
var nRecall=data.recall.filter(function(q){return q.module===id;}).length;
var nPractice=data.practice.filter(function(q){return q.module===id;}).length;
return '<div class="page-head"><div><div class="eyebrow">COURSE MODULE</div><h1>'+esc(m.name)+'</h1><p>模块状态与已确认的学习进度</p></div><span class="status '+statusClass(m.status)+'">'+m.status+'</span></div>'+
'<div class="placeholder"><div class="eyebrow">'+(id==='pathogenesis'?'IN PROGRESS':'COMING SOON')+'</div><div class="big">'+(id==='pathogenesis'?'目前已讲四个主题':'未完待续')+'</div><p>'+esc(m.description)+' 回忆题已按学科先行归档，自测题依回忆考点新编；课程知识内容仍待课件补充。</p>'+(m.topics.length?'<div class="pill-row">'+m.topics.map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('')+'</div>':'')+'<a class="btn btn-soft" href="#bank" data-bank-module="'+id+'" data-bank-tab="recall">考试回忆 '+nRecall+' 条 · 自测 '+nPractice+' 题 →</a></div>';
}
return '<div class="module-hero"><div><div class="eyebrow">MODULE 01 · 已整理</div><h1>免疫学</h1><p>从抗原和抗体出发，连起补体、免疫细胞、抗原提呈、免疫应答以及耐受与超敏反应。内容逐条保留课件来源，便于回看原页。</p></div><div class="module-number">01</div></div>'+
'<div class="quick-links"><a href="#knowledge">细胞与分子梳理 ↗</a><a href="#map">查看思维导图 ↗</a><a href="#bank" data-bank-module="immunology" data-bank-tab="practice">进入题库 ↗</a><a href="#recite">开始问答背诵 ↗</a><a href="#ppt">查看原始课件 ↗</a></div>'+
'<div class="section-heading"><div><div class="eyebrow">CHAPTERS</div><h2>按课件顺序学习</h2><p>15 个章节 · '+data.chapters.reduce(function(n,c){return n+c.topics.length;},0)+' 条来源清楚的知识梳理</p></div></div>'+
'<div class="chapter-grid">'+data.chapters.map(function(c){return '<a class="chapter-card" href="#chapter/'+c.id+'"><small>CHAPTER '+String(c.number).padStart(2,'0')+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(clean(c.topics[0]?c.topics[0].body:''))+'</p><div class="foot">'+esc(c.filename)+' · '+c.topics.length+' 节</div></a>';}).join('')+'</div>';
}

function pptPage(){
var m=module(state.pptModule)||data.modules[0],files=m.id==='pathogenesis'?(data.pathogenesisFiles||[]):pptFiles;
var head='<div class="page-head"><div><div class="eyebrow">COURSE SLIDES</div><h1>课程课件</h1><p>按模块和课件顺序查找，保留原文件下载。</p></div>'+moduleSelect('ppt')+'</div>';
if(m.id!=='immunology'&&m.id!=='pathogenesis')return head+'<div class="placeholder"><div class="big">'+esc(m.name)+' · 课件待补</div><p>随课程进度补充，当前不视为已学完。</p></div>';
return head+'<div class="subtle-alert">'+(m.id==='pathogenesis'?'发病学六份PDF已收录。每页一般排两张幻灯片，笔记同时列PDF页码；缺氧最后一页单张。':'免疫学保留原PPT文件；课件页码按幻灯片顺序。')+'</div><div class="ppt-grid">'+files.map(function(p,i){var c=chapter(p.chapter);return '<article class="ppt-card"><div class="ppt-card-top"><span class="ppt-index">'+String(i+1).padStart(2,'0')+' / '+files.length+'</span><span class="ppt-format">'+esc(p.name.split('.').pop().toUpperCase())+'</span></div><h2>'+esc(c?c.title:'补充课件')+(p.variant?' <small>'+esc(p.variant)+'</small>':'')+'</h2><p class="ppt-filename">'+esc(p.name)+'</p><div class="ppt-card-bottom"><span>'+esc(p.mb)+' MB · '+(p.pdfPages?p.pdfPages+'页PDF / ':'')+p.slideCount+'张幻灯片</span><div><a class="ppt-note" href="#chapter/'+p.chapter+'">查看笔记 ↗</a><a class="ppt-open" href="./ppt/'+(p.folder||'')+encodeURIComponent(p.name)+'" download>下载原文件 ↓</a></div></div></article>';}).join('')+'</div>';
}
function mapPage(){
var m=module(state.mapModule)||data.modules[0];
var select='<select class="filter-select" data-filter="mapModule" aria-label="选择模块">'+data.modules.map(function(x){return '<option value="'+x.id+'"'+selected(x.id,state.mapModule)+'>'+esc(x.name)+' · '+x.status+'</option>';}).join('')+'</select>';
var head='<div class="page-head"><div><div class="eyebrow">VISUAL LEARNING</div><h1>思维导图</h1><p>先看整体，再沿分支进入章节；每个节点都可以打开对应内容。</p></div>'+select+'</div>';
if(m.id==='pathogenesis')return head+'<div class="map-board"><div class="map-root">发病学<br><small>总论与五个已学专题</small></div><div class="chapter-grid">'+(data.pathogenesisChapters||[]).map(function(c){return '<a class="map-node" href="#chapter/'+c.id+'"><span>'+c.number+'</span>'+esc(c.title)+'<p>'+esc(c.topics[0].body)+'</p></a>';}).join('')+'</div></div>';
if(m.id!=='immunology')return head+placeholderFor(m);
var groups=[{title:'基础与效应分子',desc:'从免疫概念到可参与效应的分子',ids:['S01','S02','S03','S04','S05']},{title:'细胞识别与提呈',desc:'谁识别抗原，信息如何传给 T/B 细胞',ids:['S06','S07','S08','S09','S10']},{title:'应答、调节与应用',desc:'怎样应答，何时造成疾病，如何检测',ids:['S11','S12','S13','S14','S15']}];
return head+'<div class="map-board"><div class="map-root">免疫学<br><small style="font-size:11px;color:#a8d0c8;font-weight:500">15 章知识主线</small></div><div class="map-clusters">'+groups.map(function(g){return '<div class="map-cluster"><h3>'+g.title+'</h3><p>'+g.desc+'</p>'+g.ids.map(function(id){var c=chapter(id);return '<a class="map-node" href="#chapter/'+id+'"><span>'+String(c.number).padStart(2,'0')+'</span>'+esc(c.title)+'</a>';}).join('')+'</div>';}).join('')+'</div></div>'+
'<div class="map-notes"><div class="note"><strong>主线 01 · 抗原怎样被识别？</strong><p>抗原表位 → MHC 呈递 → TCR/BCR 识别 → 双信号活化。点击相关章节查看每一步。</p></div><div class="note"><strong>主线 02 · 应答何时造成疾病？</strong><p>抗体、补体和 T 细胞执行效应，也可能形成超敏反应；免疫耐受负责约束自身反应。</p></div></div>';
}
function placeholderFor(m){return '<div class="placeholder"><div class="eyebrow">'+esc(m.status)+'</div><div class="big">'+esc(m.name)+' · '+(m.status==='学习中'?'资料待补':'未完待续')+'</div><p>'+esc(m.description)+'</p>'+(m.topics.length?'<div class="pill-row">'+m.topics.map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('')+'</div>':'')+'<a class="link" href="#module/'+m.id+'">查看模块状态 →</a></div>';}
function chapterPage(id){
var c=chapter(id);if(!c)return notFound();var mid=c.module||'immunology',isPath=mid==='pathogenesis';
var recalls=data.recall.filter(function(x){return x.chapter===id||(x.citation||'').indexOf(id)>=0;});
var verified=(data.legacy||[]).filter(function(x){return x.chapter===id;});var cards=data.recitation.filter(function(x){return x.chapter===id;});
return '<div class="page-head"><div><div class="eyebrow">'+(isPath?'PATHOGENESIS':'IMMUNOLOGY')+' / CHAPTER '+String(c.number).padStart(2,'0')+'</div><h1>'+esc(c.title)+'</h1><p>知识点、机制和来源页码</p></div><a class="link" href="#module/'+mid+'">← 返回模块目录</a></div><div class="chapter-meta"><span class="meta-chip">'+esc(c.filename)+'</span><span class="meta-chip">'+c.topics.length+' 个小节</span><span class="meta-chip">'+verified.length+' 条资料题</span></div><div class="chapter-layout"><nav class="chapter-aside"><strong>本章目录</strong>'+c.topics.map(function(t,i){return '<a href="#chapter/'+id+'/'+id+'-'+(i+1)+'">'+String(i+1).padStart(2,'0')+' '+esc(t.title)+'</a>';}).join('')+'</nav><div>'+c.topics.map(function(t,i){return '<section class="topic-card" id="'+id+'-'+(i+1)+'"><small>SECTION '+String(i+1).padStart(2,'0')+'</small><h2>'+esc(t.title)+'</h2><p style="white-space:pre-line">'+esc(clean(t.body))+'</p>'+sourceChip(t.citation)+'</section>';}).join('')+(c.focus?'<section class="topic-card"><h2>复习要求与建议</h2>'+c.focus.map(function(t){return '<p>'+esc(sourceText(t))+'</p>';}).join('')+'</section>':'')+(c.confusions?'<section class="topic-card"><h2>易混点</h2>'+c.confusions.map(function(t){return '<h3>'+esc(t[0])+'</h3><p>'+esc(t[1])+'</p>'+sourceChip(t[2]);}).join('')+'</section>':'')+'<div class="related-box"><h3>继续复习本章</h3><div class="related-links"><a href="#bank" data-bank-module="'+mid+'" data-bank-chapter="'+id+'" data-bank-tab="legacy">资料题 · '+verified.length+' 条</a><a href="#bank" data-bank-module="'+mid+'" data-bank-chapter="'+id+'" data-bank-tab="recall">考试回忆 · '+recalls.length+' 条</a><a href="#recite" data-open-module="recite" data-open-value="'+mid+'" data-open-chapter="'+id+'">背诵卡 · '+cards.length+' 张</a>'+(isPath?'':'<a href="#knowledge">细胞与分子梳理</a>')+'</div></div></div></div>';
}
function moduleSelect(kind){return '<select class="filter-select" data-filter="'+kind+'Module" aria-label="选择学科模块">'+data.modules.map(function(m){return '<option value="'+m.id+'"'+selected(m.id,state[kind+'Module'])+'>'+esc(m.name)+' · '+m.status+'</option>';}).join('')+'</select>';}
function chapterSelect(kind){var list=state[kind+'Module']==='pathogenesis'?(data.pathogenesisChapters||[]):data.chapters;return '<select class="filter-select" data-filter="'+kind+'Chapter" aria-label="选择章节"><option value="all">全部章节</option>'+list.map(function(c){return '<option value="'+c.id+'"'+selected(c.id,state[kind+'Chapter'])+'>'+String(c.number).padStart(2,'0')+' '+esc(c.title)+'</option>';}).join('')+'</select>';}
function questionTypeName(v){return {single:'单选题',multiple:'多选题',term:'名词解释',short:'简答题',case:'案例题'}[v]||'待分类';}
function typeSelect(){return '<select class="filter-select" data-filter="bankType" aria-label="选择题型"><option value="all">全部题型</option>'+['single','multiple','term','short','case'].map(function(t){return '<option value="'+t+'"'+selected(t,state.bankType)+'>'+questionTypeName(t)+'</option>';}).join('')+'</select>';}
function topicSelect(){return '<select class="filter-select" data-filter="bankTopic" aria-label="选择发病学专题"><option value="all">全部专题</option>'+(data.pathogenesisTopics||[]).map(function(t){return '<option value="'+t.id+'"'+selected(t.id,state.bankTopic)+'>'+esc(t.name)+'</option>';}).join('')+'</select>';}
function sourceSelect(){return '<select class="filter-select" data-filter="bankSource" aria-label="选择资料来源"><option value="all">全部资料来源</option><option value="slides"'+selected('slides',state.bankSource)+'>课堂病例整理</option><option value="pdf"'+selected('pdf',state.bankSource)+'>整合资料 PDF</option><option value="xuexitong"'+selected('xuexitong',state.bankSource)+'>学习通免疫题目</option></select>';}
function bankPage(){
var m=module(state.bankModule)||data.modules[0];var tab=state.bankTab;
var all=tab==='practice'?data.practice:tab==='recall'?data.recall:(data.legacy||[]);
var list=all.filter(function(q){
if((q.module||'immunology')!==m.id)return false;
if(state.bankType!=='all'&&(q.questionType||'single')!==state.bankType)return false;
if(tab==='legacy'&&state.bankSource!=='all'&&(q.sourceKind||'pdf')!==state.bankSource)return false;
if(m.id==='pathogenesis'&&state.bankTopic!=='all'&&q.topic!==state.bankTopic)return false;
if(m.id==='pathogenesis'&&state.bankChapter!=='all'&&q.chapter!==state.bankChapter)return false;
return m.id!=='immunology'||state.bankChapter==='all'||(tab==='recall'?(q.citation||'').indexOf(state.bankChapter)>=0:q.chapter===state.bankChapter);
});
var pages=Math.max(1,Math.ceil(list.length/20));state.bankPageIndex=Math.min(Math.max(1,state.bankPageIndex),pages);
var shown=list.slice((state.bankPageIndex-1)*20,state.bankPageIndex*20);
var head='<div class="page-head"><div><div class="eyebrow">QUESTION LIBRARY</div><h1>题库</h1><p>按模块、来源与题型筛选。选好后提交，答错自动加入错题本。</p></div><a class="btn btn-soft" href="#mistakes">错题本 · <span data-notebook-count>'+quiz.pendingCount()+'</span> 题待复习 →</a></div><div class="filters">'+moduleSelect('bank')+'<div class="tabs"><button class="tab'+(tab==='practice'?' active':'')+'" data-tab="practice">考点自测</button><button class="tab'+(tab==='recall'?' active':'')+'" data-tab="recall">考试回忆</button><button class="tab'+(tab==='legacy'?' active':'')+'" data-tab="legacy">资料题库</button></div>'+(m.id==='immunology'?chapterSelect('bank'):m.id==='pathogenesis'?topicSelect():'')+(tab==='legacy'?sourceSelect():'')+typeSelect()+'<span class="count">'+list.length+' 条</span></div>';
var intro=tab==='practice'?'<div class="subtle-alert">此栏为新编自测题。资料原题请切换到“资料题库”；考试回忆另列来源。</div>':tab==='recall'?'<div class="subtle-alert">此栏来自考试回忆图片。题干不完整、记忆有矛盾的地方保留核对说明。</div>':'<div class="subtle-alert">此栏按用户提供的整合资料及学习通文档整理。题目注明原始位置与对应课程考点；缺项、答案冲突或依据不足的候选题留在核对清单中。免疫学标注幻灯片序号，发病学标注PDF页码。</div>';
var card=tab==='practice'?practiceCard:tab==='recall'?recallCard:legacyCard;
var pagination='<div class="bank-pagination"><button class="tiny-btn" data-bank-page="'+(state.bankPageIndex-1)+'"'+(state.bankPageIndex===1?' disabled':'')+'>上一页</button><span>第 '+state.bankPageIndex+' / '+pages+' 页 · 每页 20 题</span><button class="tiny-btn" data-bank-page="'+(state.bankPageIndex+1)+'"'+(state.bankPageIndex===pages?' disabled':'')+'>下一页</button></div>';
return head+intro+'<div class="question-list">'+(shown.length?shown.map(card).join(''):'<div class="empty">此筛选下暂没有已收录的题目。</div>')+'</div>'+pagination;
}
function materialSourceText(q){return (q.sourceRefs||[{kind:'pdf',file:'疾病的生物学基础整合资料.pdf',page:q.pdfPage,question:q.originalNo}]).map(function(r){return (r.file||'资料')+(r.section?' · '+r.section:'')+(r.page?' 第'+r.page+'页':'')+(r.question?' · 第'+r.question+'题':'')+(r.paragraph?'（文档段落'+r.paragraph+'）':'');}).join('；');}
function quizFooter(q,source){
var mid=q.module||'immunology',c=q.chapter&&chapter(q.chapter),href=c?'#chapter/'+c.id:'#module/'+mid;
var text='';
if(source==='practice')text=sourceText(q.source||q.citation||'');
else if(source==='legacy'){
if(q.sourceRefs&&q.sourceRefs.length)text=materialSourceText(q);
else text='旧版整合资料 PDF 第'+q.pdfPage+'页 · '+(q.originalNo||'');

}else text=sourceText(q.citation||q.source||'考试回忆');
var body=esc(text)+(source==='legacy'?'<br>对应课件：'+esc(sourceText(q.pptCitation||q.rainCitation||'')):'');
return '<div class="question-foot"><span>'+body+((q.reference||q.external)&&/^https?:\/\//i.test(q.reference||q.external)?' <a class="source-ref" href="'+esc(q.reference||q.external)+'" target="_blank" rel="noopener">资料核对 ↗</a>':'')+'</span><a class="link" href="'+esc(href)+'">'+(c?'查看章节':'查看模块')+' →</a></div>';
}
function letters(indexes){return indexes.map(function(i){return String.fromCharCode(65+i);}).join('、');}
function choiceCard(q,source){
var key=CourseQuiz.key(source,q.id),m=quiz.resolve(key),a=quiz.attempt(key),right=CourseQuiz.answers(q),submitted=a.submitted;
var isMulti=q.questionType==='multiple'||right.length>1;
var label=source==='practice'?(q.kind||'考点自测'):source==='legacy'?(q.sourceKind==='xuexitong'?'学习通题目':q.sourceKind==='slides'?'课件病例':'资料题库'):'考试回忆';
var promptId='prompt-'+source+'-'+String(q.id).replace(/[^\w-]/g,'_');
var options=q.options.map(function(o,i){
var picked=a.selected.indexOf(i)>=0,good=submitted&&right.indexOf(i)>=0,bad=submitted&&picked&&!good;
var classes='choice'+(picked?' selected':'')+(good?' correct':'')+(bad?' wrong':'');
var mark=submitted?(good?'<small class="choice-mark">✓ 正确选项</small>':bad?'<small class="choice-mark">✕ 你选的</small>':''):'';
return '<button type="button" class="'+classes+'" data-choice="'+i+'" aria-pressed="'+picked+'"'+(submitted?' disabled':'')+'><b>'+String.fromCharCode(65+i)+'</b><span class="choice-copy">'+esc(o)+'</span>'+mark+'</button>';
}).join('');
var result='';
if(submitted){
var detail='';
if(!a.result.correct&&isMulti){if(a.result.extra.length)detail+='错选：'+letters(a.result.extra)+'。';if(a.result.missing.length)detail+='漏选：'+letters(a.result.missing)+'。';}
result='<div class="quiz-feedback '+(a.result.correct?'is-correct':'is-wrong')+'" role="status" tabindex="-1" data-quiz-feedback><strong>'+(a.result.correct?'✓ 答对了':'✕ 答错了')+'</strong><p>你的答案：'+letters(a.selected)+' · 正确答案：'+letters(right)+'</p>'+(detail?'<p>'+detail+'</p>':'')+'<div class="quiz-analysis"><b>解析</b><p>'+esc(quiz.explanation(m)).replace(/\n/g,'<br>')+'</p></div>'+(!a.result.correct?'<p class="save-hint">已加入错题本，可稍后重新作答。</p>':'')+(quiz.storageError()?'<p class="storage-error">'+esc(quiz.storageError())+'</p>':'')+'</div>';
}
return '<article class="question choice-card" data-quiz-key="'+esc(key)+'"><div class="question-top"><span class="type">'+esc(label)+' · '+(isMulti?'多选题':'单选题')+'</span><span class="qid">'+esc(q.id)+'</span></div>'+(q.progress?'<span class="question-progress">'+esc(q.progress)+'</span>':'')+'<h3 id="'+promptId+'">'+esc(q.prompt||q.stem)+'</h3><p class="quiz-instruction">'+(isMulti?'可选多个选项，全部选对才算正确。':'选择一个选项。')+'选好后点击“提交答案”。</p><div class="choices" role="group" aria-labelledby="'+promptId+'">'+options+'</div><div class="quiz-actions">'+(submitted?'<button type="button" class="tiny-btn" data-retry-choice="'+esc(key)+'">重新作答</button>':'<button type="button" class="tiny-btn primary" data-submit-choice="'+esc(key)+'"'+(!a.selected.length?' disabled':'')+'>提交答案</button>')+'<span class="selection-hint" aria-live="polite">'+(submitted?'本次作答已提交':a.selected.length?'已选 '+letters(a.selected)+'，尚未提交':'尚未选择')+'</span></div>'+result+quizFooter(q,source)+'</article>';
}
function manualSaveButton(q,source){var key=CourseQuiz.key(source,q.id),saved=!!quiz.getEntry(key);return '<button type="button" class="tiny-btn" data-save-mistake="'+esc(key)+'"'+(saved?' disabled':'')+'>'+(saved?'已在错题本':'加入错题本')+'</button>';}
function practiceCard(q){return CourseQuiz.answers(q)?choiceCard(q,'practice'):manualCard(q,'practice');}
function manualCard(q,source){
var title=q.prompt||q.stem||'',key=CourseQuiz.key(source,q.id),label=source==='legacy'?(q.sourceKind==='xuexitong'?'学习通题目':q.sourceKind==='slides'?'课件病例':'资料题库'):source==='recall'?'考试回忆':'考点自测';
var answer=q.answer||q.note||'原资料未提供可确认的答案。';
var options=q.options?'<div class="legacy-options">'+q.options.map(function(o,i){return '<div class="legacy-option"><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(o)+'</span></div>';}).join('')+'</div>':'';
var extra=(q.image?'<a href="./assets/'+encodeURIComponent(q.image)+'" target="_blank" rel="noopener">查看回忆原图 ↗</a>':'');
return '<article class="question '+(source==='recall'?'recall-card':'legacy-card')+'" data-quiz-key="'+esc(key)+'"><div class="question-top"><span class="type">'+label+' · '+questionTypeName(q.questionType||'single')+'</span><span class="qid">'+esc(q.id)+'</span></div>'+(q.progress?'<span class="question-progress">'+esc(q.progress)+'</span>':'')+'<h3>'+esc(title)+'</h3>'+options+'<div class="quiz-actions"><button type="button" class="tiny-btn primary" data-reveal-manual>查看'+(q.answer?'参考答案':'核对状态')+'</button>'+manualSaveButton(q,source)+'</div><div class="recall-answer" hidden><strong>'+esc(q.answerLabel||(source==='legacy'?'课件核对后的参考答案':'参考答案'))+'</strong><p>'+esc(answer).replace(/\n/g,'<br>')+'</p>'+(q.answer&&q.note?'<p class="answer-note">'+esc(q.note)+'</p>':'')+extra+'</div>'+quizFooter(q,source)+'</article>';
}
function recallCard(q){return CourseQuiz.answers(q)?choiceCard(q,'recall'):manualCard(q,'recall');}
function legacyCard(q){return CourseQuiz.answers(q)?choiceCard(q,'legacy'):manualCard(q,'legacy');}
function mistakeStatusOptions(){return '<select class="filter-select" data-filter="mistakeStatus" aria-label="错题复习状态">'+[['pending','待复习'],['mastered','已掌握'],['all','全部状态']].map(function(x){return '<option value="'+x[0]+'"'+selected(x[0],state.mistakeStatus)+'>'+x[1]+'</option>';}).join('')+'</select>';}
function studyDay(iso){var d=new Date(iso);return isNaN(d.getTime())?'':d.toLocaleDateString('zh-CN');}
function mistakesPage(){
var all=quiz.entries(),pending=all.filter(function(x){return x.status==='pending';}).length;
var list=all.filter(function(x){var m=quiz.resolve(x.key),q=m.q;if(state.mistakeModule!=='all'&&(q.module||'immunology')!==state.mistakeModule)return false;if(state.mistakeType!=='all'&&(q.questionType||'single')!==state.mistakeType)return false;return state.mistakeStatus==='all'||x.status===state.mistakeStatus;});
var head='<div class="page-head"><div><div class="eyebrow">REVIEW NOTEBOOK</div><h1>错题本</h1><p>答错的选择题自动收录，也可手动收录回忆题与主观题。</p></div><a class="btn btn-soft" href="#bank">返回题库 →</a></div>';
var stats='<div class="notebook-summary"><div><strong>'+pending+'</strong><span>待复习</span></div><div><strong>'+(all.length-pending)+'</strong><span>已掌握</span></div><div><strong>'+all.length+'</strong><span>收录总数</span></div></div><p class="notebook-note">记录保存在当前浏览器，换设备不会自动同步。复习答对后，可自行标记“已掌握”。</p>';
var filter='<div class="filters"><select class="filter-select" data-filter="mistakeModule" aria-label="错题所属模块"><option value="all">全部模块</option>'+data.modules.map(function(m){return '<option value="'+m.id+'"'+selected(m.id,state.mistakeModule)+'>'+esc(m.name)+'</option>';}).join('')+'</select><select class="filter-select" data-filter="mistakeType" aria-label="错题题型"><option value="all">全部题型</option>'+['single','multiple','term','short','case'].map(function(t){return '<option value="'+t+'"'+selected(t,state.mistakeType)+'>'+questionTypeName(t)+'</option>';}).join('')+'</select>'+mistakeStatusOptions()+'<span class="count">本次筛选 '+list.length+' 题</span></div>';
var cards=list.map(function(x){var m=quiz.resolve(x.key),day=studyDay(x.lastWrongAt||x.createdAt||'');return '<section class="notebook-item"><div class="notebook-meta"><span class="notebook-state '+x.status+'">'+(x.status==='mastered'?'已掌握':'待复习')+'</span><span>'+(x.wrongCount?'答错 '+x.wrongCount+' 次':'手动收录')+(day?' · '+esc(day):'')+'</span></div>'+(m.orphan?'<p class="notebook-note">当前题库已找不到此题，以下保留的是历史题目。</p>':m.changed?'<p class="notebook-note">题目内容已有更新，请按当前版本重新复习。</p>':'')+(CourseQuiz.answers(m.q)?choiceCard(m.q,m.source):manualCard(m.q,m.source))+'<div class="notebook-tools"><button type="button" class="tiny-btn" data-master-mistake="'+esc(x.key)+'">'+(x.status==='mastered'?'标记需再复习':'标记已掌握')+'</button><button type="button" class="tiny-btn remove-mistake" data-remove-mistake="'+esc(x.key)+'">移出错题本</button></div></section>';}).join('');
return head+stats+(quiz.storageError()?'<div class="subtle-alert" role="status">'+esc(quiz.storageError())+'</div>':'')+filter+'<div class="question-list">'+(list.length?cards:'<div class="empty notebook-empty">'+(!all.length?'这里还没有错题。去题库试做一题，提交后答错的题会自动记在这里。':'此筛选下没有题目，可以切换模块、题型或复习状态。')+'<br><a class="link" href="#bank">进入题库 →</a></div>')+'</div>';
}
function quizCardElement(key){return Array.from(app.querySelectorAll('[data-quiz-key]')).find(function(el){return el.dataset.quizKey===key;});}
function updateNotebookIndicators(){app.querySelectorAll('[data-notebook-count]').forEach(function(el){el.textContent=quiz.pendingCount();});}
function redrawChoice(key,focus){var el=quizCardElement(key),m=quiz.resolve(key);if(!el||!m)return;el.outerHTML=choiceCard(m.q,m.source);updateNotebookIndicators();var next=quizCardElement(key);if(next&&focus){var target=next.querySelector(focus);if(target)target.focus({preventScroll:true});}}
function handleQuizClick(e){
var choice=e.target.closest('[data-choice]');
if(choice){var card=choice.closest('[data-quiz-key]');if(!card)return true;var key=card.dataset.quizKey;if(!quiz.select(key,Number(choice.dataset.choice)))return true;var a=quiz.attempt(key);card.querySelectorAll('[data-choice]').forEach(function(b){var picked=a.selected.indexOf(Number(b.dataset.choice))>=0;b.classList.toggle('selected',picked);b.setAttribute('aria-pressed',String(picked));});var submit=card.querySelector('[data-submit-choice]');if(submit)submit.disabled=!a.selected.length;card.querySelector('.selection-hint').textContent=a.selected.length?'已选 '+letters(a.selected)+'，尚未提交':'尚未选择';return true;}
var submit=e.target.closest('[data-submit-choice]');if(submit){var key=submit.dataset.submitChoice;if(quiz.submit(key))redrawChoice(key,'[data-quiz-feedback]');return true;}
var retry=e.target.closest('[data-retry-choice]');if(retry){var key=retry.dataset.retryChoice;quiz.reset(key);redrawChoice(key,'[data-choice]');return true;}
var reveal=e.target.closest('[data-reveal-manual]');if(reveal){var box=reveal.closest('.question').querySelector('.recall-answer');box.hidden=!box.hidden;var q=quiz.resolve(reveal.closest('[data-quiz-key]').dataset.quizKey).q;reveal.textContent=box.hidden?'查看'+(q.answer?'参考答案':'核对状态'):'收起答案';return true;}
var save=e.target.closest('[data-save-mistake]');if(save){quiz.add(save.dataset.saveMistake);save.textContent='已在错题本';save.disabled=true;updateNotebookIndicators();if(quiz.storageError()){var note=document.createElement('p');note.className='storage-error';note.setAttribute('role','status');note.textContent=quiz.storageError();save.closest('.question').appendChild(note);}return true;}
var master=e.target.closest('[data-master-mistake]');if(master){quiz.mark(master.dataset.masterMistake);render(true);return true;}
var remove=e.target.closest('[data-remove-mistake]');if(remove){quiz.remove(remove.dataset.removeMistake);render(true);return true;}
return false;
}

function recitePage(){
var cards=data.recitation.filter(function(x){return (x.module||'immunology')===state.reciteModule&&(state.reciteChapter==='all'||x.chapter===state.reciteChapter);});
var n=cards.filter(function(x){return mastery.has(x.id);}).length;
var head='<div class="page-head"><div><div class="eyebrow">ACTIVE RECALL</div><h1>问答题背诵</h1><p>先想答案，再展开要点；每张卡片都能回到课件页码。</p></div></div>'+
'<div class="filters">'+moduleSelect('recite')+chapterSelect('recite')+'<span class="count">'+cards.length+' 张卡片</span></div>';
if(state.reciteModule!=='immunology'&&state.reciteModule!=='pathogenesis')return head+placeholderFor(module(state.reciteModule));
return head+'<div class="study-banner" style="margin:0 0 22px"><div style="width:100%"><strong>本次筛选：已掌握 '+n+' / '+cards.length+'</strong><div class="progress-bar"><span style="width:'+(cards.length?Math.round(n/cards.length*100):0)+'%"></span></div><span class="progress-copy">进度保存在当前浏览器中。换设备时需重新标记。</span></div></div>'+
'<div class="recite-grid">'+cards.map(function(c){return '<article class="flashcard'+(mastery.has(c.id)?' mastered':'')+'" data-card="'+c.id+'"><span class="label">'+esc(chapter(c.chapter).title)+' · '+(mastery.has(c.id)?'已掌握':'待背诵')+'</span><h3>'+esc(c.prompt)+'</h3><div class="answer" hidden>'+esc(c.answer)+'</div><div class="flash-foot"><button class="tiny-btn primary" data-reveal="'+c.id+'">显示答案</button><button class="tiny-btn" data-mastery="'+c.id+'">'+(mastery.has(c.id)?'标记需再背':'标记已掌握')+'</button><small>来源：'+esc(sourceText(c.source))+'</small></div></article>';}).join('')+'</div>';
}
function searchPage(query){
var term=(query||'').trim().toLowerCase();
var results=[];
if(term){
data.chapters.concat(data.pathogenesisChapters||[]).forEach(function(c){c.topics.forEach(function(t){if((c.title+' '+t.title+' '+t.body).toLowerCase().indexOf(term)>=0)results.push({type:'知识点 · '+c.title,title:t.title,body:clean(t.body),href:'#chapter/'+c.id});});});
data.recitation.forEach(function(c){if((c.prompt+' '+c.answer).toLowerCase().indexOf(term)>=0)results.push({type:'问答背诵 · '+chapter(c.chapter).title,title:c.prompt,body:c.answer,href:'#recite'});});
data.recall.forEach(function(q){if((q.stem+' '+q.citation+' '+(q.source||'')).toLowerCase().indexOf(term)>=0)results.push({type:'考试回忆 · '+(module(q.module||'immunology')||{}).name,title:q.stem,body:q.source||sourceText(q.citation),href:'#bank',bankModule:q.module||'immunology'});});
(data.legacy||[]).forEach(function(q){if((q.prompt+' '+q.answer+' '+(q.pptCitation||'')).toLowerCase().indexOf(term)>=0)results.push({type:'旧资料核对题 · '+questionTypeName(q.questionType),title:q.prompt,body:materialSourceText(q),href:'#bank',bankModule:q.module||'immunology',bankTab:'legacy'});});
if(window.IMMUNE_KNOWLEDGE){IMMUNE_KNOWLEDGE.molecules.forEach(function(m){if((m.name+' '+m.aliases.join(' ')+' '+m.function+' '+m.partner).toLowerCase().indexOf(term)>=0)results.push({type:'知识点梳理 · 分子作用',title:m.name,body:m.function,href:'#knowledge',knowledgeMolecule:m.id});});IMMUNE_KNOWLEDGE.cells.forEach(function(c){if((c.name+' '+c.phenotype+' '+c.intro).toLowerCase().indexOf(term)>=0)results.push({type:'知识点梳理 · 细胞分类',title:c.name,body:c.phenotype,href:'#knowledge',knowledgeCell:c.id});});}
}
return '<div class="page-head"><div><div class="eyebrow">SEARCH</div><h1>搜索结果</h1><p>关键词：'+esc(query||'（空）')+' · 共 '+results.length+' 条</p></div></div>'+
(results.length?'<div class="search-results">'+results.slice(0,80).map(function(x){return '<a class="search-result" href="'+x.href+'"'+(x.knowledgeMolecule?' data-knowledge-molecule="'+esc(x.knowledgeMolecule)+'"':x.knowledgeCell?' data-knowledge-cell="'+esc(x.knowledgeCell)+'"':'')+(x.bankModule?' data-bank-module="'+x.bankModule+'" data-bank-tab="'+(x.bankTab||'recall')+'"':'')+'><small>'+esc(x.type)+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.body.length>160?x.body.slice(0,160)+'…':x.body)+'</p></a>';}).join('')+'</div>':'<div class="empty">没有找到相关条目。可以换一个关键词，或从模块目录进入。</div>');
}
function notFound(){return '<div class="placeholder"><div class="big">页面未找到</div><p>这个入口可能尚未建立。</p><a class="link" href="#home">返回首页 →</a></div>';}
function page(r){
if(r.path==='home')return home();
if(r.path==='map')return mapPage();
if(r.path==='knowledge')return window.CourseKnowledge?CourseKnowledge.render(state,data):'<div class="empty">知识点梳理资料暂未载入。</div>';
if(r.path==='bank')return bankPage();
if(r.path==='mistakes')return mistakesPage();
if(r.path==='recite')return recitePage();
if(r.path==='ppt')return pptPage();
if(r.path==='search')return searchPage(r.query.get('q'));
if(r.path.indexOf('module/')===0)return modulePage(r.path.split('/')[1]);
if(r.path.indexOf('chapter/')===0)return chapterPage(r.path.split('/')[1]);
return notFound();
}
function render(preserve){
if(!data)return;
var y=preserve?window.scrollY:0;
var r=route();
if(r.path==='mistakes'&&previousRoute!=='mistakes')quiz.entries().forEach(function(x){quiz.reset(x.key);});
previousRoute=r.path;
app.innerHTML=shell(page(r),r);
document.title=(r.path==='home'?'疾病的生物学基础':(r.path.split('/')[0]==='chapter'?(chapter(r.path.split('/')[1])||{}).title:'疾病的生物学基础'))+' · 班级学习站';
if(preserve)window.scrollTo(0,y);else window.scrollTo(0,0);
if(r.path.indexOf('chapter/')===0){var anchor=r.path.split('/')[2];if(anchor){var el=document.getElementById(anchor);if(el)el.scrollIntoView();}}
}
window.addEventListener('hashchange',function(){render(false);});
app.addEventListener('click',function(e){
var menu=e.target.closest('#menuBtn');if(menu){document.getElementById('side').classList.toggle('open');document.getElementById('overlay').classList.toggle('show');return;}
if(e.target.closest('#overlay')){document.getElementById('side').classList.remove('open');document.getElementById('overlay').classList.remove('show');return;}
var nav=e.target.closest('.side a');if(nav){document.getElementById('side').classList.remove('open');document.getElementById('overlay').classList.remove('show');}
var openModule=e.target.closest('[data-open-module]');if(openModule){e.preventDefault();state[openModule.dataset.openModule+'Module']=openModule.dataset.openValue;if(openModule.dataset.openModule==='recite')state.reciteChapter=openModule.dataset.openChapter||'all';go('#'+openModule.dataset.openModule);return;}
var bankLink=e.target.closest('[data-bank-module]');if(bankLink){e.preventDefault();state.bankModule=bankLink.dataset.bankModule;state.bankChapter=bankLink.dataset.bankChapter||'all';state.bankType='all';state.bankTopic=bankLink.dataset.bankTopic||'all';state.bankSource='all';state.bankPageIndex=1;state.bankTab=bankLink.dataset.bankTab||'recall';if(location.hash==='#bank')render(false);else go('#bank');return;}
var pageButton=e.target.closest('[data-bank-page]');if(pageButton&&!pageButton.disabled){state.bankPageIndex=Number(pageButton.dataset.bankPage);render(false);return;}
var tab=e.target.closest('[data-tab]');if(tab){state.bankTab=tab.dataset.tab;state.bankType='all';state.bankChapter='all';state.bankPageIndex=1;state.bankSource='all';render(true);return;}
if(window.CourseKnowledge){var knowledgeAction=CourseKnowledge.click(e,state);if(knowledgeAction.handled){e.preventDefault();if(route().path==='knowledge')render(knowledgeAction.preserve);else go('#knowledge');return;}}
if(handleQuizClick(e))return;
var reveal=e.target.closest('[data-reveal]');if(reveal){var card=reveal.closest('.flashcard');var answer=card.querySelector('.answer');answer.hidden=!answer.hidden;reveal.textContent=answer.hidden?'显示答案':'收起答案';return;}
var mark=e.target.closest('[data-mastery]');if(mark){var id=mark.dataset.mastery;if(mastery.has(id))mastery.delete(id);else mastery.add(id);try{localStorage.setItem('disease-biology-mastery-v1',JSON.stringify(Array.from(mastery)));}catch(err){}render(true);return;}
});
app.addEventListener('change',function(e){
if(window.CourseKnowledge&&CourseKnowledge.change(e,state)){render(true);return;}
var f=e.target.dataset.filter;if(!f)return;
state[f]=e.target.value;if(f.indexOf('bank')===0)state.bankPageIndex=1;
if(f==='bankModule'){state.bankChapter='all';state.bankType='all';state.bankTopic='all';state.bankSource='all';}
if(f==='reciteModule')state.reciteChapter='all';
render(true);
});
app.addEventListener('submit',function(e){if(window.CourseKnowledge&&CourseKnowledge.submit(e,state)){render(true);return;}if(e.target.id==='globalSearch'){e.preventDefault();var q=e.target.elements.q.value.trim();go('#search?q='+encodeURIComponent(q));}});
function initCourse(d){data=d;var store=null;try{store=window.localStorage;}catch(e){}quiz=CourseQuiz.create(data,{storage:store});render(false);}
window.addEventListener('storage',function(e){if(quiz&&e.key===CourseQuiz.storageKey){quiz.reload();if(route().path==='mistakes')render(true);else updateNotebookIndicators();}});
if(window.COURSE_DATA){initCourse(window.COURSE_DATA);}else fetch('./content.json').then(function(r){if(!r.ok)throw new Error('内容文件读取失败');return r.json();}).then(function(d){initCourse(d);}).catch(function(err){app.innerHTML='<div class="boot"><div class="boot-mark">!</div><p>课程资料暂时无法载入，请刷新页面。</p><small>'+esc(err.message)+'</small></div>';});
})();




