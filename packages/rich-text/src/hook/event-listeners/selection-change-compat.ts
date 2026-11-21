import { isRangeEqual } from '../../is-range-equal';
import type { RichTextField } from '../types';

/**
 * Sometimes some browsers are not firing a `selectionchange` event when
 * changing the selection by mouse or keyboard. This hook makes sure that, if we
 * detect no `selectionchange` or `input` event between the up and down events,
 * we fire a `selectionchange` event.
 *
 * @param field The field.
 * @param event The pointer or key down event.
 */
export function onDown( field: RichTextField, event: Event ) {
	const { ownerDocument } = field.element;
	const { defaultView } = ownerDocument;
	const selection = defaultView?.getSelection();
	const type = event.type === 'keydown' ? 'keyup' : 'pointerup';

	function getRange() {
		return selection!.rangeCount ? selection!.getRangeAt( 0 ) : null;
	}

	const range = getRange();

	function onCancel() {
		ownerDocument.removeEventListener( type, onUp );
		ownerDocument.removeEventListener( 'selectionchange', onCancel );
		ownerDocument.removeEventListener( 'input', onCancel );
	}

	function onUp() {
		onCancel();
		if ( isRangeEqual( range, getRange() ) ) {
			return;
		}
		ownerDocument.dispatchEvent( new Event( 'selectionchange' ) );
	}

	ownerDocument.addEventListener( type, onUp );
	ownerDocument.addEventListener( 'selectionchange', onCancel );
	ownerDocument.addEventListener( 'input', onCancel );
}
