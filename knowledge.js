(function(root){
'use strict';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function dataset(){return root.IMMUNE_KNOWLEDGE||{molecules:[],cells:[],pairs:[],categories:[]};}
function molecule(id){return dataset().molecules.find(function(x){return x.id===id;});}
function cell(id){return dataset().cells.find(function(x){return x.id===id;});}
function init(state){
if(!state.knowledgeView)state.knowledgeView='cells';
if(!state.knowledgeCell)state.knowledgeCell='cd4';
if(!state.knowledgeCategory)state.knowledgeCategory='all';
if(typeof state.knowledgeSearch!=='string')state.knowledgeSearch='';
}
function refs(list,course,options){return (list||[]).map(function(r){var file=(course.files||{})[r.source]||r.source;return '<a class="kg-ref" href="'+esc((options.chapterBase||'')+'#chapter/'+r.source)+'" title="'+esc(file)+'">'+esc(file)+' · 第'+esc(r.pages.join('、'))+'页</a>';}).join('');}
function expand(c,seen){
if(!c)return [];seen=seen||[];if(seen.indexOf(c.id)>=0)return [];
var items=c.inherit?expand(cell(c.inherit),seen.concat(c.id)).slice():[];
(c.items||[]).forEach(function(it){var old=items.findIndex(function(x){return x.molecule===it.molecule;});if(old<0)items.push(it);else items[old]=it;});
return items.filter(function(it){return !(c.exclude||[]).includes(it.molecule);});
}
function associated(id){return dataset().cells.map(function(c){var it=expand(c).find(function(x){return x.molecule===id;});return it?{cell:c,item:it}:null;}).filter(Boolean);}
function matches(text,term){return !term||String(text).toLowerCase().replace(/\s/g,'').indexOf(term.toLowerCase().replace(/\s/g,''))>=0;}
function matchM(m,term){return matches([m.name,m.aliases.join(' '),m.distribution,m.partner,m.function,m.note].join(' '),term);}
function cellMatches(c,term){return !term||matches(c.name+' '+c.phenotype+' '+c.intro,term)||expand(c).some(function(it){var m=molecule(it.molecule);return m&&matchM(m,term);});}
function cellButton(c,active){var sub=['th1','th2','th17','treg','tfh'].includes(c.id);return '<button type="button" class="kg-cell-link'+(active?' active':'')+(sub?' is-sub':'')+'" data-knowledge-cell="'+esc(c.id)+'" aria-pressed="'+active+'">'+esc(c.name)+'</button>';}
function row(it,c,course,options){
var m=molecule(it.molecule);if(!m)return '';
return '<article class="kg-row"><div><button class="kg-molecule-link" type="button" data-knowledge-molecule="'+esc(m.id)+'">'+esc(m.name)+' <span aria-hidden="true">↗</span></button><span class="kg-location">'+esc(m.location)+'</span></div><div><p class="kg-row-function">'+esc(m.function)+'</p>'+(m.partner&&m.partner!=='—'?'<p class="kg-partner"><b>识别 / 配对：</b>'+esc(m.partner)+'</p>':'')+'<p class="kg-context">'+esc(it.note||m.note)+'</p><div class="kg-sources">'+refs(m.refs,course,options)+'</div></div></article>';
}
function cellView(state,course,options){
var term=state.knowledgeSearch.trim(),visible=dataset().cells.filter(function(c){return cellMatches(c,term);});
if(!visible.length)return '<div class="empty">没有找到相关细胞或分子，可试试CD3、CD40、IgE或“调理”。</div>';
var current=cell(state.knowledgeCell);if(!current||!visible.some(function(c){return c.id===current.id;}))current=visible[0];
var groups=Array.from(new Set(visible.map(function(c){return c.group;})));
var nav='<nav class="kg-cell-nav" aria-label="免疫细胞分类">'+groups.map(function(g){return '<div class="kg-nav-group"><strong>'+esc(g)+'</strong>'+visible.filter(function(c){return c.group===g;}).map(function(c){return cellButton(c,c.id===current.id);}).join('')+'</div>';}).join('')+'</nav>';
var items=expand(current),names=items.filter(function(it){return it.role==='表面识别';}).map(function(it){return molecule(it.molecule).name;});
var list=term&&!matches(current.name+' '+current.phenotype+' '+current.intro,term)?items.filter(function(it){return matchM(molecule(it.molecule),term);}):items;
var roles=Array.from(new Set(list.map(function(it){return it.role;})));
var intro='<section class="kg-cell-intro"><div class="eyebrow">'+esc(current.group)+'</div><h2>'+esc(current.name)+'</h2><div class="kg-phenotype"><span>典型组合 / 识别线索</span><strong>'+esc(current.phenotype)+'</strong></div><p>'+esc(current.intro)+'</p><div class="kg-sources">'+refs(current.refs,course,options)+'</div></section>';
var grouped=roles.map(function(role){var label=role==='表面识别'?'表面识别与相关受体':role;return '<section class="kg-role-section"><div class="kg-role-heading"><h3>'+esc(label)+'</h3><span>'+list.filter(function(it){return it.role===role;}).length+' 项</span></div>'+list.filter(function(it){return it.role===role;}).map(function(it){return row(it,current,course,options);}).join('')+'</section>';}).join('');
var quick='<details class="kg-fast-overview"><summary>展开细胞与分子速记总表</summary><div class="kg-fast-scroll"><table><thead><tr><th>细胞 / 亚群</th><th>典型组合或识别线索</th><th>课件来源</th></tr></thead><tbody>'+visible.map(function(c){return '<tr><td><button type="button" class="kg-molecule-link" data-knowledge-cell="'+esc(c.id)+'">'+esc(c.name)+'</button></td><td>'+esc(c.phenotype)+'</td><td>'+refs(c.refs,course,options)+'</td></tr>';}).join('')+'</tbody></table></div></details>';
return quick+'<div class="kg-cell-layout">'+nav+'<div class="kg-cell-content">'+intro+(term?'<p class="kg-filter-note">当前关键词：'+esc(term)+' · 显示 '+list.length+' 个相关条目</p>':'')+grouped+'<div class="kg-comparison-note">记忆时分开看：细胞表面有什么、活化后改变什么、分泌什么、接受什么信号。同一个分子可在多种细胞上出现。</div></div></div>';
}
function moleculeView(state,course,options){
var list=dataset().molecules.filter(function(m){return (state.knowledgeCategory==='all'||m.category===state.knowledgeCategory)&&matchM(m,state.knowledgeSearch);});
var categories='<select class="filter-select" data-knowledge-category aria-label="分子功能分类"><option value="all">全部功能类别</option>'+dataset().categories.map(function(c){return '<option value="'+esc(c.id)+'"'+(c.id===state.knowledgeCategory?' selected':'')+'>'+esc(c.name)+'</option>';}).join('')+'</select>';
var heading='<div class="kg-list-heading">'+categories+'<span>'+list.length+' 个分子 / 功能条目</span></div>';
var cards=list.map(function(m){var category=dataset().categories.find(function(c){return c.id===m.category;});var linked=associated(m.id);
return '<article class="kg-molecule-card"><div class="kg-card-top"><span>'+esc(category?category.name:'分子')+'</span><span>'+esc(m.location)+'</span></div><h2>'+esc(m.name)+'</h2>'+(m.aliases.length?'<p class="kg-alias">相关名称：'+esc(m.aliases.join('、'))+'</p>':'')+'<p class="kg-function">'+esc(m.function)+'</p><dl class="kg-facts"><div><dt>常见分布</dt><dd>'+esc(m.distribution)+'</dd></div>'+(m.partner!=='—'?'<div><dt>识别 / 配对</dt><dd>'+esc(m.partner)+'</dd></div>':'')+'</dl><p class="kg-context">'+esc(m.note)+'</p>'+(linked.length?'<div class="kg-related"><small>相关细胞与关系</small><div>'+linked.map(function(x){return '<button type="button" class="kg-tag" data-knowledge-cell="'+esc(x.cell.id)+'">'+esc(x.cell.name)+' · '+esc(x.item.role)+'</button>';}).join('')+'</div></div>':'')+'<div class="kg-sources">'+refs(m.refs,course,options)+'</div></article>';
}).join('');
return heading+(list.length?'<div class="kg-molecule-grid">'+cards+'</div>':'<div class="empty">此类别和关键词下没有结果。可清空关键词，或切换为全部功能类别。</div>');
}
function pairView(state,course,options){
var list=dataset().pairs.filter(function(p){var a=molecule(p.left),b=molecule(p.right);return matches(p.title+' '+p.summary+' '+a.name+' '+b.name,state.knowledgeSearch);});
return '<div class="kg-pair-grid">'+(list.length?list.map(function(p){var a=molecule(p.left),b=molecule(p.right);return '<article class="kg-pair-card"><h2>'+esc(p.title)+'</h2><div class="kg-pair-names"><button type="button" data-knowledge-molecule="'+esc(a.id)+'">'+esc(a.name)+'</button><span>与</span><button type="button" data-knowledge-molecule="'+esc(b.id)+'">'+esc(b.name)+'</button></div><p>'+esc(p.summary)+'</p><div class="kg-sources">'+refs(a.refs,course,options)+refs(b.refs,course,options)+'</div></article>';}).join(''):'<div class="empty">没有找到对应的配对或辨析条目。</div>')+'</div>';
}
function render(state,course,options){
init(state);options=options||{};
var data=dataset();
if(!data.cells.length)return '<div class="empty">知识点梳理资料暂未载入。</div>';
var tabs=[['cells','按细胞看'],['molecules','按分子查'],['pairs','配对与易混点']];
var top='<div class="page-head"><div><div class="eyebrow">IMMUNOLOGY · KNOWLEDGE ATLAS</div><h1>知识点梳理</h1><p>从细胞找到分子，从分子查作用；本期整理免疫学。</p></div><a class="link" href="'+esc((options.chapterBase||'')+'#module/immunology')+'">免疫学章节目录 →</a></div>';
var summary='<div class="kg-intro-banner"><div><strong>识别细胞，看组合；理解作用，看配对。</strong><p>CD4 T和CD8 T都表达CD3。共用分子、活化相关分子、胞内因子与分泌产物在下方分别列出。</p></div><div class="kg-counts"><span><b>'+data.cells.length+'</b>细胞分类</span><span><b>'+data.molecules.length+'</b>分子条目</span><span><b>'+data.pairs.length+'</b>配对辨析</span></div></div>';
var controls='<div class="kg-controls"><div class="tabs" aria-label="梳理方式">'+tabs.map(function(t){return '<button type="button" class="tab'+(state.knowledgeView===t[0]?' active':'')+'" data-knowledge-view="'+t[0]+'" aria-pressed="'+(state.knowledgeView===t[0])+'">'+t[1]+'</button>';}).join('')+'</div><form class="kg-search" id="knowledgeSearch"><input name="q" value="'+esc(state.knowledgeSearch)+'" placeholder="搜索CD3、IgE、吞噬或分子作用…" aria-label="搜索细胞、分子或作用"><button class="tiny-btn primary" type="submit">搜索</button>'+(state.knowledgeSearch?'<button class="tiny-btn" type="button" data-knowledge-clear>清空</button>':'')+'</form></div>';
var content=state.knowledgeView==='molecules'?moleculeView(state,course,options):state.knowledgeView==='pairs'?pairView(state,course,options):cellView(state,course,options);
return '<div class="knowledge-module">'+top+summary+controls+content+'<div class="kg-bottom-note">来源页码均指课件幻灯片顺序。分子清单用于课程复习；多数分子并非某一种细胞独有，应结合典型组合、发育阶段和活化状态理解。</div></div>';
}
function click(e,state){
init(state);var el=e.target.closest('[data-knowledge-view]');if(el){state.knowledgeView=el.dataset.knowledgeView;return {handled:true,preserve:true};}
el=e.target.closest('[data-knowledge-cell]');if(el){state.knowledgeCell=el.dataset.knowledgeCell;state.knowledgeView='cells';state.knowledgeSearch='';return {handled:true,preserve:false};}
el=e.target.closest('[data-knowledge-molecule]');if(el){var m=molecule(el.dataset.knowledgeMolecule);if(m){state.knowledgeView='molecules';state.knowledgeCategory='all';state.knowledgeSearch=m.name;}return {handled:true,preserve:false};}
el=e.target.closest('[data-knowledge-clear]');if(el){state.knowledgeSearch='';return {handled:true,preserve:true};}
return {handled:false};
}
function change(e,state){if(!e.target.hasAttribute('data-knowledge-category'))return false;state.knowledgeCategory=e.target.value;return true;}
function submit(e,state){if(e.target.id!=='knowledgeSearch')return false;e.preventDefault();state.knowledgeSearch=e.target.elements.q.value.trim();return true;}
root.CourseKnowledge={render:render,click:click,change:change,submit:submit};
})(window);
