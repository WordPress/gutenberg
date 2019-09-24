/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Document from '../../components/document';
import FadeIn from '../../components/fade-in';
import Layout from '../../components/layout';
import Navigation from '../../components/navigation';
import Sidebar from '../../components/sidebar';
import SEO from '../../components/seo';
import Header from './header';
import { useData, useRouter, useScrollToTop } from '../../utils/hooks';

export default function ComponentsPage() {
	const { data, isLoaded } = useData();
	const { markdown, title, slug } = data;
	const { location } = useRouter();

	useScrollToTop( location.pathname );

	return (
		<FadeIn>
			<SEO title={ title } />
			<Sidebar>
				<Navigation />
			</Sidebar>
			<Layout.BodyWithSidebar>
				<Document markdown={ markdown } isLoaded={ isLoaded } headerSlot={ <Header slug={ slug } /> } />
			</Layout.BodyWithSidebar>
		</FadeIn>
	);
}
