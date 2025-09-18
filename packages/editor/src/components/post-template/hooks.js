/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function useEditedPostContext() {
	return useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
		};
	}, [] );
}
export function useAllowSwitchingTemplates() {
	const { postType, postId } = useEditedPostContext();
	return useSelect(
		( select ) => {
			const { canUser, getEntityRecord, getEntityRecords } =
				select( coreStore );
			const siteSettings = canUser( 'read', {
				kind: 'root',
				name: 'site',
			} )
				? getEntityRecord( 'root', 'site' )
				: undefined;

			const isPostsPage = +postId === siteSettings?.page_for_posts;
			const isFrontPage =
				postType === 'page' && +postId === siteSettings?.page_on_front;
			// If current page is set front page or posts page, we also need
			// to check if the current theme has a template for it. If not
			const templates = isFrontPage
				? getEntityRecords( 'postType', 'wp_template', {
						per_page: -1,
				  } )
				: [];
			const hasFrontPage =
				isFrontPage &&
				!! templates?.some( ( { slug } ) => slug === 'front-page' );
			return ! isPostsPage && ! hasFrontPage;
		},
		[ postId, postType ]
	);
}

function useTemplates( postType ) {
	// To do: create a new selector to checks if templates exist at all instead
	// of and unbound request. In the modal, the user templates should be
	// paginated and we should not make an unbound request.
	const { staticTemplates, templates } = useSelect(
		( select ) => {
			return {
				staticTemplates: select( coreStore ).getEntityRecords(
					'postType',
					'wp_registered_template',
					{ per_page: -1, post_type: postType }
				),
				templates: select( coreStore ).getEntityRecords(
					'postType',
					'wp_template',
					{ per_page: -1, post_type: postType }
				),
			};
		},
		[ postType ]
	);
	return useMemo(
		() => [ ...( staticTemplates || [] ), ...( templates || [] ) ],
		[ staticTemplates, templates ]
	);
}

export function useAvailableTemplates( postType ) {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const templates = useTemplates( postType );
	return useMemo(
		() =>
			allowSwitchingTemplate &&
			templates?.filter(
				( template ) =>
					( template.is_custom || template.type === 'wp_template' ) &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, allowSwitchingTemplate ]
	);
}

export function useCurrentTemplateSlug() {
	const { postType, postId } = useEditedPostContext();
	const templates = useTemplates( postType );
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
