-- 1. CLEAN UP DUPLICATE MENU MAPPINGS
DELETE FROM public.menu_mapping a
USING public.menu_mapping b
WHERE a.mapping_id < b.mapping_id
AND a.role_id = b.role_id
AND a.menu_id = b.menu_id;

-- 2. ADD UNIQUE CONSTRAINT TO MENU MAPPING (Idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_role_menu') THEN
        ALTER TABLE public.menu_mapping ADD CONSTRAINT unique_role_menu UNIQUE (role_id, menu_id);
    END IF;
END $$;

-- 3. REFRESH SUPER ADMIN PERMISSIONS FOR IDENTITY MENUS
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on)
SELECT 
    gen_random_uuid(), 
    '678f24b0-a615-46f9-8664-9f237890f5a1', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP
FROM public.menus 
WHERE menu_id IN ('d9012345-6789-4567-8901-236745678901', 'f1234567-8901-4789-0123-458967890123', 'a2345678-9012-4890-1234-569078901234')
ON CONFLICT (role_id, menu_id) DO UPDATE SET full_access = true, view = true, add = true, edit = true, delete = true;
