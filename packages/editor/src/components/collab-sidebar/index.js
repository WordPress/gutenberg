/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import {
	collabHistorySidebarName,
	collabSidebarName,
	SIDEBARS,
} from './constants';
import { Comments } from './comments';
import { store as editorStore } from '../../store';
import AddCommentMenuItem from './comment-menu-item';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import {
	useBlockComments,
	useBlockCommentsActions,
	useEnableFloatingSidebar,
} from './hooks';
import { focusCommentThread } from './utils';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

function NotesSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
	commentSidebarRef,
	reflowComments,
	commentLastUpdated,
	isFloating = false,
} ) {
	const { onCreate, onEdit, onDelete } =
		useBlockCommentsActions( reflowComments );

	return (
		<VStack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="list"
			spacing="3"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					commentSidebarRef.current = node;
				}
			} }
		>
			<Comments
				threads={ comments }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
				commentSidebarRef={ commentSidebarRef }
				reflowComments={ reflowComments }
				commentLastUpdated={ commentLastUpdated }
				isFloating={ isFloating }
			/>
		</VStack>
	);
}

function NotesSidebar( { postId, mode } ) {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const [ pendingFocus, setPendingFocus ] = useState( null );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const showFloatingSidebar = isLargeViewport && mode === 'post-only';

	const { clientId, blockCommentId, activeComplementaryArea } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSelectedBlockClientId } =
				select( blockEditorStore );
			const { getActiveComplementaryArea } = select( interfaceStore );
			const _clientId = getSelectedBlockClientId();
			return {
				clientId: _clientId,
				blockCommentId: _clientId
					? getBlockAttributes( _clientId )?.metadata?.noteId
					: null,
				activeComplementaryArea: getActiveComplementaryArea( 'core' ),
			};
		},
		[]
	);

	const {
		resultComments,
		unresolvedSortedThreads,
		reflowComments,
		commentLastUpdated,
	} = useBlockComments( postId );
	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( unresolvedSortedThreads.length > 0 || showCommentBoard )
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	// Handle pending focus actions after sidebar opens
	useEffect( () => {
		if ( pendingFocus && SIDEBARS.includes( activeComplementaryArea ) ) {
			setShowCommentBoard( ! blockCommentId );
			focusCommentThread(
				blockCommentId,
				commentSidebarRef.current,
				! blockCommentId ? 'textarea' : undefined
			);
			if ( clientId ) {
				toggleBlockSpotlight( clientId, true );
			}
			setPendingFocus( null );
		}
	}, [
		pendingFocus,
		activeComplementaryArea,
		blockCommentId,
		clientId,
		toggleBlockSpotlight,
	] );

	const openTheSidebar = useCallback( () => {
		const activeNotesArea = SIDEBARS.find(
			( name ) => name === activeComplementaryArea
		);

		if ( currentThread?.status === 'approved' ) {
			enableComplementaryArea( 'core', collabHistorySidebarName );
		} else if ( ! activeNotesArea ) {
			enableComplementaryArea(
				'core',
				showFloatingSidebar
					? collabSidebarName
					: collabHistorySidebarName
			);
		}

		const currentArea = activeComplementaryArea;
		if ( ! SIDEBARS.includes( currentArea ) && ! activeNotesArea ) {
			return;
		}

		setPendingFocus( true );
	}, [
		activeComplementaryArea,
		currentThread,
		enableComplementaryArea,
		showFloatingSidebar,
	] );

	const toggleNotesSidebar = useCallback( () => {
		const isNotesSidebarOpen =
			activeComplementaryArea === collabHistorySidebarName;

		if ( isNotesSidebarOpen ) {
			disableComplementaryArea( 'core' );
			if ( clientId ) {
				toggleBlockSpotlight( clientId, false );
			}
		} else {
			enableComplementaryArea( 'core', collabHistorySidebarName );
		}
	}, [
		activeComplementaryArea,
		clientId,
		disableComplementaryArea,
		enableComplementaryArea,
		toggleBlockSpotlight,
	] );

	const addNoteToBlock = useCallback( () => {
		if ( ! clientId ) {
			return;
		}

		const isNotesSidebarOpen = SIDEBARS.includes(
			activeComplementaryArea
		);

		if ( ! isNotesSidebarOpen ) {
			const sidebarToOpen = showFloatingSidebar
				? collabSidebarName
				: collabHistorySidebarName;
			enableComplementaryArea( 'core', sidebarToOpen );
			setPendingFocus( true );
		} else {
			setShowCommentBoard( ! blockCommentId );
			focusCommentThread(
				blockCommentId,
				commentSidebarRef.current,
				! blockCommentId ? 'textarea' : undefined
			);
			toggleBlockSpotlight( clientId, true );
		}
	}, [
		activeComplementaryArea,
		blockCommentId,
		clientId,
		enableComplementaryArea,
		showFloatingSidebar,
		toggleBlockSpotlight,
	] );

	useShortcut(
		'core/editor/add-note',
		( event ) => {
			event.preventDefault();
			addNoteToBlock();
		},
		{
			bindGlobal: true,
		}
	);

	useShortcut(
		'core/editor/toggle-notes-sidebar',
		( event ) => {
			event.preventDefault();
			toggleNotesSidebar();
		},
		{
			bindGlobal: true,
		}
	);

	return (
		<>
			{ blockCommentId && (
				<CommentAvatarIndicator
					thread={ currentThread }
					onClick={ openTheSidebar }
				/>
			) }
			<AddCommentMenuItem onClick={ openTheSidebar } />
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				name={ collabHistorySidebarName }
				title={ __( 'All notes' ) }
				header={
					<h2 className="interface-complementary-area-header__title">
						{ __( 'All notes' ) }
					</h2>
				}
				icon={ commentIcon }
				closeLabel={ __( 'Close Notes' ) }
			>
				<NotesSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
					reflowComments={ reflowComments }
					commentLastUpdated={ commentLastUpdated }
				/>
			</PluginSidebar>
			{ isLargeViewport && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ collabSidebarName }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<NotesSidebarContent
						comments={ unresolvedSortedThreads }
						showCommentBoard={ showCommentBoard }
						setShowCommentBoard={ setShowCommentBoard }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						styles={ {
							backgroundColor,
						} }
						isFloating
					/>
				</PluginSidebar>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, mode, editorMode } = useSelect( ( select ) => {
		const { getCurrentPostId, getRenderingMode, getEditorMode } =
			select( editorStore );
		return {
			postId: getCurrentPostId(),
			mode: getRenderingMode(),
			editorMode: getEditorMode(),
		};
	}, [] );

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	// Hide Notes sidebar in Code Editor mode since block-level commenting.
	if ( editorMode === 'text' ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<NotesSidebar postId={ postId } mode={ mode } />
		</PostTypeSupportCheck>
	);
}