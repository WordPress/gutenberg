/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { useRestoreBlockFromPath } from '../../utils/block-selection-path';
import EditorInterface from '../editor-interface';
import { ExperimentalEditorProvider } from '../provider';
import Sidebar from '../sidebar';
import NotesSidebar from '../collab-sidebar';
import GlobalStylesSidebar from '../global-styles-sidebar';
import { GlobalStylesRenderer } from '../global-styles-renderer';

function Editor( {
	postType,
	postId,
	templateId,
	settings,
	children,
	initialEdits,
	initialSelection,

	// This could be part of the settings.
	onActionPerformed,

	// The following abstractions are not ideal but necessary
	// to account for site editor and post editor differences for now.
	extraContent,
	extraSidebarPanels,
	...props
} ) {
	const {
		post,
		template,
		hasLoadedPost,
		error,
		isBlockTheme,
		showGlobalStyles,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getResolutionError,
				hasFinishedResolution,
				getCurrentTheme,
				__experimentalGetCurrentGlobalStylesId,
				canUser,
			} = select( coreStore );
			const { getRenderingMode, getCurrentPostType } =
				select( editorStore );

			const postArgs = [ 'postType', postType, postId ];
			const renderingMode = getRenderingMode();
			const currentPostType = getCurrentPostType();
			const _isBlockTheme = getCurrentTheme()?.is_block_theme;
			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const userCanEditGlobalStyles = globalStylesId
				? canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: globalStylesId,
				  } )
				: false;

			return {
				post: getEntityRecord( ...postArgs ),
				template: templateId
					? getEntityRecord(
							'postType',
							TEMPLATE_POST_TYPE,
							templateId
					  )
					: undefined,
				hasLoadedPost: hasFinishedResolution(
					'getEntityRecord',
					postArgs
				),
				error: getResolutionError( 'getEntityRecord', postArgs )
					?.message,
				isBlockTheme: _isBlockTheme,
				showGlobalStyles:
					_isBlockTheme &&
					userCanEditGlobalStyles &&
					( currentPostType === 'wp_template' ||
						renderingMode === 'template-locked' ),
			};
		},
		[ postType, postId, templateId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );
	const restoreBlockFromPath = useRestoreBlockFromPath();

	// Track if we've already restored to prevent continuous subscription
	const hasRestoredRef = useRef( false );

	// Reset when initialSelection changes (new navigation)
	useEffect( () => {
		hasRestoredRef.current = false;
	}, [ initialSelection ] );

	// Check if the first step of the path is available (indicates blocks are loaded)
	const canRestorePath = useSelect(
		( select ) => {
			// Don't create a subscription if we don't have an initialSelection value
			if (
				hasRestoredRef.current ||
				! initialSelection ||
				! Array.isArray( initialSelection ) ||
				initialSelection.length === 0 ||
				! hasLoadedPost
			) {
				return false;
			}

			const { getBlockOrder } = select( blockEditorStore );
			const rootBlocks = getBlockOrder( '' );
			const firstStep = initialSelection[ 0 ];

			// Check if the first block in the path exists
			return firstStep.index < rootBlocks.length;
		},
		[ initialSelection, hasLoadedPost ]
	);

	// Restore initial block selection once the path can be resolved
	useEffect( () => {
		if ( ! canRestorePath ) {
			return;
		}

		const clientId = restoreBlockFromPath( initialSelection );
		if ( clientId ) {
			selectBlock( clientId );
			hasRestoredRef.current = true;
		}
	}, [
		canRestorePath,
		initialSelection,
		restoreBlockFromPath,
		selectBlock,
	] );

	return (
		<>
			{ hasLoadedPost && ! post && (
				<Notice
					status={ !! error ? 'error' : 'warning' }
					isDismissible={ false }
				>
					{ ! error
						? __(
								"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
						  )
						: error }
				</Notice>
			) }
			{ !! post && (
				<ExperimentalEditorProvider
					post={ post }
					__unstableTemplate={ template }
					settings={ settings }
					initialEdits={ initialEdits }
					useSubRegistry={ false }
				>
					<EditorInterface { ...props }>
						{ extraContent }
					</EditorInterface>
					{ children }
					<Sidebar
						onActionPerformed={ onActionPerformed }
						extraPanels={ extraSidebarPanels }
					/>
					<NotesSidebar />
					{ isBlockTheme && <GlobalStylesRenderer /> }
					{ showGlobalStyles && <GlobalStylesSidebar /> }
				</ExperimentalEditorProvider>
			) }
		</>
	);
}

export default Editor;
