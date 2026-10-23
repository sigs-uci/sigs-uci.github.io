export function setupGallery(root:HTMLElement){
  const links=Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-gallery-item]'));
  const dialog=root.querySelector<HTMLDialogElement>('dialog')!;
  const controls=Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'));
  const number=new Intl.NumberFormat(document.documentElement.lang,{useGrouping:false});
  let index=0;let origin:HTMLElement|null=null;
  const show=(n:number)=>{index=(n+links.length)%links.length;const link=links[index];const image=dialog.querySelector<HTMLImageElement>('[data-gallery-image]')!;image.src=link.href;image.alt=link.querySelector('img')?.alt??'';const caption=link.dataset.caption??'';const position=`${number.format(index+1)} / ${number.format(links.length)}`;dialog.querySelector('[data-gallery-caption]')!.textContent=caption;dialog.querySelector('[data-gallery-count]')!.textContent=position;dialog.querySelector('[data-gallery-status]')!.textContent=`${position}. ${caption}`;};
  dialog.querySelector('[data-gallery-close]')?.addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>show(index-1));
  dialog.querySelector('[data-gallery-next]')?.addEventListener('click',()=>show(index+1));
  dialog.addEventListener('keydown',event=>{
    const rtl=document.documentElement.dir==='rtl';
    if(event.key==='ArrowLeft'){event.preventDefault();show(index+(rtl?1:-1));}
    if(event.key==='ArrowRight'){event.preventDefault();show(index+(rtl?-1:1));}
    if(event.key==='Tab'){
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  dialog.addEventListener('close',()=>origin?.focus());
  return(link:HTMLAnchorElement)=>{origin=link;dialog.showModal();show(links.indexOf(link));};
}
