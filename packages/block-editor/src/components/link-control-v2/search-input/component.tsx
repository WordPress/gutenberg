/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useState,
	useEffect,
	useMemo,
	useCallback,
} from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ComboboxControl } from '@wordpress/components';
import { useLinkControlV2Context } from '../context';
import { transformSuggestionsToOptions } from '../utils/transform-suggestions';
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
 * Uses ComboboxControl to provide entity search functionality.
 * Delegates all search logic to the searchHandler from context.
 */
export const SearchInput = forwardRef< HTMLInputElement, SearchInputProps >(
	function SearchInput( { showLabel = false, ...props } ) {
		const context = useLinkControlV2Context();
		const {
			uncommittedValue,
			setUncommittedValue,
			searchHandler,
			commitValue,
			setIsEditing,
			value: currentLinkValue,
		} = context;

		// Current search input value with debouncing
		const [ searchValue, setSearchValue, debouncedSearch ] =
			useDebouncedInput( '' );

		// Options for ComboboxControl
		const [ options, setOptions ] = useState< ComboboxControlOption[] >(
			[]
		);
		const [ isLoading, setIsLoading ] = useState( false );

		// Current selected value (URL from uncommitted value)
		const currentValue = uncommittedValue?.url || null;

		// Call search handler and update options
		const performSearch = useCallback(
			async ( query: string, isInitial = false ) => {
				if ( ! searchHandler ) {
					// If no handler, only clear options if user has typed something
					if ( query.length > 0 ) {
						setOptions( [] );
					}
					return;
				}

				setIsLoading( true );

				try {
					const result = await searchHandler( query, {
						currentValue: currentLinkValue,
						isInitial,
					} );

					// Transform suggestions to options
					const transformedOptions = transformSuggestionsToOptions(
						result.suggestions
					);
					setOptions( transformedOptions );
				} catch {
					setOptions( [] );
				} finally {
					setIsLoading( false );
				}
			},
			[ searchHandler, currentLinkValue ]
		);

		// Perform search when debounced search value changes
		useEffect( () => {
			// If there's a search value, perform search (not initial)
			if ( debouncedSearch ) {
				performSearch( debouncedSearch, false );
				return;
			}

			// If no search value, try initial suggestions
			// The handler will decide whether to return initial suggestions
			performSearch( '', true );
		}, [ debouncedSearch, performSearch ] );

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
				const isDirectEntry = suggestion.isDirectEntry === true;

				// Handle direct entry (URL) - no entity data
				if ( isDirectEntry ) {
					const newValue = {
						...uncommittedValue,
						url: suggestion.url,
						title: suggestion.url, // Use URL as title for direct entries
					};
					// Auto-commit when a suggestion is selected
					commitValue( newValue );
					// Exit editing mode (mirrors original LinkControl behavior)
					setIsEditing( false );
					return;
				}

				// Handle entity suggestions
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
				// Fallback: direct URL entry (shouldn't happen if handler works correctly)
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

		// When user hasn't typed anything and there are no options,
		// provide a placeholder option to prevent "No results found" from showing
		const displayOptions = useMemo( () => {
			if ( searchValue.length === 0 && options.length === 0 ) {
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
		}, [ options, searchValue ] );

		return (
			<ComboboxControl
				label={ showLabel ? __( 'Link' ) : undefined }
				hideLabelFromVision={ ! showLabel }
				placeholder={ __( 'Paste URL or type to search' ) }
				value={ displayValue }
				options={ displayOptions }
				onChange={ handleChange }
				onFilterValueChange={ handleFilterChange }
				isLoading={ isLoading }
				expandOnFocus={ false }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				{ ...props }
			/>
		);
	}
);

SearchInput.displayName = 'LinkControlV2.SearchInput';
