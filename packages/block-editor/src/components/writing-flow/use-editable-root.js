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

const EDITABLE_SELECTOR = '[contenteditable="true"]';
// Mark the elements the switch handed to the host, holding the tabindex
// each had: the field, and the block element when that is not the field.
const HOSTED_FIELD_ATTRIBUTE = 'data-wp-hosted-field';
const HOSTED_BLOCK_ATTRIBUTE = 'data-wp-hosted-block';

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

			// The block's own editable element: the block element itself
			// (paragraph) or a descendant (list item), not a nested block's.
			function getField( clientId ) {
				const blockElement = node.querySelector(
					`[data-block="${ clientId }"]`
				);
				if ( ! blockElement ) {
					return;
				}
				if ( blockElement.matches( EDITABLE_SELECTOR ) ) {
					return blockElement;
				}
				return Array.from(
					blockElement.querySelectorAll( EDITABLE_SELECTOR )
				).find( ( field ) => isInsideRootBlock( blockElement, field ) );
			}

			function takeFocusTarget( element, attribute ) {
				element.setAttribute(
					attribute,
					element.getAttribute( 'tabindex' ) ?? ''
				);
				element.removeAttribute( 'tabindex' );
			}

			function restoreFocusTarget( element, attribute ) {
				const tabIndex = element.getAttribute( attribute );
				element.removeAttribute( attribute );
				if ( tabIndex && ! element.hasAttribute( 'tabindex' ) ) {
					element.setAttribute( 'tabindex', tabIndex );
				}
			}

			// Makes the elements the switch handed to the host focus targets
			// and the field an editable element again, unless React rendered
			// them since.
			function releaseField() {
				const field = node.querySelector(
					`[${ HOSTED_FIELD_ATTRIBUTE }]`
				);
				if ( field ) {
					restoreFocusTarget( field, HOSTED_FIELD_ATTRIBUTE );
					if ( ! field.hasAttribute( 'contenteditable' ) ) {
						field.setAttribute( 'contenteditable', 'true' );
					}
				}
				const blockElement = node.querySelector(
					`[${ HOSTED_BLOCK_ATTRIBUTE }]`
				);
				if ( blockElement ) {
					restoreFocusTarget( blockElement, HOSTED_BLOCK_ATTRIBUTE );
				}
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
					// The selection observer may have disabled the wrapper
					// already; the field it hosted is released regardless.
					if ( node.contentEditable === 'true' ) {
						disengage();
					} else {
						releaseField();
					}
					return;
				}

				// A block's focus handler selects the block before the
				// browser places the caret in the focused field (WebKit
				// does so after the focus event, and then in the wrapper
				// once the host took focus). Place it at the start of the
				// field, as the browser would.
				const { activeElement } = ownerDocument;
				const selection = defaultView.getSelection();
				if (
					activeElement !== node &&
					node.contains( activeElement ) &&
					! selection.anchorNode
				) {
					selection.collapse( activeElement, 0 );
				}

				// The selection observer may have disengaged the host when a
				// multi-selection collapsed back into the hosted block.
				if ( ! setContentEditableWrapper( node, true ) ) {
					return;
				}

				const hosted = node.querySelector(
					`[${ HOSTED_FIELD_ATTRIBUTE }]`
				);
				if ( hosted && getBlockClientId( hosted ) === clientId ) {
					return;
				}

				// The field is edited through the host now. Remove the
				// attribute so it is not an editing host nested in it, and
				// the tabindex that made it and the block element focus
				// targets. A field that rich text rendered without the
				// attribute, or that is not editable (a locked binding), is
				// left as it is.
				releaseField();
				const field = getField( clientId );
				if ( field ) {
					const blockElement = node.querySelector(
						`[data-block="${ clientId }"]`
					);
					if ( blockElement !== field ) {
						takeFocusTarget( blockElement, HOSTED_BLOCK_ATTRIBUTE );
					}
					takeFocusTarget( field, HOSTED_FIELD_ATTRIBUTE );
					field.removeAttribute( 'contenteditable' );
				}
			}

			sync();
			const unsubscribe = registry.subscribe( sync, blockEditorStore );

			return () => {
				unsubscribe();
				if ( node.contentEditable === 'true' ) {
					disengage();
				} else {
					releaseField();
				}
			};
		},
		[ registry ]
	);
}
