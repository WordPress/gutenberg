/**
 * Internal dependencies
 */
import addNavigationEditorCustomAppender from './add-navigation-editor-custom-appender';
import addNavigationEditorPlaceholder from './add-navigation-editor-placeholder';
import addMenuNameEditor from './add-menu-name-editor';
import disableInsertingNonNavigationBlocks from './disable-inserting-non-navigation-blocks';
import removeEditUnsupportedFeatures from './remove-edit-unsupported-features';
import removeSettingsUnsupportedFeatures from './remove-settings-unsupported-features';

export const addFilters = (
	shouldAddDisableInsertingNonNavigationBlocksFilter
) => {
	addNavigationEditorCustomAppender();
	addNavigationEditorPlaceholder();
	addMenuNameEditor();
	if ( shouldAddDisableInsertingNonNavigationBlocksFilter ) {
		disableInsertingNonNavigationBlocks();
	}
	removeEditUnsupportedFeatures();
	removeSettingsUnsupportedFeatures();
};
