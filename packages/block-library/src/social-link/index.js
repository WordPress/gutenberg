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
	edit,
	save,
};

// Create individual blocks out of each site in social-list.js
// TODO: solve icon issue
export const sites = Object.keys( socialList ).map(
	( site ) => {
		const siteParams = socialList[ site ];
		return {
			name: 'core/social-link-' + site,
			settings: {
				title: siteParams.name,
				icon: siteParams.icon,
				description: __( 'Link to ' + siteParams.name ),
				...commonAttribs,
				attributes: {
					url: {
						type: 'string',
					},
					site: {
						type: 'string',
						default: site,
					},
				},
			},
		};
	}
);
