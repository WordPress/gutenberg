/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

function userLocaleMiddleware( options, next ) {
	if (
		typeof options.url === 'string' &&
		-1 === options.url.indexOf( '?_locale=' ) &&
		-1 === options.url.indexOf( '&_locale=' )
	) {
		options.url = addQueryArgs( options.url, { _locale: 'user' } );
	}

	if (
		typeof options.path === 'string' &&
		-1 === options.path.indexOf( '?_locale=' ) &&
		-1 === options.path.indexOf( '&_locale=' )
	) {
		options.path = addQueryArgs( options.path, { _locale: 'user' } );
	}

	return next( options, next );
}

export default userLocaleMiddleware;
