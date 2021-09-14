/**
 * External dependencies
 */
import { first, last, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch, useRefEffect } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { useState, useRef, useMemo } from '@wordpress/element';
import { getBlockType } from '@wordpress/blocks';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InsertionPoint from './insertion-point';
import BlockPopover from './block-popover';
import BlockDraggableChip from '../block-draggable/draggable-chip';
import { store as blockEditorStore } from '../../store';
import BlockContextualToolbar from './block-contextual-toolbar';
import { usePopoverScroll } from './use-popover-scroll';
import { parseDropEvent } from '../use-on-block-drop';

/**
 * Renders block tools (the block toolbar, select/navigation mode toolbar, the
 * insertion point and a slot for the inline rich text toolbar). Must be wrapped
 * around the block content and editor styles wrapper or iframe.
 *
 * @param {Object} $0                      Props.
 * @param {Object} $0.children             The block content and style container.
 * @param {Object} $0.__unstableContentRef Ref holding the content scroll container.
 */
export default function BlockTools( {
	children,
	__unstableContentRef,
	...props
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const hasFixedToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasFixedToolbar,
		[]
	);
	const isMatch = useShortcutEventMatch();
	const { getSelectedBlockClientIds, getBlockRootClientId } = useSelect(
		blockEditorStore
	);
	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		clearSelectedBlock,
		moveBlocksUp,
		moveBlocksDown,
	} = useDispatch( blockEditorStore );

	function onKeyDown( event ) {
		if ( isMatch( 'core/block-editor/move-up', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				const rootClientId = getBlockRootClientId( first( clientIds ) );
				moveBlocksUp( clientIds, rootClientId );
			}
		} else if ( isMatch( 'core/block-editor/move-down', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				const rootClientId = getBlockRootClientId( first( clientIds ) );
				moveBlocksDown( clientIds, rootClientId );
			}
		} else if ( isMatch( 'core/block-editor/duplicate', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				duplicateBlocks( clientIds );
			}
		} else if ( isMatch( 'core/block-editor/remove', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				removeBlocks( clientIds );
			}
		} else if ( isMatch( 'core/block-editor/insert-after', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				insertAfterBlock( last( clientIds ) );
			}
		} else if ( isMatch( 'core/block-editor/insert-before', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length ) {
				event.preventDefault();
				insertBeforeBlock( first( clientIds ) );
			}
		} else if (
			isMatch( 'core/block-editor/delete-multi-selection', event )
		) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length > 1 ) {
				event.preventDefault();
				removeBlocks( clientIds );
			}
		} else if ( isMatch( 'core/block-editor/unselect', event ) ) {
			const clientIds = getSelectedBlockClientIds();
			if ( clientIds.length > 1 ) {
				event.preventDefault();
				clearSelectedBlock();
				event.target.ownerDocument.defaultView
					.getSelection()
					.removeAllRanges();
			}
		}
	}

	const [ draggedBlockNames, setDraggedBlockNames ] = useState( [] );
	const draggableChipRef = useRef();
	const isDraggingBlocks = draggedBlockNames.length > 0;
	const { getBlockName } = useSelect( blockEditorStore );
	const dragIcon = useMemo( () => {
		const isSelectionOfSameType = uniq( draggedBlockNames ).length === 1;
		// When selection consists of blocks of multiple types, display an
		// appropriate icon to communicate the non-uniformity.
		return isSelectionOfSameType
			? getBlockType( first( draggedBlockNames ) )?.icon
			: stack;
	}, [ draggedBlockNames ] );

	function onDragOver( event ) {
		// If we're not dragging over an iframe, return. The global event
		// lister will handle positioning the drag chip.
		if ( event.currentTarget.contains( event.target ) ) return;

		const { ownerDocument } = event.target;
		const { defaultView } = ownerDocument;
		const { frameElement } = defaultView;
		const rect = frameElement.getBoundingClientRect();
		const element = draggableChipRef.current;

		element.style.left = event.clientX + rect.left + 'px';
		element.style.top = event.clientY + rect.top + 'px';
	}

	function onDragEnd() {
		setDraggedBlockNames( [] );
	}

	const refEffect = useRefEffect(
		( element ) => {
			const { ownerDocument } = element;

			if ( ! isDraggingBlocks ) {
				function onDragStart( event ) {
					const { srcClientIds, blocks } = parseDropEvent( event );

					if ( srcClientIds ) {
						setDraggedBlockNames(
							srcClientIds.map( getBlockName )
						);
					} else if ( blocks ) {
						setDraggedBlockNames(
							blocks.map( ( { name } ) => name )
						);
					}
				}
				ownerDocument.addEventListener( 'dragstart', onDragStart );
				return () => {
					ownerDocument.removeEventListener(
						'dragstart',
						onDragStart
					);
				};
			}

			function _onDragOver( event ) {
				const chip = draggableChipRef.current;
				chip.style.left = event.clientX + 'px';
				chip.style.top = event.clientY + 'px';
			}

			function _onDragEnd() {
				setDraggedBlockNames( [] );
			}

			ownerDocument.addEventListener( 'dragover', _onDragOver );
			ownerDocument.addEventListener( 'dragend', _onDragEnd );
			return () => {
				ownerDocument.removeEventListener( 'dragover', _onDragOver );
				ownerDocument.removeEventListener( 'dragend', _onDragEnd );
			};
		},
		[ isDraggingBlocks ]
	);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			{ ...props }
			onKeyDown={ onKeyDown }
			// Add these React events to listen for events in the iframe.
			onDragOver={ isDraggingBlocks ? onDragOver : null }
			onDragEnd={ isDraggingBlocks ? onDragEnd : null }
			ref={ refEffect }
		>
			<InsertionPoint __unstableContentRef={ __unstableContentRef }>
				{ ( hasFixedToolbar || ! isLargeViewport ) && (
					<BlockContextualToolbar isFixed />
				) }
				{ draggedBlockNames.length > 0 && (
					<BlockDraggableChip
						count={ draggedBlockNames.length }
						icon={ dragIcon }
						ref={ draggableChipRef }
					/>
				) }
				{ /* Even if the toolbar is fixed, the block popover is still
                 needed for navigation mode. */ }
				<BlockPopover __unstableContentRef={ __unstableContentRef } />
				{ /* Used for the inline rich text toolbar. */ }
				<Popover.Slot
					name="block-toolbar"
					ref={ usePopoverScroll( __unstableContentRef ) }
				/>
				{ children }
				{ /* Forward compatibility: a place to render block tools behind the
                 content so it can be tabbed to properly. */ }
			</InsertionPoint>
		</div>
	);
}
