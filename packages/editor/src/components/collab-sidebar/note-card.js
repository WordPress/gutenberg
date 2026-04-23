/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useRef } from '@wordpress/element';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { published, moreVertical } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NoteByline } from './note-byline';
import { NoteForm } from './note-form';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export function NoteCard( {
	note,
	parentNote,
	isExpanded,
	onEditNote,
	onDeleteNote,
} ) {
	const [ actionState, setActionState ] = useState( false );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	const actionButtonRef = useRef( null );
	const handleConfirmDelete = () => {
		onDeleteNote( note );
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const handleCancel = () => {
		setActionState( false );
		setShowConfirmDialog( false );
		actionButtonRef.current?.focus();
	};

	// Check if this is a resolution note by checking metadata.
	const isResolutionNote =
		note.type === 'note' &&
		note.meta &&
		( note.meta._wp_note_status === 'resolved' ||
			note.meta._wp_note_status === 'reopen' );

	const actions = [
		{
			id: 'edit',
			title: __( 'Edit' ),
			isEligible: ( { status } ) => status !== 'approved',
			onClick: () => {
				setActionState( 'edit' );
			},
		},
		{
			id: 'reopen',
			title: _x( 'Reopen', 'Reopen note' ),
			isEligible: ( { status } ) => status === 'approved',
			onClick: () => {
				onEditNote( { id: note.id, status: 'hold' } );
			},
		},
		{
			id: 'delete',
			title: __( 'Delete' ),
			isEligible: () => true,
			onClick: () => {
				setActionState( 'delete' );
				setShowConfirmDialog( true );
			},
		},
	];

	const canResolve = note.parent === 0;
	const moreActions =
		parentNote?.status !== 'approved'
			? actions.filter( ( item ) => item.isEligible( note ) )
			: [];

	const deleteConfirmMessage =
		// When deleting a top level note, descendants will also be deleted.
		note.parent === 0
			? __(
					"Are you sure you want to delete this note? This will also delete all of this note's replies."
			  )
			: __( 'Are you sure you want to delete this reply?' );

	return (
		<Stack
			direction="column"
			gap="sm"
			role={ note.parent !== 0 ? 'treeitem' : undefined }
		>
			<Stack direction="row" align="center" justify="flex-start" gap="md">
				<NoteByline
					avatar={ note?.author_avatar_urls?.[ 48 ] }
					name={ note?.author_name }
					date={ note?.date }
					userId={ note?.author }
				/>
				{ isExpanded && (
					<FlexItem
						className="editor-collab-sidebar-panel__comment-status"
						onClick={ ( event ) => {
							// Prevent the thread from being selected.
							event.stopPropagation();
						} }
					>
						<Stack direction="row" align="center">
							{ canResolve && (
								<Button
									label={ _x(
										'Resolve',
										'Mark note as resolved'
									) }
									size="small"
									icon={ published }
									disabled={ note.status === 'approved' }
									accessibleWhenDisabled={
										note.status === 'approved'
									}
									onClick={ () => {
										onEditNote( {
											id: note.id,
											status: 'approved',
										} );
									} }
								/>
							) }
							<Menu placement="bottom-end">
								<Menu.TriggerButton
									render={
										<Button
											ref={ actionButtonRef }
											size="small"
											icon={ moreVertical }
											label={ __( 'Actions' ) }
											disabled={ ! moreActions.length }
											accessibleWhenDisabled
										/>
									}
								/>
								<Menu.Popover
									// The menu popover is rendered in a portal, which causes focus to be
									// lost and the note to be collapsed unintentionally. To prevent this,
									// the popover should be rendered as an inline.
									modal={ false }
								>
									{ moreActions.map( ( action ) => (
										<Menu.Item
											key={ action.id }
											onClick={ () => action.onClick() }
										>
											<Menu.ItemLabel>
												{ action.title }
											</Menu.ItemLabel>
										</Menu.Item>
									) ) }
								</Menu.Popover>
							</Menu>
						</Stack>
					</FlexItem>
				) }
			</Stack>
			{ 'edit' === actionState ? (
				<NoteForm
					onSubmit={ ( value ) => {
						onEditNote( {
							id: note.id,
							content: value,
						} );
						setActionState( false );
						actionButtonRef.current?.focus();
					} }
					onCancel={ () => handleCancel() }
					note={ note }
					labels={ {
						submit: _x( 'Update', 'verb' ),
						input: sprintf(
							// translators: %1$s: note identifier, %2$s: author name.
							__( 'Edit note %1$s by %2$s' ),
							note.id,
							note.author_name
						),
					} }
				/>
			) : (
				<RawHTML
					className={ clsx(
						'editor-collab-sidebar-panel__user-comment',
						{
							'editor-collab-sidebar-panel__resolution-text':
								isResolutionNote,
						}
					) }
				>
					{ isResolutionNote
						? ( () => {
								const actionText =
									note.meta._wp_note_status === 'resolved'
										? __( 'Marked as resolved' )
										: __( 'Reopened' );
								const content = note?.content?.raw;

								if (
									content &&
									typeof content === 'string' &&
									content.trim() !== ''
								) {
									return sprintf(
										// translators: %1$s: action label ("Marked as resolved" or "Reopened"); %2$s: note text.
										__( '%1$s: %2$s' ),
										actionText,
										content
									);
								}
								// If no content, just show the action.
								return actionText;
						  } )()
						: note?.content?.rendered }
				</RawHTML>
			) }
			{ 'delete' === actionState && (
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirmDelete }
					onCancel={ handleCancel }
					confirmButtonText={ __( 'Delete' ) }
				>
					{ deleteConfirmMessage }
				</ConfirmDialog>
			) }
		</Stack>
	);
}
