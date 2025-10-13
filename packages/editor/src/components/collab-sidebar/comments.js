/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useEffect } from '@wordpress/element';
import {
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';

import { published, moreVertical } from '@wordpress/icons';
import { __, _x, sprintf, _n } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
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
import { getCommentExcerpt, focusCommentThread } from './utils';

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
 * @param {Ref}      props.commentSidebarRef   - The ref to the comment sidebar.
 * @return {React.ReactNode} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	setShowCommentBoard,
	commentSidebarRef,
} ) {
	const { blockCommentId, selectedBlockClientId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return {
			blockCommentId: clientId
				? getBlockAttributes( clientId )?.metadata?.commentId
				: null,
			selectedBlockClientId: clientId,
		};
	}, [] );
	const [ selectedThread = blockCommentId, setSelectedThread ] = useState();
	const relatedBlockElement = useBlockElement( selectedBlockClientId );

	const handleDelete = async ( comment ) => {
		const currentIndex = threads.findIndex( ( t ) => t.id === comment.id );
		const nextThread = threads[ currentIndex + 1 ];
		const prevThread = threads[ currentIndex - 1 ];

		await onCommentDelete( comment );

		// Focus logic after deletion completes.
		if ( nextThread ) {
			setSelectedThread( nextThread.id );
			focusCommentThread( nextThread.id, commentSidebarRef.current );
		} else if ( prevThread ) {
			setSelectedThread( prevThread.id );
			focusCommentThread( prevThread.id, commentSidebarRef.current );
		} else {
			setSelectedThread( null );
			setShowCommentBoard( false );
			// Focus the parent block instead of just scrolling into view.
			relatedBlockElement?.focus();
		}
	};

	// Auto-select the related comment thread when a block is selected.
	useEffect( () => {
		setSelectedThread( blockCommentId ?? undefined );
	}, [ blockCommentId ] );

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

	return (
		<VStack spacing="3">
			<Text as="p" variant="muted">
				{ __( 'Only logged in users can see Notes' ) }
			</Text>
			{ threads.map( ( thread ) => (
				<Thread
					key={ thread.id }
					thread={ thread }
					onAddReply={ onAddReply }
					onCommentDelete={ handleDelete }
					onEditComment={ onEditComment }
					isSelected={ selectedThread === thread.id }
					setSelectedThread={ setSelectedThread }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
			) ) }
		</VStack>
	);
}

