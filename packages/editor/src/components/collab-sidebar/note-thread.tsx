import clsx from 'clsx';
import type {
	FocusEvent,
	KeyboardEvent,
	MouseEvent,
	MutableRefObject,
	SyntheticEvent,
} from 'react';
import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import {
	useDebounce,
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { AddNote } from './add-note';
import { Note } from './note';
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { FloatingContainer } from './floating-container';
import {
	focusNoteThread,
	getNoteExcerpt,
	scrollNoteThreadIntoView,
	getNoteBlockClientIds,
	selectNoteBlocks,
} from './utils';
import type { Thread } from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

/**
 * Floating-board handle for a thread: the computed top offset and the board
 * registration callbacks.
 */
interface NoteThreadFloating {
	y?: number;
	registerThread?: (
		id: number | string,
		blockEl: HTMLElement | null,
		floatingEl: HTMLElement | null
	) => void;
	unregisterThread?: ( id: number | string ) => void;
}

export function NoteThread( {
	note,
	onEditNote,
	onAddReply,
	onDeleteNote,
	isSelected,
	sidebarRef,
	floating,
	onKeyDown,
}: {
	note: Thread;
	onEditNote: ( edit: {
		id: number;
		content?: string;
		status?: string;
	} ) => void;
	onAddReply: ( reply: {
		content: string;
		parent?: number;
	} ) => Promise< any >;
	onDeleteNote: ( note: Thread ) => void;
	isSelected: boolean;
	sidebarRef: MutableRefObject< HTMLElement | null >;
	floating?: NoteThreadFloating;
	onKeyDown: ( event: KeyboardEvent< HTMLElement > ) => void;
} ) {
	const isFloating = !! floating;
	const {
		toggleBlockHighlight,
		selectBlock,
		multiSelect,
		toggleBlockSpotlight,
	} = unlock( useDispatch( blockEditorStore ) );
	// Bound selectors, read imperatively by `selectNoteBlocks` to tell an
	// unbroken span from one with a gap. Passing the store descriptor doesn't
	// subscribe this component to store changes.
	const { getBlockRootClientId, getBlockOrder } =
		useSelect( blockEditorStore );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const relatedBlockElement = useBlockElement( note.blockClientId );
	/*
	 * Outline every block the note covers, not just its anchor: a note taken
	 * across several blocks should light up the whole run it refers to.
	 */
	const highlightNoteBlocks = ( isHighlighted: boolean ) => {
		for ( const blockClientId of getNoteBlockClientIds( note ) ) {
			toggleBlockHighlight( blockClientId, isHighlighted );
		}
	};
	const debouncedHighlightNoteBlocks = useDebounce( highlightNoteBlocks, 50 );
	const floatingRef = useRef< HTMLElement | null >( null );
	const isKeyboardTabbingRef = useRef( false );

	const registerThread = floating?.registerThread;
	const unregisterThread = floating?.unregisterThread;

	// Register block + floating elements with the board.
	// The board's ResizeObserver tracks height changes automatically.
	useEffect( () => {
		const floatingEl = floatingRef.current;
		if ( floatingEl && registerThread ) {
			registerThread( note.id, relatedBlockElement, floatingEl );
		}
		return () => unregisterThread?.( note.id );
	}, [ relatedBlockElement, note.id, registerThread, unregisterThread ] );

	// Scroll the thread into view when it becomes selected, and re-scroll
	// when its floating position settles after `useFloatingBoard` recomputes.
	useEffect( () => {
		if ( ! isSelected || note.id === 'new' ) {
			return;
		}
		scrollNoteThreadIntoView( note.id, sidebarRef.current );
	}, [ isSelected, floating?.y, note.id, sidebarRef ] );

	/*
	 * Deselect the thread once focus leaves it. `useFocusOutside` keeps the
	 * thread selected while focus stays in UI it owns: the delete dialog, the
	 * note actions menu and format popovers (e.g. the Cmd+K link UI) portal out
	 * of the thread's DOM, but their focus events still bubble here through the
	 * React tree. It also ignores window/tab blur.
	 */
	const focusOutside = useFocusOutside( ( event: FocusEvent ) => {
		// When another note is clicked, do nothing because the current note is automatically closed.
		const isNoteFocused = event.relatedTarget?.closest(
			'.editor-collab-sidebar-panel__thread'
		);
		if ( isNoteFocused && ! isKeyboardTabbingRef.current ) {
			return;
		}

		// Drop the highlight, unless another note (possibly on the same block) now owns it.
		if ( ! isNoteFocused ) {
			// Discard a hover toggle still in flight so it can't re-highlight afterwards.
			debouncedHighlightNoteBlocks.cancel();
			highlightNoteBlocks( false );
		}

		/*
		 * Selection may have moved on before this deferred callback runs; only
		 * clear it while this still owns the selection, or it would wipe out the
		 * newly selected note.
		 */
		if ( getSelectedNote() === note.id ) {
			onDeselectNote();
		}
	} );

	function onMouseEnter() {
		debouncedHighlightNoteBlocks( true );
	}

	function onMouseLeave() {
		debouncedHighlightNoteBlocks( false );
	}

	function onFocus( event: FocusEvent< HTMLElement > ) {
		// Cancel any pending deselect and highlight the related block.
		focusOutside.onFocus( event );
		debouncedHighlightNoteBlocks.cancel();
		highlightNoteBlocks( true );
	}

	function onSelectNote() {
		if ( isSelected ) {
			return;
		}

		selectNote( note.id );
		focusNoteThread( note.id, sidebarRef.current );
		toggleBlockSpotlight( note.blockClientId, true );
		selectNoteBlocks( note, {
			selectBlock,
			multiSelect,
			getBlockRootClientId,
			getBlockOrder,
		} );
	}

	function onDeselectNote() {
		selectNote( undefined );
		toggleBlockSpotlight( note.blockClientId, false );
	}

	function handleResolve() {
		onEditNote( { id: note.id as number, status: 'approved' } );
		onDeselectNote();
		if ( isFloating ) {
			relatedBlockElement?.focus();
		} else {
			focusNoteThread( note.id, sidebarRef.current );
		}
	}

	const allReplies = note?.reply || [];
	const lastReply =
		allReplies.length > 0 ? allReplies[ allReplies.length - 1 ] : undefined;
	const restReplies = allReplies.length > 0 ? allReplies.slice( 0, -1 ) : [];

	const noteExcerpt = getNoteExcerpt(
		stripHTML( note.content?.rendered ?? '' ),
		10
	);
	const ariaLabel = !! note.blockClientId
		? sprintf(
				// translators: %s: note excerpt
				__( 'Note: %s' ),
				noteExcerpt
		  )
		: sprintf(
				// translators: %s: note excerpt
				__( 'Original block deleted. Note: %s' ),
				noteExcerpt
		  );

	if ( isFloating && note.id === 'new' ) {
		return (
			<AddNote
				onSubmit={ onAddReply }
				sidebarRef={ sidebarRef }
				floating={ { y: floating.y, ref: floatingRef } }
			/>
		);
	}

	return (
		<FloatingContainer
			floating={
				isFloating ? { y: floating.y, ref: floatingRef } : undefined
			}
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': isSelected,
			} ) }
			id={ `note-thread-${ note.id }` }
			gap="md"
			onClick={ onSelectNote }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			{ ...focusOutside }
			onFocus={ onFocus }
			onKeyUp={ ( event: KeyboardEvent< HTMLElement > ) => {
				if ( event.key === 'Tab' ) {
					isKeyboardTabbingRef.current = false;
				}
			} }
			onKeyDown={ ( event: KeyboardEvent< HTMLElement > ) => {
				if ( event.key === 'Tab' ) {
					isKeyboardTabbingRef.current = true;
				} else {
					onKeyDown( event );
				}
			} }
			tabIndex={ 0 }
			role="treeitem"
			aria-label={ ariaLabel }
			aria-expanded={ isSelected }
		>
			<Button
				className="editor-collab-sidebar-panel__skip-to-note"
				variant="secondary"
				size="compact"
				onClick={ () => {
					focusNoteThread(
						note.id,
						sidebarRef.current,
						'[role="textbox"]'
					);
				} }
			>
				{ __( 'Add new reply' ) }
			</Button>
			{ ! note.blockClientId && (
				<p className="editor-collab-sidebar-panel__deleted-block-notice">
					{ __( 'Original block deleted.' ) }
				</p>
			) }
			<Note
				note={ note }
				isSelected={ isSelected }
				onEditNote={ onEditNote }
				onDeleteNote={ onDeleteNote }
				onResolve={ handleResolve }
			/>
			{ isSelected &&
				allReplies.map( ( reply ) => (
					<Note
						key={ reply.id }
						note={ reply }
						parentNote={ note }
						isSelected={ isSelected }
						onEditNote={ onEditNote }
						onDeleteNote={ onDeleteNote }
					/>
				) ) }
			{ ! isSelected && restReplies.length > 0 && (
				<Stack
					direction="row"
					align="center"
					justify="space-between"
					className="editor-collab-sidebar-panel__more-reply-separator"
				>
					<Button
						size="compact"
						variant="tertiary"
						className="editor-collab-sidebar-panel__more-reply-button"
						onClick={ ( event: MouseEvent< HTMLElement > ) => {
							event.stopPropagation();
							onSelectNote();
						} }
					>
						{ sprintf(
							// translators: %s: number of replies.
							_n(
								'%s more reply',
								'%s more replies',
								restReplies.length
							),
							String( restReplies.length )
						) }
					</Button>
				</Stack>
			) }
			{ ! isSelected && lastReply && (
				<Note
					note={ lastReply }
					parentNote={ note }
					isSelected={ false }
					onEditNote={ onEditNote }
					onDeleteNote={ onDeleteNote }
				/>
			) }
			{ isSelected && (
				<NoteCard role="treeitem">
					<NoteForm
						onSubmit={ ( inputComment: string ) => {
							if ( 'approved' === note.status ) {
								// For reopening, include the content in the reopen action.
								return onEditNote( {
									id: note.id as number,
									status: 'hold',
									content: inputComment,
								} );
							}
							// For regular replies, add as separate comment.
							return onAddReply( {
								content: inputComment,
								parent: note.id as number,
							} );
						} }
						onCancel={ ( event: SyntheticEvent ) => {
							// Prevent the parent onClick from being triggered.
							event.stopPropagation();
							onDeselectNote();
							focusNoteThread( note.id, sidebarRef.current );
						} }
						labels={ {
							submit:
								'approved' === note.status
									? __( 'Reopen & Reply' )
									: __( 'Reply' ),
							input: sprintf(
								// translators: %1$s: note identifier, %2$s: author name
								__( 'Reply to note %1$s by %2$s' ),
								String( note.id ),
								note.author_name ?? ''
							),
							placeholder: __( 'Reply or @ mention' ),
						} }
					/>
				</NoteCard>
			) }
			{ !! note.blockClientId && (
				<Button
					className="editor-collab-sidebar-panel__skip-to-block"
					variant="secondary"
					size="compact"
					onClick={ ( event: MouseEvent< HTMLElement > ) => {
						event.stopPropagation();
						relatedBlockElement?.focus();
					} }
				>
					{ __( 'Back to block' ) }
				</Button>
			) }
		</FloatingContainer>
	);
}
