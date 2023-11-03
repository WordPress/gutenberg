/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../../utils/constants';

export function useIsPostsPage( postId ) {
	return useSelect(
		( select ) =>
			+postId ===
			select( coreStore ).getEntityRecord( 'root', 'site' )
				?.page_for_posts,
		[ postId ]
	);
}

function useTemplates() {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				TEMPLATE_POST_TYPE,
				{
					per_page: -1,
					post_type: 'page',
				}
			),
		[]
	);
}

export function useAvailableTemplates( context ) {
	const currentTemplateSlug = useCurrentTemplateSlug( context );
	const isPostsPage = useIsPostsPage( context?.postId );
	const templates = useTemplates();
	return useMemo(
		() =>
			// The posts page template cannot be changed.
			! isPostsPage &&
			templates?.filter(
				( template ) =>
					template.is_custom &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, isPostsPage ]
	);
}

export function useCurrentTemplateSlug( context ) {
	const { postType, postId } = context;
	const templates = useTemplates();
	const entityTemplate = useSelect(
		( select ) => {
			const post = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			return post?.template;
		},
		[ postType, postId ]
	);

	if ( ! entityTemplate ) {
		return;
	}
	// If a page has a `template` set and is not included in the list
	// of the theme's templates, do not return it, in order to resolve
	// to the current theme's default template.
	return templates?.find( ( template ) => template.slug === entityTemplate )
		?.slug;
}
