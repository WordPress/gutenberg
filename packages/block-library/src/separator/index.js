/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { separator as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Separator' ),
	description: __(
		'Create a break between ideas or sections with a horizontal separator.'
	),
	icon,
	keywords: [ __( 'horizontal-line' ), 'hr', __( 'divider' ) ],
	example: {
		attributes: {
			customColor: '#065174',
			className: 'is-style-wide',
		},
	},
	styles: [
		{ name: 'default', label: __( 'Default' ), isDefault: true },
		{ name: 'wide', label: __( 'Wide Line' ) },
		{ name: 'dots', label: __( 'Dots' ) },
	],
	transforms,
	edit,
	save,
};
