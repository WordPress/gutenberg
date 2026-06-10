/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const { keyboardShortcuts } = props.current;

	// When the editing host is an ancestor (the writing flow wrapper), keydown
	// events target that host rather than this element, so determine relevance
	// from the selection rather than the event target.
	function isSelectionInElement() {
		const { anchorNode, focusNode } = defaultView.getSelection();
		return element.contains( anchorNode ) && element.contains( focusNode );
	}

	function onKeyDown( event ) {
		if ( ! isSelectionInElement() ) {
			return;
		}
		for ( const keyboardShortcut of keyboardShortcuts.current ) {
			keyboardShortcut( event );
		}
	}

	return subscribeDelegatedListener(
		ownerDocument,
		'keydown',
		onKeyDown,
		true
	);
};
