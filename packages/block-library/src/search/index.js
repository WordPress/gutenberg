/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export let name;
export let settings;

if ( process.env.GUTENBERG_PHASE === 2 ) {
	name = 'core/search';
	settings = {
		title: __( 'Search' ),

		description: __( 'Help visitors find your content.' ),

		icon: 'search',

		category: 'widgets',

		keywords: [ __( 'find' ) ],

		edit,

		save() {
			return null;
		},
	};
}
