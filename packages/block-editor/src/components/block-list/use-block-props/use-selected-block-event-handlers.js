import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function isColorTransparent( color ) {
	return ! color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
}

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Disables dragging of block contents.
 *
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( { clientId, isSelected } ) {
	const {
		getBlockRootClientId,
		isZoomOut,
		hasMultiSelection,
		isSectionBlock,
		editedContentOnlySection,
		getBlock,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		removeBlock,
		resetZoomLevel,
		startDraggingBlocks,
		stopDraggingBlocks,
		editContentOnlySection,
	} = unlock( useDispatch( blockEditorStore ) );

	return useRefEffect(
		( node ) => {
			if ( ! isSelected ) {
				return;
			}

			/**
			 * Interprets keydown event intent to remove or insert after block if
			 * key event occurs on wrapper node. This can occur when the block has
			 * no text fields of its own, particularly after initial insertion, to
			 * allow for easy deletion and continuous writing flow to add additional
			 * content.
			 *
			 * @param {KeyboardEvent} event Keydown event.
			 */
			function onKeyDown( event ) {
				const { keyCode, target } = event;

				if (
					keyCode !== ENTER &&
					keyCode !== BACKSPACE &&
					keyCode !== DELETE
				) {
					return;
				}

				if ( target !== node || isTextField( target ) ) {
					return;
				}

				if ( keyCode === ENTER ) {
					if ( isZoomOut() ) {
						event.preventDefault();
						resetZoomLevel();
					}
				} else {
					event.preventDefault();
					removeBlock( clientId );
				}
			}

			// The field the current press started on, for the length of
			// the press and the drag that may follow it.
			let pressedField = null;

			// Rich text marks its element while its content is entirely
			// covered by the text selection.
			function getEntirelySelectedField() {
				return node.matches( '[data-entirely-selected]' )
					? node
					: node.querySelector( '[data-entirely-selected]' );
			}

			/**
			 * A press on a fully selected field drags the block, but the
			 * browser only starts a drag of a text selection when the press
			 * begins at rest on the selected glyphs; a press that is
			 * already moving falls back to starting a new selection. For
			 * the length of the press, make the block itself the drag
			 * target instead: a non editable, draggable element starts a
			 * native drag from a press anywhere inside it, however fast
			 * the gesture begins.
			 *
			 * @param {MouseEvent} event Mouse down event.
			 */
			function onMouseDown( event ) {
				if ( event.button !== 0 ) {
					return;
				}

				// Shift and other modifiers adjust the selection; those
				// presses keep their native behavior.
				if (
					event.shiftKey ||
					event.metaKey ||
					event.ctrlKey ||
					event.altKey
				) {
					return;
				}

				const editableElement = getEntirelySelectedField();

				if (
					! editableElement ||
					! editableElement.isContentEditable ||
					hasMultiSelection()
				) {
					return;
				}

				const { ownerDocument } = node;
				const selection = ownerDocument.defaultView.getSelection();

				node.setAttribute( 'draggable', 'true' );
				editableElement.setAttribute( 'contenteditable', 'false' );
				pressedField = editableElement;

				function restore() {
					pressedField = null;
					node.removeAttribute( 'draggable' );
					editableElement.setAttribute( 'contenteditable', 'true' );
					ownerDocument.removeEventListener( 'mouseup', onPressEnd );
					node.removeEventListener( 'dragstart', onPressDragStart );
				}

				function onPressDragStart() {
					// The drag session is committed; the field can become
					// editable again while the block is dragged.
					restore();
				}

				function onPressEnd( e ) {
					restore();
					// The field was not editable during the press, so the
					// browser did not place a caret for the click. Place it
					// where the press landed, so clicking into the selected
					// text keeps putting the caret at the click position.
					editableElement.focus();
					const position = ownerDocument.caretPositionFromPoint?.(
						e.clientX,
						e.clientY
					);

					if ( position ) {
						selection.setPosition(
							position.offsetNode,
							position.offset
						);
					} else {
						const range = ownerDocument.caretRangeFromPoint?.(
							e.clientX,
							e.clientY
						);

						if ( range ) {
							selection.removeAllRanges();
							selection.addRange( range );
						}
					}
				}

				node.addEventListener( 'dragstart', onPressDragStart );
				ownerDocument.addEventListener( 'mouseup', onPressEnd );
			}

			/**
			 * A drag of a text selection that covers everything in the
			 * field moves the block itself, the same way dragging a non
			 * text block does. A drag of a partial selection stays fully
			 * native: the browser moves the text to the drop point, like
			 * cut and paste.
			 *
			 * @param {DragEvent} event Drag event.
			 */
			function onDragStart( event ) {
				const { activeElement } = node.ownerDocument;
				// The press above already converts a press on a fully
				// selected field into a block drag; the attribute check
				// remains for drags the browser starts on its own.
				const fullySelectedField =
					pressedField ||
					( node.contains( event.target ) && ! hasMultiSelection()
						? getEntirelySelectedField()
						: null );
				const isDirectBlockDrag =
					node === event.target &&
					! node.isContentEditable &&
					activeElement === node &&
					! hasMultiSelection();

				if ( ! isDirectBlockDrag && ! fullySelectedField ) {
					return;
				}

				const data = JSON.stringify( {
					type: 'block',
					srcClientIds: [ clientId ],
					srcRootClientId: getBlockRootClientId( clientId ),
				} );
				event.dataTransfer.effectAllowed = 'move'; // remove "+" cursor
				event.dataTransfer.clearData();
				event.dataTransfer.setData( 'wp-blocks', data );
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;
				const selection = defaultView.getSelection();
				// Dragging a fully selected field keeps its selection, so
				// the highlight rides along with the dragged block and
				// survives the drop. Other drags clear the selection.
				const editableElement = fullySelectedField;

				if ( ! editableElement ) {
					selection.removeAllRanges();
				}

				// Setting the drag chip as the drag image actually works, but
				// the behaviour is slightly different in every browser. In
				// Safari, it animates, in Firefox it's slightly transparent...
				// So we set a fake drag image and have to reposition it
				// ourselves.
				const dragElement = ownerDocument.createElement( 'div' );
				// Chrome will show a globe icon if the drag element does not
				// have dimensions.
				dragElement.style.width = '1px';
				dragElement.style.height = '1px';
				dragElement.style.position = 'fixed';
				dragElement.style.visibility = 'hidden';
				ownerDocument.body.appendChild( dragElement );
				event.dataTransfer.setDragImage( dragElement, 0, 0 );

				const rect = node.getBoundingClientRect();

				// Remove the id and leave it on a shallow clone so that drop
				// target calculations are correct.
				const id = node.id;
				const clone = node.cloneNode();
				clone.style.display = 'none';
				node.id = null;
				node.after( clone );

				let _scale = 1;

				{
					let parentElement = node;
					while ( ( parentElement = parentElement.parentElement ) ) {
						const { scale } =
							defaultView.getComputedStyle( parentElement );
						if ( scale && scale !== 'none' ) {
							_scale = parseFloat( scale );
							break;
						}
					}
				}

				const inverted = 1 / _scale;

				const originalNodeProperties = {};
				for ( const property of [
					'transform',
					'transformOrigin',
					'transition',
					'zIndex',
					'position',
					'top',
					'left',
					'pointerEvents',
					'opacity',
					'backgroundColor',
				] ) {
					originalNodeProperties[ property ] = node.style[ property ];
				}

				// Get scroll position.
				const originScrollTop = defaultView.scrollY;
				const originScrollLeft = defaultView.scrollX;
				const originClientX = event.clientX;
				const originClientY = event.clientY;

				// We can't use position fixed because it will behave different
				// if the html element is scaled or transformed (position will
				// no longer be relative to the viewport). The downside of
				// relative is that we have to listen to scroll events. On the
				// upside we don't have to clone to keep a space. Absolute
				// positioning might be weird because it will be based on the
				// positioned parent, but it might be worth a try.
				node.style.position = 'relative';
				node.style.top = `${ 0 }px`;
				node.style.left = `${ 0 }px`;

				const originX = event.clientX - rect.left;
				const originY = event.clientY - rect.top;

				// Scale everything to 200px.
				const dragScale = rect.height > 200 ? 200 / rect.height : 1;

				node.style.zIndex = '1000';
				node.style.transformOrigin = `${ originX * inverted }px ${
					originY * inverted
				}px`;
				node.style.transition = 'transform 0.2s ease-out';
				node.style.transform = `scale(${ dragScale })`;
				node.style.opacity = '0.9';

				// If the block has no background color, use the parent's
				// background color.
				if (
					isColorTransparent(
						defaultView.getComputedStyle( node ).backgroundColor
					)
				) {
					let bgColor = 'transparent';
					let parentElement = node;
					while ( ( parentElement = parentElement.parentElement ) ) {
						const { backgroundColor } =
							defaultView.getComputedStyle( parentElement );
						if ( ! isColorTransparent( backgroundColor ) ) {
							bgColor = backgroundColor;
							break;
						}
					}

					node.style.backgroundColor = bgColor;
				}

				let hasStarted = false;
				let lastClientX = originClientX;
				let lastClientY = originClientY;

				function dragOver( e ) {
					// Only trigger `over` if the mouse has moved.
					if (
						e.clientX === lastClientX &&
						e.clientY === lastClientY
					) {
						return;
					}
					lastClientX = e.clientX;
					lastClientY = e.clientY;
					over();
				}

				function over() {
					if ( ! hasStarted ) {
						hasStarted = true;
						node.style.pointerEvents = 'none';
					}
					const pointerYDelta = lastClientY - originClientY;
					const pointerXDelta = lastClientX - originClientX;
					const scrollTop = defaultView.scrollY;
					const scrollLeft = defaultView.scrollX;
					const scrollTopDelta = scrollTop - originScrollTop;
					const scrollLeftDelta = scrollLeft - originScrollLeft;
					const topDelta = pointerYDelta + scrollTopDelta;
					const leftDelta = pointerXDelta + scrollLeftDelta;
					node.style.top = `${ topDelta * inverted }px`;
					node.style.left = `${ leftDelta * inverted }px`;
				}

				function end() {
					ownerDocument.removeEventListener( 'dragover', dragOver );
					ownerDocument.removeEventListener( 'dragend', end );
					ownerDocument.removeEventListener( 'drop', end );
					ownerDocument.removeEventListener( 'scroll', over );
					for ( const [ property, value ] of Object.entries(
						originalNodeProperties
					) ) {
						node.style[ property ] = value;
					}
					clone.remove();
					node.id = id;
					dragElement.remove();
					// Moving the block in the document tears the selection
					// out of it; select the field in full again, so the
					// block reads as still selected after the drop.
					if ( editableElement ) {
						editableElement.focus();
						const range = ownerDocument.createRange();
						range.selectNodeContents( editableElement );
						selection.removeAllRanges();
						selection.addRange( range );
					}
					stopDraggingBlocks();
					document.body.classList.remove(
						'is-dragging-components-draggable'
					);
					ownerDocument.documentElement.classList.remove(
						'is-dragging'
					);
				}

				ownerDocument.addEventListener( 'dragover', dragOver );
				ownerDocument.addEventListener( 'dragend', end );
				ownerDocument.addEventListener( 'drop', end );
				ownerDocument.addEventListener( 'scroll', over );

				startDraggingBlocks( [ clientId ] );
				// Important because it hides the block toolbar.
				document.body.classList.add(
					'is-dragging-components-draggable'
				);
				ownerDocument.documentElement.classList.add( 'is-dragging' );
			}

			node.addEventListener( 'keydown', onKeyDown );
			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'dragstart', onDragStart );

			/**
			 * Handles double-click events on section blocks to edit content only section.
			 *
			 * @param {MouseEvent} event Double-click event.
			 */
			function onDoubleClick( event ) {
				const isSection = isSectionBlock( clientId );
				const block = getBlock( clientId );
				const isSyncedPattern = isReusableBlock( block );
				const isTemplatePartBlock = isTemplatePart( block );
				const isAlreadyEditing = editedContentOnlySection === clientId;

				if (
					! isSection ||
					isAlreadyEditing ||
					isSyncedPattern ||
					isTemplatePartBlock
				) {
					return;
				}

				event.preventDefault();
				editContentOnlySection( clientId );
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'dragstart', onDragStart );
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[
			clientId,
			isSelected,
			getBlockRootClientId,
			getBlock,
			isReusableBlock,
			isTemplatePart,
			removeBlock,
			isZoomOut,
			resetZoomLevel,
			hasMultiSelection,
			startDraggingBlocks,
			stopDraggingBlocks,
			isSectionBlock,
			editedContentOnlySection,
			editContentOnlySection,
		]
	);
}
