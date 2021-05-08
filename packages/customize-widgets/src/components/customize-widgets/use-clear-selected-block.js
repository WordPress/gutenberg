/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * We can't just use <BlockSelectionClearer> because the customizer has
 * many root nodes rather than just one in the post editor.
 * We need to listen to the focus events in all those roots, and also in
 * the preview iframe.
 *
 * @param {Object} sidebarControl The sidebar control instance.
 * @param {Object} popoverRef The ref object of the popover node container.
 */
export default function useClearSelectedBlock( sidebarControl, popoverRef ) {
	const { hasSelectedBlock, hasMultiSelection } = useSelect(
		blockEditorStore
	);
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( popoverRef.current && sidebarControl ) {
			const inspectorContainer =
				sidebarControl.inspector.contentContainer[ 0 ];
			const container = sidebarControl.container[ 0 ];
			const ownerDocument = container.ownerDocument;
			const ownerWindow = ownerDocument.defaultView;

			function handleClearSelectedBlock( element ) {
				if (
					// 1. Make sure there are blocks being selected.
					( hasSelectedBlock() || hasMultiSelection() ) &&
					// 2. The element should exist in the DOM (not deleted).
					element &&
					ownerDocument.contains( element ) &&
					// 3. It should also not exist in the container, inspector, nor the popover.
					! container.contains( element ) &&
					! popoverRef.current.contains( element ) &&
					! inspectorContainer.contains( element )
				) {
					clearSelectedBlock();
				}
			}

			// Handle focusing in the same document.
			function handleFocus( event ) {
				handleClearSelectedBlock( event.target );
			}
			// Handle focusing outside the current document, like to iframes.
			function handleBlur() {
				handleClearSelectedBlock( ownerDocument.activeElement );
			}

			ownerDocument.addEventListener( 'focusin', handleFocus );
			ownerWindow.addEventListener( 'blur', handleBlur );

			return () => {
				ownerDocument.removeEventListener( 'focusin', handleFocus );
				ownerWindow.removeEventListener( 'blur', handleBlur );
			};
		}
	}, [
		popoverRef,
		sidebarControl,
		hasSelectedBlock,
		hasMultiSelection,
		clearSelectedBlock,
	] );
}
