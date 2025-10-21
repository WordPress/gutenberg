/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useEffect, useCallback } from '@wordpress/element';
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
import { useFloatingThread } from './hooks';

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
 * @param {Function} props.reflowComments      - The function to call indicating a comment is updated.
 * @param {boolean}  props.isFloating          - Whether the comment thread is floating.
 * @param {number}   props.commentLastUpdated  - Timestamp of the last comment update.
 * @return {React.ReactNode} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	setShowCommentBoard,
	commentSidebarRef,
	reflowComments,
	isFloating = false,
	commentLastUpdated,
} ) {
	const [ heights, setHeights ] = useState( {} );
	const [ selectedThread, setSelectedThread ] = useState( null );
	const [ boardOffsets, setBoardOffsets ] = useState( {} );
	const [ blockRefs, setBlockRefs ] = useState( {} );

	const { blockCommentId, selectedBlockClientId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return {
			blockCommentId: clientId
				? getBlockAttributes( clientId )?.metadata?.noteId
				: null,
			selectedBlockClientId: clientId,
		};
	}, [] );

	const relatedBlockElement = useBlockElement( selectedBlockClientId );

	const handleDelete = async ( comment ) => {
		const currentIndex = threads.findIndex( ( t ) => t.id === comment.id );
		const nextThread = threads[ currentIndex + 1 ];
		const prevThread = threads[ currentIndex - 1 ];

		await onCommentDelete( comment );

		if ( comment.parent !== 0 ) {
			// Move focus to the parent thread when a reply was deleted.
			setSelectedThread( comment.parent );
			focusCommentThread( comment.parent, commentSidebarRef.current );
			return;
		}

		if ( nextThread ) {
			setSelectedThread( nextThread.id );
			focusCommentThread( nextThread.id, commentSidebarRef.current );
		} else if ( prevThread ) {
			setSelectedThread( prevThread.id );
			focusCommentThread( prevThread.id, commentSidebarRef.current );
		} else {
			setSelectedThread( null );
			setShowCommentBoard( false );
			// Move focus to the related block.
			relatedBlockElement?.focus();
		}
	};

	// Auto-select the related comment thread when a block is selected.
	useEffect( () => {
		setSelectedThread( blockCommentId ?? undefined );
	}, [ blockCommentId ] );

	const setBlockRef = useCallback( ( id, blockRef ) => {
		setBlockRefs( ( prev ) => ( { ...prev, [ id ]: blockRef } ) );
	}, [] );

	// Recalculate floating comment thread offsets whenever the heights change.
	useEffect( () => {
		/**
		 * Calculate the y offsets for all comment threads. Account for potentially
		 * overlapping threads and adjust their positions accordingly.
		 */
		const calculateAllOffsets = () => {
			const offsets = {};

			if ( ! isFloating ) {
				return offsets;
			}

			// Find the index of the selected thread.
			const selectedThreadIndex = threads.findIndex(
				( t ) => t.id === selectedThread
			);

			const breakIndex =
				selectedThreadIndex === -1 ? 0 : selectedThreadIndex;

			// If there is a selected thread, push threads above up and threads below down.
			const selectedThreadData = threads[ breakIndex ];

			if (
				! selectedThreadData ||
				! blockRefs[ selectedThreadData.id ]
			) {
				return offsets;
			}

			let blockElement = blockRefs[ selectedThreadData.id ];
			let blockRect = blockElement?.getBoundingClientRect();
			const selectedThreadTop = blockRect?.top || 0;
			const selectedThreadHeight = heights[ selectedThreadData.id ] || 0;

			offsets[ selectedThreadData.id ] = -16;

			let previousThreadData = {
				threadTop: selectedThreadTop - 16,
				threadHeight: selectedThreadHeight,
			};

			// Process threads after the selected thread, offsetting any overlapping
			// threads downward.
			for ( let i = breakIndex + 1; i < threads.length; i++ ) {
				const thread = threads[ i ];
				if ( ! blockRefs[ thread.id ] ) {
					continue;
				}

				blockElement = blockRefs[ thread.id ];
				blockRect = blockElement?.getBoundingClientRect();
				const threadTop = blockRect?.top || 0;
				const threadHeight = heights[ thread.id ] || 0;

				let additionalOffset = -16;

				// Check if the thread overlaps with the previous one.
				const previousBottom =
					previousThreadData.threadTop +
					previousThreadData.threadHeight;
				if ( threadTop < previousBottom + 16 ) {
					// Shift down by the difference plus a margin to avoid overlap.
					additionalOffset = previousBottom - threadTop + 20;
				}

				offsets[ thread.id ] = additionalOffset;

				// Update for next iteration.
				previousThreadData = {
					threadTop: threadTop + additionalOffset,
					threadHeight,
				};
			}

			// Process threads before the selected thread, offsetting any overlapping
			// threads upward.
			let nextThreadData = {
				threadTop: selectedThreadTop - 16,
			};

			for ( let i = selectedThreadIndex - 1; i >= 0; i-- ) {
				const thread = threads[ i ];
				if ( ! blockRefs[ thread.id ] ) {
					continue;
				}

				blockElement = blockRefs[ thread.id ];
				blockRect = blockElement?.getBoundingClientRect();
				const threadTop = blockRect?.top || 0;
				const threadHeight = heights[ thread.id ] || 0;

				let additionalOffset = -16;

				// Calculate the bottom position of this thread with default offset.
				const threadBottom = threadTop + threadHeight;

				// Check if this thread's bottom would overlap with the next thread's top.
				if ( threadBottom > nextThreadData.threadTop ) {
					// Shift up by the difference plus a margin to avoid overlap.
					additionalOffset =
						nextThreadData.threadTop -
						threadTop -
						threadHeight -
						20;
				}

				offsets[ thread.id ] = additionalOffset;

				// Update for next iteration (going upward).
				nextThreadData = {
					threadTop: threadTop + additionalOffset,
				};
			}
			return offsets;
		};
		const newOffsets = calculateAllOffsets();
		if ( Object.keys( newOffsets ).length > 0 ) {
			setBoardOffsets( newOffsets );
		}
	}, [ heights, blockRefs, isFloating, threads, selectedThread ] );

	const hasThreads = Array.isArray( threads ) && threads.length > 0;
	if ( ! hasThreads && ! isFloating ) {
		return (
			<VStack alignment="left" justify="flex-start" spacing="2">
				<Text as="p">{ __( 'No notes available.' ) }</Text>
				<Text as="p" variant="muted">
					{ __( 'Only logged in users can see Notes.' ) }
				</Text>
			</VStack>
		);
	}

	return (
		<VStack spacing="3">
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
					reflowComments={ reflowComments }
					isFloating={ isFloating }
					calculatedOffset={ boardOffsets[ thread.id ] ?? 0 }
					setHeights={ setHeights }
					setBlockRef={ setBlockRef }
					selectedThread={ selectedThread }
					commentLastUpdated={ commentLastUpdated }
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
	setShowCommentBoard,
	commentSidebarRef,
	reflowComments,
	isFloating,
	calculatedOffset,
	setHeights,
	setBlockRef,
	setSelectedThread,
	selectedThread,
	commentLastUpdated,
} ) {
	const { toggleBlockHighlight, selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const relatedBlockElement = useBlockElement( thread.blockClientId );
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const { y, refs } = useFloatingThread( {
		thread,
		calculatedOffset,
		setHeights,
		setBlockRef,
		selectedThread,
		commentLastUpdated,
	} );

	const onMouseEnter = () => {
		debouncedToggleBlockHighlight( thread.blockClientId, true );
	};

	const onMouseLeave = () => {
		debouncedToggleBlockHighlight( thread.blockClientId, false );
	};

	const handleCommentSelect = () => {
		setShowCommentBoard( false );
		setSelectedThread( thread.id );
		if ( !! thread.blockClientId ) {
			// Pass `null` as the second parameter to prevent focusing the block.
			selectBlock( thread.blockClientId, null );
			toggleBlockSpotlight( thread.blockClientId, true );
		}
	};

	const unselectThread = () => {
		setSelectedThread( null );
		setShowCommentBoard( false );
		toggleBlockSpotlight( thread.blockClientId, false );
	};

	const allReplies = thread?.reply || [];

	const lastReply =
		allReplies.length > 0 ? allReplies[ allReplies.length - 1 ] : undefined;
	const restReplies = allReplies.length > 0 ? allReplies.slice( 0, -1 ) : [];

	const commentExcerpt = getCommentExcerpt(
		stripHTML( thread.content.rendered ),
		10
	);
	const ariaLabel = !! thread.blockClientId
		? sprintf(
				// translators: %s: note excerpt
				__( 'Note: %s' ),
				commentExcerpt
		  )
		: sprintf(
				// translators: %s: note excerpt
				__( 'Original block deleted. Note: %s' ),
				commentExcerpt
		  );

	return (
		// Disable reason: role="listitem" does in fact support aria-expanded.
		// eslint-disable-next-line jsx-a11y/role-supports-aria-props
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': isSelected,
				'is-floating': isFloating,
			} ) }
			id={ `comment-thread-${ thread.id }` }
			spacing="3"
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
			ref={ isFloating ? refs.setFloating : undefined }
			style={ isFloating ? { top: y } : undefined }
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
				{ __( 'Add new note' ) }
			</Button>
			{ ! thread.blockClientId && (
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
				reflowComments={ reflowComments }
			/>
			{ isSelected &&
				allReplies.map( ( reply ) => (
					<CommentBoard
						key={ reply.id }
						thread={ reply }
						parent={ thread }
						isExpanded={ isSelected }
						onEdit={ onEditComment }
						onDelete={ onCommentDelete }
						reflowComments={ reflowComments }
					/>
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
					reflowComments={ reflowComments }
				/>
			) }
			{ isSelected && (
				<VStack spacing="2">
					<HStack alignment="left" spacing="3" justify="flex-start">
						<CommentAuthorInfo />
					</HStack>
					<VStack spacing="2">
						<CommentForm
							onSubmit={ ( inputComment ) => {
								if ( 'approved' === thread.status ) {
									// For reopening, include the content in the reopen action.
									onEditComment( {
										id: thread.id,
										status: 'hold',
										content: inputComment,
									} );
								} else {
									// For regular replies, add as separate comment.
									onAddReply( {
										content: inputComment,
										parent: thread.id,
									} );
								}
							} }
							onCancel={ ( event ) => {
								// Prevent the parent onClick from being triggered.
								event.stopPropagation();
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
								// translators: %1$s: note identifier, %2$s: author name
								__( 'Reply to note %1$s by %2$s' ),
								thread.id,
								thread.author_name
							) }
							reflowComments={ reflowComments }
						/>
					</VStack>
				</VStack>
			) }
			{ !! thread.blockClientId && (
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
			) }
		</VStack>
	);
}

const CommentBoard = ( {
	thread,
	parent,
	isExpanded,
	onEdit,
	onDelete,
	reflowComments,
} ) => {
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

	// Check if this is a resolution comment by checking metadata.
	const isResolutionComment =
		thread.type === 'note' &&
		thread.meta &&
		( thread.meta._wp_note_status === 'resolved' ||
			thread.meta._wp_note_status === 'reopen' );

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
				onEdit( { id: thread.id, status: 'hold' } );
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

	const canResolve = thread.parent === 0;
	const moreActions =
		parent?.status !== 'approved'
			? actions.filter( ( item ) => item.isEligible( thread ) )
			: [];

	return (
		<VStack spacing="2">
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
										'Mark note as resolved'
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
						// translators: %1$s: note identifier, %2$s: author name.
						__( 'Edit note %1$s by %2$s' ),
						thread.id,
						thread.author_name
					) }
					reflowComments={ reflowComments }
				/>
			) : (
				<RawHTML
					className={ clsx(
						'editor-collab-sidebar-panel__user-comment',
						{
							'editor-collab-sidebar-panel__resolution-text':
								isResolutionComment,
						}
					) }
				>
					{ isResolutionComment
						? ( () => {
								const actionText =
									thread.meta._wp_note_status === 'resolved'
										? __( 'Marked as resolved' )
										: __( 'Reopened' );
								const content = thread?.content?.raw;

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
						: thread?.content?.rendered }
				</RawHTML>
			) }
			{ 'delete' === actionState && (
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirmDelete }
					onCancel={ handleCancel }
					confirmButtonText={ __( 'Delete' ) }
				>
					{ __( 'Are you sure you want to delete this note?' ) }
				</ConfirmDialog>
			) }
		</VStack>
	);
};

export default Comments;
