/**
 * Internal dependencies
 */
import PreferenceBaseOption from './components/preference-base-option';
import PreferenceToggleControl from './components/preference-toggle-control';
import PreferencesModal from './components/preferences-modal';
import PreferencesModalSection from './components/preferences-modal-section';
import PreferencesModalTabs from './components/preferences-modal-tabs';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	PreferenceBaseOption,
	PreferenceToggleControl,
	PreferencesModal,
	PreferencesModalSection,
	PreferencesModalTabs,
} );
