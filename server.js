require("dotenv").config();

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { ensureCustomerForDevice, getClubState, query } = require("./db");

const rootDir = __dirname;
const port = Number(process.env.PORT || 8080);
const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return cryptoSafeCompare(leftBuffer, rightBuffer);
}

function cryptoSafeCompare(leftBuffer, rightBuffer) {
  let result = 0;
  for (let index = 0; index < leftBuffer.length; index += 1) {
    result |= leftBuffer[index] ^ rightBuffer[index];
  }
  return result === 0;
}

function isAdminAuthorized(req) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Basic ")) return false;

  try {
    const credentials = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const separator = credentials.indexOf(":");
    if (separator === -1) return false;
    const username = credentials.slice(0, separator);
    const password = credentials.slice(separator + 1);
    return timingSafeEqualString(username, adminUser) && timingSafeEqualString(password, adminPassword);
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  if (isAdminAuthorized(req)) return true;
  if (req.url.startsWith("/api/")) {
    sendJson(res, 401, { error: "Admin no autorizado" });
    return false;
  }

  res.writeHead(401, {
    "www-authenticate": 'Basic realm="SGI Admin", charset="UTF-8"',
    "content-type": "text/plain; charset=utf-8"
  });
  res.end("Admin no autorizado");
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body demasiado grande"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket.remoteAddress || "";
}

async function upsertDevice(deviceId, req) {
  if (!deviceId) return;
  await query(
    `insert into device_fingerprints (device_id, first_ip, last_ip, user_agent)
     values ($1, $2, $2, $3)
     on conflict (device_id) do update set
       last_ip = excluded.last_ip,
       user_agent = excluded.user_agent,
       seen_count = device_fingerprints.seen_count + 1,
       last_seen_at = now()`,
    [deviceId, getClientIp(req), req.headers["user-agent"] || ""]
  );
}

