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
} from '@wordpress/components';

/**
 * Renders the new comment form.
 *
 * @param {Object}   root0                   The component props.
 * @param {Function} root0.setReloadComments Function to reload comments.
 */
export function AddComment( { setReloadComments } ) {
	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );

	const currentUserData = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core' ).getCurrentUser();
	}, [] );

	const useDefaultAvatar = () => {
		const { avatarURL: defaultAvatarUrl } = useSelect( ( select ) => {
			const { getSettings } = select( 'core/block-editor' );
			const { __experimentalDiscussionSettings } = getSettings();
			return __experimentalDiscussionSettings;
		} );
		return defaultAvatarUrl;
	}

	const userAvatar = currentUserData?.avatar_urls[ 48 ] ?? useDefaultAvatar();

	const currentUser = currentUserData?.name || null;

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
		const newComment = {
			commentId: Date.now(),
			createdBy: currentUser,
			comment: inputComment,
			createdAt: new Date().toISOString(),
		};

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
					<VStack
						spacing="3"
						className="editor-collab-sidebar__thread editor-collab-sidebar__activethread"
					>
						
						<HStack alignment="left" spacing="3">
							<img
								src={ userAvatar }
								alt={ __( 'User Icon' ) }
								className="editor-collab-sidebar__userIcon"
								width={ 32 }
								height={ 32 }
							/>
							<span className="editor-collab-sidebar__userName">
								{ currentUser }
							</span>
						</HStack>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							value={ inputComment }
							onChange={ ( val ) => setInputComment( val ) }
							placeholder={ __( 'Add comment' ) }
							className="block-editor-format-toolbar__comment-input"
						/>
						<HStack alignment="right" spacing="3">
							<Button
								__next40pxDefaultSize
								className="block-editor-format-toolbar__cancel-button"
								variant="tertiary"
								text={ __( 'Cancel' ) }
								onClick={ () => handleCancel() }
							/>
							<Button
								__next40pxDefaultSize
								className="block-editor-format-toolbar__comment-button"
								variant="primary"
								text={ __( 'Add Comment' ) }
								disabled={ 0 === inputComment.length }
								__experimentalIsFocusable
								onClick={ () => saveComment() }
							/>
						</HStack>
					</VStack>
				) 
			}
		</>
	);
}
