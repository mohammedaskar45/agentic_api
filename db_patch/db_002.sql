-- 1. INSERT NEW ROLES (Idempotent)
INSERT INTO public.roles(role_id, role_name, status, is_deleted, created_on, created_by, updated_on, updated_by, order_no, role_type, origin_from)
VALUES 
('e1f2a3b4-0001-0001-0001-000000000001', 'Director', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 3, 'DIRECTOR', 'e1f2a3b4-0001-0001-0001-000000000001'),
('e1f2a3b4-0001-0001-0001-000000000002', 'CFO / Authorised Officer', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 4, 'CFO', 'e1f2a3b4-0001-0001-0001-000000000002'),
('e1f2a3b4-0001-0001-0001-000000000003', 'Compliance Officer', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 5, 'COMPLIANCE_OFFICER', 'e1f2a3b4-0001-0001-0001-000000000003'),
('e1f2a3b4-0001-0001-0001-000000000004', 'Lead Manager', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 6, 'LEAD_MANAGER', 'e1f2a3b4-0001-0001-0001-000000000004'),
('e1f2a3b4-0001-0001-0001-000000000005', 'Auditor (View-Only)', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 7, 'AUDITOR', 'e1f2a3b4-0001-0001-0001-000000000005')
ON CONFLICT (role_id) DO NOTHING;

-- 2. INSERT IDENTITY & ACCESS SUB-MENUS (Idempotent)
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('a1b2c3d4-0002-0001-0001-000000000001', 'Users', 'Admin', '/admin/identity/users', 'Users', 1, 'a1b2c3d4-0001-0001-0001-000000000010', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('a1b2c3d4-0002-0001-0001-000000000002', 'Roles', 'Admin', '/admin/identity/roles', 'Shield', 2, 'a1b2c3d4-0001-0001-0001-000000000010', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('a1b2c3d4-0002-0001-0001-000000000003', 'Access Matrix', 'Admin', '/admin/identity/matrix', 'Grid3X3', 3, 'a1b2c3d4-0001-0001-0001-000000000010', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0)
ON CONFLICT (menu_id) DO NOTHING;

-- 3. UPDATE SUPER ADMIN ACCESS FOR NEW MENUS (Idempotent)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    'd584b32f-8beb-4d48-a04e-7f536047ba03', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus 
WHERE menu_id IN ('a1b2c3d4-0002-0001-0001-000000000001', 'a1b2c3d4-0002-0001-0001-000000000002', 'a1b2c3d4-0002-0001-0001-000000000003')
AND NOT EXISTS (
    SELECT 1 FROM public.menu_mapping mm 
    WHERE mm.role_id = 'd584b32f-8beb-4d48-a04e-7f536047ba03' 
    AND mm.menu_id = public.menus.menu_id
);

-- 4. INITIAL PERMISSIONS FOR AUDITOR (View Only) (Idempotent)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    'e1f2a3b4-0001-0001-0001-000000000005', 
    menu_id, 
    false, true, false, false, false, 
    'Active', 0, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus
WHERE NOT EXISTS (
    SELECT 1 FROM public.menu_mapping mm 
    WHERE mm.role_id = 'e1f2a3b4-0001-0001-0001-000000000005' 
    AND mm.menu_id = public.menus.menu_id
);
