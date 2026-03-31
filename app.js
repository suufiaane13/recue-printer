const form = document.getElementById("receipt-form");
const phoneInput = document.getElementById("phone");
const priceInput = document.getElementById("price");
const paidInput = document.getElementById("paid");
const remainingInput = document.getElementById("remaining");
const receiptDateInput = document.getElementById("receipt-date");

const previewPhone = document.getElementById("preview-phone");
const previewPrice = document.getElementById("preview-price");
const previewPaid = document.getElementById("preview-paid");
const previewRemaining = document.getElementById("preview-remaining");
const previewSignature = document.getElementById("preview-signature");
const previewSignatureEmpty = document.getElementById("preview-signature-empty");
const receiptPreview = document.getElementById("receipt-preview");
const previewReceiptNo = document.getElementById("preview-receipt-no");
const previewDate = document.getElementById("preview-date");
const heroLogo = document.querySelector(".hero-logo");

const clearSignatureButton = document.getElementById("clear-signature");
const signatureEditToggleButton = document.getElementById("signature-edit-toggle");
const downloadPdfButton = document.getElementById("download-pdf");
const signatureBox = document.getElementById("signature-box");
const signatureStatus = document.getElementById("signature-status");
const signatureCard = document.querySelector(".signature-card");
const signatureHeader = document.querySelector(".signature-header");
const signatureHint = document.querySelector(".signature-card .hint");
const signatureActions = document.querySelector(".signature-actions");
const appModal = document.getElementById("app-modal");
const appModalMessage = document.getElementById("app-modal-message");
const appModalClose = document.getElementById("app-modal-close");
const appLoader = document.getElementById("app-loader");
const themeToggleButton = document.getElementById("theme-toggle");
const STORAGE_KEY = "receipt-form-state-v1";
const LAST_SIGNATURE_KEY = "receipt-last-signature-v1";
const LAST_SIGNATURE_STROKES_KEY = "receipt-last-signature-strokes-v1";
const THEME_KEY = "receipt-theme-v1";
let lastFocusedElement = null;
let storageEnabled = true;
let cachedLogoDataUrl = "";
let signatureCardResizeObserver = null;
const SIGNATURE_MIN_WIDTH = 1.2;
const SIGNATURE_MAX_WIDTH = 3.2;
const SIGNATURE_TARGET_WIDTH = 840;
const SIGNATURE_TARGET_HEIGHT = 280;
const SIGNATURE_INNER_PADDING = 14;
/** Signature fixe : noir sur blanc (indépendant du thème clair/sombre). */
const SIGNATURE_INK = "rgb(0, 0, 0)";
const SIGNATURE_BG = "rgba(255,255,255,1)";

const signatureCanvas = document.getElementById("signature-canvas");
const signaturePad = new SignaturePad(signatureCanvas, {
  minWidth: SIGNATURE_MIN_WIDTH,
  maxWidth: SIGNATURE_MAX_WIDTH,
  penColor: SIGNATURE_INK,
  backgroundColor: SIGNATURE_BG,
  throttle: 16,
});

let signatureModificationEnabled = true;
/** Signature Pad v4 n’a pas de readOnly : on coupe les événements avec off()/on(). */
let signaturePadListenersDetached = false;

function setSignatureModificationEnabled(enabled) {
  signatureModificationEnabled = enabled;
  if (!enabled) {
    if (!signaturePadListenersDetached) {
      signaturePad.off();
      signaturePadListenersDetached = true;
    }
  } else if (signaturePadListenersDetached) {
    signaturePad.on();
    signaturePadListenersDetached = false;
  }
  signatureBox.classList.toggle("is-read-only", !enabled);
  if (signatureEditToggleButton) {
    signatureEditToggleButton.classList.toggle("is-locked", !enabled);
    signatureEditToggleButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    signatureEditToggleButton.setAttribute(
      "aria-label",
      enabled ? "إيقاف التعديل" : "تفعيل التعديل"
    );
    signatureEditToggleButton.setAttribute(
      "title",
      enabled ? "إيقاف التعديل" : "تفعيل التعديل"
    );
  }
  if (clearSignatureButton) {
    clearSignatureButton.disabled = !enabled;
  }
}

