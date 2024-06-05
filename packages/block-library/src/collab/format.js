/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { comment as commentIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DiscussionBoard from './discussion-board';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

export const formatName = 'core/add-comment';
const title = __( 'Add comment' );

export const format = {
	title,
	tagName: 'div',
	className: null,
	attributes: {},
	edit: Edit,
};

function Edit( { isActive, contentRef } ) {
	// State to manage the visibility of the discussion board.
	const [ isDiscussionBoardVisible, setIsDiscussionBoardVisible ] =
		useState( false );

	// Function to toggle the visibility of the discussion board.
	const toggleDiscussionBoardVisibility = () => {
		setIsDiscussionBoardVisible( ( state ) => ! state );
	};

	return (
		<>
			{ isBlockCommentExperimentEnabled && (
				<RichTextToolbarButton
					icon={ commentIcon }
					isActive={ isActive }
					onClick={ () => toggleDiscussionBoardVisibility() }
					role="menuitemcheckbox"
					title={ title }
				/>
			) }
			{ isDiscussionBoardVisible && (
				<DiscussionBoard
					contentRef={ contentRef }
					onClose={ toggleDiscussionBoardVisibility }
				/>
			) }
		</>
	);
}
