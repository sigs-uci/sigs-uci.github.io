import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMediaRedirectMap,legacyMediaPageCount,mediaRedirectDestination,setupMediaRedirects,validateMediaRedirectAliases,
  type MediaRedirectAlias,type RedirectCollection,type RedirectMedia} from '../src/scripts/media-redirects';
import aliasData from '../src/data/mediaRedirects.json';
import {albumAtPath,albumPagePath,albumRoutePages,mediaCollections,publicMedia,mediaRedirectsForPage} from '../src/lib/media';
import {pages} from '../src/lib/routes';

function fixture() {
  const records: RedirectMedia[] = [
    ...Array.from({length:37},(_,index)=>({id:`photo-${index}`,kind:'photo',publication:'published',rights:'approved'})),
    {id:'clip',kind:'video',publication:'published',rights:'approved'},
    {id:'staying-photo',kind:'photo',publication:'published',rights:'approved'},
    {id:'draft-photo',kind:'photo',publication:'draft',rights:'approved'},
    {id:'withdrawn-photo',kind:'photo',publication:'published',rights:'pending'},
  ];
  const collections: RedirectCollection[] = [
    {id:'old-album',mediaIds:['staying-photo']},
    {id:'new-event',mediaIds:['draft-photo','withdrawn-photo','clip',...records.slice(0,37).map(record=>record.id)]},
  ];
  const aliases: MediaRedirectAlias[] = [
    {fromCollectionId:'old-album',fromPage:1,mediaId:'photo-36'},
    {fromCollectionId:'old-album',fromPage:2,mediaId:'clip'},
    {fromCollectionId:'old-album',fromPage:1,mediaId:'staying-photo'},
  ];
  return {records,collections,aliases};
}

test('old image links follow current approved photo pagination without counting videos or drafts',()=>{
  const {records,collections,aliases}=fixture();
  assert.deepEqual(buildMediaRedirectMap(aliases,collections,records,{collectionId:'old-album',page:1,locale:'en'}),{
    '#image-photo-36':'/en/community/memories/new-event/page/2/#image-photo-36',
  });
  assert.deepEqual(buildMediaRedirectMap(aliases,collections,records,{collectionId:'old-album',page:1,locale:'fa'}),{
    '#image-photo-36':'/fa/community/memories/new-event/page/2/#image-photo-36',
  });
  collections[1].mediaIds=collections[1].mediaIds.filter(id=>id!=='photo-0');
  assert.equal(buildMediaRedirectMap(aliases,collections,records,{collectionId:'old-album',page:1,locale:'en'})['#image-photo-36'],
    '/en/community/memories/new-event/#image-photo-36');
});

test('video aliases keep video hashes and appear only on their original album page',()=>{
  const {records,collections,aliases}=fixture();
  assert.deepEqual(buildMediaRedirectMap(aliases,collections,records,{collectionId:'old-album',page:2,locale:'fa'}),{
    '#clip':'/fa/community/memories/new-event/#clip',
  });
  assert.deepEqual(buildMediaRedirectMap(aliases,collections,records,{collectionId:'new-event',page:1,locale:'en'}),{});
  assert.deepEqual(buildMediaRedirectMap([],collections,records,{collectionId:'old-album',page:1,locale:'en'}),{});
});

