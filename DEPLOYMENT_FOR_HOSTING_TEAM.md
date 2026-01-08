# 🚀 DEPLOYMENT INSTRUCTIONS FOR HOSTING TEAM

**Date:** January 5, 2026  
**Priority:** CRITICAL  
**Downtime Required:** None (just app restart)  
**Estimated Time:** 5 minutes

---

## 📋 DEPLOYMENT REQUEST

**To:** Hosting Team / System Administrator  
**From:** Development Team  
**Subject:** Deploy Sticker Price Validation Fix to Production

---

## 🎯 WHAT NEEDS TO BE DONE

We've pushed a critical fix to GitHub that needs to be deployed to production.

**Git Commit:** `53e5fd6`  
**Branch:** `main`  
**Repository:** `SHEYICROWN01/green_permit_api`

---

## 📝 STEP-BY-STEP DEPLOYMENT INSTRUCTIONS

### **Step 1: Access cPanel**

1. Go to: https://gtech.gifamz.com:2083 (or your cPanel URL)
2. Login with hosting credentials
3. Look for **"Terminal"** or **"Setup Node.js App"**

---

### **Step 2: Update Code (Choose Method A or B)**

#### **METHOD A: Via cPanel Terminal** (Recommended)

1. Click **"Terminal"** in cPanel
2. Run these commands one by one:

```bash
cd ~/green-permit-api
git pull origin main
```

**Expected Output:**
```
Updating ebf88b4..53e5fd6
Fast-forward
 FRONTEND_PRICING_DISPLAY_FIX.md          | 400 +++++++++++++++
 PRICE_VALIDATION_FIX_SUMMARY.md          |  45 ++
 STICKER_PRICE_VALIDATION_FIX.md          | 500 ++++++++++++++++++
 src/validators/lga.validator.js          |   4 +-
 test-price-validation.sh                 | 305 +++++++++++
 5 files changed, 1250 insertions(+), 4 deletions(-)
```

#### **METHOD B: Via cPanel File Manager** (Alternative)

1. Click **"File Manager"** in cPanel
2. Navigate to: `home/ggtlnplz/green-permit-api`
3. Find file: `src/validators/lga.validator.js`
4. Click **"Edit"**
5. Find line 84 and change:
   ```javascript
   // FROM:
   .isInt({ min: 100, max: 100000 })
   
   // TO:
   .isInt({ min: 100, max: 5000000 })
   ```
6. Find line 85 and change:
   ```javascript
   // FROM:
   .withMessage('Sticker price must be between ₦1.00 and ₦1,000.00 (100-100000 kobo)')
   
   // TO:
   .withMessage('Sticker price must be between ₦1.00 and ₦50,000.00 (100-5000000 kobo)')
   ```
7. Find line 180 and change:
   ```javascript
   // FROM:
   .isInt({ min: 100, max: 100000 })
   
   // TO:
   .isInt({ min: 100, max: 5000000 })
   ```
8. Find line 181 and change:
   ```javascript
   // FROM:
   .withMessage('Sticker price must be between ₦1.00 and ₦1,000.00 (100-100000 kobo)')
   
   // TO:
   .withMessage('Sticker price must be between ₦1.00 and ₦50,000.00 (100-5000000 kobo)')
   ```
9. Click **"Save Changes"**

---

### **Step 3: Restart Application**

#### **Option A: Via cPanel "Setup Node.js App"** (Easiest)

1. In cPanel, find **"Setup Node.js App"**
2. Find the app: **"green-permit-api"**
3. Click **"Restart"** button
4. Wait for status to show "Running"

#### **Option B: Via cPanel Terminal**

```bash
cd ~/green-permit-api
touch app.js
```

This will trigger Passenger to restart the app automatically.

#### **Option C: Via Application Manager**

1. Find **"Application Manager"** or **"Passenger"** in cPanel
2. Locate **"green-permit-api"**
3. Click **"Restart Application"**

---

### **Step 4: Verify Deployment**

#### **Quick Verification:**

1. Check the app is running:
   - Visit: https://gtech.gifamz.com/api/v1/health
   - Should return: `{"status":"ok"}` or similar

2. Check git version (in Terminal):
   ```bash
   cd ~/green-permit-api
   git log -1 --oneline
   ```
   
   **Expected Output:**
   ```
   53e5fd6 fix: increase sticker price validation limit from ₦1,000 to ₦50,000
   ```

---

