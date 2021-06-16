/**
 * External dependencies
 */
import { overEvery, findLast } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
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

export function useCanvasClickRedirect() {
	return useRefEffect( ( node ) => {
		function onMouseDown( event ) {
			// Only handle clicks on the canvas, not the content.
			if ( event.target !== node ) {
				return;
			}

			const focusableNodes = focus.focusable.find( node );
			const target = findLast( focusableNodes, isTabbableTextField );

			if ( ! target ) {
				return;
			}

			const { bottom } = target.getBoundingClientRect();

			// Ensure the click is below the last block.
			if ( event.clientY < bottom ) {
				return;
			}

			placeCaretAtHorizontalEdge( target, true );
			event.preventDefault();
		}

		node.addEventListener( 'mousedown', onMouseDown );

		return () => {
			node.addEventListener( 'mousedown', onMouseDown );
		};
	}, [] );
}
