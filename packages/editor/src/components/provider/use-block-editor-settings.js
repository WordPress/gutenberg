/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useRef, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as coreStore,
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch } from '@wordpress/compose';
import { store as blocksStore } from '@wordpress/blocks';
import {
	privateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import inserterMediaCategories from '../media-categories';
import { mediaUpload } from '../../utils';
import mediaUploadOnSuccess from '../../utils/media-upload/on-success';
import { default as mediaSideload } from '../../utils/media-sideload';
import { default as mediaFinalize } from '../../utils/media-finalize';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useGlobalStylesContext } from '../global-styles-provider';
import {
	getSuggestionDiffAttributes,
	getSuggestionEditAttributes,
} from '../suggestion-mode-diff';

const EMPTY_OBJECT = {};

function __experimentalReusableBlocksSelect( select ) {
	const { RECEIVE_INTERMEDIATE_RESULTS } = unlock( coreDataPrivateApis );
	const { getEntityRecords } = select( coreStore );
	return getEntityRecords( 'postType', 'wp_block', {
		per_page: -1,
		[ RECEIVE_INTERMEDIATE_RESULTS ]: true,
	} );
}

const BLOCK_EDITOR_SETTINGS = [
	'__experimentalBlockBindingsSupportedAttributes',
	'__experimentalBlockDirectory',
	'__experimentalDiscussionSettings',
	'__experimentalFeatures',
	'__experimentalGlobalStylesBaseStyles',
	'allImageSizes',
	'alignWide',
	'blockInspectorTabs',
	'maxUploadFileSize',
	'allowedMimeTypes',
	'bodyPlaceholder',
	'canEditCSS',
	'canLockBlocks',
	'canUpdateBlockBindings',
	'capabilities',
	'clearBlockSelection',
	'codeEditingEnabled',
	'colors',
	'disableContentOnlyForUnsyncedPatterns',
	'disableCustomColors',
	'disableCustomFontSizes',
	'disableCustomSpacingSizes',
	'disableCustomGradients',
	'disableLayoutStyles',
	'enableCustomLineHeight',
	'enableCustomSpacing',
	'enableCustomUnits',
	'enableOpenverseMediaCategory',
	'fontSizes',
	'gradients',
	'generateAnchors',
	'onNavigateToEntityRecord',
	'imageDefaultSize',
	'imageDimensions',
	'imageEditing',
	'imageSizes',
	'isPreviewMode',
	'isRTL',
	'locale',
	'maxWidth',
	'postContentAttributes',
	'postsPerPage',
	'readOnly',
	'styles',
	'titlePlaceholder',
	'supportsLayout',
	'widgetTypesToHideFromLegacyWidgetBlock',
	'__unstableHasCustomAppender',
	'__unstableResolvedAssets',
	'__unstableIsBlockBasedTheme',
];

const {
	globalStylesDataKey,
	globalStylesLinksDataKey,
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
	sectionRootClientIdKey,
	mediaEditKey,
	getMediaSelectKey,
	isIsolatedEditorKey,
	deviceTypeKey,
	isNavigationOverlayContextKey,
	isNavigationPostEditorKey,
	mediaUploadOnSuccessKey,
} = unlock( privateApis );

/**
 * React hook used to compute the block editor settings to use for the post editor.
 *
 * @param {Object} settings      EditorProvider settings prop.
 * @param {string} postType      Editor root level post type.
 * @param {string} postId        Editor root level post ID.
 * @param {string} renderingMode Editor rendering mode.
 *
 * @return {Object} Block Editor Settings.
 */
