import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnvConfigError, validateEnv, type ValidEnv } from '../config';

describe('Environment Configuration', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key'
    };
  });
  
  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should throw EnvConfigError when VITE_SUPABASE_URL is missing', () => {
    // Arrange
    delete process.env.VITE_SUPABASE_URL;
    
    // Act & Assert
    expect(() => validateEnv()).toThrow(EnvConfigError);
    
    try {
      validateEnv();
      expect.fail('Should have thrown EnvConfigError');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_URL');
    }
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_ANON_KEY is missing', () => {
    // Arrange
    delete process.env.VITE_SUPABASE_ANON_KEY;
    
    // Act & Assert
    expect(() => validateEnv()).toThrow(EnvConfigError);
    
    try {
      validateEnv();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });
  
  it('should validate environment variables successfully', () => {
    // Act
    const env: ValidEnv = validateEnv();
    
    // Assert
    expect(env.VITE_SUPABASE_URL).toBe('https://example.supabase.co');
    expect(env.VITE_SUPABASE_ANON_KEY).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key');
  });

  it('should throw EnvConfigError when VITE_SUPABASE_URL is a placeholder', () => {
    // Arrange
    process.env.VITE_SUPABASE_URL = 'INSERT_YOUR_URL_HERE';
    
    // Act & Assert
    expect(() => validateEnv()).toThrow(EnvConfigError);
    
    try {
      validateEnv();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_URL');
    }
  });
  
  it('should throw EnvConfigError when VITE_SUPABASE_ANON_KEY is a placeholder', () => {
    // Arrange
    process.env.VITE_SUPABASE_ANON_KEY = 'INSERT_YOUR_KEY_HERE';
    
    // Act & Assert
    expect(() => validateEnv()).toThrow(EnvConfigError);
    
    try {
      validateEnv();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect((error as EnvConfigError).missingKeys).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });
  
  it('should export validated config when all required variables are present', () => {
    // Act
    const env: ValidEnv = validateEnv();
    
    // Assert
    expect(env.VITE_SUPABASE_URL).toBe('https://example.supabase.co');
    expect(env.VITE_SUPABASE_ANON_KEY).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key');
  });
});