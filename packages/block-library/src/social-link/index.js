/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import socialList from './social-list';

const commonAttributes = {
	category: 'widgets',
	parent: [ 'core/social-links' ],
	supports: {
		reusable: false,
		html: false,
	},
	edit,
};

// Create individual blocks out of each site in social-list.js
export const sites = Object.keys( socialList ).map(
	( site ) => {
		const siteParams = socialList[ site ];
		return {
			name: 'core/social-link-' + site,
			settings: {
				title: siteParams.name,
				icon: siteParams.icon,
				description: __( 'Link to ' + siteParams.name ),
				...commonAttributes,
				attributes: {
					url: {
						type: 'string',
					},
					site: {
						type: 'string',
						default: site,
					},
					label: {
						type: 'string',
					},
				},
			},
		};
	}
);
