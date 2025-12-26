/**
 * Address Autocomplete Component
 * 
 * Provides Google Places Autocomplete functionality for address input.
 * When a user selects an address, it parses the components and calls
 * onAddressSelect with the parsed address data.
 */

import { useEffect, useRef, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
} from 'use-places-autocomplete';
import { loadGoogleMapsScript } from '../lib/loadGoogleMapsScript';
import './AddressAutocomplete.css';

export interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  required?: boolean;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter an address',
  disabled = false,
  id,
  className = '',
  required = false,
}: AddressAutocompleteProps) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Load Google Maps script on mount
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setIsScriptLoaded(true);
        setScriptError(null);
      })
      .catch((error) => {
        setScriptError(error.message);
        setIsScriptLoaded(false);
      });
  }, []);

  // Initialize Places Autocomplete
  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'us' }, // Restrict to US addresses
    },
    debounce: 300,
    initOnMount: isScriptLoaded,
  });

  // Sync external value with autocomplete value when it changes externally
  // Using a ref to track if the change came from user input vs external prop change
  const isInternalChangeRef = useRef(false);
  
  useEffect(() => {
    if (!isInternalChangeRef.current && value !== autocompleteValue) {
      setValue(value, false);
    }
    isInternalChangeRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isInternalChangeRef.current = true;
    setValue(newValue);
    onChange(newValue);
  };

  // Handle address selection
  const handleSelect = async (suggestion: {
    place_id: string;
    description: string;
  }) => {
    isInternalChangeRef.current = true;
    // Use the full formatted description from Google Places
    setValue(suggestion.description, false);
    clearSuggestions();
    onChange(suggestion.description);

    try {
      // Get place details to parse components
      const results = await getGeocode({ placeId: suggestion.place_id });
      if (!results || results.length === 0) return;

      const place = results[0];
      const addressComponents = place.address_components || [];

      // Parse address components
      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let zipCode = '';
      let country = '';

      addressComponents.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (
          types.includes('locality') ||
          types.includes('sublocality_level_1')
        ) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('postal_code')) {
          zipCode = component.long_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        }
      });

      // Use street number + route for the address field, but the full description
      // is already set in the input via onChange above
      const streetAddress = [streetNumber, route].filter(Boolean).join(' ');

      // Call callback with parsed components
      if (onAddressSelect) {
        onAddressSelect({
          address: streetAddress || suggestion.description, // Fallback to full description if no street address
          city,
          state,
          zipCode,
          country,
        });
      }
    } catch (error) {
      console.error('Error parsing address:', error);
    }
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        inputRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSuggestions]);

  // Combine class names
  const inputClassName = `address-autocomplete-input form-input ${className}`.trim();

  // Show error state if script failed to load
  // Allow manual entry even if script fails
  if (scriptError) {
    return (
      <div className="address-autocomplete-error">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
          required={required}
        />
        <p className="address-autocomplete-error-message">
          {scriptError}. Address autocomplete is unavailable, but you can still enter addresses manually.
        </p>
      </div>
    );
  }

  return (
    <div className="address-autocomplete-container">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={autocompleteValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled || !ready || !isScriptLoaded}
        className={inputClassName}
        required={required}
        autoComplete="off"
      />
      {status === 'OK' && data.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="address-autocomplete-suggestions"
          role="listbox"
        >
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="address-autocomplete-suggestion-item"
              onClick={() => handleSelect(suggestion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(suggestion);
                }
              }}
              role="option"
              tabIndex={0}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
      {status === 'ZERO_RESULTS' && autocompleteValue && (
        <p className="address-autocomplete-no-results">
          No addresses found. You can continue typing or select a suggestion if one appears.
        </p>
      )}
    </div>
  );
};

