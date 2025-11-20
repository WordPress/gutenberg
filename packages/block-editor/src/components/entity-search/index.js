/**
 * WordPress dependencies
 */
import { ComboboxControl, Icon } from '@wordpress/components';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { debounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { page, postList, category, tag } from '@wordpress/icons';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Get an icon for an entity type.
 *
 * @param {string} type - The entity type
 * @return {Object} The icon object
 */
function getEntityIcon( type ) {
	switch ( type ) {
		case 'page':
			return page;
		case 'post':
			return postList;
		case 'category':
			return category;
		case 'tag':
		case 'post_tag':
			return tag;
		default:
			return postList;
	}
}

/**
 * EntitySearch component - A combobox for searching and selecting entities.
 *
 * Provides a searchable dropdown that fetches posts, pages, taxonomies, and other
 * entities from the site as the user types. Uses the WordPress search API to search
 * across all post types (including custom) and taxonomies.
 *
 * @param {Object}   props                  - Component props
 * @param {string}   props.label            - Label for the control
 * @param {string}   props.value            - Current selected URL value
 * @param {Function} props.onChange         - Callback when selection changes, receives URL
 * @param {string}   props.help             - Optional help text
 * @param {Object}   props.suggestionsQuery - Query parameters to filter search results
 *                                          - type: 'post' | 'term' | 'attachment' | 'post-format'
 *                                          - subtype: specific post type or taxonomy slug (e.g., 'page', 'post', 'category', 'post_tag')
 * @param {Function} props.getDisplayValue  - Function to determine what to display in the input field
 *                                          Receives the suggestion object, should return a string
 *                                          Defaults to showing the URL
 * @return {JSX.Element} The EntitySearch component
 */
export const EntitySearch = forwardRef(
	(
		{
			label,
			value,
			onChange,
			help,
			suggestionsQuery = {},
			getDisplayValue = ( suggestion ) => suggestion?.url || '',
		},
		ref
	) => {
		const [ searchTerm, setSearchTerm ] = useState( '' );
		const [ suggestions, setSuggestions ] = useState( [] );
		const [ isLoading, setIsLoading ] = useState( false );
		const inputRef = useRef( null );

		// Expose select method to parent component
		useImperativeHandle( ref, () => ( {
			select: () => {
				const input = inputRef.current?.querySelector( 'input' );
				if ( input ) {
					input.focus();
					input.select();
				}
			},
		} ) );

		// Get the fetchLinkSuggestions function from block editor settings
		const fetchLinkSuggestions = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			return getSettings().__experimentalFetchLinkSuggestions;
		}, [] );

		// Destructure suggestionsQuery to track actual values instead of object reference
		const { type, subtype } = suggestionsQuery;

		// Memoize search options to prevent infinite loops from object references
		const searchOptions = useMemo(
			() => ( {
				perPage: 20,
				type,
				subtype,
			} ),
			[ type, subtype ]
		);

		// Fetch suggestions only when user has typed something
		useEffect( () => {
			// Only fetch if there's a search term
			if ( ! searchTerm || ! fetchLinkSuggestions ) {
				setSuggestions( [] );
				setIsLoading( false );
				return;
			}

			setIsLoading( true );

			fetchLinkSuggestions( searchTerm, searchOptions )
				.then( ( results ) => {
					setSuggestions( results || [] );
					setIsLoading( false );
				} )
				.catch( () => {
					setSuggestions( [] );
					setIsLoading( false );
				} );
		}, [ searchTerm, fetchLinkSuggestions, searchOptions ] );

		// Transform suggestions into combobox options
		const options = useMemo( () => {
			// Build options from search results
			const opts = suggestions.map( ( suggestion ) => ( {
				value: suggestion.url,
				label: getDisplayValue( suggestion ),
				suggestion,
			} ) );

			// Add current value as first option when input is empty or matches search
			if ( value ) {
				const valueMatchesSearch =
					! searchTerm ||
					value.toLowerCase().includes( searchTerm.toLowerCase() );

				// Check if value is already in suggestions to avoid duplicate keys
				const alreadyInSuggestions = opts.some(
					( opt ) => opt.value === value
				);

				if ( valueMatchesSearch && ! alreadyInSuggestions ) {
					// Add current value at the beginning
					opts.unshift( {
						value,
						label: value,
						isCurrentValue: true,
					} );
				}
			}

			// Add freeform option for typed values (when user is actively typing)
			// This allows Enter/blur to commit whatever the user typed
			if ( searchTerm ) {
				// Don't add if it duplicates any existing option
				const alreadyExists = opts.some(
					( opt ) => opt.value === searchTerm
				);
				if ( ! alreadyExists ) {
					opts.push( {
						value: searchTerm,
						label: searchTerm,
						isFreeformOption: true,
					} );
				}
			}

			return opts;
		}, [ suggestions, getDisplayValue, searchTerm, value ] );

		// Debounced search term setter
		const debouncedSetSearchTerm = useMemo(
			() =>
				debounce( ( inputValue ) => {
					setSearchTerm( inputValue );
				}, 300 ),
			[]
		);

		// Handle search input changes (NOT debounced for ignore check)
		const handleFilterValueChange = ( inputValue ) => {
			// Don't search if input is empty
			// ComboboxControl clears the input on focus - this is intentional
			// Just show the current value in options and let user type or select
			if ( inputValue === '' ) {
				setSearchTerm( '' );
				return;
			}

			// Debounce the actual search
			debouncedSetSearchTerm( inputValue );
		};

		// Handle blur to commit typed value
		const handleBlur = () => {
			// Get the actual input value directly from DOM to avoid debounce issues
			const input = inputRef.current?.querySelector( 'input' );
			const currentInputValue = input?.value || '';

			// If user typed something that hasn't been committed, commit it
			if ( currentInputValue && currentInputValue !== value ) {
				onChange( currentInputValue );
			}
		};

		return (
			<>
				<style>
					{ `
					.components-form-token-field__suggestion:has([data-freeform-option]) {
						display: none !important;
					}
				` }
				</style>
				<div ref={ inputRef } onBlur={ handleBlur }>
					<ComboboxControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ label }
						help={ help }
						value={ value }
						options={ options }
						onFilterValueChange={ handleFilterValueChange }
						onChange={ ( newValue ) => {
							// Clear search term when user selects an option
							setSearchTerm( '' );

							// Find the selected option to get the full suggestion data
							const selectedOption = options.find(
								( opt ) => opt.value === newValue
							);

							// If we have suggestion data, pass it along with the URL
							// This enables entity binding in navigation links
							if ( selectedOption?.suggestion ) {
								onChange( newValue, selectedOption.suggestion );
							} else {
								onChange( newValue );
							}
						} }
						isLoading={ isLoading }
						hideLabelFromVision
						expandOnFocus={ false }
						placeholder={ __( 'Search or type URL' ) }
						__experimentalRenderItem={ ( { item } ) => {
							// Hide the freeform option visually using CSS :has() selector
							if ( item.isFreeformOption ) {
								return <div data-freeform-option="true" />;
							}

							// Only show rich rendering for actual search results
							const { suggestion } = item;
							if ( ! suggestion ) {
								return <div>{ item.label }</div>;
							}

							const icon = getEntityIcon( suggestion?.type );
							const displayURL = filterURLForDisplay(
								suggestion?.url
							);

							return (
								<div
									style={ {
										display: 'flex',
										alignItems: 'flex-start',
										gap: '8px',
										width: '100%',
									} }
								>
									<Icon
										icon={ icon }
										style={ { marginTop: '2px' } }
									/>
									<div style={ { flex: 1, minWidth: 0 } }>
										<div>{ suggestion?.title }</div>
										<div
											style={ {
												fontSize: '12px',
												color: '#757575',
												marginTop: '2px',
											} }
										>
											{ displayURL }
										</div>
									</div>
								</div>
							);
						} }
					/>
				</div>
			</>
		);
	}
);
