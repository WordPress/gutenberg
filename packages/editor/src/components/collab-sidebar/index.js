/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import {
	ALL_NOTES_SIDEBAR,
	FLOATING_NOTES_SIDEBAR,
	SIDEBARS,
} from './constants';
import { Notes } from './notes';
import { store as editorStore } from '../../store';
import { AddNoteMenuItem } from './add-note-menu-item';
import { NoteAvatarIndicator } from './note-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import { useNoteThreads, useEnableFloatingSidebar } from './hooks';
import { focusNoteThread, getNoteIdsFromMetadata } from './utils';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

function NotesSidebar( { postId } ) {
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const sidebarRef = useRef( null );

	const { clientId, rawNoteId, isClassicBlock } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId, getBlockName } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();
		return {
			clientId: _clientId,
			rawNoteId: _clientId
				? getBlockAttributes( _clientId )?.metadata?.noteId ?? null
				: null,
			isClassicBlock: _clientId
				? getBlockName( _clientId ) === 'core/freeform'
				: false,
		};
	}, [] );

	const blockNoteIds = getNoteIdsFromMetadata( { noteId: rawNoteId } );
	const { isDistractionFree } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			isDistractionFree: get( 'core', 'distractionFree' ),
		};
	}, [] );
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);

	const { notes, unresolvedNotes } = useNoteThreads( postId );

	// Only enable the floating sidebar for large viewports.
	const showFloatingSidebar = isLargeViewport;
	// Fallback to "All notes" sidebar on smaller viewports.
	const showAllNotesSidebar = notes.length > 0 || ! showFloatingSidebar;
	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( unresolvedNotes.length > 0 || selectedNote !== undefined )
	);

	useShortcut(
		'core/editor/new-note',
		( event ) => {
			event.preventDefault();
			openTheSidebar();
		},
		{
			isDisabled: isDistractionFree || isClassicBlock || ! clientId,
		}
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find threads for the selected block. Blocks can carry multiple note IDs,
	// so gather all matching threads and surface the most relevant one
	// (first unresolved, else first) for UI interactions like avatars.
	const currentThreads =
		blockNoteIds.length > 0
			? notes.filter( ( thread ) => blockNoteIds.includes( thread.id ) )
			: [];
	const currentThread =
		currentThreads.find( ( thread ) => thread.status === 'hold' ) ??
		currentThreads[ 0 ] ??
		null;

	async function openTheSidebar( { addNewNote = false } = {} ) {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );

		if ( currentThread?.status === 'approved' && ! addNewNote ) {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		} else if ( ! activeNotesArea || ! showAllNotesSidebar ) {
			enableComplementaryArea(
				'core',
				showFloatingSidebar ? FLOATING_NOTES_SIDEBAR : ALL_NOTES_SIDEBAR
			);
		}

		const currentArea = await getActiveComplementaryArea( 'core' );
		// Bail out if the current active area is not one of note sidebars.
		if ( ! SIDEBARS.includes( currentArea ) ) {
			return;
		}

		// When addNewNote is true, always open the new note form.
		// Otherwise, select the existing thread or open new.
		const shouldAddNew = addNewNote || ! currentThread;
		selectNote( shouldAddNew ? 'new' : currentThread.id );
		focusNoteThread(
			shouldAddNew ? undefined : currentThread?.id,
			sidebarRef.current,
			shouldAddNew ? 'textarea' : undefined
		);
		toggleBlockSpotlight( clientId, true );
	}

	if ( isDistractionFree ) {
		return <AddNoteMenuItem isDistractionFree />;
	}

	return (
		<>
			{ !! currentThread && (
				<NoteAvatarIndicator
					note={ currentThread }
					onClick={ openTheSidebar }
				/>
			) }
			<AddNoteMenuItem
				onClick={ () => openTheSidebar( { addNewNote: true } ) }
			/>
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
			{ isLargeViewport && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ FLOATING_NOTES_SIDEBAR }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<Notes
						notes={ unresolvedNotes }
						sidebarRef={ sidebarRef }
						styles={ { backgroundColor } }
						isFloating
					/>
				</PluginSidebar>
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
