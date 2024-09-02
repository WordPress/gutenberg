/**
 * WordPress dependencies
 */
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
 * @param {Object}   root0          The component props.
 * @param {Function} root0.onSubmit Function to add new comment.
 */
export function AddComment( { onSubmit } ) {
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
	};

	const defaultAvatar = useDefaultAvatar();
	const userAvatar = currentUserData?.avatar_urls[ 48 ] ?? defaultAvatar;

	const currentUser = currentUserData?.name || null;

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

	const handleCancel = () => {
		updateBlockAttributes( clientId, {
			showCommentBoard: false,
		} );
	};

	if ( ! showAddCommentBoard || ! clientId || 0 !== blockCommentId ) {
		return null;
	}

	return (
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
					accessibleWhenDisabled
					className="block-editor-format-toolbar__comment-button"
					variant="primary"
					text={ __( 'Add Comment' ) }
					disabled={ 0 === inputComment.length }
					onClick={ () => onSubmit( inputComment ) }
				/>
			</HStack>
		</VStack>
	);
}
