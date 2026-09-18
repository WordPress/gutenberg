import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId } from '../../utils/dom';

export default function useClickSelection() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockSelectionStart,
		getSelectionStart,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
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
						// When the selected block has no text selection
						// within it (e.g. an image or spacer), there is no
						// native selection for the wrapper to adopt when it
						// is focused, so Safari inserts a caret at the start
						// of the wrapper and asynchronously reveals it,
						// scrolling a scrolled-down viewport back up, which
						// `preventScroll` does not cover. Leave focus alone
						// in that case: the click moves it.
						const { clientId, attributeKey } = getSelectionStart();
						setContentEditableWrapper( node, true, {
							focus: !! attributeKey,
						} );

						// The browser extends the selection from the native
						// anchor. When a block is selected without a text
						// selection within it, there is no native anchor,
						// and browsers synthesize one at the nearest text
						// instead, excluding the block itself. Give the
						// browser the right anchor before it acts on the
						// click: the near edge of the selected block, so the
						// whole block ends up within the extended selection.
						const { ownerDocument } = node;
						const selection =
							ownerDocument.defaultView.getSelection();
						const blockElement =
							! attributeKey &&
							ownerDocument.getElementById(
								`block-${ clientId }`
							);

						if (
							blockElement &&
							! (
								selection.anchorNode &&
								blockElement.contains( selection.anchorNode )
							)
						) {
							const isForward =
								// eslint-disable-next-line no-bitwise
								blockElement.compareDocumentPosition(
									event.target
								) & node.DOCUMENT_POSITION_FOLLOWING;
							selection.setPosition(
								blockElement,
								isForward ? 0 : blockElement.childNodes.length
							);
						}

						// Safari does not extend the selection to a
						// clicked position within an element with a
						// tabIndex, or within a block whose wrapper has
						// one (a list item): the mousedown default action
						// focuses the element instead, discarding the
						// selection. Remove the tabIndex for the duration
						// of the click. Restoring it any earlier (e.g. in
						// a microtask, which runs before the default
						// action) puts it back in time for Safari to
						// focus it.
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
							const { defaultView } = ownerDocument;
							const restore = () => {
								defaultView.removeEventListener(
									'mouseup',
									restore
								);
								defaultView.removeEventListener(
									'dragend',
									restore
								);
								for ( const [ el, value ] of stripped ) {
									el.setAttribute( 'tabindex', value );
								}
							};
							// The press normally ends with a mouseup, but
							// with a dragend instead when a native drag
							// starts mid-press.
							defaultView.addEventListener( 'mouseup', restore );
							defaultView.addEventListener( 'dragend', restore );
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
			getSelectionStart,
			hasMultiSelection,
		]
	);
}
