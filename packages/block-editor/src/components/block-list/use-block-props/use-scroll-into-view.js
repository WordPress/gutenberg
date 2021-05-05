/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export function useScrollIntoView( clientId ) {
	const ref = useRef();
	const isSelectionEnd = useSelect(
		( select ) => {
			const { isBlockSelected, getBlockSelectionEnd } = select(
				blockEditorStore
			);

			return (
				isBlockSelected( clientId ) ||
				getBlockSelectionEnd() === clientId
			);
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! isSelectionEnd ) {
			return;
		}

		const extentNode = ref.current;

		// If the block is focused, the browser will already have scrolled into
		// view if necessary.
		if ( extentNode.contains( extentNode.ownerDocument.activeElement ) ) {
			return;
		}

		let scrollContainer = getScrollContainer( extentNode );

		// If there's no scroll container, then we check whether the
		// node is in an iframe. If it's in an iframe then we check
		// if it's scrollable or not. If it's scrollable we proceed
		// on and tell the `scrollIntoView` to scroll the iframe.
		if ( ! scrollContainer ) {
			const { ownerDocument } = extentNode;
			const isFramed = !! ownerDocument.defaultView?.frameElement;
			const scrollingElement =
				ownerDocument.scrollingElement || ownerDocument.body;
			if (
				isFramed &&
				scrollingElement.scrollHeight > scrollingElement.clientHeight
			) {
				scrollContainer = ownerDocument.defaultView;
			} else {
				return;
			}
		}

		scrollIntoView( extentNode, scrollContainer, {
			onlyScrollIfNeeded: true,
		} );
	}, [ isSelectionEnd ] );

	return ref;
}
