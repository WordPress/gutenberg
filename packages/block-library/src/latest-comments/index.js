/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),

	description: __( 'Display a list of your most recent comments.' ),

	icon,

	category: 'widgets',

	keywords: [ __( 'recent comments' ) ],

	supports: {
		align: true,
		html: false,
	},

	edit,
};
