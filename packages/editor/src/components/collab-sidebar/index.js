/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, RawHTML } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Button,
	DropdownMenu,
	TextareaControl,
	Tooltip,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';
import { dateI18n, format, getSettings } from '@wordpress/date';
import {
	comment as commentIcon,
	Icon,
	check,
	published,
	moreVertical
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
//import BlockCommentModal from '../../../../block-editor/src/components/collab/collab-board';

const isBlockCommentExperimentEnabled = window?.__experimentalEnableBlockComment;

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	
	const postId = useSelect((select) => {
		return select('core/editor').getCurrentPostId();
	}, []);

	const [threads, setThreads] = useState([]);
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const [ showConfirmationTabId, setShowConfirmationTabId ] = useState( 0 );
	const [ commentConfirmation, setCommentConfirmation ] = useState( false );
	const [ deleteCommentShowConfirmation, setDeleteCommentShowConfirmation ] = useState( false );
	const [ commentDeleteMessage, setCommentDeleteMessage ] = useState( false );
	const [ commentEdit, setCommentEdit ] = useState( false );
	const [ newEditedComment, setNewEditedComment ] = useState( '' );
	const [ commentEditedMessage, setCommentEditedMessage ] = useState( false );
	const [ hasCommentReply, setHasCommentReply ] = useState( false );
	const [ commentReply, setCommentReply ] = useState( '' );
	const [ replyMessage, setReplyMessage ] = useState( false );

	// useEffect(() => {
	// 	if (postId) {
	// 		apiFetch({
	// 			path: '/wp/v2/comments?post=' + postId + '&type=block_comment' + '&status=any&per_page=100',
	// 			method: 'GET',
	// 		})
	// 		.then((response) => {
	// 			const filteredComments = response.filter( comment => comment.status !== 'trash' );
	// 			setThreads(Array.isArray(filteredComments) ? filteredComments : []);
	// 		});
	// 	}
	// }, [postId]);

	useEffect(() => {
		if (postId) {
			apiFetch({
				path: '/wp/v2/comments?post=' + postId + '&type=block_comment' + '&status=any&per_page=100',
				method: 'GET',
			})
			.then((data) => {

				// Create a compare to store the references to all objects by id
				const compare = {};
				const result = [];
			
				// Initialize each object with an empty `reply` array
				data.forEach(item => {
					compare[item.id] = { ...item, reply: [] };
				});
			
				// Iterate over the data to build the tree structure
				data.forEach(item => {
					if (item.parent === 0) {
						// If parent is 0, it's a root item, push it to the result array
						result.push(compare[item.id]);
					} else {
						// Otherwise, find its parent and push it to the parent's `reply` array
						if (compare[item.parent]) {
							if( 'trash' !== item.status ) {
								compare[item.parent].reply.push(compare[item.id]);
							}
						}
					}
				});
				const filteredComments = result.filter(comment => comment.status !== 'trash');
				setThreads(Array.isArray(filteredComments) ? filteredComments : []);

			})
		}
	}, [postId]);

	const { threads: selectedThreads } = useSelect(() => {
		return {
			threads: threads,
		};
	}, [threads]);

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	const confirmAndMarkThreadAsResolved = ( threadID ) => {
		setCommentConfirmation( false );
		if (threadID) {
			apiFetch({
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					status: 'approved',
				}
			})
			.then((response) => {
				if ( 'approved' === response.status ) {
					setShowConfirmation( false );
					setCommentConfirmation( true );
				}
			})
		}
	};

	const onEditComment = ( threadID ) => {
		if ( threadID ) {
			setHasCommentReply( false );
			setCommentEdit( true );
		}
	};

	const confirmEditComment = ( threadID ) => {
		if (threadID) {
			const editedComment = newEditedComment.replace(/^<p>|<\/p>$/g, '');

			apiFetch({
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					content: editedComment,
				}
			})
			.then((response) => {
				if ( 'trash' !== response.status && '' !== response.id ) {
					setCommentEdit( false );
					setCommentEditedMessage( true );
				}
			})
		}
	};

	const confirmDeleteComment = ( threadID ) => {
		setDeleteCommentShowConfirmation( false );
		if (threadID) {
			apiFetch({
				path: '/wp/v2/comments/' + threadID,
				method: 'DELETE',
			})
			.then((response) => {
				if ( 'trash' === response.status && '' !== response.id ) {
					setCommentDeleteMessage( true );
				}
			})
		}
	};

	const onReplyComment = ( threadID ) => {
		if ( threadID ) {
			setCommentEdit( false );
			setHasCommentReply( true );
		}
	};

	const confirmReplyComment = ( threadID ) => {
		if (threadID) {

			const newComment = generateReplyComment( commentReply );
			const commentId = newComment?.commentId;
			const updatedComments = getUpdatedComments( newComment, commentId );

			apiFetch({
				path: '/wp/v2/comments/',
				method: 'POST',
				data: {
					parent: threadID,
					post: postID,
					content: newComment.comment,
					comment_date: newComment.createdAt,
					comment_type: 'block_comment',
					comment_author: currentUser,
					comment_approved: 0,
				}
			})
			.then((response) => {
				if ( 'trash' !== response.status && '' !== response.id ) {
					setReplyMessage( true );
				}
			})
		}
	}

	// Helper function to get updated comments structure
	const getUpdatedComments = ( newComment, threadKey ) => ( {
		...threads,
		[ threadKey ]: {
			isResolved: false,
			createdAt:
				threads?.threadKey?.createdAt || new Date().toISOString(),
			createdBy: currentUser,
			comments: {
				0: newComment,
			},
		},
	} );

	const generateReplyComment = (comment) => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment,
		createdAt: new Date().toISOString(),
	} );

	const generateNewComment = () => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment: inputComment,
		createdAt: new Date().toISOString(),
	} );

	// Get the date time format from WordPress settings.
	const dateTimeFormat = 'h:i A';
	const resultThreads = selectedThreads.map(thread => thread).reverse();

	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );
	const [ isResolved, setIsResolved ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( null );
	const curruntUserData = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core' ).getCurrentUser();
	}, [] );

	let userAvatar = 'https://secure.gravatar.com/avatar/92929292929292929292929292929292?s=48&d=mm&r=g';
	if( curruntUserData?.avatar_urls ) {
		userAvatar = curruntUserData?.avatar_urls[ 48 ];
	}
	
	//const userAvatar = curruntUserData?.avatar_urls[ 48 ] ? curruntUserData?.avatar_urls[ 48 ] : null;
	
	const currentUser = curruntUserData?.name || null;

	const allThreads = [];
	const threadId = 0;
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

	const clientId = useSelect((select) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
        const { getSelectedBlockClientId } = select('core/block-editor');
        return getSelectedBlockClientId();
    }, []);

	const blockClassName = useSelect((select) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/block-editor' ).getBlock( select('core/block-editor').getSelectedBlockClientId() )?.attributes?.className;
	}, []);

	// Get the dispatch functions to save the comment and update the block attributes.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// // Function to add a border class to the content reference.
	const setAttributes = () => {
		updateBlockAttributes( clientId, {
			className: `block-editor-collab__${ threadId }`,
		} );
	};

	// Function to save the comment.
	const saveComment = () => {
		const newComment = generateNewComment();
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
		} ).then( (response) => {
			const threadId = response?.id;
			setAttributes( clientId, threadId );
			setInputComment('');
			//onClose();
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


	// On cancel, remove the border if no comments are present.
	const handleCancel = () => {
		//onClose();
	};
	

	return (
		<PluginSidebar
			name="collab-activities"
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">

				{ null !== clientId && undefined === blockClassName && (
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
															width={32}
															height={32}
														/>
														<span className="editor-collab-sidebar__userName">
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
															className="block-editor-format-toolbar__cancel-button is-compact"
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
															className="block-editor-format-toolbar__comment-button is-compact"
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
																icon={ userIcon }
																className="editor-collab-sidebar__userIcon"
																size={ 32 }
																width={32}
																height={32}
															/>
															<VStack spacing="1">
																<span className="editor-collab-sidebar__userName">
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
											width={32}
											height={32}
										/>
										<span className="editor-collab-sidebar__userName">
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
										className="block-editor-format-toolbar__cancel-button is-compact"
										variant="tertiary"
										text={ __( 'Cancel' ) }
										onClick={ () => handleCancel() }
									/>
									<Button
										className="block-editor-format-toolbar__comment-button is-compact"
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
					)
				}	
				
				{
					// If there are no threads, show a message indicating no threads are available.
					(!Array.isArray(resultThreads) || resultThreads.length === 0) && (
						<VStack
							className="editor-collab-sidebar__thread"
							spacing="3"
						>
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
							>
								{ __( 'No comments available' ) }
							</HStack>
						</VStack>
					)
				}
				{ Array.isArray(resultThreads) && resultThreads.length > 0 &&
					resultThreads.reverse().map((thread) => (
						<VStack
							key={ thread.id }
							className="editor-collab-sidebar__thread"
							id={thread.id}
							spacing="2"
						>
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
							>
								<img
									src={thread?.author_avatar_urls?.[48]}
									className="editor-collab-sidebar__userIcon"
									alt={ __( 'User avatar' ) }
									width={32}
									height={32}
								/>
								<VStack
									spacing="0"
								>
									<span className="editor-collab-sidebar__userName">
										{ thread.author_name }
									</span>
									<time
										dateTime={ format('h:i A', thread.date) }
										className="editor-collab-sidebar__usertime"
									>
										{ dateI18n(dateTimeFormat, thread.date) }
									</time>
								</VStack>
								<span className="editor-collab-sidebar__commentUpdate">
									{ thread.status !== 'approved' &&
										<HStack
											alignment="right"
											justify="flex-end"
											spacing="0"
										>
											<Tooltip text={ __( 'Resolve' ) }>
												<Button className="is-compact has-icon">
													<Icon icon={ published } onClick={
														() => {
															setCommentConfirmation( false );
															setShowConfirmation( true )
															setShowConfirmationTabId( thread.id )
														}
													} />
												</Button>
											</Tooltip>
											{ 0 === thread.parent ? (
											<DropdownMenu
												icon={ moreVertical }
												label="Select an action"
												className="is-compact"
												controls={ [
													{
														title: __( 'Edit' ),
														onClick: () => {
															setShowConfirmationTabId( thread.id );
															onEditComment( thread.id );
														}
													},
													{
														title: __( 'Delete' ),
														onClick: () => {
															setCommentEdit( false );
															setShowConfirmationTabId( thread.id );
															setDeleteCommentShowConfirmation( true );
														}
													},
													{
														title: __( 'Reply' ),
														onClick: () => {
															setShowConfirmationTabId( thread.id );
															onReplyComment( thread.id );
														}
													},
												] }
											/>
											) : (
											<DropdownMenu
												icon={ moreVertical }
												label="Select an action"
												className="is-compact"
												controls={ [
													{
														title: __( 'Edit' ),
														onClick: () => {
															setShowConfirmationTabId( thread.id );
															onEditComment( thread.id );
														}
													},
													{
														title: __( 'Delete' ),
														onClick: () => {
															setCommentEdit( false );
															setShowConfirmationTabId( thread.id );
															setDeleteCommentShowConfirmation( true );
														}
													},
												] }
											/>
											) }
											
										</HStack>
									}
									{ thread.status === 'approved' &&
										<Tooltip text={ __( 'Resolved' ) }>
											<Button className="is-compact has-icon">
												<Icon icon={ check } />
											</Button>
										</Tooltip>
									}
								</span>
							</HStack>
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
								className="editor-collab-sidebar__usercomment"
							>
								<VStack spacing="3" className="editor-collab-sidebar__editarea">
									{ commentEdit && thread.id === showConfirmationTabId && (
										<>
											<TextareaControl
												className="editor-collab-sidebar__replyComment__textarea"
												value={ '' !== newEditedComment ? newEditedComment.replace(/<\/?p>/g, '') : thread.content.rendered.replace(/<\/?p>/g, '') }
												onChange={ ( value ) => {
													setNewEditedComment( value );
												} }
											/>
											<VStack
												alignment="left"
												spacing="3"
												justify="flex-start"
												className="editor-collab-sidebar__commentbtn"
												onRequestClose={ () => setCommentEdit( false ) }
											>
												<HStack
													alignment="left"
													spacing="3"
													justify="flex-start"
												>
													<Button
														variant="primary"
														className="is-compact"
														onClick={ () => {
															confirmEditComment( thread.id );
															setCommentEdit( false );
														} }
													>
														{ __( 'Update' ) }
													</Button>
													<Button
														className="is-compact"
														onClick={ () => {
															setCommentEdit( false );
															setShowConfirmation( false );
														} }
													>
														{ __( 'Cancel' ) }
													</Button>
												</HStack>
											</VStack>
										</>
									) }
									<RawHTML>
										{ thread.content.rendered }
									</RawHTML>
								</VStack>
							</HStack>

							{ hasCommentReply && thread.id === showConfirmationTabId && (
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
							>
								<VStack
									alignment="left"
									spacing="3"
									className="editor-collab-sidebar__replyComment"
								>
									<TextareaControl
										className="editor-collab-sidebar__replyComment__textarea"
										value={ commentReply ?? '' }
										onChange={ ( value ) => {
											setCommentReply( value );
										} }
									/>
									<VStack
										alignment="left"
										spacing="3"
										justify="flex-start"
										onRequestClose={ () => setHasCommentReply( false ) }
									>
										<HStack
											alignment="left"
											spacing="3"
											justify="flex-start"
											className="editor-collab-sidebar__replybtn"
										>
											<Button
												variant="primary"
												onClick={ () => {
													confirmReplyComment( thread.id );
													setHasCommentReply( false );
												} }
												className="is-compact"
											>
												{ __( 'Reply' ) }
											</Button>
											<Button
												onClick={ () => {
													setHasCommentReply( false );
													setShowConfirmation( false );
												} }
												className="is-compact"
											>
												{ __( 'Cancel' ) }
											</Button>
										</HStack>
									</VStack>
								</VStack>
							</HStack>
							) }

							{ commentConfirmation && thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread marked as resolved.' ) }
								</Text>
							) }
							{ commentEditedMessage && thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread edited successfully.' ) }
								</Text>
							) }
							{ commentDeleteMessage && thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread deleted successfully.' ) }
								</Text>
							) }
							{ replyMessage && thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Reply added successfully.' ) }
								</Text>
							) }

							{ showConfirmation && thread.id === showConfirmationTabId && (
								<VStack
									title={ __( 'Confirm' ) }
									onRequestClose={ () => setShowConfirmation( false ) }
									className="editor-collab-sidebar__useroverlay confirmation-overlay"
									spacing="0"
									justify="space-between"
								>
									<p>
										{ __(
											'Are you sure you want to mark this thread as resolved?'
										) }
									</p>
									<HStack>
										<Button
											variant="primary"
											onClick={ () => confirmAndMarkThreadAsResolved( thread.id ) }
										>
											{ __( 'Yes' ) }
										</Button>
										<Button onClick={ () => setShowConfirmation( false ) }>
											{ __( 'No' ) }
										</Button>
									</HStack>
								</VStack>
							) }

							{ deleteCommentShowConfirmation && thread.id === showConfirmationTabId && (
								<VStack
									title={ __( 'Confirm' ) }
									onRequestClose={ () => setDeleteCommentShowConfirmation( false ) }
									className="editor-collab-sidebar__useroverlay confirmation-overlay"
									spacing="0"
									justify="space-between"
								>
									<p>
										{ __(
											'Are you sure you want to delete this thread?'
										) }
									</p>
									<HStack>
										<Button
											variant="primary"
											onClick={ () => confirmDeleteComment( thread.id ) }
										>
											{ __( 'Yes' ) }
										</Button>
										<Button onClick={ () => setDeleteCommentShowConfirmation( false ) }>
											{ __( 'No' ) }
										</Button>
									</HStack>
								</VStack>
							) }

							{ 0 < thread.reply.length && (
								thread.reply.map((reply) => (
									<VStack
										key={ reply.id }
										className="editor-collab-sidebar__childThread"
										id={reply.id}
										spacing="2"
									>
										<HStack
											alignment="left"
											spacing="3"
											justify="flex-start"
										>
											<img
												src={reply?.author_avatar_urls?.[48]}
												className="editor-collab-sidebar__userIcon"
												alt={ __( 'User avatar' ) }
												width={32}
												height={32}
											/>
											<VStack
												spacing="0"
											>
												<span className="editor-collab-sidebar__userName">
													{ reply.author_name }
												</span>
												<time
													dateTime={ format('h:i A', reply.date) }
													className="editor-collab-sidebar__usertime"
												>
													{ dateI18n(dateTimeFormat, reply.date) }
												</time>
											</VStack>
											<span className="editor-collab-sidebar__commentUpdate">
												{ reply.status !== 'approved' &&
													<HStack
														alignment="right"
														justify="flex-end"
														spacing="0"
													>
													{ 0 === reply.parent && (
														<DropdownMenu
															icon={ moreVertical }
															label="Select an action"
															className="is-compact"
															controls={ [
																{
																	title: __( 'Edit' ),
																	onClick: () => {
																		setShowConfirmationTabId( reply.id );
																		onEditComment( reply.id );
																	}
																},
																{
																	title: __( 'Delete' ),
																	onClick: () => {
																		setCommentEdit( false );
																		setShowConfirmationTabId( reply.id );
																		setDeleteCommentShowConfirmation( true );
																	}
																},
																{
																	title: __( 'Reply' ),
																	onClick: () => {
																		setShowConfirmationTabId( reply.id );
																		onReplyComment( reply.id );
																	}
																},
															] }
														/>
														)  }
														
														{ 0 !== reply.parent && thread.status !== 'approved' && (
															<DropdownMenu
																icon={ moreVertical }
																label="Select an action"
																className="is-compact"
																controls={ [
																	{
																		title: __( 'Edit' ),
																		onClick: () => {
																			setShowConfirmationTabId( reply.id );
																			onEditComment( reply.id );
																		}
																	},
																	{
																		title: __( 'Delete' ),
																		onClick: () => {
																			setCommentEdit( false );
																			setShowConfirmationTabId( reply.id );
																			setDeleteCommentShowConfirmation( true );
																		}
																	},
																] }
															/>
														) }
														
													</HStack>
												}
											</span>
										</HStack>
										<HStack
											alignment="left"
											spacing="3"
											justify="flex-start"
											className="editor-collab-sidebar__usercomment"
										>
											<VStack spacing="3" className="editor-collab-sidebar__editarea">
												{ commentEdit && reply.id === showConfirmationTabId && (
													<>
														<TextareaControl
															className="editor-collab-sidebar__replyComment__textarea"
															value={ '' !== newEditedComment ? newEditedComment.replace(/<\/?p>/g, '') : reply.content.rendered.replace(/<\/?p>/g, '') }
															onChange={ ( value ) => {
																setNewEditedComment( value );
															} }
														/>
														<VStack
															alignment="left"
															spacing="3"
															justify="flex-start"
															className="editor-collab-sidebar__commentbtn"
															onRequestClose={ () => setCommentEdit( false ) }
														>
															<HStack
																alignment="left"
																spacing="3"
																justify="flex-start"
															>
																<Button
																	variant="primary"
																	className="is-compact"
																	onClick={ () => {
																		confirmEditComment( reply.id );
																		setCommentEdit( false );
																	} }
																>
																	{ __( 'Update' ) }
																</Button>
																<Button
																	className="is-compact"
																	onClick={ () => {
																		setCommentEdit( false );
																		setShowConfirmation( false );
																	} }
																>
																	{ __( 'Cancel' ) }
																</Button>
															</HStack>
														</VStack>
													</>
												) }
												<RawHTML>
													{ reply.content.rendered }
												</RawHTML>
											</VStack>
										</HStack>

										{ hasCommentReply && reply.id === showConfirmationTabId && (
										<HStack
											alignment="left"
											spacing="3"
											justify="flex-start"
										>
											<VStack
												spacing="3"
												className="editor-collab-sidebar__replyComment"
											>
												<TextareaControl
													className="editor-collab-sidebar__replyComment__textarea"
													value={ commentReply ?? '' }
													onChange={ ( value ) => {
														setCommentReply( value );
													} }
												/>
												<VStack
													alignment="left"
													spacing="3"
													justify="flex-start"
													onRequestClose={ () => setHasCommentReply( false ) }
												>
													<HStack
														alignment="left"
														spacing="3"
														justify="flex-start"
														className="editor-collab-sidebar__replybtn"
													>
														<Button
															variant="primary"
															onClick={ () => {
																confirmReplyComment( reply.id );
																setHasCommentReply( false );
															} }
															className="is-compact"
														>
															{ __( 'Reply' ) }
														</Button>
														<Button
															onClick={ () => {
																setHasCommentReply( false );
																setShowConfirmation( false );
															} }
															className="is-compact"
														>
															{ __( 'Cancel' ) }
														</Button>
													</HStack>
												</VStack>
											</VStack>
										</HStack>
										) }

										{ commentConfirmation && reply.id === showConfirmationTabId && (
											<Text>
												{ __( 'Thread marked as resolved.' ) }
											</Text>
										) }
										{ commentEditedMessage && reply.id === showConfirmationTabId && (
											<Text>
												{ __( 'Thread edited successfully.' ) }
											</Text>
										) }
										{ commentDeleteMessage && reply.id === showConfirmationTabId && (
											<Text>
												{ __( 'Thread deleted successfully.' ) }
											</Text>
										) }
										{ replyMessage && reply.id === showConfirmationTabId && (
											<Text>
												{ __( 'Reply added successfully.' ) }
											</Text>
										) }

										{ showConfirmation && reply.id === showConfirmationTabId && (
											<VStack
												title={ __( 'Confirm' ) }
												onRequestClose={ () => setShowConfirmation( false ) }
												className="editor-collab-sidebar__useroverlay confirmation-overlay"
												spacing="0"
												justify="space-between"
											>
												<p>
													{ __(
														'Are you sure you want to mark this thread as resolved?'
													) }
												</p>
												<HStack>
													<Button
														variant="primary"
														onClick={ () => confirmAndMarkThreadAsResolved( reply.id ) }
													>
														{ __( 'Yes' ) }
													</Button>
													<Button onClick={ () => setShowConfirmation( false ) }>
														{ __( 'No' ) }
													</Button>
												</HStack>
											</VStack>
										) }

										{ deleteCommentShowConfirmation && reply.id === showConfirmationTabId && (
											<VStack
												title={ __( 'Confirm' ) }
												onRequestClose={ () => setDeleteCommentShowConfirmation( false ) }
												className="editor-collab-sidebar__useroverlay confirmation-overlay"
												spacing="0"
												justify="space-between"
											>
												<p>
													{ __(
														'Are you sure you want to delete this thread?'
													) }
												</p>
												<HStack>
													<Button
														variant="primary"
														onClick={ () => confirmDeleteComment( reply.id ) }
													>
														{ __( 'Yes' ) }
													</Button>
													<Button onClick={ () => setDeleteCommentShowConfirmation( false ) }>
														{ __( 'No' ) }
													</Button>
												</HStack>
											</VStack>
										) }

									</VStack>
									
								))
							) }

						</VStack>
					))
				}

			</div>
		</PluginSidebar>
	);
}
