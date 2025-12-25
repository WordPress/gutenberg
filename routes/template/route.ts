/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

/**
 * Route configuration for template redirect.
 */
export const route = {
	beforeLoad: () => {
		const isTemplateActivateEnabled =
			typeof window !== 'undefined' &&
			window.__experimentalTemplateActivate;
		throw redirect( {
			throw: true,
			to: '/templates/list/$activeView',
			params: {
				activeView: isTemplateActivateEnabled ? 'active' : 'all',
			},
		} );
	},
};
