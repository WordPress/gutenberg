/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useLayoutEffect } from '@wordpress/element';
import { toggleFormat, removeFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { comment as commentIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import CollabBoard from './collab-board';

const name = 'core/collab-comment';
const title = __( 'Add Comment' );

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

function Edit( { isActive, value, onChange, onFocus, contentRef } ) {
	// State to manage the visibility of the discussion board.
	const [ isDiscussionBoardVisible, setIsDiscussionBoardVisible ] =
		useState( false );
	const [ threadId, setThreadId ] = useState(null);

	function onClick() {
		const instanceId = Date.now().toString();

		onChange(
			toggleFormat( value, {
				type: name,
				attributes: {
					id: instanceId,
				},
				title,
			} )
		);

		setThreadId( instanceId );
		onFocus();
		setIsDiscussionBoardVisible( true );
	}

	// Function to toggle the visibility of the discussion board.
	const toggleDiscussionBoardVisibility = () => {
		onChange( removeFormat( value, name ) );
		setIsDiscussionBoardVisible( ( state ) => ! state );
	};

	// close comment board if the comment is not active.
	useEffect( () => {
		if ( ! isActive ) {
			setIsDiscussionBoardVisible( false );
		}
	}, [ isActive ] );

	useLayoutEffect( () => {
		const editableContentElement = contentRef.current;
		if ( ! editableContentElement ) {
			return;
		}

		function handleClick( event ) {
			const comment = event.target.closest( '[contenteditable] span' );
			if (
				! comment ||
				! isActive
			) {
				return;
			}

			setIsDiscussionBoardVisible( true );
			const threadID = comment.getAttribute('id');
			setThreadId( threadID );
		}

		editableContentElement.addEventListener( 'click', handleClick );

		return () => {
			editableContentElement.removeEventListener( 'click', handleClick );
		};
	}, [ contentRef, isActive ] );

	return (
		<>
			{ isBlockCommentExperimentEnabled && (
				<RichTextToolbarButton
					icon={ commentIcon }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
				/>
			) }

			{ isBlockCommentExperimentEnabled && isDiscussionBoardVisible && (
				<CollabBoard
					threadId={ threadId }
					setThreadId={ setThreadId }
					contentRef={ contentRef }
					onClose={ toggleDiscussionBoardVisibility }
				/>
			) }
		</>
	);
}

export const collabComment = {
	name,
	title,
	tagName: 'span',
	className: 'has-collab-comment',
	attributes: {
		id: 'id',
	},
	edit: Edit,
};
