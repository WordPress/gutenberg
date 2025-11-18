/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for post redirect.
 */
export const route = {
	beforeLoad: ( { params }: { params: { type: string } } ) => {
		throw redirect( {
			throw: true,
			to: '/types/$type/list/$slug',
			params: {
				type: params.type,
				slug: 'all',
			},
		} );
	},
};
