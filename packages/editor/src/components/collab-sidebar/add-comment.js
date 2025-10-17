/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';
import { focusCommentThread } from './utils';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddComment( {
	onSubmit,
	showCommentBoard,
	setShowCommentBoard,
	commentSidebarRef,
} ) {
	const { clientId, blockCommentId, isEmptyDefaultBlock } = useSelect(
		( select ) => {
			const { getSelectedBlock } = select( blockEditorStore );
			const selectedBlock = getSelectedBlock();
			return {
				clientId: selectedBlock?.clientId,
				blockCommentId: selectedBlock?.attributes?.metadata?.noteId,
				isEmptyDefaultBlock: selectedBlock
					? isUnmodifiedDefaultBlock( selectedBlock )
					: false,
			};
		},
		[]
	);
	const blockElement = useBlockElement( clientId );

	if (
		! showCommentBoard ||
		! clientId ||
		undefined !== blockCommentId ||
		isEmptyDefaultBlock
	) {
		return null;
	}

	return (
		<VStack
			className="editor-collab-sidebar-panel__thread is-selected"
			spacing="3"
			tabIndex={ 0 }
			role="listitem"
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					focusCommentThread( id, commentSidebarRef.current );
				} }
				onCancel={ () => {
					setShowCommentBoard( false );
					blockElement?.focus();
				} }
				submitButtonText={ __( 'Add note' ) }
				labelText={ __( 'New Note' ) }
			/>
		</VStack>
	);
}
