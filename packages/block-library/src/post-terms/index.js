/**
 * WordPress dependencies
 */
import { postCategories as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import enhanceVariations from './hooks';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
};

// Importing this file includes side effects. This is whitelisted in block-library/package.json under sideEffects
addFilter(
	'blocks.registerBlockType',
	'core/template-part',
	enhanceVariations
);
