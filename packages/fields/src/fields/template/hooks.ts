import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import { getItemTitle } from '../../actions/utils';
import { unlock } from '../../lock-unlock';
import type { BasePost } from '../../types';

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

const NAME_NOT_FOUND = '';

/**
 * Hook that resolves the human-readable label for the default template
 * that would apply to a post, given its type and ID.
 *
 * Delegates the homepage / posts-page / template-hierarchy resolution to
 * the `getTemplateId` private selector in `@wordpress/core-data`, then
 * looks up the resolved template's record for its title.
 *
 * @param postType The post type.
 * @param postId   The post ID.
 */
export function useDefaultTemplateLabel(
	postType: string | undefined,
	postId: string | number | undefined
): string {
	return useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return NAME_NOT_FOUND;
			}

			const templateId = unlock( select( coreStore ) ).getTemplateId(
				postType,
				postId
			);
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
		[ postType, postId ]
	);
}
