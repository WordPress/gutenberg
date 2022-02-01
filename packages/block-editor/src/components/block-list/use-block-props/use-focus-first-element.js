/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';
import { setContentEditableWrapper } from './use-multi-selection';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns the initial position if the block needs to be focussed, `undefined`
 * otherwise. The initial position is either 0 (start) or -1 (end).
 *
 * @param {string} clientId Block client ID.
 *
 * @return {number} The initial position, either 0 (start) or -1 (end).
 */
function useInitialPosition( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getSelectedBlocksInitialCaretPosition,
				isMultiSelecting,
				isNavigationMode,
				isBlockSelected,
			} = select( blockEditorStore );

			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			if ( isMultiSelecting() || isNavigationMode() ) {
				return;
			}

			// If there's no initial position, return 0 to focus the start.
			return getSelectedBlocksInitialCaretPosition();
		},
		[ clientId ]
	);
}

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected and an initial position is set.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {RefObject} React ref with the block element.
 */
export function useFocusFirstElement( clientId ) {
	const ref = useRef();
	const initialPosition = useInitialPosition( clientId );

	useEffect( () => {
		if ( initialPosition === undefined || initialPosition === null ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Do not focus the block if it already contains the active element.
		if ( ref.current.contains( ownerDocument.activeElement ) ) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable
			.find( ref.current )
			.filter( ( node ) => isTextField( node ) );

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target =
			( isReverse ? last : first )( textInputs ) || ref.current;

		if ( ! isInsideRootBlock( ref.current, target ) ) {
			ref.current.focus();
			return;
		}

		// Check to see if Block contains focussable element before a generic caret insert.
		if ( ! ref.current.getAttribute( 'contenteditable' ) ) {
			const whitelistTags = [ 'a', 'button', 'td' ];
			let focusElements;
			let firstFocusElements = true;
			// In the event a Block has children, focus will find the next element with tabindex which would happen to be the wrapping element of a child Block. This ensures we only focus on whitelisted tag such as link/button.
			do {
				// The first element may be okay to focus. Go ahead and check.
				if ( firstFocusElements ) {
					focusElements = focus.tabbable.findNext( ref.current );
					firstFocusElements = false;
				} else {
					focusElements = focus.tabbable.findNext( focusElements );
				}
				// Need to make sure we're still in the current Block, if not, we could run in to trouble if focus is placed in a Block further down the page.
				if ( ! ref.current.contains( focusElements ) ) break;
			} while (
				! whitelistTags.some(
					( tag ) => focusElements.tagName.toLowerCase() === tag
				)
			);
			if ( focusElements ) {
				focusElements.focus();
				return;
			}
		}

		setContentEditableWrapper( ref.current, false );

		placeCaretAtHorizontalEdge( target, isReverse );
	}, [ initialPosition ] );

	return ref;
}
