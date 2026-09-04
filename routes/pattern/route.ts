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
				// The slug of the "All patterns" entry in the server view list.
				type: 'all-patterns',
			},
		} );
	},
};