test('alias validation rejects unsafe rows, missing targets, ambiguous albums and duplicate old hashes',()=>{
  const {records,collections,aliases}=fixture();
  assert.deepEqual(validateMediaRedirectAliases(aliases,collections,records),[]);
  for(const invalid of [null,{},
    [{fromCollectionId:'../old-album',fromPage:1,mediaId:'photo-0'}],
    [{fromCollectionId:'old-album',fromPage:0,mediaId:'photo-0'}],
    [{fromCollectionId:'old-album',fromPage:1.5,mediaId:'photo-0'}],
    [{fromCollectionId:'old-album',fromPage:Infinity,mediaId:'photo-0'}],
    [{fromCollectionId:'old-album',fromPage:1,mediaId:'../photo-0'}],
    [{fromCollectionId:'old-album',fromPage:1,mediaId:'photo-0',target:'https://example.com'}],
    [{fromCollectionId:'missing-album',fromPage:1,mediaId:'photo-0'}],
    [{fromCollectionId:'old-album',fromPage:1,mediaId:'missing-photo'}],
    [{fromCollectionId:'old-album',fromPage:1,mediaId:'draft-photo'}],
    [{fromCollectionId:'old-album',fromPage:1,mediaId:'withdrawn-photo'}],
    [aliases[0],aliases[0]],
  ])assert.ok(validateMediaRedirectAliases(invalid,collections,records).length>0,JSON.stringify(invalid));
  const ambiguous=[...collections,{id:'second-album',mediaIds:['photo-36']}];
  assert.ok(validateMediaRedirectAliases(aliases,ambiguous,records).some(error=>error.includes('one current public album')));
  assert.deepEqual(buildMediaRedirectMap(aliases,ambiguous,records,{collectionId:'old-album',page:1,locale:'en'}),{});
  const collisionRecords=[...records,{id:'image-photo-36',kind:'video',publication:'published',rights:'approved'}];
  const collisionCollections=[collections[0],{...collections[1],mediaIds:[...collections[1].mediaIds,'image-photo-36']}];
  assert.ok(validateMediaRedirectAliases([aliases[0],{fromCollectionId:'old-album',fromPage:1,mediaId:'image-photo-36'}],collisionCollections,collisionRecords)
    .some(error=>error.includes('hash must be unique')));
});

test('legacy page counts retain registered old pages without accepting malformed pages',()=>{
  const {aliases}=fixture();
  assert.equal(legacyMediaPageCount(aliases,'old-album'),2);
  assert.equal(legacyMediaPageCount(aliases,'new-event'),1);
  assert.equal(legacyMediaPageCount([...aliases,{fromCollectionId:'old-album',fromPage:NaN,mediaId:'clip'}],'old-album'),2);
  assert.equal(legacyMediaPageCount(null,'old-album'),1);
});

const oldPath='/en/community/memories/old-album/';
const target='/en/community/memories/new-event/page/2/#image-photo-36';
const locationFixture=()=>({origin:'https://sigs-uci.github.io',pathname:oldPath,hash:'#image-photo-36'});

test('known exact hashes resolve in the current language on production and local previews',()=>{
  assert.equal(mediaRedirectDestination(locationFixture(),{'#image-photo-36':target}),target);
  assert.equal(mediaRedirectDestination({...locationFixture(),origin:'http://127.0.0.1:4321'},{'#image-photo-36':target}),target);
  assert.equal(mediaRedirectDestination({...locationFixture(),hash:'#image-photo-%33%36'},{'#image-photo-36':target}),target);
  assert.equal(mediaRedirectDestination({...locationFixture(),pathname:'/fa/community/memories/old-album/',hash:'#clip'},
    {'#clip':'/fa/community/memories/new-event/#clip'}),'/fa/community/memories/new-event/#clip');
});