function applySignaturePenScale(rect) {
  const w = rect.width || SIGNATURE_TARGET_WIDTH;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const touchBoost = coarsePointer ? 1.1 : 1;
  const scale =
    Math.min(Math.max(w / SIGNATURE_TARGET_WIDTH, 0.72), 1.5) * touchBoost;
  signaturePad.minWidth = SIGNATURE_MIN_WIDTH * scale;
  signaturePad.maxWidth = SIGNATURE_MAX_WIDTH * scale;
}

const receiptNumber = `RC-${Date.now().toString().slice(-6)}`;

function showModal(message) {
  lastFocusedElement = document.activeElement;
  appModalMessage.textContent = message;
  appModal.classList.add("is-open");
  appModal.setAttribute("aria-hidden", "false");
  appModalClose.focus();
}

function hideModal() {
  if (appModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  appModal.classList.remove("is-open");
  appModal.setAttribute("aria-hidden", "true");
}

function formatMAD(value) {
  return `${Number(value).toFixed(2)} درهم`;
}

function formatNow() {
  const date = new Date();
  const dateParts = new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const day = dateParts.find((part) => part.type === "day")?.value || "";
  const month = dateParts.find((part) => part.type === "month")?.value || "";
  const year = dateParts.find((part) => part.type === "year")?.value || "";
  const hour = timeParts.find((part) => part.type === "hour")?.value || "00";
  const minute =
    timeParts.find((part) => part.type === "minute")?.value || "00";

  return `${day}\u00A0\u00A0${month}\u00A0${year} - ${hour}:${minute}`;
}

function formatSelectedDate(value) {
  if (!value) {
    return formatNow();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatNow();
  }
  const dateParts = new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const day = dateParts.find((part) => part.type === "day")?.value || "";
  const month = dateParts.find((part) => part.type === "month")?.value || "";
  const year = dateParts.find((part) => part.type === "year")?.value || "";
  const hour = timeParts.find((part) => part.type === "hour")?.value || "00";
  const minute =
    timeParts.find((part) => part.type === "minute")?.value || "00";
  return `${day}\u00A0\u00A0${month}\u00A0${year} - ${hour}:${minute}`;
}

function toDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function colorizeStrokes(strokes, color) {
  return (Array.isArray(strokes) ? strokes : []).map((stroke) => ({
    ...stroke,
    color,
  }));
}

function parseRgbString(colorString) {
  const match = String(colorString || "").match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) {
    return [255, 255, 255];
  }
  return [Number(match[0]), Number(match[1]), Number(match[2])];
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function canvasHasInk(sourceBgColor = SIGNATURE_BG) {
  const ctx = signatureCanvas.getContext("2d");
  if (!ctx) {
    return false;
  }
  try {
    const sourceBg = parseRgbString(sourceBgColor);
    const pixels = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha < 10) {
        continue;
      }
      const current = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (colorDistance(current, sourceBg) > 18) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function getAlphaBounds(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 28) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) {
    return null;
  }
  return { minX, minY, maxX, maxY };
}

