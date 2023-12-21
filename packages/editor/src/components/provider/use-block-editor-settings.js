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
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import inserterMediaCategories from '../media-categories';
import { mediaUpload } from '../../utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { settingsKeys } = unlock( blockEditorPrivateApis );

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
	'allowRightClickOverrides',
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

function useLinkControlEntitySearch() {
	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	// The function should either be undefined or a stable function reference
	// throughout the editor lifetime, much like importing a function from a
	// module.
	const { pageOnFront, pageForPosts } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );

		const siteSettings = canUser( 'read', 'settings' )
			? getEntityRecord( 'root', 'site' )
			: undefined;

		return {
			pageOnFront: siteSettings?.page_on_front,
			pageForPosts: siteSettings?.page_for_posts,
		};
	}, [] );

	return useCallback(
		async ( val, suggestionsQuery, withCreateSuggestion ) => {
			const { isInitialSuggestions } = suggestionsQuery;

			const results = await fetchLinkSuggestions(
				val,
				suggestionsQuery,
				settings
			);

			// Identify front page and update type to match.
			results.map( ( result ) => {
				if ( Number( result.id ) === pageOnFront ) {
					result.isFrontPage = true;
					return result;
				} else if ( Number( result.id ) === pageForPosts ) {
					result.isBlogHome = true;
					return result;
				}

				return result;
			} );

			// If displaying initial suggestions just return plain results.
			if ( isInitialSuggestions ) {
				return results;
			}

			// Here we append a faux suggestion to represent a "CREATE" option. This
			// is detected in the rendering of the search results and handled as a
			// special case. This is currently necessary because the suggestions
			// dropdown will only appear if there are valid suggestions and
			// therefore unless the create option is a suggestion it will not
			// display in scenarios where there are no results returned from the
			// API. In addition promoting CREATE to a first class suggestion affords
			// the a11y benefits afforded by `URLInput` to all suggestions (eg:
			// keyboard handling, ARIA roles...etc).
			//
			// Note also that the value of the `title` and `url` properties must correspond
			// to the text value of the `<input>`. This is because `title` is used
			// when creating the suggestion. Similarly `url` is used when using keyboard to select
			// the suggestion (the <form> `onSubmit` handler falls-back to `url`).
			return ! withCreateSuggestion
				? results
				: results.concat( {
						// the `id` prop is intentionally ommitted here because it
						// is never exposed as part of the component's public API.
						// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
						title: val, // Must match the existing `<input>`s text value.
						url: val, // Must match the existing `<input>`s text value.
						type: '__CREATE__',
				  } );
		},
		[ pageOnFront, pageForPosts, settings ]
	);
}

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
		reusableBlocks,
		hasUploadPermissions,
		canUseUnfilteredHTML,
		userCanCreatePages,
		userPatternCategories,
		restBlockPatterns,
		restBlockPatternCategories,
	} = useSelect(
		( select ) => {
			const isWeb = Platform.OS === 'web';
			const {
				canUser,
				getRawEntityRecord,
				getUserPatternCategories,
				getEntityRecords,
				getBlockPatterns,
				getBlockPatternCategories,
			} = select( coreStore );

			return {
				canUseUnfilteredHTML: getRawEntityRecord(
					'postType',
					postType,
					postId
				)?._links?.hasOwnProperty( 'wp:action-unfiltered-html' ),
				reusableBlocks: isWeb
					? getEntityRecords( 'postType', 'wp_block', {
							per_page: -1,
					  } )
					: EMPTY_BLOCKS_LIST, // Reusable blocks are fetched in the native version of this hook.
				hasUploadPermissions: canUser( 'create', 'media' ) ?? true,
				userCanCreatePages: canUser( 'create', 'pages' ),
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
			__experimentalUserPatternCategories: userPatternCategories,
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
			[ settingsKeys.useLinkControlEntitySearch ]:
				useLinkControlEntitySearch,
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
			postType,
			setIsInserterOpened,
		]
	);
}

export default useBlockEditorSettings;
