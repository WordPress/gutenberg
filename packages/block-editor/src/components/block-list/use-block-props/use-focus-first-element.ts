import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { isInsideRootBlock } from '../../../utils/dom';
import { focusBlock } from '../../../utils/focus-block';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected and an initial position is set.
 *
 * @param options                 Options.
 * @param options.clientId        Block client ID.
 * @param options.initialPosition Where to place the caret, `true` to focus the block.
 *
 * @return React ref with the block element.
 */
export function useFocusFirstElement( {
	clientId,
	initialPosition,
}: {
	clientId: string;
	initialPosition?: number | boolean | null;
} ) {
	const ref = useRef< HTMLElement >( null );
	const { isBlockSelected, isMultiSelecting, isZoomOut, getSelectionStart } =
		unlock( useSelect( blockEditorStore ) );

	useEffect( () => {
		// Check if the block is still selected at the time this effect runs.
		if (
			! isBlockSelected( clientId ) ||
			isMultiSelecting() ||
			isZoomOut()
		) {
			return;
		}

		if ( initialPosition === undefined || initialPosition === null ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Preserve the active element and caret while interacting with editor UI.
		if ( isInsideRootBlock( ref.current, ownerDocument.activeElement! ) ) {
			return;
		}

		focusBlock( ref.current, initialPosition, ( target ) => {
			// An editable canvas can own the caret without focusing the block.
			// Keep a deliberate caret, but let a leftover one yield to a requested
			// reverse position (for example, when merging with Backspace).
			const activeElement =
				ownerDocument.activeElement as HTMLElement | null;
			const selection = ownerDocument.defaultView!.getSelection()!;
			const { clientId: selectionClientId, offset } = getSelectionStart();
			const hasCaret =
				activeElement?.isContentEditable &&
				activeElement.contains( target ) &&
				!! selection.anchorNode &&
				target.contains( selection.anchorNode );
			const isDeliberate =
				initialPosition === 0 ||
				( offset !== undefined && selectionClientId === clientId );
			return !! ( hasCaret && isDeliberate );
		} );
	}, [
		initialPosition,
		clientId,
		getSelectionStart,
		isBlockSelected,
		isMultiSelecting,
		isZoomOut,
	] );

	return ref;
}
