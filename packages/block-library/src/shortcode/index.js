/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import save from './save';
import transforms from './transforms';

export const name = 'core/shortcode';

export const settings = {
	title: __( 'Shortcode' ),
	description: __( 'Insert additional custom elements with a WordPress shortcode.' ),
	icon,
	category: 'widgets',
	transforms,
	supports: {
		customClassName: false,
		className: false,
		html: false,
	},
	edit,
	save,
};
