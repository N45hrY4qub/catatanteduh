/**
 * ============================================================================
 * STUDIO VISUAL BUILDER ALA ELEMENTOR — CATATAN TEDUH
 * ============================================================================
 * Menyediakan alur lengkap:
 * 1. Login Admin (Verifikasi repositori GitHub atau Mode Pratinjau Lokal)
 * 2. Edit Tampilan Visual (Warna, Font, Gaya Kartu, Visibilitas & Urutan Tab)
 * 3. Edit Konten Lengkap (Tulisan, Ebook, Flyer Gambar, Audio, Video + Upload File)
 * 4. Simpan Draft Lokal (`localStorage`) + Live Preview (Desktop / Tablet / HP)
 * 5. 1-Klik Publish langsung ke GitHub (`public/data.js` & aset upload) agar
 *    Cloudflare Pages otomatis live, atau unduh/salin `data.js` siap pakai.
 * ============================================================================
 */

(function () {
  "use strict";

  const App = window.CatatanTeduhApp;
  if (!App) return;

  const STORAGE_DRAFT_KEY = "catatan_teduh_studio_draft_v1";
  const STORAGE_GH_KEY = "catatan_teduh_github_auth_v1";
  const STORAGE_ADMIN_KEY = "catatan_teduh_admin_session_v1";

  const studio = {
    isOpen: false,
    studioTab: "tampilan",
    contentType: "tulisan",
    contentView: "active", // "active" | "trash"
    editingItemId: null, // "new" | item.id | null
    previewDevice: "desktop",
    previewMode: "draft", // "draft" | "public"
    previewActiveTab: "tulisan",
    sidebarHidden: false,
    hasUnsavedChanges: false,
    pendingConfirmAction: null,
    lastTextControl: null,
    pendingUploads: [], // { repoPath, base64Content, name }
    draftData: null,
    github: loadGitHubConfig(),
    adminSession: loadAdminSession(),
  };

  function getAllowedAdminEmail() {
    const configured =
      (studio.draftData && studio.draftData.profil && studio.draftData.profil.emailAdmin) ||
      (window.SITE_DATA && window.SITE_DATA.profil && window.SITE_DATA.profil.emailAdmin) ||
      "benyaqub@gmail.com";
    return String(configured).toLowerCase().trim();
  }

  function loadAdminSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_ADMIN_KEY) || "{}");
      return {
        email: String(saved.email || "").toLowerCase().trim(),
        verified: Boolean(saved.verified),
        verifiedAt: saved.verifiedAt || 0,
      };
    } catch (_e) {
      return { email: "", verified: false, verifiedAt: 0 };
    }
  }

  function saveAdminSession(email) {
    studio.adminSession = {
      email: String(email || "").toLowerCase().trim(),
      verified: true,
      verifiedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_ADMIN_KEY, JSON.stringify(studio.adminSession));
  }

  function clearAdminSession() {
    studio.adminSession = { email: "", verified: false, verifiedAt: 0 };
    localStorage.removeItem(STORAGE_ADMIN_KEY);
  }

  function isAdminAuthorized() {
    return Boolean(
      studio.adminSession &&
        studio.adminSession.verified &&
        studio.adminSession.email === getAllowedAdminEmail()
    );
  }

  function syncHeaderStudioButton() {
    const btn = els.headerStudioBtn || document.getElementById("header-studio-btn");
    if (!btn) return;
    const allowed = isAdminAuthorized();
    btn.classList.toggle("hidden", !allowed);
    btn.classList.toggle("inline-flex", allowed);
  }

  function loadGitHubConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_GH_KEY) || "{}");
      return {
        repo: saved.repo || "",
        token: saved.token || "",
        branch: saved.branch || "main",
        filePath: saved.filePath || "public/data.json",
        userLogin: saved.userLogin || "",
        verified: Boolean(saved.verified),
      };
    } catch (_e) {
      return { repo: "", token: "", branch: "main", filePath: "public/data.json", userLogin: "", verified: false };
    }
  }

  function saveGitHubConfig() {
    localStorage.setItem(STORAGE_GH_KEY, JSON.stringify(studio.github));
  }

  function loadDraftData() {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.profil || parsed.tampilan || Array.isArray(parsed.tulisan))) {
          studio.hasUnsavedChanges = true;
          return App.normalizeSiteData(parsed);
        }
      }
    } catch (_e) {}
    return App.normalizeSiteData(window.SITE_DATA || {});
  }

  function saveDraftToLocal() {
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(studio.draftData));
    studio.hasUnsavedChanges = true;
    updateDraftStatusBadge("Draft tersimpan di browser");
  }

  function updateDraftStatusBadge(text) {
    const el = document.getElementById("studio-draft-status");
    if (el) el.textContent = text || (studio.hasUnsavedChanges ? "Ada perubahan draft" : "Tersinkron");
  }

  // Elemen DOM Studio
  const els = {
    publicWrapper: document.getElementById("public-site-wrapper"),
    headerStudioBtn: document.getElementById("header-studio-btn"),
    studioShell: document.getElementById("studio-shell"),
    studioSidebar: document.getElementById("studio-sidebar"),
    studioPanelBody: document.getElementById("studio-panel-body"),
    studioPreviewFrame: document.getElementById("studio-preview-frame"),
    studioPreviewMount: document.getElementById("studio-preview-mount"),
    studioExitBtn: document.getElementById("studio-exit-btn"),
    studioLogoutBtn: document.getElementById("studio-logout-btn"),
    studioToggleSidebar: document.getElementById("studio-toggle-sidebar"),
    studioSaveDraft: document.getElementById("studio-save-draft"),
    studioOpenPublish: document.getElementById("studio-open-publish"),
    studioNavTabs: Array.from(document.querySelectorAll("[data-studio-tab]")),
    deviceBtns: Array.from(document.querySelectorAll("[data-preview-device]")),
    previewModeBtns: Array.from(document.querySelectorAll("[data-preview-mode]")),
    // Login Modal
    loginModal: document.getElementById("admin-login-modal"),
    loginClose: document.getElementById("admin-login-close"),
    loginForm: document.getElementById("admin-login-form"),
    loginEmail: document.getElementById("login-admin-email"),
    loginRepo: document.getElementById("login-gh-repo"),
    loginToken: document.getElementById("login-gh-token"),
    loginError: document.getElementById("login-error-msg"),
    loginSubmitBtn: document.getElementById("login-submit-btn"),
    // Publish Modal
    publishModal: document.getElementById("publish-modal"),
    publishClose: document.getElementById("publish-modal-close"),
    publishSummary: document.getElementById("publish-summary"),
    publishGhBadge: document.getElementById("publish-gh-badge"),
    publishGhResult: document.getElementById("publish-gh-result"),
    btnPublishGithub: document.getElementById("btn-publish-github"),
    btnDownloadZipUi: document.getElementById("btn-download-zip-ui"),
    btnDownloadZip: document.getElementById("btn-download-zip"),
    btnDownloadDatajson: document.getElementById("btn-download-datajson"),
    btnDownloadDatajs: document.getElementById("btn-download-datajs"),
    btnCopyDatajs: document.getElementById("btn-copy-datajs"),
    // Modal Konfirmasi Hapus
    confirmModal: document.getElementById("studio-confirm-modal"),
    confirmBadge: document.getElementById("studio-confirm-badge"),
    confirmTitle: document.getElementById("studio-confirm-title"),
    confirmMessage: document.getElementById("studio-confirm-message"),
    confirmClose: document.getElementById("studio-confirm-close"),
    confirmCancel: document.getElementById("studio-confirm-cancel"),
    confirmAccept: document.getElementById("studio-confirm-accept"),
  };

  // --------------------------------------------------------------------------
  // Utilitas Ekstrak YouTube ID & Baca File Lokal -> Base64
  // --------------------------------------------------------------------------
  function extractYoutubeId(input) {
    const val = String(input || "").trim();
    if (!val) return "";
    if (/^[a-zA-Z0-9_-]{11}$/.test(val)) return val;
    const match = val.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : val;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function sanitizeFilename(name) {
    return String(name || "file")
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-+/g, "-");
  }

  function registerLocalMediaUpload(file, folder) {
    return readFileAsDataUrl(file).then((dataUrl) => {
      const cleanName = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const repoPath = `public/uploads/${folder}/${cleanName}`;
      const publicUrl = `/uploads/${folder}/${cleanName}`;
      const base64Content = dataUrl.split(",")[1] || "";

      studio.pendingUploads.push({
        repoPath,
        publicUrl,
        dataUrl,
        base64Content,
        name: file.name,
      });

      return { dataUrl, publicUrl };
    });
  }

  // --------------------------------------------------------------------------
  // Generator File `data.json` & `data.js` Bersih Lengkap dengan Komentar
  // --------------------------------------------------------------------------
  function generateDataJsonContent(sourceData) {
    const clean = App.deepClone(sourceData);
    return `${JSON.stringify(clean, null, 2)}\n`;
  }

  function generateDataJsContent(sourceData) {
    const clean = App.deepClone(sourceData);
    const serialized = JSON.stringify(clean, null, 2);
    return `/**
 * ============================================================================
 * FILE DATA KONTEN & TAMPILAN WEBSITE — CATATAN TEDUH
 * ============================================================================
 * Diperbarui melalui Studio Visual Editor pada ${new Date().toLocaleString("id-ID")}.
 * File ini siap digunakan langsung bersama Cloudflare Pages & GitHub.
 * ============================================================================
 */

window.SITE_DATA = ${serialized};
`;
  }

  // --------------------------------------------------------------------------
  // Render Live Preview di Kanvas Kanan
  // --------------------------------------------------------------------------
  function renderLivePreview() {
    if (!studio.isOpen || !els.studioPreviewMount) return;
    App.renderSiteInto(els.studioPreviewMount, studio.draftData, {
      includeDrafts: studio.previewMode === "draft",
      activeTab: studio.previewActiveTab,
      searchQuery: "",
      isPreview: true,
    });
  }

  function applyPreviewDeviceSize() {
    const frame = els.studioPreviewFrame;
    if (!frame) return;
    const widths = {
      desktop: "100%",
      tablet: "768px",
      mobile: "390px",
    };
    frame.style.maxWidth = widths[studio.previewDevice] || "100%";

    els.deviceBtns.forEach((btn) => {
      const active = btn.dataset.previewDevice === studio.previewDevice;
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("text-gray-900", active);
      btn.classList.toggle("text-gray-300", !active);
    });
  }

  // --------------------------------------------------------------------------
  // Render Sidebar Studio Kiri (4 Sub-Tab Ala Elementor)
  // --------------------------------------------------------------------------
  function renderStudioSidebar() {
    App.syncDynamicFonts(studio.draftData);
    studio.lastTextControl = null;

    els.studioNavTabs.forEach((btn) => {
      const active = btn.dataset.studioTab === studio.studioTab;
      btn.classList.toggle("border-emerald-700", active);
      btn.classList.toggle("text-emerald-800", active);
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("border-transparent", !active);
      btn.classList.toggle("text-gray-600", !active);
    });

    if (studio.studioTab === "tampilan") {
      els.studioPanelBody.innerHTML = renderTabTampilan();
    } else if (studio.studioTab === "beranda") {
      els.studioPanelBody.innerHTML = renderTabBeranda();
    } else if (studio.studioTab === "konten") {
      els.studioPanelBody.innerHTML = renderTabKonten();
    } else {
      els.studioPanelBody.innerHTML = renderTabPengaturan();
    }
  }

  function buildFontSelectOptionsHtml() {
    const fonts = App.getFontCollection(studio.draftData);
    const r2Fonts = fonts.filter((f) => f.sumber === "r2");
    const googleArab = fonts.filter((f) => f.sumber === "google" && f.kategori === "arab");
    const googleLatin = fonts.filter((f) => f.sumber === "google" && f.kategori !== "arab");

    const opt = (f) => `<option value="${App.escapeHtml(f.id)}">${App.escapeHtml(f.nama)}</option>`;
    return `
      ${r2Fonts.length ? `<optgroup label="Font Upload R2">${r2Fonts.map(opt).join("")}</optgroup>` : ""}
      ${googleArab.length ? `<optgroup label="Google Fonts — Arab / Qur'an / Hadis">${googleArab.map(opt).join("")}</optgroup>` : ""}
      ${googleLatin.length ? `<optgroup label="Google Fonts — Latin / Umum">${googleLatin.map(opt).join("")}</optgroup>` : ""}
    `;
  }

  function renderRichTextFontToolbar(hint) {
    return `
      <div class="sticky top-0 z-10 p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/90 backdrop-blur-xs space-y-2 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold text-emerald-950">Pilih Font untuk Teks Tertentu</span>
          <span id="studio-font-active-field" class="text-[10px] font-medium text-emerald-800 truncate">${App.escapeHtml(
            hint || "Sorot teks di salah satu kolom"
          )}</span>
        </div>
        <select id="studio-text-font-select" class="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-700">
          ${buildFontSelectOptionsHtml()}
        </select>
        <div class="flex flex-wrap gap-1.5 text-[11px]">
          <button
            type="button"
            id="btn-apply-selection-font"
            class="flex-1 py-1.5 px-2.5 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            title="Terapkan font ke teks yang sedang Anda blok/sorot"
          >
            Terapkan ke Teks Terpilih
          </button>
          <button
            type="button"
            id="btn-apply-field-font"
            class="py-1.5 px-2.5 font-medium text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            title="Terapkan font ke seluruh isi kolom yang sedang dipilih"
          >
            Semua Kolom
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
          <button
            type="button"
            id="btn-apply-arab-block"
            class="py-1 px-2 font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
            title="Bungkus sebagai blok kutipan Arab rata kanan dengan latar lembut"
          >
            + Blok Arab Rata Kanan
          </button>
          <button
            type="button"
            id="btn-clear-text-font"
            class="ml-auto py-1 px-2 font-medium text-gray-600 bg-white hover:bg-stone-100 border border-stone-200 rounded-md transition-colors"
            title="Hapus pilihan font khusus pada teks terpilih atau kolom aktif"
          >
            Hapus Font
          </button>
        </div>
        <p class="text-[10px] text-emerald-900/80 leading-snug">
          Teks Arab berdiri sendiri otomatis rata kanan; teks Arab yang terapit teks Latin tetap rata kiri secara rapi.
        </p>
      </div>
    `;
  }

  function renderTabTampilan() {
    const t = studio.draftData.tampilan || {};
    const warnaOpts = [
      { id: "emerald", label: "Zamrud", swatch: "#047857" },
      { id: "teal", label: "Teal Teduh", swatch: "#0f766e" },
      { id: "indigo", label: "Indigo", swatch: "#3730a3" },
      { id: "amber", label: "Kayu Hangat", swatch: "#92400e" },
      { id: "slate", label: "Batu Arang", swatch: "#334155" },
    ];

    const fontOpts = [
      { id: "editorial", label: "Editorial (Fraunces + Sans)" },
      { id: "modern", label: "Modern Geometris (Plus Jakarta)" },
      { id: "klasik", label: "Klasik Buku (Source Serif 4)" },
    ];

    const cardOpts = [
      { id: "halus", label: "Halus (Shadow Ringan)" },
      { id: "minimal", label: "Minimalis (Garis Datar)" },
      { id: "hangat", label: "Kertas Hangat (Isi Gading)" },
    ];

    const allTabs = ["tulisan", "ebook", "flyer", "audio", "video", "diskusi"];
    const activeTabs = Array.isArray(t.tabAktif) ? t.tabAktif : [...allTabs];
    const hiddenTabs = allTabs.filter((k) => !activeTabs.includes(k));
    const orderedTabs = [...activeTabs, ...hiddenTabs];

    return `
      <div class="space-y-6">
        <!-- Warna Aksen -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2.5">Warna Aksen Utama</label>
          <div class="grid grid-cols-5 gap-2">
            ${warnaOpts
              .map(
                (w) => `
              <button
                type="button"
                data-style-warna="${w.id}"
                class="flex flex-col items-center gap-1.5 p-2 rounded-xl border ${
                  (t.warnaAksen || "emerald") === w.id
                    ? "border-emerald-700 bg-emerald-50/70"
                    : "border-stone-200 hover:bg-stone-50"
                } transition-colors"
                title="${w.label}"
              >
                <span class="w-6 h-6 rounded-full border border-black/10" style="background:${w.swatch}"></span>
                <span class="text-[10px] font-medium text-gray-700 truncate w-full text-center">${w.label}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Tipografi -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2">Pasangan Huruf (Tipografi)</label>
          <div class="space-y-2">
            ${fontOpts
              .map(
                (f) => `
              <button
                type="button"
                data-style-font="${f.id}"
                class="w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                  (t.jenisFont || "editorial") === f.id
                    ? "border-emerald-700 bg-emerald-50/70 text-emerald-900"
                    : "border-stone-200 text-gray-700 hover:bg-stone-50"
                }"
              >
                <span>${f.label}</span>
                ${(t.jenisFont || "editorial") === f.id ? "<span>Aktif</span>" : ""}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Gaya Kartu -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2">Gaya Permukaan Kartu</label>
          <div class="space-y-2">
            ${cardOpts
              .map(
                (c) => `
              <button
                type="button"
                data-style-card="${c.id}"
                class="w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                  (t.gayaKartu || "halus") === c.id
                    ? "border-emerald-700 bg-emerald-50/70 text-emerald-900"
                    : "border-stone-200 text-gray-700 hover:bg-stone-50"
                }"
              >
                <span>${c.label}</span>
                ${(t.gayaKartu || "halus") === c.id ? "<span>Aktif</span>" : ""}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Koleksi Font Pilihan (Cloudflare R2 & Google Fonts) -->
        <div class="pt-4 border-t border-stone-200 space-y-3">
          <div>
            <p class="text-xs font-semibold text-gray-700">Koleksi Font Pilihan Teks (R2 &amp; Google Fonts)</p>
            <p class="text-[11px] text-gray-500 leading-relaxed mt-0.5">
              Font di bawah bukan default paksa, melainkan daftar pilihan yang dapat Anda terapkan pada kata, ayat, atau paragraf tertentu saat menulis konten.
            </p>
          </div>

          <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            ${App.getFontCollection(studio.draftData)
              .map(
                (f) => `
              <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                      f.sumber === "r2"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-indigo-50 text-indigo-800"
                    }">${f.sumber === "r2" ? "R2" : "Google"}</span>
                    <span class="text-[11px] font-semibold text-gray-800 truncate">${App.escapeHtml(f.nama)}</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1 truncate" dir="${f.kategori === "arab" ? "rtl" : "ltr"}" style="font-family: '${App.escapeHtml(
                    f.family
                  )}', serif;">
                    ${f.kategori === "arab" ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : "Catatan Teduh — Ruang Berbagi Ilmu"}
                  </p>
                </div>
                ${
                  !f.builtin
                    ? `<button type="button" data-remove-custom-font="${App.escapeHtml(
                        f.id
                      )}" class="px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-50 rounded-md shrink-0">Hapus</button>`
                    : `<span class="text-[10px] text-gray-400 shrink-0">Bawaan</span>`
                }
              </div>
            `
              )
              .join("")}
          </div>

          <div class="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <p class="text-[11px] font-semibold text-gray-700">+ Tambah Font Baru (R2 / Google Fonts)</p>
            <div class="grid grid-cols-2 gap-2">
              <select id="cfg-new-font-source" class="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg">
                <option value="r2">Cloudflare R2 (font/)</option>
                <option value="google">Google Fonts</option>
              </select>
              <select id="cfg-new-font-cat" class="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg">
                <option value="arab">Font Arab / Qur'an</option>
                <option value="latin">Font Latin / Umum</option>
              </select>
            </div>
            <input type="text" id="cfg-new-font-name" placeholder="Nama label font (mis. LPMQ Isep Misbah / Cairo)" class="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg" />
            <input type="text" id="cfg-new-font-value" placeholder="Nama file R2 (mis. lpmq.woff2) atau nama Google Font" class="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg" />
            <button type="button" id="btn-add-custom-font" class="w-full py-2 px-3 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
              Tambahkan ke Koleksi Font
            </button>
            <p id="cfg-font-status" class="text-[11px] text-gray-500"></p>
          </div>
        </div>

        <!-- Elemen Beranda -->
        <div class="pt-4 border-t border-stone-200 space-y-3">
          <p class="text-xs font-semibold text-gray-700">Elemen di Halaman Beranda</p>
          ${[
            { key: "tampilkanSorotan", label: "Kartu Sorotan Pilihan (Kanan)" },
            { key: "tampilkanPencarian", label: "Kotak Pencarian Real-Time" },
          ]
            .map(
              (item) => `
            <label class="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer">
              <span class="text-xs font-medium text-gray-700">${item.label}</span>
              <input
                type="checkbox"
                data-style-toggle="${item.key}"
                ${t[item.key] !== false ? "checked" : ""}
                class="w-4 h-4 accent-emerald-700 rounded"
              />
            </label>
          `
            )
            .join("")}
        </div>

        <!-- Urutan & Visibilitas Tab -->
        <div class="pt-4 border-t border-stone-200 space-y-2.5">
          <p class="text-xs font-semibold text-gray-700">Susunan &amp; Visibilitas Tab Navigasi</p>
          <div class="space-y-2">
            ${orderedTabs
              .map((tabKey) => {
                const isVisible = activeTabs.includes(tabKey);
                const meta = App.TAB_META[tabKey];
                return `
                  <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
                    <span class="text-xs font-medium ${isVisible ? "text-gray-800" : "text-gray-400 line-through"}">${App.escapeHtml(
                  meta.label
                )}</span>
                    <div class="flex items-center gap-1">
                      ${
                        isVisible
                          ? `
                        <button type="button" data-move-tab="${tabKey}" data-dir="-1" class="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Geser naik">&uarr;</button>
                        <button type="button" data-move-tab="${tabKey}" data-dir="1" class="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Geser turun">&darr;</button>
                      `
                          : ""
                      }
                      <button
                        type="button"
                        data-toggle-tab="${tabKey}"
                        class="px-2.5 py-1 text-[11px] font-medium rounded ${
                          isVisible
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-stone-100 text-gray-500"
                        }"
                      >
                        ${isVisible ? "Tampil" : "Tersembunyi"}
                      </button>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderTabBeranda() {
    const p = studio.draftData.profil || {};
    return `
      <div class="space-y-4">
        <p class="text-xs text-gray-500 leading-relaxed">
          Setiap teks yang Anda ketik di sini akan langsung terlihat pada Live Preview di sebelah kanan.
        </p>

        ${renderRichTextFontToolbar("Sorot teks beranda untuk ganti font")}

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Website (Logo Teks)</label>
          <input type="text" data-profil-field="namaWebsite" data-field-label="Nama Website" value="${App.escapeHtml(p.namaWebsite)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Label Kecil Atas (Kicker)</label>
          <input type="text" data-profil-field="kicker" data-field-label="Label Kecil Atas" value="${App.escapeHtml(p.kicker)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Utama Beranda</label>
          <textarea rows="2" dir="auto" data-profil-field="judulUtama" data-field-label="Judul Utama" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700">${App.escapeHtml(
            p.judulUtama
          )}</textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Subjudul / Tagline di Bawah Judul</label>
          <input type="text" dir="auto" data-profil-field="subjudul" data-field-label="Subjudul" value="${App.escapeHtml(p.subjudul || "— ruang berbagi ilmu & nasihat kehidupan —")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Tujuan Berbagi Ilmu</label>
          <textarea rows="4" dir="auto" data-profil-field="deskripsi" data-field-label="Deskripsi Beranda" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700">${App.escapeHtml(
            p.deskripsi
          )}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Pemilik / Admin</label>
            <input type="text" data-profil-field="namaPemilik" value="${App.escapeHtml(p.namaPemilik)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Tahun Hak Cipta</label>
            <input type="text" data-profil-field="tahunHakCipta" value="${App.escapeHtml(p.tahunHakCipta)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
          </div>
        </div>
      </div>
    `;
  }

  function renderTabKonten() {
    const types = [
      { key: "tulisan", label: "Tulisan" },
      { key: "ebook", label: "Ebook" },
      { key: "flyer", label: "Flyer" },
      { key: "audio", label: "Audio" },
      { key: "video", label: "Video" },
    ];

    const allItems = studio.draftData[studio.contentType] || [];
    const activeItems = allItems.filter((i) => i.status !== "trash");
    const trashItems = allItems.filter((i) => i.status === "trash");
    const totalTrashAllCategories = types.reduce(
      (sum, t) => sum + (studio.draftData[t.key] || []).filter((i) => i.status === "trash").length,
      0
    );

    // Jika sedang membuka form Tambah / Edit
    if (studio.editingItemId !== null) {
      return renderContentItemForm(studio.contentType, studio.editingItemId);
    }

    const currentLabel = types.find((t) => t.key === studio.contentType).label;
    const showingTrash = studio.contentView === "trash";
    const visibleItems = showingTrash ? trashItems : activeItems;

    return `
      <div class="space-y-4">
        <!-- Pilih Kategori Konten -->
        <div class="flex flex-wrap gap-1.5">
          ${types
            .map((t) => {
              const activeCount = (studio.draftData[t.key] || []).filter((i) => i.status !== "trash").length;
              return `
            <button
              type="button"
              data-content-type="${t.key}"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                studio.contentType === t.key
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-stone-200 hover:bg-stone-50"
              }"
            >
              ${t.label} (${activeCount})
            </button>
          `;
            })
            .join("")}
        </div>

        <!-- Pengalih Tampilan: Konten Aktif vs Terhapus Sementara (Sampah) -->
        <div class="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-xl text-[11px] font-semibold">
          <button
            type="button"
            data-content-view="active"
            class="py-1.5 px-2.5 rounded-lg transition-colors ${
              !showingTrash ? "bg-white text-emerald-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }"
          >
            Konten Aktif (${activeItems.length})
          </button>
          <button
            type="button"
            data-content-view="trash"
            class="py-1.5 px-2.5 rounded-lg transition-colors ${
              showingTrash
                ? "bg-white text-amber-800 shadow-xs"
                : totalTrashAllCategories > 0
                ? "text-amber-700 hover:text-amber-900"
                : "text-gray-600 hover:text-gray-900"
            }"
          >
            Hapus Sementara (${trashItems.length})
          </button>
        </div>

        ${
          !showingTrash
            ? `
          <!-- Tombol Tambah Item Baru -->
          <button
            type="button"
            id="btn-add-content-item"
            class="w-full py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            + Tambah ${currentLabel} Baru
          </button>
        `
            : `
          <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 space-y-2">
            <p class="leading-relaxed">
              Konten di sini berstatus <strong>dihapus sementara</strong> (tidak tampil di website) dan masih dapat dipulihkan lagi kapan saja.
            </p>
            ${
              trashItems.length
                ? `
              <button
                type="button"
                id="btn-empty-category-trash"
                class="w-full py-1.5 px-3 text-[11px] font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              >
                Hapus Selamanya Semua Sampah ${currentLabel} (${trashItems.length})
              </button>
            `
                : ""
            }
          </div>
        `
        }

        <!-- Daftar Item -->
        <div class="space-y-2.5">
          ${
            visibleItems.length
              ? visibleItems
                  .map((item) => {
                    if (showingTrash) {
                      const deletedInfo = item.deletedAt
                        ? new Date(item.deletedAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : item.tanggal || item.tahun || "";
                      return `
                        <div class="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-2.5">
                          <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-[11px] font-semibold text-amber-700">Dihapus Sementara</span>
                              <span class="text-[11px] text-gray-400">&middot;</span>
                              <span class="text-[11px] text-gray-500 truncate">${App.escapeHtml(deletedInfo)}</span>
                            </div>
                            <p class="text-xs font-semibold text-gray-900 line-clamp-2">${App.escapeHtml(item.judul)}</p>
                          </div>

                          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/60 text-[11px]">
                            <button
                              type="button"
                              data-restore-item="${App.escapeHtml(item.id)}"
                              class="px-2.5 py-1 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                            >
                              Pulihkan Kembali
                            </button>
                            <button
                              type="button"
                              data-hard-delete-item="${App.escapeHtml(item.id)}"
                              class="ml-auto px-2.5 py-1 font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md"
                            >
                              Hapus Selamanya
                            </button>
                          </div>
                        </div>
                      `;
                    }

                    return `
                      <div class="p-3.5 rounded-xl border border-stone-200 bg-white space-y-2.5">
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-[11px] font-semibold ${
                                item.status === "draft" ? "text-amber-700" : "text-emerald-700"
                              }">
                                ${item.status === "draft" ? "Draft" : "Tayang"}
                              </span>
                              <span class="text-[11px] text-gray-400">&middot;</span>
                              <span class="text-[11px] text-gray-500 truncate">${App.escapeHtml(item.tanggal || item.tahun || "")}</span>
                            </div>
                            <p class="text-xs font-semibold text-gray-900 line-clamp-2">${App.escapeHtml(item.judul)}</p>
                          </div>
                          <div class="flex items-center gap-1 shrink-0">
                            <button type="button" data-move-item-id="${App.escapeHtml(item.id)}" data-dir="-1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Naikkan">&uarr;</button>
                            <button type="button" data-move-item-id="${App.escapeHtml(item.id)}" data-dir="1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Turunkan">&darr;</button>
                          </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
                          <button type="button" data-edit-item="${App.escapeHtml(item.id)}" class="px-2 py-1 font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md">
                            Edit
                          </button>
                          <button type="button" data-toggle-item-status="${App.escapeHtml(item.id)}" class="px-2 py-1 font-medium text-gray-700 bg-stone-100 hover:bg-stone-200 rounded-md">
                            ${item.status === "draft" ? "Tayangkan" : "Draft"}
                          </button>
                          <button type="button" data-soft-delete-item="${App.escapeHtml(item.id)}" class="ml-auto px-2 py-1 font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-md">
                            Hapus Sementara
                          </button>
                          <button type="button" data-hard-delete-item="${App.escapeHtml(item.id)}" class="px-2 py-1 font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-md">
                            Hapus Selamanya
                          </button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `<p class="text-xs text-gray-500 text-center py-6">${
                  showingTrash
                    ? "Belum ada konten yang dihapus sementara pada kategori ini."
                    : "Belum ada konten aktif pada kategori ini."
                }</p>`
          }
        </div>
      </div>
    `;
  }

  function renderContentItemForm(type, itemId) {
    const isNew = itemId === "new";
    const existing = !isNew ? (studio.draftData[type] || []).find((i) => i.id === itemId) : null;
    const todayStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    const statusVal = existing ? existing.status || "published" : "published";

    let fieldsHtml = "";
    if (type === "tulisan") {
      const isiText = existing && Array.isArray(existing.isi) ? existing.isi.join("\n\n") : "";
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Artikel</label>
          <input name="judul" dir="auto" data-field-label="Judul Artikel" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
            <input name="kategori" value="${App.escapeHtml(existing?.kategori || "Refleksi Diri")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Waktu Baca</label>
            <input name="waktuBaca" value="${App.escapeHtml(existing?.waktuBaca || "4 menit baca")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
          <input name="tanggal" value="${App.escapeHtml(existing?.tanggal || todayStr)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Singkat</label>
          <textarea name="ringkasan" dir="auto" data-field-label="Ringkasan" rows="2" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Isi Artikel Lengkap (pisahkan paragraf dengan Enter 2x)</label>
          <textarea name="isi" dir="auto" data-field-label="Isi Artikel" rows="7" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm leading-relaxed">${App.escapeHtml(isiText)}</textarea>
        </div>
      `;
    } else if (type === "ebook") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Ebook</label>
          <input name="judul" dir="auto" data-field-label="Judul Ebook" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Penulis</label>
            <input name="penulis" value="${App.escapeHtml(existing?.penulis || studio.draftData.profil?.namaPemilik || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Tahun</label>
            <input name="tahun" value="${App.escapeHtml(existing?.tahun || "2026")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Jumlah Halaman</label>
            <input name="halaman" value="${App.escapeHtml(existing?.halaman || "32 Halaman")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Ukuran File</label>
            <input name="ukuranFile" value="${App.escapeHtml(existing?.ukuranFile || "1,5 MB")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL Gambar Sampul atau Unggah</label>
          <input name="sampul" id="field-ebook-sampul" value="${App.escapeHtml(existing?.sampul || "/src/assets/images/ebook_ketenangan_1795070324246.jpg")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept="image/*" data-upload-target="field-ebook-sampul" data-upload-folder="images" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL File PDF atau Unggah PDF</label>
          <input name="fileUrl" id="field-ebook-pdf" value="${App.escapeHtml(existing?.fileUrl || "/downloads/seni-merawat-ketenangan-hati.pdf")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept=".pdf,application/pdf" data-upload-target="field-ebook-pdf" data-upload-folder="downloads" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Singkat</label>
          <textarea name="deskripsi" dir="auto" data-field-label="Deskripsi Ebook" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.deskripsi || "")}</textarea>
        </div>
      `;
    } else if (type === "flyer") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Flyer Nasihat</label>
          <input name="judul" dir="auto" data-field-label="Judul Flyer" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Tema</label>
            <input name="tema" value="${App.escapeHtml(existing?.tema || "Nasihat Diri")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
            <input name="tanggal" value="${App.escapeHtml(existing?.tanggal || todayStr)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL Gambar Flyer atau Unggah Gambar</label>
          <input name="gambar" id="field-flyer-gambar" required value="${App.escapeHtml(existing?.gambar || "/src/assets/images/flyer_sabar_1795070324398.jpg")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept="image/*" data-upload-target="field-flyer-gambar" data-upload-folder="images" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Kutipan / Teks Nasihat</label>
          <textarea name="nasihat" dir="auto" data-field-label="Teks Nasihat" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.nasihat || "")}</textarea>
        </div>
      `;
    } else if (type === "audio") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Audio Kajian / Siniar</label>
          <input name="judul" dir="auto" data-field-label="Judul Audio" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Seri</label>
            <input name="seri" value="${App.escapeHtml(existing?.seri || "Siniar Jeda")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Durasi</label>
            <input name="durasi" value="${App.escapeHtml(existing?.durasi || "05:00")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
          <input name="tanggal" value="${App.escapeHtml(existing?.tanggal || todayStr)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL Audio (.mp3 / .wav) atau Unggah File</label>
          <input name="audioUrl" id="field-audio-url" required value="${App.escapeHtml(existing?.audioUrl || "/audio/nasihat-berbaik-sangka.wav")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept="audio/*" data-upload-target="field-audio-url" data-upload-folder="audio" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Materi</label>
          <textarea name="ringkasan" dir="auto" data-field-label="Ringkasan Audio" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
        </div>
      `;
    } else if (type === "video") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Video</label>
          <input name="judul" dir="auto" data-field-label="Judul Video" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Link YouTube atau ID Video (11 karakter)</label>
          <input name="youtubeId" required placeholder="https://youtu.be/... atau ID" value="${App.escapeHtml(existing?.youtubeId || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
            <input name="kategori" value="${App.escapeHtml(existing?.kategori || "Kajian Ringkas")}" class="w-full px-2.5 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Durasi</label>
            <input name="durasi" value="${App.escapeHtml(existing?.durasi || "10 menit")}" class="w-full px-2.5 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
            <input name="tanggal" value="${App.escapeHtml(existing?.tanggal || todayStr)}" class="w-full px-2.5 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Materi</label>
          <textarea name="ringkasan" dir="auto" data-field-label="Ringkasan Video" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
        </div>
      `;
    }

    return `
      <form id="studio-item-form" class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-stone-200">
          <h3 class="text-sm font-semibold text-gray-900">
            ${isNew ? "Tambah Konten Baru" : "Edit Konten"}
          </h3>
          <button type="button" id="btn-cancel-item-form" class="text-xs text-gray-500 hover:text-gray-900">
            &larr; Kembali
          </button>
        </div>

        ${renderRichTextFontToolbar("Klik / sorot teks di kolom lalu pilih font")}

        ${fieldsHtml}

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Status Tayang</label>
          <select name="status" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white">
            <option value="published" ${statusVal === "published" ? "selected" : ""}>Tayang (Publik)</option>
            <option value="draft" ${statusVal === "draft" ? "selected" : ""}>Draft (Hanya di Pratinjau)</option>
          </select>
        </div>

        <div class="pt-2 flex gap-2">
          <button type="submit" class="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors">
            Simpan ke Preview
          </button>
          <button type="button" id="btn-cancel-item-form-2" class="py-2.5 px-4 text-xs font-medium text-gray-700 bg-stone-100 hover:bg-stone-200 rounded-xl">
            Batal
          </button>
        </div>
      </form>
    `;
  }

  function renderTabPengaturan() {
    const g = studio.draftData.giscus || {};
    const gh = studio.github;
    const allowedEmail = getAllowedAdminEmail();
    return `
      <div class="space-y-6">
        <div class="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950">
          <p class="font-semibold mb-0.5">Akun Pemilik Terotorisasi</p>
          <p class="text-emerald-800">${App.escapeHtml(allowedEmail)}</p>
        </div>

        <!-- Koneksi Admin GitHub -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-gray-800">Koneksi Auto-Publish GitHub</h3>
            <span class="text-[11px] font-medium ${gh.verified ? "text-emerald-700" : "text-gray-500"}">
              ${gh.verified ? `Terhubung (@${App.escapeHtml(gh.userLogin)})` : "Mode Lokal"}
            </span>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1">Repositori (username/repo)</label>
            <input type="text" id="cfg-gh-repo" value="${App.escapeHtml(gh.repo || g.repo || "N45hrY4qub/catatanteduh")}" placeholder="N45hrY4qub/catatanteduh" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-medium text-gray-600 mb-1">Branch</label>
              <input type="text" id="cfg-gh-branch" value="${App.escapeHtml(gh.branch || "main")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-gray-600 mb-1">Jalur File Data Utama</label>
              <input type="text" id="cfg-gh-path" value="${App.escapeHtml(gh.filePath || "public/data.json")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1">GitHub Personal Access Token</label>
            <input type="password" id="cfg-gh-token" value="${App.escapeHtml(gh.token)}" placeholder="github_pat_..." class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-verify-gh-sidebar" class="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors">
              Verifikasi Koneksi GitHub
            </button>
            <button type="button" id="btn-reset-draft-local" class="py-2 px-3 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl">
              Reset Draft
            </button>
          </div>
          <p id="cfg-gh-status" class="text-[11px] text-gray-500"></p>
        </div>

        <!-- Pengaturan Giscus -->
        <div class="pt-4 border-t border-stone-200 space-y-3">
          <h3 class="text-xs font-semibold text-gray-800">Pengaturan Ruang Diskusi (Giscus)</h3>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1">Giscus Repo (username/repo)</label>
            <input type="text" data-giscus-field="repo" value="${App.escapeHtml(g.repo)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-medium text-gray-600 mb-1">Repo ID</label>
              <input type="text" data-giscus-field="repoId" value="${App.escapeHtml(g.repoId)}" placeholder="R_kgDO..." class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-gray-600 mb-1">Category ID</label>
              <input type="text" data-giscus-field="categoryId" value="${App.escapeHtml(g.categoryId)}" placeholder="DIC_kwDO..." class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1">Nama Kategori Discussions</label>
            <input type="text" data-giscus-field="category" value="${App.escapeHtml(g.category)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
          </div>
        </div>

        <!-- Cadangan & Pemulihan Konten -->
        <div class="pt-4 border-t border-stone-200 space-y-3">
          <h3 class="text-xs font-semibold text-gray-800">Cadangan &amp; Pemulihan Konten (Backup / Restore)</h3>
          <p class="text-[11px] text-gray-500 leading-relaxed">
            Simpan cadangan seluruh tulisan, ebook, flyer, audio, video, dan pengaturan sebelum memperbarui tampilan atau fitur baru.
          </p>
          <button type="button" id="btn-backup-content-json" class="w-full py-2 px-3 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors">
            Unduh Backup Konten (.json)
          </button>
          <div class="space-y-2 pt-1">
            <label class="block text-[11px] font-medium text-gray-600">Mode Pemulihan Backup</label>
            <select id="cfg-restore-mode" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white">
              <option value="merge">Gabung dengan Konten Saat Ini (Aman)</option>
              <option value="replace">Pulihkan Penuh dari Backup</option>
            </select>
            <label class="block w-full text-center py-2 px-3 text-xs font-semibold text-gray-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl cursor-pointer transition-colors">
              Impor / Pulihkan Konten (.json)
              <input type="file" id="input-restore-backup" accept=".json,application/json" class="sr-only" />
            </label>
          </div>
          <p id="cfg-backup-status" class="text-[11px] text-gray-500 leading-relaxed"></p>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Verifikasi GitHub API & Publish Commit
  // --------------------------------------------------------------------------
  async function parseGitHubError(res, fallbackMsg) {
    let raw = "";
    try {
      const json = await res.json();
      const details = Array.isArray(json.errors)
        ? json.errors.map((e) => e.message || JSON.stringify(e)).join("; ")
        : "";
      raw = [json.message, details].filter(Boolean).join(" — ");
    } catch (_e) {
      raw = await res.text().catch(() => "");
    }
    return `GitHub API Error ${res.status}${raw ? `: ${raw}` : ` (${fallbackMsg})`}`;
  }

  async function verifyGitHubAccess(repoSlug, token) {
    const cleanRepo = String(repoSlug || "").trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/\/+$/, "");
    const cleanToken = String(token || "").trim();
    if (!cleanRepo || !cleanRepo.includes("/") || !cleanToken) {
      throw new Error("Masukkan nama repositori (username/repo) dan GitHub Token terlebih dahulu.");
    }
    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      Accept: "application/vnd.github+json",
    };

    const userRes = await fetch("https://api.github.com/user", { headers, cache: "no-store" });
    if (!userRes.ok) {
      throw new Error(await parseGitHubError(userRes, "Token GitHub tidak valid atau kedaluwarsa"));
    }
    const userJson = await userRes.json();

    const repoRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, { headers, cache: "no-store" });
    if (!repoRes.ok) {
      throw new Error(await parseGitHubError(repoRes, `Repositori "${cleanRepo}" tidak ditemukan`));
    }
    const repoJson = await repoRes.json();

    if (repoJson.permissions && !repoJson.permissions.push) {
      throw new Error(`Akun @${userJson.login} tidak memiliki izin tulis (push) ke repositori ${cleanRepo}.`);
    }

    return {
      userLogin: userJson.login,
      repo: cleanRepo,
      defaultBranch: repoJson.default_branch || "main",
    };
  }

  async function githubGetFileSha(repoSlug, token, branch, filePath) {
    const cleanPath = String(filePath || "").replace(/^\/+/, "");
    const apiUrl = `https://api.github.com/repos/${repoSlug}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}&_=${Date.now()}`;
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.sha ? data.sha : null;
  }

  async function githubPutFile(repoSlug, token, branch, filePath, base64Content, commitMessage) {
    const cleanPath = String(filePath || "").replace(/^\/+/, "");
    const apiUrl = `https://api.github.com/repos/${repoSlug}/contents/${cleanPath}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    const sha = await githubGetFileSha(repoSlug, token, branch, cleanPath);

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      cache: "no-store",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      throw new Error(await parseGitHubError(putRes, `Gagal menyimpan ${cleanPath} ke GitHub`));
    }

    return putRes.json();
  }

  async function resolveDataSyncTargets(repoSlug, token, branch, configuredPath) {
    const clean = String(configuredPath || "public/data.json").trim().replace(/^\/+/, "");
    const targetSet = new Set();

    // Selalu sinkronkan file JSON & JS pada lokasi utama aplikasi
    targetSet.add("public/data.json");
    targetSet.add("public/data.js");

    if (clean) {
      targetSet.add(clean);
      if (clean.endsWith(".json")) {
        targetSet.add(clean.replace(/\.json$/i, ".js"));
      } else if (clean.endsWith(".js")) {
        targetSet.add(clean.replace(/\.js$/i, ".json"));
      }
    }

    // Jika repo memiliki data.json / data.js di root (deploy statis tanpa folder public/), ikut perbarui
    const rootJsonSha = await githubGetFileSha(repoSlug, token, branch, "data.json");
    if (rootJsonSha) targetSet.add("data.json");
    const rootJsSha = await githubGetFileSha(repoSlug, token, branch, "data.js");
    if (rootJsSha) targetSet.add("data.js");

    return Array.from(targetSet);
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // --------------------------------------------------------------------------
  // Buka / Tutup Mode Studio & Modal Login / Publish
  // --------------------------------------------------------------------------
  function openStudioWorkspace() {
    if (!isAdminAuthorized()) {
      openAdminLoginModal();
      return;
    }
    studio.draftData = loadDraftData();
    studio.isOpen = true;
    syncHeaderStudioButton();
    els.publicWrapper.classList.add("hidden");
    els.studioShell.classList.remove("hidden");
    window.location.hash = "studio";
    updateDraftStatusBadge();
    applyPreviewDeviceSize();
    renderStudioSidebar();
    renderLivePreview();
  }

  function exitStudioWorkspace() {
    studio.isOpen = false;
    els.studioShell.classList.add("hidden");
    els.publicWrapper.classList.remove("hidden");
    if (window.location.hash === "#studio" || window.location.hash === "#admin") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // Terapkan draft yang tersimpan jika ada agar pengguna bisa langsung lihat hasil di situs utama
    App.renderSiteInto(document, studio.draftData || window.SITE_DATA, {
      includeDrafts: false,
      activeTab: "tulisan",
      searchQuery: "",
      isPreview: false,
    });
    syncHeaderStudioButton();
  }

  function openAdminLoginModal() {
    if (isAdminAuthorized()) {
      openStudioWorkspace();
      return;
    }
    if (els.loginEmail) els.loginEmail.value = studio.adminSession?.email || "";
    if (els.loginRepo) {
      els.loginRepo.value = studio.github.repo || studio.draftData?.giscus?.repo || "N45hrY4qub/catatanteduh";
    }
    if (els.loginToken) els.loginToken.value = studio.github.token || "";
    if (els.loginError) els.loginError.classList.add("hidden");
    if (els.loginModal) els.loginModal.classList.remove("hidden");
    if (els.loginEmail) els.loginEmail.focus();
  }

  function closeAdminLoginModal() {
    if (els.loginModal) els.loginModal.classList.add("hidden");
    if (window.location.hash === "#studio" || window.location.hash === "#admin") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function openConfirmModal(opts) {
    if (!els.confirmModal) return;
    studio.pendingConfirmAction = typeof opts.onConfirm === "function" ? opts.onConfirm : null;

    if (els.confirmBadge) {
      els.confirmBadge.textContent = opts.badge || "Konfirmasi";
      els.confirmBadge.className =
        opts.badgeClass || "inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-stone-100 text-gray-700";
    }
    if (els.confirmTitle) els.confirmTitle.textContent = opts.title || "Konfirmasi Tindakan";
    if (els.confirmMessage) els.confirmMessage.textContent = opts.message || "";
    if (els.confirmAccept) {
      els.confirmAccept.textContent = opts.confirmLabel || "Lanjutkan";
      els.confirmAccept.className =
        opts.confirmClass ||
        "px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors";
    }

    els.confirmModal.classList.remove("hidden");
    if (els.confirmCancel) els.confirmCancel.focus();
  }

  function closeConfirmModal() {
    studio.pendingConfirmAction = null;
    if (els.confirmModal) els.confirmModal.classList.add("hidden");
  }

  function openPublishModal() {
    const d = studio.draftData;
    const t = d.tampilan || {};
    const contentKeys = ["tulisan", "ebook", "flyer", "audio", "video"];
    const counts = contentKeys
      .map((k) => `${(d[k] || []).filter((i) => i.status !== "trash").length} ${App.TAB_META[k].navLabel}`)
      .join(" · ");
    const trashTotal = contentKeys.reduce(
      (sum, k) => sum + (d[k] || []).filter((i) => i.status === "trash").length,
      0
    );

    els.publishSummary.innerHTML = `
      <p><strong>Ringkasan Perubahan:</strong></p>
      <p>Tema: <span class="font-medium capitalize">${App.escapeHtml(t.warnaAksen || "emerald")}</span> · Font: <span class="font-medium capitalize">${App.escapeHtml(t.jenisFont || "editorial")}</span></p>
      <p>Konten Aktif: ${App.escapeHtml(counts)}</p>
      ${
        trashTotal > 0
          ? `<p class="text-amber-800 font-medium">${trashTotal} konten berada di daftar Hapus Sementara (dapat dipulihkan lagi).</p>`
          : ""
      }
      ${
        studio.pendingUploads.length
          ? `<p class="text-emerald-800 font-medium">${studio.pendingUploads.length} file media baru siap ikut dikirim ke GitHub.</p>`
          : ""
      }
    `;

    els.publishGhResult.classList.add("hidden");
    if (studio.github.verified && studio.github.repo && studio.github.token) {
      els.publishGhBadge.textContent = `@${studio.github.userLogin} · ${studio.github.repo}`;
      els.publishGhBadge.className = "text-xs font-semibold text-emerald-700";
      els.btnPublishGithub.disabled = false;
    } else {
      els.publishGhBadge.textContent = "Belum terhubung ke GitHub";
      els.publishGhBadge.className = "text-xs font-medium text-amber-700";
      els.btnPublishGithub.disabled = false;
    }

    els.publishModal.classList.remove("hidden");
  }

  // --------------------------------------------------------------------------
  // Event Binding untuk Studio Builder
  // --------------------------------------------------------------------------
  function bindStudioEvents() {
    // Tombol Kelola di Studio Editor di Header (hanya tampil & aktif untuk benyaqub@gmail.com)
    if (els.headerStudioBtn) {
      els.headerStudioBtn.addEventListener("click", openAdminLoginModal);
    }

    // Modal Konfirmasi Hapus (Batal / Tutup / Ya)
    if (els.confirmClose) els.confirmClose.addEventListener("click", closeConfirmModal);
    if (els.confirmCancel) els.confirmCancel.addEventListener("click", closeConfirmModal);
    if (els.confirmModal) {
      els.confirmModal.addEventListener("click", (e) => {
        if (e.target === els.confirmModal) closeConfirmModal();
      });
    }
    if (els.confirmAccept) {
      els.confirmAccept.addEventListener("click", () => {
        const fn = studio.pendingConfirmAction;
        closeConfirmModal();
        if (typeof fn === "function") fn();
      });
    }

    // Shortcut keyboard (Ctrl+Shift+E atau Alt+Shift+E) & Escape untuk modal konfirmasi
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.confirmModal && !els.confirmModal.classList.contains("hidden")) {
        closeConfirmModal();
        return;
      }
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openAdminLoginModal();
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#studio" || window.location.hash === "#admin") {
        openAdminLoginModal();
      }
    });

    // Login Modal Events
    if (els.loginClose) els.loginClose.addEventListener("click", closeAdminLoginModal);
    if (els.loginModal) {
      els.loginModal.addEventListener("click", (e) => {
        if (e.target === els.loginModal) closeAdminLoginModal();
      });
    }

    if (els.loginForm) {
      els.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = (els.loginEmail ? els.loginEmail.value : "").toLowerCase().trim();
        const repo = (els.loginRepo ? els.loginRepo.value : "").trim() || studio.draftData?.giscus?.repo || "N45hrY4qub/catatanteduh";
        const token = (els.loginToken ? els.loginToken.value : "").trim();
        const allowedEmail = getAllowedAdminEmail();

        els.loginError.classList.add("hidden");

        if (email !== allowedEmail) {
          clearAdminSession();
          syncHeaderStudioButton();
          els.loginError.textContent = `Akses ditolak. Fitur Kelola di Studio Editor hanya tersedia untuk akun ${allowedEmail}.`;
          els.loginError.classList.remove("hidden");
          return;
        }

        els.loginSubmitBtn.disabled = true;
        els.loginSubmitBtn.textContent = token ? "Memverifikasi Akun & GitHub..." : "Memverifikasi Akun Pemilik...";

        try {
          if (token) {
            const res = await verifyGitHubAccess(repo, token);
            studio.github.repo = res.repo;
            studio.github.token = token;
            studio.github.branch = studio.github.branch || res.defaultBranch || "main";
            studio.github.userLogin = res.userLogin;
            studio.github.verified = true;
            saveGitHubConfig();
          } else {
            studio.github.repo = repo;
            saveGitHubConfig();
          }

          saveAdminSession(email);
          syncHeaderStudioButton();
          closeAdminLoginModal();
          openStudioWorkspace();
        } catch (err) {
          els.loginError.textContent = err.message;
          els.loginError.classList.remove("hidden");
        } finally {
          els.loginSubmitBtn.disabled = false;
          els.loginSubmitBtn.textContent = "Verifikasi Akun & Buka Studio";
        }
      });
    }

    // Studio Top Bar Events
    if (els.studioExitBtn) els.studioExitBtn.addEventListener("click", exitStudioWorkspace);

    if (els.studioLogoutBtn) {
      els.studioLogoutBtn.addEventListener("click", () => {
        clearAdminSession();
        studio.github.verified = false;
        saveGitHubConfig();
        syncHeaderStudioButton();
        exitStudioWorkspace();
      });
    }

    els.studioToggleSidebar.addEventListener("click", () => {
      studio.sidebarHidden = !studio.sidebarHidden;
      els.studioSidebar.classList.toggle("lg:hidden", studio.sidebarHidden);
      els.studioToggleSidebar.querySelector("span").textContent = studio.sidebarHidden ? "Tampilkan Editor" : "Layar Penuh";
    });

    els.studioSaveDraft.addEventListener("click", () => {
      saveDraftToLocal();
      els.studioSaveDraft.textContent = "Tersimpan!";
      setTimeout(() => {
        els.studioSaveDraft.textContent = "Simpan Draft";
      }, 1500);
    });

    els.studioOpenPublish.addEventListener("click", openPublishModal);

    // Viewport & Preview Mode Switcher
    els.deviceBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        studio.previewDevice = btn.dataset.previewDevice;
        applyPreviewDeviceSize();
      });
    });

    els.previewModeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        studio.previewMode = btn.dataset.previewMode;
        els.previewModeBtns.forEach((b) => {
          const active = b.dataset.previewMode === studio.previewMode;
          b.classList.toggle("bg-emerald-700", active);
          b.classList.toggle("text-white", active);
          b.classList.toggle("text-gray-600", !active);
        });
        renderLivePreview();
      });
    });

    // Studio Sub-Tabs
    els.studioNavTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        studio.studioTab = btn.dataset.studioTab;
        studio.editingItemId = null;
        renderStudioSidebar();
      });
    });

    // Interaksi di dalam Kanvas Live Preview
    els.studioPreviewMount.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-preview-tab]");
      if (tabBtn) {
        studio.previewActiveTab = tabBtn.dataset.previewTab;
        renderLivePreview();
        return;
      }
      const readBtn = e.target.closest("[data-read-article]");
      if (readBtn) {
        App.openArticleModal(readBtn.dataset.readArticle);
        return;
      }
      const flyerBtn = e.target.closest("[data-open-flyer]");
      if (flyerBtn) {
        App.openLightbox(flyerBtn.dataset.openFlyer);
        return;
      }
      const dlBtn = e.target.closest("[data-download-url]");
      if (dlBtn) {
        App.downloadAsset(dlBtn.dataset.downloadUrl, dlBtn.dataset.downloadName);
      }
    });

    // Delegasi Input & Klik pada Sidebar Editor Kiri
    els.studioPanelBody.addEventListener("input", (e) => {
      const profilField = e.target.dataset.profilField;
      if (profilField) {
        studio.draftData.profil[profilField] = e.target.value;
        saveDraftToLocal();
        renderLivePreview();
        return;
      }

      const giscusField = e.target.dataset.giscusField;
      if (giscusField) {
        studio.draftData.giscus[giscusField] = e.target.value;
        saveDraftToLocal();
        renderLivePreview();
      }
    });

    els.studioPanelBody.addEventListener("change", async (e) => {
      // Toggle elemen beranda
      const toggleKey = e.target.dataset.styleToggle;
      if (toggleKey) {
        studio.draftData.tampilan[toggleKey] = e.target.checked;
        saveDraftToLocal();
        renderLivePreview();
        return;
      }

      // Upload file media lokal di form konten
      const targetId = e.target.dataset.uploadTarget;
      if (targetId && e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const folder = e.target.dataset.uploadFolder || "uploads";
        const { dataUrl, publicUrl } = await registerLocalMediaUpload(file, folder);
        const inputEl = document.getElementById(targetId);
        if (inputEl) {
          inputEl.value = dataUrl;
          inputEl.dataset.repoPublicUrl = publicUrl;
        }
        return;
      }

      // Impor / Pulihkan konten dari file backup .json
      if (e.target.id === "input-restore-backup" && e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const modeSelect = document.getElementById("cfg-restore-mode");
        const mode = modeSelect ? modeSelect.value : "merge";
        const statusEl = document.getElementById("cfg-backup-status");

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const contentKeys = ["tulisan", "ebook", "flyer", "audio", "video"];
          const isValidBackup =
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed) &&
            (Boolean(parsed.profil) ||
              Boolean(parsed.tampilan) ||
              contentKeys.some((k) => Array.isArray(parsed[k])));

          if (!isValidBackup) {
            throw new Error("Format file backup tidak dikenali sebagai data Catatan Teduh.");
          }

          const cleanImported = { ...parsed };
          delete cleanImported.exportedAt;
          delete cleanImported.app;
          delete cleanImported.version;

          const normalizedImported = App.normalizeSiteData(cleanImported);
          const currentNormalized = App.normalizeSiteData(studio.draftData);
          let feedbackMsg = "";

          if (mode === "merge") {
            let addedCount = 0;
            contentKeys.forEach((key) => {
              const existingList = Array.isArray(currentNormalized[key]) ? currentNormalized[key] : [];
              const importedList = Array.isArray(normalizedImported[key]) ? normalizedImported[key] : [];
              const seenIds = new Set(existingList.map((item) => item && item.id).filter(Boolean));
              const merged = [...existingList];

              importedList.forEach((item, idx) => {
                if (!item || typeof item !== "object") return;
                const copy = App.deepClone(item);
                if (!copy.id) {
                  copy.id = `${key}-backup-${Date.now()}-${idx}`;
                }
                if (!seenIds.has(copy.id)) {
                  seenIds.add(copy.id);
                  merged.push(copy);
                  addedCount += 1;
                }
              });

              currentNormalized[key] = merged;
            });

            studio.draftData = App.normalizeSiteData(currentNormalized);
            feedbackMsg =
              addedCount > 0
                ? `Berhasil menggabungkan ${addedCount} konten baru dari backup tanpa menghapus konten yang sudah ada.`
                : "Semua konten di file backup sudah ada pada draft saat ini (tidak ada data yang dihapus).";
          } else {
            if (!normalizedImported.profil.emailAdmin) {
              normalizedImported.profil.emailAdmin = getAllowedAdminEmail();
            }
            studio.draftData = normalizedImported;
            feedbackMsg = "Seluruh konten dan pengaturan berhasil dipulihkan dari file backup.";
          }

          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();

          const refreshedStatus = document.getElementById("cfg-backup-status");
          if (refreshedStatus) {
            refreshedStatus.className = "text-[11px] text-emerald-700 font-medium leading-relaxed";
            refreshedStatus.textContent = feedbackMsg;
          }
        } catch (err) {
          if (statusEl) {
            statusEl.className = "text-[11px] text-red-700 leading-relaxed";
            statusEl.textContent = `Gagal memulihkan backup: ${err.message}`;
          }
        } finally {
          e.target.value = "";
        }
      }
    });

    // Lacak kolom & teks yang sedang diblok/dipilih untuk Toolbar Font Teks
    function trackActiveTextSelection(target) {
      if (!target || !["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (target.tagName === "INPUT" && target.type && !["text", "search", ""].includes(target.type)) return;
      if (target.id && target.id.startsWith("cfg-")) return;
      studio.lastTextControl = {
        el: target,
        start: typeof target.selectionStart === "number" ? target.selectionStart : 0,
        end: typeof target.selectionEnd === "number" ? target.selectionEnd : 0,
      };
      const badge = document.getElementById("studio-font-active-field");
      if (badge) {
        const lbl = target.dataset.fieldLabel || target.name || "Kolom teks";
        const selLen = Math.abs((studio.lastTextControl.end || 0) - (studio.lastTextControl.start || 0));
        badge.textContent = selLen > 0 ? `${lbl} (${selLen} huruf dipilih)` : `Kolom: ${lbl}`;
      }
    }

    ["focusin", "keyup", "mouseup", "select"].forEach((evtName) => {
      els.studioPanelBody.addEventListener(evtName, (e) => trackActiveTextSelection(e.target));
    });

    function getTrackedTextTarget() {
      if (studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)) {
        return studio.lastTextControl;
      }
      const fallback = els.studioPanelBody.querySelector("textarea[data-field-label], input[data-field-label]");
      if (!fallback) return null;
      return {
        el: fallback,
        start: fallback.selectionStart || 0,
        end: fallback.selectionEnd || 0,
      };
    }

    function applyTagToTrackedTarget(mode) {
      const targetInfo = getTrackedTextTarget();
      const fontSelect = document.getElementById("studio-text-font-select");
      if (!targetInfo || !fontSelect) return;

      const el = targetInfo.el;
      const fontId = fontSelect.value;
      const val = String(el.value || "");
      let start = Math.min(targetInfo.start, val.length);
      let end = Math.min(targetInfo.end, val.length);
      if (end < start) [start, end] = [end, start];

      if (mode === "clear") {
        if (end > start) {
          const cleaned = App.stripRichTags(val.slice(start, end));
          el.value = val.slice(0, start) + cleaned + val.slice(end);
          el.focus();
          el.setSelectionRange(start, start + cleaned.length);
        } else {
          const cleaned = App.stripRichTags(val);
          el.value = cleaned;
          el.focus();
        }
      } else if (mode === "field") {
        const cleanVal = val.replace(/^\[(font|arab)=[a-z0-9-]+\]([\s\S]*)\[\/\1\]$/i, "$2");
        el.value = `[font=${fontId}]${cleanVal}[/font]`;
        el.focus();
      } else if (mode === "arab-block") {
        const tagOpen = `[arab=${fontId}]`;
        const tagClose = "[/arab]";
        if (end > start) {
          const inner = App.stripRichTags(val.slice(start, end));
          const wrapped = `${tagOpen}${inner}${tagClose}`;
          el.value = val.slice(0, start) + wrapped + val.slice(end);
          el.focus();
          el.setSelectionRange(start + tagOpen.length, start + tagOpen.length + inner.length);
        } else {
          const sample = val.trim() ? "" : "اكتب النص العربي هنا";
          if (!val.trim()) {
            el.value = `${tagOpen}${sample}${tagClose}`;
            el.focus();
            el.setSelectionRange(tagOpen.length, tagOpen.length + sample.length);
          } else {
            const inner = App.stripRichTags(val);
            el.value = `${tagOpen}${inner}${tagClose}`;
            el.focus();
          }
        }
      } else {
        const tagOpen = `[font=${fontId}]`;
        const tagClose = "[/font]";
        if (end > start) {
          const selectedText = val.slice(start, end).replace(/^\[font=[a-z0-9-]+\]([\s\S]*)\[\/font\]$/i, "$1");
          const wrapped = `${tagOpen}${selectedText}${tagClose}`;
          el.value = val.slice(0, start) + wrapped + val.slice(end);
          el.focus();
          el.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selectedText.length);
        } else {
          const placeholder = "Teks di sini";
          const wrapped = `${tagOpen}${placeholder}${tagClose}`;
          el.value = val.slice(0, start) + wrapped + val.slice(start);
          el.focus();
          el.setSelectionRange(start + tagOpen.length, start + tagOpen.length + placeholder.length);
        }
      }

      studio.lastTextControl = {
        el,
        start: el.selectionStart || 0,
        end: el.selectionEnd || 0,
      };
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    els.studioPanelBody.addEventListener("click", async (e) => {
      // Toolbar Font Per-Teks
      if (e.target.closest("#btn-apply-selection-font")) {
        applyTagToTrackedTarget("selection");
        return;
      }
      if (e.target.closest("#btn-apply-field-font")) {
        applyTagToTrackedTarget("field");
        return;
      }
      if (e.target.closest("#btn-apply-arab-block")) {
        applyTagToTrackedTarget("arab-block");
        return;
      }
      if (e.target.closest("#btn-clear-text-font")) {
        applyTagToTrackedTarget("clear");
        return;
      }

      // Tambah / Hapus Koleksi Font Kustom (R2 / Google Fonts)
      if (e.target.closest("#btn-add-custom-font")) {
        const sumberEl = document.getElementById("cfg-new-font-source");
        const catEl = document.getElementById("cfg-new-font-cat");
        const nameEl = document.getElementById("cfg-new-font-name");
        const valEl = document.getElementById("cfg-new-font-value");
        const statusEl = document.getElementById("cfg-font-status");

        const sumber = sumberEl ? sumberEl.value : "r2";
        const kategori = catEl ? catEl.value : "arab";
        const rawVal = valEl ? valEl.value.trim() : "";
        const nama = (nameEl ? nameEl.value.trim() : "") || rawVal;

        if (!rawVal) {
          if (statusEl) {
            statusEl.className = "text-[11px] text-red-700";
            statusEl.textContent = "Isi nama file font R2 atau nama Google Font terlebih dahulu.";
          }
          return;
        }

        const slug = nama
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `font-${Date.now()}`;
        const id = `${slug}-${Date.now().toString(36).slice(-4)}`;
        const newEntry =
          sumber === "r2"
            ? {
                id,
                nama: `${nama} (R2)`,
                sumber: "r2",
                family: `CTCustom_${id.replace(/[^a-z0-9]/gi, "_")}`,
                url: App.resolveR2FontUrl(rawVal),
                kategori,
                builtin: false,
              }
            : {
                id,
                nama: `${nama} (Google)`,
                sumber: "google",
                family: rawVal,
                kategori,
                builtin: false,
              };

        const currentList = App.getFontCollection(studio.draftData);
        studio.draftData.tampilan.koleksiFont = [...currentList, newEntry];
        App.syncDynamicFonts(studio.draftData);
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();

        const refreshed = document.getElementById("cfg-font-status");
        if (refreshed) {
          refreshed.className = "text-[11px] text-emerald-700 font-medium";
          refreshed.textContent = `Font "${newEntry.nama}" berhasil ditambahkan ke daftar pilihan.`;
        }
        return;
      }

      const removeFontBtn = e.target.closest("[data-remove-custom-font]");
      if (removeFontBtn) {
        const id = removeFontBtn.dataset.removeCustomFont;
        const currentList = App.getFontCollection(studio.draftData);
        studio.draftData.tampilan.koleksiFont = currentList.filter((f) => f.id !== id || f.builtin);
        App.syncDynamicFonts(studio.draftData);
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      // Pengaturan Warna, Font, Gaya Kartu
      const warnaBtn = e.target.closest("[data-style-warna]");
      if (warnaBtn) {
        studio.draftData.tampilan.warnaAksen = warnaBtn.dataset.styleWarna;
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      const fontBtn = e.target.closest("[data-style-font]");
      if (fontBtn) {
        studio.draftData.tampilan.jenisFont = fontBtn.dataset.styleFont;
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      const cardBtn = e.target.closest("[data-style-card]");
      if (cardBtn) {
        studio.draftData.tampilan.gayaKartu = cardBtn.dataset.styleCard;
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      // Urutan & Visibilitas Tab
      const toggleTabBtn = e.target.closest("[data-toggle-tab]");
      if (toggleTabBtn) {
        const key = toggleTabBtn.dataset.toggleTab;
        const arr = studio.draftData.tampilan.tabAktif || [];
        if (arr.includes(key)) {
          if (arr.length > 1) {
            studio.draftData.tampilan.tabAktif = arr.filter((k) => k !== key);
          }
        } else {
          studio.draftData.tampilan.tabAktif = [...arr, key];
        }
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      const moveTabBtn = e.target.closest("[data-move-tab]");
      if (moveTabBtn) {
        const key = moveTabBtn.dataset.moveTab;
        const dir = Number(moveTabBtn.dataset.dir);
        const arr = [...(studio.draftData.tampilan.tabAktif || [])];
        const idx = arr.indexOf(key);
        const targetIdx = idx + dir;
        if (idx >= 0 && targetIdx >= 0 && targetIdx < arr.length) {
          [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
          studio.draftData.tampilan.tabAktif = arr;
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
        return;
      }

      // Manajemen Konten
      const contentTypeBtn = e.target.closest("[data-content-type]");
      if (contentTypeBtn) {
        studio.contentType = contentTypeBtn.dataset.contentType;
        studio.previewActiveTab = studio.contentType;
        studio.editingItemId = null;
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      const contentViewBtn = e.target.closest("[data-content-view]");
      if (contentViewBtn) {
        studio.contentView = contentViewBtn.dataset.contentView === "trash" ? "trash" : "active";
        studio.editingItemId = null;
        renderStudioSidebar();
        return;
      }

      if (e.target.closest("#btn-add-content-item")) {
        studio.editingItemId = "new";
        renderStudioSidebar();
        return;
      }

      if (e.target.closest("#btn-cancel-item-form") || e.target.closest("#btn-cancel-item-form-2")) {
        studio.editingItemId = null;
        renderStudioSidebar();
        return;
      }

      const editBtn = e.target.closest("[data-edit-item]");
      if (editBtn) {
        studio.editingItemId = editBtn.dataset.editItem;
        renderStudioSidebar();
        return;
      }

      const toggleStatusBtn = e.target.closest("[data-toggle-item-status]");
      if (toggleStatusBtn) {
        const id = toggleStatusBtn.dataset.toggleItemStatus;
        const list = studio.draftData[studio.contentType] || [];
        const item = list.find((i) => i.id === id);
        if (item) {
          item.status = item.status === "draft" ? "published" : "draft";
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
        return;
      }

      const softDeleteBtn = e.target.closest("[data-soft-delete-item]");
      if (softDeleteBtn) {
        const id = softDeleteBtn.dataset.softDeleteItem;
        const list = studio.draftData[studio.contentType] || [];
        const item = list.find((i) => i.id === id);
        if (!item) return;

        openConfirmModal({
          badge: "Hapus Sementara",
          badgeClass: "inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-amber-100 text-amber-800 border border-amber-200",
          title: "Apakah konten akan dihapus sementara?",
          message: `Konten "${item.judul || "Tanpa Judul"}" akan disembunyikan dari website dan dipindahkan ke daftar Hapus Sementara. Anda masih dapat memanggil atau memulihkannya kembali kapan saja.`,
          confirmLabel: "Ya, Hapus Sementara",
          confirmClass: "px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors",
          onConfirm: () => {
            item.previousStatus = item.status === "draft" ? "draft" : "published";
            item.status = "trash";
            item.deletedAt = new Date().toISOString();
            saveDraftToLocal();
            renderStudioSidebar();
            renderLivePreview();
          },
        });
        return;
      }

      const restoreBtn = e.target.closest("[data-restore-item]");
      if (restoreBtn) {
        const id = restoreBtn.dataset.restoreItem;
        const list = studio.draftData[studio.contentType] || [];
        const item = list.find((i) => i.id === id);
        if (item) {
          item.status = item.previousStatus === "draft" ? "draft" : "published";
          delete item.previousStatus;
          delete item.deletedAt;
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
        return;
      }

      const hardDeleteBtn = e.target.closest("[data-hard-delete-item]");
      if (hardDeleteBtn) {
        const id = hardDeleteBtn.dataset.hardDeleteItem;
        const list = studio.draftData[studio.contentType] || [];
        const item = list.find((i) => i.id === id);
        if (!item) return;

        openConfirmModal({
          badge: "Hapus Selamanya",
          badgeClass: "inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-red-100 text-red-800 border border-red-200",
          title: "Apakah konten akan dihapus selamanya?",
          message: `Konten "${item.judul || "Tanpa Judul"}" akan dihapus secara permanen dan tidak dapat digunakan atau dipanggil kembali.`,
          confirmLabel: "Ya, Hapus Selamanya",
          confirmClass: "px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors",
          onConfirm: () => {
            studio.draftData[studio.contentType] = (studio.draftData[studio.contentType] || []).filter((i) => i.id !== id);
            saveDraftToLocal();
            renderStudioSidebar();
            renderLivePreview();
          },
        });
        return;
      }

      if (e.target.closest("#btn-empty-category-trash")) {
        const list = studio.draftData[studio.contentType] || [];
        const trashCount = list.filter((i) => i.status === "trash").length;
        if (!trashCount) return;

        openConfirmModal({
          badge: "Hapus Selamanya",
          badgeClass: "inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-red-100 text-red-800 border border-red-200",
          title: "Apakah semua sampah akan dihapus selamanya?",
          message: `Sebanyak ${trashCount} konten di daftar Hapus Sementara pada kategori ini akan dihapus permanen dan tidak dapat dipanggil kembali.`,
          confirmLabel: "Ya, Hapus Selamanya",
          confirmClass: "px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors",
          onConfirm: () => {
            studio.draftData[studio.contentType] = (studio.draftData[studio.contentType] || []).filter(
              (i) => i.status !== "trash"
            );
            saveDraftToLocal();
            renderStudioSidebar();
            renderLivePreview();
          },
        });
        return;
      }

      const moveItemBtn = e.target.closest("[data-move-item-id]");
      if (moveItemBtn) {
        const id = moveItemBtn.dataset.moveItemId;
        const dir = Number(moveItemBtn.dataset.dir);
        const list = studio.draftData[studio.contentType] || [];
        const activeIndices = [];
        list.forEach((it, idx) => {
          if (it.status !== "trash") activeIndices.push(idx);
        });
        const pos = activeIndices.findIndex((idx) => list[idx].id === id);
        const targetPos = pos + dir;
        if (pos >= 0 && targetPos >= 0 && targetPos < activeIndices.length) {
          const a = activeIndices[pos];
          const b = activeIndices[targetPos];
          [list[a], list[b]] = [list[b], list[a]];
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
        return;
      }

      // Verifikasi GitHub di tab Pengaturan
      if (e.target.closest("#btn-verify-gh-sidebar")) {
        const repo = document.getElementById("cfg-gh-repo").value.trim();
        const branch = document.getElementById("cfg-gh-branch").value.trim() || "main";
        const filePath = document.getElementById("cfg-gh-path").value.trim() || "public/data.json";
        const token = document.getElementById("cfg-gh-token").value.trim();
        const statusEl = document.getElementById("cfg-gh-status");
        statusEl.textContent = "Memeriksa koneksi ke GitHub...";
        try {
          const res = await verifyGitHubAccess(repo, token);
          studio.github = {
            repo: res.repo,
            branch: branch || res.defaultBranch || "main",
            filePath,
            token,
            userLogin: res.userLogin,
            verified: true,
          };
          saveGitHubConfig();
          renderStudioSidebar();
          const refreshedStatus = document.getElementById("cfg-gh-status");
          if (refreshedStatus) {
            refreshedStatus.className = "text-[11px] text-emerald-700 font-medium";
            refreshedStatus.textContent = `Berhasil terhubung sebagai @${res.userLogin} (branch: ${studio.github.branch}).`;
          }
        } catch (err) {
          statusEl.className = "text-[11px] text-red-700";
          statusEl.textContent = err.message;
        }
        return;
      }

      if (e.target.closest("#btn-backup-content-json")) {
        const normalized = App.normalizeSiteData(studio.draftData);
        const backupPayload = {
          app: "Catatan Teduh",
          version: 1,
          exportedAt: new Date().toISOString(),
          ...normalized,
        };
        const blob = new Blob([`${JSON.stringify(backupPayload, null, 2)}\n`], {
          type: "application/json;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateSlug = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `backup-konten-catatanteduh-${dateSlug}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);

        const statusEl = document.getElementById("cfg-backup-status");
        if (statusEl) {
          statusEl.className = "text-[11px] text-emerald-700 font-medium leading-relaxed";
          statusEl.textContent = "File backup konten (.json) berhasil diunduh.";
        }
        return;
      }

      if (e.target.closest("#btn-reset-draft-local")) {
        localStorage.removeItem(STORAGE_DRAFT_KEY);
        const fresh = App.fetchFreshSiteData ? await App.fetchFreshSiteData() : null;
        const normalizedFresh = App.normalizeSiteData(fresh || window.SITE_DATA || {});
        if (fresh) window.SITE_DATA = App.deepClone(normalizedFresh);
        studio.draftData = App.deepClone(normalizedFresh);
        studio.pendingUploads = [];
        studio.hasUnsavedChanges = false;
        updateDraftStatusBadge("Draft direset ke versi server");
        renderStudioSidebar();
        renderLivePreview();
      }
    });

    // Simpan Form Item Konten (Tambah / Edit)
    els.studioPanelBody.addEventListener("submit", (e) => {
      if (e.target.id !== "studio-item-form") return;
      e.preventDefault();
      const formData = new FormData(e.target);
      const type = studio.contentType;
      const isNew = studio.editingItemId === "new";
      const list = studio.draftData[type] || [];

      const id = isNew ? `${type}-${Date.now()}` : studio.editingItemId;
      let newItem = { id, status: formData.get("status") || "published" };

      if (type === "tulisan") {
        const paragraphs = String(formData.get("isi") || "")
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        newItem = {
          ...newItem,
          judul: String(formData.get("judul") || "").trim(),
          kategori: String(formData.get("kategori") || "Refleksi").trim(),
          waktuBaca: String(formData.get("waktuBaca") || "3 menit baca").trim(),
          tanggal: String(formData.get("tanggal") || "").trim(),
          ringkasan: String(formData.get("ringkasan") || "").trim(),
          isi: paragraphs,
        };
      } else if (type === "ebook") {
        newItem = {
          ...newItem,
          judul: String(formData.get("judul") || "").trim(),
          penulis: String(formData.get("penulis") || "").trim(),
          tahun: String(formData.get("tahun") || "2026").trim(),
          halaman: String(formData.get("halaman") || "").trim(),
          ukuranFile: String(formData.get("ukuranFile") || "").trim(),
          sampul: String(formData.get("sampul") || "").trim(),
          fileUrl: String(formData.get("fileUrl") || "").trim(),
          namaFileUnduh: `${sanitizeFilename(formData.get("judul") || "ebook")}.pdf`,
          deskripsi: String(formData.get("deskripsi") || "").trim(),
        };
      } else if (type === "flyer") {
        newItem = {
          ...newItem,
          judul: String(formData.get("judul") || "").trim(),
          tema: String(formData.get("tema") || "").trim(),
          tanggal: String(formData.get("tanggal") || "").trim(),
          gambar: String(formData.get("gambar") || "").trim(),
          nasihat: String(formData.get("nasihat") || "").trim(),
          namaFileUnduh: `${sanitizeFilename(formData.get("judul") || "flyer")}.jpg`,
        };
      } else if (type === "audio") {
        newItem = {
          ...newItem,
          judul: String(formData.get("judul") || "").trim(),
          seri: String(formData.get("seri") || "").trim(),
          durasi: String(formData.get("durasi") || "").trim(),
          tanggal: String(formData.get("tanggal") || "").trim(),
          audioUrl: String(formData.get("audioUrl") || "").trim(),
          ringkasan: String(formData.get("ringkasan") || "").trim(),
        };
      } else if (type === "video") {
        newItem = {
          ...newItem,
          judul: String(formData.get("judul") || "").trim(),
          youtubeId: extractYoutubeId(formData.get("youtubeId")),
          kategori: String(formData.get("kategori") || "").trim(),
          durasi: String(formData.get("durasi") || "").trim(),
          tanggal: String(formData.get("tanggal") || "").trim(),
          ringkasan: String(formData.get("ringkasan") || "").trim(),
        };
      }

      if (isNew) {
        studio.draftData[type] = [newItem, ...list];
      } else {
        studio.draftData[type] = list.map((item) => (item.id === id ? newItem : item));
      }

      studio.editingItemId = null;
      studio.previewActiveTab = type;
      saveDraftToLocal();
      renderStudioSidebar();
      renderLivePreview();
    });

    // Publish Modal Events
    els.publishClose.addEventListener("click", () => els.publishModal.classList.add("hidden"));
    els.publishModal.addEventListener("click", (e) => {
      if (e.target === els.publishModal) els.publishModal.classList.add("hidden");
    });

    function crc32Bytes(bytes) {
      let crc = 0xffffffff;
      for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) {
          crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
      }
      return (crc ^ 0xffffffff) >>> 0;
    }

    function buildZipBlob(entries) {
      const encoder = new TextEncoder();
      const localParts = [];
      const centralParts = [];
      let offset = 0;

      entries.forEach((entry) => {
        const nameBytes = encoder.encode(entry.path);
        const dataBytes = entry.bytes instanceof Uint8Array ? entry.bytes : encoder.encode(String(entry.text || ""));
        const crc = crc32Bytes(dataBytes);
        const size = dataBytes.length;

        const localHeader = new ArrayBuffer(30 + nameBytes.length);
        const lv = new DataView(localHeader);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x0800, true);
        lv.setUint16(8, 0, true);
        lv.setUint16(10, 0, true);
        lv.setUint16(12, 0x5421, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true);
        lv.setUint32(22, size, true);
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true);
        new Uint8Array(localHeader, 30).set(nameBytes);

        localParts.push(new Uint8Array(localHeader), dataBytes);

        const centralHeader = new ArrayBuffer(46 + nameBytes.length);
        const cv = new DataView(centralHeader);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0x5421, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);
        new Uint8Array(centralHeader, 46).set(nameBytes);

        centralParts.push(new Uint8Array(centralHeader));
        offset += 30 + nameBytes.length + size;
      });

      const cdSize = centralParts.reduce((sum, p) => sum + p.length, 0);
      const eocd = new ArrayBuffer(22);
      const ev = new DataView(eocd);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(4, 0, true);
      ev.setUint16(6, 0, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, cdSize, true);
      ev.setUint32(16, offset, true);
      ev.setUint16(20, 0, true);

      return new Blob([...localParts, ...centralParts, new Uint8Array(eocd)], { type: "application/zip" });
    }

    function base64ToUint8Array(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    async function fetchTextFirst(urls) {
      const bust = Date.now();
      for (const u of urls) {
        try {
          const res = await fetch(`${u}?t=${bust}`, { cache: "no-store" });
          if (res.ok) return await res.text();
        } catch (_e) {}
      }
      throw new Error(`Gagal mengambil file ${urls[0]}`);
    }

    async function exportProjectZip(btnEl, { includeData }) {
      if (!btnEl) return;
      const origText = btnEl.textContent;
      btnEl.disabled = true;
      btnEl.textContent = "Menyiapkan arsip .zip...";
      try {
        const rawHtml = await fetchTextFirst(["/index.html", "/"]);
        const cleanHtml = rawHtml.replace(/\s*<script[^>]*src="\/@vite\/client"[^>]*><\/script>/gi, "");
        const appJs = await fetchTextFirst(["/app.js", "/public/app.js"]);
        const studioJs = await fetchTextFirst(["/studio.js", "/public/studio.js"]);

        const entries = [
          { path: "index.html", text: cleanHtml },
          { path: "public/app.js", text: appJs },
          { path: "public/studio.js", text: studioJs },
        ];

        if (includeData) {
          const exportData = App.normalizeSiteData(studio.draftData);
          if (studio.pendingUploads.length) {
            let updatedJsonStr = JSON.stringify(exportData);
            studio.pendingUploads.forEach((up) => {
              if (up.dataUrl && updatedJsonStr.includes(up.dataUrl)) {
                updatedJsonStr = updatedJsonStr.split(up.dataUrl).join(up.publicUrl);
              }
            });
            Object.assign(exportData, JSON.parse(updatedJsonStr));
          }

          entries.push(
            { path: "public/data.json", text: generateDataJsonContent(exportData) },
            { path: "public/data.js", text: generateDataJsContent(exportData) }
          );

          studio.pendingUploads.forEach((up) => {
            if (up.base64Content) {
              entries.push({ path: up.repoPath, bytes: base64ToUint8Array(up.base64Content) });
            }
          });
        }

        const zipBlob = buildZipBlob(entries);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = includeData ? "catatanteduh-lengkap.zip" : "catatanteduh-update-tampilan.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        els.publishGhResult.className = "text-xs rounded-lg p-3 leading-relaxed bg-emerald-50 text-emerald-950 border border-emerald-200";
        els.publishGhResult.innerHTML = includeData
          ? "<strong>Paket Lengkap (.zip) berhasil diunduh.</strong> Berisi kode tampilan sekaligus <code class=\"bg-white/80 px-1 rounded\">public/data.json</code> &amp; <code class=\"bg-white/80 px-1 rounded\">public/data.js</code> terbaru."
          : "<strong>Paket Update Tampilan (.zip) berhasil diunduh.</strong> Hanya berisi <code class=\"bg-white/80 px-1 rounded\">index.html</code>, <code class=\"bg-white/80 px-1 rounded\">public/app.js</code>, dan <code class=\"bg-white/80 px-1 rounded\">public/studio.js</code> sehingga konten lama Anda di GitHub tetap aman.";
        els.publishGhResult.classList.remove("hidden");
      } catch (err) {
        els.publishGhResult.className = "text-xs rounded-lg p-3 bg-red-50 text-red-900 border border-red-200";
        els.publishGhResult.textContent = `Gagal membuat ZIP: ${err.message}`;
        els.publishGhResult.classList.remove("hidden");
      } finally {
        btnEl.disabled = false;
        btnEl.textContent = origText;
      }
    }

    if (els.btnDownloadZipUi) {
      els.btnDownloadZipUi.addEventListener("click", () => exportProjectZip(els.btnDownloadZipUi, { includeData: false }));
    }

    if (els.btnDownloadZip) {
      els.btnDownloadZip.addEventListener("click", () => exportProjectZip(els.btnDownloadZip, { includeData: true }));
    }

    if (els.btnDownloadDatajson) {
      els.btnDownloadDatajson.addEventListener("click", () => {
        const content = generateDataJsonContent(studio.draftData);
        const blob = new Blob([content], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      });
    }

    els.btnDownloadDatajs.addEventListener("click", () => {
      const content = generateDataJsContent(studio.draftData);
      const blob = new Blob([content], { type: "application/javascript;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });

    els.btnCopyDatajs.addEventListener("click", async () => {
      const content = generateDataJsContent(studio.draftData);
      try {
        await navigator.clipboard.writeText(content);
        els.btnCopyDatajs.textContent = "Tersalin!";
        setTimeout(() => {
          els.btnCopyDatajs.textContent = "Salin Kode data.js";
        }, 1800);
      } catch (_e) {}
    });

    els.btnPublishGithub.addEventListener("click", async () => {
      const gh = studio.github;
      if (!gh.verified || !gh.repo || !gh.token) {
        els.publishGhResult.className = "text-xs rounded-lg p-3 leading-relaxed bg-amber-50 text-amber-950 border border-amber-200";
        els.publishGhResult.innerHTML =
          '<strong>Belum terhubung ke GitHub.</strong> Perubahan saat ini baru tersimpan di browser lokal (localStorage). Silakan buka tab <strong>GitHub</strong> di panel kiri Studio Editor, masukkan Repositori &amp; Token GitHub Anda, lalu klik <strong>Verifikasi Koneksi GitHub</strong> sebelum menekan tombol Publish.';
        els.publishGhResult.classList.remove("hidden");
        return;
      }

      els.btnPublishGithub.disabled = true;
      els.btnPublishGithub.textContent = "Menghubungkan & Mengirim ke GitHub...";
      els.publishGhResult.classList.add("hidden");

      try {
        // Pastikan koneksi & default branch valid sebelum commit
        const verifiedRepo = await verifyGitHubAccess(gh.repo, gh.token);
        const targetRepo = verifiedRepo.repo;
        const targetBranch = (gh.branch || verifiedRepo.defaultBranch || "main").trim();

        // 1. Jika ada file upload lokal (data URL), unggah ke repositori & ganti referensinya menjadi publicUrl
        const exportData = App.deepClone(studio.draftData);
        if (studio.pendingUploads.length) {
          for (const up of studio.pendingUploads) {
            await githubPutFile(
              targetRepo,
              gh.token,
              targetBranch,
              up.repoPath,
              up.base64Content,
              `chore: unggah media ${up.name} melalui Studio Visual`
            );
          }

          // Petakan URL dataUrl ke publicUrl agar file data di GitHub ringan & bersih
          let updatedJsonStr = JSON.stringify(exportData);
          studio.pendingUploads.forEach((up) => {
            if (up.dataUrl && updatedJsonStr.includes(up.dataUrl)) {
              updatedJsonStr = updatedJsonStr.split(up.dataUrl).join(up.publicUrl);
            }
          });
          Object.assign(exportData, JSON.parse(updatedJsonStr));
        }

        // 2. Sinkronkan file data utama (public/data.json & public/data.js + root jika ada) ke GitHub
        const targets = await resolveDataSyncTargets(targetRepo, gh.token, targetBranch, gh.filePath);
        const jsonContent = generateDataJsonContent(exportData);
        const jsContent = generateDataJsContent(exportData);

        let lastCommitRes = null;
        for (const filePath of targets) {
          const isJson = filePath.toLowerCase().endsWith(".json");
          const rawContent = isJson ? jsonContent : jsContent;
          lastCommitRes = await githubPutFile(
            targetRepo,
            gh.token,
            targetBranch,
            filePath,
            utf8ToBase64(rawContent),
            `content: perbarui ${filePath} melalui Studio Visual`
          );
        }

        // 3. Perbarui state memori, bersihkan draft localStorage, & sinkronkan tampilan
        studio.draftData = exportData;
        window.SITE_DATA = App.deepClone(exportData);
        studio.pendingUploads = [];
        studio.hasUnsavedChanges = false;
        localStorage.removeItem(STORAGE_DRAFT_KEY);
        updateDraftStatusBadge("Terpublish ke GitHub");

        const commitUrl = lastCommitRes && lastCommitRes.commit ? lastCommitRes.commit.html_url : "";
        const committedList = targets.map((p) => `<code class="bg-white/80 px-1 rounded">${App.escapeHtml(p)}</code>`).join(", ");

        els.publishGhResult.className = "text-xs rounded-lg p-3.5 leading-relaxed bg-emerald-50 text-emerald-950 border border-emerald-200 space-y-1.5";
        els.publishGhResult.innerHTML = `
          <p><strong>Berhasil dipublikasikan ke GitHub!</strong></p>
          <p>File yang diperbarui pada repositori <strong>${App.escapeHtml(targetRepo)}</strong> (branch <code class="bg-white/80 px-1 rounded">${App.escapeHtml(targetBranch)}</code>): ${committedList}.</p>
          <p class="text-emerald-900">Catatan: Cloudflare Pages membutuhkan waktu sekitar <strong>30–60 detik</strong> untuk membangun ulang dan menyebarkan pembaruan ke seluruh browser dan mode penyamaran (Incognito).</p>
          ${
            commitUrl
              ? `<p><a href="${App.escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer" class="underline font-semibold">Lihat Commit di GitHub &rarr;</a></p>`
              : ""
          }
        `;
        els.publishGhResult.classList.remove("hidden");
      } catch (err) {
        els.publishGhResult.className = "text-xs rounded-lg p-3.5 leading-relaxed bg-red-50 text-red-900 border border-red-200 space-y-1";
        els.publishGhResult.innerHTML = `
          <p><strong>Gagal commit ke GitHub</strong></p>
          <p>${App.escapeHtml(err && err.message ? err.message : String(err))}</p>
        `;
        els.publishGhResult.classList.remove("hidden");
      } finally {
        els.btnPublishGithub.disabled = false;
        els.btnPublishGithub.textContent = "Publish ke GitHub Sekarang";
      }
    });
  }

  // Sinkronkan draftData jika server mengembalikan data.json terbaru dan tidak ada draft lokal tertunda
  window.addEventListener("catatanteduh:data-loaded", (e) => {
    if (!localStorage.getItem(STORAGE_DRAFT_KEY) && !studio.isOpen && e.detail) {
      studio.draftData = App.normalizeSiteData(e.detail);
    }
  });

  // Inisialisasi Studio
  studio.draftData = loadDraftData();
  bindStudioEvents();
  syncHeaderStudioButton();

  if (localStorage.getItem(STORAGE_DRAFT_KEY)) {
    // Tampilkan hasil draft lokal saat pemilik kembali ke situs
    App.renderSiteInto(document, studio.draftData, {
      includeDrafts: false,
      activeTab: "tulisan",
      searchQuery: "",
      isPreview: false,
    });
    syncHeaderStudioButton();
  }

  // Jika pemilik mengakses langsung via #studio atau #admin
  if (window.location.hash === "#studio" || window.location.hash === "#admin") {
    openAdminLoginModal();
  }
})();
