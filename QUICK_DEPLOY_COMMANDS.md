# 🚀 QUICK DEPLOY - Copy & Paste These Commands

**Run these commands in your cPanel Terminal:**

---

## ✅ OPTION 1: Full Deploy (Recommended)

```bash
cd ~/green-permit-api && git pull origin main && touch app.js && echo "✅ Deployment complete! App restarting..." && sleep 5 && git log -1 --oneline
```

**This command will:**
1. Navigate to your app directory
2. Pull latest code from GitHub
3. Restart the application
4. Show confirmation message
5. Display the current commit

---

## ✅ OPTION 2: Step-by-Step (If you prefer)

```bash
# Step 1: Go to app directory
cd ~/green-permit-api

# Step 2: Pull latest code
git pull origin main

# Step 3: Restart app
touch app.js

# Step 4: Verify deployment
git log -1 --oneline
```

---

## 📋 EXPECTED OUTPUT

After running the command, you should see:

```
Updating ebf88b4..53e5fd6
Fast-forward
 FRONTEND_PRICING_DISPLAY_FIX.md          | 400 +++++++++++++++
 PRICE_VALIDATION_FIX_SUMMARY.md          |  45 ++
 STICKER_PRICE_VALIDATION_FIX.md          | 500 ++++++++++++++++++
 src/validators/lga.validator.js          |   4 +-
 test-price-validation.sh                 | 305 +++++++++++
 5 files changed, 1250 insertions(+), 4 deletions(-)

✅ Deployment complete! App restarting...

53e5fd6 fix: increase sticker price validation limit from ₦1,000 to ₦50,000
```

---

## 🎯 HOW TO ACCESS cPANEL TERMINAL

1. **Login to cPanel:**
   - URL: https://gtech.gifamz.com:2083
   - Or: https://gtech.gifamz.com/cpanel
   - Or through your hosting provider's portal

2. **Find Terminal:**
   - Look for "Terminal" icon in cPanel
   - Usually under: **Advanced** section
   - Or search: "Terminal" in the search box

3. **Open Terminal:**
   - Click on "Terminal"
   - A black/dark command window will open

4. **Paste Command:**
   - Copy the command above
   - Right-click in terminal and "Paste"
   - Press Enter

---

## ⚡ SUPER QUICK VERSION (One-Liner)

```bash
cd ~/green-permit-api && git pull origin main && touch app.js
```

---

## 🔍 VERIFY IT WORKED

After deployment, check:

```bash
# Check current commit
git log -1 --oneline

# Expected: 53e5fd6 fix: increase sticker price validation limit from ₦1,000 to ₦50,000
```

Then visit: **https://gtech.gifamz.com/api/v1/health**

Should return: `{"status":"ok"}` or similar

---

## 🐛 IF YOU GET AN ERROR

### Error: "Your local changes would be overwritten"

**Solution:**
```bash
cd ~/green-permit-api && git stash && git pull origin main && touch app.js
```

### Error: "Permission denied"

**Solution:** You might need to use the file path with your username:
```bash
cd /home/ggtlnplz/green-permit-api && git pull origin main && touch app.js
```

### Error: "command not found: git"

**Solution:** Use cPanel's "Setup Node.js App" interface:
1. Find "Setup Node.js App" in cPanel
2. Click "Restart" button for green-permit-api

---

## ✅ THAT'S IT!

Just paste and run. The app will update and restart automatically! 🚀

---

**Need help?** Let me know what error message you see.