function Thread( {
	thread,
	onEditComment,
	onAddReply,
	onCommentDelete,
	isSelected,
	setSelectedThread,
	setShowCommentBoard,
	commentSidebarRef,
} ) {
	const { toggleBlockHighlight, selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const relatedBlockElement = useBlockElement( thread.blockClientId );
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);

	const onMouseEnter = () => {
		debouncedToggleBlockHighlight( thread.blockClientId, true );
	};

	const onMouseLeave = () => {
		debouncedToggleBlockHighlight( thread.blockClientId, false );
	};

	const handleCommentSelect = () => {
		setShowCommentBoard( false );
		setSelectedThread( thread.id );
		// pass `null` as the second parameter to prevent focusing the block.
		selectBlock( thread.blockClientId, null );
		toggleBlockSpotlight( thread.blockClientId, true );
	};

	const unselectThread = () => {
		setSelectedThread( null );
		setShowCommentBoard( false );
		toggleBlockSpotlight( thread.blockClientId, false );
	};

	const replies = thread?.reply;
	const lastReply = !! replies.length
		? replies[ replies.length - 1 ]
		: undefined;
	const restReplies = !! replies.length ? replies.slice( 0, -1 ) : [];

	const commentExcerpt = getCommentExcerpt(
		stripHTML( thread.content.rendered ),
		10
	);
	const ariaLabel = relatedBlockElement
		? sprintf(
				// translators: %s: comment excerpt
				__( 'Comment: %s' ),
				commentExcerpt
		  )
		: sprintf(
				// translators: %s: comment excerpt
				__( 'Original block deleted. Comment: %s' ),
				commentExcerpt
		  );

	return (
		// Disable reason: role="listitem" does in fact support aria-expanded.
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': isSelected,
			} ) }
			id={ `comment-thread-${ thread.id }` }
			spacing="2"
			onClick={ handleCommentSelect }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			onKeyDown={ ( event ) => {
				// Expand or Collapse thread.
				if (
					event.key === 'Enter' &&
					event.currentTarget === event.target
				) {
					if ( isSelected ) {
						unselectThread();
					} else {
						handleCommentSelect();
					}
				}
				// Collapse thread and focus the thread.
				if ( event.key === 'Escape' ) {
					unselectThread();
					focusCommentThread( thread.id, commentSidebarRef.current );
				}
			} }
			tabIndex={ 0 }
			role="listitem"
			aria-label={ ariaLabel }
			aria-expanded={ isSelected }
		>
			<Button
				className="editor-collab-sidebar-panel__skip-to-comment"
				variant="secondary"
				size="compact"
				onClick={ () => {
					focusCommentThread(
						thread.id,
						commentSidebarRef.current,
						'textarea'
					);
				} }
			>
				{ __( 'Add new comment' ) }
			</Button>
			{ ! relatedBlockElement && (
				<Text as="p" weight={ 500 } variant="muted">
					{ __( 'Original block deleted.' ) }
				</Text>
			) }
			<CommentBoard
				thread={ thread }
				isExpanded={ isSelected }
				onEdit={ ( params = {} ) => {
					const { status } = params;
					onEditComment( params );
					if ( status === 'approved' ) {
						unselectThread();
						focusCommentThread(
							thread.id,
							commentSidebarRef.current
						);
					}
				} }
				onDelete={ onCommentDelete }
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
							parent={ thread }
							isExpanded={ isSelected }
							onEdit={ onEditComment }
							onDelete={ onCommentDelete }
						/>
					</VStack>
				) ) }
			{ ! isSelected && restReplies.length > 0 && (
				<HStack className="editor-collab-sidebar-panel__more-reply-separator">
					<Button
						size="compact"
						variant="tertiary"
						className="editor-collab-sidebar-panel__more-reply-button"
						onClick={ () => {
							setSelectedThread( thread.id );
							focusCommentThread(
								thread.id,
								commentSidebarRef.current
							);
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
				</HStack>
			) }
			{ ! isSelected && lastReply && (
				<CommentBoard
					thread={ lastReply }
					parent={ thread }
					isExpanded={ isSelected }
					onEdit={ onEditComment }
					onDelete={ onCommentDelete }
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
								unselectThread();
								focusCommentThread(
									thread.id,
									commentSidebarRef.current
								);
							} }
							submitButtonText={
								'approved' === thread.status
									? __( 'Reopen & Reply' )
									: __( 'Reply' )
							}
							rows={ 'approved' === thread.status ? 2 : 4 }
							labelText={ sprintf(
								// translators: %1$s: comment identifier, %2$s: author name
								__( 'Reply to Comment %1$s by %2$s' ),
								thread.id,
								thread?.author_name || 'Unknown'
							) }
						/>
					</VStack>
				</VStack>
			) }
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
		</VStack>
	);
}

const CommentBoard = ( { thread, parent, isExpanded, onEdit, onDelete } ) => {
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
		{
			id: 'edit',
			title: _x( 'Edit', 'Edit comment' ),
			isEligible: ( { status } ) => status !== 'approved',
			onClick: () => {
				setActionState( 'edit' );
			},
		},
		{
			id: 'reopen',
			title: _x( 'Reopen', 'Reopen comment' ),
			isEligible: ( { status } ) => status === 'approved',
			onClick: () => {
				onEdit( { id: thread.id, status: 'hold' } );
			},
		},
		{
			id: 'delete',
			title: _x( 'Delete', 'Delete comment' ),
			isEligible: () => true,
			onClick: () => {
				setActionState( 'delete' );
				setShowConfirmDialog( true );
			},
		},
	];

	const canResolve = thread.parent === 0;
	const moreActions =
		parent?.status !== 'approved'
			? actions.filter( ( item ) => item.isEligible( thread ) )
			: [];

	return (
		<>
			<HStack alignment="left" spacing="3" justify="flex-start">
				<CommentAuthorInfo
					avatar={ thread?.author_avatar_urls?.[ 48 ] }
					name={ thread?.author_name }
					date={ thread?.date }
					userId={ thread?.author }
				/>
				{ isExpanded && (
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
									disabled={ thread.status === 'approved' }
									accessibleWhenDisabled={
										thread.status === 'approved'
									}
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
				) }
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
					labelText={ sprintf(
						// translators: %1$s: comment identifier, %2$s: author name.
						__( 'Edit Comment %1$s by %2$s' ),
						thread.id,
						thread?.author_name || 'Unknown'
					) }
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
					{ __( 'Are you sure you want to delete this comment?' ) }
				</ConfirmDialog>
			) }
		</>
	);
};
