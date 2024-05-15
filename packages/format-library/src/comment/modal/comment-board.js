/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Popover,
	TextControl,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useAnchor } from '@wordpress/rich-text';
import { commentAuthorAvatar as userIcon, Icon } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
// eslint-disable-next-line import/no-extraneous-dependencies
import { dateI18n, format, getSettings } from '@wordpress/date';

const CommentBoard = ( { onClose, contentRef, clientId } ) => {
	// Get the anchor for the popover.
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
	} );

	// State to manage the comment input.
	const [ inputComment, setInputComment ] = useState( '' );

	// Fetch current user.
	const currentUser = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const { getCurrentUser } = select( 'core' );
		return getCurrentUser()?.name;
	} );

	// Fetch blockComments.
	const blockComments = useSelect( ( select ) => {
		const { getBlockAttributes } = select( blockEditorStore );
		return getBlockAttributes( clientId )?.blockComments || [];
	} );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Function to save the comment.
	const saveComment = () => {
		updateBlockAttributes( clientId, {
			blockComments: [
				...blockComments,
				{
					userName: currentUser,
					comment: inputComment,
					date: Date.now(),
				},
			],
		} );

		setInputComment( '' );
	};

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;

	return (
		<Popover
			className="block-editor-format-toolbar__comment-board"
			anchor={ popoverAnchor }
			onClose={ onClose }
		>
			<VStack spacing="3">
				{ blockComments.length &&
					blockComments.map( ( { userName, comment, timestamp } ) => (
						<VStack
							spacing="2"
							key={ timestamp }
							className="comment-board__comment"
						>
							<HStack alignment="left" spacing="1">
								<Icon icon={ userIcon } size={ 35 } />
								<VStack spacing="1">
									<span>{ userName }</span>
									<time dateTime={ format( 'c', timestamp ) }>
										{ dateI18n(
											dateTimeFormat,
											timestamp
										) }
									</time>
								</VStack>
							</HStack>
							<p>{ comment }</p>
						</VStack>
					) ) }
				<VStack spacing="2">
					{ blockComments.length === 0 && (
						<HStack alignment="left" spacing="1">
							<Icon icon={ userIcon } size={ 35 } />
							<span>{ currentUser }</span>
						</HStack>
					) }
					<TextControl
						value={ inputComment }
						onChange={ ( val ) => setInputComment( val ) }
						placeholder={ __( 'Comment or add others with @' ) }
					/>
					<HStack alignment="right" spacing="1">
						<Button
							className="block-editor-format-toolbar__cancel-button"
							variant="secondary"
							text={ __( 'Cancel' ) }
							onClick={ () => onClose() }
						/>
						<Button
							className="block-editor-format-toolbar__comment-button"
							variant="primary"
							text={
								blockComments.length === 0
									? __( 'Comment' )
									: __( 'Reply' )
							}
							disabled={ inputComment.length === 0 }
							onClick={ () => saveComment() }
						/>
					</HStack>
				</VStack>
			</VStack>
		</Popover>
	);
};

export default CommentBoard;
