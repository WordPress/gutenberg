/**
 * Internal dependencies
 */
import { settings as webSettings } from './index.js';

export { metadata, name } from './index.js';

export const settings = {
	...webSettings,
	supports: {
		...webSettings.supports,
		__experimentalColor: false,
	},
};
