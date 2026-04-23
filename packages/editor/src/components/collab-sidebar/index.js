/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Stack } from '@wordpress/ui';
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
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

function NotesSidebarContent( {
	styles,
	comments,
	commentSidebarRef,
	isFloating = false,
} ) {
	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<Stack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="tree"
			direction="column"
			gap="md"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					// eslint-disable-next-line react-compiler/react-compiler
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
				commentSidebarRef={ commentSidebarRef }
				isFloating={ isFloating }
			/>
		</Stack>
	);
}

function NotesSidebar( { postId } ) {
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { toggleBlockSpotlight, selectBlock } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const { clientId, blockCommentId, isClassicBlock } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSelectedBlockClientId,
				getBlockName,
			} = select( blockEditorStore );
			const _clientId = getSelectedBlockClientId();
			return {
				clientId: _clientId,
				blockCommentId: _clientId
					? getBlockAttributes( _clientId )?.metadata?.noteId
					: null,
				isClassicBlock: _clientId
					? getBlockName( _clientId ) === 'core/freeform'
					: false,
			};
		},
		[]
	);
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

	const { notes, unresolvedNotes } = useBlockComments( postId );

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
			// When multiple notes per block are supported. Remove note ID check.
			// See: https://github.com/WordPress/gutenberg/pull/75147.
			isDisabled:
				isDistractionFree ||
				isClassicBlock ||
				! clientId ||
				!! blockCommentId,
		}
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? notes.find( ( thread ) => thread.id === blockCommentId )
		: null;

	async function openTheSidebar( selectedClientId ) {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );
		const targetClientId =
			selectedClientId && selectedClientId !== clientId
				? selectedClientId
				: clientId;
		const targetNote = notes.find(
			( note ) => note.blockClientId === targetClientId
		);

		if ( targetNote?.status === 'approved' ) {
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

		// A special case for the List View, where block selection isn't required to trigger an action.
		// The action won't do anything if the block is already selected.
		selectBlock( targetClientId, null );
		toggleBlockSpotlight( targetClientId, true );
		selectNote( targetNote ? targetNote.id : 'new', { focus: true } );
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
					<NotesSidebarContent
						comments={ notes }
						commentSidebarRef={ commentSidebarRef }
					/>
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
					<NotesSidebarContent
						comments={ unresolvedNotes }
						commentSidebarRef={ commentSidebarRef }
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
