/**
 * WordPress dependencies
 */
import { forwardRef, useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { ComboboxControl } from '@wordpress/components';
import { useLinkControlV2Context } from '../context';
import { transformSuggestionsToOptions } from '../utils/transform-suggestions';
import { isURLLike } from '../utils/is-url-like';
import type { ComboboxControlOption, LinkSuggestion } from '../types';

interface SearchInputProps {
	/**
	 * Whether to show the label.
	 */
	showLabel?: boolean;
}

/**
 * SearchInput subcomponent for LinkControlV2.
 *
 * Uses ValidatedComboboxControl to provide entity search functionality.
 * Supports direct URL entry and entity search via fetchSuggestions.
 */
export const SearchInput = forwardRef< HTMLInputElement, SearchInputProps >(
	function SearchInput( { showLabel = false, ...props } ) {
		const context = useLinkControlV2Context();
		const {
			uncommittedValue,
			setUncommittedValue,
			fetchSuggestions,
			showInitialSuggestions,
			commitValue,
			setIsEditing,
		} = context;

		// Current search input value with debouncing
		const [ searchValue, setSearchValue, debouncedSearch ] =
			useDebouncedInput( '' );

		// Options for ComboboxControl
		const [ options, setOptions ] = useState< ComboboxControlOption[] >( [] );
		const [ isLoading, setIsLoading ] = useState( false );

		// Current selected value (URL from uncommitted value)
		const currentValue = uncommittedValue?.url || null;

		// Immediately set options for URL-like input (before debounce)
		// This prevents "No results found" from flashing while typing URLs
		useEffect( () => {
			if ( searchValue && isURLLike( searchValue ) ) {
				const url = prependHTTP( searchValue );
				setOptions( [
					{
						label: url,
						value: url,
						suggestion: {
							title: url,
							url,
							type: 'URL',
						},
					},
				] );
				setIsLoading( false );
			} else if ( searchValue && ! isURLLike( searchValue ) && searchValue.length < 2 ) {
				// Only clear options if user has typed something
				// This prevents "No results found" from showing on initial focus
				if ( searchValue.length > 0 ) {
					setOptions( [] );
				}
			}
		}, [ searchValue ] );

		// Fetch and set suggestions based on search query
		const fetchAndSetSuggestions = useCallback( async ( query: string, isInitial = false ) => {
			// If showInitialSuggestions is false, never fetch initial suggestions
			if ( isInitial && ! showInitialSuggestions ) {
				return;
			}

			if ( ! fetchSuggestions ) {
				// Only clear options if user has typed something
				if ( query.length > 0 ) {
					setOptions( [] );
				}
				return;
			}

			// If it looks like a URL, skip fetching and show direct entry option
			if ( query && isURLLike( query ) ) {
				const url = prependHTTP( query );
				setOptions( [
					{
						label: url,
						value: url,
						suggestion: {
							title: url,
							url,
							type: 'URL',
						},
					},
				] );
				setIsLoading( false );
				return;
			}

			const shouldFetch = query.length >= 2 || isInitial;

			if ( ! shouldFetch ) {
				// Don't clear options if user hasn't typed anything yet
				// This prevents "No results found" from showing on initial focus
				if ( query.length > 0 ) {
					setOptions( [] );
				}
				setIsLoading( false );
				return;
			}

			setIsLoading( true );

			try {
				const suggestions = await fetchSuggestions( query, {
					isInitialSuggestions: isInitial,
					currentValue: uncommittedValue,
				} );

				// Transform to options
				const transformedOptions = transformSuggestionsToOptions( suggestions );
				setOptions( transformedOptions );
			} catch {
				setOptions( [] );
			} finally {
				setIsLoading( false );
			}
		}, [ fetchSuggestions, uncommittedValue, showInitialSuggestions ] );

		// Fetch suggestions when search changes
		useEffect( () => {
			// Only treat as initial if showInitialSuggestions is enabled AND there's no search query
			const isInitial = showInitialSuggestions && ! debouncedSearch;

			// If showInitialSuggestions is false, don't fetch when query is empty
			if ( ! showInitialSuggestions && ! debouncedSearch ) {
				return;
			}

			fetchAndSetSuggestions( debouncedSearch || '', isInitial );
		}, [ debouncedSearch, fetchAndSetSuggestions, showInitialSuggestions ] );

		// Load initial suggestions on mount if enabled
		useEffect( () => {
			// Only load initial suggestions if explicitly enabled
			if ( showInitialSuggestions && fetchSuggestions && ! searchValue ) {
				fetchAndSetSuggestions( '', true );
			}
		}, [ fetchAndSetSuggestions, fetchSuggestions, searchValue, showInitialSuggestions ] );

		// Handle selection change
		const handleChange = ( selectedValue: string | null | undefined ) => {
			if ( ! selectedValue || selectedValue === '__placeholder__' ) {
				if ( ! selectedValue ) {
					setUncommittedValue( {
						...uncommittedValue,
						url: undefined,
					} );
				}
				return;
			}

			// Find the option to get the full suggestion data
			const selectedOption = options.find(
				( opt ) => opt.value === selectedValue
			);

			if ( selectedOption?.suggestion ) {
				// Update uncommitted value with suggestion data
				const suggestion = selectedOption.suggestion as LinkSuggestion;
				const isEntity =
					suggestion.id !== undefined &&
					suggestion.kind !== undefined &&
					suggestion.type !== undefined;
				const newValue = {
					...uncommittedValue,
					url: suggestion.url,
					// For entities, use suggestion title; for non-entities, use URL as title
					title: isEntity ? suggestion.title : suggestion.url,
					// For entities, set label to match title by default
					label: isEntity ? suggestion.title : undefined,
					id:
						typeof suggestion.id === 'number'
							? suggestion.id
							: undefined,
					kind: suggestion.kind,
					type: suggestion.type,
				};
				// Auto-commit when a suggestion is selected
				commitValue( newValue );
				// Exit editing mode (mirrors original LinkControl behavior)
				setIsEditing( false );
			} else {
				// Direct URL entry
				setUncommittedValue( {
					...uncommittedValue,
					url: selectedValue,
				} );
			}
		};

		// Handle filter value change (user typing)
		const handleFilterChange = ( value: string ) => {
			setSearchValue( value );
		};

		// Display value - show URL from uncommitted value when not searching
		const displayValue = useMemo( () => {
			if ( searchValue ) {
				return null; // Let ComboboxControl show the search input
			}
			return currentValue;
		}, [ searchValue, currentValue ] );

		// When showInitialSuggestions is false and user hasn't typed anything,
		// provide a placeholder option to prevent "No results found" from showing
		const displayOptions = useMemo( () => {
			if (
				! showInitialSuggestions &&
				searchValue.length === 0 &&
				options.length === 0
			) {
				// Return a disabled placeholder option to prevent "No results" message
				return [
					{
						label: __( 'Start typing to search' ),
						value: '__placeholder__',
						disabled: true,
					},
				];
			}
			return options;
		}, [ options, showInitialSuggestions, searchValue ] );

		return (
			<ComboboxControl
				label={ __( 'Link' ) }
				hideLabelFromVision={ ! showLabel }
				placeholder={ __( 'Paste URL or type to search' ) }
				value={ displayValue }
				options={ displayOptions }
				onChange={ handleChange }
				onFilterValueChange={ handleFilterChange }
				isLoading={ isLoading }
				expandOnFocus={ showInitialSuggestions }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				{ ...props }
			/>
		);
	}
);

SearchInput.displayName = 'LinkControlV2.SearchInput';
