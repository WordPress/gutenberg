/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export function useEditedPostContext() {
	return useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
}

export function useIsPostsPage() {
	const { postId } = useEditedPostContext();
	return useSelect(
		( select ) =>
			+postId ===
			select( coreStore ).getEntityRecord( 'root', 'site' )
				?.page_for_posts,
		[ postId ]
	);
}

export function useAvailableTemplates() {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const isPostsPage = useIsPostsPage();
	const templates = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
			} ),
		[]
	);
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

export function useCurrentTemplateSlug() {
	const { postType, postId } = useEditedPostContext();
	return useSelect(
		( select ) => {
			const post = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			return post?.template;
		},
		[ postType, postId ]
	);
}
