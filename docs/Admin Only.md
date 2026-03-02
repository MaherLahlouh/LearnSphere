# Admin Only – Login Credentials

**Keep this file private.** Do not share or commit to a public repository in production. These credentials are also defined in the project root `.env` file.

---

## Admin login

| Field | Value |
|-------|--------|
| **Email** | `admin@learnwithtaa.com` |
| **Password** | `admin123` |

---

## How to use

1. Open the admin login page: **http://localhost:3001/admin-login.html**  
   (or use the “Admin login” link on the main login page).
2. Enter the **email** and **password** above.
3. After successful login you are redirected to the admin dashboard: **http://localhost:3001/admin-dashboard.html**.

---

## Changing the credentials

To use different credentials, update the `.env` file in the project root:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
```

Restart the server after changing `.env`. If these variables are not set, the app falls back to the default values in this document.
