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
	Button,
	DropdownMenu,
	TextareaControl,
	Tooltip,
} from '@wordpress/components';
import {
	dateI18n,
	format,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import {
	Icon,
	edit as editIcon,
	trash as deleteIcon,
	commentAuthorAvatar as userIcon,
} from '@wordpress/icons';

export function Comments( { threads } ) {
	const { createNotice } = useDispatch( noticesStore );

	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const [ showConfirmationTabId, setShowConfirmationTabId ] = useState( 0 );
	const [ deleteCommentShowConfirmation, setDeleteCommentShowConfirmation ] =
		useState( false );
	const [ commentEdit, setCommentEdit ] = useState( false );
	const [ hasCommentReply, setHasCommentReply ] = useState( false );

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
					createNotice(
						'snackbar',
						__( 'Thread marked as resolved.' ),
						{
							type: 'snackbar',
							isDismissible: true,
						}
					);
				}
			} );
		}
	};

	const confirmEditComment = ( threadID, comment ) => {
		if ( threadID && comment.length > 0 ) {
			const editedComment = comment.replace( /^<p>|<\/p>$/g, '' );

			apiFetch( {
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					content: editedComment,
				},
			} ).then( ( response ) => {
				if ( 'trash' !== response.status && '' !== response.id ) {
					setCommentEdit( false );
					createNotice(
						'snackbar',
						__( 'Thread edited successfully.' ),
						{
							type: 'snackbar',
							isDismissible: true,
						}
					);
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
					createNotice(
						'snackbar',
						__( 'Thread deleted successfully.' ),
						{
							type: 'snackbar',
							isDismissible: true,
						}
					);
				}
			} );
		}
	};

	const generateReplyComment = ( comment ) => ( {
		commentId: Date.now(),
		createdBy: currentUser,
		comment,
		createdAt: new Date().toISOString(),
	} );

	const confirmReplyComment = ( threadID, comment ) => {
		if ( threadID ) {
			const newComment = generateReplyComment( comment );
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
					createNotice(
						'snackbar',
						__( 'Reply added successfully.' ),
						{
							type: 'snackbar',
							isDismissible: true,
						}
					);
				}
			} );
		}
	};

	const blockCommentId = useSelect( ( select ) => {
		const clientID =
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/block-editor' ).getSelectedBlockClientId();
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return (
			select( 'core/block-editor' ).getBlock( clientID )?.attributes
				?.blockCommentId ?? false
		);
	}, [] );

	const onCancel = () => {
		setHasCommentReply( false );
		setCommentEdit( false );
		setShowConfirmation( false );
	}

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
							'is-focused':
								blockCommentId && blockCommentId === thread.id,
						} ) }
						id={ thread.id }
						spacing="2"
					>
						<CommentHeader
							thread={ thread }
							onResolve={ () => {
								setShowConfirmation( true );
								setShowConfirmationTabId( thread.id );
							} }
							onEdit={ () => {
								setShowConfirmationTabId( thread.id );
								setHasCommentReply( false );
								setCommentEdit( true );
							} }
							onDelete={ () => {
								setCommentEdit( false );
								setShowConfirmationTabId( thread.id );
								setDeleteCommentShowConfirmation( true );
							} }
							onReply={ () => {
								setShowConfirmationTabId( thread.id );
								setCommentEdit( false );
								setHasCommentReply( true );
							} }
							status={ thread.status }
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
										<EditComment 
											thread={ thread }
											onUpdate={ ( inputComment ) => {
												confirmEditComment( thread.id, inputComment );
												setCommentEdit( false );
											} }
											onCancel={ onCancel }
										/>
									) }
								{ ! commentEdit && (
									<RawHTML>
										{ thread.content.rendered }
									</RawHTML>
								) }
							</VStack>
						</HStack>

						{ hasCommentReply &&
							thread.id === showConfirmationTabId && (
								<AddReply 
									thread={ thread }
									onSubmit={ (inputComment) => {
										confirmReplyComment(
											thread.id,
											inputComment
										);
										setHasCommentReply(
											false
										);
									} }
									onCancel={ () => {
										setHasCommentReply( false );
										setShowConfirmation( false );
									} }
								/>
							) }
						{ showConfirmation &&
							thread.id === showConfirmationTabId && (
								<ConfirmNotice
									confirmMessage={ __(
										'Are you sure you want to mark this thread as resolved?'
									) }
									confirmAction={ () =>
										confirmAndMarkThreadAsResolved(
											thread.id
										)
									}
									discardAction={ () =>
										setShowConfirmation( false )
									}
								/>
							) }

						{ deleteCommentShowConfirmation &&
							thread.id === showConfirmationTabId && (
								<ConfirmNotice
									confirmMessage={ __(
										'Are you sure you want to delete this thread?'
									) }
									confirmAction={ () =>
										confirmDeleteComment( thread.id )
									}
									discardAction={ () =>
										setDeleteCommentShowConfirmation(
											false
										)
									}
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
											setShowConfirmation( true );
											setShowConfirmationTabId(
												reply.id
											);
										} }
										onEdit={ () => {
											setShowConfirmationTabId(
												reply.id
											);
											setHasCommentReply( false );
											setCommentEdit( true );
										} }
										onDelete={ () => {
											setCommentEdit( false );
											setShowConfirmationTabId(
												reply.id
											);
											setDeleteCommentShowConfirmation(
												true
											);
										} }
										status={ thread.status }
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
													<EditComment 
														thread={ reply }
														onUpdate={ ( inputComment ) => {
															confirmEditComment( reply.id, inputComment );
															setCommentEdit( false );
														} }
														onCancel={ onCancel }
													/>
												) 
											}
											{ ! commentEdit && (
												<RawHTML>
													{ reply.content.rendered }
												</RawHTML>
											) }
										</VStack>
									</HStack>
									{ deleteCommentShowConfirmation &&
										reply.id === showConfirmationTabId && (
											<ConfirmNotice
												confirmMessage={ __(
													'Are you sure you want to delete this thread?'
												) }
												confirmAction={ () =>
													confirmDeleteComment(
														reply.id
													)
												}
												discardAction={ () =>
													setDeleteCommentShowConfirmation(
														false
													)
												}
											/>
										) }
								</VStack>
							) ) }
					</VStack>
				) ) 
			}
		</>
	);
}

