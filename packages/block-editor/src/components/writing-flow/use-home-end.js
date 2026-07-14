/**
 * WordPress dependencies
 */
import { HOME, END } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getSelectionEditableElement } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';

/**
 * While the wrapper is the contentEditable editing host (a selected block
 * supports `editableRoot`), browsers don't perform the default caret
 * movement for Home and End. Perform the equivalent movement with
 * `Selection.modify()`.
 */
export default function useHomeEnd() {
	const { hasMultiSelection } = useSelect( blockEditorStore );
	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode !== HOME && event.keyCode !== END ) {
				return;
			}

			if ( event.metaKey || event.ctrlKey || event.altKey ) {
				return;
			}

			if (
				node.contentEditable !== 'true' ||
				node.ownerDocument.activeElement !== node ||
				hasMultiSelection()
			) {
				return;
			}

			const selection = node.ownerDocument.defaultView.getSelection();

			if ( ! getSelectionEditableElement( selection, node ) ) {
				return;
			}

			event.preventDefault();
			selection.modify(
				event.shiftKey ? 'extend' : 'move',
				event.keyCode === HOME ? 'backward' : 'forward',
				'lineboundary'
			);
		}

		node.addEventListener( 'keydown', onKeyDown );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
