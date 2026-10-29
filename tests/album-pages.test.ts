import assert from 'node:assert/strict';
import test from 'node:test';
import type {MediaRecord} from '../src/data';
import {albumPages,albumPhotos,albumPagePath,albumAtPath,mediaCollections,collectionItems,albumPageSize} from '../src/lib/media';
import {pages} from '../src/lib/routes';
import {availableLocales} from '../src/lib/publication';

test('album pagination retains every photo once and keeps videos out of image pages',()=>{
  const records=Array.from({length:albumPageSize*2+1},(_,index)=>({id:`photo-${index}`,kind:'photo'}) as MediaRecord);
  records.splice(5,0,{id:'video',kind:'video'} as MediaRecord);
  assert.equal(albumPages(mediaCollections[0],records),3);
  const chunks=[1,2,3].map(page=>albumPhotos(records,page));
  assert.deepEqual(chunks.map(chunk=>chunk.length),[albumPageSize,albumPageSize,1]);
  assert.deepEqual(chunks.flat().map(record=>record.id),records.filter(record=>record.kind!=='video').map(record=>record.id));
  for(const invalid of [0,-1,1.5,NaN,4])assert.deepEqual(albumPhotos(records,invalid),[]);
  assert.equal(albumPages(mediaCollections[0],[]),1);
});

test('every populated album page has matching routes in both languages',()=>{
  for(const collection of mediaCollections){
    const total=albumPages(collection);
    for(let page=1;page<=total;page++){
      const path=albumPagePath(collection,page);
      assert.ok(pages.some(route=>route.path===path),path);
      assert.deepEqual(albumAtPath(path),{collection,page});
      assert.deepEqual(availableLocales(path),['en','fa']);
      assert.ok(page===1||albumPhotos(collectionItems(collection),page).length>0,path);
    }
    assert.equal(albumAtPath(`${albumPagePath(collection)}/page/1`),undefined);
    assert.equal(albumAtPath(`${albumPagePath(collection)}/page/${total+1}`),undefined);
  }
});
