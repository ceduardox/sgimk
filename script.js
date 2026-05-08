const productPool = [
  { id: "fallback-pasta", name: "Pasta dental", icon: "fa-solid fa-tooth", level: "bronce" },
  { id: "fallback-jabon", name: "Jabon premium", icon: "fa-solid fa-soap", level: "bronce" },
  { id: "fallback-detergente", name: "Detergente", icon: "fa-solid fa-bottle-droplet", level: "bronce" },
  { id: "fallback-canasta", name: "Canasta hogar", icon: "fa-solid fa-basket-shopping", level: "bronce" }
];

const state = {
  deviceId: getDeviceId(),
  referralCount: 0,
  goal: 3,
  maxPrizeAttempts: 3,
  prizeAttempts: 0,
  selectedPrize: null,
  prizePool: productPool,
  isRevealed: false,
  customer: { name: "Jugador SGI", referral_code: "u1" },
  referrals: [],
  rewards: [],
  missions: []
};

const els = {
  productIcon: document.querySelector("#productIcon"),
  productName: document.querySelector("#productName"),
  productWindow: document.querySelector(".product-window"),
  revealButton: document.querySelector("#revealButton"),
  revealButtonText: document.querySelector("#revealButtonText"),
  revealButtonHint: document.querySelector("#revealButtonHint"),
  progressLabel: document.querySelector("#progressLabel"),
  progressHint: document.querySelector("#progressHint"),
  energySegments: [...document.querySelectorAll("#energySegments span")],
  claimButton: document.querySelector("#claimButton"),
  referralLink: document.querySelector("#referralLink"),
  referralList: document.querySelector("#referralList"),
  levelRoad: document.querySelector("#levelRoad"),
  missionRows: document.querySelector("#missionRows"),
  navButtons: [...document.querySelectorAll("[data-nav]")],
  viewBlocks: [...document.querySelectorAll("[data-view]")],
  profileName: document.querySelector("#profileName"),
  profileCode: document.querySelector("#profileCode"),
  profileCount: document.querySelector("#profileCount"),
  deviceStatus: document.querySelector("#deviceStatus"),
  customizeLinkButton: document.querySelector("#customizeLinkButton"),
  referredPanel: document.querySelector("#referredPanel"),
  inviterCode: document.querySelector("#inviterCode"),
  validateReferralButton: document.querySelector("#validateReferralButton"),
  whatsappButton: document.querySelector("#whatsappButton"),
  facebookButton: document.querySelector("#facebookButton"),
  copyButton: document.querySelector("#copyButton"),
  prizeModal: document.querySelector("#prizeModal"),
  closePrizeModal: document.querySelector("#closePrizeModal"),
  modalPrizeStage: document.querySelector("#modalPrizeStage"),
  modalPrizeImage: document.querySelector("#modalPrizeImage"),
  modalPrizeName: document.querySelector("#modalPrizeName"),
  modalPrizeHint: document.querySelector("#modalPrizeHint"),
  attemptCounter: document.querySelector("#attemptCounter"),
  retryPrizeButton: document.querySelector("#retryPrizeButton"),
  keepPrizeButton: document.querySelector("#keepPrizeButton"),
  fxLayer: document.querySelector("#fxLayer"),
  toast: document.querySelector("#toast")
};

let toastTimer;
let pollTimer;

