# SIGS at UC Irvine

This repository holds the Society of Iranian Graduate Students website. It brings event information, the community archive, campus resources and team contacts into one static site at `https://sigs-uci.github.io`.

The site uses Astro and TypeScript. Search is built with Pagefind. English is the published language; Persian routing and typography are prepared for reviewed translations.

Use Node.js 24 and the committed npm lockfile:

```sh
npm ci
npm run check
npm test
npm run build
npm run links
npm run output:check
npm run preview
```

Open the local preview address printed by Astro. The preview serves the built site, including search. `npm run dev` starts the editing server; search needs a build first. Run validation locally before committing or publishing. Pushes and pull requests do not run GitHub CI.

Public content lives in `src/data/`. Components and routes read those records rather than maintaining separate event lists. The archive distinguishes documented gatherings from archived announcements. A past advertised date does not establish that an event took place.

I keep editing instructions in [the officer guide](docs/officer-guide.md), with [content templates](docs/content-templates.md), [architecture notes](docs/architecture.md) and [release instructions](docs/release.md). [Content readiness](docs/content-readiness.md) records the remaining publication decisions.

The [organization profile repository](https://github.com/sigs-uci/.github) is maintained separately. Website workflows belong here.

The supplied SIGS emblem stays intact. Manrope and Vazirmatn retain their font licenses in `public/fonts/`. No general software license has been selected for this repository; media permissions remain separate from software licensing.
