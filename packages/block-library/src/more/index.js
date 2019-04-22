/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'More', 'block name' ),
	description: __( 'Content before this block will be shown in the excerpt on your archives page.' ),
	icon,
	supports: {
		customClassName: false,
		className: false,
		html: false,
		multiple: false,
	},
	transforms,
	edit,
	save,
};
