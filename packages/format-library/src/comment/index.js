/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	RichTextToolbarButton,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { comment as commentIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
// eslint-disable-next-line import/no-extraneous-dependencies
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import CommentBoard from './modal/comment-board';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

const name = 'core/comment';
const title = __( 'Comment' );

export const comment = {
	name,
	title,
	tagName: 'comment',
	className: null,
	attributes: {
		comment: 'comment',
	},
	edit: Edit,
};

function Edit( { isActive, contentRef } ) {
	// State to manage the visibility of the comment modal.
	const [ isCommentModalVisible, setIsCommentModalVisible ] =
		useState( false );

	// Get the selected block client ID.
	const { selectedBlockClientId } = useSelect( ( select ) => {
		return {
			selectedBlockClientId:
				select( blockEditorStore ).getSelectedBlockClientId(),
		};
	}, [] );

	// Function to toggle the comment modal visibility.
	const toggleCommentModal = () => {
		setIsCommentModalVisible( ( state ) => ! state );
	};

	return (
		<>
			{ isBlockCommentExperimentEnabled && (
				<RichTextToolbarButton
					icon={ commentIcon }
					title={ title }
					onClick={ toggleCommentModal }
					isActive={ isActive }
					role="menuitemcheckbox"
				/>
			) }
			{ isCommentModalVisible && (
				<CommentBoard
					onClose={ toggleCommentModal }
					contentRef={ contentRef }
					clientId={ selectedBlockClientId }
				/>
			) }
		</>
	);
}

// Add the 'comment' attribute to all blocks.
if ( isBlockCommentExperimentEnabled ) {
	addFilter( 'blocks.registerBlockType', 'core/comment', ( settings ) => {
		settings.attributes = {
			...settings.attributes,
			blockComments: {
				type: 'array',
				default: [],
			},
		};

		return settings;
	} );
}
