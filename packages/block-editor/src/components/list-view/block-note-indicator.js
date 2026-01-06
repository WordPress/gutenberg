/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { Icon, comment } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useBlockComments } from './use-block-comments';

/**
 * Block Note Indicator component
 *
 * Shows a visual indicator when a block has associated comment notes.
 * Displays as a small badge with a comment icon and count.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The block client ID.
 *
 * @return {Element|null} The note indicator or null if no notes exist.
 */
export default function BlockNoteIndicator( { clientId } ) {
	// Get the postId from the editor store
	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( 'core/editor' ); // eslint-disable-line @wordpress/data-no-store-string-literals
		return {
			postId: getCurrentPostId(),
		};
	}, [] );

	// Get all comments for the post
	const { resultComments } = useBlockComments( postId );

	// Find notes associated with this specific block
	const blockNotes = useMemo( () => {
		if ( ! resultComments || ! clientId ) {
			return null;
		}

		return resultComments.find(
			( resultComment ) => resultComment.blockClientId === clientId
		);
	}, [ resultComments, clientId ] );

	// Don't render if no notes exist for this block
	if ( ! blockNotes ) {
		return null;
	}

	// Count total replies in the thread
	const noteCount = blockNotes.reply ? blockNotes.reply.length + 1 : 1;

	return (
		<div className="block-editor-block-note-indicator">
			<Icon icon={ comment } size={ 16 } />
			{ noteCount > 1 && (
				<span className="block-editor-block-note-indicator__count">
					{ noteCount }
				</span>
			) }
		</div>
	);
}
