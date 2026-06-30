/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

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
import { NoteHighlightStyles } from './note-highlight-styles';
import { useGlobalStyles } from '../global-styles';
import { useEnableFloatingSidebar, useNoteThreads } from './hooks';
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

	// Only enable the floating sidebar for large viewports.
	const showFloatingSidebar = isLargeViewport;
	// Fallback to "All notes" sidebar on smaller viewports.
	const showAllNotesSidebar = notes.length > 0 || ! showFloatingSidebar;
	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( unresolvedNotes.length > 0 || selectedNoteId !== undefined )
	);

	async function focusNote( {
		targetClientId,
		noteId: targetNoteId,
		isApproved,
	} ) {
		if ( ! targetClientId ) {
			return;
		}

		const prevArea = await getActiveComplementaryArea( 'core' );
		if ( isApproved ) {
			enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
		} else if ( ! SIDEBARS.includes( prevArea ) || ! showAllNotesSidebar ) {
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

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStyles();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

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
