function userLocaleMiddleware( options, next ) {
	if ( typeof options.url === 'string' ) {
		if ( -1 !== options.url.indexOf( '?' ) ) {
			options.url += '&_locale=user';
		} else {
			options.url += '?_locale=user';
		}
	}

	if ( typeof options.path === 'string' ) {
		if ( -1 !== options.path.indexOf( '?' ) ) {
			options.path += '&_locale=user';
		} else {
			options.path += '?_locale=user';
		}
	}

	return next( options, next );
}

export default userLocaleMiddleware;
