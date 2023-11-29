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

export function useAllowSwitchingTemplates() {
	const { postId } = useEditedPostContext();
	return useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const templates = getEntityRecords(
				'postType',
				TEMPLATE_POST_TYPE,
				{ per_page: -1 }
			);
			const isPostsPage = +postId === siteSettings?.page_for_posts;
			// If current page is set front page or posts page, we also need
			// to check if the current theme has a template for it. If not
			const isFrontPage =
				+postId === siteSettings?.page_on_front &&
				templates?.some( ( { slug } ) => slug === 'front-page' );
			return ! isPostsPage && ! isFrontPage;
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
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const templates = useTemplates();
	return useMemo(
		() =>
			allowSwitchingTemplate &&
			templates?.filter(
				( template ) =>
					template.is_custom &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, allowSwitchingTemplate ]
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
