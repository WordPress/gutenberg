import { Fragment, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { NoteThread } from '../../collab-sidebar/note-thread';
import { NoteCard } from '../../collab-sidebar/note-card';
import { NoteForm } from '../../collab-sidebar/note-form';
import { useNoteActions } from '../../collab-sidebar/hooks';
import { focusNoteThread } from '../../collab-sidebar/utils';
import { NOTE_ANCHOR_META, UNKNOWN_ANCHOR } from './anchors';
import type { StyleBookNoteGroup, StyleBookNoteThread } from './anchors';
import { useStyleBookNotesContext } from './context';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

type StyleBookNotesPanelProps = {
	groups: StyleBookNoteGroup[];
	labels: Record< string, string >;
	globalStylesId: number | string | undefined;
	sidebarRef: React.MutableRefObject< HTMLElement | null >;
};

/**
 * Lists Style Book note threads, grouped under the example each was left on.
 *
 * This is a sibling of the post editor's `Notes` list rather than a reuse of
 * it: that component keeps the note selection in step with the block selection
 * and spotlights the anchored block, none of which applies to examples that
 * are regenerated on every render. The individual threads are the same
 * component, so replies, editing, resolving and deleting behave identically.
 *
 * @param props
 * @param props.groups         Ordered anchor groups from `useStyleBookNoteThreads`.
 * @param props.labels         Example name to display title.
 * @param props.globalStylesId Post the notes are stored on.
 * @param props.sidebarRef     Ref to the scroll container.
 * @return The notes list.
 */
export function StyleBookNotesPanel( {
	groups,
	labels,
	globalStylesId,
	sidebarRef,
}: StyleBookNotesPanelProps ): React.JSX.Element {
	const { pendingAnchor, setPendingAnchor, setActiveAnchor } =
		useStyleBookNotesContext();
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);
	const addNoteRef = useRef< HTMLDivElement | null >( null );

	/*
	 * The request to add a note comes from the canvas, so focus has to follow
	 * it into the sidebar - otherwise the form opens somewhere the keyboard
	 * user has not been taken to.
	 */
	useEffect( () => {
		if ( pendingAnchor ) {
			addNoteRef.current
				?.querySelector< HTMLElement >( '[role="textbox"]' )
				?.focus();
		}
	}, [ pendingAnchor ] );

	const {
		onCreate,
		onEdit: onEditNote,
		onDelete,
	} = useNoteActions( {
		postId: globalStylesId,
		getCreateExtra: () => ( {
			meta: { [ NOTE_ANCHOR_META ]: pendingAnchor },
		} ),
	} );

	// Flat, in-render order list backing arrow-key navigation across groups.
	const orderedThreads = useMemo(
		() => groups.flatMap( ( group ) => group.threads ),
		[ groups ]
	);

	/*
	 * The title comes from the label map rather than from the groups: the
	 * first note on an example is added before any group for it exists, and
	 * naming the form after the raw anchor would show `core/heading` where the
	 * canvas says "Headings".
	 */
	const pendingLabel = pendingAnchor ? labels?.[ pendingAnchor ] : undefined;

	const handleDelete = async ( note: StyleBookNoteThread ) => {
		const currentIndex = orderedThreads.findIndex(
			( thread ) => thread.id === note.id
		);
		const adjacent =
			orderedThreads[ currentIndex + 1 ] ??
			orderedThreads[ currentIndex - 1 ];

		const deleted = await onDelete( note );
		// Leave the selection alone when the delete failed; the note is still there.
		if ( ! deleted ) {
			return;
		}

		const parent = note.parent ?? 0;
		if ( parent !== 0 ) {
			// Move focus to the parent thread when a reply was deleted.
			selectNote( parent );
			focusNoteThread( parent, sidebarRef.current );
			return;
		}

		if ( adjacent ) {
			selectNote( adjacent.id );
			focusNoteThread( adjacent.id, sidebarRef.current );
		} else {
			selectNote( undefined );
			setActiveAnchor( null );
		}
	};

	const navigate = (
		event: React.KeyboardEvent< HTMLElement >,
		thread: StyleBookNoteThread,
		anchor: string,
		isSelected: boolean
	) => {
		if ( event.defaultPrevented ) {
			return;
		}

		const currentIndex = orderedThreads.findIndex(
			( t ) => t.id === thread.id
		);
		const isSelfTarget = event.currentTarget === event.target;

		if (
			( event.key === 'Enter' || event.key === 'ArrowRight' ) &&
			isSelfTarget &&
			! isSelected
		) {
			selectNote( thread.id );
			setActiveAnchor( anchor );
		} else if (
			( ( event.key === 'Enter' || event.key === 'ArrowLeft' ) &&
				isSelfTarget &&
				isSelected ) ||
			event.key === 'Escape'
		) {
			selectNote( undefined );
			setActiveAnchor( null );
			focusNoteThread( thread.id, sidebarRef.current );
		} else if (
			event.key === 'ArrowDown' &&
			currentIndex < orderedThreads.length - 1 &&
			isSelfTarget
		) {
			focusNoteThread(
				orderedThreads[ currentIndex + 1 ].id,
				sidebarRef.current
			);
		} else if (
			event.key === 'ArrowUp' &&
			currentIndex > 0 &&
			isSelfTarget
		) {
			focusNoteThread(
				orderedThreads[ currentIndex - 1 ].id,
				sidebarRef.current
			);
		} else if ( event.key === 'Home' && isSelfTarget ) {
			focusNoteThread( orderedThreads[ 0 ].id, sidebarRef.current );
		} else if ( event.key === 'End' && isSelfTarget ) {
			focusNoteThread(
				orderedThreads[ orderedThreads.length - 1 ].id,
				sidebarRef.current
			);
		}
	};

	const hasContent = orderedThreads.length > 0 || !! pendingAnchor;

	/*
	 * Rendered instead of the tree rather than inside it: a tree owns tree
	 * items, and there are none to own until the first note is written.
	 */
	if ( ! hasContent ) {
		return (
			<div className="editor-collab-sidebar-panel editor-style-book-notes">
				<Text
					variant="body-sm"
					className="editor-style-book-notes__empty"
					render={ <p /> }
				>
					{ __(
						'No notes yet. Select "Add note" on any example in the Style Book to leave one.'
					) }
				</Text>
			</div>
		);
	}

	return (
		<Stack
			className="editor-collab-sidebar-panel editor-style-book-notes"
			role="tree"
			direction="column"
			gap="md"
			justify="flex-start"
			ref={ ( node: HTMLElement | null ) => {
				if ( node ) {
					sidebarRef.current = node;
				}
			} }
			aria-label={ __( 'Style Book notes' ) }
		>
			{ !! pendingAnchor && (
				/*
				 * Keyed by the anchor so switching examples starts a fresh
				 * draft: `NoteForm` holds the text in state, and reusing the
				 * instance would file what was typed for one example against
				 * another.
				 */
				<div
					key={ pendingAnchor }
					ref={ addNoteRef }
					className="editor-style-book-notes__add-note"
					role="treeitem"
					tabIndex={ 0 }
					aria-label={
						pendingLabel
							? sprintf(
									// translators: %s: Style Book example title, e.g. "Button".
									__( 'New note on %s' ),
									pendingLabel
							  )
							: __( 'New note' )
					}
				>
					<NoteCard>
						<NoteForm
							onSubmit={ async ( inputComment: string ) => {
								/*
								 * The create action resolves `undefined` when
								 * the save fails (it surfaces its own error
								 * notice); keep the form open so the draft is
								 * not lost.
								 */
								const savedRecord = await onCreate( {
									content: inputComment,
								} );
								if ( savedRecord ) {
									setPendingAnchor( null );
									selectNote( savedRecord.id );
									focusNoteThread(
										savedRecord.id,
										sidebarRef.current
									);
								}
								return savedRecord;
							} }
							onCancel={ () => setPendingAnchor( null ) }
							labels={ {
								input: pendingLabel
									? sprintf(
											// translators: %s: Style Book example title, e.g. "Button".
											__( 'New note on %s' ),
											pendingLabel
									  )
									: __( 'New note' ),
								placeholder: __( 'Add a note or @ mention' ),
							} }
						/>
					</NoteCard>
				</div>
			) }
			{ groups.map( ( group ) => {
				// Unresolved threads sort first, so the first resolved one
				// marks where the divider goes.
				const firstResolvedIndex = group.threads.findIndex(
					( thread ) => thread.status === 'approved'
				);

				return (
					<Stack
						key={ group.anchor }
						role="group"
						aria-label={ group.label }
						direction="column"
						gap="md"
						justify="flex-start"
					>
						<Stack
							direction="row"
							align="center"
							justify="space-between"
							gap="sm"
						>
							<Text
								variant="heading-sm"
								className="editor-style-book-notes__group-title"
								render={ <h3 /> }
							>
								{ group.label }
							</Text>
							{ /*
							 * An example that already has a note still needs a
							 * way to take another one: its canvas button has
							 * become a link to the notes it has. The unknown
							 * bucket gets none - there is no example on screen
							 * to anchor a new note to.
							 */ }
							{ group.anchor !== UNKNOWN_ANCHOR && (
								<Button
									size="small"
									icon={ plus }
									className="editor-style-book-notes__add-note-button"
									label={ sprintf(
										// translators: %s: Style Book example title, e.g. "Button".
										__( 'Add note on %s' ),
										group.label
									) }
									onClick={ () =>
										setPendingAnchor( group.anchor )
									}
								/>
							) }
						</Stack>
						{ group.threads.map( ( thread, index ) => (
							<Fragment key={ thread.id }>
								{ index === firstResolvedIndex && (
									<Stack
										direction="row"
										align="center"
										justify="center"
										gap="sm"
										className="editor-collab-sidebar-panel__status-separator"
									>
										<Text
											variant="heading-sm"
											render={ <p /> }
										>
											{ __( 'Resolved' ) }
										</Text>
									</Stack>
								) }
								<NoteThread
									note={ thread }
									anchorLabel={ group.label }
									onAddReply={ onCreate }
									onDeleteNote={ handleDelete }
									onEditNote={ onEditNote }
									onSelect={ () =>
										setActiveAnchor( group.anchor )
									}
									onDeselect={ () => setActiveAnchor( null ) }
									isSelected={ selectedNote === thread.id }
									sidebarRef={ sidebarRef }
									onKeyDown={ (
										event: React.KeyboardEvent< HTMLElement >
									) =>
										navigate(
											event,
											thread,
											group.anchor,
											selectedNote === thread.id
										)
									}
								/>
							</Fragment>
						) ) }
					</Stack>
				);
			} ) }
		</Stack>
	);
}
