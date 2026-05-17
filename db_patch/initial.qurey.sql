-- 1. INSERT ROLES
INSERT INTO public.roles(role_id, role_name, status, is_deleted, created_on, created_by, updated_on, updated_by, order_no, role_type, origin_from)
VALUES 
('678f24b0-a615-46f9-8664-9f237890f5a1', 'Super Admin', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 1, 'SUPER_ADMIN', '678f24b0-a615-46f9-8664-9f237890f5a1'),
('2b0c48e5-d91f-4f6c-8472-e54612390fbd', 'Company Secretary', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 2, 'CS', '2b0c48e5-d91f-4f6c-8472-e54612390fbd')
ON CONFLICT (role_id) DO NOTHING;

-- 2. INSERT COMPANIES (Fixed UUIDs)
INSERT INTO public.cs_companies(company_id, company_name, cin_number, registration_number, company_type, email, status, is_deleted, created_on)
VALUES 
('e4901fbc-32d1-4a5e-9762-b124567890cd', 'Agentic Compliance Solutions Ltd', 'U72900TN2024PTC123456', '123456', 'Private Limited', 'info@agentic.com', 'Active', 0, CURRENT_TIMESTAMP),
('f1a02bdc-43e2-5b6f-a873-c235678901de', 'Lamsat Services Pvt Ltd', 'U72900TN2024PTC654321', '654321', 'Private Limited', 'info@lamsat.com', 'Active', 0, CURRENT_TIMESTAMP)
ON CONFLICT (company_id) DO NOTHING;

-- 3. INSERT SUPER ADMIN USER
INSERT INTO public.users(user_id, name, password, mail_id, role_id, status, is_deleted, created_on, created_by, updated_on, updated_by, user_type, first_name, last_name)
VALUES ('a2b3c4d5-e6f7-4890-abcd-1234567890ef', 'Super Admin', '$2b$10$uc09gbrDn8cS7h3uZrfb0ueo6eWUsku7FJPHfxuNPNidGQeC5YPRa', 'superadmin@gmail.com', '678f24b0-a615-46f9-8664-9f237890f5a1', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 'Admin', 'Super', 'Admin')
ON CONFLICT (user_id) DO NOTHING;

-- 4. USER-COMPANY MAPPING (Fixed UUIDs)
INSERT INTO public.user_company_mapping(mapping_id, user_id, company_id, is_primary, status, is_deleted, created_on)
VALUES 
('e5f6a7b8-c9d0-4e1f-a2b3-c4d5e6f7a8b9', 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', 'e4901fbc-32d1-4a5e-9762-b124567890cd', true, 'Active', 0, CURRENT_TIMESTAMP),
('f6a7b8c9-d0e1-4f2a-b3c4-d5e6f7a8b9c0', 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', 'f1a02bdc-43e2-5b6f-a873-c235678901de', false, 'Active', 0, CURRENT_TIMESTAMP)
ON CONFLICT (mapping_id) DO NOTHING;

-- 5. ROOT MENUS
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('d1e2f3a4-b5c6-4d7e-8f90-1234567890ab', 'Dashboard', 'Admin', '/dashboard', 'LayoutDashboard', 1, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('e2f3a4b5-c6d7-4e8f-9012-34567890bcde', 'Companies', 'Admin', '/admin/companies', 'Building2', 2, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('f3a4b5c6-d7e8-4f90-1234-567890cdef01', 'Compliance Modules', 'Admin', '/admin/compliance', 'ShieldCheck', 3, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('a4b5c6d7-e8f9-4012-3456-7890def01234', 'Workflow Center', 'Admin', '/admin/workflow', 'GitBranch', 4, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('b5c6d7e8-f901-4123-4567-890ef0123456', 'AI Document Center', 'Admin', '/admin/ai-docs', 'Bot', 5, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('c6d7e8f9-0123-4234-5678-90fa12345678', 'Eligibility Engine', 'Admin', '/admin/eligibility', 'Cpu', 6, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('d7e8f901-2345-4345-6789-01ab23456789', 'Filing Center', 'Admin', '/admin/filing', 'CloudUpload', 7, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('e8f90123-4567-4456-7890-12bc34567890', 'Compliance Calendar', 'Admin', '/admin/calendar', 'Calendar', 8, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('f9012345-6789-4567-8901-23cd45678901', 'Document Vault', 'Admin', '/admin/vault', 'Archive', 9, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('a0123456-7890-4678-9012-34de56789012', 'Identity & Access', 'Admin', '/admin/identity', 'Fingerprint', 10, NULL, 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0)
ON CONFLICT (menu_id) DO NOTHING;

-- 6. COMPLIANCE SUB-MENUS
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('b1234567-8901-4789-0123-45ef67890123', 'Incorporation', 'Admin', '/admin/compliance/incorporation', 'Building', 1, 'f3a4b5c6-d7e8-4f90-1234-567890cdef01', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('c2345678-9012-4890-1234-56f078901234', 'Rights Issue', 'Admin', '/admin/compliance/rights-issue', 'TrendingUp', 2, 'f3a4b5c6-d7e8-4f90-1234-567890cdef01', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0),
('d3456789-0123-4901-2345-670189012345', 'Share Buyback', 'Admin', '/admin/compliance/buyback', 'RotateCw', 3, 'f3a4b5c6-d7e8-4f90-1234-567890cdef01', 'Active', CURRENT_TIMESTAMP, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, 0)
ON CONFLICT (menu_id) DO NOTHING;

-- 7. MENU MAPPING (Super Admin Full Access)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    '678f24b0-a615-46f9-8664-9f237890f5a1', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, 'a2b3c4d5-e6f7-4890-abcd-1234567890ef', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus m
WHERE NOT EXISTS (
    SELECT 1 FROM public.menu_mapping mm 
    WHERE mm.role_id = '678f24b0-a615-46f9-8664-9f237890f5a1' 
    AND mm.menu_id = m.menu_id
);
