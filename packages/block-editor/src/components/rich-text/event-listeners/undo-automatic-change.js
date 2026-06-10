/**
 * WordPress dependencies
 */
import { BACKSPACE, ESCAPE } from '@wordpress/keycodes';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;

	// When the editing host is an ancestor (the writing flow wrapper), keydown
	// events target that host rather than this element, so determine relevance
	// from the selection rather than the event target.
	function isSelectionInElement() {
		const { anchorNode, focusNode } = defaultView.getSelection();
		return element.contains( anchorNode ) && element.contains( focusNode );
	}

	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== BACKSPACE && keyCode !== ESCAPE ) {
			return;
		}

		if ( ! isSelectionInElement() ) {
			return;
		}

		const { registry } = props.current;
		const { didAutomaticChange, getSettings } =
			registry.select( blockEditorStore );

		const { __experimentalUndo } = getSettings();

		if ( ! __experimentalUndo ) {
			return;
		}

		if ( ! didAutomaticChange() ) {
			return;
		}

		event.preventDefault();
		__experimentalUndo();
	}

	return subscribeDelegatedListener( ownerDocument, 'keydown', onKeyDown );
};
