/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useDebounce } from '@wordpress/compose';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { AddNote } from './add-note';
import { Note } from './note';
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { FloatingContainer } from './floating-container';
import {
	focusNoteThread,
	getNoteExcerpt,
	scrollNoteThreadIntoView,
} from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function NoteThread( {
	note,
	onEditNote,
	onAddReply,
	onDeleteNote,
	isSelected,
	sidebarRef,
	floating,
	onKeyDown,
} ) {
	const isFloating = !! floating;
	const { toggleBlockHighlight, selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const relatedBlockElement = useBlockElement( note.blockClientId );
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const floatingRef = useRef( null );
	const isKeyboardTabbingRef = useRef( false );

	const registerThread = floating?.registerThread;
	const unregisterThread = floating?.unregisterThread;

	// Register block + floating elements with the board.
	// The board's ResizeObserver and autoUpdate track changes automatically.
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

	const onMouseEnter = () => {
		debouncedToggleBlockHighlight( note.blockClientId, true );
	};

	const onMouseLeave = () => {
		debouncedToggleBlockHighlight( note.blockClientId, false );
	};

	const onFocus = () => {
		toggleBlockHighlight( note.blockClientId, true );
	};

	const onBlur = ( event ) => {
		// Don't deselect notes when the browser window/tab loses focus.
		if ( ! document.hasFocus() ) {
			return;
		}

		const isNoteFocused = event.relatedTarget?.closest(
			'.editor-collab-sidebar-panel__thread'
		);
		const isDialogFocused =
			event.relatedTarget?.closest( '[role="dialog"]' );
		const isTabbing = isKeyboardTabbingRef.current;

		// When another note is clicked, do nothing because the current note is automatically closed.
		if ( isNoteFocused && ! isTabbing ) {
			return;
		}
		// When deleting a note, a dialog appears, but the note should not be collapsed.
		if ( isDialogFocused ) {
			return;
		}
		// When tabbing, do nothing if the focus is within the current note.
		if (
			isTabbing &&
			event.currentTarget.contains( event.relatedTarget )
		) {
			return;
		}

		// Closes a note that has lost focus when any of the following conditions are met:
		// - An element other than a note is clicked.
		// - Focus was lost by tabbing.
		toggleBlockHighlight( note.blockClientId, false );
		onDeselectNote();
	};

	const onSelectNote = () => {
		if ( isSelected ) {
			return;
		}

		selectNote( note.id );
		focusNoteThread( note.id, sidebarRef.current );
		toggleBlockSpotlight( note.blockClientId, true );
		if ( !! note.blockClientId ) {
			// Pass `null` as the second parameter to prevent focusing the block.
			selectBlock( note.blockClientId, null );
		}
	};

	const onDeselectNote = () => {
		selectNote( undefined );
		toggleBlockSpotlight( note.blockClientId, false );
	};

	const handleResolve = () => {
		onEditNote( { id: note.id, status: 'approved' } );
		onDeselectNote();
		if ( isFloating ) {
			relatedBlockElement?.focus();
		} else {
			focusNoteThread( note.id, sidebarRef.current );
		}
	};

	const allReplies = note?.reply || [];
	const lastReply =
		allReplies.length > 0 ? allReplies[ allReplies.length - 1 ] : undefined;
	const restReplies = allReplies.length > 0 ? allReplies.slice( 0, -1 ) : [];

	const noteExcerpt = getNoteExcerpt(
		stripHTML( note.content?.rendered ),
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
			onFocus={ onFocus }
			onBlur={ onBlur }
			onKeyUp={ ( event ) => {
				if ( event.key === 'Tab' ) {
					isKeyboardTabbingRef.current = false;
				}
			} }
			onKeyDown={ ( event ) => {
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
					focusNoteThread( note.id, sidebarRef.current, 'textarea' );
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
						onClick={ ( event ) => {
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
							restReplies.length
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
						onSubmit={ ( inputComment ) => {
							if ( 'approved' === note.status ) {
								// For reopening, include the content in the reopen action.
								onEditNote( {
									id: note.id,
									status: 'hold',
									content: inputComment,
								} );
							} else {
								// For regular replies, add as separate comment.
								onAddReply( {
									content: inputComment,
									parent: note.id,
								} );
							}
						} }
						onCancel={ ( event ) => {
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
								note.id,
								note.author_name
							),
						} }
					/>
				</NoteCard>
			) }
			{ !! note.blockClientId && (
				<Button
					className="editor-collab-sidebar-panel__skip-to-block"
					variant="secondary"
					size="compact"
					onClick={ ( event ) => {
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
