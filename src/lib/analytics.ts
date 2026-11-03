export const analyticsHostname = 'sigs-uci.github.io';
export const cloudflareBeaconUrl = 'https://static.cloudflareinsights.com/beacon.min.js';

export function analyticsSiteId(value: unknown): string | null {
  return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value) ? value.toLowerCase() : null;
}

export function cloudflareAnalyticsBootstrap(value: unknown): string | null {
  const token = analyticsSiteId(value);
  if (!token) return null;
  return `(()=>{
    if(window.location.origin!==${JSON.stringify(`https://${analyticsHostname}`)}||document.querySelector("script[data-cf-beacon]"))return;
    const beacon=document.createElement("script");
    beacon.type="module";
    beacon.src=${JSON.stringify(cloudflareBeaconUrl)};
    beacon.setAttribute("data-cf-beacon",${JSON.stringify(JSON.stringify({ token }))});
    document.body.appendChild(beacon);
  })();`;
}
