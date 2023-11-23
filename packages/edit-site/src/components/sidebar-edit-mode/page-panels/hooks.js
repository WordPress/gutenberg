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
import { TEMPLATE_POST_TYPE } from '../../../utils/constants';

export function useEditedPostContext() {
	return useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
}

export function useIsPostsPageOrFrontPage() {
	const { postId } = useEditedPostContext();
	return useSelect(
		( select ) => {
			const siteSettings = select( coreStore ).getEntityRecord(
				'root',
				'site'
			);
			return [
				siteSettings?.page_for_posts,
				siteSettings?.page_on_front,
			].includes( +postId );
		},
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

export function useAvailableTemplates() {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const isPostsPageOrFrontPage = useIsPostsPageOrFrontPage();
	const templates = useTemplates();
	return useMemo(
		() =>
			// The posts page template cannot be changed.
			! isPostsPageOrFrontPage &&
			templates?.filter(
				( template ) =>
					template.is_custom &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, isPostsPageOrFrontPage ]
	);
}

export function useCurrentTemplateSlug() {
	const { postType, postId } = useEditedPostContext();
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
