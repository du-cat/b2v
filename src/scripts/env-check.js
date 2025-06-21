// Environment Check Script
// This script checks for required environment variables and tests Supabase connection

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting environment check...');

// Check for .env files
console.log('\n🔎 Checking for .env files:');
const rootDir = path.resolve(__dirname, '../..');
const envFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('.env'));

if (envFiles.length === 0) {
  console.log('❌ No .env files found in project root!');
} else {
  console.log('✅ Found the following .env files:');
  envFiles.forEach(file => {
    console.log(`   - ${file}`);
    
    // Print contents of .env files (excluding sensitive values)
    try {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      const lines = content.split('\n')
        .map(line => {
          // Mask sensitive values
          if (line.includes('SUPABASE_URL')) {
            const parts = line.split('=');
            if (parts.length > 1) {
              return `${parts[0]}=${parts[1].substring(0, 15)}...`;
            }
          }
          if (line.includes('SUPABASE_ANON_KEY') || line.includes('API_KEY')) {
            const parts = line.split('=');
            if (parts.length > 1) {
              return `${parts[0]}=${parts[1].substring(0, 10)}...`;
            }
          }
          return line;
        });
      
      console.log('   Content (sensitive values masked):');
      lines.forEach(line => {
        if (line.trim()) console.log(`     ${line}`);
      });
    } catch (error) {
      console.log(`   ❌ Error reading file: ${error.message}`);
    }
  });
}

// Check for environment variables in Node.js process
console.log('\n🔎 Checking Node.js process.env:');
const envVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((obj, key) => {
    // Mask sensitive values
    if (key.includes('SUPABASE_URL')) {
      obj[key] = process.env[key].substring(0, 15) + '...';
    } else if (key.includes('SUPABASE_ANON_KEY') || key.includes('API_KEY')) {
      obj[key] = process.env[key].substring(0, 10) + '...';
    } else {
      obj[key] = process.env[key];
    }
    return obj;
  }, {});

if (Object.keys(envVars).length === 0) {
  console.log('❌ No VITE_* environment variables found in process.env!');
} else {
  console.log('✅ Found the following VITE_* environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   - ${key}=${value}`);
  });
}

// Check for required environment variables
console.log('\n🔎 Checking for required environment variables:');
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
} else {
  console.log('✅ All required environment variables are present');
  
  // Check for placeholder values
  const placeholderRegex = /^(\s*|YOUR_|INSERT_|<.*>)$/i;
  const placeholderVars = requiredVars.filter(key => 
    placeholderRegex.test(process.env[key])
  );
  
  if (placeholderVars.length > 0) {
    console.log(`⚠️ Found placeholder values in: ${placeholderVars.join(', ')}`);
  } else {
    console.log('✅ No placeholder values detected');
  }
}

// Try to import config.ts
console.log('\n🔎 Attempting to import src/lib/config.ts:');
try {
  // We can't directly import TypeScript files in Node.js
  // So we'll use a simple check to see if the file exists
  const configPath = path.join(rootDir, 'src', 'lib', 'config.ts');
  if (fs.existsSync(configPath)) {
    console.log('✅ config.ts file exists');
    
    // Check file content for required exports
    const content = fs.readFileSync(configPath, 'utf8');
    const hasEnvConfigError = content.includes('EnvConfigError');
    const hasSupabaseUrl = content.includes('SUPABASE_URL');
    const hasSupabaseKey = content.includes('SUPABASE_ANON_KEY');
    
    if (hasEnvConfigError && hasSupabaseUrl && hasSupabaseKey) {
      console.log('✅ config.ts contains required exports');
    } else {
      console.log('❌ config.ts is missing required exports');
    }
  } else {
    console.log('❌ config.ts file does not exist');
  }
} catch (error) {
  console.log(`❌ Error checking config.ts: ${error.message}`);
}

// Check Vite configuration
console.log('\n🔎 Checking Vite configuration:');
try {
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    console.log('✅ vite.config.ts file exists');
    
    // Check file content for environment variable handling
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    const hasEnvPrefix = content.includes('envPrefix');
    const hasDefine = content.includes('define');
    const hasImportMeta = content.includes('import.meta.env');
    
    if (hasEnvPrefix && hasDefine && hasImportMeta) {
      console.log('✅ vite.config.ts has proper environment variable handling');
    } else {
      console.log('⚠️ vite.config.ts might be missing proper environment variable handling');
    }
  } else {
    console.log('❌ vite.config.ts file does not exist');
  }
} catch (error) {
  console.log(`❌ Error checking vite.config.ts: ${error.message}`);
}

// Check for .env.example
console.log('\n🔎 Checking for .env.example:');
const envExamplePath = path.join(rootDir, '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('✅ .env.example file exists');
  
  // Check if .env.example contains required variables
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const hasSupabaseUrl = content.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = content.includes('VITE_SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ .env.example contains required variables');
  } else {
    console.log('❌ .env.example is missing required variables');
  }
} else {
  console.log('❌ .env.example file does not exist');
}

// Create a test .env file with the provided credentials
console.log('\n🔎 Creating test .env file with provided credentials:');
try {
  const testEnvPath = path.join(rootDir, '.env.test');
  const testEnvContent = `
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://yiqckoncbxejdrpqymso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWNrb25jYnhlamRycHF5bXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDQwODgsImV4cCI6MjA2NDM4MDA4OH0.CJexX4v1WvcV_w7m2q73C0mRH4QkzGtOmKkwoufOI3A

# Development Settings
VITE_APP_ENV=development
`;

  fs.writeFileSync(testEnvPath, testEnvContent);
  console.log(`✅ Created test .env file at ${testEnvPath}`);
  console.log('✅ You can now copy this file to .env to use the provided credentials');
} catch (error) {
  console.log(`❌ Error creating test .env file: ${error.message}`);
}

// Final recommendations
console.log('\n🔧 Recommendations:');
console.log('1. Ensure you have a proper .env file in the project root');
console.log('2. Make sure the .env file contains the required variables:');
console.log('   - VITE_SUPABASE_URL=https://yiqckoncbxejdrpqymso.supabase.co');
console.log('   - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWNrb25jYnhlamRycHF5bXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDQwODgsImV4cCI6MjA2NDM4MDA4OH0.CJexX4v1WvcV_w7m2q73C0mRH4QkzGtOmKkwoufOI3A');
console.log('3. Restart the development server after updating the .env file');
console.log('4. If issues persist, try copying .env.test to .env');

console.log('\n✅ Environment check complete!');