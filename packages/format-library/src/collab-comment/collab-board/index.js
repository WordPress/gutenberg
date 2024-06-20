/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Popover,
	TextControl,
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Modal,
} from '@wordpress/components';
import { useAnchor } from '@wordpress/rich-text';
import {
	commentAuthorAvatar as userIcon,
	Icon,
	trash as deleteIcon,
	edit as editIcon,
} from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
import { dateI18n, format, getSettings } from '@wordpress/date';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * CollabBoard component.
 *
 * @param {Object}   props            Component props.
 * @param {Object}   props.contentRef Reference to the content.
 * @param {Function} props.onClose    Function to close the popover.
 *
 * @return {Object} CollabBoard component.
 */
const CollabBoard = ( { threadId, setThreadId, contentRef, onClose } ) => {
	console.log( 'CollabBoard' ,threadId);
	// Get the anchor for the popover.
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
	} );
	// const classList = contentRef.current?.classList?.value
	// 	.split( ' ' )
	// 	.find( ( className ) =>
	// 		className.startsWith( 'block-editor-collab__' )
	// 	);

	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );
	const [ isResolved, setIsResolved ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( null );
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	// const [ threadId, setThreadId ] = useState(
	// 	classList
	// 		? classList.slice( 'block-editor-collab__'.length )
	// 		: Date.now()
	// );

	// Get the dispatch functions to save the comment and update the block attributes.
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Add border to the block if threadId exists.
	useEffect( () => {
		if ( threadId ) {
			addBorder();
		}
	}, [ threadId ] );

	// Fetch the current post, current user, and the selected block clientId.
	const { postType, currentUser, clientId } = useSelect(
		( select ) => {
			return {
				postType: select( editorStore ).getCurrentPostType(),
				currentUser: select( coreStore ).getCurrentUser()?.name || null,
				clientId:
					select( blockEditorStore ).getSelectedBlockClientId() ||
					null,
			};
		},
		[ threadId ]
	);

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	const allThreads = meta?.collab ? JSON.parse( meta.collab ) : [];
	const currentThread = allThreads[ threadId ] ?? {};
	const isCurrentThreadResolved = currentThread.threadIsResolved || false;
	const commentsCount = isCurrentThreadResolved
		? 0
		: currentThread.comments?.length || 0;

	// Helper function to generate a new comment.
	const generateNewComment = () => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment: inputComment,
		createdAt: new Date().toISOString(),
	} );

	// Helper function to get updated comments structure
	const getUpdatedComments = ( newComment, threadKey ) => ( {
		...allThreads,
		[ threadKey ]: {
			isResolved,
			createdAt:
				allThreads?.threadKey?.createdAt || new Date().toISOString(),
			createdBy: currentUser,
			comments: [
				...( allThreads[ threadKey ]?.comments || [] ),
				newComment,
			],
		},
	} );

	const updateCommentMeta = ( updatedComments ) => {
		setMeta( { ...meta, collab: JSON.stringify( updatedComments ) } );
	};

	// Function to save the comment.
	const saveComment = () => {
		const newComment = generateNewComment();
		const updatedComments = getUpdatedComments( newComment, threadId );

		updateCommentMeta( updatedComments );
		setInputComment( '' );
	};

	// Function to edit the comment.
	const editComment = ( commentId ) => {
		const editedComments = { ...allThreads };

		if (
			editedComments[ threadId ] &&
			editedComments[ threadId ].comments
		) {
			editedComments[ threadId ].comments.map( ( comment ) => {
				if ( comment.commentId === commentId ) {
					comment.comment = inputComment;
					comment.date = new Date().toISOString();
				}
				return comment;
			} );
		}

		updateCommentMeta( editedComments );
		setInputComment( '' );
		setIsEditing( null );
	};

	// Function to mark thread as resolved
	const markThreadAsResolved = () => {
		setIsResolved( true );

		const updatedComments = { ...allThreads };

		updatedComments[ threadId ] = {
			...updatedComments[ threadId ],
			isResolved: true,
			resolvedBy: currentUser,
			resolvedAt: new Date().toISOString(),
		};

		// Save the updated comments.
		updateCommentMeta( updatedComments );
		removeBorder();
		setThreadId( null );
		onClose();
	};

	// Function to delete a comment.
	const deleteComment = ( commentId ) => {
		// Filter out the comment to be deleted.
		const currentComments = allThreads[ threadId ].comments.filter(
			( comment ) => comment.commentId !== commentId
		);

		const updatedComments = { ...allThreads };

		// If there are no comments, delete the thread.
		if ( currentComments.length === 0 ) {
			delete updatedComments[ threadId ];

			// Remove the className from the block.
			removeBorder();
			setThreadId( null );
		} else {
			updatedComments[ threadId ] = {
				...allThreads[ threadId ],
				comments: currentComments,
			};
		}

		// Save the updated comments.
		updateCommentMeta( updatedComments );
	};

	// Function to show the confirmation overlay.
	const showConfirmationOverlay = () => setShowConfirmation( true );

	// Function to hide the confirmation overlay.
	const hideConfirmationOverlay = () => setShowConfirmation( false );

	// Function to confirm and mark thread as resolved.
	const confirmAndMarkThreadAsResolved = () => {
		markThreadAsResolved();
		hideConfirmationOverlay();
	};

	// Function to add a border class to the content reference.
	const addBorder = () => {
		if ( contentRef.current ) {
			updateBlockAttributes( clientId, {
				className: `block-editor-collab__${ threadId }`,
			} );
		}
	};

	// Function to remove the border class from the content reference.
	const removeBorder = () => {
		if ( contentRef.current ) {
			updateBlockAttributes( clientId, {
				className: clientId.replace(
					`block-editor-collab__${ threadId }`,
					''
				),
			} );
		}
	};

	// On cancel, remove the border if no comments are present.
	const handleCancel = () => {
		if ( 0 === commentsCount ) {
			removeBorder();
		}
		onClose();
	};

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;

	return (
		<>
			<Popover
				className="block-editor-format-toolbar__comment-board"
				anchor={ popoverAnchor }
			>
				<VStack spacing="3">
					{ 0 < commentsCount && ! isCurrentThreadResolved && (
						<>
							{ currentThread.comments.map(
								(
									{
										createdBy,
										comment,
										timestamp,
										commentId,
									},
									index
								) => (
									<>
										{ isEditing === commentId && (
											<VStack spacing="2">
												<HStack
													alignment="left"
													spacing="3"
												>
													<Icon
														icon={ userIcon }
														className="comment-board__userIcon"
														size={ 45 }
													/>
													<span className="comment-board__userName">
														{ currentUser }
													</span>
												</HStack>
												<TextControl
													value={ inputComment }
													onChange={ ( val ) =>
														setInputComment( val )
													}
													placeholder={ __(
														'Comment or add others with @'
													) }
													className="block-editor-format-toolbar__comment-input"
												/>
												<HStack
													alignment="right"
													spacing="1"
												>
													<Button
														className="block-editor-format-toolbar__cancel-button"
														variant="secondary"
														text={ __( 'Cancel' ) }
														onClick={ () => {
															setIsEditing(
																false
															);
															setInputComment(
																''
															);
														} }
													/>
													<Button
														className="block-editor-format-toolbar__comment-button"
														variant="primary"
														text={
															0 === commentsCount
																? __(
																		'Comment'
																  )
																: __( 'Reply' )
														}
														disabled={
															0 ===
															inputComment.length
														}
														__experimentalIsFocusable
														onClick={ () =>
															editComment(
																commentId
															)
														}
													/>
												</HStack>
											</VStack>
										) }
										{ isEditing !== commentId && (
											<VStack
												spacing="2"
												key={ timestamp }
												className="comment-board__comment"
											>
												<HStack
													alignment="top"
													spacing="1"
													justify="space-between"
												>
													<HStack
														alignment="left"
														spacing="3"
														justify="start"
													>
														<Icon
															icon={ userIcon }
															className="comment-board__userIcon"
															size={ 45 }
														/>
														<VStack spacing="1">
															<span className="comment-board__userName">
																{ createdBy }
															</span>
															<time
																className="comment-board__dateTime"
																dateTime={ format(
																	'c',
																	timestamp
																) }
															>
																{ dateI18n(
																	dateTimeFormat,
																	timestamp
																) }
															</time>
														</VStack>
													</HStack>
													<HStack
														alignment="right"
														spacing="1"
														justify="end"
														className="comment-board__actions"
													>
														{ index === 0 && (
															<div
																className="block-editor-format-toolbar__comment-board__resolved"
																title={ __(
																	'Mark as resolved'
																) }
															>
																<CheckboxControl
																	checked={
																		isResolved
																	}
																	onChange={ () =>
																		showConfirmationOverlay()
																	}
																	label={ __(
																		'Resolve'
																	) }
																/>
															</div>
														) }
														<Button
															icon={ editIcon }
															className="block-editor-format-toolbar__comment-board__edit"
															label={ __(
																'Edit comment'
															) }
															onClick={ () => {
																setIsEditing(
																	commentId
																);
																setInputComment(
																	comment
																);
															} }
														/>
														<Button
															icon={ deleteIcon }
															label={ __(
																'Delete comment'
															) }
															onClick={ () =>
																deleteComment(
																	commentId
																)
															}
														/>
													</HStack>
												</HStack>
												<p className="comment-board__commentText">
													{ comment }
												</p>
											</VStack>
										) }
									</>
								)
							) }
						</>
					) }
					{ ! isEditing && (
						<VStack spacing="2">
							{ 0 === commentsCount && (
								<HStack alignment="left" spacing="3">
									<Icon
										icon={ userIcon }
										className="comment-board__userIcon"
										size={ 45 }
									/>
									<span className="comment-board__userName">
										{ currentUser }
									</span>
								</HStack>
							) }
							<TextControl
								value={ inputComment }
								onChange={ ( val ) => setInputComment( val ) }
								placeholder={ __(
									'Comment or add others with @'
								) }
								className="block-editor-format-toolbar__comment-input"
							/>
							<HStack alignment="right" spacing="1">
								<Button
									className="block-editor-format-toolbar__cancel-button"
									variant="secondary"
									text={ __( 'Cancel' ) }
									onClick={ () => handleCancel() }
								/>
								<Button
									className="block-editor-format-toolbar__comment-button"
									variant="primary"
									text={
										0 === commentsCount
											? __( 'Comment' )
											: __( 'Reply' )
									}
									disabled={ 0 === inputComment.length }
									__experimentalIsFocusable
									onClick={ () => saveComment() }
								/>
							</HStack>
						</VStack>
					) }
				</VStack>
			</Popover>
			{ showConfirmation && (
				<Modal
					title={ __( 'Confirm' ) }
					onRequestClose={ () => hideConfirmationOverlay() }
					className="confirmation-overlay"
				>
					<p>
						{ __(
							'Are you sure you want to mark this thread as resolved?'
						) }
					</p>
					<Button
						variant="primary"
						onClick={ () => confirmAndMarkThreadAsResolved() }
					>
						{ __( 'Yes' ) }
					</Button>
					<Button onClick={ () => hideConfirmationOverlay() }>
						{ __( 'No' ) }
					</Button>
				</Modal>
			) }
		</>
	);
};

export default CollabBoard;
