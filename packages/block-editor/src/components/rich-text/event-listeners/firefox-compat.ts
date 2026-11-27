import { store as blockEditorStore } from '../../../store';
import type { RichTextEventListener } from '../types';

const firefoxCompat: RichTextEventListener = ( props ) => ( element ) => {
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
		// A field always has a parent.
		const parentEditable = element.parentElement!.closest< HTMLElement >(
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

export default firefoxCompat;