function recolorSignatureBitmap(inkColor, bgColor, sourceBgColor) {
  const ctx = signatureCanvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
  const data = imageData.data;

  const ink = parseRgbString(inkColor);
  const bg = parseRgbString(bgColor);
  const sourceBg = parseRgbString(sourceBgColor || bgColor);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 10) {
      data[i] = bg[0];
      data[i + 1] = bg[1];
      data[i + 2] = bg[2];
      data[i + 3] = 255;
      continue;
    }
    const current = [data[i], data[i + 1], data[i + 2]];
    const isBackgroundLike = colorDistance(current, sourceBg) <= 20;
    if (isBackgroundLike) {
      data[i] = bg[0];
      data[i + 1] = bg[1];
      data[i + 2] = bg[2];
      data[i + 3] = 255;
    } else {
      data[i] = ink[0];
      data[i + 1] = ink[1];
      data[i + 2] = ink[2];
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function validatePhone(phone) {
  return /^0[5-7]\d{8}$/.test(phone);
}

/** Affichage / PDF : paires de chiffres, ex. 06 66 77 99 88 */
function formatPhoneForDisplay(raw) {
  const s = String(raw || "")
    .trim()
    .replace(/\s/g, "");
  if (!s) {
    return "-";
  }
  if (/^0[5-7]\d{8}$/.test(s)) {
    return s.match(/.{2}/g).join(" ");
  }
  return raw.trim() || "-";
}

function getValidationError() {
  const phone = phoneInput.value.trim();
  const price = toNumber(priceInput.value);
  const paid = toNumber(paidInput.value);
  const receiptDate = receiptDateInput.value.trim();

  if (!phone || !priceInput.value.trim() || !paidInput.value.trim() || !receiptDate) {
    return "يرجى ملء جميع الحقول الإلزامية.";
  }

  if (!validatePhone(phone)) {
    return "رقم الهاتف غير صالح. استعمل صيغة مثل 06xxxxxxxx.";
  }

  if (price <= 0) {
    return "الثمن يجب أن يكون أكبر من 0.";
  }

  if (paid < 0) {
    return "الدفع لا يمكن أن يكون سالبا.";
  }

  if (paid > price) {
    return "الدفع لا يمكن أن يتجاوز الثمن.";
  }

  if (signaturePad.isEmpty() && !canvasHasInk()) {
    return "يرجى إضافة التوقيع الرقمي.";
  }

  return null;
}

function updateRemaining() {
  const previousValue = remainingInput.value;
  const price = toNumber(priceInput.value);
  const paid = toNumber(paidInput.value);
  const remaining = Math.max(price - paid, 0);
  const nextValue = remaining.toFixed(2);
  remainingInput.value = nextValue;
  if (previousValue !== nextValue) {
    remainingInput.classList.remove("is-updated");
    previewRemaining.classList.remove("is-updated");
    void remainingInput.offsetWidth;
    void previewRemaining.offsetWidth;
    remainingInput.classList.add("is-updated");
    previewRemaining.classList.add("is-updated");
  }
}

function updatePreview() {
  const phone = phoneInput.value.trim();
  const price = toNumber(priceInput.value);
  const paid = toNumber(paidInput.value);
  const remaining = toNumber(remainingInput.value);

  previewPhone.textContent = formatPhoneForDisplay(phone);
  previewPrice.textContent = formatMAD(price);
  previewPaid.textContent = formatMAD(paid);
  previewRemaining.textContent = formatMAD(remaining);
  previewReceiptNo.textContent = receiptNumber;
  previewDate.textContent = formatSelectedDate(receiptDateInput.value);

  const hasSignature = !signaturePad.isEmpty() || canvasHasInk();
  if (hasSignature) {
    const signaturePreviewData = getNormalizedSignatureDataUrl();
    previewSignature.src = signaturePreviewData || signaturePad.toDataURL("image/png");
    previewSignature.style.display = "block";
    previewSignatureEmpty.style.display = "none";
    signatureBox.classList.add("is-signed");
    signatureStatus.textContent = "تم حفظ الإمضاء";
    signatureStatus.classList.remove("is-saved");
    void signatureStatus.offsetWidth;
    signatureStatus.classList.add("is-saved");
  } else {
    previewSignature.removeAttribute("src");
    previewSignature.style.display = "none";
    previewSignatureEmpty.style.display = "grid";
    signatureBox.classList.remove("is-signed");
    signatureStatus.textContent = "جاهز للتوقيع";
    signatureStatus.classList.remove("is-saved");
  }

  persistState();
}

function resizeCanvas() {
  syncSignatureCanvasHeight();
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const rect = signatureCanvas.getBoundingClientRect();
  applySignaturePenScale(rect);
  const data = colorizeStrokes(signaturePad.toData(), SIGNATURE_INK);

  signatureCanvas.width = rect.width * ratio;
  signatureCanvas.height = rect.height * ratio;
  signatureCanvas.getContext("2d").scale(ratio, ratio);

  signaturePad.clear();
  signaturePad.backgroundColor = SIGNATURE_BG;
  signaturePad.penColor = SIGNATURE_INK;
  if (data.length) {
    signaturePad.fromData(data);
  }
  if (!signaturePad.isEmpty() || canvasHasInk()) {
    updatePreview();
  }
}

function syncSignatureCanvasHeight() {
  if (!signatureCard || !signatureCanvas) {
    return;
  }
  const vv = window.visualViewport;
  const viewportH = vv?.height ?? window.innerHeight;
  const isMobile = window.matchMedia("(max-width: 480px)").matches;
  const isNarrow = window.matchMedia("(max-width: 720px)").matches;
  const landscapeShort =
    window.matchMedia("(orientation: landscape)").matches && viewportH <= 520;

  const cardRect = signatureCard.getBoundingClientRect();
  const reservedHeight =
    (signatureHeader?.getBoundingClientRect().height || 0) +
    (signatureHint?.getBoundingClientRect().height || 0) +
    (signatureActions?.getBoundingClientRect().height || 0) +
    (isMobile ? 42 : 34);

  let widthRatio = 0.38;
  if (isMobile) {
    widthRatio = 0.5;
  } else if (isNarrow) {
    widthRatio = 0.42;
  }
  if (landscapeShort) {
    widthRatio = 0.34;
  }

  const byWidth = signatureBox.clientWidth * widthRatio;

  let minHeight = isMobile ? 158 : 128;
  let maxHeight = isMobile ? 248 : 340;
  if (landscapeShort) {
    minHeight = 96;
    maxHeight = Math.min(196, Math.max(104, Math.floor(viewportH * 0.38)));
  }

  const availableByCard = cardRect.height - reservedHeight;
  const preferred =
    Number.isFinite(availableByCard) && availableByCard > 0
      ? Math.max(byWidth, availableByCard)
      : byWidth;
  const nextHeight = Math.max(minHeight, Math.min(preferred, maxHeight));
  signatureCard.style.setProperty(
    "--signature-canvas-height",
    `${Math.round(nextHeight)}px`
  );
}

function readStorage() {
  if (!storageEnabled) {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    storageEnabled = false;
    return null;
  }
}

function updateThemeButtonText(theme) {
  if (!themeToggleButton) {
    return;
  }
  themeToggleButton.textContent =
    theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن";
}

function applyTheme(theme, skipSignatureSync = false) {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  updateThemeButtonText(theme);
  if (!skipSignatureSync) {
    syncSignaturePadFixedTheme();
  }
}

function initTheme() {
  const storage = readStorage();
  const savedTheme = storage?.getItem(THEME_KEY);
  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (preferredDark ? "dark" : "light"), true);
}

