// Temporary database configuration for Amplify
// TODO: Move back to environment variables when Amplify issue is resolved

export const getDatabaseUrl = () => {
  // Check environment variable first
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    console.log('Using DATABASE_URL from environment');
    return envUrl;
  }
  
  // Fallback for production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: DATABASE_URL environment variable is required in production');
    throw new Error('DATABASE_URL is not set');
  }
  
  // Local development
  console.log('Using local development database');
  return 'postgresql://localhost:5432/niaverse';
};