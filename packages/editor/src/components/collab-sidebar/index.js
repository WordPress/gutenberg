/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

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
	openNoteForm,
	closeNoteForm,
	isNoteFormOpen,
	styles,
	comments,
	commentSidebarRef,
	reflowComments,
	commentLastUpdated,
	isFloating = false,
	setDraftNote,
	getDraftNote,
	clearDraftNote,
} ) {
	const { onCreate, onEdit, onDelete } =
		useBlockCommentsActions( reflowComments );

	return (
		<VStack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="tree"
			spacing="3"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					commentSidebarRef.current = node;
				}
			} }
			aria-label={
				isFloating ? __( 'Unresolved notes' ) : __( 'All notes' )
			}
		>
			<Comments
				threads={ comments }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				openNoteForm={ openNoteForm }
				closeNoteForm={ closeNoteForm }
				isNoteFormOpen={ isNoteFormOpen }
				commentSidebarRef={ commentSidebarRef }
				reflowComments={ reflowComments }
				commentLastUpdated={ commentLastUpdated }
				isFloating={ isFloating }
				setDraftNote={ setDraftNote }
				getDraftNote={ getDraftNote }
				clearDraftNote={ clearDraftNote }
			/>
		</VStack>
	);
}

function NotesSidebar( { postId } ) {
	// Track which blocks have open note forms (using Set for efficient lookup)
	const [ openNoteFormsSet, setOpenNoteFormsSet ] = useState( new Set() );
	// Track draft notes per block clientId (for new notes) and per thread id (for replies)
	const [ draftNotes, setDraftNotes ] = useState( {} );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const showFloatingSidebar = isLargeViewport;

	// Helper functions to manage open note forms
	const openNoteForm = ( blockClientId ) => {
		setOpenNoteFormsSet( ( prev ) => new Set( prev ).add( blockClientId ) );
	};

	const closeNoteForm = ( blockClientId ) => {
		setOpenNoteFormsSet( ( prev ) => {
			const next = new Set( prev );
			next.delete( blockClientId );
			return next;
		} );
	};

	const isNoteFormOpen = ( blockClientId ) =>
		openNoteFormsSet.has( blockClientId );

	// Helper functions to manage draft notes
	const setDraftNote = ( key, content ) => {
		setDraftNotes( ( prev ) => ( {
			...prev,
			[ key ]: content,
		} ) );
	};

	const getDraftNote = ( key ) => draftNotes[ key ] || '';

	const clearDraftNote = ( key ) => {
		setDraftNotes( ( prev ) => {
			const { [ key ]: _, ...rest } = prev;
			return rest;
		} );
	};

	const { clientId, blockCommentId, isDistractionFree } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSelectedBlockClientId,
				getSettings,
			} = select( blockEditorStore );
			const _clientId = getSelectedBlockClientId();
			return {
				clientId: _clientId,
				blockCommentId: _clientId
					? getBlockAttributes( _clientId )?.metadata?.noteId
					: null,
				isDistractionFree: getSettings().isDistractionFree,
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
			( unresolvedSortedThreads.length > 0 || openNoteFormsSet.size > 0 )
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;
	const showAllNotesSidebar = resultComments.length > 0;

	async function openTheSidebar() {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );

		if ( currentThread?.status === 'approved' ) {
			enableComplementaryArea( 'core', collabHistorySidebarName );
		} else if ( ! activeNotesArea || ! showAllNotesSidebar ) {
			enableComplementaryArea(
				'core',
				showFloatingSidebar
					? collabSidebarName
					: collabHistorySidebarName
			);
		}

		const currentArea = await getActiveComplementaryArea( 'core' );
		// Bail out if the current active area is not one of note sidebars.
		if ( ! SIDEBARS.includes( currentArea ) ) {
			return;
		}

		if ( ! currentThread && clientId ) {
			openNoteForm( clientId );
		}
		focusCommentThread(
			currentThread?.id,
			commentSidebarRef.current,
			// Focus a comment thread when there's a selected block with a comment.
			! currentThread ? 'textarea' : undefined
		);
		toggleBlockSpotlight( clientId, true );
	}

	if ( isDistractionFree ) {
		return <AddCommentMenuItem isDistractionFree />;
	}

	return (
		<>
			{ !! currentThread && (
				<CommentAvatarIndicator
					thread={ currentThread }
					onClick={ openTheSidebar }
				/>
			) }
			<AddCommentMenuItem onClick={ openTheSidebar } />
			{ showAllNotesSidebar && (
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
						openNoteForm={ openNoteForm }
						closeNoteForm={ closeNoteForm }
						isNoteFormOpen={ isNoteFormOpen }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						setDraftNote={ setDraftNote }
						getDraftNote={ getDraftNote }
						clearDraftNote={ clearDraftNote }
					/>
				</PluginSidebar>
			) }
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
						openNoteForm={ openNoteForm }
						closeNoteForm={ closeNoteForm }
						isNoteFormOpen={ isNoteFormOpen }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						styles={ {
							backgroundColor,
						} }
						isFloating
						setDraftNote={ setDraftNote }
						getDraftNote={ getDraftNote }
						clearDraftNote={ clearDraftNote }
					/>
				</PluginSidebar>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, editorMode } = useSelect( ( select ) => {
		const { getCurrentPostId, getEditorMode } = select( editorStore );
		return {
			postId: getCurrentPostId(),
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
			<NotesSidebar postId={ postId } />
		</PostTypeSupportCheck>
	);
}
