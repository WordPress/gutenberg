import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import {
	getBlockClientId,
	getSelectionEditableElement,
	isInsideRootBlock,
} from '../../utils/dom';
import { unlock } from '../../lock-unlock';

const FIELD_SELECTOR = '[data-wp-block-attribute-key]';
// A field edited through the host has no contenteditable attribute of its
// own. Rich text renders the selected hosting block's field like that too,
// so the DOM says which field is hosted.
const HOSTED_FIELD_SELECTOR = `${ FIELD_SELECTOR }:not([contenteditable])`;

/**
 * Keeps the writing flow wrapper contentEditable while the selected block
 * supports `editableRoot`, so the native selection can extend across blocks.
 * The switch is imperative and happens when the selection changes, in the
 * same tick: the wrapper becomes the editing host and the selected block's
 * field stops being an editable element of its own, together. Rich text
 * renders the same state for the field, so a later render does not restore
 * its attributes. While the wrapper is editable it must also hold focus: a
 * nested editable element cannot retain focus once an ancestor becomes an
 * editing host (the first DOM mutation moves focus to the host,
 * inconsistently across browsers).
 */
export default function useEditableRoot() {
	const registry = useRegistry();

	return useRefEffect(
		( node ) => {
			const {
				getSelectedBlockClientId,
				canHostEditableRoot,
				isZoomOut,
				hasMultiSelection,
				isMultiSelecting,
			} = unlock( registry.select( blockEditorStore ) );
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			// A hosting block has a single field, which may be the block
			// element itself (paragraph) or a descendant (list item).
			function getField( clientId ) {
				const blockElement = node.querySelector(
					`[data-block="${ clientId }"]`
				);
				if ( ! blockElement ) {
					return;
				}
				return [
					blockElement,
					...blockElement.querySelectorAll( FIELD_SELECTOR ),
				].find(
					( element ) =>
						element.matches( FIELD_SELECTOR ) &&
						isInsideRootBlock( blockElement, element )
				);
			}

			// Makes the hosted field an editable element again.
			function releaseField() {
				node.querySelector( HOSTED_FIELD_SELECTOR )?.setAttribute(
					'contenteditable',
					'true'
				);
			}

			function engage( clientId ) {
				// Focus is moved separately below, only when an editable
				// element belonging to a block holds it.
				if (
					! setContentEditableWrapper( node, true, { focus: false } )
				) {
					return;
				}

				// Move focus from a block's editable element to the wrapper,
				// including the block the host moves away from: the rich
				// text hook applies the new selection only while the host
				// holds focus. Never steal focus from other regions (e.g.
				// List View), UI elements (e.g. buttons), or other editables
				// within the wrapper (e.g. the post title). The selection is
				// preserved. If the selection is still outside the focused
				// element, a mousedown just focused it and the browser has
				// not placed the caret yet; moving focus now would cancel the
				// pending caret placement. The selection observer moves focus
				// once the selection lands.
				const { activeElement } = ownerDocument;
				const selection = defaultView.getSelection();
				if (
					activeElement !== node &&
					activeElement?.isContentEditable &&
					node.contains( activeElement ) &&
					getBlockClientId( activeElement ) &&
					selection.anchorNode &&
					activeElement.contains( selection.anchorNode )
				) {
					node.focus();
				}

				// The field is edited through the host now. Remove the
				// attribute so it is not an editing host nested in it, and
				// the tabindex that made it a focus target. The field of a
				// block that is not in the DOM yet renders like this.
				releaseField();
				const field = getField( clientId );
				field?.removeAttribute( 'contenteditable' );
				field?.removeAttribute( 'tabindex' );
			}

			function disengage() {
				releaseField();
				setContentEditableWrapper( node, false );

				// If the wrapper held focus, return focus to the editable
				// element containing the selection, which is focusable
				// again now that the wrapper is no longer an editing host.
				// Only do so if that element belongs to the selected block:
				// when the selection moved to another block through the
				// store, the stale DOM selection must not reclaim block
				// selection through its focus handler.
				if ( ownerDocument.activeElement === node ) {
					const editable = getSelectionEditableElement(
						defaultView.getSelection(),
						node
					);
					if (
						editable &&
						getBlockClientId( editable ) ===
							getSelectedBlockClientId()
					) {
						editable.focus();
					}
				}
			}

			function sync() {
				// A multi-selection owns the wrapper as its editing host: the
				// host and its textbox semantics remain, and the selection
				// observer disables both together when the selection
				// collapses. Removing the attributes here would strip the
				// accessible name off the focused editing host at the moment
				// cross-block editing begins. The fields stay inert too: rich
				// text renders every multi-selected block's field inert.
				if ( hasMultiSelection() || isMultiSelecting() ) {
					return;
				}

				const clientId = getSelectedBlockClientId();
				const enabled =
					! isZoomOut() && canHostEditableRoot( clientId );

				if ( ! enabled ) {
					if ( node.contentEditable === 'true' ) {
						disengage();
					}
					return;
				}

				const field = getField( clientId );
				if ( field && ! field.hasAttribute( 'contenteditable' ) ) {
					// Already hosted. The selection observer may have
					// disengaged the host when a multi-selection collapsed
					// back into this block.
					setContentEditableWrapper( node, true, { focus: false } );
					return;
				}

				engage( clientId );
			}

			sync();
			const unsubscribe = registry.subscribe( sync, blockEditorStore );

			return () => {
				unsubscribe();
				if ( node.contentEditable === 'true' ) {
					disengage();
				}
			};
		},
		[ registry ]
	);
}
