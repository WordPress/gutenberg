/**
 * Internal dependencies
 */
import { settings as webSettings } from './index.js';

export { metadata, name } from './index.js';

export const settings = {
	...webSettings,
	__experimentalGetAccessibilityLabel( attributes ) {
		return attributes.customText;
	},
};