/** Toujours noir sur blanc, même après changement de thème ou restauration. */
function syncSignaturePadFixedTheme() {
  const sourceBgColor = signaturePad.backgroundColor;
  const strokes = colorizeStrokes(signaturePad.toData(), SIGNATURE_INK);
  signaturePad.backgroundColor = SIGNATURE_BG;
  signaturePad.penColor = SIGNATURE_INK;
  if (strokes.length) {
    signaturePad.clear();
    signaturePad.fromData(strokes);
  } else if (canvasHasInk(sourceBgColor)) {
    recolorSignatureBitmap(SIGNATURE_INK, SIGNATURE_BG, sourceBgColor);
  }
  updatePreview();
}

/**
 * Rendu normalisé : toujours noir sur blanc (aperçu + PDF).
 * Recadrage sur les pixels réels du canvas (getAlphaBounds), pas sur les points
 * des traits — évite les décalages tactiles / DPR sur mobile.
 */
function buildNormalizedSignatureImage(inkColor, backgroundColor) {
  if (signaturePad.isEmpty() && !canvasHasInk()) {
    return "";
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = signatureCanvas.width;
  exportCanvas.height = signatureCanvas.height;
  const sctx = exportCanvas.getContext("2d");
  if (!sctx) {
    return signaturePad.toDataURL("image/png");
  }

  sctx.fillStyle = backgroundColor;
  sctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  sctx.drawImage(signatureCanvas, 0, 0);

  const b = getAlphaBounds(exportCanvas);
  if (!b) {
    return signaturePad.toDataURL("image/png");
  }

  const rect = signatureCanvas.getBoundingClientRect();
  const ratio = rect.width > 0 ? signatureCanvas.width / rect.width : 1;
  const paddingCss = 10;
  const paddingPx = paddingCss * ratio;

  const sourceX = Math.max(0, Math.floor(b.minX - paddingPx));
  const sourceY = Math.max(0, Math.floor(b.minY - paddingPx));
  const sourceW = Math.min(
    exportCanvas.width - sourceX,
    Math.ceil(b.maxX - b.minX + paddingPx * 2)
  );
  const sourceH = Math.min(
    exportCanvas.height - sourceY,
    Math.ceil(b.maxY - b.minY + paddingPx * 2)
  );

  const safeW = Math.max(1, Math.round(sourceW));
  const safeH = Math.max(1, Math.round(sourceH));
  const normalizedCanvas = document.createElement("canvas");
  const targetWidth = SIGNATURE_TARGET_WIDTH;
  const targetHeight = SIGNATURE_TARGET_HEIGHT;
  normalizedCanvas.width = targetWidth;
  normalizedCanvas.height = targetHeight;
  const ctx = normalizedCanvas.getContext("2d");
  if (!ctx) {
    return signaturePad.toDataURL("image/png");
  }

  const innerPadding = SIGNATURE_INNER_PADDING;
  const availableW = targetWidth - innerPadding * 2;
  const availableH = targetHeight - innerPadding * 2;
  const scale = Math.min(availableW / safeW, availableH / safeH);
  const drawW = Math.max(1, Math.round(safeW * scale));
  const drawH = Math.max(1, Math.round(safeH * scale));
  const drawX = Math.round((targetWidth - drawW) / 2);
  const drawY = Math.round((targetHeight - drawH) / 2);

  ctx.drawImage(
    exportCanvas,
    sourceX,
    sourceY,
    safeW,
    safeH,
    drawX,
    drawY,
    drawW,
    drawH
  );
  return normalizedCanvas.toDataURL("image/png");
}

function getNormalizedSignatureDataUrl() {
  return buildNormalizedSignatureImage(SIGNATURE_INK, SIGNATURE_BG);
}

function getNormalizedSignatureDataUrlForExport() {
  return buildNormalizedSignatureImage(SIGNATURE_INK, SIGNATURE_BG);
}

function getLogoDataUrl() {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }
  if (!heroLogo || !heroLogo.complete || !heroLogo.naturalWidth) {
    return "";
  }
  try {
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = heroLogo.naturalWidth;
    logoCanvas.height = heroLogo.naturalHeight;
    const ctx = logoCanvas.getContext("2d");
    if (!ctx) {
      return "";
    }
    ctx.drawImage(heroLogo, 0, 0);
    cachedLogoDataUrl = logoCanvas.toDataURL("image/png");
    return cachedLogoDataUrl;
  } catch {
    return "";
  }
}

