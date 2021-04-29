/**
 * Internal dependencies
 */
import {
	PREFERENCES_DEFAULTS,
	SETTINGS_DEFAULTS as SETTINGS,
} from './defaults.js';

const SETTINGS_DEFAULTS = {
	...SETTINGS,
	// eslint-disable-next-line no-undef
	__experimentalGalleryRefactor: __DEV__,
	alignWide: true,
};

export { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS };
