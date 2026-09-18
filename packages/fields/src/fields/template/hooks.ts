import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
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
