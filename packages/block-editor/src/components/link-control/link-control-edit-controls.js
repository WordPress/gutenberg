/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from './';
import LinkControlSearchInput from './search-input';
import LinkControlTextInput from './link-control-text-input';
import LinkControlNotice from './link-control-notice';

export default function LinkControlEditControls( { children, ...props } ) {
	const {
		searchInputPlaceholder,
		withCreateSuggestion,
		createPage,
		setInternalUrlInputValue,
		handleSelectSuggestion,
		showInitialSuggestions,
		noDirectEntry,
		showSuggestions,
		suggestionsQuery,
		noURLSuggestion,
		createSuggestionButtonText,
	} = props;

	const { showTextControl, shouldShowEditControls } = useLinkControlContext();

	if ( ! shouldShowEditControls ) {
		return null;
	}

	return (
		<>
			<div
				className={ classnames( {
					'block-editor-link-control__search-input-wrapper': true,
					'has-text-control': showTextControl,
				} ) }
			>
				{ children ? (
					children
				) : (
					<>
						<LinkControlTextInput />

						<LinkControlSearchInput
							className="block-editor-link-control__field block-editor-link-control__search-input"
							placeholder={ searchInputPlaceholder }
							withCreateSuggestion={ withCreateSuggestion }
							onCreateSuggestion={ createPage }
							onChange={ setInternalUrlInputValue }
							onSelect={ handleSelectSuggestion }
							showInitialSuggestions={ showInitialSuggestions }
							allowDirectEntry={ ! noDirectEntry }
							showSuggestions={ showSuggestions }
							suggestionsQuery={ suggestionsQuery }
							withURLSuggestion={ ! noURLSuggestion }
							createSuggestionButtonText={
								createSuggestionButtonText
							}
							useLabel={ showTextControl }
						/>
						<LinkControlNotice />
					</>
				) }
			</div>
		</>
	);
}
