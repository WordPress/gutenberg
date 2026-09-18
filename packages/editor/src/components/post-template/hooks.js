import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
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
	const { postId } = useEditedPostContext();
	const templates = useTemplates( postId );
	return templates?.length > 1;
}

function useTemplates( postId ) {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
				post_id: Number( postId ),
			} ),
		[ postId ]
	);
}

export function useAvailableTemplates() {
	const { postId } = useEditedPostContext();
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const templates = useTemplates( postId );
	const defaultTemplate = templates?.[ 0 ];
	return useMemo(
		() =>
			allowSwitchingTemplate &&
			[
				...( templates || [] ).filter(
					( template ) =>
						template.id !== defaultTemplate?.id &&
						template.slug !== currentTemplateSlug
				),
				currentTemplateSlug &&
					defaultTemplate && {
						...defaultTemplate,
						title: {
							rendered: sprintf(
								// translators: %s: Template name
								__( '%s (default)' ),
								defaultTemplate.title.rendered
							),
						},
						// That's extra custom prop in order to update to an empty template
						// when we select the default template.
						isDefault: true,
					},
			].filter( Boolean ),
		[
			templates,
			defaultTemplate,
			currentTemplateSlug,
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
	const templates = useTemplates( postId );
	const entityTemplate = useSelect(
		( select ) => {
			if ( templates?.length === 1 ) {
				return templates[ 0 ].slug;
			}
			const post = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			return post?.template;
		},
		[ postType, postId, templates ]
	);

	if ( ! entityTemplate ) {
		return;
	}
	if ( templates?.length > 1 && entityTemplate === templates[ 0 ].slug ) {
		return;
	}
	// An assignment outside the returned choices falls back to the default.
	return templates?.find( ( template ) => template.slug === entityTemplate )
		?.slug;
}
