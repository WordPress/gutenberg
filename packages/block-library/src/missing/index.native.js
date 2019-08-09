/**
 * Internal dependencies
 */
import { settings as webSettings } from './index.js';
import { coreBlocks } from '../';

export { metadata, name } from './index.js';

export const settings = {
	...webSettings,
	__experimentalGetAccessibilityLabel( attributes ) {
		const { originalName } = attributes;

		const originalBlockType = originalName && coreBlocks[ originalName ];

		if ( originalBlockType ) {
			return originalBlockType.settings.title || originalName;
		}

		return '';
	},
};
