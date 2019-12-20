/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/rss';

export const settings = {
	title: __( 'RSS' ),
	description: __( 'Display entries from any RSS or Atom feed.' ),
	icon: 'rss',
	category: 'widgets',
	keywords: [ __( 'atom' ), __( 'feed' ) ],
	supports: {
		align: true,
		html: false,
	},
	example: {
		attributes: {
			feedURL: 'https://wordpress.org',
		},
	},
	edit,
};
