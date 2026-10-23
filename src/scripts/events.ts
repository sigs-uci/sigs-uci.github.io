import {campusDay,effectiveDay,filterEvents,normalizeSearch,occursInMonth,occursOnDay,type EventSearchRecord} from '../lib/events';
import {calendarMonth,normalizeCalendarMonth,shiftCalendarMonth} from '../lib/calendar-month';
const root=document.querySelector<HTMLElement>('[data-events]');
if(root){
  const form=root.querySelector<HTMLFormElement>('form')!;
  const rows=Array.from(root.querySelectorAll<HTMLElement>('[data-event-row]'));
  const models=rows.map(element=>{const data=element.dataset;return {element,id:data.id!,title:data.title!,summary:`${data.summary??''} ${data.categoryLabel??''}`,venue:data.venue||null,
    category:data.category as EventSearchRecord['category'],eventState:data.state as EventSearchRecord['eventState'],publication:'published' as const,
    editorial:{en:'edited' as const,fa:'not_translated' as const},date:{value:data.date||null,precision:'day' as const,contextYear:data.year?Number(data.year):null},
    startInstant:data.start||null,endInstant:data.end||null,timeZone:data.timeZone||null,allDay:data.allDayStart?{start:data.allDayStart,end:data.allDayEnd!}:null};});
  const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
  const locale=root.dataset.locale==='fa'?'fa-IR-u-ca-gregory':'en-US';
  const messages=JSON.parse(root.dataset.messages!);
  let view='list';let month=campusDay().slice(0,7);let matched:HTMLElement[]=[];let matchedModels:typeof models=[];
  const norm=normalizeSearch;
  const updateCalendar=()=>{
    const {year,month:m,firstWeekday,days}=calendarMonth(month);const first=new Date(Date.UTC(year,m-1,1));
    root.querySelector('[data-month-title]')!.textContent=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
    const body=root.querySelector('[data-calendar-body]')!;body.replaceChildren();
    const agenda=root.querySelector('[data-calendar-agenda]')!;agenda.replaceChildren();
    const inMonthModels=matchedModels.filter(record=>occursInMonth(record,month));
    const inMonth=inMonthModels.map(record=>record.element);
    for(let w=0;w<6;w++){const tr=document.createElement('tr');for(let d=0;d<7;d++){const n=w*7+d-firstWeekday+1;const td=document.createElement('td');if(n>0&&n<=days){const stamp=`${month}-${String(n).padStart(2,'0')}`;const label=document.createElement('span');label.textContent=new Intl.NumberFormat(locale).format(n);td.append(label);inMonthModels.filter(record=>occursOnDay(record,stamp)).forEach(record=>{const row=record.element;const a=document.createElement('a');a.href=row.dataset.url!;a.textContent=row.dataset.title!;a.lang=row.dataset.recordLocale??'en';a.title=a.textContent??'';td.append(a);});}tr.append(td);}body.append(tr);if((w+1)*7-firstWeekday>=days)break;}
    root.querySelector<HTMLButtonElement>('[data-month-prev]')!.disabled=shiftCalendarMonth(month,-1)===month;
    root.querySelector<HTMLButtonElement>('[data-month-next]')!.disabled=shiftCalendarMonth(month,1)===month;
    inMonth.forEach(row=>{const a=document.createElement('a');a.href=row.dataset.url!;const time=document.createElement('time');time.dateTime=row.dataset.date!;time.textContent=row.querySelector('time')!.textContent;const title=document.createElement('span');title.textContent=row.dataset.title!;title.lang=row.dataset.recordLocale??'en';a.append(time,title);if(root.dataset.locale==='fa'&&row.dataset.recordLocale==='en'){const language=document.createElement('small');language.textContent=` (${messages.english})`;a.append(language);}agenda.append(a);});
    if(!inMonth.length){const p=document.createElement('p');p.textContent=messages.monthEmpty;agenda.append(p);}
  };
  const sync=(push=false)=>{
    const period=field('period').value,year=field('year').value,category=field('category').value,q=norm(field('q').value);
    matchedModels=filterEvents(models,{period,year,category,query:q});matched=matchedModels.map(record=>record.element);
    rows.forEach(row=>row.hidden=!matched.includes(row));
    root.querySelectorAll<HTMLElement>('[data-event-year-group]').forEach(group=>{const count=Array.from(group.querySelectorAll<HTMLElement>('[data-event-row]')).filter(row=>!row.hidden).length;group.hidden=count===0;group.querySelector('[data-year-count]')!.textContent=`${new Intl.NumberFormat(locale).format(count)} ${count===1?messages.yearRecord:messages.yearRecords}`;});
    root.querySelectorAll<HTMLAnchorElement>('[data-period-link]').forEach(link=>{if(link.dataset.periodLink===period)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
    root.querySelector('[data-count]')!.textContent=`${new Intl.NumberFormat(locale).format(matched.length)} ${matched.length===1?messages.record:messages.records}${view==='calendar'?`, ${new Intl.NumberFormat(locale).format(matchedModels.filter(record=>occursInMonth(record,month)).length)} ${messages.inMonth}`:''}`;
    const empty=root.querySelector<HTMLElement>('[data-no-results]')!;empty.hidden=matched.length>0||view==='calendar';
    root.querySelector('[data-empty-title]')!.textContent=period==='upcoming'?messages.upcomingTitle:messages.emptyTitle;
    root.querySelector('[data-empty-copy]')!.textContent=period==='upcoming'?messages.upcomingCopy:messages.emptyCopy;
    root.querySelector<HTMLElement>('[data-event-list]')!.hidden=view!=='list';root.querySelector<HTMLElement>('[data-calendar]')!.hidden=view!=='calendar';
    root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
    updateCalendar();
    if(push){const url=new URL(location.href);url.search='';for(const name of ['period','year','category','q']){const value=field(name).value;if(value&&(name!=='period'||value!==root.dataset.defaultPeriod))url.searchParams.set(name,value);}if(view!=='list')url.searchParams.set('view',view);if(view==='calendar')url.searchParams.set('month',month);if(url.href!==location.href)history.pushState(null,'',url);}
  };
  const read=()=>{const p=new URLSearchParams(location.search);for(const name of ['period','year','category','q'])field(name).value=p.get(name)??(name==='period'?root.dataset.defaultPeriod!:'');if(!field('period').value)field('period').value=root.dataset.defaultPeriod!;view=p.get('view')==='calendar'?'calendar':'list';month=normalizeCalendarMonth(p.get('month'),campusDay().slice(0,7));sync();};
  form.addEventListener('submit',e=>{e.preventDefault();sync(true);});
  form.addEventListener('change',(event)=>{if(event.target===field('year')&&field('year').value)month=`${field('year').value}-01`;sync(true);});
  let timer:ReturnType<typeof setTimeout>;field('q').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>sync(true),250);});
  root.querySelectorAll<HTMLAnchorElement>('[data-event-shortcut]').forEach(link=>link.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();clearTimeout(timer);const url=new URL(link.href);if(url.href!==location.href)history.pushState(null,'',url);read();const results=root.querySelector<HTMLElement>('#event-results');results?.scrollIntoView({block:'start'});results?.focus({preventScroll:true});}));
  form.addEventListener('reset',()=>{setTimeout(()=>{field('period').value='all';view='list';sync(true);},0);});
  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view!;if(view==='calendar'&&matchedModels.length&&!matchedModels.some(record=>occursInMonth(record,month))){const day=matchedModels.map(effectiveDay).find(Boolean);if(day)month=day.slice(0,7);}sync(true);}));
  const shift=(delta:number)=>{month=shiftCalendarMonth(month,delta);sync(true);};
  root.querySelector('[data-month-prev]')!.addEventListener('click',()=>shift(-1));root.querySelector('[data-month-next]')!.addEventListener('click',()=>shift(1));
  window.addEventListener('popstate',read);root.querySelectorAll<HTMLElement>('[data-enhanced]').forEach(el=>el.hidden=false);read();
}
