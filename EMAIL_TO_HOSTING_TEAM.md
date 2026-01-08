# 📧 EMAIL TEMPLATE FOR HOSTING TEAM

**Copy and send this email to your hosting provider or system administrator:**

---

**Subject:** URGENT: Deploy Critical Fix to green-permit-api Production

---

Dear Hosting Team,

We need to deploy a critical fix to our production application **gtech.gifamz.com**.

## DEPLOYMENT REQUEST

**Application:** green-permit-api  
**Environment:** Production (gtech.gifamz.com)  
**Priority:** CRITICAL - Blocking production launch  
**Downtime Required:** None (just app restart)  
**Estimated Time:** 5 minutes

## WHAT NEEDS TO BE DONE

We've pushed a fix to GitHub that needs to be pulled and the application restarted.

**Repository:** github.com/SHEYICROWN01/green_permit_api  
**Branch:** main  
**Commit:** 53e5fd6

## DEPLOYMENT STEPS

### Method 1: Via cPanel Terminal (Preferred)

1. Login to cPanel: https://gtech.gifamz.com:2083
2. Open Terminal
3. Run these commands:

```bash
cd ~/green-permit-api
git pull origin main
touch app.js
```

### Method 2: Via cPanel Setup Node.js App

1. Login to cPanel
2. Go to "Setup Node.js App"
3. Find "green-permit-api"
4. Click "Restart"

## VERIFICATION

After deployment, please verify:

1. Application is running: https://gtech.gifamz.com/api/v1/health
2. Send us the output of: `cd ~/green-permit-api && git log -1 --oneline`

## WHAT THIS FIX DOES

This fix increases the sticker price validation limit from ₦1,000 to ₦50,000, allowing our LGA partners to set realistic pricing. Currently, they're unable to configure their prices due to the restrictive limit.

## DETAILED INSTRUCTIONS

I've attached a comprehensive deployment guide: **DEPLOYMENT_FOR_HOSTING_TEAM.md**

Or view online: [GitHub link to file]

## TIMELINE

**Requested:** ASAP (today, January 5, 2026)  
**Best Time:** Anytime (no downtime required)  
**Urgency:** HIGH - Blocking production launch

## CONTACT

If you have any questions or encounter issues:

**Name:** [Your Name]  
**Email:** [Your Email]  
**Phone:** [Your Phone]  
**Available:** [Your availability]

## PLEASE CONFIRM

Once deployment is complete, please reply with:

✅ Deployment completed at: [TIME]  
✅ Application status: [Running/Stopped]  
✅ Git commit showing: [Output of git log -1]  
✅ Any issues encountered: [None/Details]

## THANK YOU

This is a critical fix that will unblock our production launch. We appreciate your prompt assistance!

Best regards,  
[Your Name]  
[Your Title]  
Green Permit Development Team

---

**Attachments:**
- DEPLOYMENT_FOR_HOSTING_TEAM.md (detailed instructions)

---

**P.S.** This is a LOW RISK change:
- ✅ Backward compatible
- ✅ Well tested
- ✅ No database changes
- ✅ No breaking changes
- ✅ Can be rolled back in 2 minutes if needed
