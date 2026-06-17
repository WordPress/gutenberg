/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useRef, useState, useLayoutEffect } from '@wordpress/element';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button as UIButton } from '@wordpress/ui';
import { __, _x, sprintf } from '@wordpress/i18n';
import { moreVertical, published } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

function NoteActionsMenu( { items, buttonRef } ) {
	return (
		<Menu placement="bottom-end">
			<Menu.TriggerButton
				render={
					<Button
						ref={ buttonRef }
						size="small"
						icon={ moreVertical }
						label={ __( 'Actions' ) }
						disabled={ ! items.length }
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
				{ items.map( ( item ) => (
					<Menu.Item key={ item.id } onClick={ item.onClick }>
						<Menu.ItemLabel>{ item.title }</Menu.ItemLabel>
					</Menu.Item>
				) ) }
			</Menu.Popover>
		</Menu>
	);
}

export function Note( {
	note,
	parentNote,
	isSelected,
	onEditNote,
	onDeleteNote,
	onResolve,
} ) {
	const [ actionState, setActionState ] = useState( null );
	const actionButtonRef = useRef( null );

	const commentRef = useRef( null );
	const rawContent = note?.content?.raw;
	const [ prevContent, setPrevContent ] = useState( rawContent );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isOverflowing, setIsOverflowing ] = useState( false );

	// Collapse whenever the content changes so it can be re-measured.
	if ( prevContent !== rawContent ) {
		setPrevContent( rawContent );
		setIsExpanded( false );
	}

	// Measure the (clamped) content to decide whether the toggle is needed.
	useLayoutEffect( () => {
		const commentElement = commentRef.current;
		if ( commentElement ) {
			setIsOverflowing(
				commentElement.scrollHeight > commentElement.clientHeight
			);
		}
	}, [ rawContent ] );

	const canResolve = note.parent === 0;
	const isResolutionNote =
		note.type === 'note' &&
		note.meta &&
		( note.meta._wp_note_status === 'resolved' ||
			note.meta._wp_note_status === 'reopen' );

	const menuItems = [
		{
			id: 'edit',
			title: __( 'Edit' ),
			isEligible: ( { status } ) => status !== 'approved',
			onClick: () => setActionState( 'edit' ),
		},
		{
			id: 'reopen',
			title: _x( 'Reopen', 'Reopen note' ),
			isEligible: ( { status } ) => status === 'approved',
			onClick: () => onEditNote( { id: note.id, status: 'hold' } ),
		},
		{
			id: 'delete',
			title: __( 'Delete' ),
			isEligible: () => true,
			onClick: () => setActionState( 'delete' ),
		},
	];
	const availableItems =
		parentNote?.status !== 'approved'
			? menuItems.filter( ( item ) => item.isEligible( note ) )
			: [];

	const deleteConfirmMessage =
		note.parent === 0
			? __(
					"Are you sure you want to delete this note? This will also delete all of this note's replies."
			  )
			: __( 'Are you sure you want to delete this reply?' );

	const handleCancel = () => {
		setActionState( null );
		actionButtonRef.current?.focus();
	};

	let body;
	if ( actionState === 'edit' ) {
		body = (
			<NoteForm
				onSubmit={ ( value ) => {
					onEditNote( { id: note.id, content: value } );
					setActionState( null );
					actionButtonRef.current?.focus();
				} }
				onCancel={ handleCancel }
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
		);
	} else {
		let content;
		if ( isResolutionNote ) {
			const actionText =
				note.meta._wp_note_status === 'resolved'
					? __( 'Marked as resolved' )
					: __( 'Reopened' );
			const raw = note?.content?.raw;
			content =
				raw && typeof raw === 'string' && raw.trim() !== ''
					? sprintf(
							// translators: %1$s: action label ("Marked as resolved" or "Reopened"); %2$s: note text.
							__( '%1$s: %2$s' ),
							actionText,
							raw
					  )
					: actionText;
		} else {
			content = note?.content?.rendered;
		}

		body = (
			<div
				ref={ commentRef }
				className={ clsx( 'editor-collab-sidebar-panel__note-content', {
					'editor-collab-sidebar-panel__resolution-text':
						isResolutionNote,
					'is-collapsed': ! isExpanded,
				} ) }
				dangerouslySetInnerHTML={ { __html: content ?? '' } }
			/>
		);
	}

	const actions = isSelected ? (
		<>
			{ canResolve && onResolve && (
				<Button
					label={ _x( 'Resolve', 'Mark note as resolved' ) }
					size="small"
					icon={ published }
					disabled={ note.status === 'approved' }
					accessibleWhenDisabled={ note.status === 'approved' }
					onClick={ onResolve }
				/>
			) }
			<NoteActionsMenu
				items={ availableItems }
				buttonRef={ actionButtonRef }
			/>
		</>
	) : null;

	return (
		<NoteCard
			note={ note }
			actions={ actions }
			role={ note.parent !== 0 ? 'treeitem' : undefined }
		>
			{ body }
			{ actionState === 'delete' && (
				<ConfirmDialog
					isOpen
					onConfirm={ () => {
						onDeleteNote( note );
						setActionState( null );
					} }
					onCancel={ handleCancel }
					confirmButtonText={ __( 'Delete' ) }
				>
					{ deleteConfirmMessage }
				</ConfirmDialog>
			) }
			{ isOverflowing && 'edit' !== actionState && (
				<UIButton
					className="editor-collab-sidebar-panel__show-more-button"
					variant="unstyled"
					size="small"
					onClick={ () => setIsExpanded( ! isExpanded ) }
				>
					{ ! isExpanded ? __( 'Show more' ) : __( 'Show less' ) }
				</UIButton>
			) }
		</NoteCard>
	);
}
