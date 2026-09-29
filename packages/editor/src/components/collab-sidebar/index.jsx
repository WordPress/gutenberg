import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { __experimentalUseSlot as useSlot } from '@wordpress/components';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import PluginSidebar from '../plugin-sidebar';
import { ALL_NOTES_SIDEBAR } from './constants';
import { Notes } from './notes';
import { NotesDisplayModeMenu } from './notes-display-mode-menu';
import { store as editorStore } from '../../store';
import { AddNoteMenuItem } from './add-note-menu-item';
import { NoteAvatarIndicator } from './note-indicator-toolbar';
import { NoteHighlightStyles } from './note-highlight-styles';
import { useNoteThreads } from './hooks';
import { getNoteIdsFromMetadata, pickPrimaryNote } from './utils';
import PostTypeSupportCheck from '../post-type-support-check';
import { CanvasMargin } from '../visual-editor/canvas-margin';
import { unlock } from '../../lock-unlock';

function NotesSidebar( { postId } ) {
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { toggleBlockSpotlight, selectBlock } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const sidebarRef = useRef( null );

	const { clientId, noteId, isClassicBlock } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId, getBlockName } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();
		return {
			clientId: _clientId,
			noteId: _clientId
				? getBlockAttributes( _clientId )?.metadata?.noteId
				: null,
			isClassicBlock: _clientId
				? getBlockName( _clientId ) === 'core/freeform'
				: false,
		};
	}, [] );

	const blockNoteIds = getNoteIdsFromMetadata( { noteId } );
	const { isDistractionFree, areNotesHidden } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			isDistractionFree: get( 'core', 'distractionFree' ),
			areNotesHidden: get( 'core', 'notesDisplayMode' ) === 'hidden',
		};
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );
	const selectedNoteId = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);

	const { notes, unresolvedNotes } = useNoteThreads( postId );
	const isAllNotesSidebarOpen = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea( 'core' ) ===
			ALL_NOTES_SIDEBAR,
		[]
	);
	const { ref: canvasMarginRef } = useSlot( CanvasMargin.name );

	// Fallback to "All notes" sidebar on smaller viewports or a narrow canvas.
	const showAllNotesSidebar =
		notes.length > 0 || ! isLargeViewport || isAllNotesSidebarOpen;
	const hasFloatingNotes =
		isLargeViewport &&
		( unresolvedNotes.length > 0 || selectedNoteId !== undefined );
	// "All notes" lists the same threads, so floating notes yield to it.
	const showFloatingNotes =
		hasFloatingNotes && ! areNotesHidden && ! isAllNotesSidebarOpen;

	function focusNote( { targetClientId, noteId: targetNoteId, isApproved } ) {
		if ( ! targetClientId ) {
			return;
		}

		// The margin hides on a narrow canvas and in zoom out.
		const hasCanvasMargin =
			isLargeViewport && !! canvasMarginRef?.current?.checkVisibility();
		if ( isApproved || ! hasCanvasMargin ) {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		} else if (
			areNotesHidden &&
			getActiveComplementaryArea( 'core' ) !== ALL_NOTES_SIDEBAR
		) {
			// Acting on a note brings hidden notes back.
			setPreference( 'core', 'notesDisplayMode', 'full' );
		}

		// A special case for the List View, where block selection isn't required to trigger an action.
		// The action won't do anything if the block is already selected.
		selectBlock( targetClientId, null );
		toggleBlockSpotlight( targetClientId, true );
		selectNote( targetNoteId, { focus: true } );
	}

	function openNoteForBlock( targetClientId ) {
		// A block can carry multiple threads; surface the most relevant.
		const blockThreads = notes.filter(
			( thread ) => thread.blockClientId === targetClientId
		);
		const target = pickPrimaryNote( blockThreads );
		return focusNote( {
			targetClientId,
			noteId: target?.id ?? 'new',
			isApproved: target?.status === 'approved',
		} );
	}

	function addNewNoteForBlock( targetClientId ) {
		return focusNote( {
			targetClientId,
			noteId: 'new',
			isApproved: false,
		} );
	}

	useShortcut(
		'core/editor/new-note',
		( event ) => {
			event.preventDefault();
			addNewNoteForBlock( clientId );
		},
		{
			isDisabled: isDistractionFree || isClassicBlock || ! clientId,
		}
	);

	// Surface one thread for the avatar indicator.
	const currentThreads =
		blockNoteIds.length > 0
			? notes.filter( ( thread ) => blockNoteIds.includes( thread.id ) )
			: [];
	const currentThread = pickPrimaryNote( currentThreads );

	if ( isDistractionFree ) {
		return <AddNoteMenuItem isDistractionFree />;
	}

	return (
		<>
			<NoteHighlightStyles
				threads={ unresolvedNotes }
				selectedId={ selectedNoteId }
			/>
			{ !! currentThread && (
				<NoteAvatarIndicator
					note={ currentThread }
					onClick={ () => openNoteForBlock( clientId ) }
				/>
			) }
			<AddNoteMenuItem
				onClick={ ( menuClientId ) =>
					addNewNoteForBlock( menuClientId )
				}
			/>
			<NotesDisplayModeMenu
				hasFloatingNotes={ hasFloatingNotes }
				hasAllNotes={ showAllNotesSidebar }
			/>
			{ showAllNotesSidebar && (
				// No `name`, so the sidebar doesn't add itself to the "Panels"
				// menu; the "Notes" submenu toggles it instead.
				<PluginSidebar
					identifier={ ALL_NOTES_SIDEBAR }
					title={ __( 'All notes' ) }
					header={
						<h2 className="interface-complementary-area-header__title">
							{ __( 'All notes' ) }
						</h2>
					}
					icon={ commentIcon }
					closeLabel={ __( 'Close Notes' ) }
				>
					<Notes notes={ notes } sidebarRef={ sidebarRef } />
				</PluginSidebar>
			) }
			{ showFloatingNotes && (
				<CanvasMargin.Fill>
					<div
						role="region"
						aria-label={ __( 'Notes' ) }
						className="editor-collab-sidebar-overlay"
					>
						<Notes
							notes={ unresolvedNotes }
							sidebarRef={ sidebarRef }
							isFloating
						/>
					</div>
				</CanvasMargin.Fill>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, editorMode, revisionsMode } = useSelect( ( select ) => {
		const { getCurrentPostId, getEditorMode, isRevisionsMode } = unlock(
			select( editorStore )
		);
		return {
			postId: getCurrentPostId(),
			editorMode: getEditorMode(),
			revisionsMode: isRevisionsMode(),
		};
	}, [] );

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	// Hide Notes sidebar for Code Editor and in-editor revision mode.
	if ( editorMode === 'text' || revisionsMode ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<NotesSidebar postId={ postId } />
		</PostTypeSupportCheck>
	);
}
