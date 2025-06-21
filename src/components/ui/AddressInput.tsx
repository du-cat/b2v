import React, { useState, useRef, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, ExternalLink, Key } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AddressInputProps {
  label?: string;
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface OpenCageResult {
  formatted: string;
  components: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  geometry: {
    lat: number;
    lng: number;
  };
  confidence: number;
}

interface OpenCageResponse {
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export function AddressInput({
  label,
  value,
  onChange,
  error,
  placeholder = "Enter store address",
  required = false,
  className
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<OpenCageResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'valid' | 'invalid' | 'missing'>('checking');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check and validate OpenCage API key
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
    
    if (!apiKey || apiKey === 'your_opencage_api_key_here') {
      setApiStatus('missing');
      console.log('ℹ️ VITE_OPENCAGE_API_KEY not found - using demo mode');
      return;
    }

    // Validate API key format (OpenCage keys are typically 32 characters alphanumeric)
    if (apiKey.length < 20 || !/^[a-zA-Z0-9]+$/.test(apiKey)) {
      setApiStatus('invalid');
      console.warn('⚠️ Invalid OpenCage API key format - using demo mode');
      return;
    }

    setApiStatus('valid');
    console.log('✅ OpenCage API key validated');
  }, []);

  /**
   * Fetch address suggestions with OpenCage Data API
   */
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError(null);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
      
      if (!apiKey || apiStatus !== 'valid') {
        // Fallback to mock data when API key is not configured or invalid
        await fetchMockSuggestions(query);
        return;
      }

      console.log('🔄 Fetching OpenCage suggestions for:', query);
      
      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5&countrycode=us&no_annotations=1`;
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenCage API HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: OpenCageResponse = await response.json();

      if (data.status.code === 200) {
        const results = data.results.slice(0, 5); // Limit to top 5 results
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
        console.log(`✅ OpenCage API returned ${results.length} suggestions`);
      } else if (data.status.code === 402) {
        throw new Error('OpenCage API quota exceeded - using demo data');
      } else if (data.status.code === 403) {
        throw new Error('OpenCage API key invalid - using demo data');
      } else {
        throw new Error(`OpenCage API error: ${data.status.code} - ${data.status.message}`);
      }
    } catch (error) {
      console.error('❌ Error fetching OpenCage suggestions:', error);
      
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('aborted')) {
        setApiError('Request timeout - using demo data');
      } else if (errorMessage.includes('quota')) {
        setApiError('API quota exceeded - using demo data');
      } else if (errorMessage.includes('invalid')) {
        setApiError('Invalid API key - using demo data');
      } else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        setApiError('Network error - using demo data');
      } else {
        setApiError('API unavailable - using demo data');
      }
      
      // Always fallback to mock data on any error
      await fetchMockSuggestions(query);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Enhanced mock address suggestions for development/demo
   */
  const fetchMockSuggestions = async (query: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockAddresses = [
      {
        formatted: "123 Main Street, New York, NY 10001, USA",
        components: { road: "Main Street", city: "New York", state: "NY", postcode: "10001" },
        geometry: { lat: 40.7128, lng: -74.0060 },
        confidence: 9
      },
      {
        formatted: "456 Broadway, New York, NY 10013, USA", 
        components: { road: "Broadway", city: "New York", state: "NY", postcode: "10013" },
        geometry: { lat: 40.7205, lng: -74.0052 },
        confidence: 9
      },
      {
        formatted: "789 Fifth Avenue, New York, NY 10022, USA",
        components: { road: "Fifth Avenue", city: "New York", state: "NY", postcode: "10022" },
        geometry: { lat: 40.7614, lng: -73.9776 },
        confidence: 9
      },
      {
        formatted: "100 Hollywood Boulevard, Los Angeles, CA 90028, USA",
        components: { road: "Hollywood Boulevard", city: "Los Angeles", state: "CA", postcode: "90028" },
        geometry: { lat: 34.1022, lng: -118.3267 },
        confidence: 8
      },
      {
        formatted: "200 Sunset Strip, West Hollywood, CA 90069, USA",
        components: { road: "Sunset Strip", city: "West Hollywood", state: "CA", postcode: "90069" },
        geometry: { lat: 34.0901, lng: -118.3850 },
        confidence: 8
      },
      {
        formatted: "800 Michigan Avenue, Chicago, IL 60611, USA",
        components: { road: "Michigan Avenue", city: "Chicago", state: "IL", postcode: "60611" },
        geometry: { lat: 41.8781, lng: -87.6298 },
        confidence: 8
      },
      {
        formatted: "1300 Ocean Drive, Miami Beach, FL 33139, USA",
        components: { road: "Ocean Drive", city: "Miami Beach", state: "FL", postcode: "33139" },
        geometry: { lat: 25.7617, lng: -80.1918 },
        confidence: 7
      }
    ];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 1);
    
    const filtered = mockAddresses
      .filter(address => {
        const addressLower = address.formatted.toLowerCase();
        
        // Exact substring match
        if (addressLower.includes(queryLower)) return true;
        
        // Word-based matching
        return queryWords.some(word => addressLower.includes(word));
      })
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
    console.log(`📍 Mock suggestions returned ${filtered.length} results for "${query}"`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchAddressSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: OpenCageResult) => {
    onChange(suggestion.formatted, {
      lat: suggestion.geometry.lat,
      lng: suggestion.geometry.lng
    });
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setApiError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const handleFocus = () => {
    if (value.length >= 3) {
      fetchAddressSuggestions(value);
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getApiStatusIcon = () => {
    switch (apiStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'missing':
        return <Key className="h-3 w-3 text-amber-500" />;
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case 'checking':
        return 'Validating API key...';
      case 'valid':
        return 'Live OpenCage Data API';
      case 'invalid':
        return 'Invalid API key format';
      case 'missing':
        return 'Demo mode - Add API key for live data';
    }
  };

  const getApiStatusColor = () => {
    switch (apiStatus) {
      case 'checking':
        return 'text-blue-600';
      case 'valid':
        return 'text-green-600';
      case 'invalid':
        return 'text-red-600';
      case 'missing':
        return 'text-amber-600';
    }
  };

  const formatSuggestion = (suggestion: OpenCageResult) => {
    const { components } = suggestion;
    const parts = [];
    
    if (components.house_number && components.road) {
      parts.push(`${components.house_number} ${components.road}`);
    } else if (components.road) {
      parts.push(components.road);
    }
    
    if (components.city) parts.push(components.city);
    if (components.state) parts.push(components.state);
    if (components.postcode) parts.push(components.postcode);
    
    return parts.length > 0 ? parts.join(', ') : suggestion.formatted;
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            className={cn(
              'w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
              className
            )}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal-500"></div>
            ) : (
              <MapPin className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Address Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.geometry.lat}-${suggestion.geometry.lng}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-50 last:border-b-0',
                  selectedIndex === index && 'bg-teal-50 border-teal-100'
                )}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {formatSuggestion(suggestion)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>Confidence: {suggestion.confidence}/10</span>
                      <span>•</span>
                      <span>Lat: {suggestion.geometry.lat.toFixed(4)}, Lng: {suggestion.geometry.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {/* API Status Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {getApiStatusIcon()}
                  <span className={cn('font-medium', getApiStatusColor())}>
                    {getApiStatusText()}
                  </span>
                </div>
                <span className="text-slate-400">{suggestions.length} results</span>
              </div>
              
              {/* API Setup Link for Missing Key */}
              {apiStatus === 'missing' && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <a
                    href="https://opencagedata.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get Free OpenCage API Key
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Error Message */}
        {apiError && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-md shadow-lg p-3">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{apiError}</span>
            </div>
            <div className="mt-2 text-xs text-amber-500">
              Using demo data instead. Check API key and quota.
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Enhanced help text with API status */}
      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex items-center space-x-2">
          {getApiStatusIcon()}
          <span className={getApiStatusColor()}>
            {getApiStatusText()}
          </span>
        </div>
        
        {apiStatus === 'valid' ? (
          <p>Start typing your store address for live suggestions from OpenCage Data</p>
        ) : (
          <div>
            <p className="font-medium">Demo mode - Try these test queries:</p>
            <p className="text-slate-400">
              "main", "broadway", "sunset", "downtown", "123", "hollywood", "michigan"
            </p>
            {apiStatus === 'missing' && (
              <p className="text-amber-600 mt-1">
                Add VITE_OPENCAGE_API_KEY to .env for live address suggestions
              </p>
            )}
            {apiStatus === 'invalid' && (
              <p className="text-red-600 mt-1">
                API key format invalid - should be alphanumeric, 20+ characters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}