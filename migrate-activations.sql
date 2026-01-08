-- Migration Script: Populate activations table from existing sticker data
-- Purpose: Migrate all previously activated stickers to the activations table
-- Date: January 8, 2026
-- Run this ONCE after deploying the activation fix

-- ⚠️ IMPORTANT: This script is SAFE to run multiple times (it checks for existing records)

USE ggtlnplz_green_permit;

-- Step 1: Verify how many stickers have been activated but not in activations table
SELECT 
    'Activated Stickers (in stickers table)' as description,
    COUNT(*) as count
FROM stickers
WHERE status IN ('active', 'expired', 'revoked')
AND activated_at IS NOT NULL

UNION ALL

SELECT 
    'Activation Records (in activations table)' as description,
    COUNT(*) as count
FROM activations

UNION ALL

SELECT 
    'Missing Activation Records' as description,
    COUNT(*) as count
FROM stickers s
WHERE s.status IN ('active', 'expired', 'revoked')
AND s.activated_at IS NOT NULL
AND s.id NOT IN (SELECT sticker_id FROM activations WHERE sticker_id IS NOT NULL);

-- Step 2: Show the stickers that will be migrated
SELECT 
    s.id,
    s.code,
    s.status,
    s.activated_at,
    s.expires_at,
    s.price,
    s.assigned_to_name,
    s.assigned_to_phone,
    s.lga_id,
    s.activated_by,
    l.name as lga_name
FROM stickers s
LEFT JOIN lgas l ON s.lga_id = l.id
WHERE s.status IN ('active', 'expired', 'revoked')
AND s.activated_at IS NOT NULL
AND s.id NOT IN (SELECT sticker_id FROM activations WHERE sticker_id IS NOT NULL)
ORDER BY s.activated_at DESC;

-- Step 3: Insert missing activation records
-- This will create activation records for all previously activated stickers
INSERT INTO activations (
    sticker_id,
    officer_id,
    activated_by,
    supervisor_id,
    lga_id,
    activation_date,
    expiry_date,
    amount_paid,
    customer_name,
    customer_phone,
    location,
    created_at
)
SELECT 
    s.id as sticker_id,
    CASE 
        WHEN u.role = 'officer' THEN s.activated_by
        ELSE NULL 
    END as officer_id,
    s.activated_by,
    CASE 
        WHEN u.role = 'supervisor' THEN s.activated_by
        WHEN u.supervisor_id IS NOT NULL THEN u.supervisor_id
        ELSE NULL 
    END as supervisor_id,
    s.lga_id,
    COALESCE(s.activated_at, s.created_at) as activation_date,
    s.expires_at as expiry_date,
    COALESCE(s.price, 0) as amount_paid,
    s.assigned_to_name as customer_name,
    s.assigned_to_phone as customer_phone,
    NULL as location,
    s.activated_at as created_at
FROM stickers s
LEFT JOIN users u ON s.activated_by = u.id
WHERE s.status IN ('active', 'expired', 'revoked')
AND s.activated_at IS NOT NULL
AND s.id NOT IN (SELECT sticker_id FROM activations WHERE sticker_id IS NOT NULL);

-- Step 4: Verify migration results
SELECT 
    'MIGRATION COMPLETE' as status,
    COUNT(*) as records_inserted
FROM activations;

-- Step 5: Show total revenue after migration
SELECT 
    'Total Revenue (Kobo)' as description,
    SUM(amount_paid) as value
FROM activations

UNION ALL

SELECT 
    'Total Revenue (Naira)' as description,
    SUM(amount_paid) / 100 as value
FROM activations

UNION ALL

SELECT 
    'Total Activations' as description,
    COUNT(*) as value
FROM activations;

-- Step 6: Show revenue by LGA
SELECT 
    l.name as lga_name,
    COUNT(a.id) as activation_count,
    SUM(a.amount_paid) as total_kobo,
    SUM(a.amount_paid) / 100 as total_naira
FROM activations a
JOIN lgas l ON a.lga_id = l.id
GROUP BY l.id, l.name
ORDER BY total_naira DESC;

-- ✅ MIGRATION COMPLETE
-- Your dashboard should now show correct revenue and activation counts!
