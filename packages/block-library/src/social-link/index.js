/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import socialList from './social-list';

const commonAttribs = {
	category: 'widgets',
	parent: [ 'core/social-links' ],
	supports: {
		reusable: false,
		html: false,
	},
	attributes: {
		url: {
			type: 'string',
		},
		icon: {
			type: 'string',
		},
	},
	edit,
	save,
};

// Create individual blocks out of each site in social-list.js
// TODO: solve icon issue
export const sites = Object.keys( socialList ).map(
	( site ) => {
		return {
			name: 'core/social-link-' + site,
			settings: {
				title: socialList[ site ],
				icon: 'share',
				description: __( 'Link to ' + socialList[ site ] ),
				...commonAttribs,
			},
		};
	}
);