function getDeviceId() {
  const existing = localStorage.getItem("sgi_device_id");
  if (existing) return existing;
  const next = crypto.randomUUID ? crypto.randomUUID() : `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem("sgi_device_id", next);
  document.cookie = `sgi_device_id=${next}; max-age=31536000; path=/; samesite=lax`;
  return next;
}

function selectedPrizeKey() {
  return `sgi_selected_prize_${state.deviceId}`;
}

function prizeAttemptKey() {
  return `sgi_prize_attempts_${state.deviceId}`;
}

function loadStoredPrize() {
  try {
    const stored = JSON.parse(localStorage.getItem(selectedPrizeKey()) || "null");
    const attempts = Number(localStorage.getItem(prizeAttemptKey()) || "0");
    state.prizeAttempts = Number.isFinite(attempts) ? Math.max(0, Math.min(state.maxPrizeAttempts, attempts)) : 0;
    if (stored && stored.id) {
      state.selectedPrize = stored;
      if (stored.image) state.selectedPrize.image = normalizePrizeImage(stored.image);
      state.isRevealed = true;
      if (state.prizeAttempts === 0) state.prizeAttempts = 1;
    }
  } catch {
    localStorage.removeItem(selectedPrizeKey());
    localStorage.removeItem(prizeAttemptKey());
  }
}

function storeSelectedPrize(prize) {
  localStorage.setItem(selectedPrizeKey(), JSON.stringify(prize));
  localStorage.setItem(prizeAttemptKey(), String(state.prizeAttempts));
}

function renderPrizeVisual(container, prize, size = "normal") {
  if (prize?.image) {
    container.innerHTML = `<img class="prize-image ${size}" src="${normalizePrizeImage(prize.image)}" alt="${prize.name}">`;
    return;
  }

  container.innerHTML = `<i class="${prize?.icon || "fa-solid fa-gift"}"></i>`;
}

function normalizePrizeImage(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

function validReferrals() {
  return state.referralCount;
}

function progressMessage() {
  const remaining = Math.max(0, state.goal - validReferrals());
  if (remaining === 0) return "Premio desbloqueado. Ya puedes reclamar.";
  if (remaining === 1) return "Estas a 1 referido validado del premio.";
  return `Te faltan ${remaining} referidos validados.`;
}

function setView(viewName) {
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.nav === viewName));

  if (viewName === "home") {
    els.viewBlocks.forEach((block) => block.classList.add("active"));
  } else {
    els.viewBlocks.forEach((block) => block.classList.toggle("active", block.dataset.view === viewName));
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const count = validReferrals();
  const complete = count >= state.goal;
  const prize = state.selectedPrize || state.prizePool[0];
  const progressDegrees = Math.min(360, Math.round((Math.min(count, state.goal) / state.goal) * 360));
  const attemptsLeft = Math.max(0, state.maxPrizeAttempts - state.prizeAttempts);
  const lockedPrize = state.isRevealed && attemptsLeft === 0;

  renderPrizeVisual(els.productIcon, prize);
  els.productName.textContent = state.isRevealed ? prize.name : "Premio oculto";
  els.progressLabel.textContent = `${Math.min(count, state.goal)}/${state.goal} referidos validos`;
  els.progressHint.textContent = progressMessage();
  els.claimButton.disabled = !complete;
  els.claimButton.innerHTML = complete
    ? `<i class="fa-brands fa-google"></i> Reclamar con Google`
    : `<i class="fa-solid fa-lock"></i> Reclamo bloqueado`;

  els.revealButton.classList.toggle("waiting-progress", lockedPrize);
  els.revealButton.style.setProperty("--progress", `${progressDegrees}deg`);
  els.revealButton.disabled = lockedPrize;
  if (lockedPrize) {
    els.revealButtonText.textContent = `${Math.min(count, state.goal)}/${state.goal}`;
    els.revealButtonHint.textContent = complete ? "premio listo" : "referidos";
  } else if (state.isRevealed) {
    els.revealButtonText.textContent = `INTENTO ${state.prizeAttempts + 1}`;
    els.revealButtonHint.textContent = `te quedan ${attemptsLeft}`;
  } else {
    els.revealButtonText.textContent = "REVELAR";
    els.revealButtonHint.textContent = "3 intentos";
  }

  els.energySegments.forEach((segment, index) => {
    segment.classList.toggle("filled", index < count);
  });

  els.profileName.textContent = state.customer.name || "Jugador SGI";
  const publicCode = getPublicReferralCode();
  els.referralLink.value = `${window.location.host}/r/${publicCode}`;
  els.profileCode.textContent = `Link: /r/${publicCode}`;
  els.profileCount.textContent = `Referidos validos: ${count}`;
  els.deviceStatus.textContent = `Device ID: ${state.deviceId.slice(0, 8)}...`;

  renderReferralList();
  renderLevels();
  renderMissions();
  setupReferralLanding();
}

function renderReferralList() {
  if (!state.referrals.length) {
    els.referralList.innerHTML = `
      <div class="status-row">
        <i class="fa-solid fa-user-plus"></i>
        <div><strong>Sin referidos aun</strong><span>Cuando alguien use tu link, aparecera aqui.</span></div>
        <b class="status-pill">0</b>
      </div>
    `;
    return;
  }

  els.referralList.innerHTML = state.referrals.slice(0, 8).map((referral) => `
    <div class="status-row">
      <i class="fa-solid ${referral.status === "valid" ? "fa-circle-check" : referral.status === "review" ? "fa-triangle-exclamation" : "fa-clock"}"></i>
      <div>
        <strong>${referral.referred_name}</strong>
        <span>${statusLabel(referral.status)}</span>
      </div>
      <b class="status-pill">${referral.status}</b>
    </div>
  `).join("");
}

function statusLabel(status) {
  if (status === "valid") return "Validado, cuenta para tu progreso";
  if (status === "review") return "En revision por seguridad";
  if (status === "rejected") return "No cuenta por duplicado o riesgo";
  return "Pendiente de validacion";
}

function renderLevels() {
  const levels = [
    { name: "Bronce", goal: 3, icon: "fa-solid fa-medal" },
    { name: "Cobre", goal: 5, icon: "fa-solid fa-shield-halved" },
    { name: "Plata", goal: 10, icon: "fa-solid fa-crown" }
  ];

  els.levelRoad.innerHTML = levels.map((level, index) => `
    <article class="level-card ${index === 0 ? "active" : ""}">
      <div class="level-icon"><i class="${level.icon}"></i></div>
      <div><strong>Nivel ${level.name}</strong><span>${level.goal} referidos validos para premios ${index === 0 ? "iniciales" : "mejores"}.</span></div>
      <b class="status-pill">${index === 0 ? "Activo" : "Bloqueado"}</b>
    </article>
  `).join("");
}

function renderMissions() {
  els.missionRows.innerHTML = state.missions.map((mission) => `
    <article class="mission-row">
      <div class="mission-icon"><i class="${mission.icon_class}"></i></div>
      <div><strong>${mission.title}</strong><span>+${mission.reward_points} energia</span></div>
      <b class="status-pill">${mission.is_completed ? "OK" : "Pendiente"}</b>
    </article>
  `).join("");
}

function setupReferralLanding() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref || ref === getPublicReferralCode() || ref === state.customer.referral_code) {
    els.referredPanel.hidden = true;
    return;
  }

  els.referredPanel.hidden = false;
  els.inviterCode.textContent = ref;
}

function getPublicReferralCode() {
  return state.customer.public_referral_code || state.customer.custom_referral_code || state.customer.referral_code || `u${state.customer.id || 1}`;
}

async function revealPrize() {
  if (state.prizeAttempts >= state.maxPrizeAttempts) {
    showToast("Ya usaste tus 3 intentos. Comparte tu link para reclamar.");
    return;
  }

  if (els.productWindow.classList.contains("spinning")) return;

  els.productWindow.classList.add("spinning");
  els.revealButton.disabled = true;
  els.revealButtonText.textContent = "BUSCANDO";
  els.revealButtonHint.textContent = "premio potencial";
  openPrizeModal();

  const steps = [55, 60, 65, 72, 82, 96, 115, 140, 170, 210, 260, 330, 430, 560];
  let current = Math.floor(Math.random() * state.prizePool.length);

  for (const delay of steps) {
    await wait(delay);
    current = (current + 1) % state.prizePool.length;
    const item = state.prizePool[current];
    renderPrizeVisual(els.productIcon, item);
    els.productName.textContent = item.name;
    updatePrizeModal(item, true);
  }

  state.selectedPrize = state.prizePool[current];
  state.isRevealed = true;
  state.prizeAttempts += 1;
  storeSelectedPrize(state.selectedPrize);
  els.productWindow.classList.remove("spinning");
  updatePrizeModal(state.selectedPrize, false);
  spawnSparks();
  render();
  const attemptsLeft = state.maxPrizeAttempts - state.prizeAttempts;
  showToast(attemptsLeft > 0
    ? `Premio revelado. Te quedan ${attemptsLeft} intentos.`
    : "Premio final revelado. Comparte para reclamar.");
}

function openPrizeModal() {
  els.prizeModal.hidden = false;
  els.prizeModal.classList.add("show");
  els.modalPrizeStage.classList.add("spinning");
  els.keepPrizeButton.hidden = true;
  els.retryPrizeButton.hidden = true;
  els.modalPrizeHint.textContent = `Intento ${state.prizeAttempts + 1} de ${state.maxPrizeAttempts}.`;
  updatePrizeModal(state.prizePool[0], true);
}

function closePrizeModal() {
  els.prizeModal.classList.remove("show");
  window.setTimeout(() => {
    els.prizeModal.hidden = true;
  }, 180);
}

function updatePrizeModal(prize, isSpinning) {
  const nextAttempt = Math.min(state.maxPrizeAttempts, state.prizeAttempts + 1);
  const attemptsLeftAfterThis = Math.max(0, state.maxPrizeAttempts - nextAttempt);
  const canKeepPrize = state.isRevealed && !isSpinning && state.prizeAttempts < state.maxPrizeAttempts;
  const canRetry = state.isRevealed && !isSpinning && state.prizeAttempts < state.maxPrizeAttempts;
  els.attemptCounter.textContent = `Intento ${Math.max(1, state.prizeAttempts || nextAttempt)} de ${state.maxPrizeAttempts}`;
  els.modalPrizeImage.src = normalizePrizeImage(prize.image);
  els.modalPrizeImage.alt = prize.name;
  els.modalPrizeName.textContent = isSpinning ? "Buscando premio..." : prize.name;
  els.modalPrizeStage.classList.toggle("spinning", isSpinning);
  els.keepPrizeButton.hidden = !canKeepPrize;
  els.retryPrizeButton.hidden = !canRetry;
  els.modalPrizeHint.textContent = isSpinning
    ? `Intento ${state.prizeAttempts + 1} de ${state.maxPrizeAttempts}. No cierres todavia.`
    : attemptsLeftAfterThis > 0
      ? `Puedes intentar ${attemptsLeftAfterThis} vez mas o quedarte con este premio.`
      : "Este es tu premio final. Completa los referidos para reclamarlo.";
}

function retryPrizeFromModal() {
  if (state.prizeAttempts >= state.maxPrizeAttempts) return;
  revealPrize();
}

function keepCurrentPrize() {
  if (!state.selectedPrize) return;
  state.prizeAttempts = state.maxPrizeAttempts;
  storeSelectedPrize(state.selectedPrize);
  updatePrizeModal(state.selectedPrize, false);
  closePrizeModal();
  render();
  showToast("Premio elegido. Comparte tu link para reclamarlo.");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function spawnSparks() {
  for (let index = 0; index < 18; index += 1) {
    const spark = document.createElement("i");
    spark.className = "spark fa-solid fa-star";
    spark.style.setProperty("--x", `${Math.round(Math.random() * 260 - 130)}px`);
    spark.style.setProperty("--y", `${Math.round(Math.random() * -190 - 40)}px`);
    spark.style.setProperty("--r", `${Math.round(Math.random() * 260 - 130)}deg`);
    spark.style.animationDelay = `${index * 18}ms`;
    els.fxLayer.appendChild(spark);
    window.setTimeout(() => spark.remove(), 1200);
  }
}

async function initDevice() {
  await fetch("/api/device/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ device_id: state.deviceId })
  }).catch(() => {});
}

async function loadPrizePool() {
  try {
    const response = await fetch("/api/prizes/bronce");
    if (!response.ok) throw new Error("prizes");
    const data = await response.json();
    if (Array.isArray(data.prizes) && data.prizes.length) {
      state.prizePool = data.prizes;
    }
  } catch {
    state.prizePool = productPool;
  }

  if (state.selectedPrize) {
    const freshPrize = state.prizePool.find((prize) => prize.id === state.selectedPrize.id);
    if (freshPrize) state.selectedPrize = freshPrize;
  }
}

async function loadState(options = {}) {
  try {
    const previousCount = state.referralCount;
    const response = await fetch(`/api/state?device_id=${encodeURIComponent(state.deviceId)}`);
    if (!response.ok) throw new Error("api");
    const data = await response.json();
    state.customer = data.customer;
    state.referrals = data.referrals;
    state.referralCount = data.referralCount;
    state.rewards = data.rewards;
    state.missions = data.missions.filter((mission) => mission.is_active);
    state.goal = data.currentReward?.required_referrals || 3;

    if (options.animate && state.referralCount > previousCount) {
      spawnSparks();
      showToast("Nuevo referido validado. Energia aumentada.");
    }
  } catch {
    state.referralCount = Math.max(state.referralCount, 0);
  }

  render();
}

async function validateReferralVisit() {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref) return;
  const name = window.prompt("Tu nombre para validar la visita") || "Visitante referido";

  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referral_code: ref, device_id: state.deviceId, name })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo validar");
    showToast(result.status === "valid" ? "Visita validada." : `Quedo en estado: ${result.status}`);
    els.referredPanel.hidden = true;
  } catch (error) {
    showToast(error.message);
  }
}

async function claimWithGoogle() {
  if (!state.isRevealed) {
    showToast("Primero revela tu premio potencial.");
    return;
  }

  if (state.referralCount < state.goal) {
    showToast("Completa 3 referidos validos antes de reclamar.");
    return;
  }

  const googleEmail = window.prompt("Demo Google: escribe tu correo Gmail para reclamar");
  if (!googleEmail) return;

  try {
    await fetch("/api/rewards/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        device_id: state.deviceId,
        google_email: googleEmail,
        google_subject: `demo:${googleEmail}`,
        selected_prize: state.selectedPrize
      })
    });
    showToast("Solicitud de reclamo creada. Admin debe aprobar entrega.");
  } catch {
    showToast("No se pudo crear el reclamo.");
  }
}

async function customizeReferralLink() {
  const googleEmail = window.prompt("Demo Google: escribe tu Gmail para autenticar el cambio");
  if (!googleEmail) return;

  const name = window.prompt("Nombre para mostrar en tu perfil", state.customer.name || "");
  const customCode = window.prompt("Elige tu alias para el link, ejemplo: juanperez");
  if (!customCode) return;

  try {
    const response = await fetch("/api/profile/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        google_email: googleEmail,
        google_subject: `demo:${googleEmail}`,
        device_id: state.deviceId,
        name,
        custom_referral_code: customCode
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo cambiar el link");
    state.customer = result.customer;
    render();
    showToast("Link personalizado actualizado.");
  } catch (error) {
    showToast(error.message);
  }
}

function copyReferral() {
  navigator.clipboard.writeText(els.referralLink.value).then(() => {
    showToast("Link copiado.");
  }).catch(() => showToast("No se pudo copiar."));
}

function shareWhatsApp() {
  const text = encodeURIComponent(`Entra a SGI Market y descubre tu premio: http://${els.referralLink.value}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

function shareFacebook() {
  const url = encodeURIComponent(`http://${els.referralLink.value}`);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

els.revealButton.addEventListener("click", revealPrize);
els.claimButton.addEventListener("click", claimWithGoogle);
els.customizeLinkButton.addEventListener("click", customizeReferralLink);
els.validateReferralButton.addEventListener("click", validateReferralVisit);
els.copyButton.addEventListener("click", copyReferral);
els.whatsappButton.addEventListener("click", shareWhatsApp);
els.facebookButton.addEventListener("click", shareFacebook);
els.closePrizeModal.addEventListener("click", closePrizeModal);
els.retryPrizeButton.addEventListener("click", retryPrizeFromModal);
els.keepPrizeButton.addEventListener("click", keepCurrentPrize);
els.prizeModal.addEventListener("click", (event) => {
  if (event.target === els.prizeModal) closePrizeModal();
});
document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.nav));
});

loadStoredPrize();
loadPrizePool().then(() => {
  render();
});
initDevice();
loadState();
pollTimer = window.setInterval(() => loadState({ animate: true }), 5000);
