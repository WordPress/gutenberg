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
	const postType = record.type;
	const availableTemplates = ( ( record as Record< string, any > )
		?.available_templates ?? {} ) as Record< string, string >;
	const hasAvailableTemplates = Object.keys( availableTemplates ).length > 0;
	return useSelect(
		( select ) => {
			const isBlockTheme =
				!! select( coreStore ).getCurrentTheme()?.is_block_theme;
			const postTypeObj = select( coreStore ).getPostType( postType );
			if ( ! postTypeObj?.viewable ) {
				return null;
			}
			const canCreateTemplates =
				isBlockTheme &&
				( select( coreStore ).canUser( 'create', {
					kind: 'postType',
					name: 'wp_template',
				} ) ??
					false );
			const isVisible = hasAvailableTemplates || canCreateTemplates;
			const canViewTemplates = isVisible
				? !! select( coreStore ).canUser( 'read', {
						kind: 'postType',
						name: 'wp_template',
				  } )
				: false;
			if ( ( ! isBlockTheme || ! canViewTemplates ) && isVisible ) {
				return 'classic';
			}
			if ( isBlockTheme && canViewTemplates ) {
				return 'block-theme';
			}
			return null;
		},
		[ postType, hasAvailableTemplates ]
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
