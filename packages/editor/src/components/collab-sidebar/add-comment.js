/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';
import { dateI18n, format } from '@wordpress/date';
import {
	Icon,
	edit as editIcon,
	trash as deleteIcon,
	commentAuthorAvatar as userIcon,
} from '@wordpress/icons';

/**
 * Renders the new comment form.
 *
 * @param {Object}   root0                   The component props.
 * @param {Function} root0.setReloadComments Function to reload comments.
 */
export function AddComment( { setReloadComments } ) {
	const generateNewComment = () => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment: inputComment,
		createdAt: new Date().toISOString(),
	} );

	// Get the date time format from WordPress settings.
	const dateTimeFormat = 'h:i A';

	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );
	const [ isEditing, setIsEditing ] = useState( null );

	const curruntUserData = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core' ).getCurrentUser();
	}, [] );

	let userAvatar =
		'https://secure.gravatar.com/avatar/92929292929292929292929292929292?s=48&d=mm&r=g';
	if ( curruntUserData?.avatar_urls ) {
		userAvatar = curruntUserData?.avatar_urls[ 48 ];
	}

	//const userAvatar = curruntUserData?.avatar_urls[ 48 ] ? curruntUserData?.avatar_urls[ 48 ] : null;

	const currentUser = curruntUserData?.name || null;

	const allThreads = [];
	let threadId = 0;
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

	const clientId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return getSelectedBlockClientId();
	}, [] );

	const blockCommentId = useSelect( ( select ) => {
		const clientID =
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/block-editor' ).getSelectedBlockClientId();
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/block-editor' ).getBlock( clientID )?.attributes
			?.blockCommentId;
	}, [] );

	const showAddCommentBoard = useSelect( ( select ) => {
		const clientID =
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/block-editor' ).getSelectedBlockClientId();
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/block-editor' ).getBlock( clientID )?.attributes
			?.showCommentBoard;
	}, [] );

	// Get the dispatch functions to save the comment and update the block attributes.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// // Function to add a border class to the content reference.
	const setAttributes = ( commentID ) => {
		updateBlockAttributes( clientId, {
			blockCommentId: commentID,
		} );
	};

	// Function to save the comment.
	const saveComment = () => {
		const newComment = generateNewComment();
		threadId = newComment?.commentId;

		apiFetch( {
			path: '/wp/v2/comments',
			method: 'POST',
			data: {
				post: postID,
				content: newComment.comment,
				comment_date: newComment.createdAt,
				comment_type: 'block_comment',
				comment_author: currentUser,
				comment_approved: 0,
			},
		} ).then( ( response ) => {
			setAttributes( response?.id );
			setInputComment( '' );
			setReloadComments( true );
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

	const handleCancel = () => {
		updateBlockAttributes( clientId, {
			showCommentBoard: false,
		} );
	};

	return (
		<>
			{ showAddCommentBoard &&
				null !== clientId &&
				0 === blockCommentId && (
					<VStack spacing="3">
						{ 0 < commentsCount && ! isCurrentThreadResolved && currentThread.comments.map(
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
										<VStack
											spacing="3"
											className="editor-collab-sidebar__thread editor-collab-sidebar__activethread"
										>
											<HStack
												alignment="left"
												spacing="4"
											>
												<Icon
													icon={ userIcon }
													className="editor-collab-sidebar__userIcon"
													size={ 32 }
												/>
												<span className="editor-collab-sidebar__userName">
													{ currentUser }
												</span>
											</HStack>
											<TextControl
												value={ inputComment }
												onChange={ ( val ) =>
													setInputComment(
														val
													)
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
													text={ __(
														'Cancel'
													) }
													onClick={ () => {
														setIsEditing(
															false
														);
														setInputComment(
															''
														);

														handleCancel();
													} }
												/>
												<Button
													className="block-editor-format-toolbar__comment-button"
													variant="primary"
													text={
														0 ===
														commentsCount
															? __(
																	'Comment'
																)
															: __(
																	'Reply'
																)
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
											spacing="3"
											key={ timestamp }
											className="editor-collab-sidebar__thread"
										>
											<HStack
												alignment="top"
												spacing="2"
												justify="space-between"
											>
												<HStack
													alignment="left"
													spacing="3"
													justify="start"
												>
													<Icon
														icon={
															userIcon
														}
														className="editor-collab-sidebar__userIcon"
														size={ 32 }
													/>
													<VStack spacing="1">
														<span className="editor-collab-sidebar__userName">
															{
																createdBy
															}
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
																label={ __(
																	'Resolve'
																) }
															/>
														</div>
													) }
													<Button
														icon={
															editIcon
														}
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
														icon={
															deleteIcon
														}
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
						{ ! isEditing && (
							<VStack
								spacing="3"
								className="editor-collab-sidebar__thread editor-collab-sidebar__activethread"
							>
								{ 0 === commentsCount && (
									<HStack alignment="left" spacing="3">
										<img
											src={ userAvatar }
											alt={ __( 'User Icon' ) }
											className="editor-collab-sidebar__userIcon"
											size={ 32 }
										/>
										<span className="editor-collab-sidebar__userName">
											{ currentUser }
										</span>
									</HStack>
								) }
								<TextControl
									value={ inputComment }
									onChange={ ( val ) =>
										setInputComment( val )
									}
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
				) }
		</>
	);
}
