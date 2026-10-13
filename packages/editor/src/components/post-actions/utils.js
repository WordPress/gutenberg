import { store as coreStore } from '@wordpress/core-data';

/**
 * Checks whether a page can be set as the homepage or as the posts page.
 *
 * It reads the site settings and the templates through the data registry,
 * so it returns `false` when it's called without one.
 *
 * @param {Object} post             The page.
 * @param {Object} context          The context of the check.
 * @param {Object} context.registry The data registry.
 * @return {boolean} Whether the page can be set as the homepage or as the posts page.
 */
export function isEligibleForHomepageActions( post, { registry } = {} ) {
	if ( ! registry || post.status !== 'publish' || post.type !== 'page' ) {
		return false;
	}

	const { getDefaultTemplateId, getEntityRecord } =
		registry.select( coreStore );

	// Don't show the actions if the page is already set as the homepage or
	// as the page for posts.
	const siteSettings = getEntityRecord( 'root', 'site' );
	if (
		siteSettings?.page_on_front === post.id ||
		siteSettings?.page_for_posts === post.id
	) {
		return false;
	}

	// Note that resolved template for `front-page` is not necessarily a
	// `front-page` template.
	const frontPageTemplateId = getDefaultTemplateId( {
		slug: 'front-page',
	} );

	if ( ! frontPageTemplateId ) {
		return true;
	}

	// This won't trigger a second network request, getDefaultTemplateId
	// will have received the whole template from the REST API.
	const frontPageTemplate = getEntityRecord(
		'postType',
		'wp_template',
		frontPageTemplateId
	);

	// When there is a front page template, the front page cannot be
	// changed. See
	// https://developer.wordpress.org/themes/basics/template-hierarchy/
	return frontPageTemplate?.slug !== 'front-page';
}
