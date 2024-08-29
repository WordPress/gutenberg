/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, RawHTML } from '@wordpress/element';
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
import {
	comment as commentIcon,
	Icon,
	check,
	published,
	moreVertical,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabSidebarName } from './constants';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const postId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	const [ threads, setThreads ] = useState( [] );
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

	useEffect( () => {
		if ( postId ) {
			apiFetch( {
				path:
					'/wp/v2/comments?post=' +
					postId +
					'&type=block_comment' +
					'&status=any&per_page=100',
				method: 'GET',
			} ).then( ( response ) => {
				const filteredComments = response.filter(
					( comment ) => comment.status !== 'trash'
				);
				// const hierarchicalComments = buildCommentHierarchy(filteredComments);
				// console.log(filteredComments);
				// console.log(hierarchicalComments);
				setThreads(
					Array.isArray( filteredComments ) ? filteredComments : []
				);
			} );
		}
	}, [ postId ] );

	const { threads: selectedThreads } = useSelect( () => {
		return {
			threads,
		};
	}, [ threads ] );

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

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

	const confirmReplyComment = () => {};

	// Get the date time format from WordPress settings.
	const dateTimeFormat = 'h:i A';
	const resultThreads = selectedThreads.map( ( thread ) => thread ).reverse();

	return (
		<PluginSidebar
			identifier={ collabSidebarName }
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">
				{
					// If there are no threads, show a message indicating no threads are available.
					( ! Array.isArray( resultThreads ) ||
						resultThreads.length === 0 ) && (
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
				{ Array.isArray( resultThreads ) &&
					resultThreads.length > 0 &&
					resultThreads.reverse().map( ( thread ) => (
						<VStack
							key={ thread.id }
							className="editor-collab-sidebar__thread"
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
										dateTime={ format(
											'h:i A',
											thread.createdAt
										) }
										className="editor-collab-sidebar__usertime"
									>
										{ dateI18n(
											dateTimeFormat,
											thread.createdAt
										) }
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
									spacing="1"
									className="editor-collab-sidebar__editarea"
								>
									{ commentEdit &&
										thread.id === showConfirmationTabId && (
											<>
												<TextareaControl
													className="editor-collab-sidebar__comment"
													value={
														'' !== newEditedComment
															? newEditedComment
															: thread.content
																	.rendered
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
									<RawHTML>
										{ thread.content.rendered }
									</RawHTML>
								</VStack>
							</HStack>

							{ hasCommentReply &&
								thread.id === showConfirmationTabId && (
									<HStack
										alignment="left"
										spacing="3"
										justify="flex-start"
										className="editor-collab-sidebar__reply"
									>
										<VStack alignment="left" spacing="3">
											<TextareaControl
												className="editor-collab-sidebar__replyComment"
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
						</VStack>
					) ) }
			</div>
		</PluginSidebar>
	);
}
