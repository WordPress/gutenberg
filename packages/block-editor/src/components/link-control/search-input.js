/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { URLInput } from '../';
import LinkControlSearchResults from './search-results';
import { CREATE_TYPE } from './constants';
import useSearchHandler from './use-search-handler';
import deprecated from '@wordpress/deprecated';

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
			hideLabelFromVision = false,
			suffix,
			isEntity = false,
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

		const _placeholder = placeholder ?? __( 'Search or type URL' );

		const label =
			hideLabelFromVision && placeholder !== ''
				? _placeholder
				: __( 'Link' );

		return (
			<div className="block-editor-link-control__search-input-container">
				<URLInput
					disableSuggestions={ currentLink?.url === value }
					label={ label }
					hideLabelFromVision={ hideLabelFromVision }
					className={ className }
					value={ value }
					onChange={ onInputChange }
					placeholder={ _placeholder }
					__experimentalRenderSuggestions={
						showSuggestions ? handleRenderSuggestions : null
					}
					__experimentalFetchLinkSuggestions={ searchHandler }
					__experimentalHandleURLSuggestions
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
					inputRef={ ref }
					suffix={ suffix }
					disabled={ isEntity }
				/>
				{ children }
			</div>
		);
	}
);

export default LinkControlSearchInput;

export const __experimentalLinkControlSearchInput = ( props ) => {
	deprecated( 'wp.blockEditor.__experimentalLinkControlSearchInput', {
		since: '6.8',
	} );

	return <LinkControlSearchInput { ...props } />;
};
