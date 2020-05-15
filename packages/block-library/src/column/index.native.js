/**
 * Internal dependencies
 */
import * as webSettings from './index.js';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	...webSettings.settings,
	supports: {
		...webSettings.settings.supports,
		inserter: true,
	},
};
