import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnvConfigError } from '../config';

// Mock import.meta.env
vi.mock('../config', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    // We'll override these in tests
  };
});

describe('Environment Configuration', () => {
  // Save original import.meta.env
  const originalEnv = { ...import.meta.env };
  
  beforeEach(() => {
    // Reset import.meta.env before each test
    vi.resetModules();
    
    // Mock import.meta.env
    import.meta.env = {
      ...originalEnv,
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key',
      MODE: 'test',
      DEV: true,
    };
  });
  
  afterEach(() => {
    // Restore original import.meta.env
    import.meta.env = originalEnv;
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_URL is missing', async () => {
    // Arrange
    import.meta.env.VITE_SUPABASE_URL = undefined;
    
    // Act & Assert
    await expect(import('../config')).rejects.toThrow(EnvConfigError);
    
    try {
      await import('../config');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_URL');
    }
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_ANON_KEY is missing', async () => {
    // Arrange
    import.meta.env.VITE_SUPABASE_ANON_KEY = undefined;
    
    // Act & Assert
    await expect(import('../config')).rejects.toThrow(EnvConfigError);
    
    try {
      await import('../config');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_URL is a placeholder', async () => {
    // Arrange
    import.meta.env.VITE_SUPABASE_URL = 'YOUR_SUPABASE_URL';
    
    // Act & Assert
    await expect(import('../config')).rejects.toThrow(EnvConfigError);
    
    try {
      await import('../config');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_URL');
    }
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_ANON_KEY is a placeholder', async () => {
    // Arrange
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'INSERT_YOUR_KEY_HERE';
    
    // Act & Assert
    await expect(import('../config')).rejects.toThrow(EnvConfigError);
    
    try {
      await import('../config');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });
  
  it('should export typed constants when all required variables are present', async () => {
    // Arrange
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key';
    
    // Act
    const config = await import('../config');
    
    // Assert
    expect(config.SUPABASE_URL).toBe('https://example.supabase.co');
    expect(config.SUPABASE_ANON_KEY).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key');
    expect(config.APP_ENV).toBe('development');
  });
});