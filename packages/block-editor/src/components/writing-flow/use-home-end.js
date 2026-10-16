import { HOME, END } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { getSelectionEditableElement } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';

/**
 * Moves the caret to the start or end of the visual line for Home and End
 * with `Selection.modify()`, because the browser's default caret movement
 * cannot be relied on in two cases:
 *
 * - While the wrapper is the contentEditable editing host (a selected block
 *   supports `editableRoot`), browsers don't perform the default caret
 *   movement for Home and End.
 * - Chromium on macOS maps Home and End to scroll commands, so it never
 *   moves the caret in editable content on that platform, including nested
 *   editable elements like the tab labels in the tab-list block.
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

			// Only handle keys pressed in editable content, in both of the
			// cases mentioned above: `event.target` is the focused element,
			// and `isContentEditable` is true both for the wrapper as the
			// editing host and for a nested editable element like a tab label.
			// Anything else that takes focus like inputs and textareas keep
			// default behavior.
			if ( ! event.target.isContentEditable || hasMultiSelection() ) {
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
