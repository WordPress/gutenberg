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
		function onClick( event ) {
			// Only handle clicks directly on the canvas itself, not on content.
			if ( event.target !== ref.current ) {
				return;
			}

			const focusableNodes = focus.focusable.find( ref.current );
			const target = findLast( focusableNodes, isTabbableTextField );

			if ( ! target ) {
				return;
			}

			placeCaretAtHorizontalEdge( target, true );
		}

		ref.current.addEventListener( 'click', onClick );

		return () => {
			ref.current.removeEventListener( 'click', onClick );
		};
	}, [] );
}
