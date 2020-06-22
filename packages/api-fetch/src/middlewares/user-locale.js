/**
 * WordPress dependencies
 */
import { addQueryArgs, hasQueryArg } from '@wordpress/url';

function userLocaleMiddleware( options, next ) {
	if (
		typeof options.url === 'string' &&
		! hasQueryArg( options.url, '_locale' )
	) {
		options.url = addQueryArgs( options.url, { _locale: 'user' } );
	}

	if (
		typeof options.path === 'string' &&
		! hasQueryArg( options.path, '_locale' )
	) {
		options.path = addQueryArgs( options.path, { _locale: 'user' } );
	}

	return next( options, next );
}

export default userLocaleMiddleware;
