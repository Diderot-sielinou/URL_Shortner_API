import { describe, it, before, after,beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../app.js";
import { pool, connectToDb, initialzeDbSchema, query } from "../config/db.js";

const testUserEmail = `test_${Date.now()}@example.com`;
const testUserPassword = "TestPassword123";
const testFirstName = "fonou";
const testLastName = "yvan";
const testAdresse = "douala";
const testPhone = "+237675677889";

let authToken = null;
let userId = null;
const randomCode = "Ta" + Math.random().toString(36).substring(2, 6);
let short_code= null

const data = {
  expiresAtString: "08/05/2025",
  originalUrl:
    "https://portal.rebaseacademy.com/dashboard/projects/zelNDfnCtSNje5gCSlpY",
};

describe("Short Link API (/api/)", () => {
  before(async () => {
    await connectToDb();
    await initialzeDbSchema();

    // Supprimer utilisateur test si présent
    await query("DELETE FROM users WHERE email = $1", [testUserEmail]);

    await query("DELETE FROM short_links WHERE id = $1", [userId]);

    // register
    await request(app)
      .post("/api/auth/register")
      .send({
        firstName: testFirstName,
        lastName: testLastName,
        email: testUserEmail,
        password: testUserPassword,
        adresse: testAdresse,
        phone: testPhone,
      })
      .expect(201);

    // Connexion
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUserEmail,
        password: testUserPassword,
      })
      .expect(200);

    authToken = res.body.token;
    userId = res.body.User.id
    assert(authToken, "JWT token must be set");
  });

  describe("POST /shorten", () => {
    it("should create a short link successfully", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shortCode: randomCode,
          expiresAtString: "15/05/2025",
          originalUrl:
            "https://verpex.com/blog/website-tips/free-public-apis-for-developers?ref=dailydev",
        })
        .expect("Content-Type", /json/)
        .expect(201);

      assert.strictEqual(res.body.message, "Short URL created successfully");
      assert(res.body.shortUrl, "The shortened link must be returned");

    });

    it("should fail if no token is provided", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .send({
          ...data,
        })
        .expect(401);

      assert.strictEqual(
        res.body.message,
        "No token, authorication has been denied"
      );
    });

    it("should fail with invalid URL", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          originalUrl: "not_a_url",
        })
        .expect(400);

      assert(res.body.message, "should return a message");
    });

    it("should fail with invalid shortCode", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...data,
          shortCode: "T5",
        })
        .expect(400);

      assert(res.body.message, "should return a message");
    });

    it("should fail with invalid date", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...data,
          expiresAtString:"12/01/2023"
        })
        .expect(400);

      assert.strictEqual(res.body.message, "Expiration date must be in the future");
    });
  });

  describe("GET/my-urls", () => {
    beforeEach(async () => {
      // Create a new short url to ensure there's something to get
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          expiresAtString: "12/05/2025",
          originalUrl:
            "https://verpex.com/blog/website-tips/free-public-apis-for-developers?ref=dailydev",
        })
        .expect("Content-Type", /json/)
        .expect(201);
    });

    it("should return all short links created by the authenticated user", async () => {
      const res = await request(app)
        .get("/api/my-urls")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      assert.strictEqual(res.body.message, "Successfully retrieved short URLs");
      assert(Array.isArray(res.body.results), "results should be a table");
    });

    it("should fail if no token is provided", async () => {
      const res = await request(app)
        .get("/api/my-urls")
        .expect(401);

      assert.strictEqual(
        res.body.message,
        "No token, authorication has been denied"
      );
    });
  });

  describe("GET /:shortCode", () => {
    beforeEach(async () => {
      // Create a new short url to ensure there's something to get
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          expiresAtString: "12/05/2025",
          originalUrl:
            "https://www.freecodecamp.org/news/how-to-harden-your-nodejs-apis-security-best-practices/?ref=dailydev",
        })
        .expect("Content-Type", /json/)
        .expect(201);

        short_code = res.body.shortCode
    });

    it('should redirect to original link',async()=>{
      const res = await request(app)
      .get(`/${short_code}`)
      .expect(301)

      assert.strictEqual(
        res.headers.location,
        "https://www.freecodecamp.org/news/how-to-harden-your-nodejs-apis-security-best-practices/?ref=dailydev"
      );
    })

  });

  after(async () => {
    if (userId) {
      console.log(`--- Cleaning up short links for user ID: ${userId} ---`);
      try {
        await query("DELETE FROM short_links WHERE user_id = $1", [userId]);

      } catch (err) {
        console.error("Cleanup error (short link):", err.message);
      }
    }

    try {
      await query("DELETE FROM users WHERE email = $1", [testUserEmail]);
      console.log(`--- Cleaning up test user: ${testUserEmail} ---`);
    } catch (err) {
      console.error("Cleanup error (user):", err.message);
    }

    await pool.end(); // Fermeture finale
  });
});
