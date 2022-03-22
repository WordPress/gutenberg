/**
 * Internal dependencies
 */
import { SETTINGS_DEFAULTS as SETTINGS } from './defaults.js';

const SETTINGS_DEFAULTS = {
	...SETTINGS,
	// Don't add the default font sizes for standard themes
	fontSizes: undefined,
	alignWide: true,
	supportsLayout: false,
	__experimentalFeatures: {
		color: {
			text: true,
			background: true,
		},
	},
};

export { SETTINGS_DEFAULTS };
