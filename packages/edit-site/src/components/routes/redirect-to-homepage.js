/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import history from '../../utils/history';
import { store as editSiteStore } from '../../store';
import getIsListPage from '../../utils/get-is-list-page';

function getNeedsHomepageRedirect( params ) {
	const { postType } = params;
	return (
		! getIsListPage( params ) &&
		! [ 'post', 'page', 'wp_template', 'wp_template_part' ].includes(
			postType
		)
	);
}

async function getHomepageParams() {
	const siteSettings = await apiFetch( { path: '/wp/v2/settings' } );
	if ( ! siteSettings ) {
		return;
	}

	const {
		show_on_front: showOnFront,
		page_on_front: frontpageId,
	} = siteSettings;

	// If the user has set a page as the homepage, use those details.
	if ( showOnFront === 'page' ) {
		return {
			postType: 'page',
			postId: frontpageId,
		};
	}

	// Else get the home template.
	// This matches the logic in `__experimentalGetTemplateForLink`.
	// (packages/core-data/src/resolvers.js)
	const { siteUrl } = select( editSiteStore ).getSettings();
	const template = await window
		.fetch( addQueryArgs( siteUrl, { '_wp-find-template': true } ) )
		.then( ( res ) => res.json() )
		.then( ( { data } ) => data );

	if ( ! template?.id ) {
		return;
	}

	return {
		postType: 'wp_template',
		postId: template.id,
	};
}

export default async function redirectToHomepage() {
	const searchParams = new URLSearchParams( history.location.search );
	const params = Object.fromEntries( searchParams.entries() );

	if ( getNeedsHomepageRedirect( params ) ) {
		const homepageParams = await getHomepageParams();

		if ( homepageParams ) {
			history.replace( homepageParams );
		}
	}
}
