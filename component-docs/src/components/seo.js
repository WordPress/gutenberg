/**
 * External dependencies
 */
import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Internal dependencies
 */
import { useRouter } from '../utils/hooks';

function getPageTitle( path, title ) {
	let nextTitle = 'Muriel';
	if ( title && path !== '/' ) {
		nextTitle = `${ title } | Muriel`;
	}

	return nextTitle;
}

export default function SEO( props ) {
	const { location } = useRouter();
	const { title, description } = props;
	const pageTitle = getPageTitle( location.pathname, title );

	return (
		<Helmet>
			<title>{ pageTitle }</title>
			<meta name="description" content={ description } />
			{ pageTitle && <meta property="og:title" content={ pageTitle } /> }
		</Helmet>
	);
}
