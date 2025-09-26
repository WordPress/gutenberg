/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useRef } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	FlexItem,
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
	const [ selectedThread = blockCommentId, setSelectedThread ] = useState();

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
			isSelected={ selectedThread === thread.id }
			setSelectedThread={ setSelectedThread }
			setShowCommentBoard={ setShowCommentBoard }
		/>
	) );
}

function Thread( {
	thread,
	onEditComment,
	onAddReply,
	onCommentDelete,
	isSelected,
	setSelectedThread,
	setShowCommentBoard,
} ) {
	const threadRef = useRef( null );
	const { flashBlock } = useDispatch( blockEditorStore );
	const relatedBlockElement = useBlockElement( thread.blockClientId );

	const handleCommentSelect = ( { id, blockClientId } ) => {
		setShowCommentBoard( false );
		setSelectedThread( id );
		if ( blockClientId && relatedBlockElement ) {
			relatedBlockElement.scrollIntoView( {
				behavior: 'instant',
				block: 'center',
			} );
			flashBlock( blockClientId );
		}
	};

	const focusThread = () => {
		threadRef.current?.focus();
	};

	const unselectThread = () => {
		setSelectedThread( null );
		setShowCommentBoard( false );
	};

	const replies = thread?.reply;
	const lastReply = !! replies.length
		? replies[ replies.length - 1 ]
		: undefined;
	const restReplies = !! replies.length ? replies.slice( 0, -1 ) : [];

	return (
		// Disable reason: role="listitem" does in fact support aria-expanded.
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': isSelected,
			} ) }
			id={ `thread-${ thread.id }` }
			spacing="2"
			onClick={ () => handleCommentSelect( thread ) }
			onKeyDown={ ( event ) => {
				// Expand or Collapse thread.
				if (
					event.key === 'Enter' &&
					event.currentTarget === event.target
				) {
					if ( isSelected ) {
						unselectThread();
					} else {
						handleCommentSelect( thread );
					}
				}
				// Collapse thread and focus the thread.
				if ( event.key === 'Escape' ) {
					unselectThread();
					focusThread();
				}
			} }
			tabIndex={ 0 }
			role="listitem"
			ref={ threadRef }
			aria-label={ thread?.content?.raw }
			aria-expanded={ isSelected }
		>
			<CommentBoard
				thread={ thread }
				onEdit={ ( params = {} ) => {
					const { status } = params;
					onEditComment( params );
					if ( status === 'approved' ) {
						unselectThread();
						focusThread();
					}
				} }
				onDelete={ onCommentDelete }
				status={ thread.status }
			/>
			{ isSelected &&
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
			{ ! isSelected && restReplies.length > 0 && (
				<HStack className="editor-collab-sidebar-panel__more-reply-separator">
					<Button
						size="compact"
						variant="tertiary"
						className="editor-collab-sidebar-panel__more-reply-button"
						onClick={ () => setSelectedThread( thread.id ) }
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
			{ ! isSelected && lastReply && (
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
			{ isSelected && (
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
								threadRef.current?.focus();
								event.stopPropagation(); // Prevent the parent onClick from being triggered
								unselectThread();
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
				/>
				<FlexItem
					className="editor-collab-sidebar-panel__comment-status"
					onClick={ ( event ) => {
						// Prevent the thread from being selected.
						event.stopPropagation();
					} }
				>
					<HStack spacing="0">
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
										onClick={ () => action.onClick() }
									>
										<Menu.ItemLabel>
											{ action.title }
										</Menu.ItemLabel>
									</Menu.Item>
								) ) }
							</Menu.Popover>
						</Menu>
					</HStack>
				</FlexItem>
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
