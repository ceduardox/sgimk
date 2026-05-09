const els = {
  customer: document.querySelector("#adminCustomer"),
  customerSelect: document.querySelector("#adminCustomerSelect"),
  referrals: document.querySelector("#adminReferrals"),
  reward: document.querySelector("#adminReward"),
  referralForm: document.querySelector("#referralForm"),
  referralList: document.querySelector("#adminReferralList"),
  rewards: document.querySelector("#adminRewards"),
  missions: document.querySelector("#adminMissions"),
  resetTestDataButton: document.querySelector("#resetTestDataButton"),
  toast: document.querySelector("#toast")
};

let toastTimer;
let selectedCustomerId = "";

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Error de API");
  }
  return response.json();
}

async function loadAdmin() {
  try {
    const suffix = selectedCustomerId ? `?customer_id=${encodeURIComponent(selectedCustomerId)}` : "";
    const state = await api(`/api/admin/state${suffix}`);
    selectedCustomerId = state.customer?.id ? String(state.customer.id) : "";
    renderAdmin(state);
  } catch (error) {
    showToast(`No se pudo cargar DB: ${error.message}`);
  }
}

function renderAdmin(state) {
  els.customerSelect.innerHTML = state.customers.length
    ? state.customers.map((customer) => `
      <option value="${customer.id}" ${String(customer.id) === String(state.customer.id) ? "selected" : ""}>
        ${customer.name} - /r/${customer.public_referral_code}
      </option>
    `).join("")
    : `<option value="">Sin usuarios</option>`;

  els.customer.textContent = state.customer?.name || "-";
  els.referrals.textContent = String(state.referralCount);
  els.reward.textContent = state.currentReward?.prize_name || "-";

  els.referralList.innerHTML = state.referrals.length
    ? state.referrals.map((referral) => `
      <div class="admin-row">
        <div>
          <strong>${referral.referred_name}</strong>
          <span>${referral.referred_phone || "Sin telefono"} - ${referral.status}</span>
        </div>
        <div class="row-actions">
          <button class="danger" data-delete-referral="${referral.id}" type="button">Eliminar</button>
        </div>
      </div>
    `).join("")
    : `<div class="admin-row"><span>No hay referidos.</span></div>`;

  els.rewards.innerHTML = state.rewards.map((reward) => `
    <div class="admin-row">
      <div>
        <strong>Rango ${reward.rank_number}: ${reward.prize_name}</strong>
        <span>Meta: ${reward.required_referrals} referidos - ${reward.is_locked ? "Bloqueado" : "Visible"}</span>
      </div>
      <div class="row-actions">
        <button class="blue" data-edit-reward="${reward.id}" type="button">Editar</button>
      </div>
    </div>
  `).join("");

  els.missions.innerHTML = state.missions.map((mission) => `
    <div class="admin-row">
      <div>
        <strong>${mission.title}</strong>
        <span>+${mission.reward_points} puntos - ${mission.is_completed ? "Completada" : "Pendiente"}</span>
      </div>
      <div class="row-actions">
        <button class="blue" data-toggle-mission="${mission.id}" data-completed="${mission.is_completed}" type="button">
          ${mission.is_completed ? "Marcar pendiente" : "Completar"}
        </button>
      </div>
    </div>
  `).join("");
}

els.referralForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(els.referralForm);

  try {
    await api("/api/referrals", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        customer_id: selectedCustomerId
      })
    });
    els.referralForm.reset();
    showToast("Referido agregado.");
    await loadAdmin();
  } catch (error) {
    showToast(error.message);
  }
});

els.customerSelect.addEventListener("change", async () => {
  selectedCustomerId = els.customerSelect.value;
  await loadAdmin();
});

els.resetTestDataButton.addEventListener("click", async () => {
  const confirmation = window.prompt("Escribe BORRAR para reiniciar usuarios, referidos, reclamos y dispositivos");
  if (confirmation !== "BORRAR") {
    showToast("Reinicio cancelado.");
    return;
  }

  try {
    const result = await api("/api/admin/reset-test-data", {
      method: "POST",
      body: JSON.stringify({ confirm: "BORRAR" })
    });
    showToast(`Datos reiniciados. Usuarios: ${result.counts.customers}`);
    await loadAdmin();
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-referral]");
  const missionButton = event.target.closest("[data-toggle-mission]");
  const rewardButton = event.target.closest("[data-edit-reward]");

  try {
    if (deleteButton) {
      await api(`/api/referrals/${deleteButton.dataset.deleteReferral}`, { method: "DELETE" });
      showToast("Referido eliminado.");
      await loadAdmin();
    }

    if (missionButton) {
      const isCompleted = missionButton.dataset.completed === "true";
      await api(`/api/missions/${missionButton.dataset.toggleMission}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed: !isCompleted })
      });
      showToast("Mision actualizada.");
      await loadAdmin();
    }

    if (rewardButton) {
      const prizeName = window.prompt("Nuevo nombre del premio");
      const required = window.prompt("Meta de referidos");
      if (!prizeName && !required) return;

      await api(`/api/rewards/${rewardButton.dataset.editReward}`, {
        method: "PATCH",
        body: JSON.stringify({
          prize_name: prizeName || undefined,
          required_referrals: required ? Number(required) : undefined
        })
      });
      showToast("Premio actualizado.");
      await loadAdmin();
    }
  } catch (error) {
    showToast(error.message);
  }
});

loadAdmin();
