
# 🔐🔗 Secure URL Shortening API

A robust and secure backend API that allows users to shorten, manage, and track URLs, with authentication and access control. Inspired by a Bitly-like service, this API offers advanced features for a production-ready application.

## 🚀 Fonctionnalités Principales

- ✅ Secure authentication (JWT)
- ✅ Creating user accounts
- ✅ Generation and management of personalized or random short URLs
- ✅ Link Expiration and Smart Redirects
- ✅ URL Click Tracking
- ✅ Secure access to each user's URLs
- ✅ Complete error handling

---

## 📚 AP EndpointsI

### 🔐 Authentification

- `POST /api/auth/register`  
  Registering a new user.  
  **Body:** `{ "username": "string", "password": "string" }`

- `POST /api/auth/login`  
  User login and generation of a JWT.  
  **Body:** `{ "email": "string", "password": "string" }`

---

### 🔗 URL shortening


- `POST /api/shorten` *(protected)*  
  Create a custom or auto-generated short URL.  
  **Headers:** `Authorization: Bearer <token>`  
  **Body:**  
  ```json
  {
    "longUrl": "https://exemple.com/article",
    "customCode": "exemple123", // optionnel
    "expiresAt": "2025-06-01T00:00:00Z" // optionnel
  }

### 🌐 Public Redirection


- `GET /:shortCode`   
  Redirects to longUrl if valid and not expired.
  404 Not Found : si le code est inconnu
  410 Gone : si l’URL est expirée
  301 Redirect : si valid  


### 📁 User URLs

- `GET /api/my-urls (protégé)`
  Returns all URLs shortened by the logged in user.
  **Headers:** `Authorization: Bearer <token>`

### 🧠 Technical Architecture

- Backend: Node.js / Express (or other framework of your choice)

- Database: MongoDB / PostgreSQL / other (relational or NoSQL)

- Authentication: JWT (JSON Web Token)

- Security: Password hash with bcrypt / Argon2

- Validation: Input validation middleware

- Tracking: Click increment per link

- Errors: Centralized error management with HTTP status and clear messages

## 🛠️ Tech Stack

[Node.js](https://nodejs.org/en/learn/getting-started/),
[Express.js](https://expressjs.com/),
[PostgreSQL](https://www.postgresql.org/),
[json web tokent](https://jwt.io/),
[Swagger for API documentation](https://swagger.io/solutions/api-documentation/)

## 📦 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/your-username/URL_Shortner_API.git
cd URL_Shortner

```
2. Installation

Install my-project with npm

```bash
npm install

```
3. Configure environment variables (.env):

```bash
PORT=4000
JWT_SECRET=your_secret_key
PORT=
NODE_ENV=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=
JWT_EXPIRES_IN=1h
HOSTNAME=

```
4.Run the server:

```bash
npm run dev

```

### 📌 Bonnes Pratiques Implémentées
-  Auth middleware pour les routes protégées

-  Hashage sécurisé des mots de passe

-  Contrôle de validité et d’unicité des customCodes

-  Codes d’état HTTP cohérents et messages d’erreur explicites

-  Relation utilisateur ↔ URLs bien définie

-  Séparation logique des contrôleurs, middlewares, routes, et modèles



## Access Swagger Documentation

[Visit](http://localhost:4000/api/api-docs)

## 📄 License

This project is licensed under the [MIT](https://snyk.io/fr/articles/what-is-mit-license/) License — see the LICENSE file for details.

## 🙌 Author

Made with ❤️ by [Sielinou Fonou Diderot]()

