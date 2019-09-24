/**
 * External dependencies
 */
import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Internal dependencies
 */
import { useRouter } from '../utils/hooks';

const TITLE = 'WordPress Components';

function getPageTitle( path, title ) {
	let nextTitle = TITLE;
	if ( title && path !== '/' ) {
		nextTitle = `${ title } | ${ TITLE }`;
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
