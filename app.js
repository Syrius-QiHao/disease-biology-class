(function(){
'use strict';
var data=null;
var pptFiles=window.PPT_FILES||[];
var state={bankTab:'practice',bankChapter:'all',reciteChapter:'all',mapModule:'immunology',bankModule:'immunology',reciteModule:'immunology',pptModule:'immunology'};
var mastery=new Set();
try{mastery=new Set(JSON.parse(localStorage.getItem('disease-biology-mastery-v1')||'[]'));}catch(e){}
var app=document.getElementById('app');
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clean(v){return String(v||'').replace(/\*\*/g,'');}
function icon(name){
var paths={
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
function chapter(id){return data.chapters.find(function(c){return c.id===id;});}
function module(id){return data.modules.find(function(m){return m.id===id;});}
function sourceText(cit){return String(cit||'').replace(/S\d{2}/g,function(id){return data.files[id]||id;});}
function sourceChip(cit){return '<div class="citation"><span>来源 · </span>'+esc(sourceText(cit))+'</div>';}
function statusClass(s){return s==='已整理'?'ready':s==='学习中'?'current':'';}
function selected(v,target){return v===target?' selected':'';}
function navItem(href,name,label,active){return '<a class="nav-item'+(active?' active':'')+'" href="#'+href+'">'+icon(name)+'<span>'+label+'</span></a>';}
function shell(content,r){
var key=r.path.split('/')[0];
var crumbs={home:'课程首页',map:'思维导图',bank:'题库',recite:'问答背诵',ppt:'课件 PPT',module:'课程模块',chapter:'章节学习',search:'搜索结果'};
var crumb=crumbs[key]||'课程首页';
if(key==='module'){var m=module(r.path.split('/')[1]);if(m)crumb=m.name;}
if(key==='chapter'){var c=chapter(r.path.split('/')[1]);if(c)crumb=c.title;}
return '<div class="layout">'+
'<div class="overlay" id="overlay"></div><aside class="side" id="side">'+
'<a class="brand" href="#home"><span class="brand-symbol">生</span><span class="brand-text"><strong>疾病的生物学基础</strong><small>CLASS STUDY ATLAS</small></span></a>'+
'<div class="nav-label">学习空间</div>'+
navItem('home','home','课程首页',key==='home')+
navItem('map','map','思维导图',key==='map')+
navItem('bank','bank','题库',key==='bank')+
navItem('recite','recite','问答背诵',key==='recite')+
navItem('ppt','slides','课件 PPT',key==='ppt')+
'<div class="nav-label">课程模块</div>'+
navItem('module/immunology','layers','免疫学',r.path==='module/immunology'||key==='chapter')+
navItem('module/pathogenesis','layers','发病学',r.path==='module/pathogenesis')+
navItem('module/parasitology','layers','寄生虫学',r.path==='module/parasitology')+
'<div class="side-footer"><strong>资料持续整理中</strong>课件页码按幻灯片顺序记录。考试回忆资料仅供复习定位。</div></aside>'+
'<div class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:10px;min-width:0"><button class="mobile-menu" aria-label="打开菜单" id="menuBtn">'+icon('menu')+'</button><div class="crumb">疾病的生物学基础 / <strong>'+esc(crumb)+'</strong></div></div>'+
'<div class="top-actions"><form class="search-form" id="globalSearch">'+icon('search')+'<input aria-label="搜索知识点" name="q" placeholder="搜索知识点、题目..." autocomplete="off"></form><div class="avatar" title="班级学习站">学</div></div></header>'+
'<main class="container">'+content+'<footer class="site-footer">《疾病的生物学基础》班级学习站 · 资料依课件整理，页码指幻灯片顺序。考试回忆并非正式试卷。<br>当前版本重点整理免疫学，其余模块会随学习进度补充。</footer></main></div></div>';
}
function home(){
var cards=[
{href:'map',icon:'☷',title:'思维导图',desc:'从整门课进入，沿着章节与机制线索梳理知识。'},
{href:'bank',icon:'▤',title:'题库',desc:'课件自测与考试回忆分开查看，按模块定位考点。'},
{href:'recite',icon:'▣',title:'问答题背诵',desc:'遮住答案先回忆，再按来源页码查缺补漏。'},
{href:'ppt',icon:'▧',title:'课件 PPT',desc:'按授课顺序找到原始课件，下载后查看。'}
];
return '<section class="hero"><div class="hero-copy"><div class="eyebrow">DISEASE BIOLOGY · COURSE ATLAS</div><h1>疾病的生物学基础</h1><p>免疫学已经按课件顺序整理。你可以从学科模块进入，也可以直接打开思维导图、题库或问答背诵。</p><div class="hero-actions"><a class="btn btn-primary" href="#map">打开思维导图 <span>↗</span></a><a class="btn btn-secondary" href="#module/immunology">开始学免疫</a></div></div><div class="hero-art"><div class="orbit"><div class="orbit-core">疾病的<br>生物学基础</div><span class="orbit-node a">知识结构</span><span class="orbit-node b">考点定位</span><span class="orbit-node c">机制串联</span></div><div class="hero-small">LEARN · CONNECT · RECALL</div></div></section>'+
'<div class="stats"><div class="stat"><div class="stat-icon">◈</div><div><strong>8</strong><span>课程模块</span></div></div><div class="stat"><div class="stat-icon">▤</div><div><strong>15</strong><span>免疫学章节</span></div></div><div class="stat"><div class="stat-icon">◇</div><div><strong>'+data.recall.length+'</strong><span>考试回忆条目</span></div></div></div>'+
'<div class="section-heading"><div><div class="eyebrow">CHOOSE YOUR PATH</div><h2>从这里开始</h2><p>三种入口，内容始终按学科和章节归类。</p></div></div>'+
'<div class="gateway-grid">'+cards.map(function(c){return '<a class="gateway" href="#'+c.href+'"><span class="gate-icon">'+c.icon+'</span><span class="arrow">↗</span><h3>'+c.title+'</h3><p>'+c.desc+'</p></a>';}).join('')+'</div>'+
'<div class="section-heading" id="modules"><div><div class="eyebrow">COURSE MODULES</div><h2>课程模块</h2><p>先把已学内容整理清楚，其余内容随着课程推进补充。</p></div><span class="link">共 8 个模块</span></div>'+
'<div class="module-grid">'+data.modules.map(function(m,i){return '<a class="module-card'+(i===0?' featured':'')+'" href="#module/'+m.id+'"><div class="mod-top"><span class="number">'+String(i+1).padStart(2,'0')+' / MODULE</span><span class="status '+statusClass(m.status)+'">'+m.status+'</span></div><h3>'+esc(m.name)+'</h3><p>'+esc(m.description)+'</p><div class="mod-foot">'+(i===0?'进入 15 章目录 →':i===1?'查看已讲主题 →':'查看模块 →')+'</div></a>';}).join('')+'</div>'+
'<div class="study-banner"><div><strong>发病学目前学到哪里？</strong><p>已讲：应激、休克、缺血、发热。相关资料尚待补充，模块内已标明当前进度。</p></div><a class="link" href="#module/pathogenesis">查看发病学 →</a></div>';
}
function modulePage(id){
var m=module(id);if(!m)return notFound();
if(id!=='immunology'){
var nRecall=data.recall.filter(function(q){return q.module===id;}).length;
var nPractice=data.practice.filter(function(q){return q.module===id;}).length;
return '<div class="page-head"><div><div class="eyebrow">COURSE MODULE</div><h1>'+esc(m.name)+'</h1><p>模块状态与已确认的学习进度</p></div><span class="status '+statusClass(m.status)+'">'+m.status+'</span></div>'+
'<div class="placeholder"><div class="eyebrow">'+(id==='pathogenesis'?'IN PROGRESS':'COMING SOON')+'</div><div class="big">'+(id==='pathogenesis'?'目前已讲四个主题':'未完待续')+'</div><p>'+esc(m.description)+' 回忆题已按学科先行归档，自测题依回忆考点新编；课程知识内容仍待课件补充。</p>'+(m.topics.length?'<div class="pill-row">'+m.topics.map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('')+'</div>':'')+'<a class="btn btn-soft" href="#bank" data-bank-module="'+id+'" data-bank-tab="recall">考试回忆 '+nRecall+' 条 · 自测 '+nPractice+' 题 →</a></div>';
}
return '<div class="module-hero"><div><div class="eyebrow">MODULE 01 · 已整理</div><h1>免疫学</h1><p>从抗原和抗体出发，连起补体、免疫细胞、抗原提呈、免疫应答以及耐受与超敏反应。内容逐条保留课件来源，便于回看原页。</p></div><div class="module-number">01</div></div>'+
'<div class="quick-links"><a href="#map">查看思维导图 ↗</a><a href="#bank" data-bank-module="immunology" data-bank-tab="practice">进入题库 ↗</a><a href="#recite">开始问答背诵 ↗</a><a href="#ppt">查看原始课件 ↗</a></div>'+
'<div class="section-heading"><div><div class="eyebrow">CHAPTERS</div><h2>按课件顺序学习</h2><p>15 个章节 · '+data.chapters.reduce(function(n,c){return n+c.topics.length;},0)+' 条来源清楚的知识梳理</p></div></div>'+
'<div class="chapter-grid">'+data.chapters.map(function(c){return '<a class="chapter-card" href="#chapter/'+c.id+'"><small>CHAPTER '+String(c.number).padStart(2,'0')+'</small><h3>'+esc(c.title)+'</h3><p>'+esc(clean(c.topics[0]?c.topics[0].body:''))+'</p><div class="foot">'+esc(c.filename)+' · '+c.topics.length+' 节</div></a>';}).join('')+'</div>';
}

function pptPage(){
var m=module(state.pptModule)||data.modules[0];
var head='<div class="page-head"><div><div class="eyebrow">COURSE SLIDES</div><h1>课件 PPT</h1><p>按学科和授课顺序查找课件，下载原文件后可用 PowerPoint 或兼容软件打开。</p></div>'+moduleSelect('ppt')+'</div>';
if(m.id!=='immunology')return head+'<div class="placeholder"><div class="eyebrow">'+esc(m.status)+'</div><div class="big">'+esc(m.name)+' · 课件待补</div><p>目前还没有收录该模块的 PPT。'+(m.id==='pathogenesis'?'已讲应激、休克、缺血、发热，等待相应课件。':'后续随授课进度补充。')+'</p><a class="link" href="#module/'+m.id+'">查看模块状态 →</a></div>';
return head+'<div class="subtle-alert">目前收录免疫学 '+pptFiles.length+' 份不同课件。APC 的同内容备份未重复列出；超敏反应两版课件均已保留。</div>'+
'<div class="ppt-grid">'+pptFiles.map(function(p,i){var c=chapter(p.chapter);return '<article class="ppt-card"><div class="ppt-card-top"><span class="ppt-index">'+String(i+1).padStart(2,'0')+' / '+String(pptFiles.length).padStart(2,'0')+'</span><span class="ppt-format">'+esc(p.name.split('.').pop().toUpperCase())+'</span></div><h2>'+esc(c?c.title:'补充课件')+(p.variant?' <small>'+esc(p.variant)+'</small>':'')+'</h2><p class="ppt-filename">'+esc(p.name)+'</p><div class="ppt-card-bottom"><span>'+esc(p.mb)+' MB · '+p.slideCount+' 页</span><div><a class="ppt-note" href="#chapter/'+p.chapter+'">查看笔记 ↗</a><a class="ppt-open" href="./ppt/'+encodeURIComponent(p.name)+'" download>下载原文件 ↓</a></div></div></article>';}).join('')+'</div>';
}

function mapPage(){
var m=module(state.mapModule)||data.modules[0];
var select='<select class="filter-select" data-filter="mapModule" aria-label="选择模块">'+data.modules.map(function(x){return '<option value="'+x.id+'"'+selected(x.id,state.mapModule)+'>'+esc(x.name)+' · '+x.status+'</option>';}).join('')+'</select>';
var head='<div class="page-head"><div><div class="eyebrow">VISUAL LEARNING</div><h1>思维导图</h1><p>先看整体，再沿分支进入章节；每个节点都可以打开对应内容。</p></div>'+select+'</div>';
if(m.id!=='immunology')return head+placeholderFor(m);
var groups=[{title:'基础与效应分子',desc:'从免疫概念到可参与效应的分子',ids:['S01','S02','S03','S04','S05']},{title:'细胞识别与提呈',desc:'谁识别抗原，信息如何传给 T/B 细胞',ids:['S06','S07','S08','S09','S10']},{title:'应答、调节与应用',desc:'怎样应答，何时造成疾病，如何检测',ids:['S11','S12','S13','S14','S15']}];
return head+'<div class="map-board"><div class="map-root">免疫学<br><small style="font-size:11px;color:#a8d0c8;font-weight:500">15 章知识主线</small></div><div class="map-clusters">'+groups.map(function(g){return '<div class="map-cluster"><h3>'+g.title+'</h3><p>'+g.desc+'</p>'+g.ids.map(function(id){var c=chapter(id);return '<a class="map-node" href="#chapter/'+id+'"><span>'+String(c.number).padStart(2,'0')+'</span>'+esc(c.title)+'</a>';}).join('')+'</div>';}).join('')+'</div></div>'+
'<div class="map-notes"><div class="note"><strong>主线 01 · 抗原怎样被识别？</strong><p>抗原表位 → MHC 呈递 → TCR/BCR 识别 → 双信号活化。点击相关章节查看每一步。</p></div><div class="note"><strong>主线 02 · 应答何时造成疾病？</strong><p>抗体、补体和 T 细胞执行效应，也可能形成超敏反应；免疫耐受负责约束自身反应。</p></div></div>';
}
function placeholderFor(m){return '<div class="placeholder"><div class="eyebrow">'+esc(m.status)+'</div><div class="big">'+esc(m.name)+' · '+(m.status==='学习中'?'资料待补':'未完待续')+'</div><p>'+esc(m.description)+'</p>'+(m.topics.length?'<div class="pill-row">'+m.topics.map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('')+'</div>':'')+'<a class="link" href="#module/'+m.id+'">查看模块状态 →</a></div>';}
function chapterPage(id){
var c=chapter(id);if(!c)return notFound();
var recalls=data.recall.filter(function(x){return x.citation.indexOf(id)>=0;});
var cards=data.recitation.filter(function(x){return x.chapter===id;});
return '<div class="page-head"><div><div class="eyebrow">IMMUNOLOGY / CHAPTER '+String(c.number).padStart(2,'0')+'</div><h1>'+esc(c.title)+'</h1><p>按课件知识层级整理 · 来源可追溯</p></div><a class="link" href="#module/immunology">← 返回免疫学目录</a></div>'+
'<div class="chapter-meta"><span class="meta-chip">'+esc(c.filename)+'</span><span class="meta-chip">'+c.topics.length+' 个知识小节</span><span class="meta-chip">'+recalls.length+' 条回忆考点</span></div>'+
'<div class="chapter-layout"><nav class="chapter-aside"><strong>本章目录</strong>'+c.topics.map(function(t,i){return '<a href="#chapter/'+id+'/'+id+'-'+(i+1)+'">'+String(i+1).padStart(2,'0')+' '+esc(t.title)+'</a>';}).join('')+'</nav><div>'+c.topics.map(function(t,i){return '<section class="topic-card" id="'+id+'-'+(i+1)+'"><small>SECTION '+String(i+1).padStart(2,'0')+'</small><h2>'+esc(t.title)+'</h2><p>'+esc(clean(t.body))+'</p>'+sourceChip(t.citation)+'</section>';}).join('')+
'<div class="related-box"><h3>继续练习这一章</h3><div class="related-links"><a href="#bank">题库 · '+recalls.length+' 条回忆考点</a><a href="#recite">问答背诵 · '+cards.length+' 张卡片</a><a href="#map">返回免疫学导图</a></div></div></div></div>';
}
function moduleSelect(kind){return '<select class="filter-select" data-filter="'+kind+'Module" aria-label="选择学科模块">'+data.modules.map(function(m){return '<option value="'+m.id+'"'+selected(m.id,state[kind+'Module'])+'>'+esc(m.name)+' · '+m.status+'</option>';}).join('')+'</select>';}
function chapterSelect(kind){return '<select class="filter-select" data-filter="'+kind+'Chapter" aria-label="选择章节"><option value="all">全部章节</option>'+data.chapters.map(function(c){return '<option value="'+c.id+'"'+selected(c.id,state[kind+'Chapter'])+'>'+String(c.number).padStart(2,'0')+' '+esc(c.title)+'</option>';}).join('')+'</select>';}
function bankPage(){
var isPractice=state.bankTab==='practice';
var m=module(state.bankModule)||data.modules[0];
var list=(isPractice?data.practice:data.recall).filter(function(q){
if((q.module||'immunology')!==m.id)return false;
return m.id!=='immunology'||state.bankChapter==='all'||(isPractice?q.chapter===state.bankChapter:(q.citation||'').indexOf(state.bankChapter)>=0);
});
var head='<div class="page-head"><div><div class="eyebrow">QUESTION LIBRARY</div><h1>题库</h1><p>按模块与章节查题。新编自测和考试回忆分开标注来源。</p></div></div>'+
'<div class="filters">'+moduleSelect('bank')+'<div class="tabs"><button class="tab'+(isPractice?' active':'')+'" data-tab="practice">考点自测</button><button class="tab'+(!isPractice?' active':'')+'" data-tab="recall">考试回忆</button></div>'+(m.id==='immunology'?chapterSelect('bank'):'')+'<span class="count">'+list.length+' 条</span></div>';
var intro=isPractice?(m.id==='immunology'
?'<div class="subtle-alert">免疫学自测依据课件编写，难度参照考试回忆题；不等同于历年考试原题。</div>'
:'<div class="subtle-alert">本模块自测依据回忆题的考点新编，属于练习题，尚未按相应课件逐页核对。模块学习状态仍以课程首页为准。</div>')
:'<div class="subtle-alert">此栏按用户提供的回忆图片整理。点击后查看原图中可辨认的答案；原图未给出的题干、选项或答案会明确标记，不作补写。</div>';
return head+intro+'<div class="question-list">'+(list.length?list.map(isPractice?practiceCard:recallCard).join(''):'<div class="empty">此模块暂没有该类题目。</div>')+'</div>';
}
function practiceCard(q){
var m=module(q.module||'immunology');
var href=q.chapter?'#chapter/'+q.chapter:'#module/'+m.id;
var link=q.chapter?'查看章节 →':'查看模块 →';
var ref=q.reference?'<a class="source-ref" href="'+esc(q.reference)+'" target="_blank" rel="noopener">资料核对 ↗</a>':'';
var progress=q.progress?'<span class="question-progress">'+esc(q.progress)+'</span>':'';
return '<article class="question" data-question="'+q.id+'"><div class="question-top"><span class="type">'+esc(q.kind||'考点自测')+' · 单选</span><span class="qid">'+esc(q.id)+'</span></div>'+progress+'<h3>'+esc(q.prompt)+'</h3><div class="choices">'+q.options.map(function(o,i){return '<button class="choice" data-choice="'+i+'" data-qid="'+q.id+'"><b>'+String.fromCharCode(65+i)+'</b>'+esc(o)+'</button>';}).join('')+'</div><div class="result" aria-live="polite"></div><div class="question-foot"><span>'+esc(q.source)+' '+ref+'</span><a class="link" href="'+href+'">'+link+'</a></div></article>';
}
function recallCard(q){
var isImmune=(q.module||'immunology')==='immunology';
var sid=isImmune?(q.citation.match(/S\d{2}/)||[])[0]:null;
var href=sid?'#chapter/'+sid:'#module/'+(q.module||'immunology');
var link=sid?'查看知识点 →':'查看模块 →';
var source=isImmune?'对应课件：'+sourceText(q.citation):'回忆来源：'+q.source;
var extra=q.external?'<a class="link" href="'+esc(q.external)+'" target="_blank" rel="noopener">补充核对 ↗</a>':'';
var answer=q.answer||q.note||'原资料未提供可确认的答案。';
var note=q.answer&&q.note?'<p class="answer-note">'+esc(q.note)+'</p>':'';
var progress=q.progress?'<span class="question-progress">'+esc(q.progress)+'</span>':'';
return '<article class="question recall-card"><div class="question-top"><span class="type">考试回忆 · 先答后看</span><span class="qid">'+esc(q.id)+'</span></div>'+progress+'<h3>'+esc(q.stem)+'</h3><button class="tiny-btn primary recall-reveal" data-reveal-recall>'+(q.answer?'查看参考答案':'查看核对状态')+'</button><div class="recall-answer" hidden><strong>'+esc(q.answerLabel||'参考答案')+'</strong><p>'+esc(answer).replace(/\n/g,'<br>')+'</p>'+note+'<a href="./assets/'+encodeURIComponent(q.image)+'" target="_blank" rel="noopener">查看回忆原图 ↗</a> '+extra+'</div><div class="question-foot"><span>'+esc(source)+'</span><a class="link" href="'+href+'">'+link+'</a></div></article>';
}
function recitePage(){
var cards=data.recitation.filter(function(x){return state.reciteChapter==='all'||x.chapter===state.reciteChapter;});
var n=cards.filter(function(x){return mastery.has(x.id);}).length;
var head='<div class="page-head"><div><div class="eyebrow">ACTIVE RECALL</div><h1>问答题背诵</h1><p>先想答案，再展开要点；每张卡片都能回到课件页码。</p></div></div>'+
'<div class="filters">'+moduleSelect('recite')+chapterSelect('recite')+'<span class="count">'+cards.length+' 张卡片</span></div>';
if(state.reciteModule!=='immunology')return head+placeholderFor(module(state.reciteModule));
return head+'<div class="study-banner" style="margin:0 0 22px"><div style="width:100%"><strong>本次筛选：已掌握 '+n+' / '+cards.length+'</strong><div class="progress-bar"><span style="width:'+(cards.length?Math.round(n/cards.length*100):0)+'%"></span></div><span class="progress-copy">进度保存在当前浏览器中。换设备时需重新标记。</span></div></div>'+
'<div class="recite-grid">'+cards.map(function(c){return '<article class="flashcard'+(mastery.has(c.id)?' mastered':'')+'" data-card="'+c.id+'"><span class="label">'+esc(chapter(c.chapter).title)+' · '+(mastery.has(c.id)?'已掌握':'待背诵')+'</span><h3>'+esc(c.prompt)+'</h3><div class="answer" hidden>'+esc(c.answer)+'</div><div class="flash-foot"><button class="tiny-btn primary" data-reveal="'+c.id+'">显示答案</button><button class="tiny-btn" data-mastery="'+c.id+'">'+(mastery.has(c.id)?'标记需再背':'标记已掌握')+'</button><small>来源：'+esc(c.source)+'</small></div></article>';}).join('')+'</div>';
}
function searchPage(query){
var term=(query||'').trim().toLowerCase();
var results=[];
if(term){
data.chapters.forEach(function(c){c.topics.forEach(function(t){if((c.title+' '+t.title+' '+t.body).toLowerCase().indexOf(term)>=0)results.push({type:'知识点 · '+c.title,title:t.title,body:clean(t.body),href:'#chapter/'+c.id});});});
data.recitation.forEach(function(c){if((c.prompt+' '+c.answer).toLowerCase().indexOf(term)>=0)results.push({type:'问答背诵 · '+chapter(c.chapter).title,title:c.prompt,body:c.answer,href:'#recite'});});
data.recall.forEach(function(q){if((q.stem+' '+q.citation+' '+(q.source||'')).toLowerCase().indexOf(term)>=0)results.push({type:'考试回忆 · '+(module(q.module||'immunology')||{}).name,title:q.stem,body:q.source||sourceText(q.citation),href:'#bank',bankModule:q.module||'immunology'});});
}
return '<div class="page-head"><div><div class="eyebrow">SEARCH</div><h1>搜索结果</h1><p>关键词：'+esc(query||'（空）')+' · 共 '+results.length+' 条</p></div></div>'+
(results.length?'<div class="search-results">'+results.slice(0,80).map(function(x){return '<a class="search-result" href="'+x.href+'"'+(x.bankModule?' data-bank-module="'+x.bankModule+'" data-bank-tab="recall"':'')+'><small>'+esc(x.type)+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.body.length>160?x.body.slice(0,160)+'…':x.body)+'</p></a>';}).join('')+'</div>':'<div class="empty">没有找到相关条目。可以换一个关键词，或从模块目录进入。</div>');
}
function notFound(){return '<div class="placeholder"><div class="big">页面未找到</div><p>这个入口可能尚未建立。</p><a class="link" href="#home">返回首页 →</a></div>';}
function page(r){
if(r.path==='home')return home();
if(r.path==='map')return mapPage();
if(r.path==='bank')return bankPage();
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
var bankLink=e.target.closest('[data-bank-module]');if(bankLink){e.preventDefault();state.bankModule=bankLink.dataset.bankModule;state.bankChapter='all';state.bankTab=bankLink.dataset.bankTab||'recall';if(location.hash==='#bank')render(false);else go('#bank');return;}
var tab=e.target.closest('[data-tab]');if(tab){state.bankTab=tab.dataset.tab;render(true);return;}
var choice=e.target.closest('[data-choice]');if(choice){
var q=data.practice.find(function(x){return x.id===choice.dataset.qid;});var card=choice.closest('.question');var index=Number(choice.dataset.choice);
card.querySelectorAll('.choice').forEach(function(b){b.disabled=true;if(Number(b.dataset.choice)===q.answer)b.classList.add('correct');});
if(index!==q.answer)choice.classList.add('wrong');
var result=card.querySelector('.result');result.className='result '+(index===q.answer?'good':'bad');result.textContent=index===q.answer?'答对了':'答案：'+String.fromCharCode(65+q.answer)+' · '+q.options[q.answer];
return;}
var recallReveal=e.target.closest('[data-reveal-recall]');if(recallReveal){var answer=recallReveal.closest('.recall-card').querySelector('.recall-answer');answer.hidden=!answer.hidden;recallReveal.textContent=answer.hidden?(recallReveal.closest('.recall-card').querySelector('.recall-answer strong').textContent==='原图待核对'?'查看核对状态':'查看参考答案'):'收起';return;}
var reveal=e.target.closest('[data-reveal]');if(reveal){var card=reveal.closest('.flashcard');var answer=card.querySelector('.answer');answer.hidden=!answer.hidden;reveal.textContent=answer.hidden?'显示答案':'收起答案';return;}
var mark=e.target.closest('[data-mastery]');if(mark){var id=mark.dataset.mastery;if(mastery.has(id))mastery.delete(id);else mastery.add(id);try{localStorage.setItem('disease-biology-mastery-v1',JSON.stringify(Array.from(mastery)));}catch(err){}render(true);return;}
});
app.addEventListener('change',function(e){
var f=e.target.dataset.filter;if(!f)return;
state[f]=e.target.value;
if(f==='bankModule'&&e.target.value!=='immunology')state.bankChapter='all';
if(f==='reciteModule'&&e.target.value!=='immunology')state.reciteChapter='all';
render(true);
});
app.addEventListener('submit',function(e){if(e.target.id==='globalSearch'){e.preventDefault();var q=e.target.elements.q.value.trim();go('#search?q='+encodeURIComponent(q));}});
if(window.COURSE_DATA){data=window.COURSE_DATA;render(false);}else fetch('./content.json').then(function(r){if(!r.ok)throw new Error('内容文件读取失败');return r.json();}).then(function(d){data=d;render(false);}).catch(function(err){app.innerHTML='<div class="boot"><div class="boot-mark">!</div><p>课程资料暂时无法载入，请刷新页面。</p><small>'+esc(err.message)+'</small></div>';});
})();


