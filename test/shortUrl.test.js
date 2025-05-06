import { describe, it, before,after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../app.js";
import {pool ,connectToDb, initialzeDbSchema, query } from "../config/db.js";

const testUserEmail = `test_${Date.now()}@example.com`;
const testUserPassword = "TestPassword123";
const testFirstName = "fonou";
const testLastName = "yvan";
const testAdresse = "douala";
const testPhone = "+237675677889";

let authToken = null;
let shortLinkId =null
const randomCode = "Ta" + Math.random().toString(36).substring(2, 6);


const data = {
	expiresAtString:"08/05/2025",
	originalUrl:"https://portal.rebaseacademy.com/dashboard/projects/zelNDfnCtSNje5gCSlpY"
}

describe("Short Link API (/api/)", () => {
  before(async () => {
    await connectToDb();
    await initialzeDbSchema();

    // Supprimer utilisateur test si présent
    await query("DELETE FROM users WHERE email = $1", [testUserEmail]);

    await query('DELETE FROM short_links WHERE id = $1', [shortLinkId]);

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
    assert(authToken, "JWT token must be set");
  });

  describe('POST /shorten',()=>{

    it("should create a short link successfully", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shortCode:randomCode,
          expiresAtString:"08/05/2025",
          originalUrl:"https://verpex.com/blog/website-tips/free-public-apis-for-developers?ref=dailydev"
        })
        .expect("Content-Type", /json/)
        .expect(201);
  
  
      assert.strictEqual(res.body.message,"Short URL created successfully")
      assert(res.body.shortUrl, "The shortened link must be returned");
      assert.strictEqual(res.body.short_link.original_url ,"https://verpex.com/blog/website-tips/free-public-apis-for-developers?ref=dailydev");
        shortLinkId= res.body.short_link.id
    });
  
    it("should fail if no token is provided", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .send({
          ...data
        })
        .expect(401);
  
      assert.strictEqual(res.body.message, "No token, authorication has been denied");
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
          shortCode:"T5",
        })
        .expect(400);
  
      assert(res.body.message, "should return a message");
    });

  })


  after(async () => {
    if (shortLinkId) {
      console.log(`--- Cleaning up short link ID: ${shortLinkId} ---`);
      try {
        await query('DELETE FROM short_links WHERE id = $1', [shortLinkId]);
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
