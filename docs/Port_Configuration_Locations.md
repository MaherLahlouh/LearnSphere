# Port Configuration Locations

If you need to change ports in the future (e.g. due to conflicts or deployment), use this document to find where each port is set. **Do not change anything unless you want to switch ports.**

---

## 1. Application server port (HTTP API & static files)

**Default:** `3001`

| Location | What to change |
|----------|----------------|
| **`server/app.js`** (around line **163**) | `const PORT = process.env.PORT \|\| 3001;` — change the `3001` if you don’t use `.env`. |
| **`.env`** (project root) | Add `PORT=3001` (or your desired port). If set, the server uses this instead of the fallback in `app.js`. |

**Note:** The server listens on this port at **`server/app.js`** (around line **288**): `app.listen(PORT, ...)`. You only need to change `PORT` (via code or `.env`); the `listen` call uses that variable.

---

## 2. Database port (MySQL)

**Default:** `3306`

| Location | What to change |
|----------|----------------|
| **`.env`** (project root) | `DB_PORT=3306` — set this to your MySQL port. |
| **`server/config/database.js`** (around line **69**) | `port: process.env.DB_PORT \|\| 3306` — change the `3306` only if you want a different fallback when `DB_PORT` is not set. |
| **`server/config/database.js`** (around line **84**) | Log message that prints the host and port; update only if you want the log to reflect a different default. |

---

## 3. User-facing error messages (optional)

These don’t control the port; they only tell the user which port to check. If you change the app server port, you may want to update the text so it matches.

| Location | What it says |
|----------|--------------|
| **`client/js/login.js`** (around lines **156–157**) | Error message: “Make sure server is running on port 3001” (and Arabic equivalent). |
| **`client/js/signup.js`** (around lines **468–469**) | Same message for signup. |

---

## Quick reference

- **App server port:** `server/app.js` (PORT) and optionally `PORT` in `.env`.
- **Database port:** `DB_PORT` in `.env` and fallback in `server/config/database.js`.
- **Error message text:** `client/js/login.js` and `client/js/signup.js` (optional).
