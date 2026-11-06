import type { Locale } from '../config/site';
import { dictionaries } from '../i18n/ui';

const omittedCredits = new Set([
  "Photographer not recorded.",
  "Videographer not recorded.",
  "Designer not recorded.",
  "Design credit not recorded.",
  "SIGS event archive.",
  "SIGS archive.",
  "SIGS team profile.",
  "Poster credits as printed.",
  "SIGS event artwork. Artist not recorded.",
  "Welcome event artwork. Artist not recorded.",
  "Film and student-group promotional artwork. Drawing credit retained in artwork.",
  "UCI reception promotional artwork. Artist not recorded.",
  "SIGS promotional artwork. Artist and portrait photographers not recorded.",
  "Promotional portrait shared by SIGS. Photographer not recorded.",
  "Memorial portrait shared by SIGS. Photographer not recorded.",
  "SIGS promotional artwork. Artist not recorded.",
]);

const displayCredits: Record<string, Record<Locale, string>> = {
  "BLUEYE STUDIO (visible watermark).": { en: "BLUEYE STUDIO", fa: "BLUEYE STUDIO" },
  "PegioR (visible watermark).": { en: "PegioR", fa: "PegioR" },
  "Mojgan Salehi & Pegah Pouladian. Visible mark: PegioR.": { en: "Mojgan Salehi & Pegah Pouladian; PegioR.", fa: "Mojgan Salehi و Pegah Pouladian؛ PegioR." },
  "Mojgan Salehi & Pegah Pouladian; PegioR (visible watermark).": { en: "Mojgan Salehi & Pegah Pouladian; PegioR.", fa: "Mojgan Salehi و Pegah Pouladian؛ PegioR." },
  "Artwork signed ©saman.": { en: "©saman", fa: "©saman" },
  "LIQUID V mark visible; designer not recorded.": { en: "LIQUID V", fa: "LIQUID V" },
  "Google Street View; attribution retained in the screenshot.": { en: "Google Street View", fa: "Google Street View" },
  "PosterMyWall mark visible; designer not recorded.": { en: "PosterMyWall", fa: "PosterMyWall" },
  "Iranian Scholars for Liberty; SIGS event archive.": { en: "Iranian Scholars for Liberty", fa: "Iranian Scholars for Liberty" },
  "Alliance for Iranian Students; Middle East Matters; SIGS event archive.": { en: "Alliance for Iranian Students; Middle East Matters", fa: "Alliance for Iranian Students؛ Middle East Matters" },
  "Shemroon Entertainment and Orange County Persian Community; shared by SIGS.": { en: "Shemroon Entertainment and Orange County Persian Community; shared by SIGS.", fa: "Shemroon Entertainment و Orange County Persian Community؛ بازنشر از SIGS." },
  "SIGS event archive; Freepik.": { en: "Freepik", fa: "Freepik" },
  "SIGS archive; Shemroon Entertainment.": { en: "Shemroon Entertainment", fa: "Shemroon Entertainment" },
  "SIGS, ISU and Shemroon Entertainment promotional artwork. Artist not recorded.": { en: "SIGS; ISU; Shemroon Entertainment", fa: "SIGS؛ ISU؛ Shemroon Entertainment" },
  "UCLA and UCI Iranian student groups promotional artwork. Artist not recorded.": { en: "UCLA and UCI Iranian student groups", fa: "گروه‌های دانشجویی ایرانی UCLA و UCI" },
  "UCI Jordan Center for Persian Studies & Culture; SIGS and ISU logos retained.": { en: "UCI Jordan Center for Persian Studies & Culture; SIGS; ISU", fa: "مرکز مطالعات ایرانی و فرهنگ جردن در UCI؛ SIGS؛ ISU" },
  "SIGS and Iranian Students of California promotional artwork. Artist and photographer not recorded.": { en: "SIGS; Iranian Students of California", fa: "SIGS؛ دانشجویان ایرانی کالیفرنیا" },
  "Artwork signed KD STUDIO; SIGS program.": { en: "KD STUDIO", fa: "KD STUDIO" },
  "Nava Entertainment and SIGS promotional artwork. Portrait photographers not recorded.": { en: "Nava Entertainment; SIGS", fa: "Nava Entertainment؛ SIGS" },
  "SIGS event artwork; AGS sponsor credit retained. Artist not recorded.": { en: "Sponsored by AGS.", fa: "با حمایت AGS." },
  "Shemroon and OCPC promotional artwork. Artist not recorded.": { en: "Shemroon; OCPC", fa: "Shemroon؛ OCPC" },
};

export function displayMediaCredit(credit: string, locale: Locale): string | undefined {
  if (omittedCredits.has(credit)) return undefined;
  if (Object.hasOwn(displayCredits, credit)) return displayCredits[credit][locale];
  return Object.hasOwn(dictionaries[locale], credit) ? dictionaries[locale][credit] : credit;
}
