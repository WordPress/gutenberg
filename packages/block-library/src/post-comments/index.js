/**
 * WordPress dependencies
 */
import { postComments as icon } from '@wordpress/icons';
import { registerBlockVariation } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import TEMPLATE from './edit/template';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

registerBlockVariation( 'core/post-comments', {
	name: 'new', // <-- ??
	title: 'Post Comments',
	isDefault: true,
	innerBlocks: TEMPLATE,
	icon,
	scope: [ 'inserter' ],
} );
