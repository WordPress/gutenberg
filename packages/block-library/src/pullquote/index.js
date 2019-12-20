/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_STYLE_NAME } from './shared';
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Pullquote' ),
	description: __( 'Give special visual emphasis to a quote from your text.' ),
	icon,
	example: {
		attributes: {
			value: '<p>' +
			// translators: Quote serving as example for the Pullquote block. Attributed to Matt Mullenweg.
			__( 'One of the hardest things to do in technology is disrupt yourself.' ) +
			'</p>',
			citation: __( 'Matt Mullenweg' ),
		},
	},
	styles: [
		{ name: 'default', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: SOLID_COLOR_STYLE_NAME, label: __( 'Solid Color' ) },
	],
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
	},
	edit,
	save,
	deprecated,
};
