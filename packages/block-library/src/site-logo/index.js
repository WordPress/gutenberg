/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import icon from './icon';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Site Logo' ),
	description: __( 'Show a site logo' ),
	icon,
	styles: [
		{
			name: 'default',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		},
		{ name: 'rounded', label: _x( 'Rounded', 'block style' ) },
	],
	supports: {
		align: true,
		alignWide: false,
	},
	edit,
};
