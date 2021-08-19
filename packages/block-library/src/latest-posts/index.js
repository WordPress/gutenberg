/**
 * WordPress dependencies
 */
import { postList as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json' assert { type: 'json' };;

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit,
	deprecated,
};
