/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	DropdownMenu,
	TextareaControl,
	Tooltip,
} from '@wordpress/components';
import {
	dateI18n,
	format,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { sanitizeCommentString } from './utils';

/**
 * Renders the Comments component.
 *
 * @param {Object}   props                  - The component props.
 * @param {Array}    props.threads          - The array of comment threads.
 * @param {Function} props.onEditComment    - The function to handle comment editing.
 * @param {Function} props.onAddReply       - The function to add a reply to a comment.
 * @param {Function} props.onCommentDelete  - The function to delete a comment.
 * @param {Function} props.onCommentResolve - The function to mark a comment as resolved.
 * @return {JSX.Element} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	onCommentResolve,
} ) {
	const [ actionState, setActionState ] = useState( false );
	const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = useState( false );

	const handleConfirmDelete = () => {
		onCommentDelete( actionState.id );
		setActionState( false );
		setIsConfirmDialogOpen( false );
	};

	const handleConfirmResolve = () => {
		onCommentResolve( actionState.id );
		setActionState( false );
		setIsConfirmDialogOpen( false );
	};

	const handleCancelDelete = () => {
		setActionState( false );
		setIsConfirmDialogOpen( false );
	};

	const blockCommentId = useSelect( ( select ) => {
		const clientID = select( blockEditorStore ).getSelectedBlockClientId();
		return (
			select( blockEditorStore ).getBlock( clientID )?.attributes
				?.blockCommentId ?? false
		);
	}, [] );

	const CommentBoard = ( { thread, parentThread } ) => {
		return (
			<>
				<CommentHeader
					thread={ thread }
					onResolve={ () => {
						setActionState( {
							action: 'resolve',
							id: parentThread?.id ?? thread.id,
						} );
						setIsConfirmDialogOpen( true );
					} }
					onEdit={ () =>
						setActionState( { action: 'edit', id: thread.id } )
					}
					onDelete={ () => {
						setActionState( { action: 'delete', id: thread.id } );
						setIsConfirmDialogOpen( true );
					} }
					onReply={
						! parentThread
							? () =>
									setActionState( {
										action: 'reply',
										id: thread.id,
									} )
							: undefined
					}
					status={ parentThread?.status ?? thread.status }
				/>
				<HStack
					alignment="left"
					spacing="3"
					justify="flex-start"
					className="editor-collab-sidebar-panel__user-comment"
				>
					<VStack
						spacing="3"
						className="editor-collab-sidebar-panel__comment-field"
					>
						{ 'edit' === actionState?.action &&
							thread.id === actionState?.id && (
								<CommentForm
									onSubmit={ ( value ) => {
										onEditComment( thread.id, value );
										setActionState( false );
									} }
									onCancel={ () => setActionState( false ) }
									thread={ thread }
								/>
							) }
						{ ( ! actionState ||
							'edit' !== actionState?.action ) && (
							<RawHTML>{ thread?.content?.raw }</RawHTML>
						) }
					</VStack>
				</HStack>
				{ 'resolve' === actionState?.action &&
					thread.id === actionState?.id && (
						<ConfirmDialog
							isOpen={ isConfirmDialogOpen }
							onConfirm={ handleConfirmResolve }
							onCancel={ handleCancelDelete }
							confirmButtonText="Yes"
							cancelButtonText="No"
						>
							{
								// translators: message displayed when confirming an action
								__(
									'Are you sure you want to mark this comment as resolved?'
								)
							}
						</ConfirmDialog>
					) }
				{ 'delete' === actionState?.action &&
					thread.id === actionState?.id && (
						<ConfirmDialog
							isOpen={ isConfirmDialogOpen }
							onConfirm={ handleConfirmDelete }
							onCancel={ handleCancelDelete }
							confirmButtonText="Yes"
							cancelButtonText="No"
						>
							{
								// translators: message displayed when confirming an action
								__(
									'Are you sure you want to delete this comment?'
								)
							}
						</ConfirmDialog>
					) }
			</>
		);
	};

	return (
		<>
			{
				// If there are no comments, show a message indicating no comments are available.
				( ! Array.isArray( threads ) || threads.length === 0 ) && (
					<VStack
						alignment="left"
						className="editor-collab-sidebar-panel__thread"
						justify="flex-start"
						spacing="3"
					>
						{
							// translators: message displayed when there are no comments available
							__( 'No comments available' )
						}
					</VStack>
				)
			}

			{ Array.isArray( threads ) &&
				threads.length > 0 &&
				threads.map( ( thread ) => (
					<VStack
						key={ thread.id }
						className={ clsx(
							'editor-collab-sidebar-panel__thread',
							{
								'editor-collab-sidebar-panel__active-thread':
									blockCommentId &&
									blockCommentId === thread.id,
							}
						) }
						id={ thread.id }
						spacing="3"
					>
						<CommentBoard thread={ thread } />
						{ 'reply' === actionState?.action &&
							thread.id === actionState?.id && (
								<HStack
									alignment="left"
									spacing="3"
									justify="flex-start"
									className="editor-collab-sidebar-panel__user-comment"
								>
									<VStack
										spacing="3"
										className="editor-collab-sidebar-panel__comment-field"
									>
										<CommentForm
											onSubmit={ ( inputComment ) => {
												onAddReply(
													inputComment,
													thread.id
												);
												setActionState( false );
											} }
											onCancel={ () =>
												setActionState( false )
											}
										/>
									</VStack>
								</HStack>
							) }
						{ 0 < thread?.reply?.length &&
							thread.reply.map( ( reply ) => (
								<VStack
									key={ reply.id }
									className="editor-collab-sidebar-panel__child-thread"
									id={ reply.id }
									spacing="2"
								>
									<CommentBoard
										thread={ reply }
										parentThread={ thread }
									/>
								</VStack>
							) ) }
					</VStack>
				) ) }
		</>
	);
}

/**
 * EditComment component.
 *
 * @param {Object}   props          - The component props.
 * @param {Function} props.onSubmit - The function to call when updating the comment.
 * @param {Function} props.onCancel - The function to call when canceling the comment update.
 * @param {Object}   props.thread   - The comment thread object.
 * @return {JSX.Element} The CommentForm component.
 */
function CommentForm( { onSubmit, onCancel, thread } ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	return (
		<>
			<TextareaControl
				__nextHasNoMarginBottom
				value={ inputComment ?? '' }
				onChange={ setInputComment }
			/>
			<VStack alignment="left" spacing="3" justify="flex-start">
				<HStack alignment="left" spacing="3" justify="flex-start">
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						variant="primary"
						onClick={ () => onSubmit( inputComment ) }
						disabled={
							0 === sanitizeCommentString( inputComment ).length
						}
					>
						{ thread
							? _x( 'Update', 'verb' )
							: _x( 'Reply', 'Add reply comment' ) }
					</Button>
					<Button __next40pxDefaultSize onClick={ onCancel }>
						{ _x( 'Cancel', 'Cancel comment edit' ) }
					</Button>
				</HStack>
			</VStack>
		</>
	);
}

/**
 * Renders the header of a comment in the collaboration sidebar.
 *
 * @param {Object}   props           - The component props.
 * @param {Object}   props.thread    - The comment thread object.
 * @param {Function} props.onResolve - The function to resolve the comment.
 * @param {Function} props.onEdit    - The function to edit the comment.
 * @param {Function} props.onDelete  - The function to delete the comment.
 * @param {Function} props.onReply   - The function to reply to the comment.
 * @param {string}   props.status    - The status of the comment.
 * @return {JSX.Element} The rendered comment header.
 */
function CommentHeader( {
	thread,
	onResolve,
	onEdit,
	onDelete,
	onReply,
	status,
} ) {
	const dateSettings = getDateSettings();
	const [ dateTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);

	const actions = [
		{
			title: _x( 'Edit', 'Edit comment' ),
			onClick: onEdit,
		},
		{
			title: _x( 'Delete', 'Delete comment' ),
			onClick: onDelete,
		},
		{
			title: _x( 'Reply', 'Reply on a comment' ),
			onClick: onReply,
		},
	];

	const moreActions = actions.filter( ( item ) => item.onClick );

	return (
		<HStack alignment="left" spacing="3" justify="flex-start">
			<img
				src={ thread?.author_avatar_urls?.[ 48 ] }
				className="editor-collab-sidebar-panel__user-avatar"
				// translators: alt text for user avatar image
				alt={ __( 'User avatar' ) }
				width={ 32 }
				height={ 32 }
			/>
			<VStack spacing="0">
				<span className="editor-collab-sidebar-panel__user-name">
					{ thread.author_name }
				</span>
				<time
					dateTime={ format( 'h:i A', thread.date ) }
					className="editor-collab-sidebar-panel__user-time"
				>
					{ dateI18n( dateTimeFormat, thread.date ) }
				</time>
			</VStack>
			<span className="editor-collab-sidebar-panel__comment-status">
				{ status !== 'approved' && (
					<HStack alignment="right" justify="flex-end" spacing="0">
						{ 0 === thread.parent && onResolve && (
							<Button
								label={ _x(
									'Resolve',
									'Mark comment as resolved'
								) }
								__next40pxDefaultSize
								icon={ published }
								onClick={ onResolve }
								showTooltip
							/>
						) }
						<DropdownMenu
							icon={ moreVertical }
							label={ _x(
								'Select an action',
								'Select comment action'
							) }
							className="editor-collab-sidebar-panel__comment-dropdown-menu"
							controls={ moreActions }
						/>
					</HStack>
				) }
				{ status === 'approved' && (
					// translators: tooltip for resolved comment
					<Tooltip text={ __( 'Resolved' ) }>
						<Icon icon={ check } />
					</Tooltip>
				) }
			</span>
		</HStack>
	);
}
