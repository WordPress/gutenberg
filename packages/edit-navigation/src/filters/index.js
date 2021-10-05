/**
 * Internal dependencies
 */
import addMenuNameEditor from './add-menu-name-editor';
import removeSettingsUnsupportedFeatures from './remove-settings-unsupported-features';

export const addFilters = () => {
	addMenuNameEditor();
	removeSettingsUnsupportedFeatures();
};
