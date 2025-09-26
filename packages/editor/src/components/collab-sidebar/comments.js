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
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

import { published, moreVertical } from '@wordpress/icons';
import { __, _x, sprintf, _n } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';

const { useBlockElement } = unlock( blockEditorPrivateApis );
const { Menu } = unlock( componentsPrivateApis );

/**
 * Renders the Comments component.
 *
 * @param {Object}   props                     - The component props.
 * @param {Array}    props.threads             - The array of comment threads.
 * @param {Function} props.onEditComment       - The function to handle comment editing.
 * @param {Function} props.onAddReply          - The function to add a reply to a comment.
 * @param {Function} props.onCommentDelete     - The function to delete a comment.
 * @param {Function} props.setShowCommentBoard - The function to set the comment board visibility.
 * @return {React.ReactNode} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	setShowCommentBoard,
} ) {
	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return {
			blockCommentId: clientId
				? getBlockAttributes( clientId )?.blockCommentId
				: null,
		};
	}, [] );
	const [ focusThread = blockCommentId, setFocusThread ] = useState();

	const hasThreads = Array.isArray( threads ) && threads.length > 0;
	if ( ! hasThreads ) {
		return (
			<VStack
				alignment="left"
				className="editor-collab-sidebar-panel__thread"
				justify="flex-start"
				spacing="2"
			>
				{
					// translators: message displayed when there are no comments available
					__( 'No comments available' )
				}
			</VStack>
		);
	}

	return threads.map( ( thread ) => (
		<Thread
			key={ thread.id }
			thread={ thread }
			onAddReply={ onAddReply }
			onCommentDelete={ onCommentDelete }
			onEditComment={ onEditComment }
			isFocused={ focusThread === thread.id }
			setFocusThread={ setFocusThread }
			setShowCommentBoard={ setShowCommentBoard }
		/>
	) );
}

function Thread( {
	thread,
	onEditComment,
	onAddReply,
	onCommentDelete,
	isFocused,
	setFocusThread,
	setShowCommentBoard,
} ) {
	const { flashBlock } = useDispatch( blockEditorStore );
	const relatedBlockElement = useBlockElement( thread.blockClientId );

	const handleCommentSelect = ( { id, blockClientId } ) => {
		setShowCommentBoard( false );
		setFocusThread( id );
		if ( blockClientId && relatedBlockElement ) {
			relatedBlockElement.scrollIntoView( {
				behavior: 'instant',
				block: 'center',
			} );
			flashBlock( blockClientId );
		}
	};

	const clearThreadFocus = () => {
		setFocusThread( null );
		setShowCommentBoard( false );
	};

	const replies = thread?.reply;
	const lastReply = !! replies.length
		? replies[ replies.length - 1 ]
		: undefined;
	const restReplies = !! replies.length ? replies.slice( 0, -1 ) : [];

	return (
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'editor-collab-sidebar-panel__focus-thread': isFocused,
			} ) }
			id={ thread.id }
			spacing="2"
			onClick={ () => handleCommentSelect( thread ) }
		>
			<CommentBoard
				thread={ thread }
				onEdit={ onEditComment }
				onDelete={ onCommentDelete }
				status={ thread.status }
			/>
			{ isFocused &&
				replies.map( ( reply ) => (
					<VStack
						key={ reply.id }
						className="editor-collab-sidebar-panel__child-thread"
						id={ reply.id }
						spacing="2"
					>
						<CommentBoard
							thread={ reply }
							onEdit={
								'approved' !== thread.status
									? onEditComment
									: undefined
							}
							onDelete={
								'approved' !== thread.status
									? onCommentDelete
									: undefined
							}
						/>
					</VStack>
				) ) }
			{ ! isFocused && restReplies.length > 0 && (
				<HStack className="editor-collab-sidebar-panel__more-reply-separator">
					<Button
						size="compact"
						variant="tertiary"
						className="editor-collab-sidebar-panel__more-reply-button"
						onClick={ () => setFocusThread( thread.id ) }
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
				</HStack>
			) }
			{ ! isFocused && lastReply && (
				<CommentBoard
					thread={ lastReply }
					onEdit={
						'approved' !== thread.status ? onEditComment : undefined
					}
					onDelete={
						'approved' !== thread.status
							? onCommentDelete
							: undefined
					}
				/>
			) }
			{ isFocused && (
				<VStack
					className="editor-collab-sidebar-panel__child-thread"
					spacing="2"
				>
					<HStack alignment="left" spacing="3" justify="flex-start">
						<CommentAuthorInfo />
					</HStack>
					<VStack spacing="2">
						<CommentForm
							onSubmit={ ( inputComment ) => {
								if ( 'approved' === thread.status ) {
									onEditComment( {
										id: thread.id,
										status: 'hold',
									} );
								}
								onAddReply( {
									content: inputComment,
									parent: thread.id,
								} );
							} }
							onCancel={ ( event ) => {
								event.stopPropagation(); // Prevent the parent onClick from being triggered
								clearThreadFocus();
							} }
							submitButtonText={
								'approved' === thread.status
									? __( 'Reopen & Reply' )
									: __( 'Reply' )
							}
						/>
					</VStack>
				</VStack>
			) }
		</VStack>
	);
}

const CommentBoard = ( { thread, onEdit, onDelete, status } ) => {
	const [ actionState, setActionState ] = useState( false );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const handleConfirmDelete = () => {
		onDelete( thread );
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const handleCancel = () => {
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const actions = [
		onEdit &&
			status !== 'approved' && {
				id: 'edit',
				title: _x( 'Edit', 'Edit comment' ),
				onClick: () => {
					setActionState( 'edit' );
				},
			},
		onDelete && {
			id: 'delete',
			title: _x( 'Delete', 'Delete comment' ),
			onClick: () => {
				setActionState( 'delete' );
				setShowConfirmDialog( true );
			},
		},
		onEdit &&
			status === 'approved' && {
				id: 'reopen',
				title: _x( 'Reopen', 'Reopen comment' ),
				onClick: () => {
					onEdit( { id: thread.id, status: 'hold' } );
				},
			},
	];

	const canResolve = thread?.parent === 0;
	const moreActions = actions.filter( ( item ) => item?.onClick );

	return (
		<>
			<HStack alignment="left" spacing="3" justify="flex-start">
				<CommentAuthorInfo
					avatar={ thread?.author_avatar_urls?.[ 48 ] }
					name={ thread?.author_name }
					date={ thread?.date }
					userId={ thread?.author }
				/>
				<span className="editor-collab-sidebar-panel__comment-status">
					<HStack alignment="right" justify="flex-end" spacing="0">
						{ canResolve && (
							<Button
								label={ _x(
									'Resolve',
									'Mark comment as resolved'
								) }
								size="small"
								icon={ published }
								disabled={ status === 'approved' }
								accessibleWhenDisabled={ status === 'approved' }
								onClick={ () => {
									onEdit( {
										id: thread.id,
										status: 'approved',
									} );
								} }
							/>
						) }
						<Menu placement="bottom-end">
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'Actions' ) }
										disabled={ ! moreActions.length }
										accessibleWhenDisabled
									/>
								}
							/>
							<Menu.Popover>
								{ moreActions.map( ( action ) => (
									<Menu.Item
										key={ action.id }
										onClick={ ( event ) => {
											event.stopPropagation();
											action.onClick();
										} }
									>
										<Menu.ItemLabel>
											{ action.title }
										</Menu.ItemLabel>
									</Menu.Item>
								) ) }
							</Menu.Popover>
						</Menu>
					</HStack>
				</span>
			</HStack>
			{ 'edit' === actionState ? (
				<CommentForm
					onSubmit={ ( value ) => {
						onEdit( {
							id: thread.id,
							content: value,
						} );
						setActionState( false );
					} }
					onCancel={ () => handleCancel() }
					thread={ thread }
					submitButtonText={ _x( 'Update', 'verb' ) }
				/>
			) : (
				<RawHTML className="editor-collab-sidebar-panel__user-comment">
					{ thread?.content?.rendered }
				</RawHTML>
			) }
			{ 'delete' === actionState && (
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirmDelete }
					onCancel={ handleCancel }
					confirmButtonText={ __( 'Delete' ) }
				>
					{
						// translators: message displayed when confirming an action
						__( 'Are you sure you want to delete this comment?' )
					}
				</ConfirmDialog>
			) }
		</>
	);
};
