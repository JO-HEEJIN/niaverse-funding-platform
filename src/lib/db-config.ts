// Temporary database configuration for Amplify
// TODO: Move back to environment variables when Amplify issue is resolved

export const getDatabaseUrl = () => {
  // Check environment variable first
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    console.log('Using DATABASE_URL from environment');
    return envUrl;
  }
  
  // Fallback for production (temporary)
  if (process.env.NODE_ENV === 'production') {
    console.log('WARNING: Using hardcoded fallback database URL');
    // URL encode the password: ! becomes %21
    return 'postgresql://niaverse_admin:Qlalfqjsgh1%21@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse?sslmode=require';
  }
  
  // Local development
  console.log('Using local development database');
  return 'postgresql://localhost:5432/niaverse';
};