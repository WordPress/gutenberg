/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalHStack as HStack } from '@wordpress/components';
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
import { FloatingContainer } from './floating-container';
import { focusCommentThread } from './utils';
import { store as editorStore } from '../../store';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddComment( { onSubmit, commentSidebarRef, floating } ) {
	const { clientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return {
			clientId: getSelectedBlockClientId(),
		};
	}, [] );
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);
	const blockElement = useBlockElement( clientId );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );

	const unselectThread = () => {
		selectNote( undefined );
		blockElement?.focus();
		toggleBlockSpotlight( clientId, false );
	};

	if ( selectedNote !== 'new' || ! clientId ) {
		return null;
	}

	return (
		<FloatingContainer
			floating={ floating }
			className="editor-collab-sidebar-panel__thread is-selected"
			spacing="3"
			tabIndex={ 0 }
			aria-label={ __( 'New note' ) }
			role="treeitem"
			style={
				floating ? { opacity: ! floating.y ? 0 : undefined } : undefined
			}
			onBlur={ ( event ) => {
				// Don't deselect notes when the browser window/tab loses focus.
				if ( ! document.hasFocus() ) {
					return;
				}
				if ( event.currentTarget.contains( event.relatedTarget ) ) {
					return;
				}
				toggleBlockSpotlight( clientId, false );
				selectNote( undefined );
			} }
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					selectNote( id );
					focusCommentThread( id, commentSidebarRef.current );
				} }
				onCancel={ unselectThread }
				submitButtonText={ __( 'Add note' ) }
				labelText={ __( 'New note' ) }
			/>
		</FloatingContainer>
	);
}
