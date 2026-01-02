# 🔐 GitHub Authentication Setup Guide

## Issue: Authentication Failed

GitHub no longer accepts password authentication for Git operations. You need to use a **Personal Access Token (PAT)**.

---

## ✅ Solution: Create GitHub Personal Access Token

### Step 1: Create Personal Access Token

1. **Go to GitHub:**
   - Visit: https://github.com/settings/tokens

2. **Generate New Token:**
   - Click "Generate new token" → "Generate new token (classic)"

3. **Configure Token:**
   - **Note:** `green-permit-api-deployment`
   - **Expiration:** Choose duration (90 days or No expiration)
   - **Select scopes:**
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)

4. **Generate Token:**
   - Click "Generate token"
   - **⚠️ IMPORTANT:** Copy the token NOW! You won't see it again.

---

## Step 2: Push to GitHub Using Token

### Option A: Use Token in URL (One-time)

```bash
git push -u https://<YOUR_TOKEN>@github.com/SHEYICROWN01/green_permit_api.git main
```

Replace `<YOUR_TOKEN>` with your actual token.

**Example:**
```bash
git push -u https://ghp_abc123xyz456789@github.com/SHEYICROWN01/green_permit_api.git main
```

### Option B: Configure Git Credential Manager (Recommended)

```bash
# Set up credential helper (macOS)
git config --global credential.helper osxkeychain

# Push (it will ask for username and token once)
git push -u origin main
```

**When prompted:**
- **Username:** `SHEYICROWN01`
- **Password:** Paste your Personal Access Token (not your GitHub password)

The token will be saved securely, and you won't need to enter it again.

---

## Step 3: Verify Push Success

After successful push, you should see:

```
Enumerating objects: 157, done.
Counting objects: 100% (157/157), done.
Delta compression using up to 8 threads
Compressing objects: 100% (145/145), done.
Writing objects: 100% (157/157), 350.00 KiB | 10.00 MiB/s, done.
Total 157 (delta 45), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (45/45), done.
To https://github.com/SHEYICROWN01/green_permit_api.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🎯 Quick Steps Summary

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check `repo` scope
4. Copy the token
5. Run: `git push -u origin main`
6. When prompted:
   - Username: `SHEYICROWN01`
   - Password: Paste your token

---

## 📝 Future Pushes

After the first successful push, future updates are simple:

```bash
git add .
git commit -m "Your commit message"
git push
```

No need to enter credentials again if you used the credential helper!

---

## 🔒 Security Tips

- ✅ Never commit your token to the repository
- ✅ Store token securely (password manager)
- ✅ Use expiration dates for tokens
- ✅ Regenerate if compromised
- ✅ Revoke unused tokens

---

## 🆘 Troubleshooting

### Still Getting Authentication Errors?

**1. Remove old remote and add new with token:**
```bash
git remote remove origin
git remote add origin https://<YOUR_TOKEN>@github.com/SHEYICROWN01/green_permit_api.git
git push -u origin main
```

**2. Check remote URL:**
```bash
git remote -v
```

**3. Update remote URL:**
```bash
git remote set-url origin https://<YOUR_TOKEN>@github.com/SHEYICROWN01/green_permit_api.git
```

---

## ✨ After Successful Push

Visit your repository at:
https://github.com/SHEYICROWN01/green_permit_api

You should see all your files there! 🎉

---

## 🔄 Alternative: SSH Keys (Advanced)

If you prefer SSH over HTTPS:

1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add to GitHub: https://github.com/settings/keys
3. Change remote: `git remote set-url origin git@github.com:SHEYICROWN01/green_permit_api.git`
4. Push: `git push -u origin main`

---

**Ready to create your token and push? Let me know if you need help!** 🚀
