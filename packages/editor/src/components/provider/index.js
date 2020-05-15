/**
 * External dependencies
 */
import { map, pick, defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { mediaUpload } from '../../utils';
import ReusableBlocksButtons from '../reusable-blocks-buttons';
import ConvertToGroupButtons from '../convert-to-group-buttons';

/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * wordpress/editor/src/components/provider/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {Object} search
 * @param {number} perPage
 * @return {Promise<Object[]>} List of suggestions
 */
const fetchLinkSuggestions = async ( search, { perPage = 20 } = {} ) => {
	const posts = await apiFetch( {
		path: addQueryArgs( '/wp/v2/search', {
			search,
			per_page: perPage,
			type: 'post',
		} ),
	} );

	return map( posts, ( post ) => ( {
		id: post.id,
		url: post.url,
		title: decodeEntities( post.title ) || __( '(no title)' ),
		type: post.subtype || post.type,
	} ) );
};

function EditorProvider( {
	recovery,
	settings,
	post,
	initialEdits,
	children,
} ) {
	const {
		canUserUseUnfilteredHTML,
		isReady,
		blocks,
		selectionStart,
		selectionEnd,
		reusableBlocks,
		hasUploadPermissions,
		isPostTitleSelected,
	} = useSelect( ( select ) => {
		const {
			canUserUseUnfilteredHTML: _canUserUseUnfilteredHTML,
			__unstableIsEditorReady: isEditorReady,
			isPostTitleSelected: _isPostTitleSelected,
			getEditorBlocks,
			getEditorSelectionStart,
			getEditorSelectionEnd,
			__experimentalGetReusableBlocks,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );

		return {
			canUserUseUnfilteredHTML: _canUserUseUnfilteredHTML(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			selectionStart: getEditorSelectionStart(),
			selectionEnd: getEditorSelectionEnd(),
			reusableBlocks: __experimentalGetReusableBlocks(),
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
			// This selector is only defined on mobile.
			isPostTitleSelected: _isPostTitleSelected && _isPostTitleSelected(),
		};
	} );

	const {
		setupEditor,
		updatePostLock,
		resetEditorBlocks,
		updateEditorSettings,
		__experimentalFetchReusableBlocks,
		__experimentalTearDownEditor: tearDownEditor,
		undo,
	} = useDispatch( 'core/editor' );
	const { createWarningNotice } = useDispatch( 'core/notices' );

	useEffect( () => {
		// In case of recovery, state should already have been initialized.
		if ( recovery ) {
			return;
		}

		updatePostLock( settings.postLock );
		setupEditor( post, initialEdits, settings.template );

		if ( settings.autosave ) {
			createWarningNotice(
				__(
					'There is an autosave of this post that is more recent than the version below.'
				),
				{
					id: 'autosave-exists',
					actions: [
						{
							label: __( 'View the autosave' ),
							url: settings.autosave.editLink,
						},
					],
				}
			);
		}
	}, [] );

	useEffect( () => tearDownEditor, [] );

	useEffect( () => {
		updateEditorSettings( settings );
	}, [ settings ] );

	const editorSettings = useMemo(
		() => ( {
			...pick( settings, [
				'__experimentalBlockDirectory',
				'__experimentalBlockPatterns',
				'__experimentalBlockPatternCategories',
				'__experimentalDisableCustomUnits',
				'__experimentalDisableCustomLineHeight',
				'__experimentalDisableDropCap',
				'__experimentalEnableLegacyWidgetBlock',
				'__experimentalEnableFullSiteEditing',
				'__experimentalEnableFullSiteEditingDemo',
				'__experimentalGlobalStylesUserEntityId',
				'__experimentalGlobalStylesBase',
				'__experimentalPreferredStyleVariations',
				'alignWide',
				'allowedBlockTypes',
				'availableLegacyWidgets',
				'bodyPlaceholder',
				'codeEditingEnabled',
				'colors',
				'disableCustomColors',
				'disableCustomFontSizes',
				'disableCustomGradients',
				'focusMode',
				'fontSizes',
				'gradients',
				'hasFixedToolbar',
				'hasPermissionsToManageWidgets',
				'imageSizes',
				'imageDimensions',
				'isRTL',
				'maxWidth',
				'onUpdateDefaultBlockStyles',
				'styles',
				'template',
				'templateLock',
				'titlePlaceholder',
			] ),
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalFetchReusableBlocks,
			__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
			__experimentalUndo: undo,
			__experimentalShouldInsertAtTheTop: isPostTitleSelected,
		} ),
		[
			settings,
			reusableBlocks,
			__experimentalFetchReusableBlocks,
			hasUploadPermissions,
			canUserUseUnfilteredHTML,
			undo,
			isPostTitleSelected,
		]
	);

	const defaultBlockContext = useMemo(
		() => ( {
			postId: post.id,
			postType: post.type,
		} ),
		[ post.id, post.type ]
	);

	function resetEditorBlocksWithoutUndoLevel( nextBlocks, options ) {
		resetEditorBlocks( nextBlocks, {
			...options,
			__unstableShouldCreateUndoLevel: false,
		} );
	}

	if ( ! isReady ) {
		return null;
	}

	return (
		<>
			<EditorStyles styles={ settings.styles } />
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ post.type }
					id={ post.id }
				>
					<BlockContextProvider value={ defaultBlockContext }>
						<BlockEditorProvider
							value={ blocks }
							onInput={ resetEditorBlocksWithoutUndoLevel }
							onChange={ resetEditorBlocks }
							selectionStart={ selectionStart }
							selectionEnd={ selectionEnd }
							settings={ editorSettings }
							useSubRegistry={ false }
						>
							{ children }
							<ReusableBlocksButtons />
							<ConvertToGroupButtons />
						</BlockEditorProvider>
					</BlockContextProvider>
				</EntityProvider>
			</EntityProvider>
		</>
	);
}

export default withRegistryProvider( EditorProvider );