test('unknown or malformed hashes and unsafe, foreign-language or same-path targets are ignored',()=>{
  for(const hash of ['', '#unknown', '#image-clip', '#image-photo-36-extra', '#image-photo-%E0%A4%A', '#image-photo-%2533%2536']){
    assert.equal(mediaRedirectDestination({...locationFixture(),hash},{'#image-photo-36':target}),undefined,hash);
  }
  for(const invalid of ['https://example.com/en/community/memories/new-event/#image-photo-36',
    '//example.com/en/community/memories/new-event/#image-photo-36',
    '/fa/community/memories/new-event/#image-photo-36',
    '/en/events/new-event/#image-photo-36',
    '/en/community/memories/new-event/?track=1#image-photo-36',
    '/en/community/memories/new-event/#image-photo-0',
    '/en/community/memories/new-event/page/0/#image-photo-36',
    '/en/community/memories/new-event/page/1/#image-photo-36',
    '/en/community/memories/old-album/../new-event/#image-photo-36',
    oldPath+'#image-photo-36',null,42]){
    assert.equal(mediaRedirectDestination(locationFixture(),{'#image-photo-36':invalid}),undefined,String(invalid));
  }
  assert.equal(mediaRedirectDestination({...locationFixture(),pathname:'/en/events/'},{'#image-photo-36':target}),undefined);
  assert.equal(mediaRedirectDestination({...locationFixture(),origin:'null'},{'#image-photo-36':target}),undefined);
  assert.equal(mediaRedirectDestination(locationFixture(),Object.create({'#image-photo-36':target})),undefined);
});

function browserFixture(hash='#image-photo-36'){
  const listeners=new Map<string,Set<()=>void>>();
  const replaced:string[]=[];
  const browser={
    location:{...locationFixture(),hash,replace:(url:string)=>replaced.push(url)},
    addEventListener:(type:string,listener:()=>void)=>{
      if(!listeners.has(type))listeners.set(type,new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener:(type:string,listener:()=>void)=>listeners.get(type)?.delete(listener),
  };
  const dispatch=(type:string)=>listeners.get(type)?.forEach(listener=>listener());
  return {browser,replaced,dispatch};
}

test('the client replaces known initial links, handles hash history and avoids repeated replacements',()=>{
  const {browser,replaced,dispatch}=browserFixture();
  const cleanup=setupMediaRedirects({'#image-photo-36':target},browser);
  assert.deepEqual(replaced,[target]);
  dispatch('pageshow');
  dispatch('hashchange');
  assert.deepEqual(replaced,[target]);
  browser.location.hash='#photographs';
  dispatch('hashchange');
  browser.location.hash='#image-photo-36';
  dispatch('hashchange');
  assert.deepEqual(replaced,[target,target]);
  browser.location.pathname='/en/community/memories/new-event/page/2/';
  dispatch('pageshow');
  assert.equal(replaced.length,2);
  cleanup();
  browser.location.pathname=oldPath;
  dispatch('pageshow');
  dispatch('hashchange');
  assert.equal(replaced.length,2);
});

test('restoring an old video link follows the matching video without changing image hash conventions',()=>{
  const {browser,replaced,dispatch}=browserFixture('#unknown');
  setupMediaRedirects({'#clip':'/en/community/memories/new-event/#clip'},browser);
  assert.deepEqual(replaced,[]);
  browser.location.hash='#clip';
  dispatch('pageshow');
  assert.deepEqual(replaced,['/en/community/memories/new-event/#clip']);
});

test('configured aliases reference public media and keep their source routes available',()=>{
  assert.deepEqual(validateMediaRedirectAliases(aliasData,mediaCollections,publicMedia),[]);
  for(const alias of aliasData as MediaRedirectAlias[]){
    const source=mediaCollections.find(collection=>collection.id===alias.fromCollectionId)!;
    assert.ok(source);
    assert.ok(albumRoutePages(source)>=alias.fromPage);
    const path=albumPagePath(source,alias.fromPage);
    assert.ok(pages.some(page=>page.path===path));
    assert.deepEqual(albumAtPath(path),{collection:source,page:alias.fromPage});
    for(const locale of ['en','fa'] as const){
      const redirects=mediaRedirectsForPage(source,alias.fromPage,locale);
      const media=publicMedia.find(item=>item.id===alias.mediaId)!;
      const hash=`#${media.kind==='video'?'':'image-'}${media.id}`;
      const target=redirects[hash];
      if(target)assert.equal(mediaRedirectDestination({origin:'https://sigs-uci.github.io',pathname:`/${locale}/${path}/`,hash},redirects),target);
    }
  }
});
