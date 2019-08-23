/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Document from '../components/document';
import SEO from '../components/seo';
import { useData } from '../utils/hooks';

export default function HomePage() {
	const {
		data: { markdown },
		isLoaded,
	} = useData( '/components' );

	return (
		<>
			<SEO />
			<Document isLoaded={ isLoaded } markdown={ markdown } />
		</>
	);
}
