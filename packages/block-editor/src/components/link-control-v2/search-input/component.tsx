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

/**
 * SearchInput subcomponent for LinkControlV2.
 *
 * Uses ValidatedComboboxControl to provide entity search functionality.
 * Supports direct URL entry and entity search via fetchSuggestions.
 */
export const SearchInput = forwardRef< HTMLInputElement >(
	function SearchInput( props ) {
		const context = useLinkControlV2Context();
		const {
			uncommittedValue,
			setUncommittedValue,
			fetchSuggestions,
			showInitialSuggestions,
		} = context;

		// Current search input value with debouncing
		const [ searchValue, setSearchValue, debouncedSearch ] =
			useDebouncedInput( '' );

		// Options for ComboboxControl
		const [ options, setOptions ] = useState< ComboboxControlOption[] >( [] );
		const [ isLoading, setIsLoading ] = useState( false );

		// Current selected value (URL from uncommitted value)
		const currentValue = uncommittedValue?.url || null;

		// Fetch and set suggestions based on search query
		const fetchAndSetSuggestions = useCallback( async ( query: string, isInitial = false ) => {
			if ( ! fetchSuggestions ) {
				setOptions( [] );
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
				setOptions( [] );
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
		}, [ fetchSuggestions, uncommittedValue ] );

		// Fetch suggestions when search changes
		useEffect( () => {
			const isInitial = showInitialSuggestions && ! debouncedSearch;
			fetchAndSetSuggestions( debouncedSearch || '', isInitial );
		}, [ debouncedSearch, fetchSuggestions, showInitialSuggestions, uncommittedValue ] );

		// Load initial suggestions on mount if enabled
		useEffect( () => {
			if ( showInitialSuggestions && fetchSuggestions && ! searchValue ) {
				fetchAndSetSuggestions( '', true );
			}
		}, [ fetchAndSetSuggestions, fetchSuggestions, searchValue, showInitialSuggestions ] );

		// Handle selection change
		const handleChange = ( selectedValue: string | null | undefined ) => {
			if ( ! selectedValue ) {
				setUncommittedValue( {
					...uncommittedValue,
					url: undefined,
				} );
				return;
			}

			// Find the option to get the full suggestion data
			const selectedOption = options.find(
				( opt ) => opt.value === selectedValue
			);

			if ( selectedOption?.suggestion ) {
				// Update uncommitted value with suggestion data
				const suggestion = selectedOption.suggestion as LinkSuggestion;
				setUncommittedValue( {
					...uncommittedValue,
					url: suggestion.url,
					title: suggestion.title || uncommittedValue?.title,
					id:
						typeof suggestion.id === 'number'
							? suggestion.id
							: undefined,
					kind: suggestion.kind,
					type: suggestion.type,
				} );
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

		// eslint-disable-next-line @typescript-eslint/no-restricted-imports
		return (
			<ComboboxControl
				label={ __( 'URL' ) }
				hideLabelFromVision
				placeholder={ __( 'Paste URL or type to search' ) }
				value={ displayValue }
				options={ options }
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
