/**
 * WordPress dependencies
 */
import { Platform, useMemo, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as coreStore,
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
} from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

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
	'distractionFree',
	'fontSizes',
	'gradients',
	'generateAnchors',
	'getPostLinkProps',
	'hasFixedToolbar',
	'hasInlineToolbar',
	'isDistractionFree',
	'imageDefaultSize',
	'imageDimensions',
	'imageEditing',
	'imageSizes',
	'isRTL',
	'locale',
	'maxWidth',
	'onUpdateDefaultBlockStyles',
	'postContentAttributes',
	'postsPerPage',
	'readOnly',
	'styles',
	'titlePlaceholder',
	'supportsLayout',
	'widgetTypesToHideFromLegacyWidgetBlock',
	'__unstableHasCustomAppender',
	'__unstableIsPreviewMode',
	'__unstableResolvedAssets',
	'__unstableIsBlockBasedTheme',
	'__experimentalArchiveTitleTypeLabel',
	'__experimentalArchiveTitleNameLabel',
];

/**
 * React hook used to compute the block editor settings to use for the post editor.
 *
 * @param {Object} settings EditorProvider settings prop.
 * @param {string} postType Editor root level post type.
 * @param {string} postId   Editor root level post ID.
 *
 * @return {Object} Block Editor Settings.
 */
function useBlockEditorSettings( settings, postType, postId ) {
	const {
		allowRightClickOverrides,
		focusMode,
		keepCaretInsideBlock,
		reusableBlocks,
		hasUploadPermissions,
		canUseUnfilteredHTML,
		userCanCreatePages,
		pageOnFront,
		pageForPosts,
		userPatternCategories,
		restBlockPatterns,
		restBlockPatternCategories,
	} = useSelect(
		( select ) => {
			const isWeb = Platform.OS === 'web';
			const {
				canUser,
				getRawEntityRecord,
				getEntityRecord,
				getUserPatternCategories,
				getEntityRecords,
				getBlockPatterns,
				getBlockPatternCategories,
			} = select( coreStore );
			const { get } = select( preferencesStore );

			const siteSettings = canUser( 'read', 'settings' )
				? getEntityRecord( 'root', 'site' )
				: undefined;

			return {
				allowRightClickOverrides: get(
					'core',
					'allowRightClickOverrides'
				),
				canUseUnfilteredHTML: getRawEntityRecord(
					'postType',
					postType,
					postId
				)?._links?.hasOwnProperty( 'wp:action-unfiltered-html' ),
				focusMode: get( 'core', 'focusMode' ),
				keepCaretInsideBlock: get( 'core', 'keepCaretInsideBlock' ),
				reusableBlocks: isWeb
					? getEntityRecords( 'postType', 'wp_block', {
							per_page: -1,
					  } )
					: EMPTY_BLOCKS_LIST, // Reusable blocks are fetched in the native version of this hook.
				hasUploadPermissions: canUser( 'create', 'media' ) ?? true,
				userCanCreatePages: canUser( 'create', 'pages' ),
				pageOnFront: siteSettings?.page_on_front,
				pageForPosts: siteSettings?.page_for_posts,
				userPatternCategories: getUserPatternCategories(),
				restBlockPatterns: getBlockPatterns(),
				restBlockPatternCategories: getBlockPatternCategories(),
			};
		},
		[ postType, postId ]
	);

	const settingsBlockPatterns =
		settings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		settings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		settings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		settings.__experimentalBlockPatternCategories; // WP 5.9

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

	const { undo, setIsInserterOpened } = useDispatch( editorStore );

	const { saveEntityRecord } = useDispatch( coreStore );

	/**
	 * Creates a Post entity.
	 * This is utilised by the Link UI to allow for on-the-fly creation of Posts/Pages.
	 *
	 * @param {Object} options parameters for the post being created. These mirror those used on 3rd param of saveEntityRecord.
	 * @return {Object} the post type object that was created.
	 */
	const createPageEntity = useCallback(
		( options ) => {
			if ( ! userCanCreatePages ) {
				return Promise.reject( {
					message: __(
						'You do not have permission to create Pages.'
					),
				} );
			}
			return saveEntityRecord( 'postType', 'page', options );
		},
		[ saveEntityRecord, userCanCreatePages ]
	);

	const forceDisableFocusMode = settings.focusMode === false;

	return useMemo(
		() => ( {
			...Object.fromEntries(
				Object.entries( settings ).filter( ( [ key ] ) =>
					BLOCK_EDITOR_SETTINGS.includes( key )
				)
			),
			allowRightClickOverrides,
			focusMode: focusMode && ! forceDisableFocusMode,
			keepCaretInsideBlock,
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
			__experimentalUserPatternCategories: userPatternCategories,
			__experimentalFetchLinkSuggestions: ( search, searchOptions ) =>
				fetchLinkSuggestions( search, searchOptions, settings ),
			inserterMediaCategories,
			__experimentalFetchRichUrlData: fetchUrlData,
			// Todo: This only checks the top level post, not the post within a template or any other entity that can be edited.
			// This might be better as a generic "canUser" selector.
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			//Todo: this is only needed for native and should probably be removed.
			__experimentalUndo: undo,
			// Check whether we want all site editor frames to have outlines
			// including the navigation / pattern / parts editors.
			outlineMode: postType === 'wp_template',
			// Check these two properties: they were not present in the site editor.
			__experimentalCreatePageEntity: createPageEntity,
			__experimentalUserCanCreatePages: userCanCreatePages,
			pageOnFront,
			pageForPosts,
			__experimentalPreferPatternsOnRoot: postType === 'wp_template',
			templateLock:
				postType === 'wp_navigation' ? 'insert' : settings.templateLock,
			template:
				postType === 'wp_navigation'
					? [ [ 'core/navigation', {}, [] ] ]
					: settings.template,
			__experimentalSetIsInserterOpened: setIsInserterOpened,
		} ),
		[
			allowRightClickOverrides,
			focusMode,
			forceDisableFocusMode,
			keepCaretInsideBlock,
			settings,
			hasUploadPermissions,
			reusableBlocks,
			userPatternCategories,
			blockPatterns,
			blockPatternCategories,
			canUseUnfilteredHTML,
			undo,
			createPageEntity,
			userCanCreatePages,
			pageOnFront,
			pageForPosts,
			postType,
			setIsInserterOpened,
		]
	);
}

export default useBlockEditorSettings;
