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
} from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { dateI18n, format, getSettings } from '@wordpress/date';
import { store as blockEditorStore } from '@wordpress/block-editor';
// eslint-disable-next-line import/no-extraneous-dependencies
import { store as editorStore } from '@wordpress/editor';

/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

const DiscussionBoard = ( { contentRef, onClose } ) => {
	// Get the anchor for the popover.
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
	} );

	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );
	const [ isResolved, setIsResolved ] = useState( false );
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const [ threadId, setThreadId ] = useState( null );

	// Get the dispatch functions to save the comment and update the block attributes.
	const { saveEntityRecord } = useDispatch( coreStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Set the threadId if exists, from the currently selected block classList.
	useEffect( () => {
		const classList = contentRef.current?.classList?.value
			.split( ' ' )
			.find( ( className ) =>
				className.startsWith( 'block-editor-collab__' )
			);

		setThreadId(
			classList
				? classList.slice( 'block-editor-collab__'.length )
				: uuid()
		);
	}, [ contentRef ] );

	// Add border to the block if threadId exists.
	useEffect( () => {
		if ( threadId ) {
			addBorder();
		}
	}, [ threadId ] );

	// Fetch the current post, current user, and the selected block clientId.
	const {
		postId,
		allThreads,
		currentThread,
		currentUser,
		clientId,
		commentsCount,
		isCurrentThreadResolved,
	} = useSelect(
		( select ) => {
			const post = select( editorStore ).getCurrentPost();
			const collabData = post?.meta?.collab
				? JSON.parse( post.meta.collab )
				: [];

			const thread = collabData[ threadId ] ?? {};
			const threadIsResolved = thread.threadIsResolved || false;
			const count = threadIsResolved ? 0 : thread.comments?.length || 0;

			return {
				postId: post?.id,
				allThreads: collabData,
				currentThread: thread,
				commentsCount: count,
				isCurrentThreadResolved: threadIsResolved,
				currentUser: select( coreStore ).getCurrentUser()?.name || null,
				clientId:
					select( blockEditorStore ).getSelectedBlockClientId() ||
					null,
			};
		},
		[ threadId ]
	);

	// Helper function to generate a new comment.
	const generateNewComment = () => ( {
		commentId: uuid(),
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

	// Function to save the comment.
	const saveComment = async () => {
		const newComment = generateNewComment();
		const updatedComments = getUpdatedComments( newComment, threadId );

		await saveEntityRecord( 'postType', 'post', {
			id: postId,
			meta: {
				collab: JSON.stringify( updatedComments ),
			},
		} );

		setInputComment( '' );
	};

	// Function to mark thread as resolved
	const markThreadAsResolved = async () => {
		setIsResolved( true );

		const updatedComments = { ...allThreads };

		updatedComments[ threadId ] = {
			...updatedComments[ threadId ],
			isResolved: true,
			resolvedBy: currentUser,
			resolvedAt: new Date().toISOString(),
		};

		// Save the updated comments.
		await saveEntityRecord( 'postType', 'post', {
			id: postId,
			meta: { collab: JSON.stringify( updatedComments ) },
		} );

		removeBorder();
		setThreadId( null );
		onClose();
	};

	// Function to delete a comment.
	const deleteComment = async ( commentId ) => {
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
		await saveEntityRecord( 'postType', 'post', {
			id: postId,
			meta: { collab: JSON.stringify( updatedComments ) },
		} );
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
									<VStack
										spacing="2"
										key={ timestamp }
										className="comment-board__comment"
									>
										<HStack
											alignment="left"
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
								)
							) }
						</>
					) }
					<VStack spacing="2">
						{ 0 === commentsCount && (
							<HStack alignment="left" spacing="1">
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
							placeholder={ __( 'Comment or add others with @' ) }
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
								onClick={ () => saveComment() }
							/>
						</HStack>
					</VStack>
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

export default DiscussionBoard;
