/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { toggleFormat } from '@wordpress/rich-text';
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
	function onClick() {
		onChange(
			toggleFormat( value, {
				type: name,
				title,
				attributes: { cid: Date.now() },
			} )
		);
		onFocus();
		setIsDiscussionBoardVisible( true );
	}

	// State to manage the visibility of the discussion board.
	const [ isDiscussionBoardVisible, setIsDiscussionBoardVisible ] =
		useState( false );

	// Function to toggle the visibility of the discussion board.
	const toggleDiscussionBoardVisibility = () => {
		setIsDiscussionBoardVisible( ( state ) => ! state );
	};

	// Set the threadId if exists, from the currently selected block classList.
	useEffect( () => {
		const classList = contentRef.current?.classList?.value
			.split( ' ' )
			.find( ( className ) =>
				className.startsWith( 'block-editor-collab__' )
			);

		const threadID = classList
			? classList.slice( 'block-editor-collab__'.length )
			: '';

		if ( threadID ) {
			setIsDiscussionBoardVisible( true );
		}
	}, [ contentRef ] );
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
		cid: 'cid',
	},
	edit: Edit,
};
