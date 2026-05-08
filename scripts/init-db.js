const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
require("dotenv").config();

const defaultUrl = "postgres://postgres:postgres@localhost:5432/sgi_referral";

function getDatabaseConfig() {
  const databaseUrl = new URL(process.env.DATABASE_URL || defaultUrl);
  const databaseName = databaseUrl.pathname.replace("/", "");
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error("Nombre de base de datos invalido en DATABASE_URL");
  }
  const maintenanceUrl = new URL(databaseUrl.toString());
  maintenanceUrl.pathname = "/postgres";

  return {
    databaseName,
    databaseUrl: databaseUrl.toString(),
    maintenanceUrl: maintenanceUrl.toString()
  };
}

async function ensureDatabase() {
  const { databaseName, maintenanceUrl } = getDatabaseConfig();
  const pool = new Pool({ connectionString: maintenanceUrl });

  try {
    const exists = await pool.query("select 1 from pg_database where datname = $1", [databaseName]);
    if (!exists.rowCount) {
      await pool.query(`create database ${databaseName}`);
      console.log(`Base de datos creada: ${databaseName}`);
    }
  } finally {
    await pool.end();
  }
}

async function main() {
  await ensureDatabase();
  const { databaseUrl } = getDatabaseConfig();
  const pool = new Pool({ connectionString: databaseUrl });
  const schemaPath = path.join(__dirname, "..", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  try {
    await pool.query(schema);
    console.log("Base de datos inicializada.");
  } finally {
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(error.message);
  process.exit(1);
});
