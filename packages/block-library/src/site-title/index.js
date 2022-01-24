/**
 * WordPress dependencies
 */
import { mapMarker as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	transforms,
	deprecated,
};
