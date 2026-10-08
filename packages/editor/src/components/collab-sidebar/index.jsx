import clsx from 'clsx';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
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
import {
	NoteDraftsContext,
	useNoteActions,
	useNoteSelection,
	useNoteThreads,
	usePickNote,
	useUnseenNotes,
} from './hooks';
import { getNoteIdsFromMetadata, pickPrimaryNote } from './utils';
import PostTypeSupportCheck from '../post-type-support-check';
import { CanvasMargin } from '../visual-editor/canvas-margin';
import { unlock } from '../../lock-unlock';

function NotesSidebar( { postId, drafts } ) {
	const sidebarRef = useRef( null );
	const isLargeViewport = useViewportMatch( 'medium' );
	const { ref: canvasMarginRef } = useSlot( CanvasMargin.name );

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
	const { notesDisplayMode, selectedNoteId, isAllNotesSidebarOpen } =
		useSelect( ( select ) => {
			const { get } = select( preferencesStore );
			return {
				notesDisplayMode: get( 'core', 'notesDisplayMode' ),
				selectedNoteId: unlock(
					select( editorStore )
				).getSelectedNote(),
				isAllNotesSidebarOpen:
					select( interfaceStore ).getActiveComplementaryArea(
						'core'
					) === ALL_NOTES_SIDEBAR,
			};
		}, [] );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { notes, unresolvedNotes } = useNoteThreads( postId );
	const unseenNoteCount = useUnseenNotes( { postId, notes } );
	const { onStart, onDiscard } = useNoteActions();
	// Here rather than in `Notes`, which unmounts with its surface: a draft
	// must be restored on block selection even while no note is shown.
	// Floating notes don't list resolved threads, so don't select one there.
	useNoteSelection( {
		notes: isAllNotesSidebarOpen ? notes : unresolvedNotes,
		drafts,
		onDiscard,
	} );

	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const pickNote = usePickNote( { drafts, onDiscard } );

	const blockNoteIds = getNoteIdsFromMetadata( { noteId } );
	const areNotesHidden = notesDisplayMode === 'hidden';
	// Fallback to "All notes" sidebar on smaller viewports or a narrow canvas.
	const showAllNotesSidebar =
		notes.length > 0 || ! isLargeViewport || isAllNotesSidebarOpen;
	const selectedThread = notes.find(
		( thread ) => thread.id === selectedNoteId
	);
	// A just-saved note isn't listed yet, so it still floats.
	const canSelectedNoteFloat =
		selectedNoteId !== undefined && selectedThread?.status !== 'approved';
	const hasFloatingNotes =
		isLargeViewport &&
		( unresolvedNotes.length > 0 || canSelectedNoteFloat );
	// "All notes" lists the same threads, so floating notes yield to it.
	const showFloatingNotes =
		hasFloatingNotes && ! areNotesHidden && ! isAllNotesSidebarOpen;

	function focusNote( { targetClientId, noteId: targetNoteId, isApproved } ) {
		if ( ! targetClientId ) {
			return;
		}

		// The margin hides on a narrow, resizable or zoomed-out canvas.
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

		if ( targetNoteId === 'new' ) {
			onStart( targetClientId );
		}

		// A special case for the List View, where block selection isn't required to trigger an action.
		// The action won't do anything if the block is already selected.
		pickNote( targetNoteId, targetClientId, { focus: true } );
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
			isDisabled: isClassicBlock || ! clientId,
		}
	);

	// Surface one thread for the avatar indicator.
	const currentThreads =
		blockNoteIds.length > 0
			? notes.filter( ( thread ) => blockNoteIds.includes( thread.id ) )
			: [];
	const currentThread = pickPrimaryNote( currentThreads );

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
					badge={ unseenNoteCount }
					badgeLabel={
						unseenNoteCount > 0
							? sprintf(
									/* translators: %d: Number of note threads with activity the user has not seen. */
									_n(
										'All notes, %d unseen',
										'All notes, %d unseen',
										unseenNoteCount
									),
									unseenNoteCount
								)
							: undefined
					}
					closeLabel={ __( 'Close Notes' ) }
				>
					<NoteDraftsContext.Provider value={ drafts }>
						<Notes notes={ notes } sidebarRef={ sidebarRef } />
					</NoteDraftsContext.Provider>
				</PluginSidebar>
			) }
			{ showFloatingNotes && (
				<CanvasMargin.Fill>
					<div
						role="region"
						aria-label={ __( 'Notes' ) }
						className={ clsx( 'editor-collab-sidebar-overlay', {
							'is-minimized': notesDisplayMode === 'minimized',
						} ) }
					>
						<NoteDraftsContext.Provider value={ drafts }>
							<Notes
								notes={ unresolvedNotes }
								sidebarRef={ sidebarRef }
								isFloating
							/>
						</NoteDraftsContext.Provider>
					</div>
				</CanvasMargin.Fill>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const [ drafts ] = useState( () => new Map() );
	const { postId, editorMode, revisionsMode, isDistractionFree } = useSelect(
		( select ) => {
			const { getCurrentPostId, getEditorMode, isRevisionsMode } = unlock(
				select( editorStore )
			);
			return {
				postId: getCurrentPostId(),
				editorMode: getEditorMode(),
				revisionsMode: isRevisionsMode(),
				isDistractionFree: select( preferencesStore ).get(
					'core',
					'distractionFree'
				),
			};
		},
		[]
	);

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	// Hide Notes sidebar for Code Editor and in-editor revision mode.
	if ( editorMode === 'text' || revisionsMode ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			{ isDistractionFree ? (
				<AddNoteMenuItem isDistractionFree />
			) : (
				<NotesSidebar postId={ postId } drafts={ drafts } />
			) }
		</PostTypeSupportCheck>
	);
}
