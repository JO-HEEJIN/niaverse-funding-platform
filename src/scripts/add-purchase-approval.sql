-- Add approved column to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);

-- Update existing purchases with contractSigned = true to be approved
UPDATE purchases 
SET approved = true, approved_at = CURRENT_TIMESTAMP 
WHERE contract_signed = true;