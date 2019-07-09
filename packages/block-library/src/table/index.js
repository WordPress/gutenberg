/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Table' ),
	description: __( 'Insert a table — perfect for sharing charts and data.' ),
	icon,
	styles: [
		{ name: 'regular', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: 'stripes', label: __( 'Stripes' ) },
	],
	supports: {
		align: true,
	},
	transforms,
	edit,
	save,
	deprecated,
};