function persistState() {
  const storage = readStorage();
  if (!storage) {
    return;
  }
  const hasSignature = !signaturePad.isEmpty() || canvasHasInk();
  const signatureDataUrl = hasSignature ? signaturePad.toDataURL("image/png") : "";
  const signatureStrokes = hasSignature ? signaturePad.toData() : [];
  const state = {
    phone: phoneInput.value.trim(),
    price: priceInput.value,
    paid: paidInput.value,
    signatureDataUrl,
    signatureStrokes,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (hasSignature) {
      storage.setItem(LAST_SIGNATURE_KEY, signatureDataUrl);
      storage.setItem(LAST_SIGNATURE_STROKES_KEY, JSON.stringify(signatureStrokes));
    }
  } catch {
    storageEnabled = false;
  }
}

function restoreState() {
  const storage = readStorage();
  if (!storage) {
    return Promise.resolve();
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return Promise.resolve();
    }
    const state = JSON.parse(raw);
    phoneInput.value = state.phone || "";
    priceInput.value = state.price || "";
    paidInput.value = state.paid || "";
    updateRemaining();
    const savedStrokes =
      (Array.isArray(state.signatureStrokes) && state.signatureStrokes.length
        ? state.signatureStrokes
        : null) ||
      (() => {
        try {
          const rawStrokes = storage.getItem(LAST_SIGNATURE_STROKES_KEY);
          const parsed = rawStrokes ? JSON.parse(rawStrokes) : null;
          return Array.isArray(parsed) && parsed.length ? parsed : null;
        } catch {
          return null;
        }
      })();

    signaturePad.backgroundColor = SIGNATURE_BG;
    signaturePad.penColor = SIGNATURE_INK;
    if (savedStrokes) {
      signaturePad.fromData(colorizeStrokes(savedStrokes, SIGNATURE_INK));
      return Promise.resolve();
    }
    const savedSignature =
      state.signatureDataUrl || storage.getItem(LAST_SIGNATURE_KEY) || "";
    if (savedSignature) {
      return Promise.resolve(signaturePad.fromDataURL(savedSignature)).catch(
        () => {}
      );
    }
    return Promise.resolve();
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      storageEnabled = false;
    }
    return Promise.resolve();
  }
}

