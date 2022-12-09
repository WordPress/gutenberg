/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkControlSearchInput from './search-input';
import LinkControlTextInput from './link-control-text-input';
import LinkPreview from './link-preview';
import LinkControlNotice from './link-control-notice';
import LinkControlEditControls from './link-control-edit-controls';
import LinkControlLoading from './link-control-loading';

export function LinkControlDefault( {
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
	showTextControl,
	renderControlBottom,
} ) {
	return (
		<>
			<LinkControlLoading />

			<LinkControlEditControls>
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
					createSuggestionButtonText={ createSuggestionButtonText }
					useLabel={ showTextControl }
				/>
				<LinkControlNotice />
			</LinkControlEditControls>

			<LinkPreview />

			<LinkControlSettingsDrawer />

			{ renderControlBottom && renderControlBottom() }
		</>
	);
}
