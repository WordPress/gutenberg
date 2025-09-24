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
				spacing="3"
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
			onCommentResolve={ onCommentResolve }
			onCommentReopen={ onCommentReopen }
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
	onCommentResolve,
	onCommentReopen,
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

	return (
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'editor-collab-sidebar-panel__focus-thread': isFocused,
			} ) }
			id={ thread.id }
			spacing="3"
			onClick={ () => handleCommentSelect( thread ) }
		>
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
						<Button
							__next40pxDefaultSize
							variant="link"
							className="editor-collab-sidebar-panel__show-more-reply"
							onClick={ () => setFocusThread( thread.id ) }
						>
							{ sprintf(
								// translators: %s: number of replies.
								_n(
									'%s more reply',
									'%s more replies',
									thread?.reply?.length
								),
								thread?.reply?.length
							) }
						</Button>
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
		</VStack>
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
