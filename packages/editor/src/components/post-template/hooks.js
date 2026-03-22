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
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
				post_type: postType,
				// We look at the combined templates for now (old endpoint)
				// because posts only accept slugs for templates, not IDs.
			} ),
		[ postType ]
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
					template.is_custom &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, allowSwitchingTemplate ]
	);
}

export function usePostTemplatePanelMode() {
	return useSelect( ( select ) => {
		const { getEditorSettings, getCurrentTemplateId, getCurrentPostType } =
			select( editorStore );
		const { getPostType, canUser } = select( coreStore );
		const postTypeSlug = getCurrentPostType();
		const postType = getPostType( postTypeSlug );
		const settings = getEditorSettings();
		const isBlockTheme = settings.__unstableIsBlockBasedTheme;
		const hasTemplates =
			!! settings.availableTemplates &&
			Object.keys( settings.availableTemplates ).length > 0;
		let isVisible;
		if ( ! postType?.viewable ) {
			isVisible = false;
		} else if ( hasTemplates ) {
			isVisible = true;
		} else if ( ! settings.supportsTemplateMode ) {
			isVisible = false;
		} else {
			isVisible =
				canUser( 'create', {
					kind: 'postType',
					name: 'wp_template',
				} ) ?? false;
		}
		const canViewTemplates = isVisible
			? !! canUser( 'read', {
					kind: 'postType',
					name: 'wp_template',
			  } )
			: false;
		if ( ( ! isBlockTheme || ! canViewTemplates ) && isVisible ) {
			return 'classic';
		}
		if ( isBlockTheme && !! getCurrentTemplateId() ) {
			return 'block-theme';
		}
		return null;
	}, [] );
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
