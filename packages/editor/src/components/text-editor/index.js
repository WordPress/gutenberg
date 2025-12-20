/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostTextEditor from '../post-text-editor';
import PostTitleRaw from '../post-title/post-title-raw';

export default function TextEditor( { autoFocus = false } ) {
	const { switchEditorMode } = useDispatch( editorStore );
	const { shortcut, isRichEditingEnabled } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		return {
			shortcut: getShortcutRepresentation( 'core/editor/toggle-mode' ),
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
		};
	}, [] );

	const titleRef = useRef();
	useEffect( () => {
		if ( autoFocus ) {
			return;
		}
		titleRef?.current?.focus();
	}, [ autoFocus ] );

	return (
		<div className="editor-text-editor">
			{ isRichEditingEnabled && (
				<div className="editor-text-editor__toolbar">
					<h2>{ __( 'Editing code' ) }</h2>
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => switchEditorMode( 'visual' ) }
						shortcut={ shortcut }
					>
						{ __( 'Exit code editor' ) }
					</Button>
				</div>
			) }
			<div className="editor-text-editor__body">
				<PostTitleRaw ref={ titleRef } />
				<PostTextEditor />
			</div>
		</div>
	);
}
