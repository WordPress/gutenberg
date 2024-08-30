/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { useState, RawHTML } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Button,
	DropdownMenu,
	TextareaControl,
	Tooltip,
} from '@wordpress/components';
import { dateI18n, format } from '@wordpress/date';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

export function Comments( { threads } ) {
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const [ showConfirmationTabId, setShowConfirmationTabId ] = useState( 0 );
	const [ commentConfirmation, setCommentConfirmation ] = useState( false );
	const [ deleteCommentShowConfirmation, setDeleteCommentShowConfirmation ] =
		useState( false );
	const [ commentDeleteMessage, setCommentDeleteMessage ] = useState( false );
	const [ commentEdit, setCommentEdit ] = useState( false );
	const [ newEditedComment, setNewEditedComment ] = useState( '' );
	const [ commentEditedMessage, setCommentEditedMessage ] = useState( false );
	const [ hasCommentReply, setHasCommentReply ] = useState( false );
	const [ commentReply, setCommentReply ] = useState( '' );
	const [ replyMessage, setReplyMessage ] = useState( false );

	// Get the date time format from WordPress settings.
	const dateTimeFormat = 'h:i A';
	const currentUserData = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core' ).getCurrentUser();
	}, [] );
	const currentUser = currentUserData?.name || null;
	const postId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	const confirmAndMarkThreadAsResolved = ( threadID ) => {
		setCommentConfirmation( false );
		if ( threadID ) {
			apiFetch( {
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					status: 'approved',
				},
			} ).then( ( response ) => {
				if ( 'approved' === response.status ) {
					setShowConfirmation( false );
					setCommentConfirmation( true );
				}
			} );
		}
	};

	const onEditComment = ( threadID ) => {
		if ( threadID ) {
			setHasCommentReply( false );
			setCommentEdit( true );
		}
	};

	const confirmEditComment = ( threadID ) => {
		if ( threadID ) {
			const editedComment = newEditedComment.replace(
				/^<p>|<\/p>$/g,
				''
			);

			apiFetch( {
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					content: editedComment,
				},
			} ).then( ( response ) => {
				if ( 'trash' !== response.status && '' !== response.id ) {
					setCommentEdit( false );
					setCommentEditedMessage( true );
				}
			} );
		}
	};

	const confirmDeleteComment = ( threadID ) => {
		setDeleteCommentShowConfirmation( false );
		if ( threadID ) {
			apiFetch( {
				path: '/wp/v2/comments/' + threadID,
				method: 'DELETE',
			} ).then( ( response ) => {
				if ( 'trash' === response.status && '' !== response.id ) {
					setCommentDeleteMessage( true );
				}
			} );
		}
	};

	const onReplyComment = ( threadID ) => {
		if ( threadID ) {
			setCommentEdit( false );
			setHasCommentReply( true );
		}
	};

	const generateReplyComment = ( comment ) => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment,
		createdAt: new Date().toISOString(),
	} );

	const confirmReplyComment = ( threadID ) => {
		if ( threadID ) {
			const newComment = generateReplyComment( commentReply );
			apiFetch( {
				path: '/wp/v2/comments/',
				method: 'POST',
				data: {
					parent: threadID,
					post: postId,
					content: newComment.comment,
					comment_date: newComment.createdAt,
					comment_type: 'block_comment',
					comment_author: currentUser,
					comment_approved: 0,
				},
			} ).then( ( response ) => {
				if ( 'trash' !== response.status && '' !== response.id ) {
					setReplyMessage( true );
				}
			} );
		}
	};

	const blockCommentId = useSelect( ( select ) => {
		const clientID =
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/block-editor' ).getSelectedBlockClientId();
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/block-editor' ).getBlock( clientID )?.attributes
			?.blockCommentId ?? false;
	}, [] );

	return (
		<>
			{
				// If there are no threads, show a message indicating no threads are available.
				( ! Array.isArray( threads ) || threads.length === 0 ) && (
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

			{ Array.isArray( threads ) &&
				threads.length > 0 &&
				threads.reverse().map( ( thread ) => (
					<VStack
						key={ thread.id }
						className={ clsx( 'editor-collab-sidebar__thread', {
							'is-focused': blockCommentId && blockCommentId === thread.id,
						} ) }
						id={ thread.id }
						spacing="2"
					>
						<HStack
							alignment="left"
							spacing="3"
							justify="flex-start"
						>
							<img
								src={ thread?.author_avatar_urls?.[ 48 ] }
								className="editor-collab-sidebar__userIcon"
								alt={ __( 'User avatar' ) }
								width={ 32 }
								height={ 32 }
							/>
							<VStack spacing="0">
								<span className="editor-collab-sidebar__userName">
									{ thread.author_name }
								</span>
								<time
									dateTime={ format( 'h:i A', thread.date ) }
									className="editor-collab-sidebar__usertime"
								>
									{ dateI18n( dateTimeFormat, thread.date ) }
								</time>
							</VStack>
							<span className="editor-collab-sidebar__commentUpdate">
								{ thread.status !== 'approved' && (
									<HStack
										alignment="right"
										justify="flex-end"
										spacing="0"
									>
										<Tooltip text={ __( 'Resolve' ) }>
											<Button className="is-compact has-icon">
												<Icon
													icon={ published }
													onClick={ () => {
														setCommentConfirmation(
															false
														);
														setShowConfirmation(
															true
														);
														setShowConfirmationTabId(
															thread.id
														);
													} }
												/>
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
															setShowConfirmationTabId(
																thread.id
															);
															onEditComment(
																thread.id
															);
														},
													},
													{
														title: __( 'Delete' ),
														onClick: () => {
															setCommentEdit(
																false
															);
															setShowConfirmationTabId(
																thread.id
															);
															setDeleteCommentShowConfirmation(
																true
															);
														},
													},
													{
														title: __( 'Reply' ),
														onClick: () => {
															setShowConfirmationTabId(
																thread.id
															);
															onReplyComment(
																thread.id
															);
														},
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
															setShowConfirmationTabId(
																thread.id
															);
															onEditComment(
																thread.id
															);
														},
													},
													{
														title: __( 'Delete' ),
														onClick: () => {
															setCommentEdit(
																false
															);
															setShowConfirmationTabId(
																thread.id
															);
															setDeleteCommentShowConfirmation(
																true
															);
														},
													},
												] }
											/>
										) }
									</HStack>
								) }
								{ thread.status === 'approved' && (
									<Tooltip text={ __( 'Resolved' ) }>
										<Button className="is-compact has-icon">
											<Icon icon={ check } />
										</Button>
									</Tooltip>
								) }
							</span>
						</HStack>
						<HStack
							alignment="left"
							spacing="3"
							justify="flex-start"
							className="editor-collab-sidebar__usercomment"
						>
							<VStack
								spacing="3"
								className="editor-collab-sidebar__editarea"
							>
								{ commentEdit &&
									thread.id === showConfirmationTabId && (
										<>
											<TextareaControl
												className="editor-collab-sidebar__replyComment__textarea"
												value={
													'' !== newEditedComment
														? newEditedComment.replace(
																/<\/?p>/g,
																''
														  )
														: thread.content.rendered.replace(
																/<\/?p>/g,
																''
														  )
												}
												onChange={ ( value ) => {
													setNewEditedComment(
														value
													);
												} }
											/>
											<VStack
												alignment="left"
												spacing="3"
												justify="flex-start"
												className="editor-collab-sidebar__commentbtn"
												onRequestClose={ () =>
													setCommentEdit( false )
												}
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
															confirmEditComment(
																thread.id
															);
															setCommentEdit(
																false
															);
														} }
													>
														{ __( 'Update' ) }
													</Button>
													<Button
														className="is-compact"
														onClick={ () => {
															setCommentEdit(
																false
															);
															setShowConfirmation(
																false
															);
														} }
													>
														{ __( 'Cancel' ) }
													</Button>
												</HStack>
											</VStack>
										</>
									) }
								<RawHTML>{ thread.content.rendered }</RawHTML>
							</VStack>
						</HStack>

						{ hasCommentReply &&
							thread.id === showConfirmationTabId && (
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
											onRequestClose={ () =>
												setHasCommentReply( false )
											}
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
														confirmReplyComment(
															thread.id
														);
														setHasCommentReply(
															false
														);
													} }
													className="is-compact"
												>
													{ __( 'Reply' ) }
												</Button>
												<Button
													onClick={ () => {
														setHasCommentReply(
															false
														);
														setShowConfirmation(
															false
														);
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

						{ commentConfirmation &&
							thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread marked as resolved.' ) }
								</Text>
							) }
						{ commentEditedMessage &&
							thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread edited successfully.' ) }
								</Text>
							) }
						{ commentDeleteMessage &&
							thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Thread deleted successfully.' ) }
								</Text>
							) }
						{ replyMessage &&
							thread.id === showConfirmationTabId && (
								<Text>
									{ __( 'Reply added successfully.' ) }
								</Text>
							) }

						{ showConfirmation &&
							thread.id === showConfirmationTabId && (
								<VStack
									title={ __( 'Confirm' ) }
									onRequestClose={ () =>
										setShowConfirmation( false )
									}
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
											onClick={ () =>
												confirmAndMarkThreadAsResolved(
													thread.id
												)
											}
										>
											{ __( 'Yes' ) }
										</Button>
										<Button
											onClick={ () =>
												setShowConfirmation( false )
											}
										>
											{ __( 'No' ) }
										</Button>
									</HStack>
								</VStack>
							) }

						{ deleteCommentShowConfirmation &&
							thread.id === showConfirmationTabId && (
								<VStack
									title={ __( 'Confirm' ) }
									onRequestClose={ () =>
										setDeleteCommentShowConfirmation(
											false
										)
									}
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
											onClick={ () =>
												confirmDeleteComment(
													thread.id
												)
											}
										>
											{ __( 'Yes' ) }
										</Button>
										<Button
											onClick={ () =>
												setDeleteCommentShowConfirmation(
													false
												)
											}
										>
											{ __( 'No' ) }
										</Button>
									</HStack>
								</VStack>
							) }

						{ 0 < thread?.reply?.length &&
							thread.reply.map( ( reply ) => (
								<VStack
									key={ reply.id }
									className="editor-collab-sidebar__childThread"
									id={ reply.id }
									spacing="2"
								>
									<HStack
										alignment="left"
										spacing="3"
										justify="flex-start"
									>
										<img
											src={
												reply
													?.author_avatar_urls?.[ 48 ]
											}
											className="editor-collab-sidebar__userIcon"
											alt={ __( 'User avatar' ) }
											width={ 32 }
											height={ 32 }
										/>
										<VStack spacing="0">
											<span className="editor-collab-sidebar__userName">
												{ reply.author_name }
											</span>
											<time
												dateTime={ format(
													'h:i A',
													reply.date
												) }
												className="editor-collab-sidebar__usertime"
											>
												{ dateI18n(
													dateTimeFormat,
													reply.date
												) }
											</time>
										</VStack>
										<span className="editor-collab-sidebar__commentUpdate">
											{ reply.status !== 'approved' && (
												<HStack
													alignment="right"
													justify="flex-end"
													spacing="0"
												>
													{ 0 === reply.parent && (
														<DropdownMenu
															icon={
																moreVertical
															}
															label="Select an action"
															className="is-compact"
															controls={ [
																{
																	title: __(
																		'Edit'
																	),
																	onClick:
																		() => {
																			setShowConfirmationTabId(
																				reply.id
																			);
																			onEditComment(
																				reply.id
																			);
																		},
																},
																{
																	title: __(
																		'Delete'
																	),
																	onClick:
																		() => {
																			setCommentEdit(
																				false
																			);
																			setShowConfirmationTabId(
																				reply.id
																			);
																			setDeleteCommentShowConfirmation(
																				true
																			);
																		},
																},
																{
																	title: __(
																		'Reply'
																	),
																	onClick:
																		() => {
																			setShowConfirmationTabId(
																				reply.id
																			);
																			onReplyComment(
																				reply.id
																			);
																		},
																},
															] }
														/>
													) }

													{ 0 !== reply.parent &&
														thread.status !==
															'approved' && (
															<DropdownMenu
																icon={
																	moreVertical
																}
																label="Select an action"
																className="is-compact"
																controls={ [
																	{
																		title: __(
																			'Edit'
																		),
																		onClick:
																			() => {
																				setShowConfirmationTabId(
																					reply.id
																				);
																				onEditComment(
																					reply.id
																				);
																			},
																	},
																	{
																		title: __(
																			'Delete'
																		),
																		onClick:
																			() => {
																				setCommentEdit(
																					false
																				);
																				setShowConfirmationTabId(
																					reply.id
																				);
																				setDeleteCommentShowConfirmation(
																					true
																				);
																			},
																	},
																] }
															/>
														) }
												</HStack>
											) }
										</span>
									</HStack>
									<HStack
										alignment="left"
										spacing="3"
										justify="flex-start"
										className="editor-collab-sidebar__usercomment"
									>
										<VStack
											spacing="3"
											className="editor-collab-sidebar__editarea"
										>
											{ commentEdit &&
												reply.id ===
													showConfirmationTabId && (
													<>
														<TextareaControl
															className="editor-collab-sidebar__replyComment__textarea"
															value={
																'' !==
																newEditedComment
																	? newEditedComment.replace(
																			/<\/?p>/g,
																			''
																	  )
																	: reply.content.rendered.replace(
																			/<\/?p>/g,
																			''
																	  )
															}
															onChange={ (
																value
															) => {
																setNewEditedComment(
																	value
																);
															} }
														/>
														<VStack
															alignment="left"
															spacing="3"
															justify="flex-start"
															className="editor-collab-sidebar__commentbtn"
															onRequestClose={ () =>
																setCommentEdit(
																	false
																)
															}
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
																		confirmEditComment(
																			reply.id
																		);
																		setCommentEdit(
																			false
																		);
																	} }
																>
																	{ __(
																		'Update'
																	) }
																</Button>
																<Button
																	className="is-compact"
																	onClick={ () => {
																		setCommentEdit(
																			false
																		);
																		setShowConfirmation(
																			false
																		);
																	} }
																>
																	{ __(
																		'Cancel'
																	) }
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

									{ hasCommentReply &&
										reply.id === showConfirmationTabId && (
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
														value={
															commentReply ?? ''
														}
														onChange={ (
															value
														) => {
															setCommentReply(
																value
															);
														} }
													/>
													<VStack
														alignment="left"
														spacing="3"
														justify="flex-start"
														onRequestClose={ () =>
															setHasCommentReply(
																false
															)
														}
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
																	confirmReplyComment(
																		reply.id
																	);
																	setHasCommentReply(
																		false
																	);
																} }
																className="is-compact"
															>
																{ __(
																	'Reply'
																) }
															</Button>
															<Button
																onClick={ () => {
																	setHasCommentReply(
																		false
																	);
																	setShowConfirmation(
																		false
																	);
																} }
																className="is-compact"
															>
																{ __(
																	'Cancel'
																) }
															</Button>
														</HStack>
													</VStack>
												</VStack>
											</HStack>
										) }

									{ commentConfirmation &&
										reply.id === showConfirmationTabId && (
											<Text>
												{ __(
													'Thread marked as resolved.'
												) }
											</Text>
										) }
									{ commentEditedMessage &&
										reply.id === showConfirmationTabId && (
											<Text>
												{ __(
													'Thread edited successfully.'
												) }
											</Text>
										) }
									{ commentDeleteMessage &&
										reply.id === showConfirmationTabId && (
											<Text>
												{ __(
													'Thread deleted successfully.'
												) }
											</Text>
										) }
									{ replyMessage &&
										reply.id === showConfirmationTabId && (
											<Text>
												{ __(
													'Reply added successfully.'
												) }
											</Text>
										) }

									{ showConfirmation &&
										reply.id === showConfirmationTabId && (
											<VStack
												title={ __( 'Confirm' ) }
												onRequestClose={ () =>
													setShowConfirmation( false )
												}
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
														onClick={ () =>
															confirmAndMarkThreadAsResolved(
																reply.id
															)
														}
													>
														{ __( 'Yes' ) }
													</Button>
													<Button
														onClick={ () =>
															setShowConfirmation(
																false
															)
														}
													>
														{ __( 'No' ) }
													</Button>
												</HStack>
											</VStack>
										) }

									{ deleteCommentShowConfirmation &&
										reply.id === showConfirmationTabId && (
											<VStack
												title={ __( 'Confirm' ) }
												onRequestClose={ () =>
													setDeleteCommentShowConfirmation(
														false
													)
												}
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
														onClick={ () =>
															confirmDeleteComment(
																reply.id
															)
														}
													>
														{ __( 'Yes' ) }
													</Button>
													<Button
														onClick={ () =>
															setDeleteCommentShowConfirmation(
																false
															)
														}
													>
														{ __( 'No' ) }
													</Button>
												</HStack>
											</VStack>
										) }
								</VStack>
							) ) }
					</VStack>
				) ) }
		</>
	);
}
