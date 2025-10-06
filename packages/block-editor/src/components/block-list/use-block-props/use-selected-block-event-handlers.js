/**
 * WordPress dependencies
 */
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Adds block behaviour:
 *   - Removes the block on BACKSPACE.
 *   - Inserts a default block on ENTER.
 *   - Disables dragging of block contents.
 *
 * @param {string} clientId Block client ID.
 */
export function useEventHandlers( { clientId, isSelected } ) {
	const { getBlockRootClientId, isZoomOut, hasMultiSelection } = unlock(
		useSelect( blockEditorStore )
	);
	const {
		insertAfterBlock,
		removeBlock,
		resetZoomLevel,
		startDraggingBlocks,
		stopDraggingBlocks,
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

				event.preventDefault();

				if ( keyCode === ENTER && isZoomOut() ) {
					resetZoomLevel();
				} else if ( keyCode === ENTER ) {
					insertAfterBlock( clientId );
				} else {
					removeBlock( clientId );
				}
			}

			/**
			 * Prevents default dragging behavior within a block. To do: we must
			 * handle this in the future and clean up the drag target.
			 *
			 * @param {DragEvent} event Drag event.
			 */
			function onDragStart( event ) {
				if (
					node !== event.target ||
					node.isContentEditable ||
					node.ownerDocument.activeElement !== node ||
					hasMultiSelection()
				) {
					event.preventDefault();
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
				selection.removeAllRanges();

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

				const clone = node.cloneNode( true );
				clone.style.visibility = 'hidden';

				// Remove the id and leave it on the clone so that drop target
				// calculations are correct.
				const id = node.id;
				node.id = null;

				let _scale = 1;

				let parentElement = node;

				while ( ( parentElement = parentElement.parentElement ) ) {
					const { scale } =
						defaultView.getComputedStyle( parentElement );
					if ( scale && scale !== 'none' ) {
						_scale = parseFloat( scale );
						break;
					}
				}

				let bgColor = 'transparent';

				parentElement = node;

				while ( ( parentElement = parentElement.parentElement ) ) {
					const { backgroundColor } =
						defaultView.getComputedStyle( parentElement );
					if (
						backgroundColor &&
						backgroundColor !== 'transparent' &&
						backgroundColor !== 'rgba(0, 0, 0, 0)'
					) {
						bgColor = backgroundColor;
						break;
					}
				}

				const inverted = 1 / _scale;

				node.after( clone );

				node.style.position = 'fixed';
				node.style.top = `${ rect.top }px`;
				node.style.left = `${ rect.left }px`;
				node.style.width = `${ rect.width * inverted }px`;

				const originX = event.clientX - rect.left;
				const originY = event.clientY - rect.top;

				// Scale everything to 200px.
				const dragScale = rect.height > 200 ? 200 / rect.height : 1;

				node.style.zIndex = '1000';
				node.style.transformOrigin = '0 0';
				node.style.transformOrigin = `${ originX }px ${ originY }px`;
				node.style.transition = 'transform 0.2s ease-out';
				node.style.transform = `scale(${ dragScale })`;
				node.style.margin = '0';
				node.style.opacity = '0.9';
				node.style.backgroundColor = bgColor;

				let hasStarted = false;

				function over( e ) {
					if ( ! hasStarted ) {
						hasStarted = true;
						node.style.pointerEvents = 'none';
					}
					node.style.top = `${ e.clientY * inverted - originY }px`;
					node.style.left = `${ e.clientX * inverted - originX }px`;
				}

				function end() {
					ownerDocument.removeEventListener( 'dragover', over );
					ownerDocument.removeEventListener( 'dragend', end );
					node.style.transform = '';
					node.style.transformOrigin = '';
					node.style.transition = '';
					node.style.zIndex = '';
					node.style.position = '';
					node.style.top = '';
					node.style.left = '';
					node.style.width = '';
					node.style.pointerEvents = '';
					node.style.margin = '';
					node.style.opacity = '';
					node.style.backgroundColor = '';
					clone.remove();
					node.id = id;
					dragElement.remove();
					stopDraggingBlocks();
					document.body.classList.remove(
						'is-dragging-components-draggable'
					);
					ownerDocument.documentElement.classList.remove(
						'is-dragging'
					);
				}

				ownerDocument.addEventListener( 'dragover', over );
				ownerDocument.addEventListener( 'dragend', end );
				ownerDocument.addEventListener( 'drop', end );

				startDraggingBlocks( [ clientId ] );
				// Important because it hides the block toolbar.
				document.body.classList.add(
					'is-dragging-components-draggable'
				);
				ownerDocument.documentElement.classList.add( 'is-dragging' );
			}

			node.addEventListener( 'keydown', onKeyDown );
			node.addEventListener( 'dragstart', onDragStart );

			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'dragstart', onDragStart );
			};
		},
		[
			clientId,
			isSelected,
			getBlockRootClientId,
			insertAfterBlock,
			removeBlock,
			isZoomOut,
			resetZoomLevel,
			hasMultiSelection,
			startDraggingBlocks,
			stopDraggingBlocks,
		]
	);
}
