/**
 * WordPress dependencies
 */
import { getQueryArgs } from '@wordpress/url';
import { useEffect, useRef } from '@wordpress/element';
import { useNavigatorLocation } from '@wordpress/components';

const PARAM = 'gssb';

export const useInitialPath = () => {
	const pathRef = useRef();
	try {
		const parsed = getQueryArgs( window.location.href );
		const path = parsed[ PARAM ] || '';

		if ( ! pathRef.current ) {
			pathRef.current = decodeURIComponent( path );
		}
	} catch ( err ) {
		if ( ! pathRef.current ) {
			pathRef.current = '';
		}
	}

	return pathRef.current;
};

export const URLSync = () => {
	const { pathname } = useNavigatorLocation();
	useEffect( () => {
		try {
			const searchParams = new URLSearchParams( window.location.search );
			searchParams.set( PARAM, encodeURIComponent( pathname ) );
			const newRelativePathQuery =
				window.location.pathname + '?' + searchParams.toString();
			window.history.pushState( null, '', newRelativePathQuery );
		} catch ( err ) {}
	}, [ pathname ] );

	return null;
};