async function evaluateReferral({ customerId, deviceId, req }) {
  const reasons = [];
  let score = 0;
  let status = "valid";
  const ip = getClientIp(req);

  const sameDevice = await query(
    "select count(*)::int as count from referrals where customer_id = $1 and referred_device_id = $2",
    [customerId, deviceId]
  );
  if (deviceId && sameDevice.rows[0].count > 0) {
    score += 90;
    reasons.push("device_repeated_for_referrer");
    status = "rejected";
  }

  const ipDay = await query(
    "select count(*)::int as count from referrals where referred_ip = $1 and created_at > now() - interval '24 hours'",
    [ip]
  );
  if (ipDay.rows[0].count >= 3) {
    score += 40;
    reasons.push("ip_daily_limit");
    if (status !== "rejected") status = "review";
  }

  return { status, score, reasons };
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/admin.html" && !requireAdmin(req, res)) {
    return;
  }

  if (url.pathname.startsWith("/r/")) {
    const code = encodeURIComponent(url.pathname.slice(3).trim());
    res.writeHead(302, { location: `/index.html?ref=${code}` });
    res.end();
    return;
  }

  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(rootDir, pathname));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/admin/") && !requireAdmin(req, res)) {
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/prizes/")) {
    const level = decodeURIComponent(url.pathname.split("/").pop() || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const prizeDir = path.join(rootDir, "premios", level);

    fs.readdir(prizeDir, { withFileTypes: true }, (error, entries) => {
      if (error) {
        sendJson(res, 200, { prizes: [] });
        return;
      }

      const prizes = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((filename) => [".jpg", ".jpeg", ".png", ".webp"].includes(path.extname(filename).toLowerCase()))
        .sort((a, b) => a.localeCompare(b))
        .map((filename) => ({
          id: `${level}-${path.basename(filename, path.extname(filename)).toLowerCase()}`,
          name: prizeNameFromFile(filename),
          level,
          image: `/premios/${level}/${encodeURIComponent(filename)}`
        }));

      sendJson(res, 200, { prizes });
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const deviceId = String(url.searchParams.get("device_id") || "").trim();
    const customerId = await ensureCustomerForDevice(deviceId);
    if (deviceId) await upsertDevice(deviceId, req);
    const state = await getClubState(customerId);
    sendJson(res, 200, state);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/referrers/")) {
    const code = decodeURIComponent(url.pathname.split("/").pop());
    const result = await query(
      "select id, name, referral_code, custom_referral_code, avatar_url from customers where referral_code = $1 or custom_referral_code = $1",
      [code]
    );
    if (!result.rowCount) {
      sendJson(res, 404, { error: "Referidor no encontrado" });
      return;
    }
    const referrer = result.rows[0];
    sendJson(res, 200, {
      ...referrer,
      public_referral_code: referrer.custom_referral_code || referrer.referral_code
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/referrals") {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    const customerId = await ensureCustomerForDevice(String(body.device_id || "").trim());
    const name = String(body.name || "").trim() || `Referido ${Date.now()}`;
    const phone = String(body.phone || "").trim();

    const result = await query(
      "insert into referrals (customer_id, referred_name, referred_phone, status) values ($1, $2, $3, 'valid') returning *",
      [customerId, name, phone]
    );
    sendJson(res, 201, result.rows[0]);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/device/init") {
    const body = await readBody(req);
    const deviceId = String(body.device_id || "").trim();
    await upsertDevice(deviceId, req);
    sendJson(res, 200, { ok: true, device_id: deviceId });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/reset-test-data") {
    const body = await readBody(req);
    if (String(body.confirm || "") !== "BORRAR") {
      sendJson(res, 400, { error: "Confirmacion invalida" });
      return;
    }

    await query("truncate table reward_claims, referrals, device_fingerprints, customers restart identity cascade");
    const counts = await getTableCounts(["customers", "referrals", "reward_claims", "device_fingerprints", "rewards", "missions"]);
    sendJson(res, 200, { ok: true, counts });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/referrals/convert") {
    const body = await readBody(req);
    const referralCode = String(body.referral_code || "").trim();
    const deviceId = String(body.device_id || "").trim();
    const name = String(body.name || "").trim() || "Visitante referido";

    const customer = await query(
      "select * from customers where referral_code = $1 or custom_referral_code = $1",
      [referralCode]
    );
    if (!customer.rowCount) {
      sendJson(res, 404, { error: "Codigo de referido no encontrado" });
      return;
    }

    const referredCustomerId = await ensureCustomerForDevice(deviceId);
    if (Number(customer.rows[0].id) === Number(referredCustomerId)) {
      sendJson(res, 400, { error: "No puedes validarte con tu propio link" });
      return;
    }

    await upsertDevice(deviceId, req);
    const risk = await evaluateReferral({ customerId: customer.rows[0].id, deviceId, req });
    const result = await query(
      `insert into referrals
        (customer_id, referred_name, referred_device_id, referred_ip, referred_user_agent, status, risk_score, risk_reasons)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        customer.rows[0].id,
        name,
        deviceId,
        getClientIp(req),
        req.headers["user-agent"] || "",
        risk.status,
        risk.score,
        JSON.stringify(risk.reasons)
      ]
    );
    sendJson(res, 201, result.rows[0]);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rewards/claim") {
    const body = await readBody(req);
    const customerId = await ensureCustomerForDevice(String(body.device_id || "").trim());
    const googleEmail = String(body.google_email || "").trim();
    const selectedPrize = body.selected_prize && typeof body.selected_prize === "object" ? body.selected_prize : {};
    const selectedPrizeName = String(selectedPrize.name || "").trim();
    const selectedPrizeImage = String(selectedPrize.image || "").trim();
    const validCount = await query(
      "select count(*)::int as count from referrals where customer_id = $1 and status = 'valid'",
      [customerId]
    );
    const result = await query(
      `insert into reward_claims
        (customer_id, google_email, google_subject, selected_prize_name, selected_prize_image, status, valid_referrals_count)
       values ($1, $2, $3, $4, $5, 'pending_google', $6)
       returning *`,
      [customerId, googleEmail, String(body.google_subject || ""), selectedPrizeName, selectedPrizeImage, validCount.rows[0].count]
    );
    sendJson(res, 201, result.rows[0]);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/profile/link") {
    const body = await readBody(req);
    const customerId = await ensureCustomerForDevice(String(body.device_id || "").trim());
    const googleEmail = String(body.google_email || "").trim().toLowerCase();
    const googleSubject = String(body.google_subject || "").trim() || `demo:${googleEmail}`;
    const requestedCode = String(body.custom_referral_code || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\\-]/g, "");

    if (!googleEmail || !googleEmail.includes("@")) {
      sendJson(res, 400, { error: "Debes autenticar con Google demo para personalizar link" });
      return;
    }

    if (!/^[a-z0-9][a-z0-9_-]{2,24}$/.test(requestedCode)) {
      sendJson(res, 400, { error: "Alias invalido. Usa 3 a 25 letras, numeros, guion o guion bajo" });
      return;
    }

    const result = await query(
      `update customers
       set custom_referral_code = $1, google_email = $2, google_subject = $3, name = coalesce(nullif($4, ''), name)
       where id = $5
       returning id, name, referral_code, custom_referral_code, google_email`,
      [requestedCode, googleEmail, googleSubject, String(body.name || "").trim(), customerId]
    );

    sendJson(res, 200, {
      customer: {
        ...result.rows[0],
        public_referral_code: result.rows[0].custom_referral_code || result.rows[0].referral_code
      }
    });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/referrals/")) {
    if (!requireAdmin(req, res)) return;
    const deviceId = String(url.searchParams.get("device_id") || "").trim();
    const customerId = await ensureCustomerForDevice(deviceId);
    const id = Number(url.pathname.split("/").pop());
    await query("delete from referrals where id = $1 and customer_id = $2", [id, customerId]);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/missions/")) {
    if (!requireAdmin(req, res)) return;
    const id = Number(url.pathname.split("/").pop());
    const body = await readBody(req);
    const result = await query(
      "update missions set is_completed = coalesce($1, is_completed), is_active = coalesce($2, is_active) where id = $3 returning *",
      [
        typeof body.is_completed === "boolean" ? body.is_completed : null,
        typeof body.is_active === "boolean" ? body.is_active : null,
        id
      ]
    );
    sendJson(res, 200, result.rows[0]);
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/rewards/")) {
    if (!requireAdmin(req, res)) return;
    const id = Number(url.pathname.split("/").pop());
    const body = await readBody(req);
    const result = await query(
      "update rewards set prize_name = coalesce($1, prize_name), required_referrals = coalesce($2, required_referrals), is_locked = coalesce($3, is_locked) where id = $4 returning *",
      [
        body.prize_name ? String(body.prize_name).trim() : null,
        Number.isFinite(Number(body.required_referrals)) ? Number(body.required_referrals) : null,
        typeof body.is_locked === "boolean" ? body.is_locked : null,
        id
      ]
    );
    sendJson(res, 200, result.rows[0]);
    return;
  }

  sendJson(res, 404, { error: "Ruta API no encontrada" });
}

function prizeNameFromFile(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getTableCounts(tableNames) {
  const entries = [];
  for (const tableName of tableNames) {
    const result = await query(`select count(*)::int as count from ${tableName}`);
    entries.push([tableName, result.rows[0].count]);
  }
  return Object.fromEntries(entries);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`SGI Referral listo en http://0.0.0.0:${port}`);
});
