import logger from "../utils/logger.js";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_NAME,
  DB_PORT,
  NODE_ENV,
  DB_NAME_TEST,
  DATABASE_URL,
} = process.env;

const isProduction = NODE_ENV === "production";
// if (!isProduction && (!DB_HOST || !DB_PASSWORD || !DB_NAME || !DB_USER || !DB_PORT)) {
//   logger.error(
//     `Database environment variables are missing! Missing: ${[
//       !DB_HOST && "DB_HOST",
//       !DB_PASSWORD && "DB_PASSWORD",
//       !DB_NAME && "DB_NAME",
//       !DB_USER && "DB_USER",
//       !DB_PORT && "DB_PORT",
//     ]
//       .filter(Boolean)
//       .join(", ")}`
//   );
//   process.exit(1);
// }



const pool = isProduction
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // nécessaire pour Railway.
    })
  : new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME,
      password: DB_PASSWORD,
      port: parseInt(DB_PORT, 10),
      connectionTimeoutMillis: 2000,
    });

logger.info(`Database is configured for: ${DB_NAME}`);

pool.on("connect", (client) => {
  logger.info(`Client connected from Pool (Total count: ${pool.totalCount})`);
});

pool.on("error", (err, client) => {
  logger.error("Unexpected error on idle client in pool", err);
  process.exit(-1);
});

const initialzeDbSchema = async () => {
  const client = await pool.connect();
  try {
    logger.info("Initializing database schema...");
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        adresse VARCHAR(50),
        phone VARCHAR(20),
        profile_image_url VARCHAR(255),
        created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info(`users table has been created`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS short_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        expires_at TIMESTAMPTZ,
        click_count INTEGER DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info(`short_links table has been created`);

    await client.query(`
        CREATE TABLE IF NOT EXISTS click_logs  (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) NOT NULL REFERENCES short_links(short_code) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
        ip INET,
        user_agent TEXT,
        referer TEXT,
        created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info(`click_logs table has been created`);
    await client.query(`
      ALTER TABLE short_links
      ADD COLUMN IF NOT EXISTS short_link TEXT;
    `);
    logger.info(
      `Added 'short_link' column to short_links table (if not exists)`
    );

    //create the pg_trigger fuction
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    logger.debug("update_updated_at_column function ensured.");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS ( SELECT 1 FROM pg_trigger
          WHERE tgname = 'set_updated_at_users') THEN 
          CREATE TRIGGER set_updated_at_users
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("users update_at Trigger is checked and created");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS ( SELECT 1 FROM pg_trigger
          WHERE tgname = 'set_updated_at_short_links') THEN 
          CREATE TRIGGER set_updated_at_short_links
          BEFORE UPDATE ON short_links 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("short_links update_at Trigger is checked and created");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS ( SELECT 1 FROM pg_trigger
          WHERE tgname = 'set_updated_at_click_logs') THEN 
          CREATE TRIGGER set_updated_at_click_logs
          BEFORE UPDATE ON click_logs 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("click_logs update_at Trigger is checked and created");

    logger.info(
      `add a PostgreSQL trigger that automatically updates the updated_at field`
    );

    //creer user index
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`
    );

    //create short_links index
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON short_links(user_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_short_links_expires_at ON short_links(expires_at);`
    );

    //create click_logs index
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_click_logs_short_code ON click_logs(short_code);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_click_logs_timestamp ON click_logs(timestamp);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_click_logs_ip ON click_logs(ip);`
    );

    logger.info(`successfully created index`);
  } catch (error) {
    logger.error(`Error while initializing the schema`, error);
    process.exit(1);
  } finally {
    client.release();
  }
};

const connectToDb = async () => {
  
  try {
    logger.info("⏳ Connecting to PostgreSQL...");
    const client = await pool.connect();
    logger.info(`Database connection pool established successfully`);
    client.release();
  } catch (error) {
    logger.error("Unable to establish database connection pool", error);
    process.exit(1);
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const response = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info(
      `Executed query: { text: ${text.substring(
        0,
        100
      )}..., params: ${JSON.stringify(
        params
      )}, duration: ${duration}ms, rows: ${response.rowCount}}`
    );
    return response;
  } catch (error) {
    logger.error(
      `Error executing query: { text: ${text.substring(
        0,
        100
      )}..., params: ${JSON.stringify(params)}, error: ${error.message}}`
    );
    throw error;
  }
};

export { pool, connectToDb, query, initialzeDbSchema };
