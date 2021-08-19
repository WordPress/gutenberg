/**
 * WordPress dependencies
 */
import { archive as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
// eslint-disable-next-line
import metadata from './block.json' assert { type: 'json' };
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit,
};
