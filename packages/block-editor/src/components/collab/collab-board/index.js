/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	TextControl,
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Modal,
} from '@wordpress/components';
import { dateI18n, format, getSettings } from '@wordpress/date';
import {
	commentAuthorAvatar as userIcon,
	Icon,
	trash as deleteIcon,
	edit as editIcon,
} from '@wordpress/icons';

import { useSelect, useDispatch } from '@wordpress/data';
//import { store as coreStore } from '@wordpress/core-data';
//import { useEntityProp } from '@wordpress/core-data';

export default function BlockCommentModal( { clientId, onClose, threadId } ) {
	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );
	const [ isResolved, setIsResolved ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( null );
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const curruntUserData = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core' ).getCurrentUser();
	}, [] );

	const userAvatar = curruntUserData.avatar_urls[ 48 ] || null;
	const currentUser = curruntUserData?.name || null;

	const allThreads = [];
	const currentThread = allThreads[ threadId ] ?? {};
	const isCurrentThreadResolved = currentThread.threadIsResolved || false;
	const commentsCount = isCurrentThreadResolved
		? 0
		: currentThread.comments?.length || 0;
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const postID = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	// Get the dispatch functions to save the comment and update the block attributes.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	// Helper function to generate a new comment.
	const generateNewComment = () => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment: inputComment,
		createdAt: new Date().toISOString(),
	} );

	// // Function to add a border class to the content reference.
	const setAttributes = () => {
		updateBlockAttributes( clientId, {
			className: `block-editor-collab__${ threadId }`,
		} );
	};

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

	// Function to save the comment.
	const saveComment = () => {
		const newComment = generateNewComment();
		threadId = newComment?.commentId;
		const updatedComments = getUpdatedComments( newComment, threadId );

		apiFetch( {
			path: '/wp/v2/comments',
			method: 'POST',
			data: {
				post: postID,
				content: newComment.comment,
				comment_date: newComment.createdAt,
				comment_type: 'block_comment',
				meta: updatedComments,
				comment_author: currentUser,
				comment_approved: 0,
			},
		} ).then( ( response ) => {
			threadId = response?.id;
			setAttributes( clientId, threadId );
			onClose();
		} );
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
		} else {
			updatedComments[ threadId ] = {
				...allThreads[ threadId ],
				comments: currentComments,
			};
		}
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

	// On cancel, remove the border if no comments are present.
	const handleCancel = () => {
		onClose();
	};

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;
	return (
		<>
			<Modal overlayClassName="block-editor-format-toolbar__comment-board">
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
											<VStack spacing="4">
												<HStack
													alignment="left"
													spacing="4"
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
														'Add comment'
													) }
													className="block-editor-format-toolbar__comment-input"
												/>
												<HStack
													alignment="right"
													spacing="2"
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
						<VStack spacing="4">
							{ 0 === commentsCount && (
								<HStack alignment="left" spacing="3">
									<img
										src={ userAvatar }
										alt={ __( 'User Icon' ) }
										className="comment-board__userIcon"
									/>
									<span className="comment-board__userName">
										{ currentUser }
									</span>
								</HStack>
							) }
							<TextControl
								value={ inputComment }
								onChange={ ( val ) => setInputComment( val ) }
								placeholder={ __( 'Add comment' ) }
								className="block-editor-format-toolbar__comment-input"
							/>
							<HStack alignment="right" spacing="3">
								<Button
									className="block-editor-format-toolbar__cancel-button"
									variant="tertiary"
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
			</Modal>
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
}
