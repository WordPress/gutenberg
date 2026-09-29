import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
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

function useTemplates( postType, postSlug ) {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
				post_type: postType,
				...( postSlug !== undefined && { slug: postSlug } ),
			} ),
		[ postType, postSlug ]
	);
}

/**
 * @return {import('@wordpress/core-data').WpTemplate[] | null} Templates.
 */
export function useAvailableTemplates() {
	const { postType, postId } = useEditedPostContext();
	const [ postSlug ] = useEntityProp( 'postType', postType, 'slug', postId );
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const templates = useTemplates( postType, postSlug || undefined );
	// The filtered order does not define the hierarchy default.
	const defaultTemplateId = useSelect(
		( select ) => {
			const base = postType === 'page' ? 'page' : `single-${ postType }`;
			return select( coreStore ).getDefaultTemplateId( {
				slug: postSlug ? `${ base }-${ postSlug }` : base,
			} );
		},
		[ postType, postSlug ]
	);
	return useMemo(
		() =>
			allowSwitchingTemplate &&
			defaultTemplateId !== undefined &&
			( templates || [] )
				.filter(
					( template ) =>
						template.slug !== currentTemplateSlug &&
						!! template.content.raw &&
						( currentTemplateSlug ||
							template.id !== defaultTemplateId )
				)
				.map( ( template ) =>
					template.id === defaultTemplateId
						? {
								...template,
								title: {
									rendered: sprintf(
										// translators: %s: Template name.
										__( '%s (default)' ),
										template.title.rendered
									),
								},
								isDefault: true,
							}
						: { ...template, isDefault: false }
				),
		[
			templates,
			currentTemplateSlug,
			defaultTemplateId,
			allowSwitchingTemplate,
		]
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
		if ( ! isBlockTheme && isVisible ) {
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
