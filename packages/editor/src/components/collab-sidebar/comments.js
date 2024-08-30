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
import { dateI18n, format, getSettings as getDateSettings } from '@wordpress/date';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

export function Comments( { threads } ) {
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
						<CommentHeader 
							thread={ thread }
							onResolve={ () => {
								setCommentConfirmation( false );
								setShowConfirmation( true );
								setShowConfirmationTabId( thread.id );
							} }
							onEdit={ () => {
								setShowConfirmationTabId( thread.id );
								onEditComment( thread.id );
							} }
							onDelete={ () => {
								setCommentEdit( false );
								setShowConfirmationTabId( thread.id );
								setDeleteCommentShowConfirmation( true );
							} }
							onReply={ () => {
								setShowConfirmationTabId( thread.id );
								onReplyComment( thread.id );
							} }
						/>
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
												__nextHasNoMarginBottom
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
											>
												<HStack
													alignment="left"
													spacing="3"
													justify="flex-start"
												>
													<Button
														__next40pxDefaultSize
														variant="primary"
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
														__next40pxDefaultSize
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
											__nextHasNoMarginBottom
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
										>
											<HStack
												alignment="left"
												spacing="3"
												justify="flex-start"
												className="editor-collab-sidebar__replybtn"
											>
												<Button
													__next40pxDefaultSize
													variant="primary"
													onClick={ () => {
														confirmReplyComment(
															thread.id
														);
														setHasCommentReply(
															false
														);
													} }
												>
													{ __( 'Reply' ) }
												</Button>
												<Button
													__next40pxDefaultSize
													onClick={ () => {
														setHasCommentReply(
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
								<ConfirmNotice 
									confirmMessage={ __( 'Are you sure you want to mark this thread as resolved?' ) }
									confirmAction={ () => confirmAndMarkThreadAsResolved( thread.id ) } 
									discardAction={ () => setShowConfirmation( false ) }
								/>
							) }

						{ deleteCommentShowConfirmation &&
							thread.id === showConfirmationTabId && (
								<ConfirmNotice 
									confirmMessage={ __( 'Are you sure you want to delete this thread?' ) }
									confirmAction={ () => confirmDeleteComment( thread.id ) } 
									discardAction={ () => setDeleteCommentShowConfirmation( false ) }
								/>
							) }

						{ 0 < thread?.reply?.length &&
							thread.reply.map( ( reply ) => (
								<VStack
									key={ reply.id }
									className="editor-collab-sidebar__childThread"
									id={ reply.id }
									spacing="2"
								>
									<CommentHeader 
										thread={ reply }
										onResolve={ () => {
											setCommentConfirmation( false );
											setShowConfirmation( true );
											setShowConfirmationTabId( reply.id );
										} }
										onEdit={ () => {
											setShowConfirmationTabId( reply.id );
											onEditComment( reply.id );
										} }
										onDelete={ () => {
											setCommentEdit( false );
											setShowConfirmationTabId( reply.id );
											setDeleteCommentShowConfirmation( true );
										} }
									/>
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
															__nextHasNoMarginBottom
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
														>
															<HStack
																alignment="left"
																spacing="3"
																justify="flex-start"
															>
																<Button
																	__next40pxDefaultSize
																	variant="primary"
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
																	__next40pxDefaultSize
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
														__nextHasNoMarginBottom
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
													>
														<HStack
															alignment="left"
															spacing="3"
															justify="flex-start"
															className="editor-collab-sidebar__replybtn"
														>
															<Button
																__next40pxDefaultSize
																variant="primary"
																onClick={ () => {
																	confirmReplyComment(
																		reply.id
																	);
																	setHasCommentReply(
																		false
																	);
																} }
															>
																{ __(
																	'Reply'
																) }
															</Button>
															<Button
																__next40pxDefaultSize
																onClick={ () => {
																	setHasCommentReply(
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
											<ConfirmNotice 
												confirmMessage={ __( 'Are you sure you want to mark this thread as resolved?' ) }
												confirmAction={ () => confirmAndMarkThreadAsResolved( reply.id ) } 
												discardAction={ () => setShowConfirmation(
													false
												) }
											/>
										) }

									{ deleteCommentShowConfirmation &&
										reply.id === showConfirmationTabId && ( 
											<ConfirmNotice 
												confirmMessage={ __( 'Are you sure you want to delete this thread?' ) }
												confirmAction={ () => confirmDeleteComment( reply.id ) } 
												discardAction={ () => setDeleteCommentShowConfirmation( false ) }
											/>
										) }
								</VStack>
							) ) }
					</VStack>
				) ) }
		</>
	);
}

function ConfirmNotice({ cofirmMessage, confirmAction, discardAction}) {
	return (
		<VStack
			title={ __( 'Confirm' ) }
			className="editor-collab-sidebar__useroverlay confirmation-overlay"
			spacing="0"
			justify="space-between"
		>
			<p>
				{ cofirmMessage ?? __( 'Are you sure?' ) }
			</p>
			<HStack>
				<Button 
					__next40pxDefaultSize
					variant="primary" onClick={ confirmAction } 
				>
					{ __( 'Yes' ) }
				</Button>
				<Button 
					__next40pxDefaultSize
					onClick={ discardAction } 
				>
					{ __( 'No' ) }
				</Button>
			</HStack>
		</VStack>
	);
}

function CommentHeader ( { thread, onResolve, onEdit, onDelete, onReply } ){
	const dateSettings = getDateSettings();
	const [ dateTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);

	const moreActions = [];

	onEdit && moreActions.push( {
		title: __( 'Edit' ),
		onClick: onEdit,
	} );
 
	onDelete && moreActions.push({
		title: __( 'Delete' ),
		onClick: onDelete,
	});
		
	0 === thread.parent &&
	onReply && moreActions.push( {
		title: __( 'Reply' ),
		onClick: onReply,
	});

	return(
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
						{ onResolve && (
							<Tooltip text={ __( 'Resolve' ) }>
								<Button 
									__next40pxDefaultSize 
									className="has-icon"
								>
									<Icon
										icon={ published }
										onClick={ onResolve }
									/>
								</Button>
							</Tooltip>
							)
						}
						<DropdownMenu
							icon={ moreVertical }
							label="Select an action"
							controls={ moreActions }
						/>
					</HStack>
				) }
				{ thread.status === 'approved' && (
					<Tooltip text={ __( 'Resolved' ) }>
						<Button 
							__next40pxDefaultSize
						 	className="has-icon"
						>
							<Icon icon={ check } />
						</Button>
					</Tooltip>
				) }
			</span>
		</HStack>
	)
}