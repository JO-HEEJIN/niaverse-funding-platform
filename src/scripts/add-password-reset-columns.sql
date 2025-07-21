-- Add password reset token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.reset_token IS 'Password reset token';
COMMENT ON COLUMN users.reset_token_expiry IS 'Password reset token expiry timestamp';