/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Hard-coded fallback values for critical environment variables
  const FALLBACK_SUPABASE_URL = 'https://yiqckoncbxejdrpqymso.supabase.co';
  const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWNrb25jYnhlamRycHF5bXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDQwODgsImV4cCI6MjA2NDM4MDA4OH0.CJexX4v1WvcV_w7m2q73C0mRH4QkzGtOmKkwoufOI3A';
  
  console.log('🔧 Vite Config - Environment Variables:', {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing (will use fallback)',
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing (will use fallback)',
    MODE: mode
  });
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Explicitly inject environment variables for all contexts
    define: {
      // Ensure these values are always available in import.meta.env
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_OPENCAGE_API_KEY': JSON.stringify(env.VITE_OPENCAGE_API_KEY || ''),
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'development'),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.DEV': mode === 'development',
      'import.meta.env.PROD': mode === 'production',
      
      // Also inject into process.env for legacy code
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY),
      'process.env.VITE_OPENCAGE_API_KEY': JSON.stringify(env.VITE_OPENCAGE_API_KEY || ''),
      'process.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'development'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    // Also inject into process.env for compatibility
    envPrefix: 'VITE_',
    server: {
      // Disable HMR to prevent CSP violations from eval() usage
      // This fixes the infinite loading screen and CSP violations
      hmr: false,
      // Ensure proper CORS headers for development
      cors: true,
    },
    build: {
      // CRITICAL FIX: Ensure no eval() in production build
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Keep console logs for debugging
          drop_debugger: true
        }
      },
      // CRITICAL FIX: Ensure proper CSP in production
      rollupOptions: {
        output: {
          // Prevent code splitting that might cause CSP issues
          manualChunks: undefined
        }
      }
    },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  };
});