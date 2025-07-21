// Temporary database configuration for Amplify
// TODO: Move back to environment variables when Amplify issue is resolved

export const getDatabaseUrl = () => {
  // Check environment variable first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fallback for production (temporary)
  if (process.env.NODE_ENV === 'production') {
    // URL encode the password: ! becomes %21
    return 'postgresql://niaverse_admin:Qlalfqjsgh1%21@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse?sslmode=require';
  }
  
  // Local development
  return 'postgresql://localhost:5432/niaverse';
};