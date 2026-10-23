# SIGS at UC Irvine

This repository holds the Society of Iranian Graduate Students website at UC Irvine, in [English](https://sigs-uci.github.io/en/) and [Persian](https://sigs-uci.github.io/fa/). It brings event information, the community archive, campus resources and team contacts into one static site.

The site uses Astro and TypeScript. Pagefind builds a search index for each language. Persian pages have a right-to-left layout, local fonts and Persian number formatting. Both versions share event facts and term-specific team contacts.

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

The archive has a page for each populated year. Six program profiles connect those records to the wider SIGS story. The campus directory and newcomer guide point to official UCI services, and current and previous team pages preserve each term's roles and contacts.

Memories brings photographs, historical posters and full-length videos into browsable collections, each with English and Persian pages. The videos play with native browser controls as silent web editions, with scene descriptions in both languages. Unconfirmed event names and dates stay unspecified.

نسخهٔ فارسی شامل آرشیو رویدادها، معرفی برنامه‌ها، مجموعه‌های عکس و ویدیوی بی‌صدا، راهنمای دانشجویان تازه‌وارد، منابع دانشگاه و اطلاعات تیم فعلی و قبلی است. برای پیشنهاد اصلاح متن یا اطلاعات، با [sigs@uci.edu](mailto:sigs@uci.edu) تماس بگیرید.

I keep editing instructions in [the officer guide](docs/officer-guide.md), with [content templates](docs/content-templates.md), [architecture notes](docs/architecture.md) and [release instructions](docs/release.md). [Content readiness](docs/content-readiness.md) records the remaining publication decisions.

The [organization profile repository](https://github.com/sigs-uci/.github) is maintained separately. Website workflows belong here.

The supplied SIGS emblem stays intact. Manrope and Vazirmatn retain their font licenses in `public/fonts/`. No general software license has been selected for this repository; media permissions remain separate from software licensing.
