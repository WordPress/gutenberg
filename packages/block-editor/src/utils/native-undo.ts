import { useRefEffect } from '@wordpress/compose';

/**
 * Elements whose content the browser's own undo acts on (a dialog input, an
 * HTML editing field, a search field), registered through `useNativeUndo`.
 * The editor history must not act on events originating within them.
 */
const nativeUndoNodes = new WeakSet< Element >();

/**
 * Returns a ref that marks an element (and its descendants) as relying on
 * the browser's own undo, so the editor history leaves the undo and redo
 * shortcuts alone within it.
 *
 * @return Ref callback.
 */
export function useNativeUndo() {
	return useRefEffect< Element >( ( node ) => {
		nativeUndoNodes.add( node );
		return () => {
			nativeUndoNodes.delete( node );
		};
	}, [] );
}

/**
 * Returns true when the event originates from an element registered through
 * `useNativeUndo`.
 *
 * Events coming from the editor canvas are re-dispatched on the iframe
 * element, so the real target is resolved through the frame's focused
 * element.
 *
 * @param event Keyboard event.
 *
 * @return Whether the element relies on the browser's own undo.
 */
export function usesNativeUndo( event: KeyboardEvent ): boolean {
	let target = event.target as Element | null | undefined;

	if ( target?.nodeName === 'IFRAME' ) {
		target = ( target as HTMLIFrameElement ).contentDocument?.activeElement;
	}

	while ( target ) {
		if ( nativeUndoNodes.has( target ) ) {
			return true;
		}
		target = target.parentElement;
	}

	return false;
}
