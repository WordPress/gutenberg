/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for comments home redirect.
 */
export const route = {
	beforeLoad: () => {
		throw redirect( {
			throw: true,
			to: '/all',
		} );
	},
};
