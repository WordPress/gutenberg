/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { commentEditLink } from '@wordpress/icons';
import { getBlockContent } from '@wordpress/blocks';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
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
import { store as editorStore } from '../../store';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddComment( {
	onSubmit,
	commentSidebarRef,
	reflowComments = noop,
	isFloating = false,
	y,
	refs,
} ) {
	const { clientId, blockTextForSuggestion } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlock } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();
		const block = _clientId ? getBlock( _clientId ) : null;
		const html = block ? getBlockContent( block ) : '';
		return {
			clientId: _clientId,
			blockTextForSuggestion: html ? stripHTML( html ).trim() : '',
		};
	}, [] );
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);
	const blockElement = useBlockElement( clientId );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const [ inputMode, setInputMode ] = useState( 'note' );

	const unselectThread = () => {
		selectNote( undefined );
		blockElement?.focus();
		toggleBlockSpotlight( clientId, false );
	};

	if ( selectedNote !== 'new' || ! clientId ) {
		return null;
	}

	const isSuggestionMode = inputMode === 'suggestion';
	const threadAriaLabel = isSuggestionMode
		? __( 'New suggestion' )
		: __( 'New note' );
	const submitButtonText = isSuggestionMode
		? __( 'Add suggestion' )
		: __( 'Add note' );
	const labelText = isSuggestionMode
		? __( 'New suggestion' )
		: __( 'New note' );

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
			aria-label={ threadAriaLabel }
			role="treeitem"
			ref={ isFloating ? refs.setFloating : undefined }
			style={
				isFloating
					? // Delay showing the floating note box until a Y position is known to prevent blink.
					  { top: y, opacity: ! y ? 0 : undefined }
					: undefined
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
			<HStack justify="space-between" alignment="center" spacing="3">
				<HStack alignment="left" spacing="3">
					<CommentAuthorInfo />
				</HStack>
				<Button
					__next40pxDefaultSize
					icon={ commentEditLink }
					isPressed={ isSuggestionMode }
					label={
						isSuggestionMode
							? __( 'Switch to note' )
							: __( 'Add as suggestion' )
					}
					onClick={ () =>
						setInputMode( ( mode ) =>
							mode === 'suggestion' ? 'note' : 'suggestion'
						)
					}
					showTooltip
					size="compact"
					variant="tertiary"
				/>
			</HStack>
			<CommentForm
				key={ `${ clientId }-${ inputMode }` }
				initialComment={
					isSuggestionMode ? blockTextForSuggestion : ''
				}
				onSubmit={ async ( inputComment ) => {
					const { id } = await onSubmit( { content: inputComment } );
					selectNote( id );
					focusCommentThread( id, commentSidebarRef.current );
				} }
				onCancel={ unselectThread }
				reflowComments={ reflowComments }
				submitButtonText={ submitButtonText }
				labelText={ labelText }
			/>
		</VStack>
	);
}
