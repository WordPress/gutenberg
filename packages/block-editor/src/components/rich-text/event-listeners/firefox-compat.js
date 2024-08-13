/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export default ( props ) => ( element ) => {
	function onFocus() {
		const { registry } = props.current;
		if ( ! registry.select( blockEditorStore ).isMultiSelecting() ) {
			return;
		}

		// This is a little hack to work around focus issues with nested
		// editable elements in Firefox. For some reason the editable child
		// element sometimes regains focus, while it should not be focusable
		// and focus should remain on the editable parent element.
		// To do: try to find the cause of the shifting focus.
		const parentEditable = element.parentElement.closest(
			'[contenteditable="true"]'
		);

		if ( parentEditable ) {
			parentEditable.focus();
		}
	}

	element.addEventListener( 'focus', onFocus );
	return () => {
		element.removeEventListener( 'focus', onFocus );
	};
};
