/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore, PinnedItems } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { ALL_NOTES_SIDEBAR } from './constants';
import { Notes } from './notes';
import { FloatingNotes, FloatingNotesFill } from './floating-notes';
import { store as editorStore } from '../../store';
import { AddNoteMenuItem } from './add-note-menu-item';
import { NoteAvatarIndicator } from './note-indicator-toolbar';
import { NoteHighlightStyles } from './note-highlight-styles';
import { useNoteThreads } from './hooks';
import { getNoteIdsFromMetadata, pickPrimaryNote } from './utils';
import { NOTE_FORMAT_NAME, noteFormat } from './format';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

function NotesSidebar( { postId } ) {
	useEffect( () => {
		registerFormatType( NOTE_FORMAT_NAME, noteFormat );
		return () => {
			unregisterFormatType( NOTE_FORMAT_NAME );
		};
	}, [] );

	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { toggleBlockSpotlight, selectBlock } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const sidebarRef = useRef( null );
	// How the floating notes render in the canvas: 'full', 'minimized'
	// (author avatars only), or 'hidden'.
	const [ notesDisplayMode, setNotesDisplayMode ] = useState( 'full' );

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
	const { isDistractionFree } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			isDistractionFree: get( 'core', 'distractionFree' ),
		};
	}, [] );
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

	// Only show the floating notes for large viewports.
	const showFloatingNotes = isLargeViewport;
	// Fallback to "All notes" sidebar on smaller viewports.
	const showAllNotesSidebar = notes.length > 0 || ! showFloatingNotes;
	// The floating notes are part of the canvas surface: they don't occupy
	// a sidebar and can coexist with the Settings sidebar. They yield to
	// the "All notes" sidebar, which lists the same threads.
	const hasVisibleFloatingNotes =
		showFloatingNotes &&
		notesDisplayMode !== 'hidden' &&
		( unresolvedNotes.length > 0 || selectedNoteId !== undefined ) &&
		! isAllNotesSidebarOpen;

	async function focusNote( {
		targetClientId,
		noteId: targetNoteId,
		isApproved,
	} ) {
		if ( ! targetClientId ) {
			return;
		}

		// Acting on a note always brings the floating notes back into view.
		if ( notesDisplayMode === 'hidden' ) {
			setNotesDisplayMode( 'full' );
		}

		// Approved (resolved) notes only appear in the "All notes" sidebar.
		// On small viewports it is also the only notes surface; on large
		// viewports the floating notes show automatically once a note is
		// selected, so no sidebar needs to be opened.
		if ( isApproved || ! showFloatingNotes ) {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		}

		const currentArea = await getActiveComplementaryArea( 'core' );
		// Bail out when no notes surface will be visible.
		if ( currentArea !== ALL_NOTES_SIDEBAR && ! showFloatingNotes ) {
			return;
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
			{ showFloatingNotes && unresolvedNotes.length > 0 && (
				<PinnedItems scope="core">
					<DropdownMenu
						icon={ commentIcon }
						label={ __( 'Notes' ) }
						menuProps={ {
							'aria-label': __( 'Notes display options' ),
						} }
						toggleProps={ {
							size: 'compact',
						} }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItemsChoice
									choices={ [
										{
											value: 'full',
											label: __( 'Full notes' ),
										},
										{
											value: 'minimized',
											label: __( 'Minimized notes' ),
										},
										{
											value: 'hidden',
											label: __( 'Hidden notes' ),
										},
									] }
									value={ notesDisplayMode }
									onSelect={ ( value ) => {
										setNotesDisplayMode( value );
										onClose();
									} }
								/>
							</MenuGroup>
						) }
					</DropdownMenu>
				</PinnedItems>
			) }
			{ showAllNotesSidebar && (
				<PluginSidebar
					identifier={ ALL_NOTES_SIDEBAR }
					name={ ALL_NOTES_SIDEBAR }
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
			{ hasVisibleFloatingNotes && (
				<FloatingNotesFill>
					<FloatingNotes
						notes={ unresolvedNotes }
						sidebarRef={ sidebarRef }
						isCompact={ notesDisplayMode === 'minimized' }
					/>
				</FloatingNotesFill>
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
