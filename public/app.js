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
      nama: "Uthmanic Hafs v22",
      sumber: "r2",
      family: "UthmanicHafsR2",
      url: "https://pub-56b30f3515324b2880e9b93466b7716d.r2.dev/font/uthmanic_hafs_v22.woff2",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "amiri-quran",
      nama: "Amiri Quran",
      sumber: "google",
      family: "Amiri Quran",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "amiri",
      nama: "Amiri",
      sumber: "google",
      family: "Amiri",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "scheherazade-new",
      nama: "Scheherazade New",
      sumber: "google",
      family: "Scheherazade New",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "noto-naskh-arabic",
      nama: "Noto Naskh Arabic",
      sumber: "google",
      family: "Noto Naskh Arabic",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "readex-pro",
      nama: "Readex Pro",
      sumber: "google",
      family: "Readex Pro",
      kategori: "arab",
      builtin: true,
    },
    {
      id: "fraunces",
      nama: "Fraunces",
      sumber: "google",
      family: "Fraunces",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "plus-jakarta-sans",
      nama: "Plus Jakarta Sans",
      sumber: "google",
      family: "Plus Jakarta Sans",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "source-serif-4",
      nama: "Source Serif 4",
      sumber: "google",
      family: "Source Serif 4",
      kategori: "latin",
      builtin: true,
    },
    {
      id: "lora",
      nama: "Lora",
      sumber: "google",
      family: "Lora",
      kategori: "latin",
      builtin: true,
    },
  ];

  const MEDIA_TAB_KEYS = ["tulisan", "ebook", "flyer", "audio", "video"];

  const DEFAULT_CONTENT_CATEGORIES = [
    { nama: "Aqidah", deskripsi: "Pokok keimanan, tauhid, dan pengenalan kepada Allah." },
    { nama: "Fiqh", deskripsi: "Panduan hukum ibadah, muamalah, dan keseharian." },
    { nama: "Hadits", deskripsi: "Penjelasan riwayat nabawi dan hikmah sunnah." },
    { nama: "Tazkiyatun Nafs", deskripsi: "Penyucian jiwa, adab hati, dan muhasabah diri." },
    { nama: "Bahasa Arab", deskripsi: "Kaidah nahwu, shorf, dan pemahaman teks Arab." },
    { nama: "Tajwid", deskripsi: "Makhraj huruf, sifat bacaan, dan tartil Al-Qur'an." },
    { nama: "Ilmu Qiroah", deskripsi: "Ragam qira'at mutawatirah dan sejarah periwayatannya." },
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
    activeTab: "beranda",
    activeCategory: "all",
    categoryViewMode: "grouped", // "grouped" | "grid"
    searchQuery: "",
    fontSize: localStorage.getItem("catatan_teduh_font_size") || "md",
    readerMode: localStorage.getItem("catatan_teduh_reader_mode") === "book" ? "book" : "scroll",
    bookSpread: localStorage.getItem("catatan_teduh_book_spread") === "2" ? 2 : 1,
    bookPages: [],
    bookToc: [],
    bookCurrentPage: 0,
    bookTurnDir: "",
    articleBlocks: [],
    tocOpen: false,
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

  function cleanFontDisplayName(name) {
    return String(name || "")
      .replace(/\s*\([^)]*\)\s*$/g, "")
      .trim();
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
        const builtinItem = byId.get(f.id);
        const cleanNama = builtinItem
          ? builtinItem.nama
          : cleanFontDisplayName(f.nama) || f.family;
        byId.set(f.id, {
          ...f,
          nama: cleanNama,
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

  function sanitizeRichLinkUrl(rawUrl) {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return "";
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed) || /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return "";
  }

  function sanitizeRichColor(rawColor) {
    const val = String(rawColor || "").trim();
    if (!val) return "";
    const hex3 = val.match(/^#([0-9a-f]{3})$/i);
    if (hex3) {
      const s = hex3[1].toLowerCase();
      return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
    }
    const hex6 = val.match(/^#([0-9a-f]{6})$/i);
    if (hex6) {
      return `#${hex6[1].toLowerCase()}`;
    }
    const rgb = val.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i);
    if (rgb) {
      const toHex = (n) => Math.max(0, Math.min(255, parseInt(n, 10) || 0)).toString(16).padStart(2, "0");
      return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
    }
    return "";
  }

  function normalizeIndentLevel(rawVal) {
    const str = String(rawVal === undefined || rawVal === null ? "" : rawVal).replace(",", ".").trim();
    if (!str) return 0;
    const num = parseFloat(str);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const clamped = Math.min(4, Math.max(0, num));
    return Math.round(clamped * 100) / 100;
  }

  function normalizeIndentMode(rawMode) {
    const m = String(rawMode || "").trim().toLowerCase();
    if (m === "first" || m === "hanging") return m;
    return "all";
  }

  function stripRichTags(str) {
    return String(str || "")
      .replace(/\[page\]/gi, "")
      .replace(/\[(?:font|arab)(?:=[a-z0-9-]+)?(?:\s+size=\d{1,3})?\]/gi, "")
      .replace(/\[\/(?:font|arab)\]/gi, "")
      .replace(/\[(?:b|i|u|s|h2|quote|ul|ol)\]/gi, "")
      .replace(/\[\/(?:b|i|u|s|h2|quote|ul|ol)\]/gi, "")
      .replace(/\[color=[^\]]+\]/gi, "")
      .replace(/\[\/color\]/gi, "")
      .replace(/\[align=(?:left|center|right|justify)\]/gi, "")
      .replace(/\[\/align\]/gi, "")
      .replace(/\[indent=[0-4](?:\.\d+)?(?:\s+mode=(?:all|first|hanging))?\]/gi, "")
      .replace(/\[\/indent\]/gi, "")
      .replace(/<\/?(?:blockquote|h2)[^>]*>/gi, "")
      .replace(/\[url=[^\]]+\]/gi, "")
      .replace(/\[\/url\]/gi, "");
  }

  function parseRichBlockMeta(rawBlock) {
    let text = String(rawBlock || "").trim();
    if (/^\[page\]$/i.test(text)) {
      return {
        isPageBreak: true,
        isHeading: false,
        isQuote: false,
        listType: "",
        align: "",
        indent: 0,
        indentMode: "all",
        inner: "",
      };
    }

    let isHeading = false;
    let isQuote = false;
    let listType = "";
    let align = "";
    let indent = 0;
    let indentMode = "all";
    let changed = true;

    while (changed && text) {
      changed = false;
      let m;
      if ((m = text.match(/^\[(ul|ol)\]([\s\S]*)\[\/\1\]$/i))) {
        if (!listType) listType = m[1].toLowerCase();
        text = m[2].trim();
        changed = true;
      } else if ((m = text.match(/^\[h2\]([\s\S]*)\[\/h2\]$/i))) {
        isHeading = true;
        isQuote = false;
        text = m[1].trim();
        changed = true;
      } else if ((m = text.match(/^<h2[^>]*>([\s\S]*)<\/h2>$/i))) {
        isHeading = true;
        isQuote = false;
        text = m[1].trim();
        changed = true;
      } else if ((m = text.match(/^\[quote\]([\s\S]*)\[\/quote\]$/i))) {
        if (!isHeading) isQuote = true;
        text = m[1].trim();
        changed = true;
      } else if ((m = text.match(/^<blockquote[^>]*>([\s\S]*)<\/blockquote>$/i))) {
        if (!isHeading) isQuote = true;
        text = m[1].trim();
        changed = true;
      } else if ((m = text.match(/^\[align=(left|center|right|justify)\]([\s\S]*)\[\/align\]$/i))) {
        if (!align) align = m[1].toLowerCase();
        text = m[2].trim();
        changed = true;
      } else if ((m = text.match(/^\[indent=([0-4](?:\.\d+)?)(?:\s+mode=(all|first|hanging))?\]([\s\S]*)\[\/indent\]$/i))) {
        if (!indent) {
          indent = normalizeIndentLevel(m[1]);
          indentMode = normalizeIndentMode(m[2]);
        }
        text = m[3].trim();
        changed = true;
      }
    }

    return {
      isPageBreak: false,
      isHeading,
      isQuote: !isHeading && !listType && isQuote,
      listType,
      align,
      indent,
      indentMode,
      inner: text,
    };
  }

  function buildRichBlockStyle(meta) {
    const m = meta || {};
    const indent = normalizeIndentLevel(m.indent);
    if (indent <= 0) return "";
    return `--ct-indent-lv: ${indent};`;
  }

  function buildRichBlockClasses(meta, dir, isFirstNormalCandidate, dropCapEnabled) {
    const classes = [];
    const m = meta || {};
    if (m.isHeading && !m.listType) {
      classes.push("ct-subheading");
    } else if (m.isQuote && !m.listType) {
      classes.push("ct-blockquote");
    }
    if (m.align && ["left", "center", "right", "justify"].includes(m.align)) {
      classes.push(`ct-align-${m.align}`);
    } else if (dir === "rtl") {
      classes.push("text-right", "leading-[2.15]");
    }
    const indent = normalizeIndentLevel(m.indent);
    const indentMode = normalizeIndentMode(m.indentMode);
    if (indent > 0) {
      if (indentMode === "first") {
        classes.push("ct-indent-first");
      } else if (indentMode === "hanging") {
        classes.push("ct-indent-hanging");
      } else {
        classes.push("ct-indent");
        if (Number.isInteger(indent) && indent >= 1 && indent <= 4) {
          classes.push(`ct-indent-${indent}`);
        }
      }
    }
    const allowDropCap =
      Boolean(dropCapEnabled) &&
      Boolean(isFirstNormalCandidate) &&
      !m.isPageBreak &&
      !m.isHeading &&
      !m.isQuote &&
      !m.listType &&
      dir !== "rtl" &&
      m.align !== "center" &&
      m.align !== "right";
    if (allowDropCap) {
      classes.push("prose-dropcap");
    }
    return classes.join(" ");
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
    const rawStr = String(rawText || "");
    if (!rawStr) return "";
    const outerMeta = parseRichBlockMeta(rawStr);
    if (outerMeta.isPageBreak) return "";
    const hasOuterBlock =
      outerMeta.isHeading ||
      outerMeta.isQuote ||
      Boolean(outerMeta.listType) ||
      Boolean(outerMeta.align) ||
      outerMeta.indent > 0;
    const input = hasOuterBlock ? outerMeta.inner : rawStr;
    if (!input && !hasOuterBlock) return "";

    const fonts = getFontCollection(siteData || state.currentData || window.SITE_DATA || {});
    const fontMap = new Map(fonts.map((f) => [f.id, f]));
    const tagRegex =
      /\[(font|arab)(?:=([a-z0-9-]+))?(?:\s+size=(\d{1,3}))?\]([\s\S]*?)\[\/\1\]|\[(b|i|u|s)\]([\s\S]*?)\[\/\5\]|\[color=(#[0-9a-f]{3,6})\]([\s\S]*?)\[\/color\]|\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi;

    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        const plainPart = input.slice(lastIndex, match.index);
        result += wrapArabicRunsInEscaped(escapeHtml(plainPart));
      }

      if (match[5]) {
        const inlineTag = match[5].toLowerCase();
        const innerHtml = formatRichInlineHtml(match[6] || "", siteData);
        if (inlineTag === "b") {
          result += `<strong class="font-bold">${innerHtml}</strong>`;
        } else if (inlineTag === "i") {
          result += `<em class="italic">${innerHtml}</em>`;
        } else if (inlineTag === "u") {
          result += `<u class="underline underline-offset-2">${innerHtml}</u>`;
        } else if (inlineTag === "s") {
          result += `<s class="line-through">${innerHtml}</s>`;
        }
      } else if (match[7] !== undefined) {
        const safeColor = sanitizeRichColor(match[7]);
        const innerHtml = formatRichInlineHtml(match[8] || "", siteData);
        if (safeColor) {
          result += `<span style="color: ${escapeHtml(safeColor)};">${innerHtml}</span>`;
        } else {
          result += innerHtml;
        }
      } else if (match[9] !== undefined) {
        const decodedUrl = String(match[9] || "").replace(/%5D/gi, "]");
        const safeUrl = sanitizeRichLinkUrl(decodedUrl);
        const innerHtml = formatRichInlineHtml(match[10] || "", siteData);
        if (safeUrl) {
          result += `<a href="${escapeHtml(
            safeUrl
          )}" target="_blank" rel="noopener noreferrer" class="ct-rich-link underline underline-offset-2 theme-text-accent hover:opacity-80 transition-opacity">${innerHtml}</a>`;
        } else {
          result += innerHtml;
        }
      } else {
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
      }

      lastIndex = tagRegex.lastIndex;
    }

    if (lastIndex < input.length) {
      result += wrapArabicRunsInEscaped(escapeHtml(input.slice(lastIndex)));
    }

    if (hasOuterBlock) {
      const dir = detectTextDirection(input);
      const cls = buildRichBlockClasses(outerMeta, dir, false, false);
      const styleStr = buildRichBlockStyle(outerMeta);
      const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";
      if (outerMeta.listType === "ul" || outerMeta.listType === "ol") {
        const listTag = outerMeta.listType;
        return `<${listTag} dir="${dir}" class="ct-list ct-list-${listTag}"><li dir="${dir}"${cls ? ` class="${cls}"` : ""}${styleAttr}>${result}</li></${listTag}>`;
      }
      if (outerMeta.isHeading) {
        return `<h2 dir="${dir}" class="${cls}"${styleAttr}>${result}</h2>`;
      }
      const wrapTag = outerMeta.isQuote ? "blockquote" : "span";
      const extraBlockCls = outerMeta.isQuote ? "" : "block ";
      return `<${wrapTag} dir="${dir}" class="${extraBlockCls}${cls}"${styleAttr}>${result}</${wrapTag}>`;
    }

    return result;
  }

  function distributeMultilineRichTags(rawText) {
    let out = String(rawText || "");
    for (let pass = 0; pass < 3; pass += 1) {
      const next = out.replace(
        /\[(ul|ol|h2|quote|align|indent|font|arab|color|b|i|u|s|url)((?:=[^\]]+)?(?:\s+(?:size=\d{1,3}|mode=(?:all|first|hanging)))?)\]([\s\S]*?)\[\/\1\]/gi,
        (_full, tag, attrs, inner) => {
          if (!/[\r\n]/.test(inner)) return `[${tag}${attrs}]${inner}[/${tag}]`;
          return inner
            .split(/\r?\n/)
            .map((part) => (part ? `[${tag}${attrs}]${part}[/${tag}]` : ""))
            .join("\n");
        }
      );
      if (next === out) break;
      out = next;
    }
    return out;
  }

  function renderParsedRichLines(parsedLines, siteData, options) {
    const opts = options || {};
    const isArticle = Boolean(opts.isArticle);
    const isFirstParagraph = Boolean(opts.isFirstParagraph);
    const dropCapEnabled = Boolean(opts.dropCapEnabled);
    let olRunIndex = Number(opts.olStartOffset || 0);

    const htmlParts = [];
    let i = 0;
    while (i < parsedLines.length) {
      const item = parsedLines[i];
      if (item.isPageBreak) {
        olRunIndex = 0;
        if (isArticle) {
          htmlParts.push('<div class="ct-scroll-page-divider" aria-hidden="true"><span>Halaman Berikutnya</span></div>');
        }
        i += 1;
        continue;
      }

      if (item.listType === "ul" || item.listType === "ol") {
        const listTag = item.listType;
        const listItems = [];
        const startNum = listTag === "ol" ? olRunIndex + 1 : 0;
        while (i < parsedLines.length && !parsedLines[i].isPageBreak && parsedLines[i].listType === listTag) {
          const liMeta = parsedLines[i];
          const liDir = detectTextDirection(liMeta.inner);
          const liCls = buildRichBlockClasses(liMeta, liDir, false, false);
          const liStyle = buildRichBlockStyle(liMeta);
          const liStyleAttr = liStyle ? ` style="${escapeHtml(liStyle)}"` : "";
          const liInline = formatRichInlineHtml(liMeta.inner, siteData);
          listItems.push(
            `<li dir="${liDir}"${liCls ? ` class="${liCls}"` : ""}${liStyleAttr}>${liInline}</li>`
          );
          if (listTag === "ol") olRunIndex += 1;
          i += 1;
        }
        const firstListDir = detectTextDirection(item.inner);
        const startAttr = listTag === "ol" && startNum > 1 ? ` start="${startNum}"` : "";
        htmlParts.push(
          `<${listTag} dir="${firstListDir}"${startAttr} class="ct-list ct-list-${listTag}">${listItems.join("")}</${listTag}>`
        );
        continue;
      }

      olRunIndex = 0;
      const lineDir = detectTextDirection(item.inner);
      const cls = buildRichBlockClasses(
        item,
        lineDir,
        isFirstParagraph && i === 0,
        dropCapEnabled
      );
      const styleStr = buildRichBlockStyle(item);
      const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";
      const inlineHtml = formatRichInlineHtml(item.inner, siteData);
      if (item.isHeading) {
        htmlParts.push(`<h2 dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</h2>`);
      } else if (item.isQuote) {
        htmlParts.push(`<blockquote dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</blockquote>`);
      } else if (isArticle) {
        htmlParts.push(`<p dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</p>`);
      } else {
        htmlParts.push(`<span dir="${lineDir}" class="block ${cls}"${styleAttr}>${inlineHtml}</span>`);
      }
      i += 1;
    }

    return {
      html: htmlParts.join(""),
      trailingOlCount: olRunIndex,
    };
  }

  function formatRichLinesHtml(rawText, siteData) {
    const normalized = distributeMultilineRichTags(rawText);
    const lines = normalized.split(/\r?\n+/).filter((line) => line !== "");
    if (lines.length <= 1) {
      const single = lines[0] !== undefined ? lines[0] : normalized;
      return formatRichInlineHtml(single, siteData);
    }
    const parsedLines = lines.map((l) => parseRichBlockMeta(l));
    return renderParsedRichLines(parsedLines, siteData, { isArticle: false }).html;
  }

  function formatIndex(idx) {
    return String(idx + 1).padStart(2, "0");
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function slugifyCategory(name) {
    const slug = String(name || "umum")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "umum";
  }

  function normalizeCategoryEntries(rawList) {
    const seen = new Set();
    const out = [];
    (Array.isArray(rawList) ? rawList : []).forEach((entry) => {
      const nama =
        typeof entry === "string"
          ? entry.trim()
          : entry && typeof entry === "object"
          ? String(entry.nama || "").trim()
          : "";
      if (!nama) return;
      const key = nama.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const deskripsi =
        entry && typeof entry === "object" ? String(entry.deskripsi || "").trim() : "";
      out.push({ nama, deskripsi });
    });
    return out;
  }

  function getItemCategory(item, type) {
    if (!item || typeof item !== "object") return "Umum";
    const direct = String(item.kategori || "").trim();
    if (direct) return direct;
    if (type === "flyer") {
      const tema = String(item.tema || "").trim();
      if (tema) return tema;
    }
    return "Umum";
  }

  function getCategoryCollection(siteData, includeUsedFromItems) {
    const t = (siteData && siteData.tampilan) || {};
    const baseList = Array.isArray(t.kategoriMateri)
      ? normalizeCategoryEntries(t.kategoriMateri)
      : DEFAULT_CONTENT_CATEGORIES.map((c) => ({ ...c }));

    if (includeUsedFromItems === false) {
      return baseList;
    }

    const seen = new Set(baseList.map((c) => c.nama.toLowerCase()));
    const merged = [...baseList];

    MEDIA_TAB_KEYS.forEach((key) => {
      const items = Array.isArray(siteData && siteData[key]) ? siteData[key] : [];
      items.forEach((item) => {
        if (!item || item.status === "trash") return;
        const catName = getItemCategory(item, key);
        const low = catName.toLowerCase();
        if (!seen.has(low)) {
          seen.add(low);
          merged.push({ nama: catName, deskripsi: "" });
        }
      });
    });

    return merged;
  }

  function groupItemsByCategory(siteData, tabKey, items) {
    const masterList = getCategoryCollection(siteData, true);
    const metaByLower = new Map(masterList.map((c) => [c.nama.toLowerCase(), c]));
    const bucketsByLower = new Map();

    (Array.isArray(items) ? items : []).forEach((item) => {
      const catName = getItemCategory(item, tabKey);
      const low = catName.toLowerCase();
      if (!bucketsByLower.has(low)) {
        const meta = metaByLower.get(low);
        bucketsByLower.set(low, {
          nama: meta ? meta.nama : catName,
          slug: slugifyCategory(meta ? meta.nama : catName),
          deskripsi: meta ? meta.deskripsi : "",
          items: [],
        });
      }
      bucketsByLower.get(low).items.push(item);
    });

    const ordered = [];
    const consumed = new Set();

    masterList.forEach((c) => {
      const low = c.nama.toLowerCase();
      if (bucketsByLower.has(low) && !consumed.has(low)) {
        consumed.add(low);
        ordered.push(bucketsByLower.get(low));
      }
    });

    bucketsByLower.forEach((bucket, low) => {
      if (!consumed.has(low)) {
        ordered.push(bucket);
      }
    });

    return ordered;
  }

  function getCrossMediaMatches(siteData, categoryName, excludeTabKey, searchQuery, includeDrafts) {
    const target = String(categoryName || "").trim().toLowerCase();
    if (!target || target === "all") return [];

    const activeTabs = getActiveTabsList(siteData).filter(
      (k) => MEDIA_TAB_KEYS.includes(k) && k !== excludeTabKey
    );

    return activeTabs
      .map((k) => {
        const list = filterItems(siteData, k, searchQuery, includeDrafts);
        const count = list.filter((it) => getItemCategory(it, k).toLowerCase() === target).length;
        return {
          key: k,
          label: TAB_META[k].label,
          navLabel: TAB_META[k].navLabel,
          count,
        };
      })
      .filter((m) => m.count > 0);
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

  function buildCategoryToolbarAndContentHtml(siteData, tabKey, items, emptyLabel, query, includeDrafts, options, renderListFn) {
    if (!items.length) return buildEmptyHtml(emptyLabel, query);

    const opts = options || {};
    const buckets = groupItemsByCategory(siteData, tabKey, items);
    const requestedCat = String(opts.activeCategory || "all").trim();
    const matchedBucket =
      requestedCat && requestedCat.toLowerCase() !== "all"
        ? buckets.find((b) => b.nama.toLowerCase() === requestedCat.toLowerCase()) || null
        : null;
    const resolvedCategory = matchedBucket ? matchedBucket.nama : "all";
    const viewMode = opts.categoryViewMode === "grid" ? "grid" : "grouped";

    // Ide 1: Bar filter kategori editorial + pengalih mode tampilan
    const filterButtonsHtml = `
      <button
        type="button"
        data-filter-category="all"
        class="px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 tabular-nums ${
          resolvedCategory === "all"
            ? "theme-bg-accent text-white border-transparent shadow-xs"
            : "bg-white text-gray-600 border-stone-200/90 hover:text-[#1F2937] hover:border-stone-300"
        }"
      >
        Semua <span class="opacity-80">(${items.length})</span>
      </button>
      ${buckets
        .map((b) => {
          const isActive = resolvedCategory !== "all" && b.nama.toLowerCase() === resolvedCategory.toLowerCase();
          return `
            <button
              type="button"
              data-filter-category="${escapeHtml(b.nama)}"
              class="px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                isActive
                  ? "theme-bg-accent text-white border-transparent shadow-xs"
                  : "bg-white text-gray-600 border-stone-200/90 hover:text-[#1F2937] hover:border-stone-300"
              }"
            >
              ${escapeHtml(b.nama)} <span class="opacity-75">(${b.items.length})</span>
            </button>
          `;
        })
        .join("")}
    `;

    const viewSwitchHtml = `
      <div class="inline-flex items-center p-1 bg-[#F3F1EC] border border-stone-200/80 rounded-xl shrink-0" role="group" aria-label="Mode tampilan kelompok materi">
        <button
          type="button"
          data-category-view="grouped"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            viewMode === "grouped"
              ? "bg-white text-[#1F2937] shadow-xs"
              : "text-gray-600 hover:text-[#1F2937]"
          }"
        >
          Per Kelompok
        </button>
        <button
          type="button"
          data-category-view="grid"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            viewMode === "grid"
              ? "bg-white text-[#1F2937] shadow-xs"
              : "text-gray-600 hover:text-[#1F2937]"
          }"
        >
          Ringkas
        </button>
      </div>
    `;

    const toolbarHtml = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 flex-wrap">
          ${filterButtonsHtml}
        </div>
        ${viewSwitchHtml}
      </div>
    `;

    // Ide 4: Hubungan Lintas Format Media untuk kategori yang sedang dipilih
    let crossMediaHtml = "";
    if (resolvedCategory !== "all") {
      const crossMatches = getCrossMediaMatches(siteData, resolvedCategory, tabKey, query, includeDrafts);
      if (crossMatches.length) {
        crossMediaHtml = `
          <div class="mb-7 bg-[#F3F1EC]/90 border border-stone-200/85 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs sm:text-sm text-gray-600">
              Topik <strong class="font-semibold text-[#1F2937]">${escapeHtml(resolvedCategory)}</strong> tersedia juga di format lain:
            </p>
            <div class="flex flex-wrap items-center gap-2">
              ${crossMatches
                .map(
                  (m) => `
                <button
                  type="button"
                  data-cross-tab="${escapeHtml(m.key)}"
                  data-cross-category="${escapeHtml(resolvedCategory)}"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-50 theme-text-accent border border-stone-200/90 rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums"
                >
                  <span>${escapeHtml(m.navLabel)}</span>
                  <span class="opacity-75">(${m.count})</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }
    }

    // Ide 2: Indeks Lompat Cepat ketika mode Per Kelompok & menampilkan lebih dari 1 kategori
    let quickJumpHtml = "";
    if (viewMode === "grouped" && resolvedCategory === "all" && buckets.length > 1) {
      quickJumpHtml = `
        <nav aria-label="Daftar kategori" class="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 pb-3 border-b border-stone-200/60">
          <span class="font-medium text-gray-400">Daftar topik:</span>
          ${buckets
            .map(
              (b, idx) => `
            <button
              type="button"
              data-jump-category="${escapeHtml(b.slug)}"
              class="inline-flex items-baseline gap-1.5 text-gray-600 hover:theme-text-accent transition-colors whitespace-nowrap shrink-0 py-0.5"
            >
              <span class="font-theme-display text-[11px] text-stone-400 tabular-nums">${formatIndex(idx)}</span>
              <span class="font-medium">${escapeHtml(b.nama)}</span>
            </button>
          `
            )
            .join('<span aria-hidden="true" class="text-stone-300">·</span>')}
        </nav>
      `;
    }

    // Konten utama: Mode Per Kelompok (Rak Bab) vs Mode Ringkas (Flat Grid/List)
    let bodyHtml = "";
    if (viewMode === "grouped") {
      const visibleBuckets = matchedBucket ? [matchedBucket] : buckets;
      bodyHtml = `
        <div class="space-y-12 panel-enter">
          ${visibleBuckets
            .map((b, bIdx) => {
              const displayIdx = matchedBucket ? buckets.indexOf(matchedBucket) : bIdx;
              return `
                <section id="cat-group-${escapeHtml(b.slug)}" class="scroll-mt-24">
                  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 mb-5 border-b border-stone-200/75">
                    <div>
                      <div class="flex items-baseline gap-2.5">
                        <span class="font-theme-display text-sm text-stone-400 tabular-nums">${formatIndex(displayIdx)}</span>
                        <h3 class="font-theme-display text-lg sm:text-xl font-medium text-[#1F2937]">${escapeHtml(b.nama)}</h3>
                      </div>
                      ${
                        b.deskripsi
                          ? `<p class="text-xs sm:text-sm text-gray-500 mt-1">${escapeHtml(b.deskripsi)}</p>`
                          : ""
                      }
                    </div>
                    <span class="text-xs text-gray-500 tabular-nums shrink-0">${b.items.length} materi</span>
                  </div>
                  ${renderListFn(b.items)}
                </section>
              `;
            })
            .join("")}
        </div>
      `;
    } else {
      const visibleItems = matchedBucket ? matchedBucket.items : items;
      bodyHtml = renderListFn(visibleItems);
    }

    return `${toolbarHtml}${crossMediaHtml}${quickJumpHtml}${bodyHtml}`;
  }

  function buildTulisanHtml(siteData, query, includeDrafts, options) {
    const items = filterItems(siteData, "tulisan", query, includeDrafts);
    const renderCards = (chunk) => {
      const cards = chunk
        .map((item, idx) => {
          const cat = getItemCategory(item, "tulisan");
          return `
        <article class="group site-card rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:-translate-y-0.5">
          <div>
            <div class="flex items-center justify-between gap-4 mb-5">
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span class="font-semibold theme-text-accent">${escapeHtml(cat)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(item.tanggal)}</span>
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
      `;
        })
        .join("");
      return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
    };

    return buildCategoryToolbarAndContentHtml(siteData, "tulisan", items, "tulisan", query, includeDrafts, options, renderCards);
  }

  function buildEbookHtml(siteData, query, includeDrafts, options) {
    const items = filterItems(siteData, "ebook", query, includeDrafts);
    const renderCards = (chunk) => {
      const cards = chunk
        .map((item) => {
          const cat = getItemCategory(item, "ebook");
          return `
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
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1.5">
                <span class="font-semibold theme-text-accent">${escapeHtml(cat)}</span>
                <span aria-hidden="true">·</span>
                <span>Oleh ${escapeHtml(item.penulis)} · ${escapeHtml(item.tahun)}</span>
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
      `;
        })
        .join("");
      return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
    };

    return buildCategoryToolbarAndContentHtml(siteData, "ebook", items, "ebook", query, includeDrafts, options, renderCards);
  }

  function buildFlyerHtml(siteData, query, includeDrafts, options) {
    const items = filterItems(siteData, "flyer", query, includeDrafts);
    const renderCards = (chunk) => {
      const cards = chunk
        .map((item) => {
          const cat = getItemCategory(item, "flyer");
          const tema = String(item.tema || "").trim();
          const showTema = tema && tema.toLowerCase() !== cat.toLowerCase();
          return `
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
                <span class="font-semibold theme-text-accent">${escapeHtml(cat)}</span>
                ${showTema ? `<span aria-hidden="true">·</span><span>${escapeHtml(tema)}</span>` : ""}
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
      `;
        })
        .join("");
      return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl panel-enter">${cards}</div>`;
    };

    return buildCategoryToolbarAndContentHtml(siteData, "flyer", items, "flyer nasihat", query, includeDrafts, options, renderCards);
  }

  function buildAudioHtml(siteData, query, includeDrafts, options) {
    const items = filterItems(siteData, "audio", query, includeDrafts);
    const renderCards = (chunk) => {
      const list = chunk
        .map((item, idx) => {
          const cat = getItemCategory(item, "audio");
          const seri = String(item.seri || "").trim();
          const showSeri = seri && seri.toLowerCase() !== cat.toLowerCase();
          return `
        <article class="site-card rounded-2xl p-6 sm:p-7">
          <div class="flex items-start gap-4 sm:gap-5 mb-5">
            <div class="w-11 h-11 rounded-xl theme-bg-soft border theme-border-soft theme-text-accent font-theme-display text-base font-medium flex items-center justify-center shrink-0 tabular-nums">
              ${formatIndex(idx)}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1.5 tabular-nums">
                <span class="font-semibold theme-text-accent">${escapeHtml(cat)}</span>
                ${showSeri ? `<span aria-hidden="true">·</span><span>${escapeHtml(seri)}</span>` : ""}
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
      `;
        })
        .join("");
      return `<div class="space-y-5 max-w-3xl panel-enter">${list}</div>`;
    };

    return buildCategoryToolbarAndContentHtml(siteData, "audio", items, "audio kajian", query, includeDrafts, options, renderCards);
  }

  function buildVideoHtml(siteData, query, includeDrafts, options) {
    const items = filterItems(siteData, "video", query, includeDrafts);
    const renderCards = (chunk) => {
      const cards = chunk
        .map((item) => {
          const cat = getItemCategory(item, "video");
          return `
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
                <span class="font-semibold theme-text-accent">${escapeHtml(cat)}</span>
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
      `;
        })
        .join("");
      return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 panel-enter">${cards}</div>`;
    };

    return buildCategoryToolbarAndContentHtml(siteData, "video", items, "video", query, includeDrafts, options, renderCards);
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
    const activeCategory = opts.activeCategory !== undefined ? opts.activeCategory : state.activeCategory;
    const categoryViewMode = opts.categoryViewMode || state.categoryViewMode;
    const searchQuery = opts.searchQuery !== undefined ? opts.searchQuery : state.searchQuery;
    const isPreview = Boolean(opts.isPreview);
    const viewOpts = { activeCategory, categoryViewMode };

    state.currentData = siteData;
    applyThemeVariables(siteData.tampilan, siteData);

    const p = siteData.profil || {};
    const t = siteData.tampilan || {};
    const enabledTabs = getActiveTabsList(siteData);
    const resolvedTab =
      activeTab === "beranda"
        ? "beranda"
        : enabledTabs.includes(activeTab)
        ? activeTab
        : "beranda";
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
            resolvedTab === k ? "theme-text-accent border-current" : "border-transparent text-gray-600 hover:text-[#1F2937]"
          } transition-colors whitespace-nowrap shrink-0">
            ${escapeHtml(TAB_META[k].navLabel)}
          </button>
        `
        )
        .join("");

      const isBerandaPreview = resolvedTab === "beranda";
      const hasPreviewSearch = Boolean(searchQuery.trim());
      const tabPanelHtml = !isBerandaPreview
        ? buildTabPanelHtml(siteData, resolvedTab, searchQuery, includeDrafts, true, viewOpts)
        : hasPreviewSearch
        ? buildBerandaSearchHtml(siteData, searchQuery, includeDrafts, true)
        : "";
      const activeMeta = isBerandaPreview
        ? { label: "Hasil Pencarian", hasCount: false }
        : TAB_META[resolvedTab] || { label: "Konten", hasCount: false };

      containerEl.innerHTML = `
        <div class="min-h-full flex flex-col bg-[#FAF9F6] text-[#1F2937]">
          <header class="border-b border-stone-200/75 bg-[#FAF9F6]/90">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
              <button type="button" data-preview-tab="beranda" class="font-theme-display text-xl font-medium tracking-tight ${
                isBerandaPreview ? "theme-text-accent" : "text-[#1F2937] hover:opacity-80"
              } transition-colors whitespace-nowrap shrink-0">
                ${escapeHtml(p.namaWebsite || "Catatan Teduh")}
              </button>
              <nav class="hidden md:flex items-center gap-6 text-sm font-medium">${navHtml}</nav>
              ${
                enabledTabs.includes("diskusi")
                  ? `<button type="button" data-preview-tab="diskusi" class="px-4 py-2 text-sm font-medium text-white theme-bg-accent rounded-xl whitespace-nowrap shrink-0 ${
                      resolvedTab === "diskusi" ? "ring-2 ring-offset-2 ring-emerald-700/40" : ""
                    }">Ruang Diskusi</button>`
                  : `<span></span>`
              }
            </div>
          </header>

          <main class="flex-1">
            ${
              isBerandaPreview
                ? `
              <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-12 sm:pb-14">
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
            `
                : ""
            }

            ${
              !isBerandaPreview || hasPreviewSearch
                ? `
              <section class="max-w-6xl mx-auto px-4 sm:px-6 ${isBerandaPreview ? "" : "pt-8 sm:pt-10 "}pb-16">
                <div class="flex items-baseline justify-between gap-4 pb-4 mb-7 border-b border-stone-200/80">
                  <h2 class="font-theme-display text-2xl font-medium text-[#1F2937]">${escapeHtml(activeMeta.label)}</h2>
                  ${
                    isBerandaPreview
                      ? `<span class="text-xs sm:text-sm text-gray-500 tabular-nums">${totalMatches} hasil</span>`
                      : activeMeta.hasCount
                      ? `<span class="text-xs sm:text-sm text-gray-500 tabular-nums">${counts[resolvedTab] || 0} materi</span>`
                      : `<span class="text-xs sm:text-sm text-gray-500">Forum Terbuka</span>`
                  }
                </div>
                <div>${tabPanelHtml}</div>
              </section>
            `
                : ""
            }
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
    const berandaEl = document.getElementById("beranda");
    const kontenUtamaEl = document.getElementById("konten-utama");
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

    const isBeranda = resolvedTab === "beranda";

    if (brandEl) {
      brandEl.textContent = p.namaWebsite || "Catatan Teduh";
      brandEl.classList.toggle("theme-text-accent", isBeranda);
      brandEl.classList.toggle("text-[#1F2937]", !isBeranda);
      if (isBeranda) {
        brandEl.setAttribute("aria-current", "page");
      } else {
        brandEl.removeAttribute("aria-current");
      }
    }
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

    const hasSearch = Boolean(searchQuery.trim());
    if (searchStatusEl && searchClearEl && searchHintEl) {
      if (hasSearch) {
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
      const homeMobileBtn = `
        <button
          type="button"
          data-nav-tab="beranda"
          class="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors ${
            isBeranda
              ? "font-semibold theme-text-accent theme-bg-soft"
              : "font-medium text-gray-700 hover:bg-stone-200/50"
          }"
        >
          <span>${escapeHtml(p.namaWebsite || "Catatan Teduh")} (Beranda)</span>
        </button>
      `;
      mobileDrawerEl.innerHTML =
        homeMobileBtn +
        enabledTabs
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
      ctaDiskusiEl.classList.toggle("ring-2", resolvedTab === "diskusi");
      ctaDiskusiEl.classList.toggle("ring-offset-2", resolvedTab === "diskusi");
      ctaDiskusiEl.classList.toggle("ring-emerald-700/40", resolvedTab === "diskusi");
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
              <span class="text-xs text-gray-500">Oleh ${escapeHtml(p.namaPemilik || "Penulis")}</span>
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

    // Tampilkan Beranda murni tanpa section Tulisan/Ebook di bawahnya (kecuali saat ada pencarian aktif)
    if (berandaEl) {
      berandaEl.classList.toggle("hidden", !isBeranda);
    }

    const showContentSection = !isBeranda || hasSearch;
    if (kontenUtamaEl) {
      kontenUtamaEl.classList.toggle("hidden", !showContentSection);
      kontenUtamaEl.classList.toggle("pt-10", !isBeranda);
      kontenUtamaEl.classList.toggle("sm:pt-12", !isBeranda);
    }

    if (!showContentSection) {
      if (sectionHeaderEl) sectionHeaderEl.innerHTML = "";
      if (tabContentEl) tabContentEl.innerHTML = "";
      return;
    }

    // Active section heading
    if (sectionHeaderEl) {
      if (isBeranda) {
        sectionHeaderEl.innerHTML = `
          <div class="flex flex-wrap items-baseline gap-3">
            <h2 class="font-theme-display text-2xl sm:text-[1.7rem] font-medium text-[#1F2937]">Hasil Pencarian</h2>
            <button type="button" data-action="reset-search" class="text-xs font-medium theme-text-accent hover:underline">Hapus kata kunci</button>
          </div>
          <span class="text-xs sm:text-sm text-gray-500 tabular-nums">${totalMatches} materi cocok</span>
        `;
      } else {
        const activeMeta = TAB_META[resolvedTab] || { label: "Konten", hasCount: false };
        sectionHeaderEl.innerHTML = `
          <div class="flex flex-wrap items-baseline gap-3">
            <h2 class="font-theme-display text-2xl sm:text-[1.7rem] font-medium text-[#1F2937]">${escapeHtml(activeMeta.label)}</h2>
            ${
              hasSearch
                ? `<button type="button" data-action="reset-search" class="text-xs font-medium theme-text-accent hover:underline">Filter: "${escapeHtml(searchQuery.trim())}" · Reset</button>`
                : ""
            }
          </div>
          <span class="text-xs sm:text-sm text-gray-500 tabular-nums">
            ${activeMeta.hasCount ? `${counts[resolvedTab] || 0} materi` : "Forum Terbuka"}
          </span>
        `;
      }
    }

    // Tab panel
    if (tabContentEl) {
      if (isBeranda) {
        tabContentEl.innerHTML = buildBerandaSearchHtml(siteData, searchQuery, false, false);
      } else {
        tabContentEl.innerHTML = buildTabPanelHtml(siteData, resolvedTab, searchQuery, false, false, viewOpts);
        if (resolvedTab === "diskusi") {
          mountGiscusInto(tabContentEl, siteData);
        }
      }
    }
  }

  function buildBerandaSearchHtml(siteData, searchQuery, includeDrafts, isPreview) {
    const enabledMedia = getActiveTabsList(siteData).filter((k) => MEDIA_TAB_KEYS.includes(k));
    const sections = enabledMedia
      .map((k) => {
        const matches = filterItems(siteData, k, searchQuery, includeDrafts);
        if (!matches.length) return "";
        const navAttr = isPreview ? `data-preview-tab="${k}"` : `data-jump-tab="${k}"`;
        return `
          <section class="space-y-4">
            <div class="flex items-center justify-between gap-3 pb-2 border-b border-stone-200/70">
              <h3 class="font-theme-display text-lg font-medium text-[#1F2937]">
                ${escapeHtml(TAB_META[k].label)} <span class="text-xs font-sans text-gray-500 tabular-nums">(${matches.length})</span>
              </h3>
              <button type="button" ${navAttr} class="text-xs font-semibold theme-text-accent hover:underline shrink-0">
                Buka ${escapeHtml(TAB_META[k].navLabel)} &rarr;
              </button>
            </div>
            ${buildTabPanelHtml(siteData, k, searchQuery, includeDrafts, isPreview, { activeCategory: "all", categoryViewMode: "grid" })}
          </section>
        `;
      })
      .filter(Boolean);

    if (!sections.length) {
      return buildEmptyHtml("konten", searchQuery);
    }
    return `<div class="space-y-12 panel-enter">${sections.join("")}</div>`;
  }

  function buildTabPanelHtml(siteData, tabKey, searchQuery, includeDrafts, isPreview, options) {
    switch (tabKey) {
      case "tulisan":
        return buildTulisanHtml(siteData, searchQuery, includeDrafts, options);
      case "ebook":
        return buildEbookHtml(siteData, searchQuery, includeDrafts, options);
      case "flyer":
        return buildFlyerHtml(siteData, searchQuery, includeDrafts, options);
      case "audio":
        return buildAudioHtml(siteData, searchQuery, includeDrafts, options);
      case "video":
        return buildVideoHtml(siteData, searchQuery, includeDrafts, options);
      case "diskusi":
        return buildDiskusiHtml(siteData, isPreview);
      default:
        return buildTulisanHtml(siteData, searchQuery, includeDrafts, options);
    }
  }

  // --------------------------------------------------------------------------
  // Modal Baca Artikel & Lightbox Flyer
  // --------------------------------------------------------------------------
  const MODAL_SIZE_STORAGE_KEY = "catatan_teduh_article_modal_size";

  const modalEls = {
    articleModal: document.getElementById("article-modal"),
    articlePanel: document.getElementById("article-modal-panel"),
    articleScroll: document.getElementById("modal-article-scroll"),
    articleProgress: document.getElementById("modal-read-progress"),
    articleMeta: document.getElementById("modal-article-meta"),
    articleTitle: document.getElementById("modal-article-title"),
    articleBody: document.getElementById("modal-article-body"),
    articleClose: document.getElementById("modal-article-close"),
    articleResizeToggle: document.getElementById("modal-article-resize-toggle"),
    resizeIconExpand: document.getElementById("modal-resize-icon-expand"),
    resizeIconCompress: document.getElementById("modal-resize-icon-compress"),
    articleResizeHandles: Array.from(document.querySelectorAll("[data-modal-resize]")),
    articleWa: document.getElementById("modal-wa-share"),
    articleCopy: document.getElementById("modal-copy-link"),
    articleCopyLabel: document.getElementById("modal-copy-label"),
    fontButtons: Array.from(document.querySelectorAll(".font-size-btn")),
    readerModeButtons: Array.from(document.querySelectorAll(".reader-mode-btn")),
    spreadToggleWrap: document.getElementById("modal-spread-toggle-wrap"),
    bookSpreadButtons: Array.from(document.querySelectorAll(".book-spread-btn")),
    tocToggleBtn: document.getElementById("modal-toc-toggle"),
    tocCountBadge: document.getElementById("modal-toc-count"),
    tocDrawer: document.getElementById("modal-toc-drawer"),
    tocBackdrop: document.getElementById("modal-toc-backdrop"),
    tocCloseBtn: document.getElementById("modal-toc-close"),
    tocSubtitle: document.getElementById("modal-toc-subtitle"),
    tocList: document.getElementById("modal-toc-list"),
    savePdfBtn: document.getElementById("modal-save-pdf"),
    pdfPrintSheet: document.getElementById("ct-pdf-print-sheet"),
    bookStage: document.getElementById("modal-book-stage"),
    bookPagesHost: document.getElementById("modal-book-pages-host"),
    bookPrevBtn: document.getElementById("modal-book-prev"),
    bookNextBtn: document.getElementById("modal-book-next"),
    bookEdgePrev: document.getElementById("modal-book-edge-prev"),
    bookEdgeNext: document.getElementById("modal-book-edge-next"),
    bookPageLabel: document.getElementById("modal-book-page-label"),
    lightboxModal: document.getElementById("lightbox-modal"),
    lightboxImg: document.getElementById("lightbox-img"),
    lightboxTitle: document.getElementById("lightbox-title"),
    lightboxMeta: document.getElementById("lightbox-meta"),
    lightboxCaption: document.getElementById("lightbox-caption"),
    lightboxClose: document.getElementById("lightbox-close"),
    lightboxDownload: document.getElementById("lightbox-download"),
  };

  function getArticleProseSizeClasses(sizeKey) {
    const sizeClasses = {
      sm: "text-[15px] leading-[1.75]",
      md: "text-[17px] leading-[1.82]",
      lg: "text-[20px] leading-[1.85]",
    };
    return sizeClasses[sizeKey] || sizeClasses.md;
  }

  function applyArticleFontSize(sizeKey) {
    state.fontSize = sizeKey;
    localStorage.setItem("catatan_teduh_font_size", sizeKey);
    modalEls.articleBody.className = `font-prose text-[#1F2937] space-y-5 ${getArticleProseSizeClasses(sizeKey)}`;

    modalEls.fontButtons.forEach((btn) => {
      const active = btn.dataset.fontSize === sizeKey;
      btn.classList.toggle("theme-bg-accent", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("text-gray-600", !active);
    });

    if (
      state.activeArticle &&
      modalEls.articleModal &&
      !modalEls.articleModal.classList.contains("hidden") &&
      state.readerMode === "book"
    ) {
      repaginateAndRenderBook(true);
    }
  }

  function getEffectiveBookSpread() {
    const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1280;
    return state.bookSpread === 2 && vw >= 768 ? 2 : 1;
  }

  function updateReadingProgress() {
    if (!modalEls.articleProgress) return;
    if (state.readerMode === "book") {
      const total = Math.max(1, state.bookPages.length);
      const spread = getEffectiveBookSpread();
      const visibleEnd = Math.min(total, state.bookCurrentPage + spread);
      const pct = Math.min(100, Math.round((visibleEnd / total) * 100));
      modalEls.articleProgress.style.width = `${pct}%`;
      return;
    }
    if (!modalEls.articleScroll) return;
    const { scrollTop, scrollHeight, clientHeight } = modalEls.articleScroll;
    const max = scrollHeight - clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((scrollTop / max) * 100)) : 100;
    modalEls.articleProgress.style.width = `${pct}%`;
  }

  function getArticleModalBounds() {
    const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 800;
    const gutter = vw >= 640 ? 48 : 24;
    const maxWidth = Math.max(320, vw - gutter);
    const minWidth = Math.min(360, maxWidth);
    const maxHeight = Math.max(280, vh - gutter);
    const minHeight = Math.min(320, maxHeight);
    return { vw, vh, minWidth, maxWidth, minHeight, maxHeight };
  }

  function getSavedArticleModalSize() {
    try {
      const raw = localStorage.getItem(MODAL_SIZE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const width = Number.isFinite(Number(parsed.width)) && Number(parsed.width) > 0 ? Math.round(Number(parsed.width)) : null;
      const height = Number.isFinite(Number(parsed.height)) && Number(parsed.height) > 0 ? Math.round(Number(parsed.height)) : null;
      if (width === null && height === null) return null;
      return { width, height };
    } catch (_e) {
      return null;
    }
  }

  function saveArticleModalSize(size) {
    try {
      if (!size || (size.width == null && size.height == null)) {
        localStorage.removeItem(MODAL_SIZE_STORAGE_KEY);
        return;
      }
      localStorage.setItem(MODAL_SIZE_STORAGE_KEY, JSON.stringify(size));
    } catch (_e) {}
  }

  function isArticleModalExpanded(widthPx) {
    if (!Number.isFinite(widthPx)) return false;
    const { maxWidth } = getArticleModalBounds();
    return widthPx >= Math.min(780, maxWidth - 20);
  }

  function updateArticleModalResizeUi(widthPx, hasCustomSize) {
    const btn = modalEls.articleResizeToggle;
    if (!btn) return;
    const expanded = Boolean(hasCustomSize && isArticleModalExpanded(widthPx));
    btn.dataset.resizeState = expanded ? "expanded" : "default";
    btn.setAttribute(
      "aria-label",
      expanded ? "Kembalikan ukuran normal jendela baca" : "Perlebar jendela baca"
    );
    btn.setAttribute(
      "title",
      expanded
        ? "Kembalikan ukuran normal (atau tarik tepi jendela)"
        : "Perlebar jendela baca (atau tarik tepi jendela)"
    );
    if (modalEls.resizeIconExpand) {
      modalEls.resizeIconExpand.classList.toggle("hidden", expanded);
    }
    if (modalEls.resizeIconCompress) {
      modalEls.resizeIconCompress.classList.toggle("hidden", !expanded);
    }
  }

  function applyArticleModalSize(widthPx, heightPx, persist) {
    const panel = modalEls.articlePanel;
    if (!panel || !panel.style) return null;

    if (widthPx == null && heightPx == null) {
      panel.style.width = "";
      panel.style.maxWidth = "";
      panel.style.height = "";
      panel.style.maxHeight = "";
      if (persist) saveArticleModalSize(null);
      updateArticleModalResizeUi(null, false);
      updateReadingProgress();
      return null;
    }

    const { minWidth, maxWidth, minHeight, maxHeight } = getArticleModalBounds();
    const clampedW =
      Number.isFinite(widthPx) ? Math.round(Math.min(maxWidth, Math.max(minWidth, widthPx))) : null;
    const clampedH =
      Number.isFinite(heightPx) ? Math.round(Math.min(maxHeight, Math.max(minHeight, heightPx))) : null;

    if (clampedW !== null) {
      panel.style.width = `${clampedW}px`;
      panel.style.maxWidth = "none";
    } else {
      panel.style.width = "";
      panel.style.maxWidth = "";
    }

    if (clampedH !== null) {
      panel.style.height = `${clampedH}px`;
      panel.style.maxHeight = "none";
    } else {
      panel.style.height = "";
      panel.style.maxHeight = "";
    }

    const resolved = { width: clampedW, height: clampedH };
    if (persist) saveArticleModalSize(resolved);
    updateArticleModalResizeUi(clampedW, clampedW !== null || clampedH !== null);
    updateReadingProgress();
    return resolved;
  }

  function applyPanelSizeForCurrentMode() {
    const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1280;
    const savedSize = vw >= 640 ? getSavedArticleModalSize() : null;
    if (state.readerMode === "book") {
      const { maxWidth, maxHeight, vh } = getArticleModalBounds();
      const spread = getEffectiveBookSpread();
      if (spread === 2) {
        const targetW = savedSize && savedSize.width >= 880 ? savedSize.width : Math.min(1120, maxWidth);
        const targetH = savedSize && savedSize.height ? Math.max(savedSize.height, Math.round(vh * 0.86)) : Math.min(Math.round(vh * 0.9), maxHeight);
        applyArticleModalSize(targetW, targetH, false);
        return;
      }
      // Mode buku 1 halaman membutuhkan tinggi tetap agar lembar halaman tampil proporsional
      const targetW = savedSize ? savedSize.width : Math.min(760, maxWidth);
      const targetH = savedSize && savedSize.height ? savedSize.height : Math.min(Math.round(vh * 0.88), maxHeight);
      applyArticleModalSize(targetW, targetH, false);
      return;
    }

    if (savedSize) {
      applyArticleModalSize(savedSize.width, savedSize.height, false);
    } else {
      applyArticleModalSize(null, null, false);
    }
  }

  function resetArticleModalSize() {
    applyArticleModalSize(null, null, true);
    if (state.readerMode === "book") {
      applyPanelSizeForCurrentMode();
      repaginateAndRenderBook(true);
    }
  }

  function parseArticleSemanticBlocks(item, siteData) {
    const paragraphs = Array.isArray(item.isi) ? item.isi : [item.ringkasan];
    const dropCapEnabled = item.dropCap !== false;
    const blocks = [];
    const tocItems = [];
    let olOffset = 0;
    let dropCapConsumed = false;
    let tocCounter = 0;

    paragraphs.forEach((p) => {
      const rawLines = distributeMultilineRichTags(p)
        .split(/\r?\n+/)
        .filter((l) => l !== "");
      const parsedLines = (rawLines.length ? rawLines : [p]).map((l) => parseRichBlockMeta(l));
      const hasLists = parsedLines.some((pl) => pl.listType === "ul" || pl.listType === "ol");
      const hasSpecial = parsedLines.some((pl) => pl.isPageBreak || pl.isHeading);
      const firstMeta = parsedLines[0] || {
        isPageBreak: false,
        isHeading: false,
        isQuote: false,
        listType: "",
        align: "",
        indent: 0,
        indentMode: "all",
        inner: "",
      };
      const allSameBlock =
        !hasLists &&
        !hasSpecial &&
        parsedLines.every(
          (pl) =>
            pl.isQuote === firstMeta.isQuote &&
            pl.align === firstMeta.align &&
            pl.indent === firstMeta.indent &&
            pl.indentMode === firstMeta.indentMode
        );

      if (allSameBlock) {
        olOffset = 0;
        const combinedInner = parsedLines.map((pl) => pl.inner).join("\n");
        const pDir = detectTextDirection(combinedInner);
        const isFirstCandidate = !dropCapConsumed;
        dropCapConsumed = true;
        const cls = buildRichBlockClasses(firstMeta, pDir, isFirstCandidate, dropCapEnabled);
        const styleStr = buildRichBlockStyle(firstMeta);
        const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";
        const renderedInner =
          parsedLines.length > 1
            ? parsedLines
                .map((pl) => {
                  const lineDir = detectTextDirection(pl.inner);
                  return `<span dir="${lineDir}" class="block">${formatRichInlineHtml(pl.inner, siteData)}</span>`;
                })
                .join("")
            : formatRichInlineHtml(firstMeta.inner, siteData);

        if (firstMeta.isQuote) {
          blocks.push({
            type: "blockquote",
            html: `<blockquote dir="${pDir}" class="${cls}"${styleAttr}>${renderedInner}</blockquote>`,
          });
        } else {
          blocks.push({
            type: "paragraph",
            html: `<p dir="${pDir}" class="${cls}"${styleAttr}>${renderedInner}</p>`,
          });
        }
        return;
      }

      let i = 0;
      while (i < parsedLines.length) {
        const lineMeta = parsedLines[i];
        if (lineMeta.isPageBreak) {
          olOffset = 0;
          blocks.push({ type: "pagebreak", html: "" });
          i += 1;
          continue;
        }

        if (lineMeta.listType === "ul" || lineMeta.listType === "ol") {
          dropCapConsumed = true;
          const listTag = lineMeta.listType;
          const startNum = listTag === "ol" ? olOffset + 1 : 0;
          const firstListDir = detectTextDirection(lineMeta.inner);
          const listItems = [];
          while (
            i < parsedLines.length &&
            !parsedLines[i].isPageBreak &&
            parsedLines[i].listType === listTag
          ) {
            const lm = parsedLines[i];
            const liDir = detectTextDirection(lm.inner);
            const liCls = buildRichBlockClasses(lm, liDir, false, false);
            const liStyle = buildRichBlockStyle(lm);
            const liStyleAttr = liStyle ? ` style="${escapeHtml(liStyle)}"` : "";
            const liInline = formatRichInlineHtml(lm.inner, siteData);
            listItems.push(`<li dir="${liDir}"${liCls ? ` class="${liCls}"` : ""}${liStyleAttr}>${liInline}</li>`);
            if (listTag === "ol") olOffset += 1;
            i += 1;
          }
          const startAttr = listTag === "ol" && startNum > 1 ? ` start="${startNum}"` : "";
          blocks.push({
            type: "list",
            listTag,
            start: startNum,
            dir: firstListDir,
            items: listItems,
            html: `<${listTag} dir="${firstListDir}"${startAttr} class="ct-list ct-list-${listTag}">${listItems.join("")}</${listTag}>`,
          });
          continue;
        }

        olOffset = 0;
        const lineDir = detectTextDirection(lineMeta.inner);
        const styleStr = buildRichBlockStyle(lineMeta);
        const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";
        const inlineHtml = formatRichInlineHtml(lineMeta.inner, siteData);

        if (lineMeta.isHeading) {
          tocCounter += 1;
          const tocId = `ct-toc-${tocCounter}`;
          const label = stripRichTags(lineMeta.inner).trim() || `Subjudul ${tocCounter}`;
          const cls = buildRichBlockClasses(lineMeta, lineDir, false, false);
          const headingHtml = `<h2 data-toc-id="${tocId}" dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</h2>`;
          blocks.push({
            type: "heading",
            tocId,
            label,
            html: headingHtml,
          });
          tocItems.push({ tocId, label, pageIndex: 0 });
        } else if (lineMeta.isQuote) {
          dropCapConsumed = true;
          const cls = buildRichBlockClasses(lineMeta, lineDir, false, false);
          blocks.push({
            type: "blockquote",
            html: `<blockquote dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</blockquote>`,
          });
        } else {
          const isFirstCandidate = !dropCapConsumed;
          dropCapConsumed = true;
          const cls = buildRichBlockClasses(lineMeta, lineDir, isFirstCandidate, dropCapEnabled);
          blocks.push({
            type: "paragraph",
            html: `<p dir="${lineDir}" class="${cls}"${styleAttr}>${inlineHtml}</p>`,
          });
        }
        i += 1;
      }
    });

    return { blocks, tocItems };
  }

  function createDomFromHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.firstElementChild;
  }

  function splitElementByWordRange(sourceEl, maxHeightFn, measureBox, onPageAdvance) {
    // Jika teks sangat pendek atau tidak bisa dibagi lagi, kembalikan apa adanya
    const countWords = (root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let total = 0;
      let n = walker.nextNode();
      while (n) {
        const parts = String(n.nodeValue || "").match(/\S+\s*|\s+/g) || [];
        total += parts.length;
        n = walker.nextNode();
      }
      return total;
    };

    const totalTokens = countWords(sourceEl);
    if (totalTokens <= 4) {
      return [sourceEl.outerHTML];
    }

    const sliceClone = (el, startTok, endTok, isContinuation) => {
      let curTok = 0;
      const walkClone = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = String(node.nodeValue || "").match(/\S+\s*|\s+/g) || [];
          let kept = "";
          parts.forEach((tok) => {
            if (curTok >= startTok && curTok < endTok) {
              kept += tok;
            }
            curTok += 1;
          });
          return kept ? document.createTextNode(kept) : null;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          if (isContinuation && node === el) {
            clone.classList.remove("prose-dropcap");
          }
          Array.from(node.childNodes).forEach((ch) => {
            const slicedCh = walkClone(ch);
            if (slicedCh) clone.appendChild(slicedCh);
          });
          if (!clone.childNodes.length && !["BR", "HR"].includes(clone.tagName)) {
            return null;
          }
          return clone;
        }
        return null;
      };
      return walkClone(el);
    };

    const outChunks = [];
    let cursor = 0;
    while (cursor < totalTokens) {
      let lo = cursor + 1;
      let hi = totalTokens;
      let best = cursor + 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const testEl = sliceClone(sourceEl, cursor, mid, cursor > 0);
        if (!testEl) {
          lo = mid + 1;
          continue;
        }
        measureBox.appendChild(testEl);
        const fits = maxHeightFn();
        measureBox.removeChild(testEl);
        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      const finalEl = sliceClone(sourceEl, cursor, best, cursor > 0);
      if (finalEl) {
        outChunks.push(finalEl.outerHTML);
      }
      if (best <= cursor) {
        break;
      }
      cursor = best;
      if (cursor < totalTokens) {
        if (typeof onPageAdvance === "function") {
          onPageAdvance();
        } else {
          while (measureBox.firstChild) measureBox.removeChild(measureBox.firstChild);
        }
      }
    }
    return outChunks.length ? outChunks : [sourceEl.outerHTML];
  }

  function buildBookHeaderHtml(item, siteData) {
    const titleDir = detectTextDirection(item.judul);
    const titleAlignCls = titleDir === "rtl" ? "text-right" : "";
    return `
      <header class="mb-5 pb-4 border-b border-stone-200/90">
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mb-2">
          <span class="font-semibold theme-text-accent">${escapeHtml(getItemCategory(item, "tulisan"))}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(item.tanggal)}</span>
        </div>
        <h2 dir="${titleDir}" class="font-theme-display text-xl sm:text-2xl font-medium leading-snug text-[#1F2937] headline-balance ${titleAlignCls}">
          ${formatRichInlineHtml(item.judul, siteData)}
        </h2>
      </header>
    `;
  }

  function paginateArticleForBook() {
    const item = state.activeArticle;
    const siteData = state.currentData || window.SITE_DATA;
    if (!item || !modalEls.bookPagesHost) {
      state.bookPages = [];
      state.bookToc = [];
      return;
    }

    const blocks = state.articleBlocks || [];
    const spread = getEffectiveBookSpread();
    const hostRect = modalEls.bookPagesHost.getBoundingClientRect
      ? modalEls.bookPagesHost.getBoundingClientRect()
      : { width: 640, height: 460 };

    const rawHostW = hostRect.width > 80 ? hostRect.width : 640;
    const rawHostH = hostRect.height > 120 ? hostRect.height : 460;
    const sheetW =
      spread === 2
        ? Math.min(560, Math.max(240, Math.floor(rawHostW / 2)))
        : Math.min(680, Math.max(260, Math.floor(rawHostW)));
    const sheetH = Math.max(240, Math.floor(rawHostH));

    const measureSheet = document.createElement("div");
    measureSheet.className = "ct-book-sheet";
    measureSheet.style.cssText = `position:fixed;left:-99999px;top:0;width:${sheetW}px;height:${sheetH}px;visibility:hidden;pointer-events:none;z-index:-1;`;

    const measureInner = document.createElement("div");
    measureInner.className = "ct-book-page-inner";
    // Pembungkus flow-root memastikan tinggi konten aktual (termasuk margin & float drop cap)
    // terukur akurat tanpa terpengaruh perilaku scrollHeight === clientHeight pada kontainer flex-1.
    const measureFlow = document.createElement("div");
    measureFlow.style.display = "flow-root";
    const measureBody = document.createElement("div");
    measureBody.className = `font-prose text-[#1F2937] space-y-4 ${getArticleProseSizeClasses(state.fontSize)}`;
    measureBody.style.display = "flow-root";
    measureFlow.appendChild(measureBody);
    measureInner.appendChild(measureFlow);

    const measureFolio = document.createElement("div");
    measureFolio.className = "ct-book-page-folio";
    measureFolio.innerHTML = "<span>Hal. 1</span><span>1 / 1</span>";

    measureSheet.appendChild(measureInner);
    measureSheet.appendChild(measureFolio);
    document.body.appendChild(measureSheet);

    const innerStyle = window.getComputedStyle ? window.getComputedStyle(measureInner) : null;
    const padTop = innerStyle ? parseFloat(innerStyle.paddingTop) || 0 : 28;
    const padBottom = innerStyle ? parseFloat(innerStyle.paddingBottom) || 0 : 14;
    const availableContentH = Math.max(80, measureInner.clientHeight - padTop - padBottom - 4);

    const bookHeaderHtml = buildBookHeaderHtml(item, siteData);
    const fitsCurrentSheet = () => {
      const contentH = measureFlow.getBoundingClientRect
        ? measureFlow.getBoundingClientRect().height
        : measureFlow.offsetHeight;
      return measureInner.scrollHeight <= measureInner.clientHeight + 1 && contentH <= availableContentH;
    };

    const pages = [];
    const tocPageMap = new Map();
    let curHeaderHtml = bookHeaderHtml;
    let curNodes = [];

    const resetMeasureBox = (withHeader) => {
      measureFlow.innerHTML = "";
      if (withHeader) {
        const hdrEl = createDomFromHtml(withHeader);
        if (hdrEl) measureFlow.appendChild(hdrEl);
      }
      measureBody.innerHTML = "";
      measureFlow.appendChild(measureBody);
    };

    const flushPage = () => {
      if (!curHeaderHtml && !curNodes.length) return;
      const bodyHtml = curNodes.map((n) => n.html).join("");
      pages.push({
        headerHtml: curHeaderHtml,
        bodyHtml,
        firstTocId: (curNodes.find((n) => n.tocId) || {}).tocId || "",
        blockCount: curNodes.length,
      });
      curHeaderHtml = "";
      curNodes = [];
      resetMeasureBox(false);
    };

    resetMeasureBox(curHeaderHtml);

    try {
      blocks.forEach((blk) => {
        if (blk.type === "pagebreak") {
          if (curNodes.length > 0 || curHeaderHtml) {
            flushPage();
          }
          return;
        }

        if (blk.type === "list") {
          let remainingItems = [...blk.items];
          let listOffset = blk.start || 1;
          while (remainingItems.length > 0) {
            const makeListHtml = (itemsSlice, startVal) => {
              const startAttr = blk.listTag === "ol" && startVal > 1 ? ` start="${startVal}"` : "";
              return `<${blk.listTag} dir="${blk.dir}"${startAttr} class="ct-list ct-list-${blk.listTag}">${itemsSlice.join("")}</${blk.listTag}>`;
            };

            // Cari berapa banyak <li> yang muat di halaman ini
            let fitCount = 0;
            for (let k = 1; k <= remainingItems.length; k += 1) {
              const candEl = createDomFromHtml(makeListHtml(remainingItems.slice(0, k), listOffset));
              measureBody.appendChild(candEl);
              const ok = fitsCurrentSheet();
              measureBody.removeChild(candEl);
              if (ok) {
                fitCount = k;
              } else {
                break;
              }
            }

            if (fitCount === 0) {
              if (curNodes.length > 0) {
                // Cegah heading menggantung sendirian sebelum daftar di halaman baru
                if (curNodes[curNodes.length - 1].type === "heading" && (curNodes.length > 1 || !curHeaderHtml)) {
                  const orphanHeading = curNodes.pop();
                  flushPage();
                  curNodes.push(orphanHeading);
                  if (orphanHeading.tocId) tocPageMap.set(orphanHeading.tocId, pages.length);
                  const hEl = createDomFromHtml(orphanHeading.html);
                  if (hEl) measureBody.appendChild(hEl);
                  continue;
                }
                flushPage();
                continue;
              }
              // Halaman sudah kosong tapi item tunggal sangat tinggi: paksa 1 item agar tidak looping
              fitCount = 1;
            }

            const placedSlice = remainingItems.slice(0, fitCount);
            const placedHtml = makeListHtml(placedSlice, listOffset);
            const placedEl = createDomFromHtml(placedHtml);
            if (placedEl) measureBody.appendChild(placedEl);
            curNodes.push({ type: "list", html: placedHtml });

            remainingItems = remainingItems.slice(fitCount);
            listOffset += fitCount;
            if (remainingItems.length > 0) {
              flushPage();
            }
          }
          return;
        }

        const domEl = createDomFromHtml(blk.html);
        if (!domEl) return;
        measureBody.appendChild(domEl);
        if (fitsCurrentSheet()) {
          curNodes.push({
            type: blk.type,
            tocId: blk.tocId || "",
            html: blk.html,
          });
          if (blk.tocId) {
            tocPageMap.set(blk.tocId, pages.length);
          }
          return;
        }
        measureBody.removeChild(domEl);

        // Tidak muat pada halaman berjalan
        if (curNodes.length > 0) {
          // Proteksi yatim Subjudul Bab: jika blok terakhir halaman ini adalah heading, pindahkan ke halaman berikutnya
          let movedHeading = null;
          if (curNodes[curNodes.length - 1].type === "heading" && (curNodes.length > 1 || curHeaderHtml === "")) {
            movedHeading = curNodes.pop();
          }
          flushPage();
          if (movedHeading) {
            curNodes.push(movedHeading);
            if (movedHeading.tocId) tocPageMap.set(movedHeading.tocId, pages.length);
            const hEl = createDomFromHtml(movedHeading.html);
            if (hEl) measureBody.appendChild(hEl);
          }

          measureBody.appendChild(domEl);
          if (fitsCurrentSheet()) {
            curNodes.push({
              type: blk.type,
              tocId: blk.tocId || "",
              html: blk.html,
            });
            if (blk.tocId) tocPageMap.set(blk.tocId, pages.length);
            return;
          }
          measureBody.removeChild(domEl);
        }

        // Masih tidak muat di halaman baru (blok paragraf/kutipan sangat panjang) -> pecah rapi per kata
        if (blk.type === "paragraph" || blk.type === "blockquote") {
          const chunks = splitElementByWordRange(domEl, fitsCurrentSheet, measureBody, () => {
            resetMeasureBox(false);
          });
          chunks.forEach((chunkHtml, cIdx) => {
            if (cIdx > 0) flushPage();
            const chEl = createDomFromHtml(chunkHtml);
            if (chEl) measureBody.appendChild(chEl);
            curNodes.push({ type: blk.type, html: chunkHtml });
          });
        } else {
          measureBody.appendChild(domEl);
          curNodes.push({
            type: blk.type,
            tocId: blk.tocId || "",
            html: blk.html,
          });
          if (blk.tocId) tocPageMap.set(blk.tocId, pages.length);
        }
      });

      if (curNodes.length > 0 || curHeaderHtml) {
        flushPage();
      }
      if (!pages.length) {
        pages.push({ headerHtml: bookHeaderHtml, bodyHtml: "", firstTocId: "", blockCount: 0 });
      }
    } finally {
      measureSheet.remove();
    }

    state.bookPages = pages;
    state.bookToc = (state.bookToc || []).map((t) => ({
      ...t,
      pageIndex: tocPageMap.has(t.tocId) ? tocPageMap.get(t.tocId) : 0,
    }));
  }

  function renderBookPagesView() {
    if (!modalEls.bookPagesHost || !state.activeArticle) return;
    const pages = state.bookPages || [];
    const total = Math.max(1, pages.length);
    const spread = getEffectiveBookSpread();

    let pageIdx = Math.max(0, Math.min(total - 1, state.bookCurrentPage || 0));
    if (spread === 2 && pageIdx % 2 === 1) {
      pageIdx -= 1;
    }
    state.bookCurrentPage = pageIdx;

    const animCls =
      state.bookTurnDir === "next"
        ? " ct-book-anim-next"
        : state.bookTurnDir === "prev"
        ? " ct-book-anim-prev"
        : "";
    state.bookTurnDir = "";

    const shortTitle = stripRichTags(state.activeArticle.judul || "Catatan Teduh");
    const proseCls = `font-prose text-[#1F2937] space-y-4 ${getArticleProseSizeClasses(state.fontSize)}`;

    const buildSheetHtml = (idx, sideCls) => {
      const pg = pages[idx];
      if (!pg) {
        return `
          <div class="ct-book-sheet ${sideCls} ct-book-sheet-blank">
            <div class="ct-book-page-inner flex items-center justify-center">
              <span class="text-xs italic text-gray-400 select-none">— Akhir Tulisan —</span>
            </div>
            <div class="ct-book-page-folio">
              <span>${escapeHtml(shortTitle)}</span>
              <span class="tabular-nums">—</span>
            </div>
          </div>
        `;
      }
      return `
        <div class="ct-book-sheet ${sideCls}" data-book-page-index="${idx}">
          <div class="ct-book-page-inner">
            ${pg.headerHtml || ""}
            <div class="${proseCls}">${pg.bodyHtml || ""}</div>
          </div>
          <div class="ct-book-page-folio">
            <span class="truncate max-w-[70%]">${escapeHtml(shortTitle)}</span>
            <span class="tabular-nums font-medium">Hal. ${idx + 1} / ${total}</span>
          </div>
        </div>
      `;
    };

    if (spread === 2) {
      modalEls.bookPagesHost.innerHTML = `
        <div class="ct-book-spread${animCls}">
          ${buildSheetHtml(pageIdx, "ct-book-sheet-left")}
          ${buildSheetHtml(pageIdx + 1, "ct-book-sheet-right")}
        </div>
      `;
    } else {
      modalEls.bookPagesHost.innerHTML = `
        <div class="ct-book-spread${animCls}">
          ${buildSheetHtml(pageIdx, "ct-book-sheet-single")}
        </div>
      `;
    }

    const canPrev = pageIdx > 0;
    const canNext = pageIdx + spread < total;
    if (modalEls.bookPrevBtn) modalEls.bookPrevBtn.disabled = !canPrev;
    if (modalEls.bookNextBtn) modalEls.bookNextBtn.disabled = !canNext;
    if (modalEls.bookEdgePrev) modalEls.bookEdgePrev.disabled = !canPrev;
    if (modalEls.bookEdgeNext) modalEls.bookEdgeNext.disabled = !canNext;

    if (modalEls.bookPageLabel) {
      if (spread === 2 && pageIdx + 1 < total) {
        modalEls.bookPageLabel.textContent = `Hal. ${pageIdx + 1}–${pageIdx + 2} / ${total}`;
      } else {
        modalEls.bookPageLabel.textContent = `Hal. ${pageIdx + 1} / ${total}`;
      }
    }

    updateReadingProgress();
    renderTocDrawerList();
  }

  function repaginateAndRenderBook(preservePageRatio) {
    if (state.readerMode !== "book" || !state.activeArticle) return;
    const prevTotal = Math.max(1, state.bookPages.length);
    const ratio = preservePageRatio && prevTotal > 1 ? state.bookCurrentPage / (prevTotal - 1) : 0;
    paginateArticleForBook();
    const newTotal = Math.max(1, state.bookPages.length);
    if (preservePageRatio && newTotal > 1) {
      state.bookCurrentPage = Math.round(ratio * (newTotal - 1));
    } else if (!preservePageRatio) {
      state.bookCurrentPage = 0;
    }
    renderBookPagesView();
  }

  function stepBookPage(delta) {
    if (state.readerMode !== "book" || !state.bookPages.length) return;
    const spread = getEffectiveBookSpread();
    const total = state.bookPages.length;
    const step = spread * (delta > 0 ? 1 : -1);
    let nextIdx = state.bookCurrentPage + step;
    if (nextIdx < 0) nextIdx = 0;
    const maxStart = spread === 2 ? Math.max(0, total - (total % 2 === 0 ? 2 : 1)) : Math.max(0, total - 1);
    if (nextIdx > maxStart) nextIdx = maxStart;
    if (nextIdx === state.bookCurrentPage) return;
    state.bookTurnDir = delta > 0 ? "next" : "prev";
    state.bookCurrentPage = nextIdx;
    renderBookPagesView();
  }

  function renderTocDrawerList() {
    if (!modalEls.tocList) return;
    const toc = state.bookToc || [];
    const totalPages = Math.max(1, (state.bookPages || []).length);

    if (modalEls.tocCountBadge) {
      modalEls.tocCountBadge.textContent = String(toc.length);
      modalEls.tocCountBadge.classList.toggle("hidden", toc.length === 0);
    }
    if (modalEls.tocSubtitle) {
      modalEls.tocSubtitle.textContent =
        state.readerMode === "book"
          ? `${toc.length} Subjudul Bab · ${totalPages} Halaman`
          : `${toc.length} Subjudul Bab`;
    }

    const activeSpread = getEffectiveBookSpread();
    const startBtn =
      state.readerMode === "book"
        ? `
        <button
          type="button"
          data-toc-jump-page="0"
          class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
            state.bookCurrentPage === 0
              ? "theme-bg-soft theme-text-accent font-semibold"
              : "text-gray-700 hover:bg-stone-100"
          }"
        >
          <span class="truncate">Halaman Pembuka</span>
          <span class="text-[11px] text-gray-400 tabular-nums shrink-0">Hal. 1</span>
        </button>
      `
        : "";

    if (!toc.length) {
      modalEls.tocList.innerHTML = `
        ${startBtn}
        <div class="mt-2 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-gray-500 leading-relaxed">
          Tulisan ini belum memiliki <strong>Subjudul Bab</strong>. Penulis dapat menambahkannya lewat tombol <strong>Bab</strong> di Studio Editor.
        </div>
      `;
      return;
    }

    const chapterHtml = toc
      .map((entry, idx) => {
        const isOnVisiblePage =
          state.readerMode === "book" &&
          entry.pageIndex >= state.bookCurrentPage &&
          entry.pageIndex < state.bookCurrentPage + activeSpread;
        return `
          <button
            type="button"
            data-toc-jump-id="${escapeHtml(entry.tocId)}"
            data-toc-jump-page="${entry.pageIndex}"
            class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
              isOnVisiblePage
                ? "theme-bg-soft theme-text-accent font-semibold"
                : "text-gray-700 hover:bg-stone-100"
            }"
          >
            <span class="truncate">${idx + 1}. ${escapeHtml(entry.label)}</span>
            ${
              state.readerMode === "book"
                ? `<span class="text-[11px] text-gray-400 tabular-nums shrink-0">Hal. ${entry.pageIndex + 1}</span>`
                : ""
            }
          </button>
        `;
      })
      .join("");

    modalEls.tocList.innerHTML = startBtn + chapterHtml;
  }

  function setTocDrawerOpen(isOpen) {
    state.tocOpen = Boolean(isOpen);
    if (modalEls.tocDrawer) modalEls.tocDrawer.classList.toggle("hidden", !state.tocOpen);
    if (modalEls.tocBackdrop) modalEls.tocBackdrop.classList.toggle("hidden", !state.tocOpen);
    if (modalEls.tocToggleBtn) modalEls.tocToggleBtn.setAttribute("aria-expanded", state.tocOpen ? "true" : "false");
    if (state.tocOpen) renderTocDrawerList();
  }

  function syncReaderModeUi() {
    const isBook = state.readerMode === "book";
    const vw = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1280;

    modalEls.readerModeButtons.forEach((btn) => {
      const active = btn.dataset.readerMode === state.readerMode;
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("text-gray-900", active);
      btn.classList.toggle("shadow-xs", active);
      btn.classList.toggle("text-gray-600", !active);
    });

    if (modalEls.spreadToggleWrap) {
      const showSpreadSwitch = isBook && vw >= 768;
      modalEls.spreadToggleWrap.classList.toggle("hidden", !showSpreadSwitch);
      modalEls.spreadToggleWrap.classList.toggle("inline-flex", showSpreadSwitch);
    }

    modalEls.bookSpreadButtons.forEach((btn) => {
      const active = Number(btn.dataset.bookSpread) === state.bookSpread;
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("text-gray-900", active);
      btn.classList.toggle("shadow-xs", active);
      btn.classList.toggle("text-gray-600", !active);
    });

    if (modalEls.articleScroll) modalEls.articleScroll.classList.toggle("hidden", isBook);
    if (modalEls.bookStage) {
      modalEls.bookStage.classList.toggle("hidden", !isBook);
      modalEls.bookStage.classList.toggle("flex", isBook);
    }
  }

  function setArticleReaderMode(modeKey) {
    state.readerMode = modeKey === "book" ? "book" : "scroll";
    localStorage.setItem("catatan_teduh_reader_mode", state.readerMode);
    syncReaderModeUi();
    if (state.activeArticle && modalEls.articleModal && !modalEls.articleModal.classList.contains("hidden")) {
      applyPanelSizeForCurrentMode();
      if (state.readerMode === "book") {
        requestAnimationFrame(() => {
          paginateArticleForBook();
          state.bookCurrentPage = Math.min(state.bookCurrentPage, Math.max(0, state.bookPages.length - 1));
          renderBookPagesView();
        });
      } else {
        updateReadingProgress();
        renderTocDrawerList();
      }
    }
  }

  function setBookSpreadMode(spreadNum) {
    state.bookSpread = Number(spreadNum) === 2 ? 2 : 1;
    localStorage.setItem("catatan_teduh_book_spread", String(state.bookSpread));
    syncReaderModeUi();
    if (state.activeArticle && state.readerMode === "book") {
      applyPanelSizeForCurrentMode();
      requestAnimationFrame(() => {
        repaginateAndRenderBook(true);
      });
    }
  }

  function exportArticleToPdf() {
    const item = state.activeArticle;
    const sheet = modalEls.pdfPrintSheet;
    if (!item || !sheet) return;

    const src = state.currentData || window.SITE_DATA || {};
    const siteName = (src.profil && src.profil.namaWebsite) || "Catatan Teduh";
    const ownerName = (src.profil && src.profil.namaPemilik) || "";
    const blocks = state.articleBlocks || [];
    const toc = state.bookToc || [];

    const titleDir = detectTextDirection(item.judul);
    const bodyHtml = blocks
      .map((b) => (b.type === "pagebreak" ? '<div class="ct-print-pagebreak"></div>' : b.html))
      .join("");

    const tocPrintHtml =
      toc.length >= 2
        ? `
        <nav style="margin: 14px 0 20px; padding: 12px 16px; background: #faf9f6; border: 1px solid #e7e5e4; border-radius: 10px;">
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #065f46; margin-bottom: 6px;">Daftar Isi</div>
          <ol style="margin: 0; padding-left: 18px; font-size: 10.5pt; color: #374151; line-height: 1.65;">
            ${toc.map((t) => `<li>${escapeHtml(t.label)}</li>`).join("")}
          </ol>
        </nav>
      `
        : "";

    sheet.innerHTML = `
      <article>
        <header style="padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1.5px solid #d6d3d1;">
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9.5pt; color: #4b5563; margin-bottom: 6px;">
            <strong style="color: #065f46;">${escapeHtml(siteName)}</strong>
            <span> · ${escapeHtml(getItemCategory(item, "tulisan"))}</span>
            <span> · ${escapeHtml(item.tanggal)}</span>
            ${ownerName ? `<span> · Oleh ${escapeHtml(ownerName)}</span>` : ""}
          </div>
          <h1 dir="${titleDir}" style="font-family: var(--font-heading, 'Fraunces', serif); font-size: 21pt; font-weight: 600; line-height: 1.3; color: #111827; margin: 0;${titleDir === "rtl" ? " text-align: right;" : ""}">
            ${formatRichInlineHtml(item.judul, src)}
          </h1>
        </header>
        ${tocPrintHtml}
        <div class="font-prose space-y-4">
          ${bodyHtml}
        </div>
      </article>
    `;

    const prevTitle = document.title;
    const cleanPdfTitle = stripRichTags(item.judul || "Tulisan")
      .replace(/[\\/:*?"<>|]+/g, " ")
      .trim();
    document.title = cleanPdfTitle ? `${cleanPdfTitle} — ${siteName}` : siteName;

    let restored = false;
    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = prevTitle;
    };
    window.addEventListener("afterprint", restoreTitle, { once: true });
    setTimeout(restoreTitle, 4000);

    try {
      window.print();
    } catch (_e) {
      restoreTitle();
    }
  }

  function openArticleModal(articleId) {
    const src = state.currentData || window.SITE_DATA;
    const item = (src.tulisan || []).find((t) => t.id === articleId);
    if (!item) return;

    state.activeArticle = item;
    state.bookCurrentPage = 0;
    state.bookTurnDir = "";
    setTocDrawerOpen(false);

    modalEls.articleMeta.innerHTML = `
      <span class="font-semibold theme-text-accent">${escapeHtml(getItemCategory(item, "tulisan"))}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(item.tanggal)}</span>
    `;
    const titleDir = detectTextDirection(item.judul);
    modalEls.articleTitle.setAttribute("dir", titleDir);
    modalEls.articleTitle.classList.toggle("text-right", titleDir === "rtl");
    modalEls.articleTitle.innerHTML = formatRichInlineHtml(item.judul, src);

    const parsedArticle = parseArticleSemanticBlocks(item, src);
    state.articleBlocks = parsedArticle.blocks;
    state.bookToc = parsedArticle.tocItems;

    modalEls.articleBody.innerHTML = parsedArticle.blocks
      .map((blk) =>
        blk.type === "pagebreak"
          ? '<div class="ct-scroll-page-divider" aria-hidden="true"><span>Halaman Berikutnya</span></div>'
          : blk.html
      )
      .join("");

    const shareText = `${stripRichTags(item.judul)}\n\n${stripRichTags(item.ringkasan)}\n\nBaca selengkapnya di: ${window.location.href}`;
    modalEls.articleWa.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    if (modalEls.articleCopyLabel) modalEls.articleCopyLabel.textContent = "Salin Teks";

    applyArticleFontSize(state.fontSize);
    syncReaderModeUi();
    applyPanelSizeForCurrentMode();

    modalEls.articleModal.classList.remove("hidden");
    if (modalEls.articleScroll) modalEls.articleScroll.scrollTop = 0;
    document.body.style.overflow = "hidden";

    if (state.readerMode === "book") {
      requestAnimationFrame(() => {
        paginateArticleForBook();
        renderBookPagesView();
      });
    } else {
      renderTocDrawerList();
      updateReadingProgress();
    }

    modalEls.articleClose.focus();
  }

  function closeArticleModal() {
    setTocDrawerOpen(false);
    modalEls.articleModal.classList.add("hidden");
    document.body.style.overflow = "";
    state.activeArticle = null;
    state.bookPages = [];
    state.articleBlocks = [];
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
    const flyerCat = getItemCategory(item, "flyer");
    const flyerTema = String(item.tema || "").trim();
    const flyerMetaExtra = flyerTema && flyerTema.toLowerCase() !== flyerCat.toLowerCase() ? `${flyerCat} · ${flyerTema}` : flyerCat;
    modalEls.lightboxMeta.textContent = `${flyerMetaExtra} · ${item.tanggal}`;
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

  function renderPublicCurrentState() {
    renderSiteInto(document, state.currentData || window.SITE_DATA, {
      includeDrafts: false,
      activeTab: state.activeTab,
      activeCategory: state.activeCategory,
      categoryViewMode: state.categoryViewMode,
      searchQuery: state.searchQuery,
      isPreview: false,
    });
  }

  function switchPublicTab(tabKey, shouldScroll, nextCategory) {
    state.activeTab = tabKey || "beranda";
    state.activeCategory = nextCategory !== undefined ? nextCategory : "all";
    closeMobileDrawer();
    renderPublicCurrentState();
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        renderPublicCurrentState();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener("click", () => {
        state.searchQuery = "";
        searchInput.value = "";
        renderPublicCurrentState();
        searchInput.focus();
      });
    }

    // Delegasi klik pada halaman publik
    const publicWrapper = document.getElementById("public-site-wrapper");
    if (publicWrapper) {
      publicWrapper.addEventListener("click", (e) => {
        if (e.target.closest("#brand-wordmark")) {
          e.preventDefault();
          switchPublicTab("beranda", true);
          return;
        }
        const filterCatBtn = e.target.closest("[data-filter-category]");
        if (filterCatBtn) {
          state.activeCategory = filterCatBtn.dataset.filterCategory || "all";
          renderPublicCurrentState();
          return;
        }
        const viewModeBtn = e.target.closest("[data-category-view]");
        if (viewModeBtn) {
          state.categoryViewMode = viewModeBtn.dataset.categoryView === "grid" ? "grid" : "grouped";
          renderPublicCurrentState();
          return;
        }
        const crossBtn = e.target.closest("[data-cross-tab]");
        if (crossBtn) {
          switchPublicTab(
            crossBtn.dataset.crossTab,
            true,
            crossBtn.dataset.crossCategory || "all"
          );
          return;
        }
        const jumpCatBtn = e.target.closest("[data-jump-category]");
        if (jumpCatBtn) {
          const targetEl = document.getElementById(`cat-group-${jumpCatBtn.dataset.jumpCategory}`);
          if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
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
          switchPublicTab(state.activeTab, false, state.activeCategory);
        }
      });
    }

    // Modal Baca & Lightbox Events
    modalEls.fontButtons.forEach((btn) => {
      btn.addEventListener("click", () => applyArticleFontSize(btn.dataset.fontSize));
    });
    modalEls.readerModeButtons.forEach((btn) => {
      btn.addEventListener("click", () => setArticleReaderMode(btn.dataset.readerMode));
    });
    modalEls.bookSpreadButtons.forEach((btn) => {
      btn.addEventListener("click", () => setBookSpreadMode(btn.dataset.bookSpread));
    });
    if (modalEls.tocToggleBtn) {
      modalEls.tocToggleBtn.addEventListener("click", () => setTocDrawerOpen(!state.tocOpen));
    }
    if (modalEls.tocCloseBtn) {
      modalEls.tocCloseBtn.addEventListener("click", () => setTocDrawerOpen(false));
    }
    if (modalEls.tocBackdrop) {
      modalEls.tocBackdrop.addEventListener("click", () => setTocDrawerOpen(false));
    }
    if (modalEls.tocList) {
      modalEls.tocList.addEventListener("click", (e) => {
        const jumpBtn = e.target.closest("[data-toc-jump-page]");
        if (!jumpBtn) return;
        const targetPage = Math.max(0, parseInt(jumpBtn.dataset.tocJumpPage || "0", 10) || 0);
        const tocId = jumpBtn.dataset.tocJumpId || "";
        setTocDrawerOpen(false);
        if (state.readerMode === "book") {
          const spread = getEffectiveBookSpread();
          const normalizedPage = spread === 2 && targetPage % 2 === 1 ? targetPage - 1 : targetPage;
          if (normalizedPage !== state.bookCurrentPage) {
            state.bookTurnDir = normalizedPage > state.bookCurrentPage ? "next" : "prev";
            state.bookCurrentPage = normalizedPage;
            renderBookPagesView();
          }
        } else if (tocId && modalEls.articleBody) {
          const targetHeading = modalEls.articleBody.querySelector(`[data-toc-id="${tocId}"]`);
          if (targetHeading && targetHeading.scrollIntoView) {
            targetHeading.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    }
    if (modalEls.savePdfBtn) {
      modalEls.savePdfBtn.addEventListener("click", exportArticleToPdf);
    }
    if (modalEls.bookPrevBtn) {
      modalEls.bookPrevBtn.addEventListener("click", () => stepBookPage(-1));
    }
    if (modalEls.bookNextBtn) {
      modalEls.bookNextBtn.addEventListener("click", () => stepBookPage(1));
    }
    if (modalEls.bookEdgePrev) {
      modalEls.bookEdgePrev.addEventListener("click", () => stepBookPage(-1));
    }
    if (modalEls.bookEdgeNext) {
      modalEls.bookEdgeNext.addEventListener("click", () => stepBookPage(1));
    }

    // Gestur geser kiri/kanan (Touch & Pointer Swipe) di Mode Buku
    if (modalEls.bookPagesHost) {
      let swipeTrack = null;
      modalEls.bookPagesHost.addEventListener("pointerdown", (e) => {
        if (state.readerMode !== "book") return;
        if (e.button && e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest("a, button, input, select, [data-modal-resize]")) {
          return;
        }
        const existingSel = window.getSelection ? String(window.getSelection() || "").trim() : "";
        swipeTrack = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startedAt: Date.now(),
          hadSelection: existingSel.length > 0,
        };
      });
      modalEls.bookPagesHost.addEventListener("pointerup", (e) => {
        if (!swipeTrack || swipeTrack.pointerId !== e.pointerId) return;
        const track = swipeTrack;
        swipeTrack = null;
        if (state.readerMode !== "book") return;
        const currentSel = window.getSelection ? String(window.getSelection() || "").trim() : "";
        if (track.hadSelection || currentSel.length > 0) return;
        const dx = e.clientX - track.startX;
        const dy = e.clientY - track.startY;
        const elapsed = Date.now() - track.startedAt;
        if (elapsed > 900) return;
        if (Math.abs(dx) >= 48 && Math.abs(dy) <= Math.abs(dx) * 0.72) {
          if (dx < 0) {
            stepBookPage(1);
          } else {
            stepBookPage(-1);
          }
        }
      });
      modalEls.bookPagesHost.addEventListener("pointercancel", () => {
        swipeTrack = null;
      });
    }

    if (modalEls.articleScroll) {
      modalEls.articleScroll.addEventListener("scroll", updateReadingProgress);
    }
    if (modalEls.articleCopy) {
      modalEls.articleCopy.addEventListener("click", async () => {
        if (!state.activeArticle) return;
        const txt = `${stripRichTags(state.activeArticle.judul)}\n\n${(state.activeArticle.isi || []).map(stripRichTags).filter(Boolean).join("\n\n")}`;
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

    if (modalEls.articleResizeToggle && modalEls.articlePanel) {
      modalEls.articleResizeToggle.addEventListener("click", () => {
        const currentRect = modalEls.articlePanel.getBoundingClientRect
          ? modalEls.articlePanel.getBoundingClientRect()
          : { width: 672, height: 600 };
        const hasInline = Boolean(modalEls.articlePanel.style.width || modalEls.articlePanel.style.height);
        if (hasInline && isArticleModalExpanded(currentRect.width)) {
          resetArticleModalSize();
        } else {
          const { maxWidth, maxHeight, vh } = getArticleModalBounds();
          const targetWidth = Math.min(1120, maxWidth);
          const targetHeight = Math.min(Math.round(vh * 0.9), maxHeight);
          applyArticleModalSize(targetWidth, targetHeight, true);
          if (state.readerMode === "book") {
            requestAnimationFrame(() => repaginateAndRenderBook(true));
          }
        }
      });
    }

    if (modalEls.articlePanel && modalEls.articleResizeHandles.length) {
      modalEls.articleResizeHandles.forEach((handle) => {
        handle.addEventListener("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
          resetArticleModalSize();
        });

        handle.addEventListener("pointerdown", (e) => {
          if (e.button && e.button !== 0) return;
          const panel = modalEls.articlePanel;
          if (!panel || !panel.getBoundingClientRect) return;
          e.preventDefault();
          e.stopPropagation();

          const mode = handle.dataset.modalResize || "right";
          const rect = panel.getBoundingClientRect();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = rect.width || 672;
          const startH = rect.height || 520;
          const hadHeightBefore = Boolean(panel.style.height);
          const hadWidthBefore = Boolean(panel.style.width);

          const prevUserSelect = document.body.style.userSelect;
          const prevRootCursor = document.documentElement.style.cursor;
          document.body.style.userSelect = "none";
          document.documentElement.style.cursor =
            mode === "corner" ? "nwse-resize" : mode === "bottom" ? "ns-resize" : "ew-resize";

          let latestSize = {
            width: hadWidthBefore ? Math.round(startW) : null,
            height: hadHeightBefore ? Math.round(startH) : null,
          };

          const onPointerMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            // Modal terpusat secara horizontal & vertikal, sehingga 2*delta membuat tepi tepat mengikuti kursor
            let nextW = latestSize.width;
            if (mode === "right" || mode === "corner") {
              nextW = startW + dx * 2;
            } else if (mode === "left") {
              nextW = startW - dx * 2;
            }

            let nextH = latestSize.height;
            if (mode === "bottom" || mode === "corner") {
              nextH = startH + dy * 2;
            }

            const applied = applyArticleModalSize(nextW, nextH, false);
            if (applied) latestSize = applied;
          };

          const finishDrag = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", finishDrag);
            window.removeEventListener("pointercancel", finishDrag);
            document.body.style.userSelect = prevUserSelect;
            document.documentElement.style.cursor = prevRootCursor;
            saveArticleModalSize(latestSize);
            if (state.readerMode === "book") {
              requestAnimationFrame(() => repaginateAndRenderBook(true));
            }
          };

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", finishDrag);
          window.addEventListener("pointercancel", finishDrag);
        });
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => {
        if (!modalEls.articleModal || modalEls.articleModal.classList.contains("hidden")) return;
        syncReaderModeUi();
        applyPanelSizeForCurrentMode();
        if (state.readerMode === "book") {
          requestAnimationFrame(() => repaginateAndRenderBook(true));
        }
      });
    }

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
        if (!modalEls.articleModal.classList.contains("hidden")) {
          if (state.tocOpen) {
            setTocDrawerOpen(false);
          } else {
            closeArticleModal();
          }
          return;
        }
        if (!modalEls.lightboxModal.classList.contains("hidden")) closeLightbox();
      }
      if (
        !modalEls.articleModal.classList.contains("hidden") &&
        state.readerMode === "book" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement || {}).tagName)
      ) {
        if (e.key === "ArrowRight" || e.key === "PageDown") {
          e.preventDefault();
          stepBookPage(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          stepBookPage(-1);
          return;
        }
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
        if (state.activeTab !== "beranda") {
          switchPublicTab("beranda", true);
        }
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
      kategoriMateri: DEFAULT_CONTENT_CATEGORIES.map((c) => ({ ...c })),
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
    tampilan.kategoriMateri = Array.isArray(src.tampilan && src.tampilan.kategoriMateri)
      ? normalizeCategoryEntries(src.tampilan.kategoriMateri)
      : DEFAULT_CONTENT_CATEGORIES.map((c) => ({ ...c }));

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
    DEFAULT_CONTENT_CATEGORIES,
    MEDIA_TAB_KEYS,
    TAB_META,
    deepClone,
    escapeHtml,
    sanitizeRichLinkUrl,
    sanitizeRichColor,
    normalizeIndentLevel,
    normalizeIndentMode,
    stripRichTags,
    parseRichBlockMeta,
    buildRichBlockStyle,
    buildRichBlockClasses,
    resolveR2FontUrl,
    getFontCollection,
    getItemCategory,
    getCategoryCollection,
    normalizeCategoryEntries,
    syncDynamicFonts,
    detectTextDirection,
    formatRichInlineHtml,
    parseArticleSemanticBlocks,
    exportArticleToPdf,
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
    activeCategory: state.activeCategory,
    categoryViewMode: state.categoryViewMode,
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
        activeCategory: state.activeCategory,
        categoryViewMode: state.categoryViewMode,
        searchQuery: state.searchQuery,
        isPreview: false,
      });
    }
  });
})();
