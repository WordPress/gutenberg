import type { CSSProperties, KeyboardEvent, MutableRefObject } from 'react';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Stack, Text } from '@wordpress/ui';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import { NoteThread } from './note-thread';
import { focusNoteThread, selectNoteBlocks } from './utils';
import type { Thread } from './utils';
import { useFloatingBoard, useNoteActions, useNoteSelection } from './hooks';
import { AddNote } from './add-note';
import { store as editorStore } from '../../store';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function Notes( {
	notes,
	sidebarRef,
	isFloating = false,
	styles,
}: {
	notes: Thread[];
	sidebarRef: MutableRefObject< HTMLElement | null >;
	isFloating?: boolean;
	styles?: CSSProperties;
} ) {
	const {
		onCreate: onAddReply,
		onEdit: onEditNote,
		onDelete,
	} = useNoteActions();
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { selectBlock, multiSelect, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	// Bound selectors, read imperatively by `selectNoteBlocks` to tell an
	// unbroken span from one with a gap. Passing the store descriptor doesn't
	// subscribe this component to store changes.
	const { getBlockRootClientId, getBlockOrder } =
		useSelect( blockEditorStore );

	const { selectedBlockClientId, orderedBlockIds } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getMultiSelectedBlockClientIds,
				getClientIdsWithDescendants,
			} = select( blockEditorStore );
			/*
			 * Selecting a note that spans several blocks multi-selects them,
			 * and `getSelectedBlockClientId` returns null for a multi-selection.
			 * Fall back to the first block of the range, the note's anchor, so
			 * the note stays in context instead of being deselected.
			 */
			const clientId =
				getSelectedBlockClientId() ??
				getMultiSelectedBlockClientIds()[ 0 ] ??
				null;
			return {
				selectedBlockClientId: clientId,
				orderedBlockIds: getClientIdsWithDescendants(),
			};
		},
		[]
	);
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);

	useNoteSelection( { notes, sidebarRef } );

	const relatedBlockElement = useBlockElement( selectedBlockClientId );

	const threads = useMemo( () => {
		// In floating mode with a pending new note, splice a placeholder
		// entry at the selected block's position so the board can float it
		// alongside regular threads.
		if ( ! isFloating || selectedNote !== 'new' ) {
			return notes;
		}
		const newNoteThread: Thread = {
			id: 'new',
			blockClientId: selectedBlockClientId,
			content: { rendered: '' },
		};
		const out: Thread[] = [];
		orderedBlockIds.forEach( ( blockId: string ) => {
			// Blocks can carry multiple notes — surface them all.
			const threadsForBlock = notes.filter(
				( t ) => t.blockClientId === blockId
			);
			out.push( ...threadsForBlock );
			if ( blockId === selectedBlockClientId ) {
				// Place the new note placeholder after the block's existing
				// threads so the form appears alongside them.
				out.push( newNoteThread );
			}
		} );
		return out;
	}, [
		notes,
		isFloating,
		selectedNote,
		selectedBlockClientId,
		orderedBlockIds,
	] );

	const handleDelete = async ( note: Thread ) => {
		const currentIndex = threads.findIndex( ( t ) => t.id === note.id );
		const nextThread = threads[ currentIndex + 1 ];
		const prevThread = threads[ currentIndex - 1 ];

		const deleted = await onDelete( note );
		// Leave the selection alone when the delete failed; the note is still there.
		if ( ! deleted ) {
			return;
		}

		if ( note.parent !== 0 ) {
			// Move focus to the parent thread when a reply was deleted.
			selectNote( note.parent );
			focusNoteThread( note.parent, sidebarRef.current );
			return;
		}

		const adjacentThread = nextThread ?? prevThread;
		if ( adjacentThread ) {
			selectNote( adjacentThread.id );
			focusNoteThread( adjacentThread.id, sidebarRef.current );
			if ( adjacentThread.blockClientId ) {
				toggleBlockSpotlight( adjacentThread.blockClientId, true );
				selectNoteBlocks( adjacentThread, {
					selectBlock,
					multiSelect,
					getBlockRootClientId,
					getBlockOrder,
				} );
			}
		} else {
			selectNote( undefined );
			toggleBlockSpotlight( note.blockClientId, false );
			// Move focus to the related block.
			relatedBlockElement?.focus();
		}
	};

	const { notePositions, registerThread, unregisterThread } =
		useFloatingBoard( {
			threads,
			selectedNoteId: selectedNote,
			isFloating,
			sidebarRef,
		} );

	const hasThreads = Array.isArray( threads ) && threads.length > 0;

	const navigate = (
		event: KeyboardEvent< HTMLElement >,
		thread: Thread,
		isSelected: boolean
	) => {
		if ( event.defaultPrevented ) {
			return;
		}

		const currentIndex = threads.findIndex( ( t ) => t.id === thread.id );
		const isSelfTarget = event.currentTarget === event.target;

		if (
			( event.key === 'Enter' || event.key === 'ArrowRight' ) &&
			isSelfTarget &&
			! isSelected
		) {
			// Expand thread.
			selectNote( thread.id );
			if ( !! thread.blockClientId ) {
				selectNoteBlocks( thread, {
					selectBlock,
					multiSelect,
					getBlockRootClientId,
					getBlockOrder,
				} );
				toggleBlockSpotlight( thread.blockClientId, true );
			}
		} else if (
			( ( event.key === 'Enter' || event.key === 'ArrowLeft' ) &&
				isSelfTarget &&
				isSelected ) ||
			event.key === 'Escape'
		) {
			// Collapse thread.
			selectNote( undefined );
			if ( thread.blockClientId ) {
				toggleBlockSpotlight( thread.blockClientId, false );
			}
			focusNoteThread( thread.id, sidebarRef.current );
		} else if (
			event.key === 'ArrowDown' &&
			currentIndex < threads.length - 1 &&
			isSelfTarget
		) {
			focusNoteThread(
				threads[ currentIndex + 1 ].id,
				sidebarRef.current
			);
		} else if (
			event.key === 'ArrowUp' &&
			currentIndex > 0 &&
			isSelfTarget
		) {
			focusNoteThread(
				threads[ currentIndex - 1 ].id,
				sidebarRef.current
			);
		} else if ( event.key === 'Home' && isSelfTarget ) {
			focusNoteThread( threads[ 0 ].id, sidebarRef.current );
		} else if ( event.key === 'End' && isSelfTarget ) {
			focusNoteThread(
				threads[ threads.length - 1 ].id,
				sidebarRef.current
			);
		}
	};

	// In the "All notes" view, find where the resolved notes begin so a
	// "Resolved" divider can be rendered above them. Resolved notes (status
	// 'approved' with a still-present block) always sort after the active
	// ones, so the first match marks the boundary. The floating view only
	// lists unresolved notes, so it needs no divider.
	const firstResolvedIndex = isFloating
		? -1
		: threads.findIndex(
				( thread ) =>
					thread.status === 'approved' && !! thread.blockClientId
			);

	return (
		<Stack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="tree"
			direction="column"
			gap="md"
			justify="flex-start"
			ref={ ( node: HTMLElement | null ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					sidebarRef.current = node;
				}
			} }
			aria-label={
				isFloating ? __( 'Unresolved notes' ) : __( 'All notes' )
			}
		>
			{ ! hasThreads && ! isFloating ? (
				<AddNote onSubmit={ onAddReply } sidebarRef={ sidebarRef } />
			) : (
				<>
					{ ! isFloating && selectedNote === 'new' && (
						<AddNote
							onSubmit={ onAddReply }
							sidebarRef={ sidebarRef }
						/>
					) }
					{ threads.map( ( thread, index ) => (
						<Fragment key={ thread.id }>
							{ index === firstResolvedIndex && (
								<Stack
									direction="row"
									align="center"
									justify="center"
									gap="sm"
									className="editor-collab-sidebar-panel__status-separator"
								>
									<Text variant="heading-sm" render={ <p /> }>
										{ __( 'Resolved' ) }
									</Text>
								</Stack>
							) }
							<NoteThread
								note={ thread }
								onAddReply={ onAddReply }
								onDeleteNote={ handleDelete }
								onEditNote={ onEditNote }
								isSelected={ selectedNote === thread.id }
								sidebarRef={ sidebarRef }
								floating={
									isFloating
										? {
												y: notePositions[ thread.id ],
												registerThread,
												unregisterThread,
											}
										: undefined
								}
								onKeyDown={ ( event ) =>
									navigate(
										event,
										thread,
										selectedNote === thread.id
									)
								}
							/>
						</Fragment>
					) ) }
				</>
			) }
		</Stack>
	);
}
