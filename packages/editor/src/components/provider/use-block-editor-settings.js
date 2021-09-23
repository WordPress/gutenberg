/**
 * External dependencies
 */
import { pick, defaultTo } from 'lodash';

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

/**
 * Internal dependencies
 */
import { mediaUpload } from '../../utils';
import { store as editorStore } from '../../store';

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
		userCanCreatePosts,
	} = useSelect( ( select ) => {
		const { canUserUseUnfilteredHTML } = select( editorStore );
		const isWeb = Platform.OS === 'web';
		const { canUser, getUnstableBase, hasFinishedResolution } = select(
			coreStore
		);

		const siteData = getUnstableBase();

		const hasFinishedResolvingSiteData = hasFinishedResolution(
			'getUnstableBase'
		);

		return {
			canUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			reusableBlocks: isWeb
				? select( coreStore ).getEntityRecords(
						'postType',
						'wp_block',
						{ per_page: -1 }
				  )
				: [], // Reusable blocks are fetched in the native version of this hook.
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
			hasResolvedLocalSiteData: hasFinishedResolvingSiteData,
			baseUrl: siteData?.url || '',
			userCanCreatePages: select( coreStore ).canUser(
				'create',
				'pages'
			),
			userCanCreatePosts: select( coreStore ).canUser(
				'create',
				'posts'
			),
		};
	}, [] );

	const { undo } = useDispatch( editorStore );

	const { saveEntityRecord } = useDispatch( coreStore );

	/**
	 * Creates a Post entity.
	 * This is utilised by the Link UI to allow for on-the-fly creation of Posts/Pages.
	 *
	 * @param {string} postType the post type of the "post" to be created.
	 * @param {Object} options  parameters for the post being created. These mirror those used on 3rd param of saveEntityRecord.
	 * @return {Object} the post type object that was created.
	 */
	const createEntity = ( postType, options ) => {
		// The function is intentionally left open for extension in the future.
		// However for now we lock this down to only allow Pages.
		const postTypeWhitelist = [ 'page' ];

		if ( ! postTypeWhitelist.includes( postType ) ) {
			return Promise.reject( {
				message: 'Only Pages may be created.',
			} );
		}

		if ( ! userCanCreatePages ) {
			return Promise.reject( {
				message: 'You do not have permission to create Pages.',
			} );
		}
		return saveEntityRecord( 'postType', postType, options );
	};

	return useMemo(
		() => ( {
			...pick( settings, [
				'__experimentalBlockDirectory',
				'__experimentalBlockPatternCategories',
				'__experimentalBlockPatterns',
				'__experimentalFeatures',
				'__experimentalGlobalStylesBaseStyles',
				'__experimentalGlobalStylesUserEntityId',
				'__experimentalPreferredStyleVariations',
				'__experimentalSetIsInserterOpened',
				'__unstableGalleryWithImageBlocks',
				'alignWide',
				'allowedBlockTypes',
				'bodyPlaceholder',
				'codeEditingEnabled',
				'colors',
				'disableCustomColors',
				'disableCustomFontSizes',
				'disableCustomGradients',
				'enableCustomLineHeight',
				'enableCustomSpacing',
				'enableCustomUnits',
				'focusMode',
				'fontSizes',
				'gradients',
				'hasFixedToolbar',
				'hasReducedUI',
				'imageDefaultSize',
				'imageDimensions',
				'imageEditing',
				'imageSizes',
				'isRTL',
				'keepCaretInsideBlock',
				'maxWidth',
				'onUpdateDefaultBlockStyles',
				'styles',
				'template',
				'templateLock',
				'titlePlaceholder',
				'supportsLayout',
				'widgetTypesToHideFromLegacyWidgetBlock',
			] ),
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalFetchLinkSuggestions: ( search, searchOptions ) =>
				fetchLinkSuggestions( search, searchOptions, settings ),
			__experimentalFetchRichUrlData: fetchUrlData,
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			__experimentalUndo: undo,
			outlineMode: hasTemplate,
			__experimentalCreateEntity: createEntity,
			__experimentalUserCanCreate:
				userCanCreatePosts && userCanCreatePages,
		} ),
		[
			settings,
			hasUploadPermissions,
			reusableBlocks,
			canUseUnfilteredHTML,
			undo,
			hasTemplate,
			userCanCreatePosts,
			userCanCreatePages,
			createEntity,
		]
	);
}

export default useBlockEditorSettings;
