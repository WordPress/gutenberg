/**
 * Route configuration for post redirect.
 */
export const route = {
	beforeLoad: ( {
		params,
		redirect,
	}: {
		params: { type: string };
		redirect: Function;
	} ) => {
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
