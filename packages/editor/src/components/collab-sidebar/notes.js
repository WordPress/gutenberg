/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { NoteThread } from './note-thread';
import { focusNoteThread } from './utils';
import { useFloatingBoard } from './hooks';
import { AddNote } from './add-note';
import { store as editorStore } from '../../store';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function Notes( {
	threads: noteThreads,
	onEditNote,
	onAddReply,
	onDeleteNote,
	sidebarRef,
	isFloating = false,
} ) {
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);

	const { blockNoteId, selectedBlockClientId, orderedBlockIds } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSelectedBlockClientId,
				getClientIdsWithDescendants,
			} = select( blockEditorStore );
			const clientId = getSelectedBlockClientId();
			return {
				blockNoteId: clientId
					? getBlockAttributes( clientId )?.metadata?.noteId
					: null,
				selectedBlockClientId: clientId,
				orderedBlockIds: getClientIdsWithDescendants(),
			};
		},
		[]
	);
	const { selectedNote, noteFocused } = useSelect( ( select ) => {
		const { getSelectedNote, isNoteFocused } = unlock(
			select( editorStore )
		);
		return {
			selectedNote: getSelectedNote(),
			noteFocused: isNoteFocused(),
		};
	}, [] );

	const relatedBlockElement = useBlockElement( selectedBlockClientId );

	const threads = useMemo( () => {
		const t = [ ...noteThreads ];
		const orderedThreads = [];
		// In floating mode, when the note board is shown, and as long
		// as the selected block doesn't have an existing note attached -
		// add a "new note" entry to the threads. This special thread type
		// gets sorted and floated like regular threads, but shows an AddNote
		// component instead of a regular note thread.
		if ( isFloating && selectedNote === 'new' ) {
			// Insert the new note entry at the correct location for its blockId.
			const newNoteThread = {
				id: 'new',
				blockClientId: selectedBlockClientId,
				content: { rendered: '' },
			};
			// Insert the new note entry at the right order within the threads.
			orderedBlockIds.forEach( ( blockId ) => {
				if ( blockId === selectedBlockClientId ) {
					orderedThreads.push( newNoteThread );
				} else {
					const threadForBlock = t.find(
						( thread ) => thread.blockClientId === blockId
					);
					if ( threadForBlock ) {
						orderedThreads.push( threadForBlock );
					}
				}
			} );
			return orderedThreads;
		}
		return t;
	}, [
		noteThreads,
		isFloating,
		selectedNote,
		selectedBlockClientId,
		orderedBlockIds,
	] );

	const handleDelete = async ( note ) => {
		const currentIndex = threads.findIndex( ( t ) => t.id === note.id );
		const nextThread = threads[ currentIndex + 1 ];
		const prevThread = threads[ currentIndex - 1 ];

		await onDeleteNote( note );

		if ( note.parent !== 0 ) {
			// Move focus to the parent thread when a reply was deleted.
			selectNote( note.parent );
			focusNoteThread( note.parent, sidebarRef.current );
			return;
		}

		if ( nextThread ) {
			selectNote( nextThread.id );
			focusNoteThread( nextThread.id, sidebarRef.current );
		} else if ( prevThread ) {
			selectNote( prevThread.id );
			focusNoteThread( prevThread.id, sidebarRef.current );
		} else {
			selectNote( undefined );
			toggleBlockSpotlight( note.blockClientId, false );
			// Move focus to the related block.
			relatedBlockElement?.focus();
		}
	};

	// Auto-select the related note thread when a block is selected.
	useEffect( () => {
		selectNote( blockNoteId ?? undefined );
	}, [ blockNoteId, selectNote ] );

	// Focus the selected note when requested.
	useEffect( () => {
		if ( noteFocused && selectedNote ) {
			focusNoteThread(
				selectedNote,
				sidebarRef.current,
				selectedNote === 'new' ? 'textarea' : undefined
			);
			// Clear focus flag to avoid re-triggering.
			selectNote( selectedNote );
		}
	}, [ noteFocused, selectedNote, selectNote, sidebarRef ] );

	const { notePositions, registerThread, unregisterThread } =
		useFloatingBoard( {
			threads,
			selectedNoteId: selectedNote,
			isFloating,
			sidebarRef,
		} );

	const handleThreadNavigation = ( event, thread, isSelected ) => {
		if ( event.defaultPrevented ) {
			return;
		}

		const currentIndex = threads.findIndex( ( t ) => t.id === thread.id );

		if (
			( event.key === 'Enter' || event.key === 'ArrowRight' ) &&
			event.currentTarget === event.target &&
			! isSelected
		) {
			// Expand thread.
			selectNote( thread.id );
			if ( !! thread.blockClientId ) {
				// Pass `null` as the second parameter to prevent focusing the block.
				selectBlock( thread.blockClientId, null );
				toggleBlockSpotlight( thread.blockClientId, true );
			}
		} else if (
			( ( event.key === 'Enter' || event.key === 'ArrowLeft' ) &&
				event.currentTarget === event.target &&
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
			event.currentTarget === event.target
		) {
			// Move to the next thread.
			const nextThread = threads[ currentIndex + 1 ];
			focusNoteThread( nextThread.id, sidebarRef.current );
		} else if (
			event.key === 'ArrowUp' &&
			currentIndex > 0 &&
			event.currentTarget === event.target
		) {
			// Move to the previous thread.
			const prevThread = threads[ currentIndex - 1 ];
			focusNoteThread( prevThread.id, sidebarRef.current );
		} else if (
			event.key === 'Home' &&
			event.currentTarget === event.target
		) {
			// Move to the first thread.
			focusNoteThread( threads[ 0 ].id, sidebarRef.current );
		} else if (
			event.key === 'End' &&
			event.currentTarget === event.target
		) {
			// Move to the last thread.
			focusNoteThread(
				threads[ threads.length - 1 ].id,
				sidebarRef.current
			);
		}
	};

	const hasThreads = Array.isArray( threads ) && threads.length > 0;
	// A special case for `template-locked` mode - https://github.com/WordPress/gutenberg/pull/72646.
	if ( ! hasThreads && ! isFloating ) {
		return <AddNote onSubmit={ onAddReply } sidebarRef={ sidebarRef } />;
	}

	return (
		<>
			{ ! isFloating && selectedNote === 'new' && (
				<AddNote onSubmit={ onAddReply } sidebarRef={ sidebarRef } />
			) }
			{ threads.map( ( thread ) => (
				<NoteThread
					key={ thread.id }
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
						handleThreadNavigation(
							event,
							thread,
							selectedNote === thread.id
						)
					}
				/>
			) ) }
		</>
	);
}
