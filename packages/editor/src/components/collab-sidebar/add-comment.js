/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';

/**
 * Renders the UI for adding a comment in the Gutenberg editor's collaboration sidebar.
 *
 * @param {Object}   props                     - The component props.
 * @param {Function} props.onSubmit            - A callback function to be called when the user submits a comment.
 * @param {boolean}  props.showCommentBoard    - The function to edit the comment.
 * @param {Function} props.setShowCommentBoard - The function to delete the comment.
 * @return {React.ReactNode} The rendered comment input UI.
 */
export function AddComment( {
	onSubmit,
	showCommentBoard,
	setShowCommentBoard,
} ) {
	const { clientId, blockCommentId, isEmptyDefaultBlock } = useSelect(
		( select ) => {
			const { getSelectedBlock } = select( blockEditorStore );
			const selectedBlock = getSelectedBlock();
			return {
				clientId: selectedBlock?.clientId,
				blockCommentId: selectedBlock?.attributes?.metadata?.commentId,
				isEmptyDefaultBlock: selectedBlock
					? isUnmodifiedDefaultBlock( selectedBlock )
					: false,
			};
		}
	);

	if (
		! showCommentBoard ||
		! clientId ||
		undefined !== blockCommentId ||
		isEmptyDefaultBlock
	) {
		return null;
	}

	const commentLabel = __( 'New Comment' );

	return (
		<VStack
			spacing="3"
			className="editor-collab-sidebar-panel__thread editor-collab-sidebar-panel__active-thread editor-collab-sidebar-panel__focus-thread"
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ ( inputComment ) => {
					onSubmit( { content: inputComment } );
				} }
				onCancel={ () => {
					setShowCommentBoard( false );
				} }
				submitButtonText={ _x( 'Comment', 'Add comment button' ) }
				labelText={ commentLabel }
			/>
		</VStack>
	);
}
