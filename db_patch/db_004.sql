-- DB_004: ADD STATUTORY AND CONTACT FIELDS TO INC MASTER DATA
DO $$ 
BEGIN 
    -- 1. Add official_email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='official_email') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN official_email VARCHAR(255);
    END IF;

    -- 2. Add official_phone if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='official_phone') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN official_phone VARCHAR(50);
    END IF;

    -- 3. Ensure statutory fields exist (Re-adding if deleted)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='office_ownership_type') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN office_ownership_type VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='office_owner_name') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN office_owner_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='utility_bill_type') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN utility_bill_type VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='utility_bill_file_id') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN utility_bill_file_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='noc_file_id') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN noc_file_id UUID;
    END IF;

    -- 4. Add preference capital fields if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='preference_capital') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN preference_capital DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cs_inc_master_data' AND column_name='preference_face_value') THEN
        ALTER TABLE public.cs_inc_master_data ADD COLUMN preference_face_value DECIMAL(10,2) DEFAULT 10;
    END IF;
END $$;