function EditComment( { thread, onUpdate, onCancel } ) {
	const [ inputComment, setInputComment ] = useState( thread.content.rendered.replace(
		/<[^>]+>/g,
		''
	) );

	return (
		<>
			<TextareaControl
				__nextHasNoMarginBottom
				className="editor-collab-sidebar__replyComment__textarea"
				value={
					inputComment ??
					''
				}
				onChange={ (
					value
				) => {
					setInputComment(
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
						onClick={ () => onUpdate( inputComment ) }
					>
						{ __(
							'Update'
						) }
					</Button>
					<Button
						__next40pxDefaultSize
						onClick={ onCancel }
					>
						{ __(
							'Cancel'
						) }
					</Button>
				</HStack>
			</VStack>
		</>
	);
}

function AddReply( { thread, onSubmit, onCancel } ) {
	const [ inputComment, setInputComment ] = useState( '' );

	return (
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
					value={ inputComment ?? '' }
					onChange={ ( value ) => {
						setInputComment( value );
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
							onClick={ () => onSubmit( inputComment ) }
						>
							{ __( 'Reply' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							onClick={ onCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
					</HStack>
				</VStack>
			</VStack>
		</HStack>
	);
}

function ConfirmNotice( { cofirmMessage, confirmAction, discardAction } ) {
	return (
		<VStack
			title={ __( 'Confirm' ) }
			className="editor-collab-sidebar__useroverlay confirmation-overlay"
			spacing="0"
			justify="space-between"
		>
			<p>{ cofirmMessage ?? __( 'Are you sure?' ) }</p>
			<HStack>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ confirmAction }
				>
					{ __( 'Yes' ) }
				</Button>
				<Button __next40pxDefaultSize onClick={ discardAction }>
					{ __( 'No' ) }
				</Button>
			</HStack>
		</VStack>
	);
}

function CommentHeader( {
	thread,
	onResolve,
	onEdit,
	onDelete,
	onReply,
	status,
} ) {
	const dateSettings = getDateSettings();
	const [ dateTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);

	const moreActions = [];

	onEdit &&
		moreActions.push( {
			title: __( 'Edit' ),
			onClick: onEdit,
		} );

	onDelete &&
		moreActions.push( {
			title: __( 'Delete' ),
			onClick: onDelete,
		} );

	0 === thread.parent &&
		onReply &&
		moreActions.push( {
			title: __( 'Reply' ),
			onClick: onReply,
		} );

	return (
		<HStack alignment="left" spacing="3" justify="flex-start">
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
				{ status !== 'approved' && (
					<HStack alignment="right" justify="flex-end" spacing="0">
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
						) }
						<DropdownMenu
							icon={ moreVertical }
							label="Select an action"
							className="editor-collab-sidebar__commentDropdown"
							controls={ moreActions }
						/>
					</HStack>
				) }
				{ status === 'approved' && (
					<Tooltip text={ __( 'Resolved' ) }>
						<Button __next40pxDefaultSize className="has-icon">
							<Icon icon={ check } />
						</Button>
					</Tooltip>
				) }
			</span>
		</HStack>
	);
}
