/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social links' ),
	icon: 'share',
	description: __( 'Create a block of links to your social media or external sites' ),
	styles: [
		{ name: 'regular', label: _x( 'Regular', 'block style' ), isDefault: true },
		{ name: 'filled', label: __( 'Filled' ) },
	],
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	edit,
	save,
};
