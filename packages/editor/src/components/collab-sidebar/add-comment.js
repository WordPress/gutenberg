/**
 * External dependencies
 */
import clsx from 'clsx';

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

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import CommentAuthorInfo from './comment-author-info';
import CommentForm from './comment-form';
import { focusCommentThread } from './utils';
import { useFloatingThread } from './hooks';
import { useEffect } from 'react';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddComment( {
	onSubmit,
	showCommentBoard,
	setShowCommentBoard,
	commentSidebarRef,
	isFloating,
	thread,
	calculatedOffset,
	setHeights,
	setBlockRef,
	selectedThread,
	setSelectedThread,
	commentLastUpdated,
	reflowComments,
} ) {
	const { clientId, blockCommentId } = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		const selected = getSelectedBlock();
		return {
			clientId: selected?.clientId,
			blockCommentId: selected?.attributes?.metadata?.noteId,
		};
	}, [] );

	const blockElement = useBlockElement( clientId );
	console.log( 'blockElement:', blockElement );
	const { y, refs } = useFloatingThread( {
		thread,
		calculatedOffset,
		setHeights,
		setBlockRef,
		selectedThread,
		commentLastUpdated,
	} );

	// Reflow comments when rendered.
	useEffect( () => {
		setSelectedThread( thread );
		reflowComments();

	}, [] );

	if ( ! showCommentBoard || ! clientId || undefined !== blockCommentId ) {
		return null;
	}



	console.log( { isFloating, thread, refs } );

	return (
		<VStack
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': true,
				'is-floating': isFloating,
			} ) }
			spacing="3"
			tabIndex={ 0 }
			role="listitem"
			ref={ isFloating ? refs.setFloating : undefined }
			style={ isFloating ? { top: y } : undefined }
		>
			<HStack alignment="left" spacing="3">
				<CommentAuthorInfo />
			</HStack>
			<CommentForm
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					focusCommentThread( id, commentSidebarRef.current );
					setShowCommentBoard( false );
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
