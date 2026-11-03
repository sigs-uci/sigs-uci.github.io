# Website statistics

The site uses Cloudflare Web Analytics for page views and page performance. Read reports in the Cloudflare account that manages the site's analytics; this repository does not expose a dashboard or contain reporting credentials. Counts can be affected by blocked scripts and browser behavior. Treat them as traffic measurements, not a list of identified people. See [Cloudflare's overview](https://developers.cloudflare.com/web-analytics/about/) and [report dimensions](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/).

The approved public site ID is stored in `src/config/analytics.ts`. It belongs to the installation snippet for `sigs-uci.github.io` and is meant to appear in browser HTML. It is not an API token. Do not put account credentials, API tokens or private dashboard links in that file.

The shared layout loads the official module beacon only on the exact production origin `https://sigs-uci.github.io`. Localhost, custom ports, other hostnames and local file previews do not load it. A duplicate beacon is not added to the same page. Both language versions use the same site ID; filter by page path in Cloudflare to distinguish their traffic.

To stop collection, set the site ID to `null`, validate, rebuild and release the change. Missing or invalid IDs emit no analytics loader and restore the no-analytics privacy text in both languages. An enabled site ID selects the matching aggregate-analytics notice. The ordinary manual release process needs no private file or build environment setting.

For another hostname, obtain its approved public installation snippet through [Cloudflare's setup instructions](https://developers.cloudflare.com/web-analytics/get-started/), then review the site ID, exact hostname boundary, privacy wording and tests together. No DNS move or new hosting service is required for the manual snippet.

Run `npm test` and `npm run check`, then inspect the built English and Persian privacy pages. Check that production loads one beacon and that localhost loads none. See [Cloudflare's FAQ](https://developers.cloudflare.com/web-analytics/faq/) for blocked scripts and reporting limits.
