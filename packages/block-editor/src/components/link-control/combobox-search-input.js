/**
 * WordPress dependencies
 */
import { forwardRef, useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { debounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import LinkControlSearchItem from './search-item';

/**
 * Internal dependencies
 */

import { CREATE_TYPE } from './constants';
import useSearchHandler from './use-search-handler';

// Must be a function as otherwise URLInput will default
// to the fetchLinkSuggestions passed in block editor settings
// which will cause an unintended http request.
const noopSearchHandler = () => Promise.resolve( [] );

const noop = () => {};

const ComboboxLinkControlSearchInput = forwardRef(
	(
		{
			value,
			children,
			currentLink = {},
			className = null,
			placeholder = null,
			withCreateSuggestion = false,
			onCreateSuggestion = noop,
			onChange = noop,
			onSelect = noop,
			showSuggestions = true,
			fetchSuggestions = null,
			allowDirectEntry = true,
			suggestionsQuery = {},
			withURLSuggestion = true,
			hideLabelFromVision = false,
		},
		ref
	) => {
		const genericSearchHandler = useSearchHandler(
			suggestionsQuery,
			allowDirectEntry,
			withCreateSuggestion,
			withURLSuggestion
		);

		const searchHandler = showSuggestions
			? fetchSuggestions || genericSearchHandler
			: noopSearchHandler;

		const [ suggestions, setSuggestions ] = useState( [] );
		const [ isLoading, setIsLoading ] = useState( false );

		// Ensure we have a value, either from props or currentLink
		const displayValue = value || currentLink?.url || '';

		// Transform suggestions to ComboboxControl options format
		const options = useMemo( () => {
			const suggestionOptions = suggestions.map( ( suggestion ) => ( {
				label: suggestion.title || suggestion.url,
				value: suggestion.url,
				suggestion, // Keep original suggestion data for onSelect
			} ) );

			// If we have a current value but no suggestions, add it as an option
			if ( displayValue && ! suggestions.length ) {
				suggestionOptions.push( {
					label: displayValue,
					value: displayValue,
					suggestion: { url: displayValue, title: displayValue }, // Create a basic suggestion object
				} );
			}

			return suggestionOptions;
		}, [ suggestions, displayValue ] );

		// Debounced search function to prevent aggressive re-rendering
		const debouncedSearch = useCallback(
			debounce( async ( inputValue, isInitial = false ) => {
				if ( ! showSuggestions ) {
					return;
				}

				setIsLoading( true );
				try {
					const results = await searchHandler( inputValue, {
						isInitialSuggestions: isInitial,
					} );
					setSuggestions( results );
				} catch ( error ) {
					setSuggestions( [] );
				} finally {
					setIsLoading( false );
				}
			}, 500 ),
			[ searchHandler, showSuggestions ]
		);

		// Handle search input changes
		const handleInputChange = ( inputValue ) => {
			onChange( inputValue );

			if ( ! showSuggestions || ! inputValue?.trim() ) {
				setSuggestions( [] );
				return;
			}

			// Only search if input has at least 3 characters
			if ( inputValue.trim().length < 3 ) {
				setSuggestions( [] );
				return;
			}

			// Use debounced search to prevent aggressive re-rendering
			debouncedSearch( inputValue, false );
		};

		// Handle input focus - show initial suggestions
		const handleFocus = () => {
			if ( ! showSuggestions ) {
				return;
			}

			// Use debounced search for initial suggestions
			debouncedSearch( '', true );
		};

		// Handle option selection
		const handleOptionSelect = async ( selectedValue ) => {
			const selectedOption = options.find(
				( option ) => option.value === selectedValue
			);

			if ( ! selectedOption ) {
				// Handle direct entry
				if ( allowDirectEntry && selectedValue ) {
					onSelect( { url: selectedValue } );
				}
				return;
			}

			const suggestion = selectedOption.suggestion;

			if ( CREATE_TYPE === suggestion.type ) {
				// Create a new page and call onSelect with the output from the onCreateSuggestion callback.
				try {
					const newSuggestion = await onCreateSuggestion(
						suggestion.title
					);
					if ( newSuggestion?.url ) {
						onSelect( newSuggestion );
					}
				} catch ( e ) {}
				return;
			}

			if ( suggestion && Object.keys( suggestion ).length >= 1 ) {
				const { id, url, ...restLinkProps } = currentLink ?? {};
				onSelect(
					// Some direct entries don't have types or IDs, and we still need to clear the previous ones.
					{ ...restLinkProps, ...suggestion },
					suggestion
				);
			}
		};

		const _placeholder = placeholder ?? __( 'Search or type URL' );
		const label =
			hideLabelFromVision && placeholder !== ''
				? _placeholder
				: __( 'Link' );

		return (
			<div className="block-editor-link-control__search-input-container">
				<ComboboxControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ label }
					value={ displayValue }
					options={ options }
					onFilterValueChange={ handleInputChange }
					onChange={ handleOptionSelect }
					onFocus={ handleFocus }
					placeholder={ _placeholder }
					allowReset={ !! displayValue }
					onReset={ () => {
						onChange( '' );
						onSelect( { url: '' } );
						setSuggestions( [] ); // Clear suggestions so current value isn't shown as an option
					} }
					className={ className }
					ref={ ref }
					expandOnFocus={ false }
					isLoading={ isLoading }
					__experimentalRenderItem={ ( { item } ) => (
						<LinkControlSearchItem
							suggestion={ item.suggestion }
							searchTerm={ displayValue }
							onClick={ () => handleOptionSelect( item.value ) }
							isURL={ false }
							shouldShowType
						/>
					) }
				/>
				{ children }
			</div>
		);
	}
);

export default ComboboxLinkControlSearchInput;
