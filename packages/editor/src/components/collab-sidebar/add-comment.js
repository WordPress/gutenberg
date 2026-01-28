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
	// eslint-disable-next-line no-unused-vars
	openNoteForm,
	closeNoteForm,
	isNoteFormOpen,
	commentSidebarRef,
	reflowComments = noop,
	isFloating = false,
	y,
	refs,
	getDraftNote = () => '',
	setDraftNote = noop,
	clearDraftNote = noop,
} ) {
	const { clientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return {
			clientId: getSelectedBlockClientId(),
		};
	}, [] );
	const blockElement = useBlockElement( clientId );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );

	// Use clientId as the draft key for new notes
	const draftKey = `new-note-${ clientId }`;

	const unselectThread = () => {
		closeNoteForm( clientId );
		blockElement?.focus();
		toggleBlockSpotlight( clientId, false );
	};

	if ( ! isNoteFormOpen( clientId ) || ! clientId ) {
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
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					focusCommentThread( id, commentSidebarRef.current );
					closeNoteForm( clientId );
					clearDraftNote( draftKey );
				} }
				onCancel={ () => {
					clearDraftNote( draftKey );
					unselectThread();
				} }
				reflowComments={ reflowComments }
				submitButtonText={ __( 'Add note' ) }
				labelText={ __( 'New note' ) }
				draftValue={ getDraftNote( draftKey ) }
				onDraftChange={ ( value ) => setDraftNote( draftKey, value ) }
			/>
		</VStack>
	);
}
