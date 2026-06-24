/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import {
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPES,
} from '../../store/constants';
import { getTemplateInfo } from '../../utils/get-template-info';

function isNavigationOverlayTemplatePart( attributes ) {
	return (
		attributes?.area === 'navigation-overlay' ||
		attributes?.slug === 'overlay' ||
		attributes?.slug?.includes( 'overlay' )
	);
}

function getTemplatePartId( attributes, currentTheme ) {
	const theme = attributes?.theme || currentTheme?.stylesheet;
	return theme && attributes?.slug
		? `${ theme }//${ attributes.slug }`
		: undefined;
}

export default function useActiveEditorEntity() {
	return useSelect( ( select ) => {
		const editor = select( editorStore );
		const blockEditor = select( blockEditorStore );
		const core = select( coreStore );
		const currentTheme = core.getCurrentTheme();
		const currentPostType = editor.getCurrentPostType();
		const currentPostId = editor.getCurrentPostId();
		const { getEditedContentOnlySection } = unlock( blockEditor );
		const editedSectionId = getEditedContentOnlySection();

		let postType = currentPostType;
		let postId = currentPostId;
		let isInlineTemplatePart = false;
		let sourceClientId;

		if (
			blockEditor.getSettings().__experimentalUniversalCanvas &&
			editedSectionId &&
			blockEditor.getBlockName( editedSectionId ) === 'core/template-part'
		) {
			const attributes =
				blockEditor.getBlockAttributes( editedSectionId );
			const templatePartId = getTemplatePartId(
				attributes,
				currentTheme
			);

			if (
				templatePartId &&
				! isNavigationOverlayTemplatePart( attributes )
			) {
				postType = TEMPLATE_PART_POST_TYPE;
				postId = templatePartId;
				isInlineTemplatePart = true;
				sourceClientId = editedSectionId;
			}
		}

		const record = core.getEditedEntityRecord(
			'postType',
			postType,
			postId
		);
		const isNotFound =
			! record &&
			! core.isResolving(
				'getEditedEntityRecord',
				'postType',
				postType,
				postId
			);
		const postTypeObject = core.getPostType( postType );
		const templateInfo = TEMPLATE_POST_TYPES.includes( postType )
			? getTemplateInfo( {
					templateTypes: currentTheme?.default_template_types || [],
					templateAreas:
						currentTheme?.default_template_part_areas || [],
					template: record || {},
			  } )
			: {};

		return {
			postId,
			postType,
			postTypeLabel: postTypeObject?.labels?.singular_name,
			record,
			isNotFound,
			templateTitle: templateInfo?.title,
			isInlineGlobalEntity: isInlineTemplatePart,
			isInlineTemplatePart,
			sourceClientId,
		};
	}, [] );
}
