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
} from '@wordpress/components';
import { published, moreVertical } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';

/**
 * Renders the Comments component.
 *
 * @param {Object}   props                     - The component props.
 * @param {Array}    props.threads             - The array of comment threads.
 * @param {Function} props.onEditComment       - The function to handle comment editing.
 * @param {Function} props.onAddReply          - The function to add a reply to a comment.
 * @param {Function} props.onCommentDelete     - The function to delete a comment.
 * @param {Function} props.onCommentResolve    - The function to mark a comment as resolved.
 * @param {Function} props.onCommentReopen     - The function to reopen a resolved comment.
 * @param {boolean}  props.showCommentBoard    - Whether to show the comment board.
 * @param {Function} props.setShowCommentBoard - The function to set the comment board visibility.
 * @return {React.ReactNode} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	onCommentResolve,
	onCommentReopen,
	showCommentBoard,
	setShowCommentBoard,
} ) {
	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();

		return {
			blockCommentId: _clientId
				? getBlockAttributes( _clientId )?.blockCommentId
				: null,
		};
	}, [] );

	const [ focusThread, setFocusThread ] = useState(
		showCommentBoard && blockCommentId ? blockCommentId : null
	);

	const clearThreadFocus = () => {
		setFocusThread( null );
		setShowCommentBoard( false );
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
								'editor-collab-sidebar-panel__focus-thread':
									focusThread && focusThread === thread.id,
							}
						) }
						id={ thread.id }
						spacing="3"
						onClick={ () => setFocusThread( thread.id ) }
					>
						<Thread
							thread={ thread }
							onAddReply={ onAddReply }
							onCommentDelete={ onCommentDelete }
							onCommentResolve={ onCommentResolve }
							onCommentReopen={ onCommentReopen }
							onEditComment={ onEditComment }
							isFocused={ focusThread === thread.id }
							clearThreadFocus={ clearThreadFocus }
						/>
					</VStack>
				) ) }
		</>
	);
}

function Thread( {
	thread,
	onEditComment,
	onAddReply,
	onCommentDelete,
	onCommentResolve,
	onCommentReopen,
	isFocused,
	clearThreadFocus,
} ) {
	return (
		<>
			<CommentBoard
				thread={ thread }
				onResolve={ onCommentResolve }
				onReopen={ onCommentReopen }
				onEdit={ onEditComment }
				onDelete={ onCommentDelete }
				status={ thread.status }
			/>
			{ 0 < thread?.reply?.length && (
				<>
					{ ! isFocused && (
						<VStack className="editor-collab-sidebar-panel__show-more-reply">
							{ sprintf(
								// translators: %s: number of replies.
								_x( '%s more replies', 'Show replies button' ),
								thread?.reply?.length
							) }
						</VStack>
					) }

					{ isFocused &&
						thread.reply.map( ( reply ) => (
							<VStack
								key={ reply.id }
								className="editor-collab-sidebar-panel__child-thread"
								id={ reply.id }
								spacing="2"
							>
								{ 'approved' !== thread.status && (
									<CommentBoard
										thread={ reply }
										onEdit={ onEditComment }
										onDelete={ onCommentDelete }
									/>
								) }
								{ 'approved' === thread.status && (
									<CommentBoard thread={ reply } />
								) }
							</VStack>
						) ) }
				</>
			) }
			{ isFocused && (
				<VStack
					className="editor-collab-sidebar-panel__child-thread"
					spacing="2"
				>
					<HStack alignment="left" spacing="3" justify="flex-start">
						<CommentAuthorInfo />
					</HStack>
					<VStack
						spacing="3"
						className="editor-collab-sidebar-panel__comment-field"
					>
						<CommentForm
							onSubmit={ ( inputComment ) => {
								if ( 'approved' === thread.status ) {
									onCommentReopen( thread.id );
								}
								onAddReply( inputComment, thread.id );
							} }
							onCancel={ ( event ) => {
								event.stopPropagation(); // Prevent the parent onClick from being triggered
								clearThreadFocus();
							} }
							placeholderText={
								'approved' === thread.status &&
								__(
									'Adding a comment will re-open this discussion….'
								)
							}
							submitButtonText={
								'approved' === thread.status
									? _x(
											'Reopen & Reply',
											'Reopen comment and add reply'
									  )
									: _x( 'Reply', 'Add reply comment' )
							}
							rows={ 'approved' === thread.status ? 2 : 4 }
						/>
					</VStack>
				</VStack>
			) }
		</>
	);
}

const CommentBoard = ( {
	thread,
	onResolve,
	onReopen,
	onEdit,
	onDelete,
	status,
} ) => {
	const [ actionState, setActionState ] = useState( false );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const handleConfirmDelete = () => {
		onDelete( thread.id );
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
				title: _x( 'Edit', 'Edit comment' ),
				onClick: () => {
					setActionState( 'edit' );
				},
			},
		onDelete && {
			title: _x( 'Delete', 'Delete comment' ),
			onClick: () => {
				setActionState( 'delete' );
				setShowConfirmDialog( true );
			},
		},
		onReopen &&
			status === 'approved' && {
				title: _x( 'Reopen', 'Reopen comment' ),
				onClick: () => {
					onReopen( thread.id );
				},
			},
	];

	const moreActions = actions.filter( ( item ) => item?.onClick );

	return (
		<>
			<HStack alignment="left" spacing="3" justify="flex-start">
				<CommentAuthorInfo
					avatar={ thread?.author_avatar_urls?.[ 48 ] }
					name={ thread?.author_name }
					date={ thread?.date }
				/>
				<span className="editor-collab-sidebar-panel__comment-status">
					<HStack alignment="right" justify="flex-end" spacing="0">
						{ 0 === thread?.parent && onResolve && (
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
									onResolve( thread.id );
								} }
							/>
						) }
						{ 0 < moreActions.length && (
							<DropdownMenu
								icon={ moreVertical }
								label={ _x(
									'Select an action',
									'Select comment action'
								) }
								className="editor-collab-sidebar-panel__comment-dropdown-menu"
								controls={ moreActions }
							/>
						) }
					</HStack>
				</span>
			</HStack>
			{ 'edit' === actionState ? (
				<CommentForm
					onSubmit={ ( value ) => {
						onEdit( thread.id, value );
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
