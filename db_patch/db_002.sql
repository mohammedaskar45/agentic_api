-- 1. INSERT NEW ROLES (Idempotent)
INSERT INTO public.roles(role_id, role_name, status, is_deleted, created_on, created_by, updated_on, updated_by, order_no, role_type, origin_from)
VALUES 
('e4567890-1234-4012-3456-781290123456', 'Director', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 3, 'DIRECTOR', 'e4567890-1234-4012-3456-781290123456'),
('f5678901-2345-4123-4567-892301234567', 'CFO / Authorised Officer', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 4, 'CFO', 'f5678901-2345-4123-4567-892301234567'),
('a6789012-3456-4234-5678-903412345678', 'Compliance Officer', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 5, 'COMPLIANCE_OFFICER', 'a6789012-3456-4234-5678-903412345678'),
('b7890123-4567-4345-6789-014523456789', 'Lead Manager', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 6, 'LEAD_MANAGER', 'b7890123-4567-4345-6789-014523456789'),
('c8901234-5678-4456-7890-125634567890', 'Auditor (View-Only)', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 7, 'AUDITOR', 'c8901234-5678-4456-7890-125634567890')
ON CONFLICT (role_id) DO NOTHING;

-- 2. INSERT IDENTITY & ACCESS SUB-MENUS (Idempotent)
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('d9012345-6789-4567-8901-236745678901', 'Users', 'Admin', '/admin/identity/users', 'Users', 1, 'a0123456-7890-4678-9012-34de56789012', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('f1234567-8901-4789-0123-458967890123', 'Roles', 'Admin', '/admin/identity/roles', 'Shield', 2, 'a0123456-7890-4678-9012-34de56789012', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('a2345678-9012-4890-1234-569078901234', 'Access Matrix', 'Admin', '/admin/identity/matrix', 'Grid3X3', 3, 'a0123456-7890-4678-9012-34de56789012', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0)
ON CONFLICT (menu_id) DO NOTHING;

-- 3. UPDATE SUPER ADMIN ACCESS FOR NEW MENUS (Idempotent)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    '678f24b0-a615-46f9-8664-9f237890f5a1', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus 
WHERE menu_id IN ('d9012345-6789-4567-8901-236745678901', 'f1234567-8901-4789-0123-458967890123', 'a2345678-9012-4890-1234-569078901234')
AND NOT EXISTS (
    SELECT 1 FROM public.menu_mapping mm 
    WHERE mm.role_id = '678f24b0-a615-46f9-8664-9f237890f5a1' 
    AND mm.menu_id = public.menus.menu_id
);

-- 4. INITIAL PERMISSIONS FOR AUDITOR (View Only) (Idempotent)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    'c8901234-5678-4456-7890-125634567890', 
    menu_id, 
    false, true, false, false, false, 
    'Active', 0, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus
WHERE NOT EXISTS (
    SELECT 1 FROM public.menu_mapping mm 
    WHERE mm.role_id = 'c8901234-5678-4456-7890-125634567890' 
    AND mm.menu_id = public.menus.menu_id
);
