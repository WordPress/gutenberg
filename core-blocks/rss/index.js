/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';

export const name = 'core/rss';

export const settings = {
	title: __( 'RSS' ),

	description: __( 'Display entries from any RSS or Atom feed.' ),

	icon: 'rss',

	category: 'widgets',

	keywords: [ __( 'rss' ) ],

	supports: {
		html: false,
	},

	edit,

	save() {
		return null;
	},
};
