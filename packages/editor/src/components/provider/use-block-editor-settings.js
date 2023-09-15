/**
 * WordPress dependencies
 */
import { Platform, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as coreStore,
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
} from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import inserterMediaCategories from '../media-categories';
import { mediaUpload } from '../../utils';
import { store as editorStore } from '../../store';

const EMPTY_BLOCKS_LIST = [];

const BLOCK_EDITOR_SETTINGS = [
	'__experimentalBlockDirectory',
	'__experimentalDiscussionSettings',
	'__experimentalFeatures',
	'__experimentalGlobalStylesBaseStyles',
	'__experimentalPreferredStyleVariations',
	'__experimentalSetIsInserterOpened',
	'__unstableGalleryWithImageBlocks',
	'alignWide',
	'allowedBlockTypes',
	'blockInspectorTabs',
	'allowedMimeTypes',
	'bodyPlaceholder',
	'canLockBlocks',
	'capabilities',
	'clearBlockSelection',
	'codeEditingEnabled',
	'colors',
	'disableCustomColors',
	'disableCustomFontSizes',
	'disableCustomSpacingSizes',
	'disableCustomGradients',
	'disableLayoutStyles',
	'enableCustomLineHeight',
	'enableCustomSpacing',
	'enableCustomUnits',
	'enableOpenverseMediaCategory',
	'focusMode',
	'distractionFree',
	'fontSizes',
	'gradients',
	'generateAnchors',
	'hasFixedToolbar',
	'hasInlineToolbar',
	'isDistractionFree',
	'imageDefaultSize',
	'imageDimensions',
	'imageEditing',
	'imageSizes',
	'isRTL',
	'keepCaretInsideBlock',
	'locale',
	'maxWidth',
	'onUpdateDefaultBlockStyles',
	'postContentAttributes',
	'postsPerPage',
	'readOnly',
	'styles',
	'template',
	'templateLock',
	'titlePlaceholder',
	'supportsLayout',
	'widgetTypesToHideFromLegacyWidgetBlock',
	'__unstableHasCustomAppender',
	'__unstableIsPreviewMode',
	'__unstableResolvedAssets',
	'__unstableIsBlockBasedTheme',
	'behaviors',
];

/**
 * React hook used to compute the block editor settings to use for the post editor.
 *
 * @param {Object}  settings    EditorProvider settings prop.
 * @param {boolean} hasTemplate Whether template mode is enabled.
 *
 * @return {Object} Block Editor Settings.
 */
function useBlockEditorSettings( settings, hasTemplate ) {
	const {
		reusableBlocks,
		hasUploadPermissions,
		canUseUnfilteredHTML,
		userCanCreatePages,
		pageOnFront,
		postType,
	} = useSelect( ( select ) => {
		const { canUserUseUnfilteredHTML, getCurrentPostType } =
			select( editorStore );
		const isWeb = Platform.OS === 'web';
		const { canUser, getEntityRecord } = select( coreStore );

		const siteSettings = canUser( 'read', 'settings' )
			? getEntityRecord( 'root', 'site' )
			: undefined;

		return {
			canUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			reusableBlocks: isWeb
				? select( coreStore ).getEntityRecords(
						'postType',
						'wp_block',
						{ per_page: -1 }
				  )
				: EMPTY_BLOCKS_LIST, // Reusable blocks are fetched in the native version of this hook.
			hasUploadPermissions: canUser( 'create', 'media' ) ?? true,
			userCanCreatePages: canUser( 'create', 'pages' ),
			pageOnFront: siteSettings?.page_on_front,
			postType: getCurrentPostType(),
		};
	}, [] );

	const settingsBlockPatterns =
		settings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		settings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		settings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		settings.__experimentalBlockPatternCategories; // WP 5.9

	const { restBlockPatterns, restBlockPatternCategories } = useSelect(
		( select ) => ( {
			restBlockPatterns: select( coreStore ).getBlockPatterns(),
			restBlockPatternCategories:
				select( coreStore ).getBlockPatternCategories(),
		} ),
		[]
	);

	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			]
				.filter(
					( x, index, arr ) =>
						index === arr.findIndex( ( y ) => x.name === y.name )
				)
				.filter( ( { postTypes } ) => {
					return (
						! postTypes ||
						( Array.isArray( postTypes ) &&
							postTypes.includes( postType ) )
					);
				} ),
		[ settingsBlockPatterns, restBlockPatterns, postType ]
	);

	const blockPatternCategories = useMemo(
		() =>
			[
				...( settingsBlockPatternCategories || [] ),
				...( restBlockPatternCategories || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ settingsBlockPatternCategories, restBlockPatternCategories ]
	);

	const { undo } = useDispatch( editorStore );

	const { saveEntityRecord } = useDispatch( coreStore );

	/**
	 * Creates a Post entity.
	 * This is utilised by the Link UI to allow for on-the-fly creation of Posts/Pages.
	 *
	 * @param {Object} options parameters for the post being created. These mirror those used on 3rd param of saveEntityRecord.
	 * @return {Object} the post type object that was created.
	 */
	const createPageEntity = ( options ) => {
		if ( ! userCanCreatePages ) {
			return Promise.reject( {
				message: __( 'You do not have permission to create Pages.' ),
			} );
		}
		return saveEntityRecord( 'postType', 'page', options );
	};

	return useMemo(
		() => ( {
			...Object.fromEntries(
				Object.entries( settings ).filter( ( [ key ] ) =>
					BLOCK_EDITOR_SETTINGS.includes( key )
				)
			),
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
			__experimentalFetchLinkSuggestions: ( search, searchOptions ) =>
				fetchLinkSuggestions( search, searchOptions, settings ),
			inserterMediaCategories,
			__experimentalFetchRichUrlData: fetchUrlData,
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			__experimentalUndo: undo,
			outlineMode: hasTemplate,
			__experimentalCreatePageEntity: createPageEntity,
			__experimentalUserCanCreatePages: userCanCreatePages,
			pageOnFront,
			__experimentalPreferPatternsOnRoot: hasTemplate,
		} ),
		[
			settings,
			hasUploadPermissions,
			reusableBlocks,
			blockPatterns,
			blockPatternCategories,
			canUseUnfilteredHTML,
			undo,
			hasTemplate,
			userCanCreatePages,
			pageOnFront,
		]
	);
}

export default useBlockEditorSettings;
