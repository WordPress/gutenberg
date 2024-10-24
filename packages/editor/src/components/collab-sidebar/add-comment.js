/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
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
 * Renders the UI for adding a comment in the Gutenberg editor's collaboration sidebar.
 *
 * @param {Object}   props                     - The component props.
 * @param {Function} props.onSubmit            - A callback function to be called when the user submits a comment.
 * @param {boolean}  props.showCommentBoard    - The function to edit the comment.
 * @param {Function} props.setShowCommentBoard - The function to delete the comment.
 * @return {JSX.Element} The rendered comment input UI.
 */
export function AddComment( {
	onSubmit,
	showCommentBoard,
	setShowCommentBoard,
} ) {
	// State to manage the comment thread.
	const [ inputComment, setInputComment ] = useState( '' );

	const {
		defaultAvatar,
		clientId,
		blockCommentId,
		showAddCommentBoard,
		currentUser,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		const selectedBlock = select( blockEditorStore ).getSelectedBlock();
		const userData = select( coreStore ).getCurrentUser();
		return {
			defaultAvatar: __experimentalDiscussionSettings?.avatarURL,
			clientId: selectedBlock?.clientId,
			blockCommentId: selectedBlock?.attributes?.blockCommentId,
			showAddCommentBoard: showCommentBoard,
			currentUser: userData,
		};
	} );

	const userAvatar =
		currentUser && currentUser.avatar_urls && currentUser.avatar_urls[ 48 ]
			? currentUser.avatar_urls[ 48 ]
			: defaultAvatar;

	useEffect( () => {
		setInputComment( '' );
	}, [ clientId ] );

	const handleCancel = () => {
		setShowCommentBoard( false );
		setInputComment( '' );
	};

	if ( ! showAddCommentBoard || ! clientId || undefined !== blockCommentId ) {
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
					{ currentUser?.name ?? '' }
				</span>
			</HStack>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				value={ inputComment }
				onChange={ setInputComment }
				placeholder={ _x( 'Comment', 'noun' ) }
			/>
			<HStack alignment="right" spacing="3">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					text={ _x( 'Cancel', 'Cancel comment button' ) }
					onClick={ handleCancel }
				/>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					variant="primary"
					text={ _x( 'Comment', 'Add comment button' ) }
					disabled={
						0 === sanitizeCommentString( inputComment ).length
					}
					onClick={ () => {
						onSubmit( inputComment );
						setInputComment( '' );
					} }
				/>
			</HStack>
		</VStack>
	);
}
