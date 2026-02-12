/**
 * Internal dependencies
 */
import { isRangeEqual } from '../../is-range-equal';

/**
 * Sometimes some browsers are not firing a `selectionchange` event when
 * changing the selection by mouse or keyboard. This hook makes sure that, if we
 * detect no `selectionchange` or `input` event between the up and down events,
 * we fire a `selectionchange` event.
 */
export default () => ( element ) => {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const selection = defaultView?.getSelection();

	let range;

	function getRange() {
		return selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	}

	function onDown( event ) {
		const type = event.type === 'keydown' ? 'keyup' : 'pointerup';

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

		range = getRange();
	}

	element.addEventListener( 'pointerdown', onDown );
	element.addEventListener( 'keydown', onDown );
	return () => {
		element.removeEventListener( 'pointerdown', onDown );
		element.removeEventListener( 'keydown', onDown );
	};
};
