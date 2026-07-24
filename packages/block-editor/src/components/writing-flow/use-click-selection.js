/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId } from '../../utils/dom';

export default function useClickSelection() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { isSelectionEnabled, getBlockSelectionStart, hasMultiSelection } =
		useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				const startClientId = getBlockSelectionStart();
				const clickedClientId = getBlockClientId( event.target );

				if ( event.shiftKey ) {
					// When selecting a single block in a document by holding the shift key,
					// don't mark this action as multiselection.
					if ( startClientId && startClientId !== clickedClientId ) {
						setContentEditableWrapper( node, true );

						// Safari does not extend the selection to a
						// clicked position within an element with a
						// tabIndex, or within a block whose wrapper has
						// one (a list item): it focuses the element
						// instead, discarding the selection. Remove the
						// tabIndex for the duration of the click.
						const stripped = [];
						let element = event.target;
						while ( element && element !== node ) {
							if (
								element.hasAttribute?.( 'tabindex' ) &&
								element.contentEditable !== 'true'
							) {
								stripped.push( [
									element,
									element.getAttribute( 'tabindex' ),
								] );
								element.removeAttribute( 'tabindex' );
							}
							element = element.parentElement;
						}
						if ( stripped.length ) {
							node.ownerDocument.defaultView.addEventListener(
								'mouseup',
								() => {
									for ( const [ el, value ] of stripped ) {
										el.setAttribute( 'tabindex', value );
									}
								},
								{ once: true }
							);
						}
					}
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					selectBlock( clickedClientId );
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[
			selectBlock,
			isSelectionEnabled,
			getBlockSelectionStart,
			hasMultiSelection,
		]
	);
}
