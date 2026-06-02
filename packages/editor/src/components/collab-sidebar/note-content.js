/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Note } from './note';
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { focusNoteThread } from './utils';

// Note-specific content rendered inside a NoteThread shell. Owns the top
// comment, replies, the "more reply" tease, and the reply form. The thread
// shell handles chrome (positioning, click/hover, keyboard, registration).
export function NoteContent( {
	note,
	isSelected,
	onAddReply,
	onEditNote,
	onDeleteNote,
	onSelectThread,
	onDeselectThread,
	onResolve,
	sidebarRef,
} ) {
	const allReplies = note?.reply || [];
	const lastReply =
		allReplies.length > 0 ? allReplies[ allReplies.length - 1 ] : undefined;
	const restReplies = allReplies.length > 0 ? allReplies.slice( 0, -1 ) : [];

	return (
		<>
			<Note
				note={ note }
				isSelected={ isSelected }
				onEditNote={ onEditNote }
				onDeleteNote={ onDeleteNote }
				onResolve={ onResolve }
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
							onSelectThread();
						} }
					>
						{ sprintf(
							/* translators: %s: number of replies. */
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
							onDeselectThread();
							focusNoteThread( note.id, sidebarRef.current );
						} }
						labels={ {
							submit:
								'approved' === note.status
									? __( 'Reopen & Reply' )
									: __( 'Reply' ),
							input: sprintf(
								/* translators: %1$s: note identifier, %2$s: author name */
								__( 'Reply to note %1$s by %2$s' ),
								note.id,
								note.author_name
							),
						} }
					/>
				</NoteCard>
			) }
		</>
	);
}
