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
import {
	getNoteIdsFromMetadata,
	pickPrimaryNote,
	readMultiBlockSelection,
} from './utils';
import type { Thread } from './utils';
import { NOTE_FORMAT_NAME, noteFormat } from './format';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

function NotesSidebar( { postId }: { postId: number } ) {
	useEffect( () => {
		// @ts-expect-error noteFormat is an untyped JS settings object; the
		// WPFormat type requires fields the runtime treats as optional.
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
	const { selectNote, setPendingNoteSegments } = unlock(
		useDispatch( editorStore )
	);
	// Bound block-editor selectors, read imperatively in handlers (no re-render
	// on change). Passed straight to readMultiBlockSelection, which reads the
	// selection keys it needs.
	const blockEditorSelectors = useSelect( blockEditorStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const sidebarRef = useRef< HTMLElement | null >( null );

	const { clientId, noteId, isClassicBlock, hasMultiSelection } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSelectedBlockClientId,
				getBlockName,
				hasMultiSelection: _hasMultiSelection,
			} = select( blockEditorStore );
			const _clientId = getSelectedBlockClientId();
			return {
				clientId: _clientId,
				noteId: _clientId
					? getBlockAttributes( _clientId )?.metadata?.noteId
					: null,
				isClassicBlock: _clientId
					? getBlockName( _clientId ) === 'core/freeform'
					: false,
				hasMultiSelection: _hasMultiSelection(),
			};
		},
		[]
	);

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
	}: {
		targetClientId?: string | null;
		noteId?: number | 'new';
		isApproved?: boolean;
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

	function openNoteForBlock( targetClientId: string ) {
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

	function addNewNoteForBlock( targetClientId: string ) {
		return focusNote( {
			targetClientId,
			noteId: 'new',
			isApproved: false,
		} );
	}

	// Open the new-note form for the current multi-block selection. Capture the
	// per-block marker segments *first*, while the cross-block selection is still
	// live (it collapses once a single block is selected), and stash them in the
	// store for `onCreate` to consume. The already-captured segments still drive
	// marking across every block once the note is saved.
	function addNewNoteForSelection() {
		const segments = readMultiBlockSelection( blockEditorSelectors );
		const anchorClientId =
			segments?.[ 0 ]?.clientId ??
			blockEditorSelectors.getSelectedBlockClientId();
		// Stash the segments in a dedicated store field so the reactive
		// `selectNote` calls that follow (focus reset, block-transition sync)
		// can't clobber them before the save resolves.
		setPendingNoteSegments( segments );
		if ( ! anchorClientId ) {
			return;
		}
		// Collapse the cross-block selection to the anchor block first, then open
		// the form on the next frames once that selection - and the focus the
		// editor moves onto the block - has settled. Opening it in the same tick
		// lets the collapse pull focus out of the form's input; AddNote's blur
		// handler keeps the form open through that, but deferring lets the input
		// keep focus so the user can type right away.
		selectBlock( anchorClientId, null );
		const openForm = () =>
			focusNote( {
				targetClientId: anchorClientId,
				noteId: 'new',
				isApproved: false,
			} );
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( openForm )
		);
	}

	useShortcut(
		'core/editor/new-note',
		( event: KeyboardEvent ) => {
			event.preventDefault();
			// Mirror the "Add note" menu, which targets the whole selection when
			// more than one block is selected and the current block otherwise.
			if ( hasMultiSelection ) {
				addNewNoteForSelection();
			} else {
				addNewNoteForBlock( clientId );
			}
		},
		{
			isDisabled:
				isDistractionFree ||
				isClassicBlock ||
				( ! clientId && ! hasMultiSelection ),
		}
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStyles() as Record< string, any >;
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Surface one thread for the avatar indicator.
	const currentThreads: Thread[] =
		blockNoteIds.length > 0
			? notes.filter( ( thread ) =>
					blockNoteIds.includes( thread.id as number )
			  )
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
				onClickSelection={ addNewNoteForSelection }
			/>
			{ showAllNotesSidebar && (
				<PluginSidebar
					// @ts-expect-error PluginSidebar's documented props don't cover the pass-through props it forwards to ComplementaryArea.
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
					// @ts-expect-error PluginSidebar's documented props don't cover the pass-through props it forwards to ComplementaryArea.
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
