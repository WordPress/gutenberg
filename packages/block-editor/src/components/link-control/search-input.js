/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useInstanceId, debounce } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { URLInput } from '../';
import LinkControlSearchResults from './search-results';
import LinkControlSearchItem from './search-item';
import { CREATE_TYPE } from './constants';
import useSearchHandler from './use-search-handler';
import { ComboboxControl } from '@wordpress/components';

// Must be a function as otherwise URLInput will default
// to the fetchLinkSuggestions passed in block editor settings
// which will cause an unintended http request.
const noopSearchHandler = () => Promise.resolve( [] );

const noop = () => {};

const LinkControlSearchInput = forwardRef(
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
			renderSuggestions = ( props ) => (
				<LinkControlSearchResults { ...props } />
			),
			fetchSuggestions = null,
			allowDirectEntry = true,
			showInitialSuggestions = false,
			suggestionsQuery = {},
			withURLSuggestion = true,
			createSuggestionButtonText,
			useLabel = false,
		},
		ref
	) => {
		console.log( { value } );
		const [ searchResults, setSearcResults ] = useState( [] );

		const genericSearchHandler = useSearchHandler(
			suggestionsQuery,
			allowDirectEntry,
			false,
			withURLSuggestion
		);

		const searchHandler = showSuggestions
			? fetchSuggestions || genericSearchHandler
			: noopSearchHandler;

		const instanceId = useInstanceId( LinkControlSearchInput );
		const [ focusedSuggestion, setFocusedSuggestion ] = useState();

		/**
		 * Handles the user moving between different suggestions. Does not handle
		 * choosing an individual item.
		 *
		 * @param {string} selection  the url of the selected suggestion.
		 * @param {Object} suggestion the suggestion object.
		 */
		const onInputChange = ( selection, suggestion ) => {
			onChange( selection );
			setFocusedSuggestion( suggestion );
		};

		const handleRenderSuggestions = ( props ) =>
			renderSuggestions( {
				...props,
				instanceId,
				withCreateSuggestion,
				createSuggestionButtonText,
				suggestionsQuery,
				handleSuggestionClick: ( suggestion ) => {
					if ( props.handleSuggestionClick ) {
						props.handleSuggestionClick( suggestion );
					}
					onSuggestionSelected( suggestion );
				},
			} );

		const onSuggestionSelected = async ( selectedSuggestion ) => {
			let suggestion = selectedSuggestion;
			if ( CREATE_TYPE === selectedSuggestion.type ) {
				// Create a new page and call onSelect with the output from the onCreateSuggestion callback.
				try {
					suggestion = await onCreateSuggestion(
						selectedSuggestion.title
					);
					if ( suggestion?.url ) {
						onSelect( suggestion );
					}
				} catch ( e ) {}
				return;
			}

			if (
				allowDirectEntry ||
				( suggestion && Object.keys( suggestion ).length >= 1 )
			) {
				const { id, url, ...restLinkProps } = currentLink ?? {};
				onSelect(
					// Some direct entries don't have types or IDs, and we still need to clear the previous ones.
					{ ...restLinkProps, ...suggestion },
					suggestion
				);
			}
		};

		const inputClasses = classnames( className, {
			'has-no-label': ! useLabel,
		} );

		const debouncedSearchHandler = debounce( async ( nextInputVal ) => {
			if ( nextInputVal?.length < 2 ) {
				return;
			}

			let searchHandlerResult = await searchHandler( nextInputVal, {
				isInitialSuggestions: false,
			} );

			if ( ! searchHandlerResult?.length ) {
				return;
			}

			searchHandlerResult = searchHandlerResult.map( ( result ) => {
				return {
					...result,
					label: result?.title,
					value: result?.url,
				};
			} );

			setSearcResults( searchHandlerResult );
		}, 200 );

		return (
			<div className="block-editor-link-control__search-input-container">
				{ /* <URLInput
					__nextHasNoMarginBottom
					label={ useLabel ? 'URL' : undefined }
					className={ inputClasses }
					value={ value }
					onChange={ onInputChange }
					placeholder={ placeholder ?? __( 'Search or type url' ) }
					__experimentalRenderSuggestions={
						showSuggestions ? handleRenderSuggestions : null
					}
					__experimentalFetchLinkSuggestions={ searchHandler }
					__experimentalHandleURLSuggestions={ true }
					__experimentalShowInitialSuggestions={
						showInitialSuggestions
					}
					onSubmit={ ( suggestion, event ) => {
						const hasSuggestion = suggestion || focusedSuggestion;

						// If there is no suggestion and the value (ie: any manually entered URL) is empty
						// then don't allow submission otherwise we get empty links.
						if ( ! hasSuggestion && ! value?.trim()?.length ) {
							event.preventDefault();
						} else {
							onSuggestionSelected(
								hasSuggestion || { url: value }
							);
						}
					} }
					ref={ ref }
				/> */ }
				<ComboboxControl
					label={ useLabel ? 'URL' : undefined }
					className={ inputClasses }
					value={ value }
					options={ searchResults }
					onChange={ onInputChange }
					onFilterValueChange={ debouncedSearchHandler }
					__experimentalRenderItem={ ( { item } ) => {
						return <LinkControlSearchItem suggestion={ item } />;
					} }
				/>
				{ children }
			</div>
		);
	}
);

export default LinkControlSearchInput;
