/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for fonts home redirect.
 */
export const route = {
	beforeLoad: () => {
		throw redirect( {
			throw: true,
			to: '/font-list',
		} );
	},
};
