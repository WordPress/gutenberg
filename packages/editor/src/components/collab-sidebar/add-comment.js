/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
} from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { sanitizeCommentString } from './utils';

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
		return select( coreStore ).getCurrentUser();
	}, [] );

	const useDefaultAvatar = () => {
		const { avatarURL: defaultAvatarUrl } = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			const { __experimentalDiscussionSettings } = getSettings();
			return __experimentalDiscussionSettings;
		} );
		return defaultAvatarUrl;
	};

	const defaultAvatar = useDefaultAvatar();
	const userAvatar = currentUserData?.avatar_urls[ 48 ] ?? defaultAvatar;

	const currentUser = currentUserData?.name || null;

	const { clientId, blockCommentId, showAddCommentBoard } = useSelect(
		( select ) => {
			const selectedBlock = select( blockEditorStore ).getSelectedBlock();
			const selectedBlockClientID =
				select( blockEditorStore ).getSelectedBlockClientId();
			return {
				clientId: selectedBlockClientID,
				blockCommentId: selectedBlock?.attributes?.blockCommentId,
				showAddCommentBoard:
					selectedBlock?.attributes?.showCommentBoard,
			};
		},
		[]
	);

	useEffect( () => {
		setInputComment( '' );
	}, [ clientId ] );

	// Get the dispatch functions to save the comment and update the block attributes.
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const handleCancel = () => {
		updateBlockAttributes( clientId, {
			showCommentBoard: false,
		} );
		setInputComment( '' );
	};

	if ( ! showAddCommentBoard || ! clientId || 0 !== blockCommentId ) {
		return null;
	}

	return (
		<VStack
			spacing="3"
			className="editor-collab-sidebar-panel__thread editor-collab-sidebar-panel__active-thread"
		>
			<HStack alignment="left" spacing="3">
				<img
					src={ userAvatar }
					// translators: alt text for user avatar image
					alt={ __( 'User Avatar' ) }
					className="editor-collab-sidebar-panel__user-avatar"
					width={ 32 }
					height={ 32 }
				/>
				<span className="editor-collab-sidebar-panel__user-name">
					{ currentUser }
				</span>
			</HStack>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				value={ inputComment }
				onChange={ setInputComment }
				// translators: placeholder text for comment input
				placeholder={ __( 'Comment' ) }
			/>
			<HStack alignment="right" spacing="3">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					text={ _x( 'Cancel', 'Cancel comment' ) }
					onClick={ handleCancel }
					size="compact"
				/>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					variant="primary"
					text={ _x( 'Comment', 'Add comment button' ) }
					disabled={
						0 === sanitizeCommentString( inputComment ).length
					}
					onClick={ () => onSubmit( inputComment ) }
					size="compact"
				/>
			</HStack>
		</VStack>
	);
}
