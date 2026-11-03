import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { usesNativeUndo } = unlock( blockEditorPrivateApis );

/**
 * Runs the editor's undo and redo when the browser undoes or redoes in the
 * canvas (the Edit menu, the context menu, shake to undo), instead of letting
 * the browser change the content outside the editor history.
 */
export function useHistoryInput() {
	const registry = useRegistry();

	return useRefEffect(
		( node ) => {
			let timeout;

			function onBeforeInput( event ) {
				const { inputType } = event;

				if (
					( inputType !== 'historyUndo' &&
						inputType !== 'historyRedo' ) ||
					usesNativeUndo( event )
				) {
					return;
				}

				event.preventDefault();

				// WebKit fires one event per step of its own history for a
				// single undo or redo, so only the first in a task counts.
				if ( timeout ) {
					return;
				}

				timeout = node.ownerDocument.defaultView.setTimeout( () => {
					timeout = undefined;
				} );

				const { undo, redo } = registry.dispatch( editorStore );

				if ( inputType === 'historyUndo' ) {
					undo();
				} else {
					redo();
				}
			}

			node.addEventListener( 'beforeinput', onBeforeInput );

			return () => {
				node.removeEventListener( 'beforeinput', onBeforeInput );
				node.ownerDocument.defaultView.clearTimeout( timeout );
			};
		},
		[ registry ]
	);
}
