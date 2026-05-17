-- Database Patch: db_001.sql
-- Insert Dropdowns (Idempotent using NOT EXISTS)
INSERT INTO master_dropdowns (category, label, value)
SELECT category, label, value FROM (VALUES
('occupation_type', 'Self Employed', 'Self Employed'),
('occupation_type', 'Professional', 'Professional'),
('occupation_type', 'Business', 'Business'),
('occupation_type', 'Housewife', 'Housewife'),
('occupation_type', 'Student', 'Student'),
('occupation_type', 'Service', 'Service'),
('designation', 'Director', 'Director'),
('designation', 'Managing Director', 'Managing Director'),
('designation', 'Whole-time Director', 'Whole-time Director'),
('designation', 'Nominee Director', 'Nominee Director'),
('qualification', 'Under Graduate', 'Under Graduate'),
('qualification', 'Graduate', 'Graduate'),
('qualification', 'Post Graduate', 'Post Graduate'),
('qualification', 'Professional (CA/CS/CWA)', 'Professional'),
('qualification', 'Doctorate', 'Doctorate'),
('company_type', 'Private Limited Company', 'pvt_ltd'),
('company_type', 'Public Limited Company', 'public_ltd'),
('company_type', 'One Person Company (OPC)', 'opc'),
('company_type', 'Section 8 Company', 'section_8')
) AS v(category, label, value)
WHERE NOT EXISTS (
    SELECT 1 FROM master_dropdowns md 
    WHERE md.category = v.category AND md.value = v.value
);
