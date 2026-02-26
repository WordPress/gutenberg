/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';

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
function getTemplateSlugToCheck(
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

const NAME_NOT_FOUND = '';

/**
 * Hook that resolves the human-readable label for the default template
 * that would apply to a post, given its type, ID and slug.
 *
 * @param postType The post type.
 * @param postId   The post ID.
 * @param slug     The post slug.
 */
export function useDefaultTemplateLabel(
	postType: string | undefined,
	postId: string | number | undefined,
	slug: string | undefined
): string {
	return useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return NAME_NOT_FOUND;
			}

			const postIdStr = String( postId );

			// Check if the current page is the front page.
			const homePage = unlock( select( coreStore ) ).getHomePage();
			if (
				postType === 'page' &&
				homePage?.postType === 'page' &&
				homePage?.postId === postIdStr
			) {
				const templates = select(
					coreStore
				).getEntityRecords< WpTemplate >( 'postType', 'wp_template', {
					per_page: -1,
				} );
				const frontPage = templates?.find(
					( t ) => t.slug === 'front-page'
				);
				if ( frontPage ) {
					return getItemTitle( frontPage );
				}

				// If no front page template is found, fall back to the page template.
				// See @getTemplateId private selector in core-data package.
			}

			// Check if the current page is the posts page.
			const postsPageId = unlock( select( coreStore ) ).getPostsPageId();
			if ( postType === 'page' && postsPageId === postIdStr ) {
				const templateId = select( coreStore ).getDefaultTemplateId( {
					slug: 'home',
				} );
				if ( ! templateId ) {
					return NAME_NOT_FOUND;
				}

				const template = select(
					coreStore
				).getEntityRecord< WpTemplate >(
					'postType',
					'wp_template',
					templateId
				);
				return template ? getItemTitle( template ) : NAME_NOT_FOUND;
			}

			// Check any other case.
			const slugToCheck = getTemplateSlugToCheck( postType, slug );
			const templateId = select( coreStore ).getDefaultTemplateId( {
				slug: slugToCheck,
			} );
			if ( ! templateId ) {
				return NAME_NOT_FOUND;
			}

			const template = select( coreStore ).getEntityRecord< WpTemplate >(
				'postType',
				'wp_template',
				templateId
			);
			return template ? getItemTitle( template ) : NAME_NOT_FOUND;
		},
		[ postType, postId, slug ]
	);
}