function useBlockEditorSettings( settings, postType, postId, renderingMode ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const {
		allImageSizes,
		bigImageSizeThreshold,
		allowRightClickOverrides,
		blockTypes,
		focusMode,
		hasFixedToolbar,
		isDistractionFree,
		keepCaretInsideBlock,
		hasUploadPermissions,
		hiddenBlockTypes,
		canUseUnfilteredHTML,
		userCanCreatePages,
		pageOnFront,
		pageForPosts,
		userPatternCategories,
		restBlockPatternCategories,
		sectionRootClientId,
		deviceType,
		isNavigationOverlayContext,
		isRevisionsMode,
		suggestionMode,
	} = useSelect(
		( select ) => {
			const {
				canUser,
				getRawEntityRecord,
				getEntityRecord,
				getUserPatternCategories,
				getBlockPatternCategories,
			} = select( coreStore );
			const { get } = select( preferencesStore );
			const { getBlockTypes } = select( blocksStore );
			const {
				getDeviceType,
				isRevisionsMode: _isRevisionsMode,
				isSuggestionMode: _isSuggestionMode,
			} = unlock( select( editorStore ) );
			const { getBlocksByName, getBlockAttributes } =
				select( blockEditorStore );
			const siteSettings = canUser( 'read', {
				kind: 'root',
				name: 'site',
			} )
				? getEntityRecord( 'root', 'site' )
				: undefined;

			// Fetch image sizes from REST API index for client-side media processing.
			const baseData = getEntityRecord( 'root', '__unstableBase' );

			function getSectionRootBlock() {
				if ( renderingMode === 'template-locked' ) {
					return getBlocksByName( 'core/post-content' )?.[ 0 ] ?? '';
				}

				return (
					getBlocksByName( 'core/group' ).find(
						( clientId ) =>
							getBlockAttributes( clientId )?.tagName === 'main'
					) ?? ''
				);
			}

			return {
				allImageSizes: baseData?.image_sizes,
				bigImageSizeThreshold: baseData?.image_size_threshold,
				allowRightClickOverrides: get(
					'core',
					'allowRightClickOverrides'
				),
				blockTypes: getBlockTypes(),
				canUseUnfilteredHTML: getRawEntityRecord(
					'postType',
					postType,
					postId
				)?._links?.hasOwnProperty( 'wp:action-unfiltered-html' ),
				focusMode: get( 'core', 'focusMode' ),
				hasFixedToolbar:
					get( 'core', 'fixedToolbar' ) || ! isLargeViewport,
				hiddenBlockTypes: get( 'core', 'hiddenBlockTypes' ),
				isDistractionFree: get( 'core', 'distractionFree' ),
				keepCaretInsideBlock: get( 'core', 'keepCaretInsideBlock' ),
				hasUploadPermissions:
					canUser( 'create', {
						kind: 'postType',
						name: 'attachment',
					} ) ?? true,
				userCanCreatePages: canUser( 'create', {
					kind: 'postType',
					name: 'page',
				} ),
				pageOnFront: siteSettings?.page_on_front,
				pageForPosts: siteSettings?.page_for_posts,
				userPatternCategories: getUserPatternCategories(),
				restBlockPatternCategories: getBlockPatternCategories(),
				sectionRootClientId: getSectionRootBlock(),
				deviceType: getDeviceType(),
				isNavigationOverlayContext:
					postType === 'wp_template_part' && postId
						? getEntityRecord(
								'postType',
								'wp_template_part',
								postId
						  )?.area === 'navigation-overlay'
						: false,
				isRevisionsMode: _isRevisionsMode(),
				suggestionMode: _isSuggestionMode(),
			};
		},
		[ postType, postId, isLargeViewport, renderingMode ]
	);

	const { merged: mergedGlobalStyles } = useGlobalStylesContext();
	const globalStylesData = mergedGlobalStyles.styles ?? EMPTY_OBJECT;
	const globalStylesLinksData = mergedGlobalStyles._links ?? EMPTY_OBJECT;

	const settingsBlockPatterns =
		settings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		settings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		settings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		settings.__experimentalBlockPatternCategories; // WP 5.9

	const blockPatterns = useMemo(
		() =>
			[ ...( settingsBlockPatterns || [] ) ].filter(
				( { postTypes } ) => {
					return (
						! postTypes ||
						( Array.isArray( postTypes ) &&
							postTypes.includes( postType ) )
					);
				}
			),
		[ settingsBlockPatterns, postType ]
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
	const { editMediaEntity } = unlock( useDispatch( coreStore ) );
	const { saveEntityRecord, editEntityRecord } = useDispatch( coreStore );

	// Debounced save for suggestion note edits. Immediate local update
	// via editEntityRecord keeps the inline editor responsive, while
	// the debounced saveEntityRecord persists changes and syncs the
	// sidebar block note display.
	const suggestionSaveTimerRef = useRef( null );

	// Clean up pending save on unmount.
	useEffect( () => {
		return () => {
			if ( suggestionSaveTimerRef.current ) {
				clearTimeout( suggestionSaveTimerRef.current );
			}
		};
	}, [] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Creates a new suggestion note for a block that doesn't have one yet.
	// Called on the first edit in suggestion mode for blocks without a noteId.
	const pendingCreations = useRef( new Set() );
	const onSuggestionCreate = useCallback(
		async ( clientId, content, metadata ) => {
			// Prevent duplicate creation if an earlier keystroke already triggered it.
			if ( pendingCreations.current.has( clientId ) ) {
				return;
			}
			pendingCreations.current.add( clientId );

			try {
				const savedRecord = await saveEntityRecord(
					'root',
					'comment',
					{
						post: postId,
						content,
						status: 'hold',
						type: 'note',
						parent: 0,
						meta: { _wp_note_kind: 'suggestion' },
					},
					{ throwOnError: true }
				);

				if ( savedRecord?.id ) {
					updateBlockAttributes( clientId, {
						metadata: {
							...metadata,
							noteId: savedRecord.id,
						},
					} );
				}
			} finally {
				pendingCreations.current.delete( clientId );
			}
		},
		[ saveEntityRecord, postId, updateBlockAttributes ]
	);

	const onSuggestionEdit = useCallback(
		( noteId, content ) => {
			// Immediate local edit for responsive inline editing.
			editEntityRecord( 'root', 'comment', noteId, { content } );

			// Debounced save for persistence and sidebar sync.
			if ( suggestionSaveTimerRef.current ) {
				clearTimeout( suggestionSaveTimerRef.current );
			}
			suggestionSaveTimerRef.current = setTimeout( () => {
				saveEntityRecord( 'root', 'comment', {
					id: noteId,
					content,
				} );
				suggestionSaveTimerRef.current = null;
			}, 500 );
		},
		[ editEntityRecord, saveEntityRecord ]
	);

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

	const allowedBlockTypes = useMemo( () => {
		// Omit hidden block types if exists and non-empty.
		if ( hiddenBlockTypes && hiddenBlockTypes.length > 0 ) {
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? blockTypes.map( ( { name } ) => name )
					: settings.allowedBlockTypes || [];

			return defaultAllowedBlockTypes.filter(
				( type ) => ! hiddenBlockTypes.includes( type )
			);
		}

		return settings.allowedBlockTypes;
	}, [ settings.allowedBlockTypes, hiddenBlockTypes, blockTypes ] );

	const forceDisableFocusMode = settings.focusMode === false;

	return useMemo( () => {
		const blockEditorSettings = {
			...Object.fromEntries(
				Object.entries( settings ).filter( ( [ key ] ) =>
					BLOCK_EDITOR_SETTINGS.includes( key )
				)
			),
			[ globalStylesDataKey ]: globalStylesData,
			[ globalStylesLinksDataKey ]: globalStylesLinksData,
			allImageSizes,
			bigImageSizeThreshold,
			allowedBlockTypes,
			allowRightClickOverrides,
			focusMode: focusMode && ! forceDisableFocusMode,
			hasFixedToolbar,
			isDistractionFree,
			keepCaretInsideBlock,
			[ getMediaSelectKey ]: ( select, attachmentId ) => {
				return select( coreStore ).getEntityRecord(
					'postType',
					'attachment',
					attachmentId
				);
			},
			[ mediaEditKey ]: hasUploadPermissions
				? editMediaEntity
				: undefined,
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			[ mediaUploadOnSuccessKey ]: hasUploadPermissions
				? mediaUploadOnSuccess
				: undefined,
			mediaSideload: hasUploadPermissions ? mediaSideload : undefined,
			mediaFinalize: hasUploadPermissions ? mediaFinalize : undefined,
			__experimentalBlockPatterns: blockPatterns,
			[ selectBlockPatternsKey ]: ( select ) => {
				const { hasFinishedResolution, getBlockPatternsForPostType } =
					unlock( select( coreStore ) );
				const patterns = getBlockPatternsForPostType( postType );
				return hasFinishedResolution( 'getBlockPatterns' )
					? patterns
					: undefined;
			},
			[ reusableBlocksSelectKey ]: __experimentalReusableBlocksSelect,
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
			outlineMode: ! isDistractionFree && postType === 'wp_template',
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
			[ sectionRootClientIdKey ]: sectionRootClientId,
			editorTool:
				renderingMode === 'post-only' && postType !== 'wp_template'
					? 'edit'
					: undefined,
			// When editing template parts, patterns, or navigation directly,
			// we're in an isolated editing context (focused on that entity alone).
			[ isIsolatedEditorKey ]: [
				'wp_template_part',
				'wp_block',
				'wp_navigation',
			].includes( postType ),
			[ isNavigationPostEditorKey ]: postType === 'wp_navigation',
			// When in template-locked mode (e.g., "Show Template" in the post editor),
			// don't treat template parts as contentOnly sections.
			disableContentOnlyForTemplateParts:
				renderingMode === 'template-locked',
			...( deviceType ? { [ deviceTypeKey ]: deviceType } : {} ),
			[ isNavigationOverlayContextKey ]: isNavigationOverlayContext,
			suggestionMode,
			getSuggestionDiffAttributes: suggestionMode
				? getSuggestionDiffAttributes
				: null,
			getSuggestionEditAttributes: suggestionMode
				? getSuggestionEditAttributes
				: null,
			onSuggestionEdit: suggestionMode ? onSuggestionEdit : null,
			onSuggestionCreate: suggestionMode ? onSuggestionCreate : null,
		};

		if ( isRevisionsMode ) {
			blockEditorSettings.isPreviewMode = true;
		}

		return blockEditorSettings;
	}, [
		isRevisionsMode,
		allowedBlockTypes,
		allowRightClickOverrides,
		focusMode,
		forceDisableFocusMode,
		hasFixedToolbar,
		isDistractionFree,
		keepCaretInsideBlock,
		settings,
		hasUploadPermissions,
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
		sectionRootClientId,
		globalStylesData,
		globalStylesLinksData,
		renderingMode,
		editMediaEntity,
		settings.onNavigateToEntityRecord,
		deviceType,
		allImageSizes,
		bigImageSizeThreshold,
		isNavigationOverlayContext,
		suggestionMode,
		onSuggestionEdit,
		onSuggestionCreate,
	] );
}

export default useBlockEditorSettings;
