export const requestContainsUnboundedQuery = ( url ) => {
	if ( url.indexOf( 'wp/v2' ) < 0 ) {
		return false;
	}
	return url.indexOf( 'per_page=-1' > -1 );
};

export const rewriteUnboundedQuery = ( url ) => {
	if ( url.indexOf( 'wp/v2' ) < 0 ) {
		return url;
	}
	return url.replace( 'per_page=-1', 'per_page=100' );
};
