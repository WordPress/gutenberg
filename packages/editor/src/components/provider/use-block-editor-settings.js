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
		isTitleSelected,
	} = useSelect( ( select ) => {
		const { canUserUseUnfilteredHTML, isPostTitleSelected } = select(
			editorStore
		);
		const { canUser } = select( coreStore );

		return {
			canUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			reusableBlocks: select( coreStore ).getEntityRecords(
				'postType',
				'wp_block',
				/**
				 * Unbounded queries are not supported on native so as a workaround, we set per_page with the maximum value that native version can handle.
				 * Related issue: https://github.com/wordpress-mobile/gutenberg-mobile/issues/2661
				 */
				{ per_page: Platform.select( { web: -1, native: 10 } ) }
			),
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
			// This selector is only defined on mobile.
			isTitleSelected: isPostTitleSelected && isPostTitleSelected(),
		};
	}, [] );

	const { undo } = useDispatch( editorStore );

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
			__experimentalFetchRemoteUrlData: ( url ) =>
				fetchRemoteUrlData( url ),
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			__experimentalUndo: undo,
			__experimentalShouldInsertAtTheTop: isTitleSelected,
			outlineMode: hasTemplate,
		} ),
		[
			settings,
			hasUploadPermissions,
			reusableBlocks,
			canUseUnfilteredHTML,
			undo,
			isTitleSelected,
			hasTemplate,
		]
	);
}

export default useBlockEditorSettings;
