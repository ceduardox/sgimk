require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/sgi_referral"
});

async function query(text, params) {
  return pool.query(text, params);
}

async function ensureCustomerForDevice(deviceId) {
  const mappedDevice = await query(
    `select customers.id
     from device_fingerprints
     join customers on customers.id = device_fingerprints.customer_id
     where device_fingerprints.device_id = $1`,
    [deviceId]
  );
  if (mappedDevice.rowCount) {
    return mappedDevice.rows[0].id;
  }

  const existing = await query("select id from customers where device_id = $1", [deviceId]);
  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const inserted = await query(
    `insert into customers (name, referral_code, device_id, avatar_url)
     values ('Jugador SGI', $2, $1, 'icono-sgi.jpg')
     returning id`,
    [deviceId, `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`]
  );
  const id = inserted.rows[0].id;
  await query(
    "update customers set referral_code = $1, name = $2 where id = $3",
    [`u${id}`, `Jugador ${id}`, id]
  );
  return id;
}

async function getClubState(customerId = 1) {
  const client = await pool.connect();
  try {
    const [customer, referrals, validReferrals, rewards, missions, socialMissions, rewardClaims] = await Promise.all([
      client.query("select * from customers where id = $1", [customerId]),
      client.query(
        "select * from referrals where customer_id = $1 order by created_at desc",
        [customerId]
      ),
      client.query(
        "select * from referrals where customer_id = $1 and status = 'valid' order by created_at desc",
        [customerId]
      ),
      client.query("select * from rewards order by required_referrals asc"),
      client.query("select * from missions order by id asc"),
      client.query("select * from social_missions where customer_id = $1 order by created_at desc", [customerId]),
      client.query("select * from reward_claims where customer_id = $1 order by created_at desc", [customerId])
    ]);

    if (!customer.rows[0]) {
      throw new Error("Cliente no encontrado");
    }

    const referralCount = validReferrals.rows.length;
    const currentReward = rewards.rows.find((reward) => referralCount <= reward.required_referrals) || rewards.rows[rewards.rows.length - 1];
    const customerData = { ...customer.rows[0] };
    delete customerData.password_hash;
    customerData.max_prize_attempts = 3 + Number(customerData.extra_prize_attempts || 0);

    return {
      customer: {
        ...customerData,
        public_referral_code: customerData.custom_referral_code || customerData.referral_code,
        selected_prize: customerData.selected_prize_id ? {
          id: customerData.selected_prize_id,
          name: customerData.selected_prize_name,
          image: customerData.selected_prize_image,
          level: "bronce"
        } : null
      },
      referrals: referrals.rows,
      referralCount,
      currentReward,
      rewards: rewards.rows,
      missions: missions.rows,
      socialMissions: socialMissions.rows,
      rewardClaims: rewardClaims.rows
    };
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  ensureCustomerForDevice,
  getClubState
};
