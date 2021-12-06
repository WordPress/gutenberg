/**
 * External dependencies
 */
import { noop, omit } from 'lodash';
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { URLInput } from '../';
import LinkControlSearchResults from './search-results';
import { CREATE_TYPE } from './constants';
import useSearchHandler from './use-search-handler';

// Must be a function as otherwise URLInput will default
// to the fetchLinkSuggestions passed in block editor settings
// which will cause an unintended http request.
const noopSearchHandler = () => Promise.resolve( [] );

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
		const genericSearchHandler = useSearchHandler(
			suggestionsQuery,
			allowDirectEntry,
			withCreateSuggestion,
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
				currentInputValue: value,
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
				// Create a new page and call onSelect with the output from the onCreateSuggestion callback
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
				onSelect(
					// Some direct entries don't have types or IDs, and we still need to clear the previous ones.
					{ ...omit( currentLink, 'id', 'url' ), ...suggestion },
					suggestion
				);
			}
		};

		const inputClasses = classnames( className, {
			'has-no-label': ! useLabel,
		} );

		return (
			<div className="block-editor-link-control__search-input-container">
				<URLInput
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
				/>
				{ children }
			</div>
		);
	}
);

export default LinkControlSearchInput;
