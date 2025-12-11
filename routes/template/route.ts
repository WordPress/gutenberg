/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for template redirect.
 */
export const route = {
	beforeLoad: () => {
		throw redirect( {
			throw: true,
			to: '/templates/list/$activeView',
			params: {
				activeView: 'active',
			},
		} );
	},
};
