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
    previewCategory: "all",
    previewCategoryView: "grouped",
    contentCategoryFilter: "all",
    workspaceView: "edit", // "edit" | "preview"
    hasUnsavedChanges: false,
    pendingConfirmAction: null,
    lastTextControl: null,
    suppressEditorTrack: false,
    interactingWithFloatingBar: false,
    lastFontOptionsHtml: "",
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
    studioEditScroll: document.getElementById("studio-edit-scroll"),
    studioPreviewView: document.getElementById("studio-preview-view"),
    studioPanelBody: document.getElementById("studio-panel-body"),
    floatingFontBar: document.getElementById("studio-floating-font-bar"),
    floatingFontSelect: document.getElementById("studio-text-font-select"),
    floatingSizeInput: document.getElementById("studio-text-size-input"),
    floatingSizePreset: document.getElementById("studio-text-size-preset"),
    btnEditorUndo: document.getElementById("btn-editor-undo"),
    btnEditorRedo: document.getElementById("btn-editor-redo"),
    btnFormatBold: document.getElementById("btn-format-bold"),
    btnFormatItalic: document.getElementById("btn-format-italic"),
    btnFormatUnderline: document.getElementById("btn-format-underline"),
    btnFormatStrike: document.getElementById("btn-format-strike"),
    btnFormatColor: document.getElementById("btn-format-color"),
    btnFormatColorBar: document.getElementById("btn-format-color-bar"),
    btnFormatLink: document.getElementById("btn-format-link"),
    alignButtons: Array.from(document.querySelectorAll("[data-format-align]")),
    btnFormatUl: document.getElementById("btn-format-ul"),
    btnFormatOl: document.getElementById("btn-format-ol"),
    btnFormatQuote: document.getElementById("btn-format-quote"),
    indentModeSelect: document.getElementById("studio-indent-mode-select"),
    btnFormatOutdent: document.getElementById("btn-format-outdent"),
    indentInput: document.getElementById("studio-indent-input"),
    indentPreset: document.getElementById("studio-indent-preset"),
    btnFormatIndent: document.getElementById("btn-format-indent"),
    btnToggleDropCap: document.getElementById("btn-toggle-dropcap"),
    btnApplyArabBlock: document.getElementById("btn-apply-arab-block"),
    btnClearTextFont: document.getElementById("btn-clear-text-font"),
    floatingColorRow: document.getElementById("studio-floating-color-row"),
    colorSwatches: Array.from(document.querySelectorAll("[data-pick-color]")),
    textColorPicker: document.getElementById("studio-text-color-picker"),
    btnClearTextColor: document.getElementById("btn-clear-text-color"),
    btnCloseColorRow: document.getElementById("btn-close-color-row"),
    floatingLinkRow: document.getElementById("studio-floating-link-row"),
    textLinkInput: document.getElementById("studio-text-link-input"),
    btnApplyTextLink: document.getElementById("btn-apply-text-link"),
    btnRemoveTextLink: document.getElementById("btn-remove-text-link"),
    btnCancelTextLink: document.getElementById("btn-cancel-text-link"),
    studioPreviewFrame: document.getElementById("studio-preview-frame"),
    studioPreviewMount: document.getElementById("studio-preview-mount"),
    studioExitBtn: document.getElementById("studio-exit-btn"),
    studioLogoutBtn: document.getElementById("studio-logout-btn"),
    studioModeTitle: document.getElementById("studio-mode-title"),
    studioDeviceBar: document.getElementById("studio-device-bar"),
    studioGoPreview: document.getElementById("studio-go-preview"),
    studioBackToEdit: document.getElementById("studio-back-to-edit"),
    previewBackEditBtn: document.getElementById("preview-back-edit-btn"),
    previewPublishBtn: document.getElementById("preview-publish-btn"),
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
  // Pengolah Form Item Konten & Render Halaman Pratinjau Terpisah
  // --------------------------------------------------------------------------
  const ID_MONTHS_LONG = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const MONTH_NAME_TO_INDEX = {
    januari: 1, jan: 1, january: 1,
    februari: 2, feb: 2, peb: 2, february: 2,
    maret: 3, mar: 3, march: 3,
    april: 4, apr: 4,
    mei: 5, may: 5,
    juni: 6, jun: 6, june: 6,
    juli: 7, jul: 7, july: 7,
    agustus: 8, agu: 8, ags: 8, aug: 8, august: 8,
    september: 9, sep: 9, sept: 9,
    oktober: 10, okt: 10, oct: 10, october: 10,
    november: 11, nov: 11, nop: 11,
    desember: 12, des: 12, dec: 12, december: 12,
  };

  function getTodayIsoDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseIndonesianDateToIso(rawDate) {
    const val = String(rawDate || "").trim();
    if (!val) return getTodayIsoDate();

    const isoMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    }

    const slashMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
    }

    const textMatch = val.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (textMatch) {
      const mIdx = MONTH_NAME_TO_INDEX[textMatch[2].toLowerCase()];
      if (mIdx) {
        return `${textMatch[3]}-${String(mIdx).padStart(2, "0")}-${textMatch[1].padStart(2, "0")}`;
      }
    }

    return getTodayIsoDate();
  }

  function formatIsoDateToIndonesian(rawVal) {
    const val = String(rawVal || "").trim();
    if (!val) return formatIsoDateToIndonesian(getTodayIsoDate());
    const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!isoMatch) return val;
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = isoMatch[3];
    const monthName = ID_MONTHS_LONG[monthIdx];
    if (!monthName) return val;
    return `${day} ${monthName} ${year}`;
  }

  function resolveKategoriFromForm(formData) {
    const sel = String(formData.get("kategori") || "").trim();
    if (sel === "__custom__") {
      return String(formData.get("kategoriCustom") || "").trim() || "Umum";
    }
    return sel || "Umum";
  }

  function extractContentItemFromForm(type, formData, itemId) {
    let newItem = { id: itemId, status: formData.get("status") || "published" };
    const kategori = resolveKategoriFromForm(formData);
    const formattedTanggal = formatIsoDateToIndonesian(formData.get("tanggal"));

    if (type === "tulisan") {
      const paragraphs = String(formData.get("isi") || "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      newItem = {
        ...newItem,
        judul: String(formData.get("judul") || "").trim(),
        kategori,
        tanggal: formattedTanggal,
        dropCap: formData.get("dropCap") === "1",
        ringkasan: String(formData.get("ringkasan") || "").trim(),
        isi: paragraphs,
      };
    } else if (type === "ebook") {
      newItem = {
        ...newItem,
        judul: String(formData.get("judul") || "").trim(),
        kategori,
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
        kategori,
        tema: String(formData.get("tema") || "").trim(),
        tanggal: formattedTanggal,
        gambar: String(formData.get("gambar") || "").trim(),
        nasihat: String(formData.get("nasihat") || "").trim(),
        namaFileUnduh: `${sanitizeFilename(formData.get("judul") || "flyer")}.jpg`,
      };
    } else if (type === "audio") {
      newItem = {
        ...newItem,
        judul: String(formData.get("judul") || "").trim(),
        kategori,
        seri: String(formData.get("seri") || "").trim(),
        durasi: String(formData.get("durasi") || "").trim(),
        tanggal: formattedTanggal,
        audioUrl: String(formData.get("audioUrl") || "").trim(),
        ringkasan: String(formData.get("ringkasan") || "").trim(),
      };
    } else if (type === "video") {
      newItem = {
        ...newItem,
        judul: String(formData.get("judul") || "").trim(),
        youtubeId: extractYoutubeId(formData.get("youtubeId")),
        kategori,
        durasi: String(formData.get("durasi") || "").trim(),
        tanggal: formattedTanggal,
        ringkasan: String(formData.get("ringkasan") || "").trim(),
      };
    }

    return newItem;
  }

  function buildPreviewDataSnapshot() {
    const form = document.getElementById("studio-item-form");
    if (!form || studio.editingItemId === null) {
      return studio.draftData;
    }

    syncAllRichEditorsIn(form);
    const type = studio.contentType;
    const isNew = studio.editingItemId === "new";
    const id = isNew ? `preview-${type}` : studio.editingItemId;
    const formItem = extractContentItemFromForm(type, new FormData(form), id);
    const hasContent = Boolean(
      formItem.judul ||
        formItem.ringkasan ||
        formItem.deskripsi ||
        formItem.nasihat ||
        (Array.isArray(formItem.isi) && formItem.isi.length)
    );

    if (isNew && !hasContent) {
      return studio.draftData;
    }

    const clone = App.deepClone(studio.draftData);
    const list = clone[type] || [];
    clone[type] = isNew
      ? [formItem, ...list]
      : list.map((item) => (item.id === id ? formItem : item));
    return clone;
  }

  function renderLivePreview() {
    if (!studio.isOpen || studio.workspaceView !== "preview" || !els.studioPreviewMount) return;
    const snapshot = buildPreviewDataSnapshot();
    App.renderSiteInto(els.studioPreviewMount, snapshot, {
      includeDrafts: studio.previewMode === "draft",
      activeTab: studio.previewActiveTab,
      activeCategory: studio.previewCategory,
      categoryViewMode: studio.previewCategoryView,
      searchQuery: "",
      isPreview: true,
    });
  }

  function setStudioWorkspaceView(view) {
    const isPreview = view === "preview";
    studio.workspaceView = isPreview ? "preview" : "edit";

    if (els.studioSidebar) {
      els.studioSidebar.classList.toggle("hidden", isPreview);
      els.studioSidebar.classList.toggle("flex", !isPreview);
    }
    if (els.studioPreviewView) {
      els.studioPreviewView.classList.toggle("hidden", !isPreview);
      els.studioPreviewView.classList.toggle("flex", isPreview);
    }
    if (els.studioDeviceBar) {
      els.studioDeviceBar.classList.toggle("hidden", !isPreview);
      els.studioDeviceBar.classList.toggle("md:flex", isPreview);
    }
    if (els.studioBackToEdit) {
      els.studioBackToEdit.classList.toggle("hidden", !isPreview);
      els.studioBackToEdit.classList.toggle("inline-flex", isPreview);
    }
    if (els.studioGoPreview) {
      els.studioGoPreview.classList.toggle("hidden", isPreview);
      els.studioGoPreview.classList.toggle("inline-flex", !isPreview);
    }
    if (els.studioSaveDraft) {
      els.studioSaveDraft.classList.toggle("hidden", isPreview);
    }
    if (els.studioModeTitle) {
      els.studioModeTitle.textContent = isPreview ? "Pratinjau Website" : "Studio Editor";
    }

    if (isPreview) {
      hideFloatingFontBar();
      if (studio.studioTab === "konten" && studio.contentType) {
        studio.previewActiveTab = studio.contentType;
      }
      applyPreviewDeviceSize();
      renderLivePreview();
      if (els.studioPreviewView) els.studioPreviewView.scrollTop = 0;
    }
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
    hideFloatingFontBar();
    syncFloatingFontBarOptions();

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
    syncEditorDropCapPreview();
  }

  function buildFontSelectOptionsHtml() {
    const fonts = App.getFontCollection(studio.draftData);
    const r2Fonts = fonts.filter((f) => f.sumber === "r2");
    const googleArab = fonts.filter((f) => f.sumber === "google" && f.kategori === "arab");
    const googleLatin = fonts.filter((f) => f.sumber === "google" && f.kategori !== "arab");

    const opt = (f) => `<option value="${App.escapeHtml(f.id)}">${App.escapeHtml(f.nama)}</option>`;
    return `
      <option value="">Font Default Tema</option>
      ${r2Fonts.length ? `<optgroup label="Font Upload R2">${r2Fonts.map(opt).join("")}</optgroup>` : ""}
      ${googleArab.length ? `<optgroup label="Google Fonts — Arab / Qur'an / Hadis">${googleArab.map(opt).join("")}</optgroup>` : ""}
      ${googleLatin.length ? `<optgroup label="Google Fonts — Latin / Umum">${googleLatin.map(opt).join("")}</optgroup>` : ""}
    `;
  }

  function syncFloatingFontBarOptions() {
    if (!els.floatingFontSelect) return;
    const nextHtml = buildFontSelectOptionsHtml();
    if (studio.lastFontOptionsHtml === nextHtml && els.floatingFontSelect.options.length > 0) {
      return;
    }
    const prev = els.floatingFontSelect.value;
    els.floatingFontSelect.innerHTML = nextHtml;
    studio.lastFontOptionsHtml = nextHtml;
    if (prev && Array.from(els.floatingFontSelect.options).some((o) => o.value === prev)) {
      els.floatingFontSelect.value = prev;
    }
  }

  function hideFloatingFontBar() {
    if (studio.floatingBlurTimer) {
      clearTimeout(studio.floatingBlurTimer);
      studio.floatingBlurTimer = null;
    }
    if (els.floatingColorRow) {
      els.floatingColorRow.classList.add("hidden");
      els.floatingColorRow.classList.remove("flex");
    }
    if (els.btnFormatColor) {
      els.btnFormatColor.setAttribute("aria-expanded", "false");
    }
    if (els.floatingLinkRow) {
      els.floatingLinkRow.classList.add("hidden");
      els.floatingLinkRow.classList.remove("flex");
    }
    if (!els.floatingFontBar) return;
    els.floatingFontBar.classList.add("hidden");
    els.floatingFontBar.classList.remove("flex");
  }

  function positionFloatingFontBar(targetEl) {
    const bar = els.floatingFontBar;
    if (!bar || !targetEl || !document.body.contains(targetEl)) {
      hideFloatingFontBar();
      return;
    }
    if (!studio.isOpen || studio.workspaceView !== "edit") {
      hideFloatingFontBar();
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const scrollRect = els.studioEditScroll
      ? els.studioEditScroll.getBoundingClientRect()
      : { top: 56, bottom: window.innerHeight };

    // Sembunyikan jika kotak teks tergulung ke luar viewport area edit
    if (rect.bottom < scrollRect.top + 8 || rect.top > scrollRect.bottom - 8) {
      bar.classList.add("hidden");
      bar.classList.remove("flex");
      return;
    }

    bar.classList.remove("hidden");
    bar.classList.add("flex");

    const barWidth = bar.offsetWidth || 340;
    const barHeight = bar.offsetHeight || 34;

    let top = rect.top - barHeight - 6;
    if (top < Math.max(60, scrollRect.top + 4)) {
      top = Math.min(rect.bottom + 6, window.innerHeight - barHeight - 8);
    }

    const left = Math.max(12, Math.min(rect.right - barWidth, window.innerWidth - barWidth - 12));
    bar.style.top = `${Math.round(top)}px`;
    bar.style.left = `${Math.round(left)}px`;
  }

  // --------------------------------------------------------------------------
  // Konversi WYSIWYG Editor <-> Tag [font]/[arab] (Tanpa Tampilkan Kode Tag)
  // --------------------------------------------------------------------------
  const ARABIC_CHAR_TEST_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  function getFontMetaById(fontId) {
    if (!fontId) return null;
    const fonts = App.getFontCollection(studio.draftData || window.SITE_DATA || {});
    return fonts.find((f) => f.id === String(fontId).toLowerCase()) || null;
  }

  function applyRtSpanVisualStyle(span, type, fontId, sizeVal) {
    if (!span) return;
    const cleanType = type === "arab" ? "arab" : "font";
    const cleanFont = String(fontId || "").trim().toLowerCase();
    const cleanSize = sizeVal >= 10 && sizeVal <= 72 ? sizeVal : 0;
    const fontObj = getFontMetaById(cleanFont);

    span.dataset.rtType = cleanType;
    if (cleanFont) {
      span.dataset.rtFont = cleanFont;
    } else {
      delete span.dataset.rtFont;
    }
    if (cleanSize) {
      span.dataset.rtSize = String(cleanSize);
    } else {
      delete span.dataset.rtSize;
    }

    span.style.fontFamily = "";
    span.style.fontSize = "";
    span.style.lineHeight = "";

    if (fontObj) {
      const safeFam = String(fontObj.family).replace(/["\\']/g, "");
      const fallback = fontObj.kategori === "arab" ? "'Amiri', serif" : "Georgia, serif";
      span.style.fontFamily = `'${safeFam}', ${fallback}`;
    }
    if (cleanSize) {
      span.style.fontSize = `${cleanSize}px`;
    }

    const plainText = String(span.textContent || "").replace(/\u200B/g, "");
    const hasArab = ARABIC_CHAR_TEST_RE.test(plainText);

    if (cleanType === "arab") {
      span.className = `ct-arab-block${fontObj ? " ct-font-arab" : ""}`;
      span.setAttribute("lang", "ar");
      span.setAttribute("dir", "rtl");
      if (cleanSize) span.style.lineHeight = "2.0";
    } else {
      span.className = `bidi-isolate${hasArab ? " ct-font-arab" : ""}`;
      if (hasArab) {
        span.setAttribute("lang", "ar");
        span.setAttribute("dir", "auto");
      } else {
        span.removeAttribute("lang");
        span.removeAttribute("dir");
      }
      if (cleanSize) {
        span.style.lineHeight = hasArab ? "1.95" : "1.45";
      }
    }
  }

  function buildRtSpanCssAttr(type, fontObj, cleanSize, hasArab) {
    const parts = [];
    if (fontObj) {
      const safeFam = String(fontObj.family).replace(/["\\']/g, "");
      const fallback = fontObj.kategori === "arab" ? "'Amiri', serif" : "Georgia, serif";
      parts.push(`font-family: '${safeFam}', ${fallback};`);
    }
    if (cleanSize) {
      const lh = type === "arab" ? "2.0" : hasArab ? "1.95" : "1.45";
      parts.push(`font-size: ${cleanSize}px; line-height: ${lh};`);
    }
    return parts.join(" ");
  }

  function richTextToEditorHtml(rawText, isMultiline) {
    const input = String(rawText || "");
    if (!input) return "";

    function renderTokens(segment) {
      const text = String(segment || "");
      const re =
        /\[(font|arab)(?:=([a-z0-9-]+))?(?:\s+size=(\d{1,3}))?\]([\s\S]*?)\[\/\1\]|\[(b|i|u|s)\]([\s\S]*?)\[\/\5\]|\[color=(#[0-9a-f]{3,6})\]([\s\S]*?)\[\/color\]|\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi;
      let out = "";
      let lastIdx = 0;
      let m;

      while ((m = re.exec(text)) !== null) {
        if (m.index > lastIdx) {
          out += App.escapeHtml(text.slice(lastIdx, m.index));
        }

        if (m[5]) {
          const inlineTag = m[5].toLowerCase();
          const innerHtml = renderTokens(m[6] || "");
          if (inlineTag === "b") {
            out += `<strong>${innerHtml}</strong>`;
          } else if (inlineTag === "i") {
            out += `<em>${innerHtml}</em>`;
          } else if (inlineTag === "u") {
            out += `<u>${innerHtml}</u>`;
          } else if (inlineTag === "s") {
            out += `<s>${innerHtml}</s>`;
          }
        } else if (m[7] !== undefined) {
          const safeColor = App.sanitizeRichColor(m[7]);
          const innerHtml = renderTokens(m[8] || "");
          if (safeColor) {
            out += `<span data-rt-color="${App.escapeHtml(safeColor)}" style="color: ${App.escapeHtml(safeColor)};">${innerHtml}</span>`;
          } else {
            out += innerHtml;
          }
        } else if (m[9] !== undefined) {
          const decodedUrl = String(m[9] || "").replace(/%5D/gi, "]");
          const safeUrl = App.sanitizeRichLinkUrl(decodedUrl);
          const innerHtml = renderTokens(m[10] || "");
          if (safeUrl) {
            out += `<a href="${App.escapeHtml(
              safeUrl
            )}" data-rt-link="true" class="ct-rich-link underline theme-text-accent">${innerHtml}</a>`;
          } else {
            out += innerHtml;
          }
        } else {
          const tagType = m[1].toLowerCase();
          const fontId = (m[2] || "").toLowerCase();
          const rawSize = m[3] ? parseInt(m[3], 10) : 0;
          const cleanSize = rawSize >= 10 && rawSize <= 72 ? rawSize : 0;
          const innerRaw = m[4] || "";
          const fontObj = getFontMetaById(fontId);
          const plainInner = App.stripRichTags(innerRaw);
          const hasArab = ARABIC_CHAR_TEST_RE.test(plainInner);
          const inlineStyle = buildRtSpanCssAttr(tagType, fontObj, cleanSize, hasArab);
          const innerHtml = renderTokens(innerRaw);

          const attrs = [
            `data-rt-type="${tagType}"`,
            fontId ? `data-rt-font="${App.escapeHtml(fontId)}"` : "",
            cleanSize ? `data-rt-size="${cleanSize}"` : "",
            inlineStyle ? `style="${inlineStyle}"` : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (tagType === "arab") {
            out += `<span ${attrs} lang="ar" dir="rtl" class="ct-arab-block${fontObj ? " ct-font-arab" : ""}">${innerHtml}</span>`;
          } else if (fontObj || cleanSize) {
            out += `<span ${attrs}${hasArab ? ' lang="ar" dir="auto"' : ""} class="bidi-isolate${
              hasArab ? " ct-font-arab" : ""
            }">${innerHtml}</span>`;
          } else {
            out += innerHtml;
          }
        }

        lastIdx = re.lastIndex;
      }

      if (lastIdx < text.length) {
        out += App.escapeHtml(text.slice(lastIdx));
      }
      return out;
    }

    if (!isMultiline) {
      const single = input.replace(/\r?\n+/g, " ");
      const meta = App.parseRichBlockMeta(single);
      return meta.inner ? renderTokens(meta.inner) : "";
    }

    const parsedLines = input.split(/\r?\n/).map((line) => App.parseRichBlockMeta(line));
    const buildLineAttrs = (meta, dir) => {
      const clsList = [];
      if (meta.isQuote && !meta.listType) clsList.push("ct-blockquote");
      if (meta.align) {
        clsList.push(`ct-align-${meta.align}`);
      } else if (dir === "rtl") {
        clsList.push("text-right", "leading-[2.0]");
      }
      const indent = App.normalizeIndentLevel(meta.indent);
      const indentMode = App.normalizeIndentMode(meta.indentMode);
      if (indent > 0) {
        if (indentMode === "first") {
          clsList.push("ct-indent-first");
        } else if (indentMode === "hanging") {
          clsList.push("ct-indent-hanging");
        } else {
          clsList.push("ct-indent");
          if (Number.isInteger(indent) && indent >= 1 && indent <= 4) {
            clsList.push(`ct-indent-${indent}`);
          }
        }
      }
      const styleStr = App.buildRichBlockStyle(meta);
      return [
        `dir="${dir}"`,
        meta.align ? `data-rt-align="${App.escapeHtml(meta.align)}"` : "",
        indent > 0 ? `data-rt-indent="${indent}"` : "",
        indent > 0 && indentMode !== "all" ? `data-rt-indent-mode="${indentMode}"` : "",
        clsList.length ? `class="${clsList.join(" ")}"` : "",
        styleStr ? `style="${App.escapeHtml(styleStr)}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
    };

    const htmlChunks = [];
    let idx = 0;
    while (idx < parsedLines.length) {
      const meta = parsedLines[idx];
      if (meta.listType === "ul" || meta.listType === "ol") {
        const listTag = meta.listType;
        const listDir = App.detectTextDirection(meta.inner);
        const liParts = [];
        while (idx < parsedLines.length && parsedLines[idx].listType === listTag) {
          const lm = parsedLines[idx];
          const lDir = App.detectTextDirection(lm.inner);
          const lInner = lm.inner ? renderTokens(lm.inner) : "<br>";
          liParts.push(`<li ${buildLineAttrs(lm, lDir)}>${lInner}</li>`);
          idx += 1;
        }
        htmlChunks.push(`<${listTag} dir="${listDir}" class="ct-list ct-list-${listTag}">${liParts.join("")}</${listTag}>`);
        continue;
      }

      const dir = App.detectTextDirection(meta.inner);
      const tag = meta.isQuote ? "blockquote" : "div";
      const inner = meta.inner ? renderTokens(meta.inner) : "<br>";
      htmlChunks.push(`<${tag} ${buildLineAttrs(meta, dir)}>${inner}</${tag}>`);
      idx += 1;
    }
    return htmlChunks.join("");
  }

  function wrapSerializedRichTagPerLine(tagName, attrStr, inner) {
    if (!inner) return "";
    const open = `[${tagName}${attrStr || ""}]`;
    const close = `[/${tagName}]`;
    if (inner.includes("\n")) {
      return inner
        .split("\n")
        .map((seg) => (seg ? `${open}${seg}${close}` : ""))
        .join("\n");
    }
    return `${open}${inner}${close}`;
  }

  function serializeInlineNodeToRichText(node) {
    if (!node) return "";
    if (node.nodeType === Node.TEXT_NODE) {
      return String(node.nodeValue || "").replace(/\u200B/g, "").replace(/\u00A0/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.tagName === "BR") return "\n";

    let inner = "";
    const children = Array.from(node.childNodes);
    children.forEach((child, idx) => {
      if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR" && idx === children.length - 1) {
        return;
      }
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        ["DIV", "P", "LI", "H1", "H2", "H3", "BLOCKQUOTE"].includes(child.tagName) &&
        idx > 0 &&
        inner &&
        !inner.endsWith("\n")
      ) {
        inner += "\n";
      }
      inner += serializeInlineNodeToRichText(child);
    });

    if (!inner) return "";

    let out = inner;
    if (node.dataset && node.dataset.rtColor) {
      const safeDataColor = App.sanitizeRichColor(node.dataset.rtColor);
      if (safeDataColor) {
        out = wrapSerializedRichTagPerLine("color", `=${safeDataColor}`, out);
      }
    }

    if (node.dataset && node.dataset.rtType) {
      const type = node.dataset.rtType === "arab" ? "arab" : "font";
      const fontId = (node.dataset.rtFont || "").trim().toLowerCase();
      const size = parseInt(node.dataset.rtSize || "0", 10);
      if (type === "font" && !fontId && !(size >= 10 && size <= 72)) return out;
      const attrs = `${fontId ? `=${fontId}` : ""}${size >= 10 && size <= 72 ? ` size=${size}` : ""}`;
      return wrapSerializedRichTagPerLine(type, attrs, out);
    }

    if (node.dataset && node.dataset.rtColor) {
      return out;
    }

    const tag = node.tagName;
    if (tag === "A") {
      const safeHref = App.sanitizeRichLinkUrl(node.getAttribute("href") || "");
      if (!safeHref) return out;
      const encodedHref = safeHref.replace(/\]/g, "%5D");
      return wrapSerializedRichTagPerLine("url", `=${encodedHref}`, out);
    }
    if (tag === "B" || tag === "STRONG") {
      return wrapSerializedRichTagPerLine("b", "", out);
    }
    if (tag === "I" || tag === "EM") {
      return wrapSerializedRichTagPerLine("i", "", out);
    }
    if (tag === "U") {
      return wrapSerializedRichTagPerLine("u", "", out);
    }
    if (tag === "S" || tag === "STRIKE" || tag === "DEL") {
      return wrapSerializedRichTagPerLine("s", "", out);
    }
    if (tag === "FONT" && node.getAttribute("color")) {
      const fontCol = App.sanitizeRichColor(node.getAttribute("color"));
      if (fontCol) out = wrapSerializedRichTagPerLine("color", `=${fontCol}`, out);
    }

    // Fallback jika browser menyisipkan inline CSS (styleWithCSS)
    const st = node.style;
    if (st) {
      if (st.color) {
        const inlineCol = App.sanitizeRichColor(st.color);
        if (inlineCol) out = wrapSerializedRichTagPerLine("color", `=${inlineCol}`, out);
      }
      const deco = String(st.textDecorationLine || st.textDecoration || "").toLowerCase();
      if (deco.includes("line-through")) out = wrapSerializedRichTagPerLine("s", "", out);
      if (deco.includes("underline")) out = wrapSerializedRichTagPerLine("u", "", out);
      if (String(st.fontStyle || "").toLowerCase() === "italic") out = wrapSerializedRichTagPerLine("i", "", out);
      const fw = String(st.fontWeight || "").toLowerCase();
      if (fw === "bold" || fw === "bolder" || parseInt(fw, 10) >= 600) {
        out = wrapSerializedRichTagPerLine("b", "", out);
      }
    }

    return out;
  }

  function wrapBlockMetaTags(lineText, meta) {
    let out = String(lineText || "");
    if (!out) return "";
    const indent = App.normalizeIndentLevel(meta && meta.indent);
    const indentMode = App.normalizeIndentMode(meta && meta.indentMode);
    const align =
      meta && ["left", "center", "right", "justify"].includes(meta.align) ? meta.align : "";
    const isQuote = Boolean(meta && meta.isQuote);
    const listType = meta && (meta.listType === "ul" || meta.listType === "ol") ? meta.listType : "";
    if (indent > 0) {
      const modeAttr = indentMode !== "all" ? ` mode=${indentMode}` : "";
      out = `[indent=${indent}${modeAttr}]${out}[/indent]`;
    }
    if (align) out = `[align=${align}]${out}[/align]`;
    if (listType) {
      out = `[${listType}]${out}[/${listType}]`;
    } else if (isQuote) {
      out = `[quote]${out}[/quote]`;
    }
    return out;
  }

  function getBlockNodeMeta(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) {
      return { isQuote: false, listType: "", align: "", indent: 0, indentMode: "all" };
    }
    let listType = "";
    if (el.tagName === "LI" && el.parentNode) {
      if (el.parentNode.tagName === "UL") listType = "ul";
      else if (el.parentNode.tagName === "OL") listType = "ol";
    } else if (el.tagName === "UL") {
      listType = "ul";
    } else if (el.tagName === "OL") {
      listType = "ol";
    }
    const isQuote = !listType && (el.tagName === "BLOCKQUOTE" || (el.dataset && el.dataset.rtQuote === "true"));
    let align = (el.dataset && el.dataset.rtAlign) || "";
    if (!align && el.style && el.style.textAlign) {
      const stAlign = String(el.style.textAlign).toLowerCase();
      if (["left", "center", "right", "justify"].includes(stAlign)) align = stAlign;
    }
    const indent = App.normalizeIndentLevel(el.dataset && el.dataset.rtIndent);
    const indentMode = App.normalizeIndentMode(el.dataset && el.dataset.rtIndentMode);
    return { isQuote, listType, align, indent, indentMode };
  }

  function applyBlockVisualMeta(el, meta, dir, isMultilineBlock) {
    if (!el || !el.classList) return;
    const m = meta || { isQuote: false, listType: "", align: "", indent: 0, indentMode: "all" };
    const indent = App.normalizeIndentLevel(m.indent);
    const indentMode = App.normalizeIndentMode(m.indentMode);

    if (m.align && ["left", "center", "right", "justify"].includes(m.align)) {
      el.dataset.rtAlign = m.align;
    } else {
      delete el.dataset.rtAlign;
    }
    if (indent > 0) {
      el.dataset.rtIndent = String(indent);
      if (indentMode !== "all") {
        el.dataset.rtIndentMode = indentMode;
      } else {
        delete el.dataset.rtIndentMode;
      }
      if (el.style) el.style.setProperty("--ct-indent-lv", String(indent));
    } else {
      delete el.dataset.rtIndent;
      delete el.dataset.rtIndentMode;
      if (el.style) el.style.removeProperty("--ct-indent-lv");
    }

    if (el.tagName !== "BLOCKQUOTE" && el.tagName !== "LI") {
      if (m.isQuote) {
        el.dataset.rtQuote = "true";
      } else {
        delete el.dataset.rtQuote;
      }
    } else {
      delete el.dataset.rtQuote;
    }

    el.classList.toggle("ct-blockquote", Boolean(m.isQuote && el.tagName !== "LI"));
    ["left", "center", "right", "justify"].forEach((a) => {
      el.classList.toggle(`ct-align-${a}`, m.align === a);
    });
    el.classList.toggle("ct-indent", indent > 0 && indentMode === "all");
    el.classList.toggle("ct-indent-first", indent > 0 && indentMode === "first");
    el.classList.toggle("ct-indent-hanging", indent > 0 && indentMode === "hanging");
    for (let lv = 1; lv <= 4; lv += 1) {
      el.classList.toggle(`ct-indent-${lv}`, indentMode === "all" && indent === lv);
    }
    if (isMultilineBlock) {
      const useRtlDefault = !m.align && dir === "rtl";
      el.classList.toggle("text-right", useRtlDefault);
      el.classList.toggle("leading-[2.0]", useRtlDefault);
    }
  }

  function collectEditorLines(container) {
    const lines = [];
    let inlineBuf = "";

    const flushInline = () => {
      if (inlineBuf !== "") {
        lines.push(...inlineBuf.split("\n"));
        inlineBuf = "";
      }
    };

    const children = Array.from(container.childNodes);
    children.forEach((child, idx) => {
      if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === "UL" || child.tagName === "OL")) {
        flushInline();
        const listTag = child.tagName === "OL" ? "ol" : "ul";
        const parentMeta = getBlockNodeMeta(child);
        Array.from(child.children).forEach((li) => {
          if (li.nodeType !== Node.ELEMENT_NODE) return;
          if (li.tagName === "LI") {
            const liMeta = getBlockNodeMeta(li);
            liMeta.listType = listTag;
            if (!liMeta.align && parentMeta.align) liMeta.align = parentMeta.align;
            if (!liMeta.indent && parentMeta.indent) {
              liMeta.indent = parentMeta.indent;
              liMeta.indentMode = parentMeta.indentMode;
            }
            const subLines = collectEditorLines(li);
            if (subLines.length) {
              subLines.forEach((sl) => {
                lines.push(sl ? wrapBlockMetaTags(sl, liMeta) : "");
              });
            } else {
              lines.push("");
            }
          } else {
            const subLines = collectEditorLines(li);
            subLines.forEach((sl) => lines.push(sl));
          }
        });
        return;
      }

      if (
        child.nodeType === Node.ELEMENT_NODE &&
        ["DIV", "P", "LI", "H1", "H2", "H3", "BLOCKQUOTE"].includes(child.tagName)
      ) {
        flushInline();
        const blockMeta = getBlockNodeMeta(child);
        const subLines = collectEditorLines(child);
        if (subLines.length) {
          subLines.forEach((sl) => {
            lines.push(sl ? wrapBlockMetaTags(sl, blockMeta) : "");
          });
        } else {
          lines.push("");
        }
        return;
      }

      if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") {
        if (idx < children.length - 1) {
          inlineBuf += "\n";
        } else if (lines.length === 0 && inlineBuf === "") {
          lines.push("");
        }
        return;
      }

      inlineBuf += serializeInlineNodeToRichText(child);
    });

    flushInline();
    return lines;
  }

  function serializeEditorToRichText(editorEl, isMultiline) {
    if (!editorEl) return "";
    const lines = collectEditorLines(editorEl);
    const joined = lines.join("\n");
    if (!joined.trim()) return "";
    if (!isMultiline) {
      const single = joined.replace(/\r?\n+/g, " ").trim();
      const meta = getBlockNodeMeta(editorEl);
      return wrapBlockMetaTags(single, meta);
    }
    return joined;
  }

  function syncEditorDropCapPreview(targetEditor) {
    if (!els.studioPanelBody) return;
    const isiEditor =
      targetEditor && targetEditor.dataset && targetEditor.dataset.fieldName === "isi"
        ? targetEditor
        : els.studioPanelBody.querySelector('[data-rich-editor="true"][data-field-name="isi"]');
    if (!isiEditor) return;

    isiEditor.classList.remove("prose-dropcap");
    Array.from(isiEditor.children).forEach((ch) => {
      if (ch && ch.classList) ch.classList.remove("prose-dropcap");
    });

    const dropCapInput = document.getElementById("studio-dropcap-input");
    const isDropCapOn = Boolean(dropCapInput && dropCapInput.checked);
    if (!isDropCapOn) return;

    const firstTopBlock = Array.from(isiEditor.children).find((el) =>
      ["DIV", "P", "BLOCKQUOTE", "UL", "OL"].includes(el.tagName)
    );

    if (firstTopBlock) {
      if (["UL", "OL", "BLOCKQUOTE"].includes(firstTopBlock.tagName)) return;
      const text = String(firstTopBlock.textContent || "").replace(/\u200B/g, "").trim();
      if (!text) return;
      const meta = getBlockNodeMeta(firstTopBlock);
      const dir = firstTopBlock.getAttribute("dir") || App.detectTextDirection(text);
      if (!meta.isQuote && !meta.listType && dir !== "rtl" && meta.align !== "center" && meta.align !== "right") {
        firstTopBlock.classList.add("prose-dropcap");
      }
      return;
    }

    const rootText = String(isiEditor.textContent || "").replace(/\u200B/g, "").trim();
    if (!rootText) return;
    const rootMeta = getBlockNodeMeta(isiEditor);
    const rootDir = isiEditor.getAttribute("dir") || App.detectTextDirection(rootText);
    if (
      !rootMeta.isQuote &&
      !rootMeta.listType &&
      rootDir !== "rtl" &&
      rootMeta.align !== "center" &&
      rootMeta.align !== "right"
    ) {
      isiEditor.classList.add("prose-dropcap");
    }
  }

  function updateEditorLineDirections(editorEl) {
    if (!editorEl) return;
    const isMultiline = editorEl.dataset.multiline === "true";
    if (isMultiline) {
      Array.from(editorEl.children).forEach((el) => {
        if (el.tagName === "UL" || el.tagName === "OL") {
          const listClass = el.tagName === "OL" ? "ct-list-ol" : "ct-list-ul";
          el.classList.add("ct-list", listClass);
          const listTxt = collectEditorLines(el).join(" ");
          el.setAttribute("dir", App.detectTextDirection(App.stripRichTags(listTxt)));
          Array.from(el.children).forEach((li) => {
            if (li.tagName !== "LI") return;
            const lineText = collectEditorLines(li).join(" ");
            const meta = getBlockNodeMeta(li);
            const dir = App.detectTextDirection(App.stripRichTags(lineText));
            li.setAttribute("dir", dir);
            applyBlockVisualMeta(li, meta, dir, true);
          });
        } else if (["DIV", "P", "BLOCKQUOTE"].includes(el.tagName)) {
          const lineText = collectEditorLines(el).join(" ");
          const meta = getBlockNodeMeta(el);
          const dir = App.detectTextDirection(App.stripRichTags(lineText));
          el.setAttribute("dir", dir);
          applyBlockVisualMeta(el, meta, dir, true);
        }
      });
    } else {
      const meta = getBlockNodeMeta(editorEl);
      const plain = String(editorEl.textContent || "").replace(/\u200B/g, "");
      const dir = App.detectTextDirection(plain);
      editorEl.setAttribute("dir", dir);
      applyBlockVisualMeta(editorEl, meta, dir, false);
    }
    if (isMultiline) {
      const wholeText = serializeEditorToRichText(editorEl, true);
      editorEl.setAttribute("dir", App.detectTextDirection(wholeText));
    }
    if (editorEl.dataset.fieldName === "isi") {
      syncEditorDropCapPreview(editorEl);
    }
  }

  function syncEditorToBackingField(editorEl, emitInput) {
    if (!editorEl) return "";
    const isMultiline = editorEl.dataset.multiline === "true";
    const serialized = serializeEditorToRichText(editorEl, isMultiline);
    const backing = editorEl.dataset.backingId ? document.getElementById(editorEl.dataset.backingId) : null;
    if (backing) {
      backing.value = serialized;
      if (emitInput) {
        backing.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    return serialized;
  }

  function syncAllRichEditorsIn(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('[data-rich-editor="true"]').forEach((ed) => {
      syncEditorToBackingField(ed, false);
    });
  }

  function renderRichTextFieldHtml(opts) {
    const o = opts || {};
    const fieldKey = o.name || o.profilField || "field";
    const backingId = o.id || `rt-backing-${fieldKey}`;
    const multiline = Boolean(o.multiline);
    const rawVal = String(o.value || "");
    const minHeight = o.minHeightClass || (multiline ? "min-h-[88px]" : "min-h-[40px]");
    const extraCls = o.extraClass || "";

    let singleBlockAttrs = "";
    let singleBlockClasses = "";
    let singleBlockStyle = "";
    if (!multiline) {
      const meta = App.parseRichBlockMeta(rawVal.replace(/\r?\n+/g, " "));
      const clsArr = [];
      if (meta.isQuote) clsArr.push("ct-blockquote");
      if (meta.align) clsArr.push(`ct-align-${meta.align}`);
      const indent = App.normalizeIndentLevel(meta.indent);
      const indentMode = App.normalizeIndentMode(meta.indentMode);
      if (indent > 0) {
        if (indentMode === "first") {
          clsArr.push("ct-indent-first");
        } else if (indentMode === "hanging") {
          clsArr.push("ct-indent-hanging");
        } else {
          clsArr.push("ct-indent");
          if (Number.isInteger(indent) && indent >= 1 && indent <= 4) {
            clsArr.push(`ct-indent-${indent}`);
          }
        }
        singleBlockStyle = `style="${App.escapeHtml(App.buildRichBlockStyle(meta))}"`;
      }
      singleBlockClasses = clsArr.join(" ");
      singleBlockAttrs = [
        meta.isQuote ? 'data-rt-quote="true"' : "",
        meta.align ? `data-rt-align="${App.escapeHtml(meta.align)}"` : "",
        indent > 0 ? `data-rt-indent="${indent}"` : "",
        indent > 0 && indentMode !== "all" ? `data-rt-indent-mode="${indentMode}"` : "",
        singleBlockStyle,
      ]
        .filter(Boolean)
        .join(" ");
    }

    return `
      <textarea
        id="${App.escapeHtml(backingId)}"
        class="hidden"
        ${o.name ? `name="${App.escapeHtml(o.name)}"` : ""}
        ${o.profilField ? `data-profil-field="${App.escapeHtml(o.profilField)}"` : ""}
        ${o.required ? 'data-required="true"' : ""}
      >${App.escapeHtml(rawVal)}</textarea>
      <div
        contenteditable="true"
        spellcheck="false"
        data-rich-editor="true"
        data-backing-id="${App.escapeHtml(backingId)}"
        data-field-label="${App.escapeHtml(o.label || "")}"
        data-field-name="${App.escapeHtml(fieldKey)}"
        data-multiline="${multiline ? "true" : "false"}"
        data-placeholder="${App.escapeHtml(o.placeholder || o.label || "")}"
        ${o.required ? 'data-editor-required="true"' : ""}
        ${singleBlockAttrs}
        dir="${App.detectTextDirection(rawVal)}"
        class="ct-rich-editor w-full px-3.5 py-2 border border-stone-200 focus:border-emerald-700 rounded-xl text-sm bg-white transition-colors ${minHeight} ${singleBlockClasses} ${extraCls}"
      >${richTextToEditorHtml(rawVal, multiline)}</div>
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

        <!-- Kelola Kategori Materi (Lintas Tulisan, Ebook, Flyer, Audio, Video) -->
        <div class="pt-4 border-t border-stone-200 space-y-3">
          <div>
            <p class="text-xs font-semibold text-gray-700">Kelola Kategori Bidang Ilmu</p>
            <p class="text-[11px] text-gray-500 leading-relaxed mt-0.5">
              Kategori di bawah dipakai bersama di seluruh menu (Tulisan, Ebook, Flyer, Audio, Video) agar topik yang sama saling terhubung antar format media.
            </p>
          </div>

          <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            ${(() => {
              const masterCats = App.getCategoryCollection(studio.draftData, false);
              if (!masterCats.length) {
                return `<p class="text-[11px] text-gray-400 italic py-2">Belum ada kategori tersimpan.</p>`;
              }
              return masterCats
                .map(
                  (c, idx) => `
                <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold text-gray-800 truncate">${App.escapeHtml(c.nama)}</p>
                    ${
                      c.deskripsi
                        ? `<p class="text-[11px] text-gray-500 truncate mt-0.5">${App.escapeHtml(c.deskripsi)}</p>`
                        : ""
                    }
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" data-move-cat="${idx}" data-dir="-1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Geser naik">&uarr;</button>
                    <button type="button" data-move-cat="${idx}" data-dir="1" class="px-1.5 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 rounded" title="Geser turun">&darr;</button>
                    <button type="button" data-remove-cat="${idx}" class="px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50 rounded-md" title="Hapus kategori">Hapus</button>
                  </div>
                </div>
              `
                )
                .join("");
            })()}
          </div>

          <div class="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <p class="text-[11px] font-semibold text-gray-700">+ Tambah Kategori Baru</p>
            <input type="text" id="cfg-new-cat-name" placeholder="Nama kategori (mis. Sirah Nabawiyah)" class="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg" />
            <input type="text" id="cfg-new-cat-desc" placeholder="Keterangan singkat bab (opsional)" class="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg" />
            <button type="button" id="btn-add-content-category" class="w-full py-2 px-3 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
              Tambahkan Kategori Materi
            </button>
            <p id="cfg-cat-status" class="text-[11px] text-gray-500"></p>
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
          Klik kolom teks mana saja di bawah ini untuk memunculkan pilihan jenis dan ukuran font secara otomatis.
        </p>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Website (Logo Teks)</label>
          ${renderRichTextFieldHtml({
            profilField: "namaWebsite",
            label: "Nama Website",
            value: p.namaWebsite,
            multiline: false,
          })}
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Label Kecil Atas (Kicker)</label>
          ${renderRichTextFieldHtml({
            profilField: "kicker",
            label: "Label Kecil Atas",
            value: p.kicker,
            multiline: false,
          })}
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Utama Beranda</label>
          ${renderRichTextFieldHtml({
            profilField: "judulUtama",
            label: "Judul Utama",
            value: p.judulUtama,
            multiline: true,
            minHeightClass: "min-h-[68px]",
          })}
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Subjudul / Tagline di Bawah Judul</label>
          ${renderRichTextFieldHtml({
            profilField: "subjudul",
            label: "Subjudul",
            value: p.subjudul || "— ruang berbagi ilmu & nasihat kehidupan —",
            multiline: false,
          })}
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Tujuan Berbagi Ilmu</label>
          ${renderRichTextFieldHtml({
            profilField: "deskripsi",
            label: "Deskripsi Beranda",
            value: p.deskripsi,
            multiline: true,
            minHeightClass: "min-h-[112px] leading-relaxed",
          })}
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
    const categoryBuckets = Array.from(
      new Set(activeItems.map((it) => App.getItemCategory(it, studio.contentType)))
    );
    const activeCatFilter =
      !showingTrash &&
      studio.contentCategoryFilter !== "all" &&
      categoryBuckets.some((c) => c.toLowerCase() === String(studio.contentCategoryFilter).toLowerCase())
        ? studio.contentCategoryFilter
        : "all";
    const visibleItems = showingTrash
      ? trashItems
      : activeCatFilter === "all"
      ? activeItems
      : activeItems.filter(
          (it) => App.getItemCategory(it, studio.contentType).toLowerCase() === activeCatFilter.toLowerCase()
        );

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
          <div class="flex flex-col sm:flex-row gap-2">
            <!-- Tombol Tambah Item Baru -->
            <button
              type="button"
              id="btn-add-content-item"
              class="flex-1 py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            >
              + Tambah ${currentLabel} Baru
            </button>
            ${
              categoryBuckets.length > 1
                ? `
              <select id="studio-konten-cat-filter" class="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-stone-200 rounded-xl">
                <option value="all" ${activeCatFilter === "all" ? "selected" : ""}>Semua Kategori (${activeItems.length})</option>
                ${categoryBuckets
                  .map((c) => {
                    const cnt = activeItems.filter(
                      (it) => App.getItemCategory(it, studio.contentType).toLowerCase() === c.toLowerCase()
                    ).length;
                    return `<option value="${App.escapeHtml(c)}" ${
                      activeCatFilter.toLowerCase() === c.toLowerCase() ? "selected" : ""
                    }>${App.escapeHtml(c)} (${cnt})</option>`;
                  })
                  .join("")}
              </select>
            `
                : ""
            }
          </div>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${
            visibleItems.length
              ? visibleItems
                  .map((item) => {
                    const itemCat = App.getItemCategory(item, studio.contentType);
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
                            <div class="flex items-center gap-1.5 mb-1 text-[11px]">
                              <span class="font-semibold text-amber-700">Dihapus Sementara</span>
                              <span class="text-gray-400">&middot;</span>
                              <span class="font-medium text-gray-600 truncate">${App.escapeHtml(itemCat)}</span>
                              <span class="text-gray-400">&middot;</span>
                              <span class="text-gray-500 truncate">${App.escapeHtml(deletedInfo)}</span>
                            </div>
                            <p class="text-xs font-semibold text-gray-900 line-clamp-2">${App.escapeHtml(App.stripRichTags(item.judul))}</p>
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
                            <div class="flex flex-wrap items-center gap-1.5 mb-1 text-[11px]">
                              <span class="font-semibold ${
                                item.status === "draft" ? "text-amber-700" : "text-emerald-700"
                              }">
                                ${item.status === "draft" ? "Draft" : "Tayang"}
                              </span>
                              <span class="text-gray-400">&middot;</span>
                              <span class="font-medium text-gray-700 truncate">${App.escapeHtml(itemCat)}</span>
                              <span class="text-gray-400">&middot;</span>
                              <span class="text-gray-500 truncate">${App.escapeHtml(item.tanggal || item.tahun || "")}</span>
                            </div>
                            <p class="text-xs font-semibold text-gray-900 line-clamp-2">${App.escapeHtml(App.stripRichTags(item.judul))}</p>
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
              : `<p class="md:col-span-2 text-xs text-gray-500 text-center py-8">${
                  showingTrash
                    ? "Belum ada konten yang dihapus sementara pada kategori ini."
                    : "Belum ada konten aktif pada kategori ini."
                }</p>`
          }
        </div>
      </div>
    `;
  }

  function renderCategorySelectFieldHtml(selectedCategory) {
    const categories = App.getCategoryCollection(studio.draftData, true);
    const val = String(selectedCategory || "").trim() || (categories[0] && categories[0].nama) || "Aqidah";
    const matched = categories.find((c) => c.nama.toLowerCase() === val.toLowerCase());
    const optionsList = matched ? categories : [...categories, { nama: val, deskripsi: "" }];
    const activeName = matched ? matched.nama : val;

    return `
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1">Kategori Bidang Ilmu</label>
        <select name="kategori" data-cat-select="true" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-700">
          ${optionsList
            .map(
              (c) =>
                `<option value="${App.escapeHtml(c.nama)}" ${
                  c.nama.toLowerCase() === activeName.toLowerCase() ? "selected" : ""
                }>${App.escapeHtml(c.nama)}</option>`
            )
            .join("")}
          <option value="__custom__">+ Ketik kategori baru...</option>
        </select>
        <div data-custom-cat-wrap class="hidden mt-2">
          <input type="text" name="kategoriCustom" placeholder="Tulis nama kategori baru (otomatis tersimpan ke daftar)..." class="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm bg-emerald-50/30 focus:outline-none focus:border-emerald-700" />
        </div>
      </div>
    `;
  }

  function renderDatePickerFieldHtml(rawTanggal) {
    const isoVal = parseIndonesianDateToIso(rawTanggal);
    return `
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
        <input
          type="date"
          name="tanggal"
          data-date-picker="true"
          value="${App.escapeHtml(isoVal)}"
          class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-700"
        />
      </div>
    `;
  }

  function renderContentItemForm(type, itemId) {
    const isNew = itemId === "new";
    const existing = !isNew ? (studio.draftData[type] || []).find((i) => i.id === itemId) : null;
    const masterCats = App.getCategoryCollection(studio.draftData, false);
    const defaultCatName = (masterCats[0] && masterCats[0].nama) || "Aqidah";
    const currentCategory = existing ? App.getItemCategory(existing, type) : defaultCatName;

    const statusVal = existing ? existing.status || "published" : "published";

    let fieldsHtml = "";
    if (type === "tulisan") {
      const isiText = existing && Array.isArray(existing.isi) ? existing.isi.join("\n\n") : "";
      const dropCapActive = existing ? existing.dropCap !== false : false;
      fieldsHtml = `
        <input type="checkbox" id="studio-dropcap-input" name="dropCap" value="1" class="sr-only" ${dropCapActive ? "checked" : ""} />
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Artikel</label>
          ${renderRichTextFieldHtml({
            name: "judul",
            label: "Judul Artikel",
            value: existing?.judul || "",
            multiline: false,
            required: true,
          })}
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          ${renderCategorySelectFieldHtml(currentCategory)}
          ${renderDatePickerFieldHtml(existing?.tanggal)}
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Singkat</label>
          ${renderRichTextFieldHtml({
            name: "ringkasan",
            label: "Ringkasan",
            value: existing?.ringkasan || "",
            multiline: true,
            minHeightClass: "min-h-[68px]",
            required: true,
          })}
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Isi Artikel Lengkap (pisahkan paragraf dengan Enter 2x)</label>
          ${renderRichTextFieldHtml({
            name: "isi",
            label: "Isi Artikel",
            value: isiText,
            multiline: true,
            minHeightClass: "min-h-[240px] leading-relaxed",
            extraClass: "ct-editor-article-prose",
            required: true,
          })}
        </div>
      `;
    } else if (type === "ebook") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Ebook</label>
          ${renderRichTextFieldHtml({
            name: "judul",
            label: "Judul Ebook",
            value: existing?.judul || "",
            multiline: false,
            required: true,
          })}
        </div>
        ${renderCategorySelectFieldHtml(currentCategory)}
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
          ${renderRichTextFieldHtml({
            name: "deskripsi",
            label: "Deskripsi Ebook",
            value: existing?.deskripsi || "",
            multiline: true,
            minHeightClass: "min-h-[88px]",
            required: true,
          })}
        </div>
      `;
    } else if (type === "flyer") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Flyer Nasihat</label>
          ${renderRichTextFieldHtml({
            name: "judul",
            label: "Judul Flyer",
            value: existing?.judul || "",
            multiline: false,
            required: true,
          })}
        </div>
        ${renderCategorySelectFieldHtml(currentCategory)}
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Sub-Tema (opsional)</label>
            <input name="tema" value="${App.escapeHtml(existing?.tema || "")}" placeholder="Mis. Kesabaran / Syukur" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          ${renderDatePickerFieldHtml(existing?.tanggal)}
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL Gambar Flyer atau Unggah Gambar</label>
          <input name="gambar" id="field-flyer-gambar" required value="${App.escapeHtml(existing?.gambar || "/src/assets/images/flyer_sabar_1795070324398.jpg")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept="image/*" data-upload-target="field-flyer-gambar" data-upload-folder="images" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Kutipan / Teks Nasihat</label>
          ${renderRichTextFieldHtml({
            name: "nasihat",
            label: "Teks Nasihat",
            value: existing?.nasihat || "",
            multiline: true,
            minHeightClass: "min-h-[88px]",
            required: true,
          })}
        </div>
      `;
    } else if (type === "audio") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Audio Kajian / Siniar</label>
          ${renderRichTextFieldHtml({
            name: "judul",
            label: "Judul Audio",
            value: existing?.judul || "",
            multiline: false,
            required: true,
          })}
        </div>
        ${renderCategorySelectFieldHtml(currentCategory)}
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Seri / Episode</label>
            <input name="seri" value="${App.escapeHtml(existing?.seri || "Siniar Jeda")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Durasi</label>
            <input name="durasi" value="${App.escapeHtml(existing?.durasi || "05:00")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        ${renderDatePickerFieldHtml(existing?.tanggal)}
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">URL Audio (.mp3 / .wav) atau Unggah File</label>
          <input name="audioUrl" id="field-audio-url" required value="${App.escapeHtml(existing?.audioUrl || "/audio/nasihat-berbaik-sangka.wav")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm mb-1.5" />
          <input type="file" accept="audio/*" data-upload-target="field-audio-url" data-upload-folder="audio" class="text-xs text-gray-600 w-full" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Materi</label>
          ${renderRichTextFieldHtml({
            name: "ringkasan",
            label: "Ringkasan Audio",
            value: existing?.ringkasan || "",
            multiline: true,
            minHeightClass: "min-h-[88px]",
            required: true,
          })}
        </div>
      `;
    } else if (type === "video") {
      fieldsHtml = `
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Judul Video</label>
          ${renderRichTextFieldHtml({
            name: "judul",
            label: "Judul Video",
            value: existing?.judul || "",
            multiline: false,
            required: true,
          })}
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Link YouTube atau ID Video (11 karakter)</label>
          <input name="youtubeId" required placeholder="https://youtu.be/... atau ID" value="${App.escapeHtml(existing?.youtubeId || "")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
        </div>
        ${renderCategorySelectFieldHtml(currentCategory)}
        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Durasi</label>
            <input name="durasi" value="${App.escapeHtml(existing?.durasi || "10 menit")}" class="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm" />
          </div>
          ${renderDatePickerFieldHtml(existing?.tanggal)}
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Materi</label>
          ${renderRichTextFieldHtml({
            name: "ringkasan",
            label: "Ringkasan Video",
            value: existing?.ringkasan || "",
            multiline: true,
            minHeightClass: "min-h-[88px]",
            required: true,
          })}
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

        <p id="studio-item-form-error" class="hidden p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"></p>

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
    setStudioWorkspaceView("edit");
  }

  function exitStudioWorkspace() {
    hideFloatingFontBar();
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

    if (els.studioGoPreview) {
      els.studioGoPreview.addEventListener("click", () => {
        setStudioWorkspaceView("preview");
      });
    }

    if (els.studioBackToEdit) {
      els.studioBackToEdit.addEventListener("click", () => {
        setStudioWorkspaceView("edit");
      });
    }

    if (els.previewBackEditBtn) {
      els.previewBackEditBtn.addEventListener("click", () => {
        setStudioWorkspaceView("edit");
      });
    }

    if (els.previewPublishBtn) {
      els.previewPublishBtn.addEventListener("click", openPublishModal);
    }

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
      const filterCatBtn = e.target.closest("[data-filter-category]");
      if (filterCatBtn) {
        studio.previewCategory = filterCatBtn.dataset.filterCategory || "all";
        renderLivePreview();
        return;
      }
      const viewModeBtn = e.target.closest("[data-category-view]");
      if (viewModeBtn) {
        studio.previewCategoryView = viewModeBtn.dataset.categoryView === "grid" ? "grid" : "grouped";
        renderLivePreview();
        return;
      }
      const crossBtn = e.target.closest("[data-cross-tab]");
      if (crossBtn) {
        studio.previewActiveTab = crossBtn.dataset.crossTab;
        studio.previewCategory = crossBtn.dataset.crossCategory || "all";
        renderLivePreview();
        if (els.studioPreviewView) els.studioPreviewView.scrollTop = 0;
        return;
      }
      const jumpCatBtn = e.target.closest("[data-jump-category]");
      if (jumpCatBtn) {
        const targetEl = els.studioPreviewMount.querySelector(
          `#cat-group-${jumpCatBtn.dataset.jumpCategory}`
        );
        if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const tabBtn = e.target.closest("[data-preview-tab]");
      if (tabBtn) {
        studio.previewActiveTab = tabBtn.dataset.previewTab;
        studio.previewCategory = "all";
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

    const editorHistoryMap = new WeakMap();
    const editorHistoryTimers = new WeakMap();

    function getSelectionOffsets(editorEl) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
      const range = sel.getRangeAt(0);
      if (!editorEl.contains(range.commonAncestorContainer)) return { start: 0, end: 0 };

      const calcOffset = (targetNode, targetOffset) => {
        let total = 0;
        if (targetNode === editorEl) {
          for (let i = 0; i < targetOffset && i < editorEl.childNodes.length; i += 1) {
            total += String(editorEl.childNodes[i].textContent || "").length;
          }
          return total;
        }
        const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null);
        let node = walker.nextNode();
        while (node) {
          if (node === targetNode) {
            return total + Math.min(targetOffset, node.nodeValue.length);
          }
          total += node.nodeValue.length;
          node = walker.nextNode();
        }
        try {
          const pre = document.createRange();
          pre.selectNodeContents(editorEl);
          pre.setEnd(targetNode, targetOffset);
          return pre.toString().length;
        } catch (_e) {
          return total;
        }
      };

      const start = calcOffset(range.startContainer, range.startOffset);
      const end = range.collapsed ? start : calcOffset(range.endContainer, range.endOffset);
      return { start, end };
    }

    function restoreSelectionOffsets(editorEl, startOff, endOff) {
      const sel = window.getSelection();
      if (!sel) return null;
      const targetStart = Math.max(0, Number(startOff) || 0);
      const targetEnd = Math.max(targetStart, Number(endOff) || targetStart);

      const findPoint = (offset) => {
        const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null);
        let acc = 0;
        let lastNode = null;
        let node = walker.nextNode();
        while (node) {
          const len = node.nodeValue.length;
          if (acc + len >= offset) {
            return { node, offset: Math.max(0, offset - acc) };
          }
          acc += len;
          lastNode = node;
          node = walker.nextNode();
        }
        if (lastNode) {
          return { node: lastNode, offset: lastNode.nodeValue.length };
        }
        return { node: editorEl, offset: editorEl.childNodes.length };
      };

      const p1 = findPoint(targetStart);
      const p2 = targetEnd === targetStart ? p1 : findPoint(targetEnd);
      const r = document.createRange();
      try {
        r.setStart(p1.node, p1.offset);
        r.setEnd(p2.node, p2.offset);
      } catch (_e) {
        r.selectNodeContents(editorEl);
        r.collapse(false);
      }
      sel.removeAllRanges();
      sel.addRange(r);
      studio.lastTextControl = { el: editorEl, range: r.cloneRange() };
      return r;
    }

    function createEditorSnapshot(editorEl) {
      const offsets = getSelectionOffsets(editorEl);
      return {
        html: editorEl.innerHTML,
        selStart: offsets.start,
        selEnd: offsets.end,
        rtQuote: (editorEl.dataset && editorEl.dataset.rtQuote) || "",
        rtAlign: (editorEl.dataset && editorEl.dataset.rtAlign) || "",
        rtIndent: (editorEl.dataset && editorEl.dataset.rtIndent) || "",
        rtIndentMode: (editorEl.dataset && editorEl.dataset.rtIndentMode) || "",
      };
    }

    function snapshotsEqual(a, b) {
      if (!a || !b) return false;
      return (
        a.html === b.html &&
        a.rtQuote === b.rtQuote &&
        a.rtAlign === b.rtAlign &&
        a.rtIndent === b.rtIndent &&
        a.rtIndentMode === b.rtIndentMode
      );
    }

    function ensureEditorHistory(editorEl) {
      if (!editorEl) return null;
      let hist = editorHistoryMap.get(editorEl);
      if (!hist) {
        hist = {
          entries: [createEditorSnapshot(editorEl)],
          index: 0,
        };
        editorHistoryMap.set(editorEl, hist);
      }
      return hist;
    }

    function syncUndoRedoButtons(editorEl) {
      const hist = editorEl ? ensureEditorHistory(editorEl) : null;
      const curSnap = editorEl ? createEditorSnapshot(editorEl) : null;
      const hasPendingDiff = Boolean(
        hist && curSnap && !snapshotsEqual(curSnap, hist.entries[hist.index])
      );
      const canUndo = Boolean(hist && (hist.index > 0 || hasPendingDiff));
      const canRedo = Boolean(hist && hist.index < hist.entries.length - 1);

      if (els.btnEditorUndo) els.btnEditorUndo.disabled = !canUndo;
      if (els.btnEditorRedo) els.btnEditorRedo.disabled = !canRedo;
    }

    function commitEditorHistory(editorEl) {
      if (!editorEl) return;
      const pendingTimer = editorHistoryTimers.get(editorEl);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        editorHistoryTimers.delete(editorEl);
      }
      const hist = ensureEditorHistory(editorEl);
      const snap = createEditorSnapshot(editorEl);
      if (snapshotsEqual(snap, hist.entries[hist.index])) {
        syncUndoRedoButtons(editorEl);
        return;
      }
      if (hist.index < hist.entries.length - 1) {
        hist.entries = hist.entries.slice(0, hist.index + 1);
      }
      hist.entries.push(snap);
      if (hist.entries.length > 80) {
        hist.entries.shift();
      }
      hist.index = hist.entries.length - 1;
      syncUndoRedoButtons(editorEl);
    }

    function scheduleEditorHistoryCommit(editorEl) {
      if (!editorEl) return;
      ensureEditorHistory(editorEl);
      const prevTimer = editorHistoryTimers.get(editorEl);
      if (prevTimer) clearTimeout(prevTimer);
      const timer = setTimeout(() => {
        editorHistoryTimers.delete(editorEl);
        commitEditorHistory(editorEl);
      }, 350);
      editorHistoryTimers.set(editorEl, timer);
      syncUndoRedoButtons(editorEl);
    }

    function flushEditorHistory(editorEl) {
      if (!editorEl) return;
      const pendingTimer = editorHistoryTimers.get(editorEl);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        editorHistoryTimers.delete(editorEl);
        commitEditorHistory(editorEl);
      } else {
        ensureEditorHistory(editorEl);
      }
    }

    function applyHistorySnapshot(editorEl, snap) {
      if (!editorEl || !snap) return;
      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        editorEl.innerHTML = snap.html;
        if (editorEl.dataset.multiline !== "true") {
          if (snap.rtQuote) editorEl.dataset.rtQuote = snap.rtQuote;
          else delete editorEl.dataset.rtQuote;
          if (snap.rtAlign) editorEl.dataset.rtAlign = snap.rtAlign;
          else delete editorEl.dataset.rtAlign;
          if (snap.rtIndent) editorEl.dataset.rtIndent = snap.rtIndent;
          else delete editorEl.dataset.rtIndent;
          if (snap.rtIndentMode) editorEl.dataset.rtIndentMode = snap.rtIndentMode;
          else delete editorEl.dataset.rtIndentMode;
        }
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        restoreSelectionOffsets(editorEl, snap.selStart, snap.selEnd);
      } finally {
        studio.suppressEditorTrack = false;
      }
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      positionFloatingFontBar(editorEl);
    }

    function performEditorUndo(targetEditor) {
      const editorEl =
        targetEditor ||
        (studio.lastTextControl &&
        studio.lastTextControl.el &&
        document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl.el
          : null);
      if (!editorEl) return;
      flushEditorHistory(editorEl);
      const hist = ensureEditorHistory(editorEl);
      const curSnap = createEditorSnapshot(editorEl);
      if (!snapshotsEqual(curSnap, hist.entries[hist.index])) {
        commitEditorHistory(editorEl);
      }
      if (hist.index <= 0) {
        syncUndoRedoButtons(editorEl);
        return;
      }
      hist.index -= 1;
      applyHistorySnapshot(editorEl, hist.entries[hist.index]);
      syncUndoRedoButtons(editorEl);
    }

    function performEditorRedo(targetEditor) {
      const editorEl =
        targetEditor ||
        (studio.lastTextControl &&
        studio.lastTextControl.el &&
        document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl.el
          : null);
      if (!editorEl) return;
      flushEditorHistory(editorEl);
      const hist = ensureEditorHistory(editorEl);
      if (hist.index >= hist.entries.length - 1) {
        syncUndoRedoButtons(editorEl);
        return;
      }
      hist.index += 1;
      applyHistorySnapshot(editorEl, hist.entries[hist.index]);
      syncUndoRedoButtons(editorEl);
    }

    // Delegasi Input & Klik pada Sidebar Editor Kiri
    els.studioPanelBody.addEventListener("input", (e) => {
      const richEditor = e.target.closest ? e.target.closest('[data-rich-editor="true"]') : null;
      if (richEditor) {
        if (!richEditor.textContent.replace(/\u200B/g, "").trim() && richEditor.querySelector("br, div, p") && !richEditor.querySelector("[data-rt-type]")) {
          richEditor.innerHTML = "";
        }
        updateEditorLineDirections(richEditor);
        syncEditorToBackingField(richEditor, true);
        scheduleEditorHistoryCommit(richEditor);
        return;
      }

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

    els.studioPanelBody.addEventListener("keydown", (e) => {
      const richEditor = e.target.closest ? e.target.closest('[data-rich-editor="true"]') : null;
      if (!richEditor) return;

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          performEditorUndo(richEditor);
          return;
        }
        if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          performEditorRedo(richEditor);
          return;
        }
      }

      if (e.key === "Enter" && richEditor.dataset.multiline !== "true") {
        e.preventDefault();
        return;
      }

      // Tekan Enter pada <li> kosong atau Enter 2x di akhir blockquote -> kembali ke paragraf normal
      if (e.key === "Enter" && !e.shiftKey && richEditor.dataset.multiline === "true") {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
          const r = sel.getRangeAt(0);

          // 1. Cek jika kursor berada di dalam <li> kosong di dalam <ul> / <ol>
          let curLi = r.startContainer;
          let liEl = null;
          while (curLi && curLi !== richEditor) {
            if (
              curLi.nodeType === Node.ELEMENT_NODE &&
              curLi.tagName === "LI" &&
              curLi.parentNode &&
              (curLi.parentNode.tagName === "UL" || curLi.parentNode.tagName === "OL") &&
              curLi.parentNode.parentNode === richEditor
            ) {
              liEl = curLi;
              break;
            }
            curLi = curLi.parentNode;
          }
          if (liEl) {
            const plainLi = String(liEl.textContent || "").replace(/\u200B/g, "").trim();
            if (plainLi === "") {
              e.preventDefault();
              flushEditorHistory(richEditor);
              studio.suppressEditorTrack = true;
              try {
                const listEl = liEl.parentNode;
                const listTag = listEl.tagName.toLowerCase();
                const allLis = Array.from(listEl.children).filter((c) => c.tagName === "LI");
                const liIdx = allLis.indexOf(liEl);
                const newDiv = document.createElement("div");
                newDiv.setAttribute("dir", "ltr");
                newDiv.innerHTML = "<br>";

                if (allLis.length <= 1) {
                  richEditor.replaceChild(newDiv, listEl);
                } else if (liIdx === 0) {
                  listEl.removeChild(liEl);
                  richEditor.insertBefore(newDiv, listEl);
                } else if (liIdx === allLis.length - 1) {
                  listEl.removeChild(liEl);
                  if (listEl.nextSibling) {
                    richEditor.insertBefore(newDiv, listEl.nextSibling);
                  } else {
                    richEditor.appendChild(newDiv);
                  }
                } else {
                  const afterList = document.createElement(listTag);
                  afterList.className = listEl.className;
                  for (let k = liIdx + 1; k < allLis.length; k += 1) {
                    afterList.appendChild(allLis[k]);
                  }
                  listEl.removeChild(liEl);
                  if (listEl.nextSibling) {
                    richEditor.insertBefore(newDiv, listEl.nextSibling);
                  } else {
                    richEditor.appendChild(newDiv);
                  }
                  if (newDiv.nextSibling) {
                    richEditor.insertBefore(afterList, newDiv.nextSibling);
                  } else {
                    richEditor.appendChild(afterList);
                  }
                }

                const caretR = document.createRange();
                caretR.setStart(newDiv, 0);
                caretR.collapse(true);
                sel.removeAllRanges();
                sel.addRange(caretR);
                studio.lastTextControl = { el: richEditor, range: caretR.cloneRange() };

                updateEditorLineDirections(richEditor);
                syncEditorToBackingField(richEditor, true);
              } finally {
                studio.suppressEditorTrack = false;
              }
              commitEditorHistory(richEditor);
              syncFloatingBarControlsFromEditor(richEditor, studio.lastTextControl.range);
              positionFloatingFontBar(richEditor);
              return;
            }
          }

          let cur = r.startContainer;
          let quoteBlk = null;
          while (cur && cur !== richEditor) {
            if (cur.nodeType === Node.ELEMENT_NODE && cur.tagName === "BLOCKQUOTE" && cur.parentNode === richEditor) {
              quoteBlk = cur;
              break;
            }
            cur = cur.parentNode;
          }
          if (quoteBlk) {
            const plainQuote = String(quoteBlk.textContent || "").replace(/\u200B/g, "").trim();
            const isCaretAtEndOfQuote = (() => {
              try {
                const tailRange = document.createRange();
                tailRange.selectNodeContents(quoteBlk);
                tailRange.setStart(r.startContainer, r.startOffset);
                return String(tailRange.toString() || "").replace(/\u200B/g, "").trim() === "";
              } catch (_e) {
                return false;
              }
            })();

            // Cek 1: blockquote baru sudah kosong (setelah Enter pertama memisah blok)
            // Cek 2: baris terakhir di dalam blockquote berupa <br><br> kosong tepat sebelum kursor
            const childNodes = Array.from(quoteBlk.childNodes);
            let brTailCount = 0;
            for (let i = childNodes.length - 1; i >= 0; i -= 1) {
              const ch = childNodes[i];
              if (ch.nodeType === Node.TEXT_NODE && !String(ch.nodeValue || "").replace(/\u200B/g, "").trim()) {
                continue;
              }
              if (ch.nodeType === Node.ELEMENT_NODE && ch.tagName === "BR") {
                brTailCount += 1;
              } else {
                break;
              }
            }

            if (plainQuote === "" || (isCaretAtEndOfQuote && brTailCount >= 2)) {
              e.preventDefault();
              flushEditorHistory(richEditor);
              studio.suppressEditorTrack = true;
              try {
                const newDiv = document.createElement("div");
                newDiv.setAttribute("dir", "ltr");
                newDiv.innerHTML = "<br>";

                if (plainQuote === "") {
                  quoteBlk.parentNode.replaceChild(newDiv, quoteBlk);
                } else {
                  let removed = 0;
                  while (quoteBlk.lastChild && removed < brTailCount) {
                    const lc = quoteBlk.lastChild;
                    if (lc.nodeType === Node.TEXT_NODE && !String(lc.nodeValue || "").trim()) {
                      quoteBlk.removeChild(lc);
                      continue;
                    }
                    if (lc.nodeType === Node.ELEMENT_NODE && lc.tagName === "BR") {
                      quoteBlk.removeChild(lc);
                      removed += 1;
                    } else {
                      break;
                    }
                  }
                  if (quoteBlk.nextSibling) {
                    quoteBlk.parentNode.insertBefore(newDiv, quoteBlk.nextSibling);
                  } else {
                    quoteBlk.parentNode.appendChild(newDiv);
                  }
                }

                const caretR = document.createRange();
                caretR.setStart(newDiv, 0);
                caretR.collapse(true);
                sel.removeAllRanges();
                sel.addRange(caretR);
                studio.lastTextControl = { el: richEditor, range: caretR.cloneRange() };

                updateEditorLineDirections(richEditor);
                syncEditorToBackingField(richEditor, true);
              } finally {
                studio.suppressEditorTrack = false;
              }
              commitEditorHistory(richEditor);
              syncFloatingBarControlsFromEditor(richEditor, studio.lastTextControl.range);
              positionFloatingFontBar(richEditor);
              return;
            }
          }
        }
      }
    });

    els.studioPanelBody.addEventListener("paste", (e) => {
      const richEditor = e.target.closest ? e.target.closest('[data-rich-editor="true"]') : null;
      if (!richEditor) return;
      e.preventDefault();
      flushEditorHistory(richEditor);
      const rawPaste = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
      const pasteText =
        richEditor.dataset.multiline === "true" ? rawPaste : rawPaste.replace(/\r?\n+/g, " ");

      const sel = window.getSelection();
      if (sel && sel.rangeCount && richEditor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const tn = document.createTextNode(pasteText);
        range.insertNode(tn);
        range.setStartAfter(tn);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        richEditor.appendChild(document.createTextNode(pasteText));
      }
      updateEditorLineDirections(richEditor);
      syncEditorToBackingField(richEditor, true);
      commitEditorHistory(richEditor);
    });

    els.studioPanelBody.addEventListener("change", async (e) => {
      // Filter kategori di daftar konten Studio
      if (e.target.id === "studio-konten-cat-filter") {
        studio.contentCategoryFilter = e.target.value || "all";
        renderStudioSidebar();
        return;
      }

      // Dropdown pilih kategori + opsi ketik kategori baru di form item
      if (e.target.matches('[data-cat-select="true"]')) {
        const wrap = e.target.parentNode ? e.target.parentNode.querySelector("[data-custom-cat-wrap]") : null;
        if (wrap) {
          const isCustom = e.target.value === "__custom__";
          wrap.classList.toggle("hidden", !isCustom);
          if (isCustom) {
            const inp = wrap.querySelector('input[name="kategoriCustom"]');
            if (inp) inp.focus();
          }
        }
        return;
      }

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

    // Toolbar Font & Ukuran Melayang Kontekstual (WYSIWYG — langsung ubah font & ukuran teks tanpa kode tag)
    function findEnclosingRtSpan(node, rootEl) {
      let cur = node;
      while (cur && cur !== rootEl) {
        if (cur.nodeType === Node.ELEMENT_NODE && cur.dataset && cur.dataset.rtType) {
          return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function unwrapDomNode(el) {
      if (!el || !el.parentNode) return;
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }

    function stripNestedRtSpans(containerNode) {
      if (!containerNode || !containerNode.querySelectorAll) return;
      Array.from(containerNode.querySelectorAll("[data-rt-type]")).forEach((sp) => {
        unwrapDomNode(sp);
      });
    }

    function findEnclosingColorSpan(node, rootEl) {
      let cur = node;
      while (cur && cur !== rootEl) {
        if (cur.nodeType === Node.ELEMENT_NODE && cur.dataset && cur.dataset.rtColor) {
          return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function stripNestedColorSpans(containerNode) {
      if (!containerNode || !containerNode.querySelectorAll) return;
      Array.from(containerNode.querySelectorAll("[data-rt-color]")).forEach((sp) => {
        unwrapDomNode(sp);
      });
    }

    function getRichEditorFromNode(node) {
      let cur = node;
      while (cur && cur !== els.studioPanelBody) {
        if (cur.nodeType === Node.ELEMENT_NODE && cur.dataset && cur.dataset.richEditor === "true") {
          return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function findEnclosingBlockLine(node, rootEl) {
      let cur = node;
      while (cur && cur !== rootEl) {
        if (cur.nodeType === Node.ELEMENT_NODE) {
          if (
            cur.tagName === "LI" &&
            cur.parentNode &&
            (cur.parentNode.tagName === "UL" || cur.parentNode.tagName === "OL") &&
            cur.parentNode.parentNode === rootEl
          ) {
            return cur;
          }
          if (
            cur.parentNode === rootEl &&
            ["DIV", "P", "LI", "H1", "H2", "H3", "BLOCKQUOTE"].includes(cur.tagName)
          ) {
            return cur;
          }
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function getDirectLineBlocks(rootEl) {
      const out = [];
      Array.from(rootEl.children).forEach((el) => {
        if (el.tagName === "UL" || el.tagName === "OL") {
          Array.from(el.children).forEach((li) => {
            if (li.tagName === "LI") out.push(li);
          });
        } else if (["DIV", "P", "LI", "H1", "H2", "H3", "BLOCKQUOTE"].includes(el.tagName)) {
          out.push(el);
        }
      });
      return out;
    }

    function stripInlineFormattingNodes(containerNode) {
      if (!containerNode || !containerNode.querySelectorAll) return;
      Array.from(containerNode.querySelectorAll("b, strong, i, em, u, s, strike, del, a, font, [data-rt-color]")).forEach((el) => {
        unwrapDomNode(el);
      });
    }

    function findEnclosingTag(node, rootEl, tagNames) {
      let cur = node;
      while (cur && cur !== rootEl) {
        if (cur.nodeType === Node.ELEMENT_NODE && tagNames.includes(cur.tagName)) {
          return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function setFormatButtonActive(btn, isActive) {
      if (!btn) return;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.classList.toggle("bg-emerald-50", Boolean(isActive));
      btn.classList.toggle("text-emerald-800", Boolean(isActive));
      btn.classList.toggle("text-gray-700", !isActive);
    }

    function syncFloatingFormatButtons(editorEl, range) {
      const activeNode = range && editorEl && editorEl.contains(range.startContainer) ? range.startContainer : null;
      const safeCmdState = (cmd) => {
        try {
          return Boolean(document.activeElement === editorEl && document.queryCommandState(cmd));
        } catch (_e) {
          return false;
        }
      };

      const isBold = Boolean(activeNode && findEnclosingTag(activeNode, editorEl, ["B", "STRONG"])) || safeCmdState("bold");
      const isItalic = Boolean(activeNode && findEnclosingTag(activeNode, editorEl, ["I", "EM"])) || safeCmdState("italic");
      const isUnderline = Boolean(activeNode && findEnclosingTag(activeNode, editorEl, ["U"])) || safeCmdState("underline");
      const isStrike = Boolean(activeNode && findEnclosingTag(activeNode, editorEl, ["S", "STRIKE", "DEL"])) || safeCmdState("strikeThrough");
      const isLink = Boolean(activeNode && findEnclosingTag(activeNode, editorEl, ["A"]));

      let colorSpan = activeNode ? findEnclosingColorSpan(activeNode, editorEl) : null;
      if (!colorSpan && range && editorEl && !range.collapsed) {
        const innerColors = Array.from(editorEl.querySelectorAll("[data-rt-color]")).filter((sp) => {
          try {
            return range.intersectsNode(sp);
          } catch (_e) {
            return false;
          }
        });
        if (innerColors.length === 1) colorSpan = innerColors[0];
      }
      const activeColor = colorSpan ? App.sanitizeRichColor(colorSpan.dataset.rtColor) : "";

      setFormatButtonActive(els.btnFormatBold, isBold);
      setFormatButtonActive(els.btnFormatItalic, isItalic);
      setFormatButtonActive(els.btnFormatUnderline, isUnderline);
      setFormatButtonActive(els.btnFormatStrike, isStrike);
      setFormatButtonActive(els.btnFormatColor, Boolean(activeColor));
      if (els.btnFormatColorBar) {
        els.btnFormatColorBar.style.backgroundColor = activeColor || "#1f2937";
      }
      if (els.textColorPicker && activeColor) {
        els.textColorPicker.value = activeColor;
      }
      setFormatButtonActive(els.btnFormatLink, isLink);

      // Status perataan, bullet/numbering, blockquote, indentasi fleksibel, dan Drop Cap
      const isMultiline = Boolean(editorEl && editorEl.dataset.multiline === "true");
      let activeBlocks = [];
      if (editorEl) {
        if (!isMultiline) {
          activeBlocks = [editorEl];
        } else {
          const allBlocks = getDirectLineBlocks(editorEl);
          if (range && editorEl.contains(range.startContainer)) {
            const matched = allBlocks.filter((blk) => {
              try {
                return range.intersectsNode(blk);
              } catch (_e) {
                return false;
              }
            });
            if (matched.length) {
              activeBlocks = matched;
            } else {
              const singleBlk = findEnclosingBlockLine(range.startContainer, editorEl);
              if (singleBlk) activeBlocks = [singleBlk];
            }
          }
          if (!activeBlocks.length && allBlocks.length) {
            activeBlocks = [allBlocks[0]];
          }
        }
      }

      const primaryBlock = activeBlocks[0] || editorEl;
      const blockMeta = getBlockNodeMeta(primaryBlock);
      const effectiveDir =
        (primaryBlock && primaryBlock.getAttribute && primaryBlock.getAttribute("dir")) ||
        (editorEl && editorEl.getAttribute && editorEl.getAttribute("dir")) ||
        "ltr";
      const activeAlign = blockMeta.align || (effectiveDir === "rtl" ? "right" : "left");

      if (els.alignButtons && els.alignButtons.length) {
        els.alignButtons.forEach((btn) => {
          setFormatButtonActive(btn, btn.dataset.formatAlign === activeAlign);
        });
      }

      const isUlActive =
        isMultiline && activeBlocks.length > 0 && activeBlocks.every((blk) => getBlockNodeMeta(blk).listType === "ul");
      const isOlActive =
        isMultiline && activeBlocks.length > 0 && activeBlocks.every((blk) => getBlockNodeMeta(blk).listType === "ol");
      if (els.btnFormatUl) {
        els.btnFormatUl.disabled = !isMultiline;
        setFormatButtonActive(els.btnFormatUl, isUlActive);
      }
      if (els.btnFormatOl) {
        els.btnFormatOl.disabled = !isMultiline;
        setFormatButtonActive(els.btnFormatOl, isOlActive);
      }

      const isQuoteActive =
        activeBlocks.length > 0 && activeBlocks.every((blk) => getBlockNodeMeta(blk).isQuote);
      setFormatButtonActive(els.btnFormatQuote, isQuoteActive);

      const indentLevels = activeBlocks.map((blk) => getBlockNodeMeta(blk).indent);
      const minIndent = indentLevels.length ? Math.min(...indentLevels) : 0;
      const maxIndent = indentLevels.length ? Math.max(...indentLevels) : 0;
      const primaryIndent = App.normalizeIndentLevel(blockMeta.indent);
      const primaryIndentMode = App.normalizeIndentMode(blockMeta.indentMode);

      if (els.btnFormatOutdent) els.btnFormatOutdent.disabled = maxIndent <= 0;
      if (els.btnFormatIndent) els.btnFormatIndent.disabled = minIndent >= 4;
      if (els.indentModeSelect && document.activeElement !== els.indentModeSelect) {
        els.indentModeSelect.value = primaryIndentMode;
      }
      if (els.indentInput && document.activeElement !== els.indentInput) {
        els.indentInput.value = primaryIndent > 0 ? String(primaryIndent) : "0";
      }
      if (els.indentPreset) {
        const indStr = String(primaryIndent);
        els.indentPreset.value = Array.from(els.indentPreset.options).some((o) => o.value === indStr)
          ? indStr
          : "";
      }

      const dropCapInput = document.getElementById("studio-dropcap-input");
      if (els.btnToggleDropCap) {
        els.btnToggleDropCap.disabled = !dropCapInput;
        setFormatButtonActive(els.btnToggleDropCap, Boolean(dropCapInput && dropCapInput.checked));
      }

      syncUndoRedoButtons(editorEl);
    }

    function syncFloatingBarControlsFromEditor(editorEl, range) {
      if (!els.floatingFontSelect || !els.floatingSizeInput) return;
      let rtSpan = null;
      if (range && editorEl.contains(range.startContainer)) {
        rtSpan = findEnclosingRtSpan(range.startContainer, editorEl);
        if (!rtSpan && !range.collapsed) {
          const innerSpans = Array.from(editorEl.querySelectorAll("[data-rt-type]")).filter((sp) => {
            try {
              return range.intersectsNode(sp);
            } catch (_e) {
              return false;
            }
          });
          if (innerSpans.length === 1) {
            rtSpan = innerSpans[0];
          }
        }
        if (!rtSpan && editorEl.dataset.multiline === "true") {
          const lineBlock = findEnclosingBlockLine(range.startContainer, editorEl);
          if (lineBlock) {
            const directSpans = Array.from(lineBlock.querySelectorAll(":scope > [data-rt-type]"));
            const lineTxt = String(lineBlock.textContent || "").replace(/\u200B/g, "").trim();
            if (directSpans.length === 1 && lineTxt && lineTxt === String(directSpans[0].textContent || "").replace(/\u200B/g, "").trim()) {
              rtSpan = directSpans[0];
            }
          }
        }
      }
      if (!rtSpan && editorEl.dataset.multiline !== "true") {
        const directSpans = Array.from(editorEl.querySelectorAll(":scope > [data-rt-type]"));
        if (directSpans.length === 1 && editorEl.textContent.trim() === directSpans[0].textContent.trim()) {
          rtSpan = directSpans[0];
        }
      }

      const fontVal = rtSpan ? rtSpan.dataset.rtFont || "" : "";
      const sizeVal = rtSpan && rtSpan.dataset.rtSize ? String(rtSpan.dataset.rtSize) : "";

      if (Array.from(els.floatingFontSelect.options).some((o) => o.value === fontVal)) {
        els.floatingFontSelect.value = fontVal;
      } else {
        els.floatingFontSelect.value = "";
      }
      els.floatingSizeInput.value = sizeVal;
      if (els.floatingSizePreset) {
        els.floatingSizePreset.value = Array.from(els.floatingSizePreset.options).some((o) => o.value === sizeVal)
          ? sizeVal
          : "";
      }

      syncFloatingFormatButtons(editorEl, range);
    }

    function trackActiveRichEditor(rawTarget) {
      if (studio.suppressEditorTrack) return;
      const editorEl = getRichEditorFromNode(rawTarget);
      if (!editorEl) return;
      if (studio.floatingBlurTimer) {
        clearTimeout(studio.floatingBlurTimer);
        studio.floatingBlurTimer = null;
      }

      ensureEditorHistory(editorEl);

      const sel = window.getSelection();
      let savedRange = null;
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        if (editorEl.contains(r.commonAncestorContainer)) {
          savedRange = r.cloneRange();
        }
      }

      studio.lastTextControl = { el: editorEl, range: savedRange };
      syncFloatingFontBarOptions();
      syncFloatingBarControlsFromEditor(editorEl, savedRange);
      positionFloatingFontBar(editorEl);
    }

    function scheduleFloatingBarHideCheck() {
      if (studio.floatingBlurTimer) clearTimeout(studio.floatingBlurTimer);
      studio.floatingBlurTimer = setTimeout(() => {
        const active = document.activeElement;
        const editorEl = getRichEditorFromNode(active);
        const inField = Boolean(editorEl && els.studioPanelBody && els.studioPanelBody.contains(editorEl));
        const inBar = Boolean(active && els.floatingFontBar && els.floatingFontBar.contains(active));
        if (!inField && !inBar) {
          hideFloatingFontBar();
        }
      }, 160);
    }

    ["focusin", "keyup", "mouseup"].forEach((evtName) => {
      els.studioPanelBody.addEventListener(evtName, (e) => trackActiveRichEditor(e.target));
    });

    document.addEventListener("selectionchange", () => {
      if (studio.suppressEditorTrack || studio.interactingWithFloatingBar) return;
      const active = document.activeElement;
      if (els.floatingFontBar && els.floatingFontBar.contains(active)) return;
      const editorEl = getRichEditorFromNode(active);
      if (!editorEl || !studio.isOpen || studio.workspaceView !== "edit") return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        if (editorEl.contains(r.commonAncestorContainer)) {
          const cloned = r.cloneRange();
          studio.lastTextControl = { el: editorEl, range: cloned };
          syncFloatingBarControlsFromEditor(editorEl, cloned);
        }
      }
    });

    els.studioPanelBody.addEventListener("focusout", scheduleFloatingBarHideCheck);

    if (els.floatingFontBar) {
      const captureEditorRangeBeforeBarAction = () => {
        if (!studio.lastTextControl || !studio.lastTextControl.el) return;
        const ed = studio.lastTextControl.el;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0);
          if (ed.contains(r.commonAncestorContainer)) {
            studio.lastTextControl = { el: ed, range: r.cloneRange() };
          }
        }
      };

      const releaseBarInteract = () => {
        setTimeout(() => {
          studio.interactingWithFloatingBar = false;
        }, 0);
      };

      els.floatingFontBar.addEventListener("pointerdown", (e) => {
        studio.interactingWithFloatingBar = true;
        captureEditorRangeBeforeBarAction();
        if (e.target.closest("button")) {
          e.preventDefault();
        }
      });
      els.floatingFontBar.addEventListener("mousedown", (e) => {
        studio.interactingWithFloatingBar = true;
        captureEditorRangeBeforeBarAction();
        if (e.target.closest("button")) {
          e.preventDefault();
        }
      });
      window.addEventListener("pointerup", releaseBarInteract);
      window.addEventListener("mouseup", releaseBarInteract);

      els.floatingFontBar.addEventListener("focusin", () => {
        if (studio.floatingBlurTimer) {
          clearTimeout(studio.floatingBlurTimer);
          studio.floatingBlurTimer = null;
        }
      });
      els.floatingFontBar.addEventListener("focusout", scheduleFloatingBarHideCheck);
      els.floatingFontBar.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (studio.lastTextControl && studio.lastTextControl.el) {
            studio.lastTextControl.el.focus();
          }
          hideFloatingFontBar();
        }
      });
    }

    if (els.studioEditScroll) {
      els.studioEditScroll.addEventListener("scroll", () => {
        if (
          els.floatingFontBar &&
          !els.floatingFontBar.classList.contains("hidden") &&
          studio.lastTextControl &&
          studio.lastTextControl.el
        ) {
          positionFloatingFontBar(studio.lastTextControl.el);
        }
      });
    }

    window.addEventListener("resize", () => {
      if (
        els.floatingFontBar &&
        !els.floatingFontBar.classList.contains("hidden") &&
        studio.lastTextControl &&
        studio.lastTextControl.el
      ) {
        positionFloatingFontBar(studio.lastTextControl.el);
      }
    });

    function selectNodeContents(el, editorEl, restoreSelection) {
      const r = document.createRange();
      r.selectNodeContents(el);
      if (restoreSelection !== false) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      studio.lastTextControl = { el: editorEl, range: r.cloneRange() };
      return r;
    }

    function placeCaretInsideEnd(node, editorEl, restoreSelection) {
      const r = document.createRange();
      if (node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
        r.setStart(node.firstChild, node.firstChild.nodeValue.length);
      } else {
        r.selectNodeContents(node);
        r.collapse(false);
      }
      r.collapse(true);
      if (restoreSelection !== false) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      studio.lastTextControl = { el: editorEl, range: r.cloneRange() };
      return r;
    }

    function trimTrailingZeroOffsetBlockBoundary(range, rootEl) {
      if (!range || range.collapsed || range.endOffset !== 0) return;
      const startBlock = findEnclosingBlockLine(range.startContainer, rootEl);
      const endBlock =
        range.endContainer === rootEl
          ? null
          : findEnclosingBlockLine(range.endContainer, rootEl) ||
            (range.endContainer.parentNode === rootEl ? range.endContainer : null);
      if (!startBlock || !endBlock || startBlock === endBlock) return;
      // Triple-click di Chromium menaruh endContainer di (nextDiv, 0). Mundurkan ke akhir startBlock.
      let lastNode = startBlock.lastChild;
      while (lastNode && lastNode.nodeType === Node.ELEMENT_NODE && lastNode.tagName === "BR") {
        lastNode = lastNode.previousSibling;
      }
      if (lastNode) {
        range.setEndAfter(lastNode);
      } else {
        range.setEnd(startBlock, startBlock.childNodes.length);
      }
    }

    function wrapBlockLineContents(lineEl, targetType, fontId, sizeVal) {
      const children = Array.from(lineEl.childNodes);
      const trailingBrs = [];
      while (
        children.length &&
        children[children.length - 1].nodeType === Node.ELEMENT_NODE &&
        children[children.length - 1].tagName === "BR"
      ) {
        trailingBrs.unshift(children.pop());
      }

      const span = document.createElement("span");
      children.forEach((ch) => {
        span.appendChild(ch);
      });
      stripNestedRtSpans(span);
      applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
      lineEl.appendChild(span);
      trailingBrs.forEach((br) => lineEl.appendChild(br));
      return span;
    }

    function applyFloatingStyle(mode, options) {
      const opts = options || {};
      const returnFocus = opts.returnFocus !== false;
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo || !els.floatingFontSelect || !els.floatingSizeInput) return;

      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);
      const fontId = mode === "clear" ? "" : els.floatingFontSelect.value || "";
      const rawSizeNum = parseInt(String(els.floatingSizeInput.value || "").replace(/[^0-9]/g, ""), 10);
      const sizeVal = mode === "clear" ? 0 : rawSizeNum >= 10 && rawSizeNum <= 72 ? rawSizeNum : 0;

      // Ambil range terbaru (prioritaskan selection aktif jika masih di dalam editor)
      let range = null;
      const liveSel = window.getSelection();
      if (liveSel && liveSel.rangeCount > 0) {
        const liveR = liveSel.getRangeAt(0);
        if (editorEl.contains(liveR.commonAncestorContainer)) {
          range = liveR.cloneRange();
        }
      }
      if (!range && targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)) {
        range = targetInfo.range.cloneRange();
      }
      if (!range) {
        range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
      }

      trimTrailingZeroOffsetBlockBoundary(range, editorEl);

      studio.suppressEditorTrack = true;
      try {
        if (returnFocus) {
          editorEl.focus({ preventScroll: true });
        }

        if (mode === "clear") {
          els.floatingFontSelect.value = "";
          els.floatingSizeInput.value = "";
          if (els.floatingSizePreset) els.floatingSizePreset.value = "";

          const enclosing = findEnclosingRtSpan(range.startContainer, editorEl);
          if (!range.collapsed) {
            const startBlock = findEnclosingBlockLine(range.startContainer, editorEl);
            const endBlock = findEnclosingBlockLine(range.endContainer, editorEl);

            if (startBlock && endBlock && startBlock !== endBlock) {
              const allBlocks = getDirectLineBlocks(editorEl);
              allBlocks.forEach((blk) => {
                if (range.intersectsNode(blk)) {
                  stripNestedRtSpans(blk);
                  stripInlineFormattingNodes(blk);
                }
              });
            } else if (
              enclosing &&
              enclosing === findEnclosingRtSpan(range.endContainer, editorEl) &&
              range.toString().replace(/\u200B/g, "") === String(enclosing.textContent || "").replace(/\u200B/g, "")
            ) {
              const tmp = document.createRange();
              tmp.selectNodeContents(enclosing);
              const parent = enclosing.parentNode;
              const firstChild = enclosing.firstChild;
              const lastChild = enclosing.lastChild;
              stripInlineFormattingNodes(enclosing);
              unwrapDomNode(enclosing);
              if (firstChild && lastChild && parent) {
                const newR = document.createRange();
                newR.setStartBefore(firstChild);
                newR.setEndAfter(lastChild);
                if (returnFocus && liveSel) {
                  liveSel.removeAllRanges();
                  liveSel.addRange(newR);
                }
                studio.lastTextControl = { el: editorEl, range: newR.cloneRange() };
              }
            } else {
              const frag = range.extractContents();
              stripNestedRtSpans(frag);
              stripInlineFormattingNodes(frag);
              const markerStart = frag.firstChild;
              const markerEnd = frag.lastChild;
              range.insertNode(frag);
              if (markerStart && markerEnd) {
                const newR = document.createRange();
                newR.setStartBefore(markerStart);
                newR.setEndAfter(markerEnd);
                const sel = window.getSelection();
                if (sel && returnFocus) {
                  sel.removeAllRanges();
                  sel.addRange(newR);
                }
                studio.lastTextControl = { el: editorEl, range: newR.cloneRange() };
              }
            }
          } else if (enclosing) {
            const firstChild = enclosing.firstChild;
            const outerColor = findEnclosingColorSpan(enclosing.parentNode, editorEl);
            stripInlineFormattingNodes(enclosing);
            unwrapDomNode(enclosing);
            if (outerColor) {
              unwrapDomNode(outerColor);
            }
            if (firstChild) {
              placeCaretInsideEnd(firstChild.nodeType === Node.TEXT_NODE ? firstChild.parentNode || editorEl : firstChild, editorEl, returnFocus);
            }
          } else {
            const enclosingColor = findEnclosingColorSpan(range.startContainer, editorEl);
            if (enclosingColor) {
              const firstChild = enclosingColor.firstChild;
              stripInlineFormattingNodes(enclosingColor);
              stripNestedRtSpans(enclosingColor);
              unwrapDomNode(enclosingColor);
              if (firstChild) {
                placeCaretInsideEnd(firstChild.nodeType === Node.TEXT_NODE ? firstChild.parentNode || editorEl : firstChild, editorEl, returnFocus);
              }
            } else if (editorEl.dataset.multiline === "true") {
              const lineBlock = findEnclosingBlockLine(range.startContainer, editorEl);
              if (lineBlock) {
                stripNestedRtSpans(lineBlock);
                stripInlineFormattingNodes(lineBlock);
              } else {
                stripNestedRtSpans(editorEl);
                stripInlineFormattingNodes(editorEl);
              }
            } else {
              stripNestedRtSpans(editorEl);
              stripInlineFormattingNodes(editorEl);
            }
          }
        } else {
          const targetType = mode === "arab-block" ? "arab" : "font";
          const plainEditorText = String(editorEl.textContent || "").replace(/\u200B/g, "").trim();

          if (!range.collapsed) {
            const startBlock = findEnclosingBlockLine(range.startContainer, editorEl);
            const endBlock = findEnclosingBlockLine(range.endContainer, editorEl);

            if (editorEl.dataset.multiline === "true" && startBlock && endBlock && startBlock !== endBlock) {
              // Seleksi melintasi beberapa baris <div>: bungkus konten di dalam tiap baris agar struktur <div> tidak rusak
              const blocks = getDirectLineBlocks(editorEl);
              let firstStyledSpan = null;
              let lastStyledSpan = null;
              blocks.forEach((blk) => {
                let hits = false;
                try {
                  hits = range.intersectsNode(blk);
                } catch (_e) {
                  hits = false;
                }
                if (!hits) return;
                const blkText = String(blk.textContent || "").replace(/\u200B/g, "").trim();
                if (!blkText) return;
                if (targetType === "font" && !fontId && !sizeVal) {
                  stripNestedRtSpans(blk);
                } else {
                  const sp = wrapBlockLineContents(blk, targetType, fontId, sizeVal);
                  if (!firstStyledSpan) firstStyledSpan = sp;
                  lastStyledSpan = sp;
                }
              });
              if (firstStyledSpan && lastStyledSpan) {
                const rAll = document.createRange();
                rAll.setStartBefore(firstStyledSpan);
                rAll.setEndAfter(lastStyledSpan);
                if (returnFocus && liveSel) {
                  liveSel.removeAllRanges();
                  liveSel.addRange(rAll);
                }
                studio.lastTextControl = { el: editorEl, range: rAll.cloneRange() };
              }
            } else {
              const startSpan = findEnclosingRtSpan(range.startContainer, editorEl);
              const endSpan = findEnclosingRtSpan(range.endContainer, editorEl);
              const selectedTxt = range.toString().replace(/\u200B/g, "");

              if (
                startSpan &&
                startSpan === endSpan &&
                selectedTxt === String(startSpan.textContent || "").replace(/\u200B/g, "")
              ) {
                const nextType = mode === "arab-block" ? "arab" : startSpan.dataset.rtType || "font";
                if (nextType === "font" && !fontId && !sizeVal) {
                  unwrapDomNode(startSpan);
                } else {
                  applyRtSpanVisualStyle(startSpan, nextType, fontId, sizeVal);
                  selectNodeContents(startSpan, editorEl, returnFocus);
                }
              } else {
                const frag = range.extractContents();
                stripNestedRtSpans(frag);
                if (targetType === "font" && !fontId && !sizeVal) {
                  range.insertNode(frag);
                } else {
                  const span = document.createElement("span");
                  span.appendChild(frag);
                  applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                  range.insertNode(span);
                  selectNodeContents(span, editorEl, returnFocus);
                }
              }
            }
          } else {
            const enclosing = findEnclosingRtSpan(range.startContainer, editorEl);
            if (enclosing) {
              const nextType = mode === "arab-block" ? "arab" : enclosing.dataset.rtType || "font";
              if (nextType === "font" && !fontId && !sizeVal) {
                unwrapDomNode(enclosing);
              } else {
                applyRtSpanVisualStyle(enclosing, nextType, fontId, sizeVal);
                placeCaretInsideEnd(enclosing, editorEl, returnFocus);
              }
            } else if (!plainEditorText) {
              if (targetType === "arab" || fontId || sizeVal) {
                editorEl.innerHTML = "";
                const span = document.createElement("span");
                span.textContent = "\u200B";
                applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                editorEl.appendChild(span);
                placeCaretInsideEnd(span, editorEl, returnFocus);
              }
            } else if (editorEl.dataset.multiline !== "true") {
              // Kolom satu baris (Judul Artikel, Nama Website, Subjudul, dll): terapkan ke seluruh isi kolom
              stripNestedRtSpans(editorEl);
              if (targetType === "arab" || fontId || sizeVal) {
                const span = document.createElement("span");
                while (editorEl.firstChild) {
                  span.appendChild(editorEl.firstChild);
                }
                applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                editorEl.appendChild(span);
                selectNodeContents(span, editorEl, returnFocus);
              }
            } else {
              // Kolom multi-baris (Deskripsi, Ringkasan, Isi Artikel) dengan kursor di dalam baris tanpa seleksi:
              // Jika baris aktif berisi teks polos (belum ada span parsial), langsung terapkan ke baris tersebut!
              const lineBlock = findEnclosingBlockLine(range.startContainer, editorEl);
              if (lineBlock) {
                const lineText = String(lineBlock.textContent || "").replace(/\u200B/g, "").trim();
                const hasExistingSpans = Boolean(lineBlock.querySelector("[data-rt-type]"));
                if (lineText && !hasExistingSpans) {
                  if (targetType === "arab" || fontId || sizeVal) {
                    const span = wrapBlockLineContents(lineBlock, targetType, fontId, sizeVal);
                    placeCaretInsideEnd(span, editorEl, returnFocus);
                  }
                } else if (
                  lineText &&
                  range.startContainer.nodeType === Node.TEXT_NODE &&
                  String(range.startContainer.nodeValue || "").replace(/\u200B/g, "").trim()
                ) {
                  if (targetType === "arab" || fontId || sizeVal) {
                    const tn = range.startContainer;
                    const span = document.createElement("span");
                    tn.parentNode.insertBefore(span, tn);
                    span.appendChild(tn);
                    applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                    placeCaretInsideEnd(span, editorEl, returnFocus);
                  }
                } else if (targetType === "arab" || fontId || sizeVal) {
                  const span = document.createElement("span");
                  span.textContent = "\u200B";
                  applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                  range.insertNode(span);
                  placeCaretInsideEnd(span, editorEl, returnFocus);
                }
              } else {
                // Teks langsung di root editorEl (belum terbungkus <div>): bungkus seluruh root jika belum ada <br> / span
                const hasBrOrBlock = Boolean(editorEl.querySelector("br, div, p, [data-rt-type]"));
                if (!hasBrOrBlock) {
                  if (targetType === "arab" || fontId || sizeVal) {
                    const span = document.createElement("span");
                    while (editorEl.firstChild) {
                      span.appendChild(editorEl.firstChild);
                    }
                    applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                    editorEl.appendChild(span);
                    placeCaretInsideEnd(span, editorEl, returnFocus);
                  }
                } else if (
                  range.startContainer.nodeType === Node.TEXT_NODE &&
                  String(range.startContainer.nodeValue || "").replace(/\u200B/g, "").trim()
                ) {
                  if (targetType === "arab" || fontId || sizeVal) {
                    const tn = range.startContainer;
                    const span = document.createElement("span");
                    tn.parentNode.insertBefore(span, tn);
                    span.appendChild(tn);
                    applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                    placeCaretInsideEnd(span, editorEl, returnFocus);
                  }
                } else if (targetType === "arab" || fontId || sizeVal) {
                  const span = document.createElement("span");
                  span.textContent = "\u200B";
                  applyRtSpanVisualStyle(span, targetType, fontId, sizeVal);
                  range.insertNode(span);
                  placeCaretInsideEnd(span, editorEl, returnFocus);
                }
              }
            }
          }
        }

        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);

      // Pastikan dropdown font & ukuran di toolbar tetap sesuai nilai yang baru dipilih
      if (mode !== "clear") {
        if (els.floatingFontSelect && Array.from(els.floatingFontSelect.options).some((o) => o.value === fontId)) {
          els.floatingFontSelect.value = fontId;
        }
        if (els.floatingSizeInput) {
          els.floatingSizeInput.value = sizeVal ? String(sizeVal) : "";
        }
        if (els.floatingSizePreset) {
          const sStr = sizeVal ? String(sizeVal) : "";
          els.floatingSizePreset.value = Array.from(els.floatingSizePreset.options).some((o) => o.value === sStr)
            ? sStr
            : "";
        }
      }

      syncFloatingFormatButtons(editorEl, studio.lastTextControl ? studio.lastTextControl.range : null);

      if (returnFocus) {
        positionFloatingFontBar(editorEl);
      }
    }

    function toggleInlineFormat(cmd) {
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      let range = null;
      const liveSel = window.getSelection();
      if (liveSel && liveSel.rangeCount > 0) {
        const liveR = liveSel.getRangeAt(0);
        if (editorEl.contains(liveR.commonAncestorContainer)) {
          range = liveR.cloneRange();
        }
      }
      if (!range && targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)) {
        range = targetInfo.range.cloneRange();
      }
      if (!range) {
        range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
      }

      trimTrailingZeroOffsetBlockBoundary(range, editorEl);

      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        if (liveSel) {
          liveSel.removeAllRanges();
          liveSel.addRange(range);
        }
        try {
          document.execCommand("styleWithCSS", false, false);
        } catch (_e) {}
        document.execCommand(cmd, false, null);

        if (liveSel && liveSel.rangeCount > 0) {
          const updatedR = liveSel.getRangeAt(0);
          if (editorEl.contains(updatedR.commonAncestorContainer)) {
            studio.lastTextControl = { el: editorEl, range: updatedR.cloneRange() };
          }
        }
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(editorEl, studio.lastTextControl ? studio.lastTextControl.range : null);
      positionFloatingFontBar(editorEl);
    }

    function ensureMultilineBlocks(editorEl) {
      if (!editorEl || editorEl.dataset.multiline !== "true") return;
      const blockTags = new Set(["DIV", "P", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "UL", "OL"]);
      const children = Array.from(editorEl.childNodes);
      const hasLoose = children.some(
        (ch) => ch.nodeType !== Node.ELEMENT_NODE || !blockTags.has(ch.tagName)
      );

      if (!children.length) {
        const div = document.createElement("div");
        div.setAttribute("dir", "ltr");
        div.innerHTML = "<br>";
        editorEl.appendChild(div);
        const r = document.createRange();
        r.setStart(div, 0);
        r.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(r);
        }
        studio.lastTextControl = { el: editorEl, range: r.cloneRange() };
        return;
      }

      if (!hasLoose) return;

      const offsets = getSelectionOffsets(editorEl);
      let currentDiv = null;
      children.forEach((ch) => {
        if (ch.nodeType === Node.ELEMENT_NODE && blockTags.has(ch.tagName)) {
          currentDiv = null;
          return;
        }
        if (!currentDiv) {
          currentDiv = document.createElement("div");
          currentDiv.setAttribute("dir", "ltr");
          editorEl.insertBefore(currentDiv, ch);
        }
        currentDiv.appendChild(ch);
      });
      restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
    }

    function getActiveBlocksForCommand(editorEl, fallbackRange) {
      if (!editorEl) return [];
      if (editorEl.dataset.multiline !== "true") {
        return [editorEl];
      }

      ensureMultilineBlocks(editorEl);
      let range = null;
      const liveSel = window.getSelection();
      if (liveSel && liveSel.rangeCount > 0) {
        const lr = liveSel.getRangeAt(0);
        if (editorEl.contains(lr.commonAncestorContainer)) {
          range = lr.cloneRange();
        }
      }
      if (!range && fallbackRange && editorEl.contains(fallbackRange.commonAncestorContainer)) {
        range = fallbackRange.cloneRange();
      }
      if (range) {
        trimTrailingZeroOffsetBlockBoundary(range, editorEl);
      }

      const allBlocks = getDirectLineBlocks(editorEl);
      if (range) {
        const hitBlocks = allBlocks.filter((blk) => {
          try {
            return range.intersectsNode(blk);
          } catch (_e) {
            return false;
          }
        });
        if (hitBlocks.length) return hitBlocks;
        const single = findEnclosingBlockLine(range.startContainer, editorEl);
        if (single) return [single];
      }
      return allBlocks.length ? [allBlocks[0]] : [];
    }

    function unwrapListItemsToBlocks(liNodes, replacementTag) {
      const out = [];
      const byList = new Map();
      liNodes.forEach((li) => {
        const parent = li.parentNode;
        if (!parent || (parent.tagName !== "UL" && parent.tagName !== "OL")) return;
        if (!byList.has(parent)) byList.set(parent, []);
        byList.get(parent).push(li);
      });

      byList.forEach((selectedLis, listEl) => {
        const parentRoot = listEl.parentNode;
        if (!parentRoot) return;
        const listTag = listEl.tagName.toLowerCase();
        const allLis = Array.from(listEl.children).filter((c) => c.tagName === "LI");
        const selectedSet = new Set(selectedLis);

        let curList = null;
        const frag = document.createDocumentFragment();
        allLis.forEach((li) => {
          if (selectedSet.has(li)) {
            curList = null;
            const meta = getBlockNodeMeta(li);
            meta.listType = "";
            if (replacementTag === "blockquote") meta.isQuote = true;
            const newBlk = document.createElement(replacementTag || "div");
            while (li.firstChild) newBlk.appendChild(li.firstChild);
            if (!newBlk.childNodes.length) newBlk.innerHTML = "<br>";
            const dir = li.getAttribute("dir") || "ltr";
            newBlk.setAttribute("dir", dir);
            applyBlockVisualMeta(newBlk, meta, dir, true);
            frag.appendChild(newBlk);
            out.push(newBlk);
          } else {
            if (!curList) {
              curList = document.createElement(listTag);
              curList.className = listEl.className || `ct-list ct-list-${listTag}`;
              frag.appendChild(curList);
            }
            curList.appendChild(li);
          }
        });
        parentRoot.replaceChild(frag, listEl);
      });
      return out;
    }

    function mergeAdjacentLists(editorEl) {
      if (!editorEl) return;
      let cur = editorEl.firstElementChild;
      while (cur && cur.nextElementSibling) {
        const next = cur.nextElementSibling;
        if ((cur.tagName === "UL" || cur.tagName === "OL") && cur.tagName === next.tagName) {
          while (next.firstChild) {
            cur.appendChild(next.firstChild);
          }
          next.remove();
        } else {
          cur = next;
        }
      }
    }

    function toggleListType(targetListType) {
      const cleanTag = targetListType === "ol" ? "ol" : "ul";
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      if (editorEl.dataset.multiline !== "true") return;
      flushEditorHistory(editorEl);

      const offsets = getSelectionOffsets(editorEl);
      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const blocks = getActiveBlocksForCommand(editorEl, targetInfo.range);
        if (!blocks.length) return;

        const allAlreadyTarget = blocks.every((blk) => getBlockNodeMeta(blk).listType === cleanTag);
        if (allAlreadyTarget) {
          unwrapListItemsToBlocks(blocks, "div");
        } else {
          blocks.forEach((blk) => {
            const meta = getBlockNodeMeta(blk);
            if (meta.listType === cleanTag) return;

            if (blk.tagName === "LI" && blk.parentNode && (blk.parentNode.tagName === "UL" || blk.parentNode.tagName === "OL")) {
              const parentList = blk.parentNode;
              const origTag = parentList.tagName.toLowerCase();
              const allLis = Array.from(parentList.children).filter((c) => c.tagName === "LI");
              const idx = allLis.indexOf(blk);

              const newList = document.createElement(cleanTag);
              newList.className = `ct-list ct-list-${cleanTag}`;
              newList.appendChild(blk);

              if (allLis.length === 1) {
                parentList.parentNode.replaceChild(newList, parentList);
              } else if (idx === 0) {
                parentList.parentNode.insertBefore(newList, parentList);
              } else if (idx === allLis.length - 1) {
                if (parentList.nextSibling) {
                  parentList.parentNode.insertBefore(newList, parentList.nextSibling);
                } else {
                  parentList.parentNode.appendChild(newList);
                }
              } else {
                const afterList = document.createElement(origTag);
                afterList.className = `ct-list ct-list-${origTag}`;
                for (let k = idx + 1; k < allLis.length; k += 1) {
                  afterList.appendChild(allLis[k]);
                }
                if (parentList.nextSibling) {
                  parentList.parentNode.insertBefore(afterList, parentList.nextSibling);
                } else {
                  parentList.parentNode.appendChild(afterList);
                }
                parentList.parentNode.insertBefore(newList, afterList);
              }
              meta.listType = cleanTag;
              meta.isQuote = false;
              applyBlockVisualMeta(blk, meta, blk.getAttribute("dir") || "ltr", true);
              return;
            }

            // Konversi DIV / P / BLOCKQUOTE menjadi <ul>/<ol><li>
            const newList = document.createElement(cleanTag);
            newList.className = `ct-list ct-list-${cleanTag}`;
            const li = document.createElement("li");
            while (blk.firstChild) li.appendChild(blk.firstChild);
            if (!li.childNodes.length) li.innerHTML = "<br>";
            const dir = blk.getAttribute("dir") || "ltr";
            li.setAttribute("dir", dir);
            meta.listType = cleanTag;
            meta.isQuote = false;
            applyBlockVisualMeta(li, meta, dir, true);
            newList.appendChild(li);
            blk.parentNode.replaceChild(newList, blk);
          });
          mergeAdjacentLists(editorEl);
        }

        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      positionFloatingFontBar(editorEl);
    }

    function applyBlockAlignment(alignVal) {
      const cleanAlign = ["left", "center", "right", "justify"].includes(alignVal) ? alignVal : "left";
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      const offsets = getSelectionOffsets(editorEl);
      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const blocks = getActiveBlocksForCommand(editorEl, targetInfo.range);
        blocks.forEach((blk) => {
          const meta = getBlockNodeMeta(blk);
          meta.align = cleanAlign;
          const dir = blk.getAttribute("dir") || "ltr";
          applyBlockVisualMeta(blk, meta, dir, editorEl.dataset.multiline === "true");
        });
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      positionFloatingFontBar(editorEl);
    }

    function toggleBlockquote() {
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      const offsets = getSelectionOffsets(editorEl);
      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const blocks = getActiveBlocksForCommand(editorEl, targetInfo.range);
        const allAreQuotes = blocks.length > 0 && blocks.every((blk) => getBlockNodeMeta(blk).isQuote);
        const nextIsQuote = !allAreQuotes;

        if (editorEl.dataset.multiline !== "true") {
          const meta = getBlockNodeMeta(editorEl);
          meta.isQuote = nextIsQuote;
          applyBlockVisualMeta(editorEl, meta, editorEl.getAttribute("dir") || "ltr", false);
        } else {
          const listItems = blocks.filter(
            (blk) => blk.tagName === "LI" && blk.parentNode && (blk.parentNode.tagName === "UL" || blk.parentNode.tagName === "OL")
          );
          if (listItems.length && nextIsQuote) {
            unwrapListItemsToBlocks(listItems, "blockquote");
          }

          blocks.forEach((blk) => {
            if (blk.tagName === "LI") return;
            const meta = getBlockNodeMeta(blk);
            meta.isQuote = nextIsQuote;
            const targetTag = nextIsQuote ? "BLOCKQUOTE" : "DIV";
            if (blk.tagName !== targetTag) {
              const replacement = document.createElement(targetTag.toLowerCase());
              while (blk.firstChild) {
                replacement.appendChild(blk.firstChild);
              }
              const dir = blk.getAttribute("dir") || "ltr";
              replacement.setAttribute("dir", dir);
              applyBlockVisualMeta(replacement, meta, dir, true);
              blk.parentNode.replaceChild(replacement, blk);
            } else {
              const dir = blk.getAttribute("dir") || "ltr";
              applyBlockVisualMeta(blk, meta, dir, true);
            }
          });
        }

        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      positionFloatingFontBar(editorEl);
    }

    function setBlockIndent(nextLevel, nextMode, options) {
      const opts = options || {};
      const returnFocus = opts.returnFocus !== false;
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      const offsets = getSelectionOffsets(editorEl);
      studio.suppressEditorTrack = true;
      try {
        if (returnFocus) {
          editorEl.focus({ preventScroll: true });
        }
        const blocks = getActiveBlocksForCommand(editorEl, targetInfo.range);
        blocks.forEach((blk) => {
          const meta = getBlockNodeMeta(blk);
          if (nextLevel !== undefined && nextLevel !== null) {
            meta.indent = App.normalizeIndentLevel(nextLevel);
          }
          if (nextMode !== undefined && nextMode !== null) {
            meta.indentMode = App.normalizeIndentMode(nextMode);
          }
          const dir = blk.getAttribute("dir") || "ltr";
          applyBlockVisualMeta(blk, meta, dir, editorEl.dataset.multiline === "true");
        });
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        if (returnFocus) {
          restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
        }
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      if (returnFocus) {
        positionFloatingFontBar(editorEl);
      }
    }

    function adjustBlockIndent(delta) {
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;
      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      const offsets = getSelectionOffsets(editorEl);
      const selectedMode = els.indentModeSelect ? App.normalizeIndentMode(els.indentModeSelect.value) : null;
      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const blocks = getActiveBlocksForCommand(editorEl, targetInfo.range);
        blocks.forEach((blk) => {
          const meta = getBlockNodeMeta(blk);
          const next = Math.round(((meta.indent || 0) + delta) * 100) / 100;
          meta.indent = Math.max(0, Math.min(4, next));
          if (selectedMode && meta.indent > 0 && meta.indentMode === "all" && selectedMode !== "all") {
            meta.indentMode = selectedMode;
          }
          const dir = blk.getAttribute("dir") || "ltr";
          applyBlockVisualMeta(blk, meta, dir, editorEl.dataset.multiline === "true");
        });
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
        restoreSelectionOffsets(editorEl, offsets.start, offsets.end);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      positionFloatingFontBar(editorEl);
    }

    function openFloatingColorRow() {
      if (!els.floatingColorRow) return;
      if (els.floatingLinkRow) {
        els.floatingLinkRow.classList.add("hidden");
        els.floatingLinkRow.classList.remove("flex");
      }
      els.floatingColorRow.classList.remove("hidden");
      els.floatingColorRow.classList.add("flex");
      if (els.btnFormatColor) els.btnFormatColor.setAttribute("aria-expanded", "true");
      if (studio.lastTextControl && studio.lastTextControl.el) {
        positionFloatingFontBar(studio.lastTextControl.el);
      }
    }

    function closeFloatingColorRow(refocusEditor) {
      if (els.floatingColorRow) {
        els.floatingColorRow.classList.add("hidden");
        els.floatingColorRow.classList.remove("flex");
      }
      if (els.btnFormatColor) els.btnFormatColor.setAttribute("aria-expanded", "false");
      if (refocusEditor && studio.lastTextControl && studio.lastTextControl.el) {
        const editorEl = studio.lastTextControl.el;
        studio.suppressEditorTrack = true;
        try {
          editorEl.focus({ preventScroll: true });
          const sel = window.getSelection();
          if (sel && studio.lastTextControl.range && editorEl.contains(studio.lastTextControl.range.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(studio.lastTextControl.range);
          }
        } finally {
          studio.suppressEditorTrack = false;
        }
        syncFloatingBarControlsFromEditor(editorEl, studio.lastTextControl.range);
        positionFloatingFontBar(editorEl);
      }
    }

    function applyFloatingColor(rawColor, options) {
      const opts = options || {};
      const returnFocus = opts.returnFocus !== false;
      const safeColor = rawColor ? App.sanitizeRichColor(rawColor) : "";
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;

      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);

      let range = null;
      const liveSel = window.getSelection();
      if (liveSel && liveSel.rangeCount > 0) {
        const lr = liveSel.getRangeAt(0);
        if (editorEl.contains(lr.commonAncestorContainer)) {
          range = lr.cloneRange();
        }
      }
      if (!range && targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)) {
        range = targetInfo.range.cloneRange();
      }
      if (!range) {
        range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
      }

      trimTrailingZeroOffsetBlockBoundary(range, editorEl);

      studio.suppressEditorTrack = true;
      try {
        if (returnFocus) {
          editorEl.focus({ preventScroll: true });
        }

        if (!safeColor) {
          if (!range.collapsed) {
            const startBlock = findEnclosingBlockLine(range.startContainer, editorEl);
            const endBlock = findEnclosingBlockLine(range.endContainer, editorEl);
            if (editorEl.dataset.multiline === "true" && startBlock && endBlock && startBlock !== endBlock) {
              const allBlocks = getDirectLineBlocks(editorEl);
              allBlocks.forEach((blk) => {
                try {
                  if (range.intersectsNode(blk)) stripNestedColorSpans(blk);
                } catch (_e) {}
              });
            } else {
              const enclosing = findEnclosingColorSpan(range.startContainer, editorEl);
              const enclosingEnd = findEnclosingColorSpan(range.endContainer, editorEl);
              if (
                enclosing &&
                enclosing === enclosingEnd &&
                range.toString().replace(/\u200B/g, "") === String(enclosing.textContent || "").replace(/\u200B/g, "")
              ) {
                const fc = enclosing.firstChild;
                const lc = enclosing.lastChild;
                unwrapDomNode(enclosing);
                if (fc && lc) {
                  const nr = document.createRange();
                  nr.setStartBefore(fc);
                  nr.setEndAfter(lc);
                  if (liveSel && returnFocus) {
                    liveSel.removeAllRanges();
                    liveSel.addRange(nr);
                  }
                  studio.lastTextControl = { el: editorEl, range: nr.cloneRange() };
                }
              } else if (enclosing && enclosing === enclosingEnd && enclosing.parentNode) {
                const postRange = document.createRange();
                postRange.setStart(range.endContainer, range.endOffset);
                postRange.setEnd(enclosing, enclosing.childNodes.length);
                const postFrag = postRange.extractContents();
                const midFrag = range.extractContents();
                stripNestedColorSpans(midFrag);

                const ms = midFrag.firstChild;
                const me = midFrag.lastChild;
                const parent = enclosing.parentNode;
                const nextSib = enclosing.nextSibling;

                if (ms) {
                  parent.insertBefore(midFrag, nextSib);
                }
                if (String(postFrag.textContent || "").replace(/\u200B/g, "") || postFrag.querySelector("*")) {
                  const afterSpan = enclosing.cloneNode(false);
                  afterSpan.appendChild(postFrag);
                  parent.insertBefore(afterSpan, nextSib);
                }
                if (!String(enclosing.textContent || "").replace(/\u200B/g, "") && !enclosing.querySelector("br, *")) {
                  parent.removeChild(enclosing);
                }
                if (ms && me) {
                  const nr = document.createRange();
                  nr.setStartBefore(ms);
                  nr.setEndAfter(me);
                  if (liveSel && returnFocus) {
                    liveSel.removeAllRanges();
                    liveSel.addRange(nr);
                  }
                  studio.lastTextControl = { el: editorEl, range: nr.cloneRange() };
                }
              } else {
                const frag = range.extractContents();
                stripNestedColorSpans(frag);
                const ms = frag.firstChild;
                const me = frag.lastChild;
                range.insertNode(frag);
                if (ms && me) {
                  const nr = document.createRange();
                  nr.setStartBefore(ms);
                  nr.setEndAfter(me);
                  if (liveSel && returnFocus) {
                    liveSel.removeAllRanges();
                    liveSel.addRange(nr);
                  }
                  studio.lastTextControl = { el: editorEl, range: nr.cloneRange() };
                }
              }
            }
          } else {
            const enclosing = findEnclosingColorSpan(range.startContainer, editorEl);
            if (enclosing) {
              const fc = enclosing.firstChild;
              unwrapDomNode(enclosing);
              if (fc) {
                placeCaretInsideEnd(fc.nodeType === Node.TEXT_NODE ? fc.parentNode || editorEl : fc, editorEl, returnFocus);
              }
            } else if (editorEl.dataset.multiline !== "true") {
              stripNestedColorSpans(editorEl);
            }
          }
        } else {
          const wrapSpanWithColor = (targetParent, textContainer) => {
            const span = document.createElement("span");
            span.dataset.rtColor = safeColor;
            span.style.color = safeColor;
            if (textContainer) {
              span.appendChild(textContainer);
              stripNestedColorSpans(span);
            }
            return span;
          };

          if (!range.collapsed) {
            const startBlock = findEnclosingBlockLine(range.startContainer, editorEl);
            const endBlock = findEnclosingBlockLine(range.endContainer, editorEl);

            if (editorEl.dataset.multiline === "true" && startBlock && endBlock && startBlock !== endBlock) {
              const blocks = getDirectLineBlocks(editorEl);
              let firstColSpan = null;
              let lastColSpan = null;
              blocks.forEach((blk) => {
                let hits = false;
                try {
                  hits = range.intersectsNode(blk);
                } catch (_e) {
                  hits = false;
                }
                if (!hits) return;
                const blkTxt = String(blk.textContent || "").replace(/\u200B/g, "").trim();
                if (!blkTxt) return;
                const children = Array.from(blk.childNodes);
                const trailingBrs = [];
                while (
                  children.length &&
                  children[children.length - 1].nodeType === Node.ELEMENT_NODE &&
                  children[children.length - 1].tagName === "BR"
                ) {
                  trailingBrs.unshift(children.pop());
                }
                const span = document.createElement("span");
                span.dataset.rtColor = safeColor;
                span.style.color = safeColor;
                children.forEach((c) => span.appendChild(c));
                stripNestedColorSpans(span);
                blk.appendChild(span);
                trailingBrs.forEach((br) => blk.appendChild(br));
                if (!firstColSpan) firstColSpan = span;
                lastColSpan = span;
              });
              if (firstColSpan && lastColSpan) {
                const rAll = document.createRange();
                rAll.setStartBefore(firstColSpan);
                rAll.setEndAfter(lastColSpan);
                if (returnFocus && liveSel) {
                  liveSel.removeAllRanges();
                  liveSel.addRange(rAll);
                }
                studio.lastTextControl = { el: editorEl, range: rAll.cloneRange() };
              }
            } else {
              const startColor = findEnclosingColorSpan(range.startContainer, editorEl);
              const endColor = findEnclosingColorSpan(range.endContainer, editorEl);
              if (
                startColor &&
                startColor === endColor &&
                range.toString().replace(/\u200B/g, "") === String(startColor.textContent || "").replace(/\u200B/g, "")
              ) {
                startColor.dataset.rtColor = safeColor;
                startColor.style.color = safeColor;
                selectNodeContents(startColor, editorEl, returnFocus);
              } else {
                const frag = range.extractContents();
                stripNestedColorSpans(frag);
                const span = wrapSpanWithColor(null, frag);
                range.insertNode(span);
                selectNodeContents(span, editorEl, returnFocus);
              }
            }
          } else {
            const enclosing = findEnclosingColorSpan(range.startContainer, editorEl);
            if (enclosing) {
              enclosing.dataset.rtColor = safeColor;
              enclosing.style.color = safeColor;
              placeCaretInsideEnd(enclosing, editorEl, returnFocus);
            } else if (editorEl.dataset.multiline !== "true") {
              stripNestedColorSpans(editorEl);
              const span = document.createElement("span");
              span.dataset.rtColor = safeColor;
              span.style.color = safeColor;
              if (!String(editorEl.textContent || "").replace(/\u200B/g, "").trim()) {
                editorEl.innerHTML = "";
                span.textContent = "\u200B";
                editorEl.appendChild(span);
                placeCaretInsideEnd(span, editorEl, returnFocus);
              } else {
                while (editorEl.firstChild) span.appendChild(editorEl.firstChild);
                editorEl.appendChild(span);
                selectNodeContents(span, editorEl, returnFocus);
              }
            } else {
              const span = document.createElement("span");
              span.dataset.rtColor = safeColor;
              span.style.color = safeColor;
              span.textContent = "\u200B";
              range.insertNode(span);
              placeCaretInsideEnd(span, editorEl, returnFocus);
            }
          }
        }

        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      syncFloatingBarControlsFromEditor(
        editorEl,
        studio.lastTextControl ? studio.lastTextControl.range : null
      );
      if (returnFocus) {
        positionFloatingFontBar(editorEl);
      }
    }

    function toggleArticleDropCap() {
      const dropCapInput = document.getElementById("studio-dropcap-input");
      if (!dropCapInput) return;
      dropCapInput.checked = !dropCapInput.checked;
      syncEditorDropCapPreview();

      const editorEl =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl.el
          : null;
      if (editorEl) {
        syncFloatingBarControlsFromEditor(
          editorEl,
          studio.lastTextControl ? studio.lastTextControl.range : null
        );
        positionFloatingFontBar(editorEl);
      } else if (els.btnToggleDropCap) {
        setFormatButtonActive(els.btnToggleDropCap, dropCapInput.checked);
      }
      renderLivePreview();
    }

    function openFloatingLinkRow() {
      if (!els.floatingLinkRow || !els.textLinkInput) return;
      closeFloatingColorRow(false);
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;

      const editorEl = targetInfo.el;
      const range = targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)
        ? targetInfo.range
        : null;
      const anchor = range ? findEnclosingTag(range.startContainer, editorEl, ["A"]) : null;

      els.textLinkInput.classList.remove("border-red-500");
      els.textLinkInput.value = anchor ? anchor.getAttribute("href") || "" : "";
      if (els.btnRemoveTextLink) {
        els.btnRemoveTextLink.classList.toggle("hidden", !anchor);
      }

      els.floatingLinkRow.classList.remove("hidden");
      els.floatingLinkRow.classList.add("flex");
      positionFloatingFontBar(editorEl);
      els.textLinkInput.focus();
      els.textLinkInput.select();
    }

    function closeFloatingLinkRow(refocusEditor) {
      if (els.floatingLinkRow) {
        els.floatingLinkRow.classList.add("hidden");
        els.floatingLinkRow.classList.remove("flex");
      }
      if (els.textLinkInput) {
        els.textLinkInput.classList.remove("border-red-500");
      }
      if (refocusEditor && studio.lastTextControl && studio.lastTextControl.el) {
        const editorEl = studio.lastTextControl.el;
        studio.suppressEditorTrack = true;
        try {
          editorEl.focus({ preventScroll: true });
          const sel = window.getSelection();
          if (sel && studio.lastTextControl.range && editorEl.contains(studio.lastTextControl.range.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(studio.lastTextControl.range);
          }
        } finally {
          studio.suppressEditorTrack = false;
        }
        syncFloatingBarControlsFromEditor(editorEl, studio.lastTextControl.range);
        positionFloatingFontBar(editorEl);
      }
    }

    function applyFloatingLink() {
      if (!els.textLinkInput) return;
      const safeUrl = App.sanitizeRichLinkUrl(els.textLinkInput.value);
      if (!safeUrl) {
        els.textLinkInput.classList.add("border-red-500");
        els.textLinkInput.focus();
        return;
      }

      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;

      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);
      let range =
        targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)
          ? targetInfo.range.cloneRange()
          : null;
      if (!range) {
        range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
      }

      trimTrailingZeroOffsetBlockBoundary(range, editorEl);

      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const existingAnchor = findEnclosingTag(range.startContainer, editorEl, ["A"]);

        if (existingAnchor) {
          existingAnchor.setAttribute("href", safeUrl);
          existingAnchor.dataset.rtLink = "true";
          existingAnchor.className = "ct-rich-link underline theme-text-accent";
          selectNodeContents(existingAnchor, editorEl, true);
        } else if (!range.collapsed) {
          const frag = range.extractContents();
          Array.from(frag.querySelectorAll("a")).forEach((a) => unwrapDomNode(a));
          const anchor = document.createElement("a");
          anchor.setAttribute("href", safeUrl);
          anchor.dataset.rtLink = "true";
          anchor.className = "ct-rich-link underline theme-text-accent";
          anchor.appendChild(frag);
          range.insertNode(anchor);
          selectNodeContents(anchor, editorEl, true);
        } else {
          const anchor = document.createElement("a");
          anchor.setAttribute("href", safeUrl);
          anchor.dataset.rtLink = "true";
          anchor.className = "ct-rich-link underline theme-text-accent";
          anchor.textContent = safeUrl;
          range.insertNode(anchor);
          selectNodeContents(anchor, editorEl, true);
        }

        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      closeFloatingLinkRow(true);
    }

    function removeFloatingLink() {
      const targetInfo =
        studio.lastTextControl && studio.lastTextControl.el && document.body.contains(studio.lastTextControl.el)
          ? studio.lastTextControl
          : null;
      if (!targetInfo) return;

      const editorEl = targetInfo.el;
      flushEditorHistory(editorEl);
      const range =
        targetInfo.range && editorEl.contains(targetInfo.range.commonAncestorContainer)
          ? targetInfo.range.cloneRange()
          : null;
      if (!range) return;

      studio.suppressEditorTrack = true;
      try {
        editorEl.focus({ preventScroll: true });
        const existingAnchor = findEnclosingTag(range.startContainer, editorEl, ["A"]);
        if (existingAnchor) {
          const firstChild = existingAnchor.firstChild;
          const lastChild = existingAnchor.lastChild;
          unwrapDomNode(existingAnchor);
          if (firstChild && lastChild) {
            const newR = document.createRange();
            newR.setStartBefore(firstChild);
            newR.setEndAfter(lastChild);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(newR);
            }
            studio.lastTextControl = { el: editorEl, range: newR.cloneRange() };
          }
        } else if (!range.collapsed) {
          Array.from(editorEl.querySelectorAll("a")).forEach((a) => {
            try {
              if (range.intersectsNode(a)) unwrapDomNode(a);
            } catch (_e) {}
          });
        }
        updateEditorLineDirections(editorEl);
        syncEditorToBackingField(editorEl, true);
      } finally {
        studio.suppressEditorTrack = false;
      }

      commitEditorHistory(editorEl);
      closeFloatingLinkRow(true);
    }

    if (els.floatingFontSelect) {
      els.floatingFontSelect.addEventListener("change", () => {
        applyFloatingStyle("style", { returnFocus: true });
      });
    }

    if (els.floatingSizePreset) {
      els.floatingSizePreset.addEventListener("change", () => {
        if (els.floatingSizeInput) {
          els.floatingSizeInput.value = els.floatingSizePreset.value;
        }
        applyFloatingStyle("style", { returnFocus: true });
      });
    }

    if (els.floatingSizeInput) {
      els.floatingSizeInput.addEventListener("input", () => {
        const cleaned = els.floatingSizeInput.value.replace(/[^0-9]/g, "").slice(0, 2);
        if (els.floatingSizeInput.value !== cleaned) {
          els.floatingSizeInput.value = cleaned;
        }
      });
      els.floatingSizeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyFloatingStyle("style", { returnFocus: true });
        }
      });
      els.floatingSizeInput.addEventListener("change", () => {
        applyFloatingStyle("style", { returnFocus: false });
      });
    }

    if (els.btnEditorUndo) {
      els.btnEditorUndo.addEventListener("click", () => performEditorUndo());
    }
    if (els.btnEditorRedo) {
      els.btnEditorRedo.addEventListener("click", () => performEditorRedo());
    }

    if (els.btnFormatBold) {
      els.btnFormatBold.addEventListener("click", () => toggleInlineFormat("bold"));
    }
    if (els.btnFormatItalic) {
      els.btnFormatItalic.addEventListener("click", () => toggleInlineFormat("italic"));
    }
    if (els.btnFormatUnderline) {
      els.btnFormatUnderline.addEventListener("click", () => toggleInlineFormat("underline"));
    }
    if (els.btnFormatStrike) {
      els.btnFormatStrike.addEventListener("click", () => toggleInlineFormat("strikeThrough"));
    }
    if (els.btnFormatColor) {
      els.btnFormatColor.addEventListener("click", () => {
        if (els.floatingColorRow && !els.floatingColorRow.classList.contains("hidden")) {
          closeFloatingColorRow(true);
        } else {
          openFloatingColorRow();
        }
      });
    }
    if (els.colorSwatches && els.colorSwatches.length) {
      els.colorSwatches.forEach((btn) => {
        btn.addEventListener("click", () => {
          const col = btn.dataset.pickColor;
          if (els.textColorPicker && col) els.textColorPicker.value = col;
          applyFloatingColor(col, { returnFocus: true });
          closeFloatingColorRow(true);
        });
      });
    }
    if (els.textColorPicker) {
      els.textColorPicker.addEventListener("input", () => {
        applyFloatingColor(els.textColorPicker.value, { returnFocus: false });
      });
      els.textColorPicker.addEventListener("change", () => {
        applyFloatingColor(els.textColorPicker.value, { returnFocus: true });
      });
    }
    if (els.btnClearTextColor) {
      els.btnClearTextColor.addEventListener("click", () => {
        applyFloatingColor("", { returnFocus: true });
        closeFloatingColorRow(true);
      });
    }
    if (els.btnCloseColorRow) {
      els.btnCloseColorRow.addEventListener("click", () => closeFloatingColorRow(true));
    }
    if (els.btnFormatLink) {
      els.btnFormatLink.addEventListener("click", () => {
        if (els.floatingLinkRow && !els.floatingLinkRow.classList.contains("hidden")) {
          closeFloatingLinkRow(true);
        } else {
          openFloatingLinkRow();
        }
      });
    }
    if (els.alignButtons && els.alignButtons.length) {
      els.alignButtons.forEach((btn) => {
        btn.addEventListener("click", () => applyBlockAlignment(btn.dataset.formatAlign));
      });
    }
    if (els.btnFormatUl) {
      els.btnFormatUl.addEventListener("click", () => toggleListType("ul"));
    }
    if (els.btnFormatOl) {
      els.btnFormatOl.addEventListener("click", () => toggleListType("ol"));
    }
    if (els.btnFormatQuote) {
      els.btnFormatQuote.addEventListener("click", toggleBlockquote);
    }
    if (els.indentModeSelect) {
      els.indentModeSelect.addEventListener("change", () => {
        const mode = App.normalizeIndentMode(els.indentModeSelect.value);
        setBlockIndent(undefined, mode, { returnFocus: true });
      });
    }
    if (els.btnFormatOutdent) {
      els.btnFormatOutdent.addEventListener("click", () => adjustBlockIndent(-0.5));
    }
    if (els.btnFormatIndent) {
      els.btnFormatIndent.addEventListener("click", () => adjustBlockIndent(0.5));
    }
    if (els.indentPreset) {
      els.indentPreset.addEventListener("change", () => {
        const val = els.indentPreset.value;
        if (els.indentInput) els.indentInput.value = val;
        const mode = els.indentModeSelect ? els.indentModeSelect.value : "all";
        setBlockIndent(val, mode, { returnFocus: true });
      });
    }
    if (els.indentInput) {
      els.indentInput.addEventListener("input", () => {
        const cleaned = els.indentInput.value
          .replace(",", ".")
          .replace(/[^0-9.]/g, "")
          .replace(/(\..*)\./g, "$1")
          .slice(0, 4);
        if (els.indentInput.value !== cleaned) {
          els.indentInput.value = cleaned;
        }
      });
      els.indentInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const lv = App.normalizeIndentLevel(els.indentInput.value);
          els.indentInput.value = String(lv);
          const mode = els.indentModeSelect ? els.indentModeSelect.value : "all";
          setBlockIndent(lv, mode, { returnFocus: true });
        }
      });
      els.indentInput.addEventListener("change", () => {
        const lv = App.normalizeIndentLevel(els.indentInput.value);
        els.indentInput.value = String(lv);
        const mode = els.indentModeSelect ? els.indentModeSelect.value : "all";
        setBlockIndent(lv, mode, { returnFocus: false });
      });
    }
    if (els.btnToggleDropCap) {
      els.btnToggleDropCap.addEventListener("click", toggleArticleDropCap);
    }
    if (els.btnApplyTextLink) {
      els.btnApplyTextLink.addEventListener("click", applyFloatingLink);
    }
    if (els.btnRemoveTextLink) {
      els.btnRemoveTextLink.addEventListener("click", removeFloatingLink);
    }
    if (els.btnCancelTextLink) {
      els.btnCancelTextLink.addEventListener("click", () => closeFloatingLinkRow(true));
    }
    if (els.textLinkInput) {
      els.textLinkInput.addEventListener("input", () => {
        els.textLinkInput.classList.remove("border-red-500");
      });
      els.textLinkInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyFloatingLink();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeFloatingLinkRow(true);
        }
      });
    }

    if (els.btnApplyArabBlock) {
      els.btnApplyArabBlock.addEventListener("click", () => {
        applyFloatingStyle("arab-block", { returnFocus: true });
      });
    }

    if (els.btnClearTextFont) {
      els.btnClearTextFont.addEventListener("click", () => {
        closeFloatingColorRow(false);
        closeFloatingLinkRow(false);
        applyFloatingStyle("clear", { returnFocus: true });
      });
    }

    els.studioPanelBody.addEventListener("click", async (e) => {

      // Munculkan popup kalender langsung saat kolom Tanggal diklik
      const dateInput = e.target.closest('input[data-date-picker="true"]');
      if (dateInput) {
        if (typeof dateInput.showPicker === "function") {
          try {
            dateInput.showPicker();
          } catch (_err) {}
        }
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
                nama,
                sumber: "r2",
                family: `CTCustom_${id.replace(/[^a-z0-9]/gi, "_")}`,
                url: App.resolveR2FontUrl(rawVal),
                kategori,
                builtin: false,
              }
            : {
                id,
                nama,
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

      // Kelola Kategori Bidang Ilmu (Tambah / Geser / Hapus)
      if (e.target.closest("#btn-add-content-category")) {
        const nameEl = document.getElementById("cfg-new-cat-name");
        const descEl = document.getElementById("cfg-new-cat-desc");
        const statusEl = document.getElementById("cfg-cat-status");
        const nama = nameEl ? nameEl.value.trim() : "";
        const deskripsi = descEl ? descEl.value.trim() : "";

        if (!nama) {
          if (statusEl) {
            statusEl.className = "text-[11px] text-red-700";
            statusEl.textContent = "Isi nama kategori bidang ilmu terlebih dahulu.";
          }
          return;
        }

        const currentList = App.getCategoryCollection(studio.draftData, false);
        const existingIdx = currentList.findIndex((c) => c.nama.toLowerCase() === nama.toLowerCase());
        if (existingIdx >= 0) {
          if (deskripsi) currentList[existingIdx].deskripsi = deskripsi;
          studio.draftData.tampilan.kategoriMateri = currentList;
        } else {
          studio.draftData.tampilan.kategoriMateri = [...currentList, { nama, deskripsi }];
        }

        saveDraftToLocal();
        renderStudioSidebar();
        renderLivePreview();

        const refreshed = document.getElementById("cfg-cat-status");
        if (refreshed) {
          refreshed.className = "text-[11px] text-emerald-700 font-medium";
          refreshed.textContent = `Kategori "${nama}" berhasil disimpan ke daftar pilihan.`;
        }
        return;
      }

      const moveCatBtn = e.target.closest("[data-move-cat]");
      if (moveCatBtn) {
        const idx = Number(moveCatBtn.dataset.moveCat);
        const dir = Number(moveCatBtn.dataset.dir);
        const arr = [...App.getCategoryCollection(studio.draftData, false)];
        const targetIdx = idx + dir;
        if (idx >= 0 && targetIdx >= 0 && targetIdx < arr.length) {
          [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
          studio.draftData.tampilan.kategoriMateri = arr;
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
        return;
      }

      const removeCatBtn = e.target.closest("[data-remove-cat]");
      if (removeCatBtn) {
        const idx = Number(removeCatBtn.dataset.removeCat);
        const arr = [...App.getCategoryCollection(studio.draftData, false)];
        if (idx >= 0 && idx < arr.length) {
          arr.splice(idx, 1);
          studio.draftData.tampilan.kategoriMateri = arr;
          saveDraftToLocal();
          renderStudioSidebar();
          renderLivePreview();
        }
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
        studio.previewCategory = "all";
        studio.contentCategoryFilter = "all";
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
      syncAllRichEditorsIn(e.target);

      const errEl = document.getElementById("studio-item-form-error");
      if (errEl) {
        errEl.classList.add("hidden");
        errEl.textContent = "";
      }

      const requiredEditors = Array.from(e.target.querySelectorAll('[data-editor-required="true"]'));
      for (const ed of requiredEditors) {
        const backing = ed.dataset.backingId ? document.getElementById(ed.dataset.backingId) : null;
        const plain = App.stripRichTags(backing ? backing.value : ed.textContent || "").trim();
        if (!plain) {
          const label = ed.dataset.fieldLabel || "Kolom";
          if (errEl) {
            errEl.textContent = `Mohon isi kolom "${label}" terlebih dahulu.`;
            errEl.classList.remove("hidden");
          }
          ed.focus();
          ed.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }

      const formData = new FormData(e.target);
      const type = studio.contentType;
      const isNew = studio.editingItemId === "new";
      const list = studio.draftData[type] || [];

      const id = isNew ? `${type}-${Date.now()}` : studio.editingItemId;
      const newItem = extractContentItemFromForm(type, formData, id);

      if (newItem.kategori) {
        const masterCats = App.getCategoryCollection(studio.draftData, false);
        if (!masterCats.some((c) => c.nama.toLowerCase() === newItem.kategori.toLowerCase())) {
          studio.draftData.tampilan.kategoriMateri = [
            ...masterCats,
            { nama: newItem.kategori, deskripsi: "" },
          ];
        }
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
