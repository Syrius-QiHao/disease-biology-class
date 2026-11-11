(function(root){
'use strict';
function stem(q){return (q.module||'immunology')+':'+String(q.prompt||q.stem||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');}
function merge(data){
 var collection=root.COURSE_MATERIALS_DATA;if(!collection||!Array.isArray(collection.questions))return;
 var byId=Object.create(null);(data.legacy||[]).forEach(function(q){byId[q.id]=q;});
 collection.questions.concat(collection.historicalQuestions||[]).forEach(function(q){if(byId[q.id])Object.assign(byId[q.id],q);else{data.legacy.push(q);byId[q.id]=q;}});
 // Match stems across all material sources. Retain each selected version's own options and answer.
 var groups=Object.create(null),merged=[];
 (data.legacy||[]).forEach(function(q){if(q.archiveOnly||q.mergedInto)return;var key=stem(q),previous=groups[key];
  if(!previous){groups[key]=q;return;}
  var keep=previous,other=q;
  if(previous.requiresReview&&!q.requiresReview){keep=q;other=previous;groups[key]=q;}
  var refs=(keep.sourceRefs||[]).concat(other.sourceRefs||[]),seen=Object.create(null);
  keep.sourceRefs=refs.filter(function(ref){var signature=JSON.stringify(ref);if(seen[signature])return false;seen[signature]=true;return true;});
  other.archiveOnly=true;other.mergedInto=keep.id;merged.push({keptId:keep.id,mergedId:other.id});
 });
 data.materialMergeSummary={importedUnique:collection.total,additionalMerges:merged,visibleQuestions:data.legacy.filter(function(q){return !q.archiveOnly&&!q.mergedInto;}).length};
}
root.CourseMaterials={merge:merge};
})(window);
