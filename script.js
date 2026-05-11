const productPool = [
  { id: "fallback-pasta", name: "Pasta dental", icon: "fa-solid fa-tooth", level: "bronce" },
  { id: "fallback-jabon", name: "Jabon premium", icon: "fa-solid fa-soap", level: "bronce" },
  { id: "fallback-detergente", name: "Detergente", icon: "fa-solid fa-bottle-droplet", level: "bronce" },
  { id: "fallback-canasta", name: "Canasta hogar", icon: "fa-solid fa-basket-shopping", level: "bronce" }
];

const state = {
  referralCount: 0,
  goal: 3,
  maxPrizeAttempts: 3,
  prizeAttempts: 0,
  socialMissions: [],
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
  levelName: document.querySelector("#levelName"),
  productName: document.querySelector("#productName"),
  productWindow: document.querySelector(".product-window"),
  placePhoto: document.querySelector(".place-photo"),
  revealButton: document.querySelector("#revealButton"),
  revealButtonText: document.querySelector("#revealButtonText"),
  revealButtonHint: document.querySelector("#revealButtonHint"),
  progressLabel: document.querySelector("#progressLabel"),
  progressHint: document.querySelector("#progressHint"),
  energySegments: [...document.querySelectorAll("#energySegments span")],
  claimButton: document.querySelector("#claimButton"),
  referralLink: document.querySelector("#referralLink"),
  copyInlineButton: document.querySelector("#copyInlineButton"),
  referralPreviewList: document.querySelector("#referralPreviewList"),
  referralList: document.querySelector("#referralList"),
  validReferralTotal: document.querySelector("#validReferralTotal"),
  pendingReferralTotal: document.querySelector("#pendingReferralTotal"),
  nextGoalTotal: document.querySelector("#nextGoalTotal"),
  levelSummary: document.querySelector("#levelSummary"),
  levelRoad: document.querySelector("#levelRoad"),
  missionRows: document.querySelector("#missionRows"),
  navButtons: [...document.querySelectorAll("[data-nav]")],
  viewBlocks: [...document.querySelectorAll("[data-view]")],
  profileName: document.querySelector("#profileName"),
  profileCode: document.querySelector("#profileCode"),
  profileCount: document.querySelector("#profileCount"),
  deviceStatus: document.querySelector("#deviceStatus"),
  profileForm: document.querySelector("#profileForm"),
  profileInputName: document.querySelector("#profileInputName"),
  profileCountryCode: document.querySelector("#profileCountryCode"),
  profileWhatsapp: document.querySelector("#profileWhatsapp"),
  profileEmail: document.querySelector("#profileEmail"),
  profileAlias: document.querySelector("#profileAlias"),
  profilePassword: document.querySelector("#profilePassword"),
  profilePasswordConfirm: document.querySelector("#profilePasswordConfirm"),
  captchaPrompt: document.querySelector("#captchaPrompt"),
  captchaOptions: document.querySelector("#captchaOptions"),
  captchaRefreshButton: document.querySelector("#captchaRefreshButton"),
  customizeLinkButton: document.querySelector("#customizeLinkButton"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginButton: document.querySelector("#loginButton"),
  referredPanel: document.querySelector("#referredPanel"),
  inviterCode: document.querySelector("#inviterCode"),
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
  imageViewer: document.querySelector("#imageViewer"),
  closeImageViewer: document.querySelector("#closeImageViewer"),
  viewerPrizeName: document.querySelector("#viewerPrizeName"),
  viewerPrizeImage: document.querySelector("#viewerPrizeImage"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  zoomResetButton: document.querySelector("#zoomResetButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  levelCompleteModal: document.querySelector("#levelCompleteModal"),
  closeLevelCompleteModal: document.querySelector("#closeLevelCompleteModal"),
  levelCompleteTitle: document.querySelector("#levelCompleteTitle"),
  levelCompleteText: document.querySelector("#levelCompleteText"),
  completeClaimButton: document.querySelector("#completeClaimButton"),
  completeReferralsButton: document.querySelector("#completeReferralsButton"),
  levelDetailModal: document.querySelector("#levelDetailModal"),
  closeLevelDetailModal: document.querySelector("#closeLevelDetailModal"),
  levelDetailIcon: document.querySelector("#levelDetailIcon"),
  levelDetailStatus: document.querySelector("#levelDetailStatus"),
  levelDetailTitle: document.querySelector("#levelDetailTitle"),
  levelDetailPrize: document.querySelector("#levelDetailPrize"),
  levelDetailProgressText: document.querySelector("#levelDetailProgressText"),
  levelDetailProgressBar: document.querySelector("#levelDetailProgressBar"),
  levelDetailRules: document.querySelector("#levelDetailRules"),
  levelDetailAction: document.querySelector("#levelDetailAction"),
  fxLayer: document.querySelector("#fxLayer"),
  toast: document.querySelector("#toast")
};

const captchaState = {
  token: "",
  answer: ""
};

let toastTimer;
let pollTimer;
let pendingReferralCode = "";
let pendingReferralConverted = false;
let viewerZoom = 1;
let completionShownForGoal = 0;
let profileFormTouched = false;
let profileFormHydrated = false;
let audioContext;
let lastTapSoundAt = 0;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = new AudioContextCtor();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(frequency, duration = 0.08, type = "sine", volume = 0.08, delay = 0) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playNoise(duration = 0.12, volume = 0.04, delay = 0) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}

function playUiSound(name = "tap") {
  if (name === "tap") {
    playTone(540, 0.045, "square", 0.035);
    playTone(760, 0.045, "sine", 0.025, 0.035);
    return;
  }
  if (name === "nav") {
    playTone(480, 0.055, "triangle", 0.045);
    playTone(680, 0.07, "triangle", 0.035, 0.045);
    return;
  }
  if (name === "reveal") {
    playNoise(0.18, 0.035);
    playTone(320, 0.08, "sawtooth", 0.045);
    playTone(620, 0.09, "triangle", 0.045, 0.07);
    playTone(920, 0.11, "sine", 0.04, 0.15);
    return;
  }
  if (name === "success") {
    playTone(620, 0.09, "triangle", 0.055);
    playTone(820, 0.1, "triangle", 0.05, 0.08);
    playTone(1060, 0.14, "sine", 0.045, 0.17);
    return;
  }
  if (name === "error") {
    playTone(220, 0.13, "sawtooth", 0.05);
    playTone(160, 0.16, "sawtooth", 0.04, 0.1);
    return;
  }
  if (name === "modal") {
    playTone(420, 0.06, "triangle", 0.045);
    playTone(760, 0.08, "sine", 0.035, 0.045);
  }
}

function playButtonTap(event) {
  const target = event.target.closest("button, a, .product-window, .place-photo");
  if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;
  const now = performance.now();
  if (now - lastTapSoundAt < 70) return;
  lastTapSoundAt = now;
  playUiSound("tap");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function webpFallbackForImage(src) {
  const cleanSrc = String(src || "").split("?")[0];
  return cleanSrc.replace(/\.(jpe?g|png)$/i, ".webp");
}

function prizeWords(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

function resolvePrizeForDisplay(prize) {
  if (!prize) return state.prizePool[0] || productPool[0];
  if (prize.image) return prize;

  const words = prizeWords(prize.name);
  const matchedPrize = state.prizePool.find((candidate) => {
    const candidateName = String(candidate.name || "").toLowerCase();
    const candidateId = String(candidate.id || "").toLowerCase();
    return words.some((word) => candidateName.includes(word) || candidateId.includes(word));
  });

  return matchedPrize || prize;
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
  playUiSound("nav");
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.nav === viewName));

  els.viewBlocks.forEach((block) => block.classList.toggle("active", block.dataset.view === viewName));

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const count = validReferrals();
  const complete = count >= state.goal;
  const prize = resolvePrizeForDisplay(state.selectedPrize || state.prizePool[0]);
  const progressDegrees = Math.min(360, Math.round((Math.min(count, state.goal) / state.goal) * 360));
  const attemptsLeft = Math.max(0, state.maxPrizeAttempts - state.prizeAttempts);
  const lockedPrize = state.isRevealed && attemptsLeft === 0;
  const prizeLocked = Boolean(state.customer.prize_locked_at);
  const tiktokMission = getSocialMission("tiktok_follow");
  const canUseTikTokOpportunity = lockedPrize && !prizeLocked && tiktokMission?.status !== "completed" && tiktokMission?.status !== "review";

  renderPrizeVisual(els.productIcon, prize);
  els.productName.textContent = state.isRevealed ? prize.name : "Premio oculto";
  els.progressLabel.textContent = `${Math.min(count, state.goal)}/${state.goal} referidos validos`;
  els.progressHint.textContent = progressMessage();
  const canClaim = complete && state.isRevealed;
  els.claimButton.disabled = !canClaim;
  els.claimButton.innerHTML = canClaim
    ? `<i class="fa-solid fa-ticket"></i> Reclamar premio`
    : state.isRevealed
      ? `<i class="fa-solid fa-lock"></i> Reclamo bloqueado`
      : `<i class="fa-solid fa-gift"></i> Primero revela`;

  els.revealButton.classList.toggle("waiting-progress", lockedPrize);
  els.revealButton.style.setProperty("--progress", `${progressDegrees}deg`);
  els.revealButton.disabled = lockedPrize && !canUseTikTokOpportunity;
  if (lockedPrize) {
    els.revealButtonText.textContent = prizeLocked ? "FINAL" : tiktokMission?.status === "pending" ? "VERIFICAR" : "EXTRA";
    els.revealButtonHint.textContent = prizeLocked ? "elegido" : tiktokMission?.status === "completed" ? "ganado" : "TikTok";
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
  const currentRoadReward = getActiveRoadReward();
  els.levelName.textContent = `Nivel ${rewardDisplayName(currentRoadReward.reward, currentRoadReward.index)}`;
  els.referralLink.value = `${window.location.origin}/r/${publicCode}`;
  els.profileCode.textContent = `Link: /r/${publicCode}`;
  els.profileCount.textContent = `Referidos validos: ${count}`;
  els.deviceStatus.textContent = state.customer.registered_at
    ? "Perfil registrado en base de datos"
    : "Sesion guardada en base de datos";
  hydrateProfileForm();

  renderReferralList();
  renderLevels();
  renderMissions();
  setupReferralLanding();
}

function hydrateProfileForm() {
  if (!els.profileForm || profileFormTouched || profileFormHydrated) return;
  els.profileInputName.value = state.customer.name || "";
  els.profileCountryCode.value = state.customer.whatsapp_country_code || "+591";
  els.profileWhatsapp.value = state.customer.whatsapp_number || "";
  els.profileEmail.value = state.customer.email || state.customer.google_email || "";
  els.profileAlias.value = state.customer.custom_referral_code || "";
  profileFormHydrated = true;
}

function renderReferralList() {
  const validCount = state.referrals.filter((referral) => referral.status === "valid").length;
  const pendingCount = state.referrals.filter((referral) => referral.status === "review" || referral.status === "pending").length;
  els.validReferralTotal.textContent = String(validCount);
  els.pendingReferralTotal.textContent = String(pendingCount);
  els.nextGoalTotal.textContent = String(state.goal);

  if (!state.referrals.length) {
    const empty = `
      <div class="status-row">
        <i class="fa-solid fa-user-plus"></i>
        <div><strong>Sin referidos aun</strong><span>Cuando alguien use tu link, aparecera aqui.</span></div>
        <b class="status-pill">0</b>
      </div>
    `;
    els.referralPreviewList.innerHTML = empty;
    els.referralList.innerHTML = empty;
    return;
  }

  const rows = state.referrals.map((referral) => `
    <div class="status-row">
      <i class="fa-solid ${referral.status === "valid" ? "fa-circle-check" : referral.status === "review" ? "fa-triangle-exclamation" : "fa-clock"}"></i>
      <div>
        <strong>${escapeHtml(referral.referred_name)}</strong>
        <span>${escapeHtml(statusLabel(referral.status))} - ${escapeHtml(formatReferralDate(referral.created_at))}</span>
      </div>
      <b class="status-pill">${escapeHtml(referral.status)}</b>
    </div>
  `);
  els.referralPreviewList.innerHTML = rows.slice(0, 3).join("");
  els.referralList.innerHTML = rows.join("");
}

function statusLabel(status) {
  if (status === "valid") return "Validado, cuenta para tu progreso";
  if (status === "review") return "En revision por seguridad";
  if (status === "rejected") return "No cuenta por duplicado o riesgo";
  return "Pendiente de validacion";
}

function formatReferralDate(value) {
  if (!value) return "reciente";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderLevels() {
  const count = validReferrals();
  const rewards = getRewardsForRoad();
  const { reward: activeReward, index: activeIndex } = getActiveRoadReward();
  const activePercent = Math.round((Math.min(count, Number(activeReward.required_referrals)) / Number(activeReward.required_referrals)) * 100);

  els.levelSummary.innerHTML = `
    <div>
      <span>Rango actual</span>
      <strong>${escapeHtml(rewardDisplayName(activeReward, activeIndex))}</strong>
      <small>${count}/${activeReward.required_referrals} referidos para llegar a este rango</small>
    </div>
    <b>${activePercent}%</b>
  `;

  els.levelRoad.innerHTML = rewards.map((reward, index) => {
    const previousGoal = index === 0 ? 0 : Number(rewards[index - 1].required_referrals);
    const required = Number(reward.required_referrals);
    const totalProgress = Math.max(0, Math.min(required, count));
    const percent = Math.round((totalProgress / required) * 100);
    const complete = count >= required;
    const active = count >= previousGoal && count < required;
    const unlocked = !reward.is_locked && (index === 0 || count >= previousGoal);
    const status = complete ? "Completado" : active ? "Activo" : unlocked ? "Siguiente" : "Bloqueado";
    return `
    <article class="level-card level-node planet-node planet-${(index % 6) + 1} ${active ? "active" : ""} ${complete ? "complete" : ""} ${!unlocked ? "locked" : ""}" style="--level-progress:${percent}%">
      <button class="level-node-button" type="button" data-level-detail="${escapeHtml(reward.id)}" aria-label="Ver reglas de ${escapeHtml(reward.name)}">
        <div class="planet-badge">${index + 1}</div>
        <div class="planet-orbit">
          <div class="level-icon planet-core"><i class="${reward.icon_class}"></i></div>
        </div>
        <div class="level-node-copy">
          <strong>${escapeHtml(rewardDisplayName(reward, index))}</strong>
          <small>${totalProgress}/${required} referidos para llegar</small>
          <div class="level-stars" aria-label="${totalProgress} de ${required} referidos">${renderLevelStars(totalProgress, required)}</div>
        </div>
        <b class="status-pill">${status}</b>
        <div class="level-progress-line"><span></span></div>
      </button>
    </article>
  `;
  }).join("");
}

function renderLevelStars(progress, goal) {
  const visibleStars = Math.max(1, Math.min(10, goal));
  const filledStars = Math.round((Math.min(progress, goal) / goal) * visibleStars);
  return Array.from({ length: visibleStars }, (_, index) => `
    <i class="fa-solid fa-star ${index < filledStars ? "filled" : ""}"></i>
  `).join("");
}

function getRewardsForRoad() {
  return state.rewards.length ? state.rewards : [
    { id: "fallback-bronce", name: "Bronce", prize_name: "Premio inicial", required_referrals: state.goal, icon_class: "fa-solid fa-medal", is_locked: false }
  ];
}

function getActiveRoadReward() {
  const rewards = getRewardsForRoad();
  const reward = rewards.find((item) => validReferrals() < Number(item.required_referrals)) || rewards[rewards.length - 1];
  return { reward, index: Math.max(0, rewards.indexOf(reward)) };
}

function rewardDisplayName(reward, index = 0) {
  const names = ["Bronce", "Cobre", "Plata", "Oro", "Diamante", "Elite"];
  const rawName = String(reward?.name || "").trim();
  if (!rawName || /^rango\s+\d+$/i.test(rawName)) return names[index] || `Nivel ${index + 1}`;
  return rawName;
}

function getLevelInfo(reward) {
  const rewards = getRewardsForRoad();
  const index = Math.max(0, rewards.findIndex((item) => String(item.id) === String(reward.id)));
  const previousGoal = index === 0 ? 0 : Number(rewards[index - 1].required_referrals);
  const required = Number(reward.required_referrals);
  const segmentGoal = Math.max(1, required - previousGoal);
  const count = validReferrals();
  const segmentProgress = Math.max(0, Math.min(segmentGoal, count - previousGoal));
  const percent = Math.round((Math.min(count, required) / required) * 100);
  const complete = count >= required;
  const active = count >= previousGoal && count < required;
  const unlocked = !reward.is_locked && (index === 0 || count >= previousGoal);

  return { index, previousGoal, required, segmentGoal, segmentProgress, percent, complete, active, unlocked };
}

function levelRules(reward, info) {
  const name = rewardDisplayName(reward, info.index);
  const rules = [
    `Para llegar al rango ${name} necesitas ${info.required} referidos validos acumulados.`,
    `Tu avance actual para este rango es ${Math.min(validReferrals(), info.required)}/${info.required} referidos validos.`,
    "Un referido cuenta cuando entra por tu link y revela su premio en su dispositivo.",
    "Los duplicados o cruces sospechosos pueden quedar en revision y no suman hasta validarse."
  ];

  if (info.index === 0) {
    rules.push("La mision de TikTok puede dar 1 intento extra, pero no reemplaza los 3 referidos.");
  } else {
    rules.push("Primero debes completar el rango anterior para desbloquear este nivel.");
  }

  if (!state.customer.registered_at) {
    rules.push("Para reclamar cualquier premio debes registrar correo, WhatsApp y contrasena en Perfil.");
  }

  return rules;
}

function openLevelDetail(rewardId) {
  const reward = getRewardsForRoad().find((item) => String(item.id) === String(rewardId));
  if (!reward) return;
  const info = getLevelInfo(reward);
  const status = info.complete ? "Completado" : info.active ? "En progreso" : info.unlocked ? "Siguiente rango" : "Bloqueado";

  els.levelDetailIcon.innerHTML = `<i class="${reward.icon_class}"></i>`;
  els.levelDetailStatus.textContent = status;
  els.levelDetailTitle.textContent = rewardDisplayName(reward, info.index);
  els.levelDetailPrize.textContent = `Meta de rango: ${info.required} referidos validos`;
  els.levelDetailProgressText.textContent = `${Math.min(validReferrals(), info.required)}/${info.required} referidos para llegar a ${rewardDisplayName(reward, info.index)}`;
  els.levelDetailProgressBar.style.width = `${info.percent}%`;
  els.levelDetailRules.innerHTML = levelRules(reward, info).map((rule) => `
    <div class="level-rule-row">
      <i class="fa-solid fa-circle-check"></i>
      <span>${escapeHtml(rule)}</span>
    </div>
  `).join("");

  if (info.complete) {
    els.levelDetailAction.textContent = "Ver mis referidos";
    els.levelDetailAction.dataset.levelAction = "referrals";
  } else if (info.active || info.unlocked) {
    els.levelDetailAction.textContent = "Compartir mi link";
    els.levelDetailAction.dataset.levelAction = "refer";
  } else {
    els.levelDetailAction.textContent = "Sigue en el rango anterior";
    els.levelDetailAction.dataset.levelAction = "";
  }
  els.levelDetailAction.disabled = !info.complete && !info.active && !info.unlocked;
  els.levelDetailModal.hidden = false;
  els.levelDetailModal.classList.add("show");
}

function closeLevelDetailModal() {
  els.levelDetailModal.classList.remove("show");
  window.setTimeout(() => {
    els.levelDetailModal.hidden = true;
  }, 160);
}

function runLevelDetailAction() {
  const action = els.levelDetailAction.dataset.levelAction;
  if (!action) return;
  closeLevelDetailModal();
  setView(action);
}

function renderMissions() {
  const tiktokMission = getSocialMission("tiktok_follow");
  const tiktokStatus = tiktokMission?.status || "idle";
  const rows = state.missions.map((mission) => {
    if (Number(mission.id) === 2) {
      const attemptsExhausted = state.isRevealed && state.prizeAttempts >= state.maxPrizeAttempts;
      const prizeLocked = Boolean(state.customer.prize_locked_at);
      const disabled = (!attemptsExhausted || prizeLocked) && !["pending", "completed", "review"].includes(tiktokStatus);
      return `
        <article class="mission-row mission-feature ${tiktokStatus}">
          <div class="mission-icon"><i class="fa-brands fa-tiktok"></i></div>
          <div>
            <strong>Seguir TikTok</strong>
            <span>${escapeHtml(disabled ? "Se activa cuando agotas tus intentos." : tiktokMissionText(tiktokStatus))}</span>
          </div>
          <div class="mission-actions">
            ${tiktokStatus === "completed"
              ? `<b class="status-pill">+1 intento</b>`
              : tiktokStatus === "review"
                ? `<b class="status-pill">Revision</b>`
              : tiktokStatus === "pending"
                ? `<button type="button" data-tiktok-action="verify">Ya segui</button>`
                : `<button type="button" data-tiktok-action="start" ${disabled ? "disabled" : ""}>Ganar intento</button>`}
          </div>
        </article>
      `;
    }

    return `
      <article class="mission-row muted-mission">
        <div class="mission-icon"><i class="${mission.icon_class}"></i></div>
        <div><strong>${escapeHtml(mission.title)}</strong><span>Proximamente para energia extra.</span></div>
        <b class="status-pill">Pronto</b>
      </article>
    `;
  });
  els.missionRows.innerHTML = rows.join("");
}

function getSocialMission(key) {
  return state.socialMissions.find((mission) => mission.mission_key === key);
}

function tiktokMissionText(status) {
  if (status === "completed") return "Verificado. Tu rueda gano 1 intento extra.";
  if (status === "pending") return "Abre TikTok, sigue la cuenta y vuelve a verificar.";
  if (status === "review") return "En revision porque subieron varios seguidores juntos.";
  return "Cuando se acaben tus intentos, esta tarea te da 1 intento extra.";
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
  pendingReferralCode = ref;
}

function getPublicReferralCode() {
  return state.customer.public_referral_code || state.customer.custom_referral_code || state.customer.referral_code || `u${state.customer.id || 1}`;
}

async function revealPrize() {
  playUiSound("reveal");
  if (state.prizeAttempts >= state.maxPrizeAttempts) {
    const tiktokMission = getSocialMission("tiktok_follow");
    if (state.customer.prize_locked_at) {
      openPrizeModal();
      updatePrizeModal(state.selectedPrize, false);
      return;
    }
    if (tiktokMission?.status === "pending") {
      await verifyTikTokTask();
      return;
    }
    if (tiktokMission?.status !== "completed" && tiktokMission?.status !== "review") {
      openPrizeModal();
      updatePrizeModal(state.selectedPrize, false);
      return;
    }
    showToast(`Ya usaste tus ${state.maxPrizeAttempts} intentos. Comparte tu link para reclamar.`);
    return;
  }

  if (els.productWindow.classList.contains("spinning")) return;

  els.productWindow.classList.add("spinning");
  els.revealButton.disabled = true;
  els.revealButtonText.textContent = "BUSCANDO";
  els.revealButtonHint.textContent = "premio potencial";
  openPrizeModal();

  let result;
  try {
    const response = await fetch("/api/prizes/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" }
    });
    result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo revelar premio");
    state.maxPrizeAttempts = Number(result.max_prize_attempts || state.maxPrizeAttempts);
  } catch (error) {
    els.productWindow.classList.remove("spinning");
    closePrizeModal();
    render();
    showToast(error.message);
    return;
  }

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

  state.selectedPrize = result.prize;
  state.isRevealed = true;
  state.prizeAttempts = result.prize_attempts;
  state.maxPrizeAttempts = Number(result.max_prize_attempts || state.maxPrizeAttempts);
  if (state.prizeAttempts === 1) {
    convertPendingReferral();
  }
  els.productWindow.classList.remove("spinning");
  renderPrizeVisual(els.productIcon, state.selectedPrize);
  els.productName.textContent = state.selectedPrize.name;
  updatePrizeModal(state.selectedPrize, false);
  spawnSparks();
  render();
  const attemptsLeft = state.maxPrizeAttempts - state.prizeAttempts;
  showToast(attemptsLeft > 0
    ? `Premio revelado. Te quedan ${attemptsLeft} intentos.`
    : "Premio final revelado. Comparte para reclamar.");
}

function openPrizeModal() {
  playUiSound("modal");
  els.prizeModal.hidden = false;
  els.prizeModal.classList.add("show");
  els.keepPrizeButton.hidden = true;
  els.retryPrizeButton.hidden = true;
  const hasFinalPrize = state.isRevealed && state.prizeAttempts >= state.maxPrizeAttempts;
  if (hasFinalPrize) {
    updatePrizeModal(state.selectedPrize, false);
  } else {
    els.modalPrizeStage.classList.add("spinning");
    els.modalPrizeHint.textContent = `Intento ${state.prizeAttempts + 1} de ${state.maxPrizeAttempts}.`;
    updatePrizeModal(state.prizePool[0], true);
  }
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
  const canKeepPrize = state.isRevealed && !isSpinning;
  const canRetry = state.isRevealed && !isSpinning && state.prizeAttempts < state.maxPrizeAttempts;
  const tiktokMission = getSocialMission("tiktok_follow");
  const prizeLocked = Boolean(state.customer.prize_locked_at);
  const canStartTikTok = state.isRevealed && !isSpinning && !prizeLocked && state.prizeAttempts >= state.maxPrizeAttempts && tiktokMission?.status !== "completed" && tiktokMission?.status !== "review";
  els.attemptCounter.textContent = `Intento ${Math.max(1, state.prizeAttempts || nextAttempt)} de ${state.maxPrizeAttempts}`;
  els.modalPrizeImage.src = normalizePrizeImage(prize.image);
  els.modalPrizeImage.alt = prize.name;
  els.modalPrizeName.textContent = isSpinning ? "Buscando premio..." : prize.name;
  els.modalPrizeStage.classList.toggle("spinning", isSpinning);
  els.keepPrizeButton.hidden = !canKeepPrize;
  els.retryPrizeButton.hidden = !(canRetry || canStartTikTok);
  if (canStartTikTok) {
    els.retryPrizeButton.dataset.extraTask = tiktokMission?.status === "pending" ? "verify-tiktok" : "start-tiktok";
    els.retryPrizeButton.innerHTML = tiktokMission?.status === "pending"
      ? `<i class="fa-solid fa-circle-check"></i> Ya segui TikTok`
      : `<i class="fa-brands fa-tiktok"></i> Ganar 1 intento extra`;
  } else {
    delete els.retryPrizeButton.dataset.extraTask;
    els.retryPrizeButton.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Intentar de nuevo`;
  }
  els.modalPrizeHint.textContent = isSpinning
    ? `Intento ${state.prizeAttempts + 1} de ${state.maxPrizeAttempts}. No cierres todavia.`
    : attemptsLeftAfterThis > 0
      ? `Puedes intentar ${attemptsLeftAfterThis} vez mas o quedarte con este premio.`
      : canStartTikTok
        ? (tiktokMission?.status === "pending"
          ? "Cuando ya sigas nuestra cuenta, toca verificar para desbloquear 1 intento extra."
          : "Te quedaste sin intentos. Sigue nuestro TikTok y verifica la tarea para desbloquear 1 intento extra.")
        : prizeLocked
          ? "Elegiste quedarte con este premio. Completa los referidos para reclamarlo."
        : "Este es tu premio final. Completa los referidos para reclamarlo.";
}

function retryPrizeFromModal() {
  if (els.retryPrizeButton.dataset.extraTask === "start-tiktok") {
    startTikTokTask();
    return;
  }
  if (els.retryPrizeButton.dataset.extraTask === "verify-tiktok") {
    verifyTikTokTask();
    return;
  }
  if (state.prizeAttempts >= state.maxPrizeAttempts) return;
  revealPrize();
}

async function startTikTokTask() {
  const tiktokWindow = window.open("about:blank", "_blank");
  try {
    const response = await fetch("/api/social/tiktok/start", {
      method: "POST",
      headers: { "content-type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo iniciar la tarea");
    if (result.profile_url) {
      if (tiktokWindow) {
        tiktokWindow.location.href = result.profile_url;
      } else {
        window.location.href = result.profile_url;
      }
    }
    state.socialMissions = [
      ...state.socialMissions.filter((mission) => mission.mission_key !== "tiktok_follow"),
      {
        mission_key: "tiktok_follow",
        status: result.status || "pending",
        followers_before: result.followers_before,
        reward_type: "extra_attempt",
        reward_value: 1
      }
    ];
    updatePrizeModal(state.selectedPrize, false);
    renderMissions();
    showToast(result.message || "Tarea TikTok iniciada.");
    await loadState();
  } catch (error) {
    if (tiktokWindow) tiktokWindow.close();
    showToast(error.message);
  }
}

async function verifyTikTokTask() {
  try {
    els.retryPrizeButton.disabled = true;
    els.retryPrizeButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verificando`;
    const response = await fetch("/api/social/tiktok/verify", {
      method: "POST",
      headers: { "content-type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || "No se pudo verificar");
    showToast(result.message || "TikTok verificado.");
    await loadState({ animate: result.status === "completed" });
    if (result.status === "completed") {
      els.prizeModal.hidden = false;
      els.prizeModal.classList.add("show");
      updatePrizeModal(state.selectedPrize, false);
      els.modalPrizeHint.textContent = "Listo. Ganaste 1 intento extra. Puedes intentar de nuevo ahora o quedarte con tu premio.";
      els.retryPrizeButton.hidden = false;
      delete els.retryPrizeButton.dataset.extraTask;
      els.retryPrizeButton.disabled = false;
      els.retryPrizeButton.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Usar intento extra`;
    } else {
      const before = Number(result.followers_before ?? 0);
      const after = Number(result.followers_after ?? 0);
      els.modalPrizeHint.textContent = result.message || `Todavia no detecto subida (${before} -> ${after}). Espera unos segundos y verifica de nuevo.`;
      els.retryPrizeButton.hidden = false;
      els.retryPrizeButton.disabled = false;
      els.retryPrizeButton.dataset.extraTask = "verify-tiktok";
      els.retryPrizeButton.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verificar otra vez`;
    }
  } catch (error) {
    els.retryPrizeButton.disabled = false;
    els.retryPrizeButton.dataset.extraTask = "verify-tiktok";
    els.retryPrizeButton.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verificar otra vez`;
    showToast(error.message);
  }
}

function keepCurrentPrize() {
  if (!state.selectedPrize) return;
  fetch("/api/prizes/keep", {
    method: "POST",
    headers: { "content-type": "application/json" }
  })
    .then((response) => response.json().then((result) => ({ response, result })))
    .then(({ response, result }) => {
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el premio");
      state.selectedPrize = result.prize;
      state.prizeAttempts = result.prize_attempts;
      state.maxPrizeAttempts = Number(result.max_prize_attempts || state.maxPrizeAttempts);
      state.customer.prize_locked_at = result.prize_locked_at || new Date().toISOString();
      updatePrizeModal(state.selectedPrize, false);
      closePrizeModal();
      render();
      showToast("Premio elegido. Comparte tu link para reclamarlo.");
    })
    .catch((error) => showToast(error.message));
}

function openImageViewer() {
  const prize = resolvePrizeForDisplay(state.selectedPrize);
  if (!state.isRevealed || !prize?.image) return;
  openViewerImage(prize.name, normalizePrizeImage(prize.image));
}

function openViewerImage(name, src) {
  playUiSound("modal");
  viewerZoom = 1;
  els.viewerPrizeName.textContent = name;
  els.viewerPrizeImage.src = src;
  els.viewerPrizeImage.alt = name;
  updateViewerZoom();
  els.imageViewer.hidden = false;
  els.imageViewer.classList.add("show");
}

function openPlaceImageViewer() {
  openViewerImage("Dialcruz Importaciones + SGI Market", "dialcruz.png");
}

function closeImageViewer() {
  els.imageViewer.classList.remove("show");
  window.setTimeout(() => {
    els.imageViewer.hidden = true;
  }, 160);
}

function updateViewerZoom() {
  els.viewerPrizeImage.style.transform = `scale(${viewerZoom})`;
  els.zoomResetButton.textContent = `${Math.round(viewerZoom * 100)}%`;
}

function changeViewerZoom(delta) {
  viewerZoom = Math.max(1, Math.min(2.8, Number((viewerZoom + delta).toFixed(2))));
  updateViewerZoom();
}

function resetViewerZoom() {
  viewerZoom = 1;
  updateViewerZoom();
}

function handlePrizeImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  if (!image.matches(".prize-image, #modalPrizeImage, #viewerPrizeImage")) return;

  const fallback = webpFallbackForImage(image.getAttribute("src"));
  if (fallback && fallback !== image.getAttribute("src") && image.dataset.triedWebp !== "true") {
    image.dataset.triedWebp = "true";
    image.src = fallback;
    return;
  }

  image.classList.add("image-load-error");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function spawnSparks() {
  playUiSound("success");
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
    headers: { "content-type": "application/json" }
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
    state.selectedPrize = freshPrize || resolvePrizeForDisplay(state.selectedPrize);
  }
}

async function loadState(options = {}) {
  try {
    const previousCount = state.referralCount;
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error("api");
    const data = await response.json();
    state.customer = data.customer;
    state.referrals = data.referrals;
    state.referralCount = data.referralCount;
    state.rewards = data.rewards;
    state.currentReward = data.currentReward;
    state.missions = data.missions.filter((mission) => mission.is_active);
    state.socialMissions = data.socialMissions || [];
    state.goal = data.currentReward?.required_referrals || 3;
    state.maxPrizeAttempts = Number(data.customer.max_prize_attempts || data.max_prize_attempts || 3);
    state.prizeAttempts = Number(data.customer.prize_attempts || 0);
    state.selectedPrize = data.customer.selected_prize || null;
    state.isRevealed = Boolean(state.selectedPrize);

    if (options.animate && state.referralCount > previousCount) {
      spawnSparks();
      showToast("Nuevo referido validado. Energia aumentada.");
    }

    if (options.animate && previousCount < state.goal && state.referralCount >= state.goal && completionShownForGoal !== state.goal) {
      completionShownForGoal = state.goal;
      openLevelCompleteModal();
    }
  } catch {
    state.referralCount = Math.max(state.referralCount, 0);
  }

  render();
}

async function convertPendingReferral() {
  if (!pendingReferralCode || pendingReferralConverted) return;
  pendingReferralConverted = true;
  await submitReferralVisit(pendingReferralCode, "Visitante referido");
}

async function submitReferralVisit(ref, name) {
  try {
    const response = await fetch("/api/referrals/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referral_code: ref, name })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo validar");
    showToast(result.status === "valid"
      ? "Tu premio ya cuenta como referido."
      : `Quedo en estado: ${result.status}`);
    els.referredPanel.hidden = true;
  } catch {
    pendingReferralConverted = false;
  }
}

async function claimReward() {
  if (!state.isRevealed) {
    showToast("Primero revela tu premio potencial.");
    return;
  }

  if (state.referralCount < state.goal) {
    showToast(`Completa ${state.goal} referidos validos antes de reclamar.`);
    return;
  }

  if (!state.customer.registered_at) {
    showToast("Completa tu registro para reclamar el premio.");
    setView("profile");
    return;
  }

  try {
    const response = await fetch("/api/rewards/claim", {
      method: "POST",
      headers: { "content-type": "application/json" }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo crear el reclamo");
    showToast(result.already_exists ? "Tu reclamo ya estaba enviado." : "Solicitud de reclamo creada. Admin revisara la entrega.");
  } catch (error) {
    showToast(error.message);
  }
}

async function loadCaptcha() {
  try {
    captchaState.answer = "";
    const response = await fetch("/api/captcha/profile");
    if (!response.ok) throw new Error("captcha");
    const challenge = await response.json();
    captchaState.token = challenge.token;
    els.captchaPrompt.textContent = challenge.prompt;
    els.captchaOptions.innerHTML = challenge.choices.map((choice) => `
      <button type="button" data-captcha-answer="${choice.id}" aria-label="${choice.label}">
        <i class="${choice.icon}"></i>
        <span>${choice.label}</span>
      </button>
    `).join("");
  } catch {
    els.captchaPrompt.textContent = "No se pudo cargar el reto. Intenta de nuevo.";
    els.captchaOptions.innerHTML = "";
  }
}

function selectCaptchaAnswer(button) {
  captchaState.answer = button.dataset.captchaAnswer || "";
  els.captchaOptions.querySelectorAll("button").forEach((option) => {
    option.classList.toggle("selected", option === button);
  });
}

async function customizeReferralLink(event) {
  event.preventDefault();
  const password = els.profilePassword.value;
  const passwordConfirm = els.profilePasswordConfirm.value;
  if (password !== passwordConfirm) {
    showToast("Las contrasenas no coinciden.");
    return;
  }
  if (!captchaState.token || !captchaState.answer) {
    showToast("Completa el reto de iconos.");
    return;
  }

  try {
    els.customizeLinkButton.disabled = true;
    const response = await fetch("/api/profile/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: els.profileInputName.value,
        whatsapp_country_code: els.profileCountryCode.value,
        whatsapp_number: els.profileWhatsapp.value,
        email: els.profileEmail.value,
        custom_referral_code: els.profileAlias.value,
        password,
        captcha_token: captchaState.token,
        captcha_answer: captchaState.answer
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo registrar el perfil");
    state.customer = result.customer;
    els.profilePassword.value = "";
    els.profilePasswordConfirm.value = "";
    profileFormTouched = false;
    profileFormHydrated = false;
    await loadCaptcha();
    render();
    showToast("Perfil guardado. Tu link personalizado ya funciona.");
  } catch (error) {
    showToast(error.message);
    await loadCaptcha();
  } finally {
    els.customizeLinkButton.disabled = false;
  }
}

function togglePasswordVisibility(button) {
  const input = document.querySelector(`#${button.dataset.passwordToggle}`);
  if (!input) return;
  const nextType = input.type === "password" ? "text" : "password";
  input.type = nextType;
  button.innerHTML = nextType === "password"
    ? `<i class="fa-solid fa-eye"></i>`
    : `<i class="fa-solid fa-eye-slash"></i>`;
}

async function loginProfile(event) {
  event.preventDefault();
  try {
    els.loginButton.disabled = true;
    const response = await fetch("/api/profile/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: els.loginEmail.value,
        password: els.loginPassword.value
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo entrar");
    state.customer = result.customer;
    els.loginPassword.value = "";
    profileFormTouched = false;
    profileFormHydrated = false;
    await loadState();
    showToast("Cuenta recuperada. Tu progreso y link estan activos.");
  } catch (error) {
    showToast(error.message);
  } finally {
    els.loginButton.disabled = false;
  }
}

function copyReferral() {
  const value = els.referralLink.value;
  navigator.clipboard.writeText(value).then(() => {
    showToast("Link copiado.");
  }).catch(() => {
    els.referralLink.select();
    document.execCommand("copy");
    showToast("Link copiado.");
  });
}

function shareWhatsApp() {
  const text = encodeURIComponent(`Entra a SGI Market y descubre tu premio: ${els.referralLink.value}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

function shareFacebook() {
  const url = encodeURIComponent(els.referralLink.value);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

function openLevelCompleteModal() {
  const currentReward = state.currentReward || state.rewards.find((reward) => Number(reward.required_referrals) === Number(state.goal));
  const nextReward = state.rewards.find((reward) => Number(reward.required_referrals) > Number(state.goal));
  const currentIndex = Math.max(0, state.rewards.findIndex((reward) => String(reward.id) === String(currentReward?.id)));
  const nextIndex = Math.max(0, state.rewards.findIndex((reward) => String(reward.id) === String(nextReward?.id)));
  els.levelCompleteTitle.textContent = `${rewardDisplayName(currentReward, currentIndex)} completado`;
  els.levelCompleteText.textContent = nextReward
    ? `Tu premio esta listo para reclamar. Tambien desbloqueaste el rango ${rewardDisplayName(nextReward, nextIndex)}.`
    : "Tu premio esta listo para reclamar. Sigue compartiendo para mejores beneficios.";
  els.levelCompleteModal.hidden = false;
  els.levelCompleteModal.classList.add("show");
  spawnSparks();
}

function closeLevelCompleteModal() {
  els.levelCompleteModal.classList.remove("show");
  window.setTimeout(() => {
    els.levelCompleteModal.hidden = true;
  }, 160);
}

function showToast(message) {
  const lowerMessage = String(message || "").toLowerCase();
  if (/(error|no se pudo|bloqueado|faltan|coinciden|primero|completa|todavia|intenta)/.test(lowerMessage)) {
    playUiSound("error");
  }
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

document.addEventListener("click", playButtonTap, true);
els.revealButton.addEventListener("click", revealPrize);
els.claimButton.addEventListener("click", claimReward);
els.profileForm.addEventListener("submit", customizeReferralLink);
els.profileForm.addEventListener("input", () => {
  profileFormTouched = true;
});
els.loginForm.addEventListener("submit", loginProfile);
els.captchaRefreshButton.addEventListener("click", loadCaptcha);
els.captchaOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-captcha-answer]");
  if (button) selectCaptchaAnswer(button);
});
els.missionRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tiktok-action]");
  if (!button) return;
  if (button.dataset.tiktokAction === "start") startTikTokTask();
  if (button.dataset.tiktokAction === "verify") verifyTikTokTask();
});
els.levelRoad.addEventListener("click", (event) => {
  const button = event.target.closest("[data-level-detail]");
  if (button) openLevelDetail(button.dataset.levelDetail);
});
document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => togglePasswordVisibility(button));
});
els.copyButton.addEventListener("click", copyReferral);
els.copyInlineButton.addEventListener("click", copyReferral);
els.whatsappButton.addEventListener("click", shareWhatsApp);
els.facebookButton.addEventListener("click", shareFacebook);
els.closePrizeModal.addEventListener("click", closePrizeModal);
els.retryPrizeButton.addEventListener("click", retryPrizeFromModal);
els.keepPrizeButton.addEventListener("click", keepCurrentPrize);
els.productWindow.addEventListener("click", openImageViewer);
els.placePhoto.addEventListener("click", openPlaceImageViewer);
els.closeImageViewer.addEventListener("click", closeImageViewer);
els.zoomOutButton.addEventListener("click", () => changeViewerZoom(-0.25));
els.zoomInButton.addEventListener("click", () => changeViewerZoom(0.25));
els.zoomResetButton.addEventListener("click", resetViewerZoom);
els.imageViewer.addEventListener("click", (event) => {
  if (event.target === els.imageViewer) closeImageViewer();
});
els.closeLevelCompleteModal.addEventListener("click", closeLevelCompleteModal);
els.completeClaimButton.addEventListener("click", () => {
  closeLevelCompleteModal();
  claimReward();
});
els.completeReferralsButton.addEventListener("click", () => {
  closeLevelCompleteModal();
  setView("referrals");
});
els.levelCompleteModal.addEventListener("click", (event) => {
  if (event.target === els.levelCompleteModal) closeLevelCompleteModal();
});
els.closeLevelDetailModal.addEventListener("click", closeLevelDetailModal);
els.levelDetailAction.addEventListener("click", runLevelDetailAction);
els.levelDetailModal.addEventListener("click", (event) => {
  if (event.target === els.levelDetailModal) closeLevelDetailModal();
});
els.prizeModal.addEventListener("click", (event) => {
  if (event.target === els.prizeModal && !els.retryPrizeButton.dataset.extraTask) closePrizeModal();
});
document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.nav));
});
document.addEventListener("error", handlePrizeImageError, true);

loadPrizePool().then(() => {
  render();
});
initDevice();
loadState();
loadCaptcha();
pollTimer = window.setInterval(() => loadState({ animate: true }), 5000);
