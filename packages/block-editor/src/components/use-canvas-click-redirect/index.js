/**
 * External dependencies
 */
import { overEvery, findLast } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';

/**
 * Given an element, returns true if the element is a tabbable text field, or
 * false otherwise.
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element is a tabbable text field.
 */
const isTabbableTextField = overEvery( [
	isTextField,
	focus.tabbable.isTabbableIndex,
] );

export function useCanvasClickRedirect( ref ) {
	useEffect( () => {
		function onMouseDown( event ) {
			// Only handle clicks on the canvas, not the content.
			if ( event.target !== ref.current ) {
				return;
			}

			const focusableNodes = focus.focusable.find( ref.current );
			const target = findLast( focusableNodes, isTabbableTextField );

			if ( ! target ) {
				return;
			}

			placeCaretAtHorizontalEdge( target, true );
			event.preventDefault();
		}

		ref.current.addEventListener( 'mousedown', onMouseDown );

		return () => {
			ref.current.addEventListener( 'mousedown', onMouseDown );
		};
	}, [] );
}
