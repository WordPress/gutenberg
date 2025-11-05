/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';
import { focusCommentThread, noop } from './utils';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddComment( {
	onSubmit,
	newNoteFormState,
	setNewNoteFormState,
	commentSidebarRef,
	reflowComments = noop,
	isFloating = false,
	y,
	refs,
} ) {
	const { clientId, blockCommentId } = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		const selectedBlock = getSelectedBlock();
		return {
			clientId: selectedBlock?.clientId,
			blockCommentId: selectedBlock?.attributes?.metadata?.noteId,
		};
	}, [] );
	const blockElement = useBlockElement( clientId );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );

	const unselectThread = () => {
		setNewNoteFormState( 'closed' );
		blockElement?.focus();
		toggleBlockSpotlight( clientId, false );
	};

	if (
		newNoteFormState !== 'open' ||
		! clientId ||
		undefined !== blockCommentId
	) {
		return null;
	}

	return (
		<VStack
			className={ clsx(
				'editor-collab-sidebar-panel__thread is-selected',
				{
					'is-floating': isFloating,
				}
			) }
			spacing="3"
			tabIndex={ 0 }
			aria-label={ __( 'New note' ) }
			role="treeitem"
			ref={ isFloating ? refs.setFloating : undefined }
			style={
				isFloating
					? // Delay showing the floating note box until a Y position is known to prevent blink.
					  { top: y, opacity: ! y ? 0 : undefined }
					: undefined
			}
			onBlur={ ( event ) => {
				if ( event.currentTarget.contains( event.relatedTarget ) ) {
					return;
				}
				toggleBlockSpotlight( clientId, false );
				setNewNoteFormState( 'closed' );
			} }
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					focusCommentThread( id, commentSidebarRef.current );
					setNewNoteFormState( 'creating' );
				} }
				onCancel={ unselectThread }
				reflowComments={ reflowComments }
				submitButtonText={ __( 'Add note' ) }
				labelText={ __( 'New note' ) }
			/>
		</VStack>
	);
}
