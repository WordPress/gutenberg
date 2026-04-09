/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for pattern redirect.
 */
export const route = {
	beforeLoad: () => {
		throw redirect( {
			throw: true,
			to: '/patterns/list/$type',
			params: {
				type: 'all',
			},
		} );
	},
};
