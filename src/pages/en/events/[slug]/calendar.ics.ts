import {events} from '../../../../data';
import {calendarDownload} from '../../../../lib/calendar';
import {isPublicEvent} from '../../../../lib/events';
export function getStaticPaths(){return events.filter(isPublicEvent).filter(event=>calendarDownload(event)).map(event=>({params:{slug:event.slug},props:{event}}));}
export function GET({props}:any){return new Response(calendarDownload(props.event),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="${props.event.slug}.ics"`}});}
