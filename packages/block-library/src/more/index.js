/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { more as icon } from '@wordpress/icons';

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
	title: _x( 'More', 'block name' ),
	description: __(
		'Content before this block will be shown in the excerpt on your archives page.'
	),
	icon,
	supports: {
		customClassName: false,
		className: false,
		html: false,
		multiple: false,
	},
	example: {},
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
			return attributes.customText;
		}
	},
	transforms,
	edit,
	save,
};
