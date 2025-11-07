/**
 * External dependencies
 */
import { redirect } from '@tanstack/react-router';

/**
 * Route configuration for post redirect.
 */
export const route = {
	beforeLoad: ( { params }: { params: { type: string } } ) => {
		throw redirect( {
			to: '/types/$type/list/$slug',
			params: {
				type: params.type,
				slug: 'all',
			},
		} );
	},
};
