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
    editingItemId: null, // "new" | item.id | null
    previewDevice: "desktop",
    previewMode: "draft", // "draft" | "public"
    previewActiveTab: "tulisan",
    sidebarHidden: false,
    hasUnsavedChanges: false,
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
        filePath: saved.filePath || "public/data.js",
        userLogin: saved.userLogin || "",
        verified: Boolean(saved.verified),
      };
    } catch (_e) {
      return { repo: "", token: "", branch: "main", filePath: "public/data.js", userLogin: "", verified: false };
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
        if (parsed && parsed.profil) {
          studio.hasUnsavedChanges = true;
          return parsed;
        }
      }
    } catch (_e) {}
    return App.deepClone(window.SITE_DATA || {});
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
    btnDownloadDatajs: document.getElementById("btn-download-datajs"),
    btnCopyDatajs: document.getElementById("btn-copy-datajs"),
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
  // Generator File `data.js` Bersih Lengkap dengan Komentar Bahasa Indonesia
  // --------------------------------------------------------------------------
  function generateDataJsContent(sourceData) {
    const clean = App.deepClone(sourceData);
    // Saat diekspor untuk GitHub/Cloudflare Pages, ganti dataUrl sementara dengan publicUrl jika ada
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

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Website (Logo Teks)</label>
          <input type="text" data-profil-field="namaWebsite" value="${App.escapeHtml(p.namaWebsite)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Label Kecil Atas (Kicker)</label>
          <input type="text" data-profil-field="kicker" value="${App.escapeHtml(p.kicker)}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Utama Beranda</label>
          <textarea rows="2" data-profil-field="judulUtama" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700">${App.escapeHtml(
            p.judulUtama
          )}</textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Subjudul / Tagline di Bawah Judul</label>
          <input type="text" data-profil-field="subjudul" value="${App.escapeHtml(p.subjudul || "— ruang berbagi ilmu & nasihat kehidupan —")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Tujuan Berbagi Ilmu</label>
          <textarea rows="4" data-profil-field="deskripsi" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700">${App.escapeHtml(
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

    const items = studio.draftData[studio.contentType] || [];

    // Jika sedang membuka form Tambah / Edit
    if (studio.editingItemId !== null) {
      return renderContentItemForm(studio.contentType, studio.editingItemId);
    }

    return `
      <div class="space-y-4">
        <!-- Pilih Kategori Konten -->
        <div class="flex flex-wrap gap-1.5">
          ${types
            .map(
              (t) => `
            <button
              type="button"
              data-content-type="${t.key}"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                studio.contentType === t.key
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-gray-600 border-stone-200 hover:bg-stone-50"
              }"
            >
              ${t.label} (${(studio.draftData[t.key] || []).length})
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Tombol Tambah Item Baru -->
        <button
          type="button"
          id="btn-add-content-item"
          class="w-full py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
        >
          + Tambah ${types.find((t) => t.key === studio.contentType).label} Baru
        </button>

        <!-- Daftar Item -->
        <div class="space-y-2.5">
          ${
            items.length
              ? items
                  .map(
                    (item, idx) => `
                <div class="p-3.5 rounded-xl border border-stone-200 bg-white space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] font-semibold ${
                          item.status === "draft" ? "text-amber-700" : "text-emerald-700"
                        }">
                          ${item.status === "draft" ? "Draft" : "Tayang"}
                        </span>
                        <span class="text-[11px] text-gray-400">·</span>
                        <span class="text-[11px] text-gray-500 truncate">${App.escapeHtml(item.tanggal || item.tahun || "")}</span>
                      </div>
                      <p class="text-xs font-semibold text-gray-900 line-clamp-2">${App.escapeHtml(item.judul)}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" data-move-item="${idx}" data-dir="-1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Naikkan">&uarr;</button>
                      <button type="button" data-move-item="${idx}" data-dir="1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Turunkan">&darr;</button>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-2 border-t border-stone-100 text-[11px]">
                    <button type="button" data-edit-item="${App.escapeHtml(item.id)}" class="px-2.5 py-1 font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md">
                      Edit
                    </button>
                    <button type="button" data-toggle-item-status="${App.escapeHtml(item.id)}" class="px-2.5 py-1 font-medium text-gray-700 bg-stone-100 hover:bg-stone-200 rounded-md">
                      ${item.status === "draft" ? "Jadikan Tayang" : "Simpan sbg Draft"}
                    </button>
                    <button type="button" data-delete-item="${App.escapeHtml(item.id)}" class="ml-auto px-2 py-1 font-medium text-red-700 hover:bg-red-50 rounded-md">
                      Hapus
                    </button>
                  </div>
                </div>
              `
                  )
                  .join("")
              : `<p class="text-xs text-gray-500 text-center py-6">Belum ada konten pada kategori ini.</p>`
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
          <input name="judul" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
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
          <textarea name="ringkasan" rows="2" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Isi Artikel Lengkap (pisahkan paragraf dengan Enter 2x)</label>
          <textarea name="isi" rows="7" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm leading-relaxed">${App.escapeHtml(isiText)}</textarea>
        </div>
      `;
    } else if (type === "ebook") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Ebook</label>
          <input name="judul" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
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
          <textarea name="deskripsi" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.deskripsi || "")}</textarea>
        </div>
      `;
    } else if (type === "flyer") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Flyer Nasihat</label>
          <input name="judul" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
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
          <textarea name="nasihat" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.nasihat || "")}</textarea>
        </div>
      `;
    } else if (type === "audio") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Audio Kajian / Siniar</label>
          <input name="judul" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
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
          <textarea name="ringkasan" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
        </div>
      `;
    } else if (type === "video") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Video</label>
          <input name="judul" required value="${App.escapeHtml(existing?.judul || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
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
          <textarea name="ringkasan" rows="3" required class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm">${App.escapeHtml(existing?.ringkasan || "")}</textarea>
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
              <label class="block text-[11px] font-medium text-gray-600 mb-1">Jalur File data.js</label>
              <input type="text" id="cfg-gh-path" value="${App.escapeHtml(gh.filePath || "public/data.js")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs" />
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
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Verifikasi GitHub API & Publish Commit
  // --------------------------------------------------------------------------
  async function verifyGitHubAccess(repoSlug, token) {
    if (!repoSlug || !repoSlug.includes("/") || !token) {
      throw new Error("Masukkan nama repositori (username/repo) dan GitHub Token terlebih dahulu.");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) throw new Error("Token GitHub tidak valid atau sudah kedaluwarsa.");
    const userJson = await userRes.json();

    const allowedEmail = getAllowedAdminEmail();
    try {
      const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
      if (emailsRes.ok) {
        const emailsList = await emailsRes.json();
        if (Array.isArray(emailsList) && emailsList.length > 0) {
          const hasOwnerEmail = emailsList.some(
            (entry) => String(entry.email || "").toLowerCase().trim() === allowedEmail
          );
          if (!hasOwnerEmail) {
            throw new Error(`Akun GitHub @${userJson.login} tidak terhubung dengan email ${allowedEmail}.`);
          }
        }
      }
    } catch (emailErr) {
      if (emailErr && emailErr.message && emailErr.message.includes(allowedEmail)) {
        throw emailErr;
      }
    }

    const repoRes = await fetch(`https://api.github.com/repos/${repoSlug}`, { headers });
    if (!repoRes.ok) throw new Error(`Repositori "${repoSlug}" tidak ditemukan atau tidak dapat diakses.`);
    const repoJson = await repoRes.json();

    if (repoJson.permissions && !repoJson.permissions.push) {
      throw new Error(`Akun @${userJson.login} tidak memiliki izin tulis (push) ke repositori ini.`);
    }

    return { userLogin: userJson.login };
  }

  async function githubPutFile(repoSlug, token, branch, filePath, base64Content, commitMessage) {
    const apiUrl = `https://api.github.com/repos/${repoSlug}/contents/${filePath}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    let sha = undefined;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      throw new Error(errJson.message || `Gagal menyimpan ${filePath} ke GitHub.`);
    }

    return putRes.json();
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

  function openPublishModal() {
    const d = studio.draftData;
    const t = d.tampilan || {};
    const counts = ["tulisan", "ebook", "flyer", "audio", "video"]
      .map((k) => `${(d[k] || []).length} ${App.TAB_META[k].navLabel}`)
      .join(" · ");

    els.publishSummary.innerHTML = `
      <p><strong>Ringkasan Perubahan:</strong></p>
      <p>Tema: <span class="font-medium capitalize">${App.escapeHtml(t.warnaAksen || "emerald")}</span> · Font: <span class="font-medium capitalize">${App.escapeHtml(t.jenisFont || "editorial")}</span></p>
      <p>Konten: ${App.escapeHtml(counts)}</p>
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

    // Shortcut keyboard (Ctrl+Shift+E atau Alt+Shift+E) & hash #studio / #admin untuk pemilik membuka verifikasi
    document.addEventListener("keydown", (e) => {
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
            studio.github.repo = repo;
            studio.github.token = token;
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
      }
    });

    els.studioPanelBody.addEventListener("click", async (e) => {
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

      const deleteBtn = e.target.closest("[data-delete-item]");
      if (deleteBtn) {
        const id = deleteBtn.dataset.deleteItem;
        studio.draftData[studio.contentType] = (studio.draftData[studio.contentType] || []).filter((i) => i.id !== id);
        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();
        return;
      }

      const moveItemBtn = e.target.closest("[data-move-item]");
      if (moveItemBtn) {
        const idx = Number(moveItemBtn.dataset.moveItem);
        const dir = Number(moveItemBtn.dataset.dir);
        const list = studio.draftData[studio.contentType] || [];
        const target = idx + dir;
        if (target >= 0 && target < list.length) {
          [list[idx], list[target]] = [list[target], list[idx]];
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
        const filePath = document.getElementById("cfg-gh-path").value.trim() || "public/data.js";
        const token = document.getElementById("cfg-gh-token").value.trim();
        const statusEl = document.getElementById("cfg-gh-status");
        statusEl.textContent = "Memeriksa koneksi ke GitHub...";
        try {
          const res = await verifyGitHubAccess(repo, token);
          studio.github = { repo, branch, filePath, token, userLogin: res.userLogin, verified: true };
          saveGitHubConfig();
          renderStudioSidebar();
          const refreshedStatus = document.getElementById("cfg-gh-status");
          if (refreshedStatus) {
            refreshedStatus.className = "text-[11px] text-emerald-700 font-medium";
            refreshedStatus.textContent = `Berhasil terhubung sebagai @${res.userLogin}.`;
          }
        } catch (err) {
          statusEl.className = "text-[11px] text-red-700";
          statusEl.textContent = err.message;
        }
        return;
      }

      if (e.target.closest("#btn-reset-draft-local")) {
        localStorage.removeItem(STORAGE_DRAFT_KEY);
        studio.draftData = App.deepClone(window.SITE_DATA || {});
        studio.pendingUploads = [];
        studio.hasUnsavedChanges = false;
        updateDraftStatusBadge("Draft direset ke versi asli");
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
        els.publishGhResult.className = "text-xs rounded-lg p-3 bg-amber-50 text-amber-900 border border-amber-200";
        els.publishGhResult.textContent =
          "Silakan hubungkan akun & token GitHub Anda terlebih dahulu di tab 'GitHub' pada panel kiri Studio Editor.";
        els.publishGhResult.classList.remove("hidden");
        return;
      }

      els.btnPublishGithub.disabled = true;
      els.btnPublishGithub.textContent = "Mengirim ke GitHub...";
      els.publishGhResult.classList.add("hidden");

      try {
        // 1. Jika ada file upload lokal (data URL), unggah ke repositori & ganti referensinya menjadi publicUrl
        const exportData = App.deepClone(studio.draftData);
        if (studio.pendingUploads.length) {
          for (const up of studio.pendingUploads) {
            await githubPutFile(
              gh.repo,
              gh.token,
              gh.branch || "main",
              up.repoPath,
              up.base64Content,
              `chore: unggah media ${up.name} melalui Studio Visual`
            );
          }

          // Petakan URL dataUrl ke publicUrl agar data.js di GitHub ringan & bersih
          let updatedJsonStr = JSON.stringify(exportData);
          studio.pendingUploads.forEach((up) => {
            if (up.dataUrl && updatedJsonStr.includes(up.dataUrl)) {
              updatedJsonStr = updatedJsonStr.split(up.dataUrl).join(up.publicUrl);
            }
          });
          Object.assign(exportData, JSON.parse(updatedJsonStr));
        }

        // 2. Commit public/data.js ke GitHub
        const fileContent = generateDataJsContent(exportData);
        const commitRes = await githubPutFile(
          gh.repo,
          gh.token,
          gh.branch || "main",
          gh.filePath || "public/data.js",
          utf8ToBase64(fileContent),
          "content: perbarui tampilan dan konten melalui Studio Visual"
        );

        studio.draftData = exportData;
        studio.pendingUploads = [];
        studio.hasUnsavedChanges = false;
        localStorage.removeItem(STORAGE_DRAFT_KEY);
        updateDraftStatusBadge("Berhasil dipublikasikan ke GitHub");

        const commitUrl = commitRes?.commit?.html_url;
        els.publishGhResult.className = "text-xs rounded-lg p-3 bg-emerald-50 text-emerald-900 border border-emerald-200";
        els.publishGhResult.innerHTML = `
          <strong>Berhasil dipublikasikan!</strong> Perubahan telah dikirim ke repositori <strong>${App.escapeHtml(
            gh.repo
          )}</strong>. Cloudflare Pages akan memperbarui situs live dalam ~20–30 detik.
          ${
            commitUrl
              ? `<a href="${App.escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer" class="underline font-semibold ml-1">Lihat Commit &rarr;</a>`
              : ""
          }
        `;
        els.publishGhResult.classList.remove("hidden");
      } catch (err) {
        els.publishGhResult.className = "text-xs rounded-lg p-3 bg-red-50 text-red-800 border border-red-200";
        els.publishGhResult.textContent = `Gagal publish: ${err.message}`;
        els.publishGhResult.classList.remove("hidden");
      } finally {
        els.btnPublishGithub.disabled = false;
        els.btnPublishGithub.textContent = "Publish ke GitHub Sekarang";
      }
    });
  }

  // Inisialisasi Studio
  studio.draftData = loadDraftData();
  bindStudioEvents();
  syncHeaderStudioButton();

  if (localStorage.getItem(STORAGE_DRAFT_KEY)) {
    // Tampilkan hasil draft lokal saat pengguna kembali ke situs
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
