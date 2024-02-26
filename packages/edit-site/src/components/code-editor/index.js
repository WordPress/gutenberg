/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { Button, VisuallyHidden } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function CodeEditor() {
	const instanceId = useInstanceId( CodeEditor );
	const { shortcut, content, blocks, type, id } = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		const _type = getEditedPostType();
		const _id = getEditedPostId();
		const editedRecord = getEditedEntityRecord( 'postType', _type, _id );

		return {
			shortcut: getShortcutRepresentation( 'core/editor/toggle-mode' ),
			content: editedRecord?.content,
			blocks: editedRecord?.blocks,
			type: _type,
			id: _id,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );
	// Replicates the logic found in getEditedPostContent().
	const realContent = useMemo( () => {
		if ( content instanceof Function ) {
			return content( { blocks } );
		} else if ( blocks ) {
			// If we have parsed blocks already, they should be our source of truth.
			// Parsing applies block deprecations and legacy block conversions that
			// unparsed content will not have.
			return __unstableSerializeAndClean( blocks );
		}
		return content;
	}, [ content, blocks ] );

	const { switchEditorMode } = useDispatch( editorStore );
	return (
		<div className="edit-site-code-editor">
			<div className="edit-site-code-editor__toolbar">
				<h2>{ __( 'Editing code' ) }</h2>
				<Button
					variant="tertiary"
					onClick={ () => switchEditorMode( 'visual' ) }
					shortcut={ shortcut }
				>
					{ __( 'Exit code editor' ) }
				</Button>
			</div>
			<div className="edit-site-code-editor__body">
				<VisuallyHidden
					as="label"
					htmlFor={ `code-editor-text-area-${ instanceId }` }
				>
					{ __( 'Type text or HTML' ) }
				</VisuallyHidden>
				<Textarea
					autoComplete="off"
					dir="auto"
					value={ realContent }
					onChange={ ( event ) => {
						editEntityRecord( 'postType', type, id, {
							content: event.target.value,
							blocks: undefined,
							selection: undefined,
						} );
					} }
					className="edit-site-code-editor-text-area"
					id={ `code-editor-text-area-${ instanceId }` }
					placeholder={ __( 'Start writing with text or HTML' ) }
				/>
			</div>
		</div>
	);
}
