/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
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
			} = select( coreStore );
			const { getRenderingMode, getCurrentPostType } =
				select( editorStore );

			const postArgs = [ 'postType', postType, postId ];
			const renderingMode = getRenderingMode();
			const currentPostType = getCurrentPostType();
			const _isBlockTheme = getCurrentTheme()?.is_block_theme;

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
					( currentPostType === 'wp_template' ||
						renderingMode === 'template-locked' ),
			};
		},
		[ postType, postId, templateId ]
	);

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
					<NotesSidebar />
					<Sidebar
						onActionPerformed={ onActionPerformed }
						extraPanels={ extraSidebarPanels }
					/>
					{ isBlockTheme && <GlobalStylesRenderer /> }
					{ showGlobalStyles && <GlobalStylesSidebar /> }
				</ExperimentalEditorProvider>
			) }
		</>
	);
}

export default Editor;
