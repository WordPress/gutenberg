/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useEffect, useRef } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	DropdownMenu,
	Tooltip,
} from '@wordpress/components';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockElement,
	store as blockEditorStore,
} from '@wordpress/block-editor';

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
	showCommentBoard,
	setShowCommentBoard,
} ) {
	const prevRef = useRef( null );

	const { blockCommentId, blocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSelectedBlockClientId, getBlocks } =
				select( blockEditorStore );
			const _clientId = getSelectedBlockClientId();

			return {
				blockCommentId: _clientId
					? getBlockAttributes( _clientId )?.blockCommentId
					: null,
				blocks: getBlocks(),
				selectedBlockClientId: _clientId,
			};
		},
		[]
	);

	// Track the currently highlighted block
	const [ highlightedBlockId, setHighlightedBlockId ] = useState( null );
	const highlightedBlockElement = useBlockElement( highlightedBlockId );

	const clearThreadFocus = () => {
		setFocusThread( null );
		setShowCommentBoard( false );
	};

	const [ focusThread, setFocusThread ] = useState(
		showCommentBoard && blockCommentId ? blockCommentId : null
	);

	const { toggleBlockHighlight } = useDispatch( blockEditorStore );

	// Effect to handle highlighting when selectedBlockClientId changes
	useEffect( () => {
		// Clear previous highlight
		if ( prevRef.current ) {
			toggleBlockHighlight( prevRef.current, false );
			prevRef.current = null;
		}

		if ( ! selectedBlockClientId ) {
			return;
		}

		// Highlight the selected block
		toggleBlockHighlight( selectedBlockClientId, true );
		prevRef.current = selectedBlockClientId;

		// Find and focus related comment
		const blockAttributes = blocks?.find(
			( block ) => block.clientId === selectedBlockClientId
		)?.attributes;
		if ( blockAttributes?.blockCommentId ) {
			setFocusThread( blockAttributes.blockCommentId );
		}

		return () => {
			if ( prevRef.current ) {
				toggleBlockHighlight( prevRef.current, false );
				prevRef.current = null;
			}
		};
	}, [ selectedBlockClientId, toggleBlockHighlight, blocks ] );

	// Effect to handle scrolling when highlighted block element changes
	useEffect( () => {
		if ( highlightedBlockElement ) {
			highlightedBlockElement.scrollIntoView( {
				behavior: 'smooth',
				block: 'center',
			} );
		}
	}, [ highlightedBlockElement ] );

	// Cleanup effect to clear highlight on unmount
	useEffect( () => {
		return () => {
			if ( highlightedBlockId ) {
				toggleBlockHighlight( highlightedBlockId, false );
			}
		};
	}, [ highlightedBlockId, toggleBlockHighlight ] );

	// Function to find and highlight blocks by comment ID (without selecting)
	const highlightBlocksByCommentId = ( commentId ) => {
		if ( ! commentId || ! blocks ) {
			return;
		}

		// Find blocks that have this comment ID
		const relatedBlocks = [];
		const findBlocks = ( blockList ) => {
			blockList.forEach( ( block ) => {
				if ( block.attributes?.blockCommentId === commentId ) {
					relatedBlocks.push( block.clientId );
				}
				if ( block.innerBlocks ) {
					findBlocks( block.innerBlocks );
				}
			} );
		};

		findBlocks( blocks );

		// Highlight the first related block if found (without selecting it)
		if ( relatedBlocks.length > 0 ) {
			const blockId = relatedBlocks[ 0 ];

			// Clear previous highlight
			if ( highlightedBlockId ) {
				toggleBlockHighlight( highlightedBlockId, false );
			}

			// Set new highlight
			setHighlightedBlockId( blockId );
			toggleBlockHighlight( blockId, true );
		}
	};

	// Handle comment selection
	const handleCommentSelect = ( threadId ) => {
		setFocusThread( threadId );
		highlightBlocksByCommentId( threadId );
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
								'editor-collab-sidebar-panel__focus-thread':
									focusThread === thread.id,
							}
						) }
						id={ thread.id }
						spacing="3"
						onClick={ () => handleCommentSelect( thread.id ) }
					>
						<Thread
							thread={ thread }
							onAddReply={ onAddReply }
							onCommentDelete={ onCommentDelete }
							onCommentResolve={ onCommentResolve }
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
	isFocused,
	clearThreadFocus,
} ) {
	return (
		<>
			<CommentBoard
				thread={ thread }
				onResolve={ onCommentResolve }
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
			{ 'approved' !== thread.status && isFocused && (
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
								onAddReply( inputComment, thread.id );
							} }
							onCancel={ ( event ) => {
								event.stopPropagation(); // Prevent the parent onClick from being triggered
								clearThreadFocus();
							} }
							submitButtonText={ _x(
								'Reply',
								'Add reply comment'
							) }
						/>
					</VStack>
				</VStack>
			) }
		</>
	);
}

const CommentBoard = ( { thread, onResolve, onEdit, onDelete, status } ) => {
	const [ actionState, setActionState ] = useState( false );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const handleConfirmDelete = () => {
		onDelete( thread.id );
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const handleConfirmResolve = () => {
		onResolve( thread.id );
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const handleCancel = () => {
		setActionState( false );
		setShowConfirmDialog( false );
	};

	const actions = [
		onEdit && {
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
					{ status !== 'approved' && (
						<HStack
							alignment="right"
							justify="flex-end"
							spacing="0"
						>
							{ 0 === thread?.parent && onResolve && (
								<Button
									label={ _x(
										'Resolve',
										'Mark comment as resolved'
									) }
									__next40pxDefaultSize
									icon={ published }
									onClick={ () => {
										setActionState( 'resolve' );
										setShowConfirmDialog( true );
									} }
									showTooltip
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
					) }
					{ status === 'approved' && (
						// translators: tooltip for resolved comment
						<Tooltip text={ __( 'Resolved' ) }>
							<Icon icon={ check } />
						</Tooltip>
					) }
				</span>
			</HStack>
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
					{ 'edit' === actionState && (
						<CommentForm
							onSubmit={ ( value ) => {
								onEdit( thread.id, value );
								setActionState( false );
							} }
							onCancel={ () => handleCancel() }
							thread={ thread }
							submitButtonText={ _x( 'Update', 'verb' ) }
						/>
					) }
					{ 'edit' !== actionState && (
						<RawHTML>{ thread?.content?.raw }</RawHTML>
					) }
				</VStack>
			</HStack>
			{ 'resolve' === actionState && (
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirmResolve }
					onCancel={ handleCancel }
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
			{ 'delete' === actionState && (
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirmDelete }
					onCancel={ handleCancel }
					confirmButtonText="Yes"
					cancelButtonText="No"
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
