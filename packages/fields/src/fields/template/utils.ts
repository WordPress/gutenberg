/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../actions/utils';
import { unlock } from '../../lock-unlock';

/**
 * Compute the template slug to look up in the template hierarchy.
 *
 * In `draft` status we might not have a slug available, so we use the
 * `single` post type template slug (e.g. page, single-post,
 * single-product, etc.). Pages do not need the `single` prefix to be
 * prioritised through template hierarchy.
 *
 * @param postType The post type.
 * @param slug     The post slug.
 */
export function getTemplateSlugToCheck(
	postType: string,
	slug: string | undefined
): string {
	if ( slug ) {
		return postType === 'page'
			? `${ postType }-${ slug }`
			: `single-${ postType }-${ slug }`;
	}
	return postType === 'page' ? 'page' : `single-${ postType }`;
}

/**
 * Resolve the human-readable label for the default template that would
 * apply to a post, given its type, ID and slug. Meant to be called inside a
 * `useSelect` callback (receives `select` as its first argument).
 *
 * @param select   The `select` function from a `useSelect` callback.
 * @param postType The post type.
 * @param postId   The post ID.
 * @param slug     The post slug.
 */
export function getDefaultTemplateLabel(
	select: ( store: typeof coreStore ) => any,
	postType: string | undefined,
	postId: string | number | undefined,
	slug: string | undefined
): string {
	if ( ! postType || ! postId ) {
		return __( 'Default template' );
	}

	// For the front page, we always use the front page template if existing.
	const homePage = unlock( select( coreStore ) ).getHomePage();
	if (
		postType === 'page' &&
		homePage?.postType === 'page' &&
		homePage?.postId === String( postId )
	) {
		// The /lookup endpoint cannot currently handle a lookup
		// when a page is set as the front page, so specifically in
		// that case, we want to check if there is a front page
		// template, and instead of falling back to the home
		// template, we want to fall back to the page template.
		const templates = select( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{ per_page: -1 }
		);
		const frontPage = templates?.find(
			( t: WpTemplate ) => t.slug === 'front-page'
		);
		if ( frontPage ) {
			return getItemTitle( frontPage );
		}
		// If no front page template is found, continue with the
		// logic below (fetching the page template).
	}

	const postsPageId = unlock( select( coreStore ) ).getPostsPageId();
	// Check if the current page is the posts page.
	if ( postType === 'page' && postsPageId === String( postId ) ) {
		const templateId = select( coreStore ).getDefaultTemplateId( {
			slug: 'home',
		} );
		if ( templateId ) {
			const template = select( coreStore ).getEntityRecord(
				'postType',
				'wp_template',
				templateId
			);
			if ( template ) {
				return getItemTitle( template );
			}
		}
		return __( 'Default template' );
	}

	const slugToCheck = getTemplateSlugToCheck( postType, slug );
	const templateId = select( coreStore ).getDefaultTemplateId( {
		slug: slugToCheck,
	} );

	if ( ! templateId ) {
		return __( 'Default template' );
	}

	const template = select( coreStore ).getEntityRecord(
		'postType',
		'wp_template',
		templateId
	);

	return template ? getItemTitle( template ) : __( 'Default template' );
}
