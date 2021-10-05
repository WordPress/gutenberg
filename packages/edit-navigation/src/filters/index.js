/**
 * Internal dependencies
 */
import addNavigationEditorCustomAppender from './add-navigation-editor-custom-appender';
import addNavigationEditorPlaceholder from './add-navigation-editor-placeholder';
import addMenuNameEditor from './add-menu-name-editor';
import removeSettingsUnsupportedFeatures from './remove-settings-unsupported-features';

export const addFilters = () => {
	addNavigationEditorCustomAppender();
	addNavigationEditorPlaceholder();
	addMenuNameEditor();
	removeSettingsUnsupportedFeatures();
};
