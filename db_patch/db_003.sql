-- 1. DELETE ACCESS MATRIX MENU (Since it's now integrated into Roles tab)
DELETE FROM public.menu_mapping WHERE menu_id = 'a1b2c3d4-0002-0001-0001-000000000003';
DELETE FROM public.menus WHERE menu_id = 'a1b2c3d4-0002-0001-0001-000000000003';

-- 2. CLEAN UP DUPLICATE MENU MAPPINGS
DELETE FROM public.menu_mapping a
USING public.menu_mapping b
WHERE a.mapping_id < b.mapping_id
AND a.role_id = b.role_id
AND a.menu_id = b.menu_id;

-- 3. ADD UNIQUE CONSTRAINT TO MENU MAPPING (Idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_role_menu') THEN
        ALTER TABLE public.menu_mapping ADD CONSTRAINT unique_role_menu UNIQUE (role_id, menu_id);
    END IF;
END $$;

-- 4. REFRESH SUPER ADMIN PERMISSIONS FOR REMAINING IDENTITY MENUS
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on)
SELECT 
    gen_random_uuid(), 
    'd584b32f-8beb-4d48-a04e-7f536047ba03', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP
FROM public.menus 
WHERE menu_id IN ('a1b2c3d4-0002-0001-0001-000000000001', 'a1b2c3d4-0002-0001-0001-000000000002')
ON CONFLICT (role_id, menu_id) DO UPDATE SET full_access = true, view = true, add = true, edit = true, delete = true;
