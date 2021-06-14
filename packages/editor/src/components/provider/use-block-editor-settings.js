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
	__experimentalFetchRemoteUrlData as fetchRemoteUrlData,
} from '@wordpress/core-data';
import { getAuthority } from '@wordpress/url';

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
		baseUrl,
	} = useSelect( ( select ) => {
		const { canUserUseUnfilteredHTML } = select( editorStore );
		const isWeb = Platform.OS === 'web';
		const { canUser, getUnstableBase } = select( coreStore );

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
			baseUrl: getUnstableBase()?.url || '',
		};
	}, [] );

	const { undo } = useDispatch( editorStore );

	// Temporary home - should this live in `core-data`?
	function fetchRichUrlData( url, fetchOptions = {} ) {
		const emptyDataSet = {};

		const fetchingBaseUrl = '' === baseUrl;

		// If the baseUrl is still resolving then return
		// empty data for this request.
		if ( fetchingBaseUrl ) {
			return Promise.resolve( emptyDataSet );
		}

		// More accurate test for internal URLs to avoid edge cases
		// such as baseURL being included as part of a query string
		// on the target url.
		const baseUrlAuthority = getAuthority( baseUrl );
		const urlAuthority = getAuthority( url );

		const isInternal = urlAuthority === baseUrlAuthority;

		// Don't handle internal URLs (yet...).
		if ( isInternal ) {
			return Promise.resolve( emptyDataSet );
		}

		// If external then attempt fetch of data.
		return fetchRemoteUrlData( url, fetchOptions );
	}

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
			__experimentalFetchRichUrlData: fetchRichUrlData,
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			__experimentalUndo: undo,
			outlineMode: hasTemplate,
		} ),
		[
			settings,
			hasUploadPermissions,
			reusableBlocks,
			canUseUnfilteredHTML,
			undo,
			hasTemplate,
		]
	);
}

export default useBlockEditorSettings;