/** Après chargement : si une signature existe, verrouiller la zone par défaut. */
function applyDefaultSignatureLockIfPresent() {
  const hasSig = !signaturePad.isEmpty() || canvasHasInk();
  if (hasSig) {
    setSignatureModificationEnabled(false);
  }
}

async function exportPdf() {
  const error = getValidationError();
  if (error) {
    showModal(error);
    return;
  }

  downloadPdfButton.disabled = true;
  downloadPdfButton.textContent = "...جاري التحميل";
  try {
    updatePreview();
    const logoDataUrl = getLogoDataUrl();
    const exportSignatureDataUrl =
      getNormalizedSignatureDataUrlForExport() ||
      previewSignature.getAttribute("src") ||
      "";

    const canvas = await html2canvas(receiptPreview, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
      onclone: (documentClone) => {
        documentClone.documentElement.setAttribute("data-theme", "light");
        documentClone.body.setAttribute("data-theme", "light");
        const forcedLightStyle = documentClone.createElement("style");
        forcedLightStyle.textContent = `
          #receipt-preview {
            background: #ffffff !important;
            color: #2f2418 !important;
            border-color: #d8c2a1 !important;
          }
          #receipt-preview .receipt-top,
          #receipt-preview .receipt-meta,
          #receipt-preview .receipt-footer {
            border-color: #d9bb91 !important;
          }
          #receipt-preview .receipt-top h3,
          #receipt-preview .receipt-meta strong,
          #receipt-preview .row .value {
            color: #2f2418 !important;
          }
          #receipt-preview .receipt-top p,
          #receipt-preview .receipt-meta span,
          #receipt-preview .row .label {
            color: #6d5842 !important;
          }
          #receipt-preview .receipt-meta p {
            background: #fff8ef !important;
            border-color: #efd9bb !important;
          }
          #receipt-preview .row {
            background: #fffaf3 !important;
            border-color: #efd9bb !important;
          }
          #receipt-preview #preview-signature {
            background: #ffffff !important;
            border-color: #d1d5db !important;
          }
        `;
        documentClone.head.appendChild(forcedLightStyle);
        const clonedSignature = documentClone.querySelector("#preview-signature");
        if (clonedSignature) {
          if (exportSignatureDataUrl) {
            clonedSignature.src = exportSignatureDataUrl;
          } else {
            clonedSignature.removeAttribute("src");
          }
        }
        const existingLogos = documentClone.querySelectorAll(".receipt-logo");
        if (!logoDataUrl) {
          existingLogos.forEach((logo) => logo.remove());
        } else if (existingLogos.length) {
          existingLogos[0].src = logoDataUrl;
          for (let i = 1; i < existingLogos.length; i += 1) {
            existingLogos[i].remove();
          }
        } else {
          const clonedReceiptTop = documentClone.querySelector(".receipt-top");
          if (!clonedReceiptTop) {
            return;
          }
          const logoImage = documentClone.createElement("img");
          logoImage.src = logoDataUrl;
          logoImage.alt = "شعار المجموعة";
          logoImage.className = "receipt-logo";
          clonedReceiptTop.prepend(logoImage);
        }
      },
    });

    const imageData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;

    const ticketWidth = 80;
    const margin = 4;
    const imgWidth = ticketWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const ticketHeight = imgHeight + margin * 2;

    const pdf = new jsPDF({
      unit: "mm",
      format: [ticketWidth, ticketHeight],
      orientation: "portrait",
    });

    pdf.addImage(imageData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save(`وصل-${receiptNumber}.pdf`);
  } catch {
    showModal("حدث خطأ أثناء إنشاء ملف PDF. حاول مرة أخرى.");
  } finally {
    downloadPdfButton.disabled = false;
    downloadPdfButton.textContent = "تحميل PDF";
  }
}