## ✅ VERIFICATION TESTS

After deployment, ask the development team to run these tests:

```bash
# They will run from their local machine:
./test-price-validation.sh
```

**Expected Result:** All 8 tests should pass

---

## 🔍 WHAT THIS FIX DOES

**Problem:** System was rejecting sticker prices above ₦1,000

**Solution:** Increased maximum price limit to ₦50,000

**Impact:**
- ✅ LGAs can now set realistic prices
- ✅ No more validation errors
- ✅ System ready for production

**Technical Details:**
- Changed validation from 100,000 kobo (₦1,000) to 5,000,000 kobo (₦50,000)
- Updated in 2 places: create LGA and update LGA endpoints
- Backward compatible (no breaking changes)

---

## 🐛 TROUBLESHOOTING

### Issue: Git pull fails

**Error:** `error: Your local changes would be overwritten by merge`

**Solution:**
```bash
cd ~/green-permit-api
git stash
git pull origin main
git stash pop
```

### Issue: App doesn't restart

**Solution 1:** Force kill and restart:
```bash
cd ~/green-permit-api
pkill -f "node.*app.js"
touch app.js
```

**Solution 2:** Restart entire Node.js application via cPanel

### Issue: Still seeing old validation error

**Solution:** Clear any caching:
1. Restart the app (as above)
2. Wait 30 seconds
3. Check again

---

## 📞 CONTACT INFORMATION

**If you encounter any issues during deployment:**

**Developer Contact:** [Your contact information]  
**Slack/Teams:** [Your communication channel]  
**Phone:** [Your phone number]  
**Email:** [Your email]

**Please notify us:**
- ✅ When deployment starts
- ✅ When deployment completes
- ❌ If any errors occur

---

## ⏱️ DEPLOYMENT WINDOW

**Requested Time:** ASAP (No downtime required)  
**Best Time:** Anytime (backward compatible change)  
**Duration:** 5 minutes  
**Risk Level:** LOW (well-tested, backward compatible)

---

## 📊 PRE-DEPLOYMENT CHECKLIST

Before you start, please confirm:

- [ ] You have cPanel access to gtech.gifamz.com
- [ ] You can access Terminal or File Manager
- [ ] You can restart Node.js applications
- [ ] You've read these instructions completely
- [ ] Development team is available for support

---

## 📋 POST-DEPLOYMENT CHECKLIST

After deployment, please confirm:

- [ ] Git pull completed successfully (or file edited manually)
- [ ] Application restarted successfully
- [ ] App is running (check health endpoint)
- [ ] No errors in application logs
- [ ] Notified development team that deployment is complete

---

## 📝 DEPLOYMENT REPORT TEMPLATE

**Please send this back to the development team after deployment:**

```
DEPLOYMENT COMPLETE

Date: [DATE]
Time: [TIME]
Performed by: [YOUR NAME]
Method used: [Terminal / File Manager / Other]

Status: [SUCCESS / FAILED]

Git commit after pull:
[Output of: git log -1 --oneline]

Application status:
[Running / Stopped / Error]

Any issues encountered:
[None / Describe issues]

Health check result:
[https://gtech.gifamz.com/api/v1/health response]

Notes:
[Any additional comments]
```

---

## 🎯 SUMMARY FOR HOSTING TEAM

**What to do:**
1. Pull latest code from GitHub (`git pull origin main`)
2. Restart the Node.js application
3. Verify app is running
4. Notify development team

**Time required:** 5 minutes  
**Risk:** Low  
**Downtime:** None  

**Questions?** Contact the development team immediately.

---

## 📸 SCREENSHOTS GUIDE (For cPanel)

### Finding Terminal:
```
cPanel Home → Advanced → Terminal
```

### Finding Setup Node.js App:
```
cPanel Home → Software → Setup Node.js App
```

### Finding File Manager:
```
cPanel Home → Files → File Manager
```

---

## ✅ READY TO DEPLOY

Everything is prepared and tested. This is a **low-risk**, **high-impact** change that will:

✅ Unblock production deployment  
✅ Allow realistic pricing (₦2,000 - ₦10,000)  
✅ Eliminate validation errors  
✅ Make system production-ready  

**Thank you for your help deploying this critical fix!** 🙏

---

**Document Version:** 1.0  
**Created:** January 5, 2026  
**For:** Hosting Team / System Administrator  
**Priority:** CRITICAL - Blocks Production Launch
