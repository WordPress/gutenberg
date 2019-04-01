/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/latest-posts';

export const settings = {
	title: __( 'Latest Posts' ),

	description: __( 'Display a list of your most recent posts.' ),

	icon,

	category: 'widgets',

	keywords: [ __( 'recent posts' ) ],

	supports: {
		align: true,
		html: false,
	},

	edit,
};