[phoneInput, priceInput, paidInput, receiptDateInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateRemaining();
    updatePreview();
  });
});

receiptDateInput.addEventListener("click", () => {
  if (typeof receiptDateInput.showPicker === "function") {
    try {
      receiptDateInput.showPicker();
    } catch {
      /* navigateur sans support ou contexte restreint */
    }
  }
});

clearSignatureButton.addEventListener("click", () => {
  signaturePad.clear();
  setSignatureModificationEnabled(true);
  updatePreview();
});

if (signatureEditToggleButton) {
  signatureEditToggleButton.addEventListener("click", () => {
    setSignatureModificationEnabled(!signatureModificationEnabled);
  });
}

appModalClose.addEventListener("click", hideModal);
appModal.addEventListener("click", (event) => {
  if (event.target === appModal) {
    hideModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appModal.classList.contains("is-open")) {
    hideModal();
  }
});
appModal.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || !appModal.classList.contains("is-open")) {
    return;
  }
  const focusable = appModal.querySelectorAll("button");
  if (!focusable.length) {
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function scrollSignaturePreviewIntoViewIfNeeded() {
  if (!previewSignature || previewSignature.style.display === "none") {
    return;
  }
  if (!window.matchMedia("(max-width: 900px)").matches) {
    return;
  }
  requestAnimationFrame(() => {
    previewSignature.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  });
}

signaturePad.addEventListener("endStroke", () => {
  updatePreview();
  scrollSignaturePreviewIntoViewIfNeeded();
});
signaturePad.addEventListener("beginStroke", () => {
  signatureBox.classList.add("is-signed");
});
downloadPdfButton.addEventListener("click", exportPdf);
window.addEventListener("resize", resizeCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeCanvas);
}
if (themeToggleButton) {
  themeToggleButton.addEventListener("click", () => {
    const nextTheme =
      document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    const storage = readStorage();
    if (storage) {
      try {
        storage.setItem(THEME_KEY, nextTheme);
      } catch {
        storageEnabled = false;
      }
    }
  });
}

initTheme();
if (signatureCard && "ResizeObserver" in window) {
  signatureCardResizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  signatureCardResizeObserver.observe(signatureCard);
}
function setReceiptDateToNow() {
  receiptDateInput.value = toDateTimeLocal(new Date());
}

updateRemaining();
restoreState().then(() => {
  setReceiptDateToNow();
  requestAnimationFrame(() => {
    resizeCanvas();
    syncSignaturePadFixedTheme();
    updatePreview();
    applyDefaultSignatureLockIfPresent();
  });
});

window.addEventListener("load", () => {
  if (!appLoader) {
    document.body.classList.add("app-ready");
    return;
  }
  setTimeout(() => {
    appLoader.classList.add("is-hidden");
    document.body.classList.add("app-ready");
  }, 1400);
});
