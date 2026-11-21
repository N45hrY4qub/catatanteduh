/**
 * ============================================================================
 * ENGINE TAMPILAN PUBLIK & TEMA DINAMIS — CATATAN TEDUH
 * ============================================================================
 * Mendukung pembaruan tema visual secara instan (warna aksen, font, gaya
 * kartu, visibilitas & urutan tab) serta rendering baik di halaman utama
 * maupun di kanvas Live Preview Studio Visual.
 * ============================================================================
 */

(function () {
  "use strict";

  const THEME_PALETTES = {
    emerald: {
      accent: "#047857",
      hover: "#065f46",
      text: "#065f46",
      soft: "#ecfdf5",
      border: "#a7f3d0",
      glow: "rgba(16, 185, 129, 0.08)",
    },
    teal: {
      accent: "#0f766e",
      hover: "#115e59",
      text: "#115e59",
      soft: "#f0fdfa",
      border: "#99f6e4",
      glow: "rgba(20, 184, 166, 0.08)",
    },
    indigo: {
      accent: "#3730a3",
      hover: "#312e81",
      text: "#312e81",
      soft: "#eef2ff",
      border: "#c7d2fe",
      glow: "rgba(99, 102, 241, 0.08)",
    },
    amber: {
      accent: "#92400e",
      hover: "#78350f",
      text: "#78350f",
      soft: "#fffbeb",
      border: "#fde68a",
      glow: "rgba(217, 119, 6, 0.08)",
    },
    slate: {
      accent: "#334155",
      hover: "#1e293b",
      text: "#1e293b",
      soft: "#f1f5f9",
      border: "#cbd5e1",
      glow: "rgba(71, 85, 105, 0.07)",
    },
  };

  const FONT_PRESETS = {
    editorial: {
      heading: '"Fraunces", Georgia, serif',
      body: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    },
    modern: {
      heading: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      body: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    },
    klasik: {
      heading: '"Source Serif 4", Georgia, serif',
      body: '"Source Serif 4", Georgia, serif',
    },
  };

  const R2_FONT_BASE_URL = "https://pub-56b30f3515324b2880e9b93466b7716d.r2.dev/font/";

  const BUILTIN_FONT_COLLECTION = [
    {
      id: "uthmanic-hafs",
      nama: "Uthmanic Hafs v22 (Al-Qur'an R2)",
      sumber: "r2",
      family: "UthmanicHafsR2",
      url: "https://pub-56b30f3515324b2880e9b93466b7716d.r2.dev/font/uthmanic_hafs_v22.woff2",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "amiri-quran",
      nama: "Amiri Quran (Al-Qur'an Google)",
      sumber: "google",
      family: "Amiri Quran",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "amiri",
      nama: "Amiri (Hadis & Kitab Google)",
      sumber: "google",
      family: "Amiri",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "scheherazade-new",
      nama: "Scheherazade New (Arab Klasik Google)",
      sumber: "google",
      family: "Scheherazade New",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "noto-naskh-arabic",
      nama: "Noto Naskh Arabic (Arab Umum Google)",
      sumber: "google",
      family: "Noto Naskh Arabic",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "readex-pro",
      nama: "Readex Pro (Arab Modern Google)",
      sumber: "google",
      family: "Readex Pro",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "fraunces",
      nama: "Fraunces (Editorial Google)",
      sumber: "google",
      family: "Fraunces",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "plus-jakarta-sans",
      nama: "Plus Jakarta Sans (Modern Google)",
      sumber: "google",
      family: "Plus Jakarta Sans",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "source-serif-4",
      nama: "Source Serif 4 (Klasik Buku Google)",
      sumber: "google",
      family: "Source Serif 4",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "lora",
      nama: "Lora (Sastra Google)",
      sumber: "google",
      family: "Lora",
      kategori: "latin",
      builtin: true,
    },
  ];

  const TAB_META = {
    tulisan: { label: "Tulisan", navLabel: "Tulisan", hasCount: true },
    ebook: { label: "Ebook", navLabel: "Ebook", hasCount: true },
    flyer: { label: "Flyer Nasihat", navLabel: "Flyer", hasCount: true },
    audio: { label: "Audio", navLabel: "Audio", hasCount: true },
    video: { label: "Video", navLabel: "Video", hasCount: true },
    diskusi: { label: "Ruang Diskusi", navLabel: "Diskusi", hasCount: false },
  };

  const state = {
    activeTab: "tulisan",
    searchQuery: "",
    fontSize: localStorage.getItem("catatan_teduh_font_size") || "md",
    giscusLoaded: false,
    activeFlyer: null,
    activeArticle: null,
    currentData: null,
  };

  // --------------------------------------------------------------------------
  // Utilitas Aman, Font R2/Google, & Pemformatan Arab Bidi (RTL/LTR Otomatis)
  // --------------------------------------------------------------------------
  const ARABIC_CHAR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const ARABIC_CHAR_GLOBAL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const ARABIC_RUN_RE = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A،؛؟۔۝۞]*)/g;
  const LATIN_CHAR_GLOBAL_RE = /[A-Za-z\u00C0-\u024F]/g;

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolveR2FontUrl(rawUrl) {
    const val = String(rawUrl || "").trim();
    if (!val) return "";
    if (/^(https?:\/\/|\/|data:)/i.test(val)) return val;
    return `${R2_FONT_BASE_URL}${val.replace(/^\/+/, "")}`;
  }

  function inferFontFormat(url) {
    const clean = String(url || "").split("?")[0].toLowerCase();
    if (clean.endsWith(".woff2")) return "woff2";
    if (clean.endsWith(".woff")) return "woff";
    if (clean.endsWith(".otf")) return "opentype";
    if (clean.endsWith(".ttf")) return "truetype";
    return "woff2";
  }

  function getFontCollection(siteData) {
    const custom =
      siteData && siteData.tampilan && Array.isArray(siteData.tampilan.koleksiFont)
        ? siteData.tampilan.koleksiFont
        : [];
    const byId = new Map();
    BUILTIN_FONT_COLLECTION.forEach((f) => byId.set(f.id, deepClone(f)));
    custom.forEach((f) => {
      if (f && f.id && f.family) {
        byId.set(f.id, {
          ...f,
          url: f.sumber === "r2" ? resolveR2FontUrl(f.url) : f.url || "",
        });
      }
    });
    return Array.from(byId.values());
  }

  function syncDynamicFonts(siteData) {
    const fonts = getFontCollection(siteData);

    // 1. Injeksi @font-face untuk font dari Cloudflare R2
    const r2Fonts = fonts.filter((f) => f.sumber === "r2" && f.url);
    const r2Css = r2Fonts
      .map((f) => {
        const safeFam = String(f.family || f.id).replace(/["\\]/g, "");
        const safeUrl = resolveR2FontUrl(f.url).replace(/["\\]/g, "");
        const fmt = inferFontFormat(safeUrl);
        return `@font-face { font-family: "${safeFam}"; src: url("${safeUrl}") format("${fmt}"); font-display: swap; font-weight: 100 900; font-style: normal; }`;
      })
      .join("\n");

    let r2StyleEl = document.getElementById("catatanteduh-r2-fonts");
    if (!r2StyleEl) {
      r2StyleEl = document.createElement("style");
      r2StyleEl.id = "catatanteduh-r2-fonts";
      document.head.appendChild(r2StyleEl);
    }
    if (r2StyleEl.textContent !== r2Css) {
      r2StyleEl.textContent = r2Css;
    }

    // 2. Muat Google Fonts tambahan kustom untuk koleksi pilihan teks
    const alreadyInIndex = new Set([
      "Fraunces",
      "Plus Jakarta Sans",
      "Source Serif 4",
      "Amiri Quran",
      "Amiri",
      "Scheherazade New",
      "Noto Naskh Arabic",
      "Readex Pro",
      "Lora",
    ]);
    const weightsMap = {
      "Amiri Quran": "Amiri+Quran",
      Amiri: "Amiri:ital,wght@0,400;0,700;1,400",
      "Scheherazade New": "Scheherazade+New:wght@400;700",
      "Noto Naskh Arabic": "Noto+Naskh+Arabic:wght@400;500;600;700",
      "Readex Pro": "Readex+Pro:wght@400;500;600",
      Lora: "Lora:ital,wght@0,400;0,600;1,400",
    };

    const googleFamilies = [];
    const seenFam = new Set();
    fonts.forEach((f) => {
      if (f.sumber !== "google" || !f.family) return;
      const fam = String(f.family).trim();
      if (alreadyInIndex.has(fam) || seenFam.has(fam)) return;
      seenFam.add(fam);
      googleFamilies.push(weightsMap[fam] || `${encodeURIComponent(fam).replace(/%20/g, "+")}:wght@400;600;700`);
    });

    let googleLinkEl = document.getElementById("catatanteduh-google-fonts");
    if (googleFamilies.length) {
      const href = `https://fonts.googleapis.com/css2?${googleFamilies
        .map((f) => `family=${f}`)
        .join("&")}&display=swap`;
      if (!googleLinkEl) {
        googleLinkEl = document.createElement("link");
        googleLinkEl.id = "catatanteduh-google-fonts";
        googleLinkEl.rel = "stylesheet";
        document.head.appendChild(googleLinkEl);
      }
      if (googleLinkEl.getAttribute("href") !== href) {
        googleLinkEl.setAttribute("href", href);
      }
    }
  }

  function stripRichTags(str) {
    return String(str || "")
      .replace(/\[(?:font|arab)(?:=[a-z0-9-]+)?(?:\s+size=\d{1,3})?\]/gi, "")
      .replace(/\[\/(?:font|arab)\]/gi, "");
  }

  function detectTextDirection(rawText) {
    const trimmed = String(rawText || "").trim();
    if (!trimmed) return "ltr";
    if (/^\[arab(?:=[a-z0-9-]+)?(?:\s+size=\d{1,3})?\][\s\S]*\[\/arab\]$/i.test(trimmed)) return "rtl";

    const plain = stripRichTags(trimmed);
    const arabicMatches = plain.match(ARABIC_CHAR_GLOBAL_RE) || [];
    const latinMatches = plain.match(LATIN_CHAR_GLOBAL_RE) || [];
    if (!arabicMatches.length) return "ltr";
    if (!latinMatches.length) return "rtl";

    // Cek huruf kuat pertama (abaikan angka, spasi, tanda kutip, tanda baca)
    for (let i = 0; i < plain.length; i++) {
      const ch = plain[i];
      if (ARABIC_CHAR_RE.test(ch)) {
        // Rata kanan hanya jika diawali Arab dan mayoritas/seimbang Arab (bukan Arab singkat lalu kalimat Latin panjang)
        return arabicMatches.length >= latinMatches.length ? "rtl" : "ltr";
      }
      if (/[A-Za-z\u00C0-\u024F]/.test(ch)) {
        // Jika diawali Latin (termasuk Arab yang terapit teks Latin), tetap rata kiri (LTR)
        return "ltr";
      }
    }
    return arabicMatches.length >= latinMatches.length ? "rtl" : "ltr";
  }

  function wrapArabicRunsInEscaped(escapedText) {
    return escapedText.replace(
      ARABIC_RUN_RE,
      (match) => `<span lang="ar" dir="auto" class="bidi-isolate">${match}</span>`
    );
  }

  function formatRichInlineHtml(rawText, siteData) {
    const input = String(rawText || "");
    if (!input) return "";

    const fonts = getFontCollection(siteData || state.currentData || window.SITE_DATA || {});
    const fontMap = new Map(fonts.map((f) => [f.id, f]));
    const tagRegex = /\[(font|arab)(?:=([a-z0-9-]+))?(?:\s+size=(\d{1,3}))?\]([\s\S]*?)\[\/\1\]/gi;

    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        const plainPart = input.slice(lastIndex, match.index);
        result += wrapArabicRunsInEscaped(escapeHtml(plainPart));
      }

      const tagType = match[1].toLowerCase();
      const fontId = (match[2] || "").toLowerCase();
      const rawSize = match[3] ? parseInt(match[3], 10) : 0;
      const fontSize = rawSize >= 10 && rawSize <= 72 ? rawSize : 0;
      const innerRaw = match[4] || "";
      const fontObj = fontId ? fontMap.get(fontId) : null;
      const plainInner = stripRichTags(innerRaw);
      const hasArabic = ARABIC_CHAR_RE.test(plainInner);

      const safeFam = fontObj ? String(fontObj.family).replace(/["\\']/g, "") : "";
      const fallback = fontObj && fontObj.kategori === "arab" ? "'Amiri', serif" : "Georgia, serif";
      const styleParts = [];
      if (safeFam) {
        styleParts.push(`font-family: '${safeFam}', ${fallback};`);
      }
      if (fontSize) {
        styleParts.push(
          `font-size: ${fontSize}px; line-height: ${tagType === "arab" || hasArabic ? "1.95" : "1.45"};`
        );
      }
      const inlineStyle = styleParts.join(" ");

      if (tagType === "arab") {
        const innerHtml = formatRichInlineHtml(innerRaw, siteData);
        result += `<span lang="ar" dir="rtl" class="ct-arab-block${fontObj ? " ct-font-arab" : ""}"${
          inlineStyle ? ` style="${inlineStyle}"` : ""
        }>${innerHtml}</span>`;
      } else {
        const innerHtml = formatRichInlineHtml(innerRaw, siteData);
        if (fontObj || fontSize) {
          result += `<span${hasArabic ? ' lang="ar" dir="auto"' : ""} class="bidi-isolate${
            hasArabic ? " ct-font-arab" : ""
          }" style="${inlineStyle}">${innerHtml}</span>`;
        } else {
          result += innerHtml;
        }
      }

      lastIndex = tagRegex.lastIndex;
    }

    if (lastIndex < input.length) {
      result += wrapArabicRunsInEscaped(escapeHtml(input.slice(lastIndex)));
    }

    return result;
  }

  function distributeMultilineRichTags(rawText) {
    return String(rawText || "").replace(
      /\[(font|arab)((?:=[a-z0-9-]+)?(?:\s+size=\d{1,3})?)\]([\s\S]*?)\[\/\1\]/gi,
      (_full, tag, attrs, inner) => {
        if (!/[\r\n]/.test(inner)) return `[${tag}${attrs}]${inner}[/${tag}]`;
        return inner
          .split(/\r?\n/)
          .map((part) => (part ? `[${tag}${attrs}]${part}[/${tag}]` : ""))
          .join("\n");
      }
    );
  }

  function formatRichLinesHtml(rawText, siteData) {
    const normalized = distributeMultilineRichTags(rawText);
    const lines = normalized.split(/\r?\n+/).filter((line) => line !== "");
    if (lines.length <= 1) {
      return formatRichInlineHtml(lines[0] !== undefined ? lines[0] : normalized, siteData);
    }
    return lines
      .map((line) => {
        const dir = detectTextDirection(line);
        const cls = dir === "rtl" ? "block text-right leading-[2.05]" : "block";
        return `<span dir="${dir}" class="${cls}">${formatRichInlineHtml(line, siteData)}</span>`;
      })
      .join("");
  }

  function formatIndex(idx) {
    return String(idx + 1).padStart(2, "0");
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getActiveTabsList(siteData) {
    const t = (siteData && siteData.tampilan) || {};
    const list = Array.isArray(t.tabAktif) && t.tabAktif.length
      ? t.tabAktif
      : ["tulisan", "ebook", "flyer", "audio", "video", "diskusi"];
    return list.filter((k) => TAB_META[k]);
  }

  function filterItems(siteData, key, query, includeDrafts) {
    const list = Array.isArray(siteData[key]) ? siteData[key] : [];
    return list.filter((item) => {
      if (item.status === "trash") return false;
      if (!includeDrafts && item.status === "draft") return false;
      if (!query || !query.trim()) return true;
      const q = query.toLowerCase().trim();
      const haystack = [
        stripRichTags(item.judul),
        item.kategori,
        item.tema,
        item.seri,
        stripRichTags(item.ringkasan),
        stripRichTags(item.deskripsi),
        stripRichTags(item.nasihat),
        item.penulis,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  async function downloadAsset(url, filename) {
    try {
      if (url.startsWith("data:")) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename || "unduhan";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengunduh");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename || "unduhan";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (_err) {
      const fallback = document.createElement("a");
      fallback.href = url;
      fallback.download = filename || "unduhan";
      if (/^https?:\/\//i.test(url)) {
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
      }
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
    }
  }

  // --------------------------------------------------------------------------
  // Penerapan Variabel Tema CSS (Instan & Zero-Flicker)
  // --------------------------------------------------------------------------
  function applyThemeVariables(tampilan, siteData) {
    const t = tampilan || {};
    const palette = THEME_PALETTES[t.warnaAksen] || THEME_PALETTES.emerald;
    const fonts = FONT_PRESETS[t.jenisFont] || FONT_PRESETS.editorial;
    const cardStyle = t.gayaKartu || "halus";

    const root = document.documentElement;
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-hover", palette.hover);
    root.style.setProperty("--accent-text", palette.text);
    root.style.setProperty("--accent-soft", palette.soft);
    root.style.setProperty("--accent-border", palette.border);
    root.style.setProperty("--accent-glow", palette.glow);
    root.style.setProperty("--font-heading", fonts.heading);
    root.style.setProperty("--font-body", fonts.body);

    document.body.setAttribute("data-card-style", cardStyle);
    syncDynamicFonts(siteData || { tampilan: t });
  }

  // --------------------------------------------------------------------------
  // Builder HTML untuk Masing-masing Tab Konten
  // --------------------------------------------------------------------------
  function buildEmptyHtml(labelKategori, query) {
    return `
      <div class="site-card rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-4">
        <p class="font-theme-display text-xl font-medium text-[#1F2937] mb-2">
          Belum ada ${escapeHtml(labelKategori)} ${query ? "yang cocok" : "yang ditampilkan"}
        </p>
        <p class="text-sm text-gray-500 leading-relaxed mb-6">
          ${
            query
              ? `Tidak ditemukan judul atau topik yang sesuai dengan kata kunci "<span class="font-medium text-[#1F2937]">${escapeHtml(query)}</span>" pada tab ini.`
              : "Konten kategori ini masih kosong atau berstatus draft. Tambahkan melalui Studio Editor."
          }
        </p>
        ${
          query
            ? `<button type="button" data-action="reset-search" class="px-4 py-2.5 text-sm font-medium theme-text-accent theme-bg-soft border theme-border-soft rounded-xl transition-colors">Tampilkan Semua Konten</button>`
            : ""
        }
      </div>
    `;
  }

  function buildDraftBadge(item) {
    if (item.status !== "draft") return "";
    return `<span class="px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300/80 rounded-md">Draft</span>`;
  }

  function buildTulisanHtml(siteData, query, includeDrafts) {
    const items = filterItems(siteData, "tulisan", query, includeDrafts);
    if (!items.length) return buildEmptyHtml("tulisan", query);

    const cards = items
      .map(
        (item, idx) => `
        <article class="group site-card rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:-translate-y-0.5">
          <div>
            <div class="flex items-center justify-between gap-4 mb-5">
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span class="font-semibold theme-text-accent">${escapeHtml(item.kategori)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.tanggal)}</span>
                <span aria-hidden="true">·</span>
                <span class="tabular-nums">${escapeHtml(item.waktuBaca)}</span>
                ${buildDraftBadge(item)}
              </div>
              <span class="font-theme-display text-sm text-stone-400 tabular-nums shrink-0">${formatIndex(idx)}</span>
            </div>

            <h2 dir="${detectTextDirection(item.judul)}" class="font-theme-display text-xl sm:text-2xl font-medium leading-snug text-[#1F2937] headline-balance mb-3 ${
              detectTextDirection(item.judul) === "rtl" ? "text-right" : ""
            }">
              ${formatRichInlineHtml(item.judul, siteData)}
            </h2>
            <p dir="${detectTextDirection(item.ringkasan)}" class="text-sm sm:text-[15px] text-gray-600 leading-relaxed mb-7 ${
              detectTextDirection(item.ringkasan) === "rtl" ? "text-right" : ""
            }">
              ${formatRichLinesHtml(item.ringkasan, siteData)}
            </p>
          </div>

          <div class="pt-5 border-t border-stone-200/60 flex items-center justify-between">
            <button
              type="button"
              data-read-article="${escapeHtml(item.id)}"
              class="w-full inline-flex items-center justify-between text-sm font-semibold text-[#1F2937] hover:opacity-80 transition-colors py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
            >
              <span>Baca Selengkapnya</span>
              <span class="w-9 h-9 rounded-full bg-stone-200/70 group-hover:text-white flex items-center justify-center transition-colors" style="transition: background-color 200ms ease;">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>
        </article>
      `
      )
      .join("");

    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
  }

  function buildEbookHtml(siteData, query, includeDrafts) {
    const items = filterItems(siteData, "ebook", query, includeDrafts);
    if (!items.length) return buildEmptyHtml("ebook", query);

    const cards = items
      .map(
        (item) => `
        <article class="site-card rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row gap-6 sm:gap-7">
          <div class="w-40 sm:w-44 shrink-0 mx-auto sm:mx-0">
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-book relative">
              <img
                src="${escapeHtml(item.sampul)}"
                alt="Sampul ebook ${escapeHtml(stripRichTags(item.judul))}"
                referrerpolicy="no-referrer"
                loading="lazy"
                class="w-full h-full object-cover"
                onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
              />
              <div class="hidden absolute inset-0 theme-bg-soft p-4 flex flex-col justify-between theme-text-accent">
                <span class="text-[11px] font-medium">Ebook PDF</span>
                <span class="font-theme-display text-sm font-medium leading-snug">${formatRichInlineHtml(item.judul, siteData)}</span>
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <p class="text-xs font-medium theme-text-accent">
                  Oleh ${escapeHtml(item.penulis)} · ${escapeHtml(item.tahun)}
                </p>
                ${buildDraftBadge(item)}
              </div>
              <h2 dir="${detectTextDirection(item.judul)}" class="font-theme-display text-xl sm:text-2xl font-medium leading-snug text-[#1F2937] mb-3 ${
                detectTextDirection(item.judul) === "rtl" ? "text-right" : ""
              }">
                ${formatRichInlineHtml(item.judul, siteData)}
              </h2>
              <p dir="${detectTextDirection(item.deskripsi)}" class="text-sm text-gray-600 leading-relaxed mb-5 ${
                detectTextDirection(item.deskripsi) === "rtl" ? "text-right" : ""
              }">
                ${formatRichLinesHtml(item.deskripsi, siteData)}
              </p>
            </div>

            <div class="space-y-4">
              <dl class="grid grid-cols-3 gap-2 py-3 border-y border-stone-200/60 text-xs tabular-nums">
                <div>
                  <dt class="text-gray-400">Format</dt>
                  <dd class="font-medium text-[#1F2937] mt-0.5">PDF</dd>
                </div>
                <div>
                  <dt class="text-gray-400">Ukuran</dt>
                  <dd class="font-medium text-[#1F2937] mt-0.5">${escapeHtml(item.ukuranFile)}</dd>
                </div>
                <div>
                  <dt class="text-gray-400">Tebal</dt>
                  <dd class="font-medium text-[#1F2937] mt-0.5">${escapeHtml(item.halaman)}</dd>
                </div>
              </dl>

              <button
                type="button"
                data-download-url="${escapeHtml(item.fileUrl)}"
                data-download-name="${escapeHtml(item.namaFileUnduh || "ebook.pdf")}"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white theme-bg-accent rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </article>
      `
      )
      .join("");

    return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
  }

  function buildFlyerHtml(siteData, query, includeDrafts) {
    const items = filterItems(siteData, "flyer", query, includeDrafts);
    if (!items.length) return buildEmptyHtml("flyer nasihat", query);

    const cards = items
      .map(
        (item) => `
        <figure class="site-card rounded-2xl p-4 sm:p-5 flex flex-col">
          <button
            type="button"
            data-open-flyer="${escapeHtml(item.id)}"
            class="group relative aspect-[3/4] w-full bg-[#F3F1EC] rounded-xl overflow-hidden text-left"
            aria-label="Perbesar flyer ${escapeHtml(stripRichTags(item.judul))}"
          >
            <img
              src="${escapeHtml(item.gambar)}"
              alt="${escapeHtml(stripRichTags(item.judul))}"
              referrerpolicy="no-referrer"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
            />
            <div class="hidden absolute inset-0 theme-bg-soft p-6 flex flex-col justify-center items-center text-center theme-text-accent">
              <span class="font-theme-display text-lg font-medium">${formatRichInlineHtml(item.judul, siteData)}</span>
            </div>
            <span class="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900/80 text-white rounded-lg backdrop-blur-sm transition-colors">
              <span>Perbesar</span>
            </span>
          </button>

          <figcaption class="pt-5 px-1 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                <span class="font-semibold theme-text-accent">${escapeHtml(item.tema)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.tanggal)}</span>
                ${buildDraftBadge(item)}
              </div>
              <h2 dir="${detectTextDirection(item.judul)}" class="font-theme-display text-xl font-medium text-[#1F2937] mb-2 ${
                detectTextDirection(item.judul) === "rtl" ? "text-right" : ""
              }">
                ${formatRichInlineHtml(item.judul, siteData)}
              </h2>
              <p dir="${detectTextDirection(item.nasihat)}" class="text-sm text-gray-600 leading-relaxed mb-5 ${
                detectTextDirection(item.nasihat) === "rtl" ? "text-right" : ""
              }">
                ${formatRichLinesHtml(item.nasihat, siteData)}
              </p>
            </div>

            <div class="pt-4 border-t border-stone-200/60 flex items-center justify-between gap-3">
              <button type="button" data-open-flyer="${escapeHtml(item.id)}" class="text-sm font-medium text-gray-600 hover:text-[#1F2937] transition-colors py-1">
                Lihat Penuh
              </button>
              <button
                type="button"
                data-download-url="${escapeHtml(item.gambar)}"
                data-download-name="${escapeHtml(item.namaFileUnduh || "flyer-nasihat.jpg")}"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium theme-text-accent theme-bg-soft border theme-border-soft rounded-xl transition-colors whitespace-nowrap"
              >
                <span>Simpan Gambar</span>
              </button>
            </div>
          </figcaption>
        </figure>
      `
      )
      .join("");

    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl panel-enter">${cards}</div>`;
  }

  function buildAudioHtml(siteData, query, includeDrafts) {
    const items = filterItems(siteData, "audio", query, includeDrafts);
    if (!items.length) return buildEmptyHtml("audio kajian", query);

    const list = items
      .map(
        (item, idx) => `
        <article class="site-card rounded-2xl p-6 sm:p-7">
          <div class="flex items-start gap-4 sm:gap-5 mb-5">
            <div class="w-11 h-11 rounded-xl theme-bg-soft border theme-border-soft theme-text-accent font-theme-display text-base font-medium flex items-center justify-center shrink-0 tabular-nums">
              ${formatIndex(idx)}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1.5 tabular-nums">
                <span class="font-semibold theme-text-accent">${escapeHtml(item.seri)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.tanggal)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.durasi)}</span>
                ${buildDraftBadge(item)}
              </div>
              <h2 dir="${detectTextDirection(item.judul)}" class="font-theme-display text-xl sm:text-2xl font-medium text-[#1F2937] mb-2 ${
                detectTextDirection(item.judul) === "rtl" ? "text-right" : ""
              }">
                ${formatRichInlineHtml(item.judul, siteData)}
              </h2>
              <p dir="${detectTextDirection(item.ringkasan)}" class="text-sm sm:text-[15px] text-gray-600 leading-relaxed ${
                detectTextDirection(item.ringkasan) === "rtl" ? "text-right" : ""
              }">
                ${formatRichLinesHtml(item.ringkasan, siteData)}
              </p>
            </div>
          </div>

          <div class="bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <audio controls preload="metadata" src="${escapeHtml(item.audioUrl)}" class="w-full flex-1" aria-label="Putar audio ${escapeHtml(stripRichTags(item.judul))}">
              Peramban Anda belum mendukung pemutar audio HTML5.
            </audio>
            <button
              type="button"
              data-download-url="${escapeHtml(item.audioUrl)}"
              data-download-name="${escapeHtml(item.id)}${String(item.audioUrl || "").toLowerCase().endsWith(".wav") ? ".wav" : ".mp3"}"
              class="px-3.5 py-2 text-xs font-medium theme-text-accent bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              Unduh Audio
            </button>
          </div>
        </article>
      `
      )
      .join("");

    return `<div class="space-y-5 max-w-3xl panel-enter">${list}</div>`;
  }

  function buildVideoHtml(siteData, query, includeDrafts) {
    const items = filterItems(siteData, "video", query, includeDrafts);
    if (!items.length) return buildEmptyHtml("video", query);

    const cards = items
      .map(
        (item) => `
        <article class="site-card rounded-2xl p-4 sm:p-5 flex flex-col">
          <div class="aspect-video w-full bg-stone-900 rounded-xl overflow-hidden border border-stone-200/60 mb-5">
            <iframe
              class="w-full h-full"
              src="https://www.youtube-nocookie.com/embed/${escapeHtml(item.youtubeId)}"
              title="${escapeHtml(stripRichTags(item.judul))}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>

          <div class="px-1 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2 tabular-nums">
                <span class="font-semibold theme-text-accent">${escapeHtml(item.kategori)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.tanggal)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.durasi)}</span>
                ${buildDraftBadge(item)}
              </div>
              <h2 dir="${detectTextDirection(item.judul)}" class="font-theme-display text-xl font-medium leading-snug text-[#1F2937] mb-2 ${
                detectTextDirection(item.judul) === "rtl" ? "text-right" : ""
              }">
                ${formatRichInlineHtml(item.judul, siteData)}
              </h2>
              <p dir="${detectTextDirection(item.ringkasan)}" class="text-sm text-gray-600 leading-relaxed mb-5 ${
                detectTextDirection(item.ringkasan) === "rtl" ? "text-right" : ""
              }">
                ${formatRichLinesHtml(item.ringkasan, siteData)}
              </p>
            </div>

            <div class="pt-4 border-t border-stone-200/60">
              <a
                href="https://www.youtube.com/watch?v=${escapeHtml(item.youtubeId)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm font-medium theme-text-accent hover:underline"
              >
                <span>Tonton di YouTube</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M14 5h5v5m0-5L10 14M5 10v9h9" />
                </svg>
              </a>
            </div>
          </div>
        </article>
      `
      )
      .join("");

    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
  }

  function isGiscusConfigured(siteData) {
    const g = (siteData && siteData.giscus) || {};
    return g.repo && g.repo !== "username/nama-repo" && g.repoId && g.categoryId;
  }

  function buildDiskusiHtml(siteData, isPreview) {
    const pemilik = (siteData.profil && siteData.profil.namaPemilik) || "Pemilik Website";
    const configured = isGiscusConfigured(siteData);

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start panel-enter">
        <div class="lg:col-span-5 space-y-5">
          <div class="site-card rounded-2xl p-6 sm:p-7">
            <p class="text-xs font-semibold theme-text-accent mb-2">Ruang Tanya Jawab Permanen</p>
            <h2 class="font-theme-display text-2xl font-medium text-[#1F2937] headline-balance mb-3">
              Berdiskusi dengan Tenang &amp; Terbuka
            </h2>
            <p class="text-sm text-gray-600 leading-relaxed mb-6">
              Seluruh percakapan di ruang ini tersimpan permanen menggunakan <strong>GitHub Discussions</strong> tanpa iklan maupun pelacakan.
            </p>

            <div class="space-y-3">
              <div class="bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-4 flex gap-3.5">
                <span class="text-xs font-semibold theme-text-accent tabular-nums mt-0.5">01</span>
                <div>
                  <p class="text-sm font-medium text-[#1F2937] mb-0.5">Masuk dengan GitHub</p>
                  <p class="text-xs text-gray-600 leading-relaxed">Klik tombol <strong>Sign in with GitHub</strong> di kotak komentar bawah.</p>
                </div>
              </div>
              <div class="bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-4 flex gap-3.5">
                <span class="text-xs font-semibold theme-text-accent tabular-nums mt-0.5">02</span>
                <div>
                  <p class="text-sm font-medium text-[#1F2937] mb-0.5">Tulis Pertanyaan Anda</p>
                  <p class="text-xs text-gray-600 leading-relaxed">Ajukan pertanyaan seputar tulisan, kajian, atau topik kehidupan dengan bahasa yang santun.</p>
                </div>
              </div>
              <div class="bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-4 flex gap-3.5">
                <span class="text-xs font-semibold theme-text-accent tabular-nums mt-0.5">03</span>
                <div>
                  <p class="text-sm font-medium text-[#1F2937] mb-0.5">Pantau Balasan Resmi</p>
                  <p class="text-xs text-gray-600 leading-relaxed">Notifikasi otomatis dikirim ke akun GitHub Anda saat pemilik website membalas.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="theme-bg-soft border theme-border-soft rounded-2xl p-5 sm:p-6">
            <div class="flex flex-wrap items-center gap-2 mb-2.5">
              <span class="text-sm font-semibold text-[#1F2937]">${escapeHtml(pemilik)}</span>
              <span class="px-2 py-0.5 text-xs font-semibold theme-text-accent bg-white border theme-border-soft rounded-md">
                Pemilik Website · Admin
              </span>
            </div>
            <p class="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Setiap jawaban dari pemilik repositori pada Giscus otomatis ditandai label <strong>Author / Owner</strong> agar pembaca mudah membedakan jawaban resmi admin.
            </p>
          </div>
        </div>

        <div class="lg:col-span-7 site-card rounded-2xl p-6 sm:p-8">
          <div class="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200/60">
            <h3 class="font-theme-display text-xl font-medium text-[#1F2937]">Forum Diskusi Pembaca</h3>
            <span class="text-xs text-gray-500">Didukung oleh Giscus</span>
          </div>

          <div class="giscus-mount-target">
            ${
              configured && !isPreview
                ? `<p class="text-sm text-gray-500 py-4">Memuat ruang diskusi Giscus...</p>`
                : `
                <div class="space-y-4">
                  <div class="border border-stone-200/80 rounded-xl p-4 sm:p-5 bg-[#FAF9F6]">
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span class="font-semibold text-[#1F2937]">Rizky Pratama · Pembaca</span>
                      <span>Contoh Pertanyaan</span>
                    </div>
                    <p class="text-sm text-gray-700 leading-relaxed">
                      Assalamu'alaikum. Bagaimana cara menjaga konsistensi menulis catatan harian di tengah jadwal kerja yang padat?
                    </p>
                  </div>

                  <div class="border theme-border-soft rounded-xl p-4 sm:p-5 theme-bg-soft sm:ml-6">
                    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mb-2">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-[#1F2937]">${escapeHtml(pemilik)}</span>
                        <span class="px-2 py-0.5 text-[11px] font-semibold theme-text-accent bg-white border theme-border-soft rounded-md">
                          Admin · Pemilik Website
                        </span>
                      </div>
                      <span>Contoh Jawaban Resmi</span>
                    </div>
                    <p class="text-sm text-gray-700 leading-relaxed">
                      Wa'alaikumussalam. Kuncinya ada pada batas minimum yang ringan—cukup tulis tiga kalimat sebelum tidur tentang satu pelajaran hari itu.
                    </p>
                  </div>

                  <div class="border-t border-stone-200/70 pt-4">
                    <p class="text-xs text-gray-600 leading-relaxed">
                      ${
                        configured
                          ? `Giscus sudah terhubung ke <strong>${escapeHtml(siteData.giscus.repo)}</strong> (disembunyikan dalam mode pratinjau agar cepat, aktif di versi publik).`
                          : `Belum terhubung ke repositori Giscus. Isi pengaturan <strong>Giscus</strong> di tab <strong>GitHub</strong> pada Studio Editor atau file <code class="bg-stone-100 px-1 rounded">data.js</code>.`
                      }
                    </p>
                  </div>
                </div>
              `
            }
          </div>
        </div>
      </div>
    `;
  }

  function mountGiscusInto(rootEl, siteData) {
    if (!isGiscusConfigured(siteData)) return;
    const target = rootEl.querySelector(".giscus-mount-target");
    if (!target) return;
    const g = siteData.giscus;
    target.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", g.repo);
    script.setAttribute("data-repo-id", g.repoId);
    script.setAttribute("data-category", g.category || "General");
    script.setAttribute("data-category-id", g.categoryId);
    script.setAttribute("data-mapping", g.mapping || "pathname");
    script.setAttribute("data-strict", g.strict || "0");
    script.setAttribute("data-reactions-enabled", g.reactionsEnabled || "1");
    script.setAttribute("data-emit-metadata", g.emitMetadata || "0");
    script.setAttribute("data-input-position", g.inputPosition || "top");
    script.setAttribute("data-theme", g.theme || "light");
    script.setAttribute("data-lang", g.lang || "id");
    script.crossOrigin = "anonymous";
    script.async = true;
    target.appendChild(script);
  }

  // --------------------------------------------------------------------------
  // Render Halaman Publik Penuh (Digunakan di Situs Utama & Kanvas Preview)
  // --------------------------------------------------------------------------
  function renderSiteInto(containerEl, siteData, options) {
    const opts = options || {};
    const includeDrafts = Boolean(opts.includeDrafts);
    const activeTab = opts.activeTab || state.activeTab;
    const searchQuery = opts.searchQuery !== undefined ? opts.searchQuery : state.searchQuery;
    const isPreview = Boolean(opts.isPreview);

    state.currentData = siteData;
    applyThemeVariables(siteData.tampilan, siteData);

    const p = siteData.profil || {};
    const t = siteData.tampilan || {};
    const enabledTabs = getActiveTabsList(siteData);
    const resolvedTab = enabledTabs.includes(activeTab) ? activeTab : enabledTabs[0] || "tulisan";
    if (!isPreview) state.activeTab = resolvedTab;

    // 1. Jika rendering untuk kanvas Live Preview terisolasi, bangun kerangka penuh
    if (isPreview) {
      const counts = {};
      let totalMatches = 0;
      ["tulisan", "ebook", "flyer", "audio", "video"].forEach((k) => {
        counts[k] = filterItems(siteData, k, searchQuery, includeDrafts).length;
        totalMatches += counts[k];
      });

      const featuredArticle = filterItems(siteData, "tulisan", "", includeDrafts)[0];
      const featuredEbook = filterItems(siteData, "ebook", "", includeDrafts)[0];

      const navHtml = enabledTabs
        .filter((k) => k !== "diskusi")
        .slice(0, 5)
        .map(
          (k) => `
          <button type="button" data-preview-tab="${k}" class="py-1.5 border-b-2 ${
            resolvedTab === k ? "theme-text-accent border-current" : "border-transparent text-gray-600"
          } transition-colors whitespace-nowrap shrink-0">
            ${escapeHtml(TAB_META[k].navLabel)}
          </button>
        `
        )
        .join("");

      const tabPanelHtml = buildTabPanelHtml(siteData, resolvedTab, searchQuery, includeDrafts, true);
      const activeMeta = TAB_META[resolvedTab] || { label: "Konten", hasCount: false };

      containerEl.innerHTML = `
        <div class="min-h-full flex flex-col bg-[#FAF9F6] text-[#1F2937]">
          <header class="border-b border-stone-200/75 bg-[#FAF9F6]/90">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
              <span class="font-theme-display text-xl font-medium tracking-tight text-[#1F2937] whitespace-nowrap shrink-0">
                ${escapeHtml(p.namaWebsite || "Catatan Teduh")}
              </span>
              <nav class="hidden md:flex items-center gap-6 text-sm font-medium">${navHtml}</nav>
              ${
                enabledTabs.includes("diskusi")
                  ? `<button type="button" data-preview-tab="diskusi" class="px-4 py-2 text-sm font-medium text-white theme-bg-accent rounded-xl whitespace-nowrap shrink-0">Ruang Diskusi</button>`
                  : `<span></span>`
              }
            </div>
          </header>

          <main class="flex-1">
            <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-10">
              <div class="grid grid-cols-1 ${t.tampilkanSorotan !== false ? "lg:grid-cols-12" : ""} gap-8 items-stretch">
                <div class="${t.tampilkanSorotan !== false ? "lg:col-span-7" : "max-w-3xl"} flex flex-col justify-between">
                  <div>
                    <p class="text-xs font-semibold tracking-wider theme-text-accent mb-3">${escapeHtml(p.kicker)}</p>
                    <h1 dir="${detectTextDirection(p.judulUtama)}" class="font-theme-display text-3xl sm:text-4xl font-medium leading-[1.15] tracking-tight text-[#1F2937] headline-balance mb-2 ${
                      detectTextDirection(p.judulUtama) === "rtl" ? "text-right" : ""
                    }">
                      ${formatRichInlineHtml(p.judulUtama, siteData)}
                    </h1>
                    ${
                      p.subjudul
                        ? `<p dir="${detectTextDirection(p.subjudul)}" class="font-theme-display italic text-base sm:text-lg theme-text-accent mb-4 ${
                            detectTextDirection(p.subjudul) === "rtl" ? "text-right" : ""
                          }">${formatRichInlineHtml(p.subjudul, siteData)}</p>`
                        : ""
                    }
                    <p dir="${detectTextDirection(p.deskripsi)}" class="text-base leading-relaxed text-gray-600 max-w-2xl mb-6 ${
                      detectTextDirection(p.deskripsi) === "rtl" ? "text-right" : ""
                    }">${formatRichLinesHtml(p.deskripsi, siteData)}</p>
                    ${
                      t.tampilkanPencarian !== false
                        ? `<div class="max-w-xl"><div class="h-11 px-4 bg-white border border-stone-200 rounded-2xl flex items-center text-sm text-gray-400">Cari tulisan, ebook, flyer, audio, atau video...</div></div>`
                        : ""
                    }
                  </div>
                </div>

                ${
                  t.tampilkanSorotan !== false && featuredArticle
                    ? `
                  <aside class="lg:col-span-5 flex">
                    <div class="w-full site-card rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div class="flex items-center justify-between gap-2 text-xs text-gray-500 mb-3 pb-3 border-b border-stone-200/60">
                          <span class="font-semibold theme-text-accent">Sorotan Pilihan</span>
                          <span class="tabular-nums">${escapeHtml(featuredArticle.tanggal)}</span>
                        </div>
                        <h2 dir="${detectTextDirection(featuredArticle.judul)}" class="font-theme-display text-xl font-medium leading-snug text-[#1F2937] mb-2 ${
                          detectTextDirection(featuredArticle.judul) === "rtl" ? "text-right" : ""
                        }">${formatRichInlineHtml(featuredArticle.judul, siteData)}</h2>
                        <p dir="${detectTextDirection(featuredArticle.ringkasan)}" class="text-sm text-gray-600 leading-relaxed mb-5 ${
                          detectTextDirection(featuredArticle.ringkasan) === "rtl" ? "text-right" : ""
                        }">${formatRichLinesHtml(featuredArticle.ringkasan, siteData)}</p>
                      </div>
                      <div class="space-y-3">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs text-gray-500">Oleh ${escapeHtml(p.namaPemilik || "Penulis")}</span>
                          <button type="button" data-read-article="${escapeHtml(featuredArticle.id)}" class="px-3.5 py-2 text-xs font-medium theme-text-accent theme-bg-soft border theme-border-soft rounded-xl">Baca Sekarang</button>
                        </div>
                        ${
                          featuredEbook
                            ? `<div class="pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2 text-xs"><span class="truncate font-medium">${formatRichInlineHtml(featuredEbook.judul, siteData)}</span><button type="button" data-preview-tab="ebook" class="font-semibold theme-text-accent shrink-0">Lihat Ebook &rarr;</button></div>`
                            : ""
                        }
                      </div>
                    </div>
                  </aside>
                `
                    : ""
                }
              </div>
            </section>

            <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
              <div class="flex items-baseline justify-between gap-4 pb-4 mb-7 border-b border-stone-200/80">
                <h2 class="font-theme-display text-2xl font-medium text-[#1F2937]">${escapeHtml(activeMeta.label)}</h2>
                ${
                  activeMeta.hasCount
                    ? `<span class="text-xs sm:text-sm text-gray-500 tabular-nums">${counts[resolvedTab] || 0} materi</span>`
                    : `<span class="text-xs sm:text-sm text-gray-500">Forum Terbuka</span>`
                }
              </div>
              <div>${tabPanelHtml}</div>
            </section>
          </main>

          <footer class="border-t border-stone-200/80 bg-[#F3F1EC]/60 mt-auto">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-gray-500">
              &copy; ${escapeHtml(p.tahunHakCipta || "2026")} ${escapeHtml(p.namaWebsite || "Catatan Teduh")} · Disusun untuk berbagi manfaat secara terbuka.
            </div>
          </footer>
        </div>
      `;
      return;
    }

    // 2. Rendering ke Halaman Publik Utama
    const brandEl = document.getElementById("brand-wordmark");
    const kickerEl = document.getElementById("hero-kicker");
    const titleEl = document.getElementById("hero-title");
    const subtitleEl = document.getElementById("hero-subtitle");
    const descEl = document.getElementById("hero-desc");
    const footerCopyEl = document.getElementById("footer-copy");
    const topNavEl = document.getElementById("top-nav-links");
    const mobileDrawerEl = document.getElementById("mobile-nav-drawer");
    const ctaDiskusiEl = document.getElementById("btn-cta-diskusi");
    const searchWrapEl = document.getElementById("hero-search-wrap");
    const heroSpotlightWrapEl = document.getElementById("hero-spotlight-wrap");
    const heroSpotlightEl = document.getElementById("hero-spotlight");
    const heroGridEl = document.getElementById("hero-grid");
    const heroLeftEl = document.getElementById("hero-left-col");
    const sectionHeaderEl = document.getElementById("active-section-header");
    const tabContentEl = document.getElementById("tab-content-root");
    const searchClearEl = document.getElementById("search-clear");
    const searchHintEl = document.getElementById("search-shortcut-hint");
    const searchStatusEl = document.getElementById("search-status");

    if (brandEl) brandEl.textContent = p.namaWebsite || "Catatan Teduh";
    if (kickerEl) kickerEl.textContent = p.kicker || "";
    if (titleEl) {
      const dirTitle = detectTextDirection(p.judulUtama);
      titleEl.setAttribute("dir", dirTitle);
      titleEl.classList.toggle("text-right", dirTitle === "rtl");
      titleEl.innerHTML = formatRichInlineHtml(p.judulUtama || "", siteData);
    }
    if (subtitleEl) {
      const dirSub = detectTextDirection(p.subjudul);
      subtitleEl.setAttribute("dir", dirSub);
      subtitleEl.classList.toggle("text-right", dirSub === "rtl");
      subtitleEl.innerHTML = formatRichInlineHtml(p.subjudul || "", siteData);
      subtitleEl.classList.toggle("hidden", !p.subjudul);
    }
    if (descEl) {
      const dirDesc = detectTextDirection(p.deskripsi);
      descEl.setAttribute("dir", dirDesc);
      descEl.classList.toggle("text-right", dirDesc === "rtl");
      descEl.innerHTML = formatRichLinesHtml(p.deskripsi || "", siteData);
    }
    if (footerCopyEl) {
      footerCopyEl.textContent = `© ${p.tahunHakCipta || "2026"} ${p.namaWebsite || "Catatan Teduh"} · Disusun untuk berbagi manfaat secara terbuka.`;
    }

    if (searchWrapEl) {
      searchWrapEl.classList.toggle("hidden", t.tampilkanPencarian === false);
    }

    const showSpotlight = t.tampilkanSorotan !== false;
    if (heroSpotlightWrapEl && heroGridEl && heroLeftEl) {
      heroSpotlightWrapEl.classList.toggle("hidden", !showSpotlight);
      heroLeftEl.classList.toggle("lg:col-span-7", showSpotlight);
      heroLeftEl.classList.toggle("lg:col-span-12", !showSpotlight);
    }

    const counts = {};
    let totalMatches = 0;
    ["tulisan", "ebook", "flyer", "audio", "video"].forEach((k) => {
      counts[k] = filterItems(siteData, k, searchQuery, false).length;
      totalMatches += counts[k];
    });

    if (searchStatusEl && searchClearEl && searchHintEl) {
      if (searchQuery.trim()) {
        searchClearEl.classList.remove("hidden");
        searchHintEl.classList.add("hidden");
        searchStatusEl.textContent = `Ditemukan ${totalMatches} konten yang cocok untuk "${searchQuery.trim()}".`;
      } else {
        searchClearEl.classList.add("hidden");
        searchHintEl.classList.remove("hidden");
        searchStatusEl.textContent = "";
      }
    }

    // Top nav links (navigasi utama tunggal di header)
    if (topNavEl) {
      topNavEl.innerHTML = enabledTabs
        .filter((k) => k !== "diskusi")
        .slice(0, 5)
        .map((k) => {
          const isActive = resolvedTab === k;
          return `
            <button
              type="button"
              data-nav-tab="${k}"
              class="py-1.5 border-b-2 ${
                isActive ? "theme-text-accent border-current" : "border-transparent text-gray-600 hover:text-[#1F2937]"
              } transition-colors whitespace-nowrap shrink-0"
            >
              ${escapeHtml(TAB_META[k].navLabel)}
            </button>
          `;
        })
        .join("");
    }

    // Mobile drawer navigation
    if (mobileDrawerEl) {
      mobileDrawerEl.innerHTML = enabledTabs
        .map((k) => {
          const meta = TAB_META[k];
          const isActive = resolvedTab === k;
          return `
            <button
              type="button"
              data-nav-tab="${k}"
              class="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors ${
                isActive
                  ? "font-semibold theme-text-accent theme-bg-soft"
                  : "font-medium text-gray-700 hover:bg-stone-200/50"
              }"
            >
              <span>${escapeHtml(meta.label)}</span>
              ${
                meta.hasCount
                  ? `<span class="text-xs tabular-nums opacity-75">${counts[k] || 0}</span>`
                  : ""
              }
            </button>
          `;
        })
        .join("");
    }

    if (ctaDiskusiEl) {
      ctaDiskusiEl.classList.toggle("hidden", !enabledTabs.includes("diskusi"));
    }

    // Hero spotlight
    if (heroSpotlightEl && showSpotlight) {
      const featuredArticle = filterItems(siteData, "tulisan", "", false)[0];
      const featuredEbook = filterItems(siteData, "ebook", "", false)[0];
      if (featuredArticle) {
        heroSpotlightEl.innerHTML = `
          <div aria-hidden="true" class="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl" style="background: var(--accent-glow);"></div>
          <div class="relative">
            <div class="flex items-center justify-between gap-2 text-xs text-gray-500 mb-4 pb-3 border-b border-stone-200/60">
              <span class="font-semibold theme-text-accent">Sorotan Pilihan</span>
              <span class="tabular-nums">${escapeHtml(featuredArticle.tanggal)}</span>
            </div>
            <h2 dir="${detectTextDirection(featuredArticle.judul)}" class="font-theme-display text-xl sm:text-2xl font-medium leading-snug text-[#1F2937] headline-balance mb-3 ${
              detectTextDirection(featuredArticle.judul) === "rtl" ? "text-right" : ""
            }">
              ${formatRichInlineHtml(featuredArticle.judul, siteData)}
            </h2>
            <p dir="${detectTextDirection(featuredArticle.ringkasan)}" class="text-sm text-gray-600 leading-relaxed mb-6 ${
              detectTextDirection(featuredArticle.ringkasan) === "rtl" ? "text-right" : ""
            }">${formatRichLinesHtml(featuredArticle.ringkasan, siteData)}</p>
          </div>
          <div class="relative space-y-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-gray-500">Oleh ${escapeHtml(p.namaPemilik || "Penulis")} · ${escapeHtml(featuredArticle.waktuBaca)}</span>
              <button
                type="button"
                data-read-article="${escapeHtml(featuredArticle.id)}"
                class="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium theme-text-accent theme-bg-soft border theme-border-soft rounded-xl transition-colors whitespace-nowrap"
              >
                <span>Baca Sekarang</span>
              </button>
            </div>
            ${
              featuredEbook
                ? `
              <div class="pt-4 border-t border-stone-200/60 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[11px] font-medium text-gray-400">Ebook Terbaru</p>
                  <p class="text-xs sm:text-sm font-medium text-[#1F2937] truncate">${formatRichInlineHtml(featuredEbook.judul, siteData)}</p>
                </div>
                <button type="button" data-jump-tab="ebook" class="text-xs font-semibold theme-text-accent hover:underline whitespace-nowrap shrink-0">
                  Lihat Ebook &rarr;
                </button>
              </div>
            `
                : ""
            }
          </div>
        `;
      } else {
        heroSpotlightEl.innerHTML = `<p class="text-sm text-gray-500">Belum ada tulisan tayang untuk disorot.</p>`;
      }
    }

    // Active section heading (tanpa tab duplikat)
    if (sectionHeaderEl) {
      const activeMeta = TAB_META[resolvedTab] || { label: "Konten", hasCount: false };
      sectionHeaderEl.innerHTML = `
        <h2 class="font-theme-display text-2xl sm:text-[1.7rem] font-medium text-[#1F2937]">${escapeHtml(activeMeta.label)}</h2>
        <span class="text-xs sm:text-sm text-gray-500 tabular-nums">
          ${activeMeta.hasCount ? `${counts[resolvedTab] || 0} materi` : "Forum Terbuka"}
        </span>
      `;
    }

    // Tab panel
    if (tabContentEl) {
      tabContentEl.innerHTML = buildTabPanelHtml(siteData, resolvedTab, searchQuery, false, false);
      if (resolvedTab === "diskusi") {
        mountGiscusInto(tabContentEl, siteData);
      }
    }
  }

  function buildTabPanelHtml(siteData, tabKey, searchQuery, includeDrafts, isPreview) {
    switch (tabKey) {
      case "tulisan":
        return buildTulisanHtml(siteData, searchQuery, includeDrafts);
      case "ebook":
        return buildEbookHtml(siteData, searchQuery, includeDrafts);
      case "flyer":
        return buildFlyerHtml(siteData, searchQuery, includeDrafts);
      case "audio":
        return buildAudioHtml(siteData, searchQuery, includeDrafts);
      case "video":
        return buildVideoHtml(siteData, searchQuery, includeDrafts);
      case "diskusi":
        return buildDiskusiHtml(siteData, isPreview);
      default:
        return buildTulisanHtml(siteData, searchQuery, includeDrafts);
    }
  }

  // --------------------------------------------------------------------------
  // Modal Baca Artikel & Lightbox Flyer
  // --------------------------------------------------------------------------
  const modalEls = {
    articleModal: document.getElementById("article-modal"),
    articleScroll: document.getElementById("modal-article-scroll"),
    articleProgress: document.getElementById("modal-read-progress"),
    articleMeta: document.getElementById("modal-article-meta"),
    articleTitle: document.getElementById("modal-article-title"),
    articleBody: document.getElementById("modal-article-body"),
    articleClose: document.getElementById("modal-article-close"),
    articleWa: document.getElementById("modal-wa-share"),
    articleCopy: document.getElementById("modal-copy-link"),
    articleCopyLabel: document.getElementById("modal-copy-label"),
    fontButtons: Array.from(document.querySelectorAll(".font-size-btn")),
    lightboxModal: document.getElementById("lightbox-modal"),
    lightboxImg: document.getElementById("lightbox-img"),
    lightboxTitle: document.getElementById("lightbox-title"),
    lightboxMeta: document.getElementById("lightbox-meta"),
    lightboxCaption: document.getElementById("lightbox-caption"),
    lightboxClose: document.getElementById("lightbox-close"),
    lightboxDownload: document.getElementById("lightbox-download"),
  };

  function applyArticleFontSize(sizeKey) {
    state.fontSize = sizeKey;
    localStorage.setItem("catatan_teduh_font_size", sizeKey);
    const sizeClasses = {
      sm: "text-[15px] leading-[1.75]",
      md: "text-[17px] leading-[1.82]",
      lg: "text-[20px] leading-[1.85]",
    };
    modalEls.articleBody.className = `font-prose text-[#1F2937] space-y-5 ${
      sizeClasses[sizeKey] || sizeClasses.md
    }`;

    modalEls.fontButtons.forEach((btn) => {
      const active = btn.dataset.fontSize === sizeKey;
      btn.classList.toggle("theme-bg-accent", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("text-gray-600", !active);
    });
  }

  function updateReadingProgress() {
    if (!modalEls.articleScroll || !modalEls.articleProgress) return;
    const { scrollTop, scrollHeight, clientHeight } = modalEls.articleScroll;
    const max = scrollHeight - clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((scrollTop / max) * 100)) : 100;
    modalEls.articleProgress.style.width = `${pct}%`;
  }

  function openArticleModal(articleId) {
    const src = state.currentData || window.SITE_DATA;
    const item = (src.tulisan || []).find((t) => t.id === articleId);
    if (!item) return;

    state.activeArticle = item;
    modalEls.articleMeta.innerHTML = `
      <span class="font-semibold theme-text-accent">${escapeHtml(item.kategori)}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(item.tanggal)}</span>
      <span aria-hidden="true">·</span>
      <span class="tabular-nums">${escapeHtml(item.waktuBaca)}</span>
    `;
    const titleDir = detectTextDirection(item.judul);
    modalEls.articleTitle.setAttribute("dir", titleDir);
    modalEls.articleTitle.classList.toggle("text-right", titleDir === "rtl");
    modalEls.articleTitle.innerHTML = formatRichInlineHtml(item.judul, src);

    const paragraphs = Array.isArray(item.isi) ? item.isi : [item.ringkasan];
    modalEls.articleBody.innerHTML = paragraphs
      .map((p, idx) => {
        const pDir = detectTextDirection(p);
        const cls =
          pDir === "rtl"
            ? "text-right leading-[2.15]"
            : idx === 0
            ? "prose-dropcap"
            : "";
        return `<p dir="${pDir}" class="${cls}">${formatRichLinesHtml(p, src)}</p>`;
      })
      .join("");

    const shareText = `${stripRichTags(item.judul)}\n\n${stripRichTags(item.ringkasan)}\n\nBaca selengkapnya di: ${window.location.href}`;
    modalEls.articleWa.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    if (modalEls.articleCopyLabel) modalEls.articleCopyLabel.textContent = "Salin Teks";

    applyArticleFontSize(state.fontSize);
    modalEls.articleModal.classList.remove("hidden");
    if (modalEls.articleScroll) modalEls.articleScroll.scrollTop = 0;
    updateReadingProgress();
    document.body.style.overflow = "hidden";
    modalEls.articleClose.focus();
  }

  function closeArticleModal() {
    modalEls.articleModal.classList.add("hidden");
    document.body.style.overflow = "";
    state.activeArticle = null;
  }

  function openLightbox(flyerId) {
    const src = state.currentData || window.SITE_DATA;
    const item = (src.flyer || []).find((f) => f.id === flyerId);
    if (!item) return;

    state.activeFlyer = item;
    modalEls.lightboxImg.src = item.gambar;
    modalEls.lightboxImg.alt = stripRichTags(item.judul);
    const titleDir = detectTextDirection(item.judul);
    modalEls.lightboxTitle.setAttribute("dir", titleDir);
    modalEls.lightboxTitle.innerHTML = formatRichInlineHtml(item.judul, src);
    modalEls.lightboxMeta.textContent = `${item.tema} · ${item.tanggal}`;
    const capDir = detectTextDirection(item.nasihat);
    modalEls.lightboxCaption.setAttribute("dir", capDir);
    modalEls.lightboxCaption.classList.toggle("text-right", capDir === "rtl");
    modalEls.lightboxCaption.innerHTML = formatRichLinesHtml(item.nasihat, src);
    modalEls.lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    modalEls.lightboxClose.focus();
  }

  function closeLightbox() {
    modalEls.lightboxModal.classList.add("hidden");
    document.body.style.overflow = "";
    state.activeFlyer = null;
  }

  // --------------------------------------------------------------------------
  // Binding Interaksi Publik & Delegasi Global
  // --------------------------------------------------------------------------
  function closeMobileDrawer() {
    const mobileDrawer = document.getElementById("mobile-nav-drawer");
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    if (mobileDrawer) mobileDrawer.classList.add("hidden");
    if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
  }

  function switchPublicTab(tabKey, shouldScroll) {
    state.activeTab = tabKey;
    closeMobileDrawer();
    renderSiteInto(document, state.currentData || window.SITE_DATA, {
      includeDrafts: false,
      activeTab: state.activeTab,
      searchQuery: state.searchQuery,
      isPreview: false,
    });
    if (shouldScroll) {
      const target = document.getElementById("konten-utama");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function bindPublicEvents() {
    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear");
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mobileNavDrawer = document.getElementById("mobile-nav-drawer");

    if (mobileMenuToggle && mobileNavDrawer) {
      mobileMenuToggle.addEventListener("click", () => {
        const isHidden = mobileNavDrawer.classList.toggle("hidden");
        mobileMenuToggle.setAttribute("aria-expanded", isHidden ? "false" : "true");
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        renderSiteInto(document, state.currentData || window.SITE_DATA, {
          includeDrafts: false,
          activeTab: state.activeTab,
          searchQuery: state.searchQuery,
          isPreview: false,
        });
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener("click", () => {
        state.searchQuery = "";
        searchInput.value = "";
        renderSiteInto(document, state.currentData || window.SITE_DATA, {
          includeDrafts: false,
          activeTab: state.activeTab,
          searchQuery: "",
          isPreview: false,
        });
        searchInput.focus();
      });
    }

    // Delegasi klik pada halaman publik
    const publicWrapper = document.getElementById("public-site-wrapper");
    if (publicWrapper) {
      publicWrapper.addEventListener("click", (e) => {
        const tabBtn = e.target.closest("[data-tab]");
        if (tabBtn) {
          switchPublicTab(tabBtn.dataset.tab, false);
          return;
        }
        const navBtn = e.target.closest("[data-nav-tab]");
        if (navBtn) {
          switchPublicTab(navBtn.dataset.navTab, true);
          return;
        }
        const footerBtn = e.target.closest("[data-footer-tab]");
        if (footerBtn) {
          switchPublicTab(footerBtn.dataset.footerTab, true);
          return;
        }
        const jumpBtn = e.target.closest("[data-jump-tab]");
        if (jumpBtn) {
          switchPublicTab(jumpBtn.dataset.jumpTab, true);
          return;
        }
        if (e.target.closest("#btn-cta-diskusi")) {
          switchPublicTab("diskusi", true);
          return;
        }
        const readBtn = e.target.closest("[data-read-article]");
        if (readBtn) {
          openArticleModal(readBtn.dataset.readArticle);
          return;
        }
        const flyerBtn = e.target.closest("[data-open-flyer]");
        if (flyerBtn) {
          openLightbox(flyerBtn.dataset.openFlyer);
          return;
        }
        const dlBtn = e.target.closest("[data-download-url]");
        if (dlBtn) {
          downloadAsset(dlBtn.dataset.downloadUrl, dlBtn.dataset.downloadName);
          return;
        }
        if (e.target.closest('[data-action="reset-search"]') && searchInput) {
          state.searchQuery = "";
          searchInput.value = "";
          switchPublicTab(state.activeTab, false);
        }
      });
    }

    // Modal Baca & Lightbox Events
    modalEls.fontButtons.forEach((btn) => {
      btn.addEventListener("click", () => applyArticleFontSize(btn.dataset.fontSize));
    });
    if (modalEls.articleScroll) {
      modalEls.articleScroll.addEventListener("scroll", updateReadingProgress);
    }
    if (modalEls.articleCopy) {
      modalEls.articleCopy.addEventListener("click", async () => {
        if (!state.activeArticle) return;
        const txt = `${stripRichTags(state.activeArticle.judul)}\n\n${(state.activeArticle.isi || []).map(stripRichTags).join("\n\n")}`;
        try {
          await navigator.clipboard.writeText(txt);
          if (modalEls.articleCopyLabel) modalEls.articleCopyLabel.textContent = "Tersalin";
          setTimeout(() => {
            if (modalEls.articleCopyLabel) modalEls.articleCopyLabel.textContent = "Salin Teks";
          }, 1800);
        } catch (_e) {}
      });
    }
    modalEls.articleClose.addEventListener("click", closeArticleModal);
    modalEls.articleModal.addEventListener("click", (e) => {
      if (e.target === modalEls.articleModal) closeArticleModal();
    });

    modalEls.lightboxClose.addEventListener("click", closeLightbox);
    modalEls.lightboxModal.addEventListener("click", (e) => {
      if (e.target === modalEls.lightboxModal) closeLightbox();
    });
    modalEls.lightboxDownload.addEventListener("click", () => {
      if (state.activeFlyer) {
        downloadAsset(
          state.activeFlyer.gambar,
          state.activeFlyer.namaFileUnduh || "flyer-nasihat.jpg"
        );
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modalEls.articleModal.classList.contains("hidden")) closeArticleModal();
        if (!modalEls.lightboxModal.classList.contains("hidden")) closeLightbox();
      }
      if (
        e.key === "/" &&
        searchInput &&
        document.activeElement !== searchInput &&
        modalEls.articleModal.classList.contains("hidden") &&
        modalEls.lightboxModal.classList.contains("hidden") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement || {}).tagName)
      ) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Migrasi Aman & Normalisasi Skema (Menjaga Konten Lama Saat Fitur Baru Rilis)
  // --------------------------------------------------------------------------
  const DEFAULT_SITE_SCHEMA = {
    tampilan: {
      warnaAksen: "emerald",
      jenisFont: "editorial",
      gayaKartu: "halus",
      tampilkanSorotan: true,
      tampilkanPencarian: true,
      tabAktif: ["tulisan", "ebook", "flyer", "audio", "video", "diskusi"],
      koleksiFont: BUILTIN_FONT_COLLECTION,
    },
    profil: {
      namaWebsite: "Catatan Teduh",
      kicker: "Ruang Berbagi Ilmu · Edisi Terbuka",
      judulUtama: "Menghimpun Cahaya Ilmu untuk Langkah yang Lebih Tenang",
      subjudul: "— ruang berbagi ilmu & nasihat kehidupan —",
      deskripsi: "",
      namaPemilik: "Admin",
      emailAdmin: "benyaqub@gmail.com",
      tahunHakCipta: "2026",
    },
    giscus: {
      repo: "N45hrY4qub/catatanteduh",
      repoId: "R_kgDOV1DaVg",
      category: "General",
      categoryId: "DIC_kwDOV1DaVs4DLjdL",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "bottom",
      theme: "preferred_color_scheme",
      lang: "id",
    },
  };

  function normalizeSiteData(rawData) {
    const src = rawData && typeof rawData === "object" ? deepClone(rawData) : {};
    const tampilan = { ...DEFAULT_SITE_SCHEMA.tampilan, ...(src.tampilan || {}) };
    if (!Array.isArray(tampilan.tabAktif) || !tampilan.tabAktif.length) {
      tampilan.tabAktif = [...DEFAULT_SITE_SCHEMA.tampilan.tabAktif];
    }
    tampilan.koleksiFont = getFontCollection({ tampilan });

    const profil = { ...DEFAULT_SITE_SCHEMA.profil, ...(src.profil || {}) };
    const giscus = { ...DEFAULT_SITE_SCHEMA.giscus, ...(src.giscus || {}) };

    return {
      ...src,
      tampilan,
      profil,
      giscus,
      tulisan: Array.isArray(src.tulisan) ? src.tulisan : [],
      ebook: Array.isArray(src.ebook) ? src.ebook : [],
      flyer: Array.isArray(src.flyer) ? src.flyer : [],
      audio: Array.isArray(src.audio) ? src.audio : [],
      video: Array.isArray(src.video) ? src.video : [],
    };
  }

  // --------------------------------------------------------------------------
  // Pengambilan Data Terbaru dari Server (Anti-Cache untuk Semua Browser)
  // --------------------------------------------------------------------------
  async function fetchFreshSiteData() {
    const bust = Date.now();
    const candidates = [`/data.json?t=${bust}`, `/public/data.json?t=${bust}`];

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (json && (json.profil || Array.isArray(json.tulisan))) {
          return normalizeSiteData(json);
        }
      } catch (_err) {
        // Coba kandidat URL berikutnya
      }
    }
    return null;
  }

  // Ekspos API bersih untuk Studio Builder
  window.CatatanTeduhApp = {
    THEME_PALETTES,
    FONT_PRESETS,
    R2_FONT_BASE_URL,
    BUILTIN_FONT_COLLECTION,
    TAB_META,
    deepClone,
    escapeHtml,
    stripRichTags,
    resolveR2FontUrl,
    getFontCollection,
    syncDynamicFonts,
    detectTextDirection,
    formatRichInlineHtml,
    normalizeSiteData,
    renderSiteInto,
    openArticleModal,
    openLightbox,
    downloadAsset,
    applyThemeVariables,
    fetchFreshSiteData,
  };

  // Jalankan inisialisasi awal halaman publik (fallback data.js lalu sinkronisasi data.json terbaru)
  const initialData = normalizeSiteData(window.SITE_DATA || {});
  window.SITE_DATA = deepClone(initialData);
  bindPublicEvents();
  renderSiteInto(document, initialData, {
    includeDrafts: false,
    activeTab: state.activeTab,
    searchQuery: "",
    isPreview: false,
  });

  fetchFreshSiteData().then((freshData) => {
    if (!freshData) return;
    window.SITE_DATA = deepClone(freshData);
    window.dispatchEvent(new CustomEvent("catatanteduh:data-loaded", { detail: freshData }));
    if (!localStorage.getItem("catatan_teduh_studio_draft_v1")) {
      renderSiteInto(document, freshData, {
        includeDrafts: false,
        activeTab: state.activeTab,
        searchQuery: state.searchQuery,
        isPreview: false,
      });
    }
  });
})();
