/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/calendar';

export const settings = {
	title: __( 'Calendar' ),
	description: __( 'A calendar of your site’s posts.' ),
	icon,
	category: 'widgets',
	keywords: [ __( 'posts' ), __( 'archive' ) ],
	supports: {
		align: true,
	},
	example: {},
	edit,
};
