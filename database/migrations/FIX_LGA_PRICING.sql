-- Fix LGA Pricing - Convert to Proper Kobo Values
-- Date: January 3, 2026
-- Issue: Prices stored as naira instead of kobo (missing x100)

-- Current values are in naira (e.g., 3000 = ₦30)
-- Need to multiply by 100 to get kobo (e.g., 300000 = ₦3,000)

USE ggtlnplz_green_permit;

-- Update all LGA prices: multiply current value by 100
-- This converts naira to kobo format
UPDATE lgas 
SET sticker_price = sticker_price * 100
WHERE sticker_price < 100000;  -- Only update if not already in kobo format

-- Verify the changes
SELECT 
    id, 
    name, 
    code, 
    sticker_price as sticker_price_kobo,
    (sticker_price / 100) as price_in_naira
FROM lgas
ORDER BY id;

-- Expected results after fix:
-- Ifo Local Govt (OGIFO): 300000 kobo = ₦3,000
-- Oworo LGA (LAOWO):      500100 kobo = ₦5,001  
-- Seyi LGA (ONSEY):       450000 kobo = ₦4,500
-- Oluwaseyi LGA (LAOLU):  300000 kobo = ₦3,000
