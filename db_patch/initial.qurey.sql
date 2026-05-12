-- 1. INSERT ROLES
INSERT INTO public.roles(role_id, role_name, status, is_deleted, created_on, created_by, updated_on, updated_by, order_no, role_type, origin_from)
VALUES 
('d584b32f-8beb-4d48-a04e-7f536047ba03', 'Super Admin', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 1, 'SUPER_ADMIN', 'd584b32f-8beb-4d48-a04e-7f536047ba03'),
('cc17711e-f0ca-486a-afbc-92f251f94aac', 'Company Secretary', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 2, 'CS', 'cc17711e-f0ca-486a-afbc-92f251f94aac');

-- 2. INSERT COMPANIES (Fixed UUIDs)
INSERT INTO public.cs_companies(company_id, company_name, cin_number, registration_number, company_type, email, status, is_deleted, created_on)
VALUES 
('c1b2a3d4-e5f6-7890-abcd-111111111111', 'Agentic Compliance Solutions Ltd', 'U72900TN2024PTC123456', '123456', 'Private Limited', 'info@agentic.com', 'Active', 0, CURRENT_TIMESTAMP),
('c1b2a3d4-e5f6-7890-abcd-222222222222', 'Lamsat Services Pvt Ltd', 'U72900TN2024PTC654321', '654321', 'Private Limited', 'info@lamsat.com', 'Active', 0, CURRENT_TIMESTAMP);

-- 3. INSERT SUPER ADMIN USER
INSERT INTO public.users(user_id, name, password, mail_id, role_id, status, is_deleted, created_on, created_by, updated_on, updated_by, user_type, first_name, last_name)
VALUES ('292f96d3-9df2-4062-a034-563357edc45d', 'Super Admin', '$2b$10$UedR9gxbq4I0GZpb82sVOeqza4gSpRvcdczhAwd/ACiT7jlf1YkgO', 'admin@compliance.com', 'd584b32f-8beb-4d48-a04e-7f536047ba03', 'Active', 0, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL, 'Admin', 'Super', 'Admin');

-- 4. USER-COMPANY MAPPING (Fixed UUIDs)
INSERT INTO public.user_company_mapping(mapping_id, user_id, company_id, is_primary, status, is_deleted, created_on)
VALUES 
(gen_random_uuid(), '292f96d3-9df2-4062-a034-563357edc45d', 'c1b2a3d4-e5f6-7890-abcd-111111111111', true, 'Active', 0, CURRENT_TIMESTAMP),
(gen_random_uuid(), '292f96d3-9df2-4062-a034-563357edc45d', 'c1b2a3d4-e5f6-7890-abcd-222222222222', false, 'Active', 0, CURRENT_TIMESTAMP);

-- 5. ROOT MENUS
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('m1d2e3f4-0001-0001-0001-000000000001', 'Dashboard', 'Admin', '/dashboard', 'LayoutDashboard', 1, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000002', 'Companies', 'Admin', '/admin/companies', 'Building2', 2, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000003', 'Compliance Modules', 'Admin', '/admin/compliance', 'ShieldCheck', 3, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000004', 'Workflow Center', 'Admin', '/admin/workflow', 'GitBranch', 4, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000005', 'AI Document Center', 'Admin', '/admin/ai-docs', 'Bot', 5, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000006', 'Eligibility Engine', 'Admin', '/admin/eligibility', 'Cpu', 6, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000007', 'Filing Center', 'Admin', '/admin/filing', 'CloudUpload', 7, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000008', 'Compliance Calendar', 'Admin', '/admin/calendar', 'Calendar', 8, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000009', 'Document Vault', 'Admin', '/admin/vault', 'Archive', 9, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('m1d2e3f4-0001-0001-0001-000000000010', 'Identity & Access', 'Admin', '/admin/identity', 'Fingerprint', 10, NULL, 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0);

-- 6. COMPLIANCE SUB-MENUS
INSERT INTO public.menus(menu_id, menu_name, menu_type, url, icon, order_no, parent_id, status, created_on, created_by, updated_on, updated_by, is_deleted)
VALUES 
('s1d2e3f4-0001-0001-0001-000000000001', 'Incorporation', 'Admin', '/admin/compliance/incorporation', 'Building', 1, 'm1d2e3f4-0001-0001-0001-000000000003', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('s1d2e3f4-0001-0001-0001-000000000002', 'Rights Issue', 'Admin', '/admin/compliance/rights-issue', 'TrendingUp', 2, 'm1d2e3f4-0001-0001-0001-000000000003', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0),
('s1d2e3f4-0001-0001-0001-000000000003', 'Share Buyback', 'Admin', '/admin/compliance/buyback', 'RotateCw', 3, 'm1d2e3f4-0001-0001-0001-000000000003', 'Active', CURRENT_TIMESTAMP, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, 0);

-- 7. MENU MAPPING (Super Admin Full Access)
INSERT INTO public.menu_mapping(mapping_id, role_id, menu_id, full_access, view, add, edit, delete, status, is_deleted, created_by, created_on, updated_by, updated_on)
SELECT 
    gen_random_uuid(), 
    'd584b32f-8beb-4d48-a04e-7f536047ba03', 
    menu_id, 
    true, true, true, true, true, 
    'Active', 0, '292f96d3-9df2-4062-a034-563357edc45d', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP 
FROM public.menus;
