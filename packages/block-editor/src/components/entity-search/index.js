/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	ComboboxControl,
	Icon,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';
import {
	useState,
	useMemo,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { debounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { page, postList, category, tag } from '@wordpress/icons';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';

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
 * Get a display label for an entity type.
 *
 * @param {string} type - The entity type
 * @return {string} The display label
 */
function getEntityTypeLabel( type ) {
	switch ( type ) {
		case 'page':
			return __( 'Page' );
		case 'post':
			return __( 'Post' );
		case 'category':
			return __( 'Category' );
		case 'tag':
		case 'post_tag':
			return __( 'Tag' );
		default:
			return __( 'Item' );
	}
}

/**
 * EntitySearch component - A combobox for searching and selecting entities.
 *
 * Provides a searchable dropdown that fetches posts, pages, taxonomies, and other
 * entities from the site as the user types.
 *
 * @param {Object}   props                 - Component props
 * @param {string}   props.label           - Label for the control
 * @param {string}   props.value           - Current selected URL value
 * @param {Function} props.onSearch        - Function to fetch suggestions, receives searchTerm and should return a Promise
 *                                         - Called with empty string for initial suggestions
 * @param {Function} props.onChange        - Callback when selection changes, receives (url, suggestion)
 *                                         - suggestion is the selected entity data when choosing from options,
 *                                         - or null when typing freeform input
 * @param {string}   props.help            - Optional help text
 * @param {Function} props.getDisplayValue - Function to determine what to display in the input field
 *                                         Receives the suggestion object, should return a string
 *                                         Defaults to showing the URL
 * @param {boolean}  props.allowFreeform   - Whether to allow freeform input (not from options) on blur
 *                                         Defaults to true. When false, only values selected from options will be committed
 * @return {JSX.Element} The EntitySearch component
 */
export const EntitySearch = forwardRef(
	(
		{
			label,
			value,
			onSearch,
			onChange,
			help,
			getDisplayValue = ( suggestion ) => suggestion?.url || '',
			allowFreeform = true,
		},
		ref
	) => {
		const [ searchTerm, setSearchTerm ] = useState( '' );
		const [ suggestions, setSuggestions ] = useState( [] );
		const [ isLoading, setIsLoading ] = useState( false );
		const entitySearchRef = useRef( null );

		// Expose select method to parent component
		useImperativeHandle( ref, () => ( {
			select: () => {
				const input = entitySearchRef.current?.querySelector( 'input' );
				if ( input ) {
					input.focus();
					input.select();
				}
			},
		} ) );

		// Create debounced fetch function
		const debouncedFetch = useMemo(
			() =>
				debounce( ( term ) => {
					if ( ! onSearch ) {
						setSuggestions( [] );
						setIsLoading( false );
						return;
					}

					setIsLoading( true );
					onSearch( term )
						.then( ( results ) => {
							setSuggestions( results || [] );
							setIsLoading( false );
						} )
						.catch( () => {
							setSuggestions( [] );
							setIsLoading( false );
						} );
				}, 300 ),
			[ onSearch ]
		);

		// Trigger fetch when searchTerm changes
		useEffect( () => {
			debouncedFetch( searchTerm );
		}, [ searchTerm, debouncedFetch ] );

		// Transform suggestions into combobox options
		const options = useMemo( () => {
			// Build options from search results
			const opts = suggestions.map( ( suggestion ) => ( {
				value: suggestion.url,
				label: getDisplayValue( suggestion ),
				suggestion,
			} ) );

			// Add current value if it exists and isn't already in suggestions
			// This is needed for ComboboxControl to display the current value
			if ( value && ! opts.some( ( opt ) => opt.value === value ) ) {
				opts.unshift( {
					value,
					label: value,
					isCurrentValue: true,
				} );
			}

			// Add current search term as a freeform option if it's not in suggestions
			// This ensures typed text is available immediately for blur/selection
			if (
				searchTerm &&
				searchTerm !== value &&
				! opts.some( ( opt ) => opt.value === searchTerm )
			) {
				opts.unshift( {
					value: searchTerm,
					label: searchTerm,
					isCurrentValue: true,
				} );
			}
			return opts;
		}, [ suggestions, getDisplayValue, value, searchTerm ] );

		// Handle search input changes - sets search term immediately
		const handleFilterValueChange = ( inputValue ) => {
			// Set search term immediately (the fetch will be debounced)
			setSearchTerm( inputValue );
		};

		// Handle blur to commit typed value
		const handleBlur = () => {
			// Get the actual input value directly from DOM to avoid debounce issues
			const input = entitySearchRef.current?.querySelector( 'input' );
			const currentInputValue = input?.value || '';

			// If user typed something different from current value
			if ( currentInputValue && currentInputValue !== value ) {
				// Check if it was selected from options
				const matchingOption = options.find(
					( opt ) => opt.value === currentInputValue
				);

				if ( matchingOption ) {
					// Value was selected from options
					onChange( currentInputValue, matchingOption.suggestion );
				} else if ( allowFreeform ) {
					// Freeform input - pass null for suggestion to indicate it's not from options
					onChange( currentInputValue, null );
				}
			}
		};

		return (
			<div
				ref={ entitySearchRef }
				onBlur={ handleBlur }
				className={ clsx( 'entity-search', {
					'is-freeform': allowFreeform,
				} ) }
			>
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
						// Only show rich rendering for actual search results
						// Hide the current value from dropdown
						if ( item.isCurrentValue ) {
							return (
								<div className="entity-search__current-value-hidden" />
							);
						}

						const { suggestion } = item;
						if ( ! suggestion ) {
							return <div>{ item.label }</div>;
						}

						const icon = getEntityIcon( suggestion?.type );
						// Extract just the pathname for site URLs
						let displayURL;
						try {
							const url = new URL(
								suggestion?.url,
								window.location.origin
							);
							// If it's the same origin, show just the pathname
							if ( url.origin === window.location.origin ) {
								displayURL =
									url.pathname + url.search + url.hash;
							} else {
								displayURL = filterURLForDisplay(
									suggestion?.url
								);
							}
						} catch {
							displayURL = filterURLForDisplay( suggestion?.url );
						}

						const typeLabel = getEntityTypeLabel(
							suggestion?.type
						);

						return (
							<Flex gap={ 2 }>
								<FlexItem>
									<Icon icon={ icon } />
								</FlexItem>
								<FlexBlock>
									<div>{ suggestion?.title }</div>
									<div className="entity-search__url">
										{ displayURL }
									</div>
								</FlexBlock>
								<FlexItem className="entity-search__type">
									{ typeLabel }
								</FlexItem>
							</Flex>
						);
					} }
				/>
			</div>
		);
	}
);
