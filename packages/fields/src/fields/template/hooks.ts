import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import type { BasePost } from '../../types';

const EMPTY_TEMPLATES: WpTemplate[] = [];

/**
 * Hook that determines the template field rendering mode for a post.
 *
 * @param record The post record.
 * @return 'block-theme' | 'classic' | null
 */
export function useTemplateFieldMode(
	record: BasePost
): 'block-theme' | 'classic' | null {
	const { type: postType, id: postId } = record;
	const availableTemplates = ( ( record as Record< string, any > )
		?.available_templates ?? {} ) as Record< string, string >;
	const hasAvailableTemplates = Object.keys( availableTemplates ).length > 0;
	return useSelect(
		( select ) => {
			if ( ! select( coreStore ).getPostType( postType )?.viewable ) {
				return null;
			}
			if ( ! select( coreStore ).getCurrentTheme()?.is_block_theme ) {
				return hasAvailableTemplates ? 'classic' : null;
			}
			// The field only assigns a template from the list, which any
			// user who can edit posts may read, so it applies whenever the
			// post resolves to a template.
			const templateId = postId
				? unlock( select( coreStore ) ).getTemplateId(
						postType,
						postId
					)
				: undefined;
			return templateId ? 'block-theme' : null;
		},
		[ postType, postId, hasAvailableTemplates ]
	);
}

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

/**
 * Hook that resolves the default template
 * that would apply to a post, given its type, ID and slug.
 *
 * @param postType The post type.
 * @param postId   The post ID.
 * @param slug     The post slug.
 */
function useDefaultTemplate(
	postType: string | undefined,
	postId: string | number | undefined,
	slug: string | undefined
): WpTemplate | undefined {
	return useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return undefined;
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
					return frontPage;
				}

				// If no front page template is found, fall back to the page template.
				// See @getTemplateId private selector in core-data package.
			}

			// Check if the current page is the posts page.
			const postsPageId = unlock( select( coreStore ) ).getPostsPageId();
			const slugToCheck =
				postType === 'page' && postsPageId === postIdStr
					? 'home'
					: getTemplateSlugToCheck( postType, slug );
			const templateId = select( coreStore ).getDefaultTemplateId( {
				slug: slugToCheck,
			} );
			if ( ! templateId ) {
				return undefined;
			}

			return select( coreStore ).getEntityRecord< WpTemplate >(
				'postType',
				'wp_template',
				templateId
			);
		},
		[ postType, postId, slug ]
	);
}

/**
 * Resolves the active template from the choices for the edited post slug.
 *
 * @param postType     The post type.
 * @param postId       The post ID.
 * @param slug         The edited post slug.
 * @param assignedSlug The edited template assignment.
 */
export function usePostTemplate(
	postType: string,
	postId: string | number,
	slug: string | undefined,
	assignedSlug: string | undefined
) {
	const defaultTemplate = useDefaultTemplate( postType, postId, slug );
	return useSelect(
		( select ) => {
			const core = select( coreStore );
			const { getHomePage, getPostsPageId } = unlock( core );
			const singlePostId = String( postId );
			const isPostsPage =
				postType === 'page' && getPostsPageId() === singlePostId;
			const hasFrontPageTemplate =
				postType === 'page' &&
				getHomePage()?.postId === singlePostId &&
				defaultTemplate?.slug === 'front-page';
			const canSwitchTemplate = ! isPostsPage && ! hasFrontPageTemplate;
			const templates = core.getEntityRecords< WpTemplate >(
				'postType',
				'wp_template',
				{
					per_page: -1,
					post_type: postType,
					slug: slug || undefined,
				}
			);
			let currentTemplate = defaultTemplate;
			if ( canSwitchTemplate ) {
				// Wait for the choices before falling back from the assignment.
				currentTemplate = templates
					? ( templates.find(
							( template ) => template.slug === assignedSlug
						) ??
						templates[ 0 ] ??
						defaultTemplate )
					: undefined;
			}
			return {
				currentTemplate,
				defaultTemplate,
				canSwitchTemplate,
				templates: templates ?? EMPTY_TEMPLATES,
			};
		},
		[ postId, postType, slug, assignedSlug, defaultTemplate ]
	);
}
