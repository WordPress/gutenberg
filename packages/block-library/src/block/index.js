/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Reusable Block' ),
	description: __(
		'Create and save content to reuse across your site. Update the block, and the changes apply everywhere it’s used.'
	),
	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},
	edit,
};
