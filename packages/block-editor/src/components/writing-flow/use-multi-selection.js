/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockRef as useBlockRef } from '../block-list/use-block-props/use-block-refs';

function toggleRichText( container, toggle ) {
	Array.from( container.querySelectorAll( '.rich-text' ) ).forEach(
		( node ) => {
			if ( toggle ) {
				node.setAttribute( 'contenteditable', true );
			} else {
				node.removeAttribute( 'contenteditable' );
			}
		}
	);
}

/**
 * Returns for the deepest node at the start or end of a container node. Ignores
 * any text nodes that only contain HTML formatting whitespace.
 *
 * @param {Element} node Container to search.
 * @param {string} type 'start' or 'end'.
 */
function getDeepestNode( node, type ) {
	const child = type === 'start' ? 'firstChild' : 'lastChild';
	const sibling = type === 'start' ? 'nextSibling' : 'previousSibling';

	while ( node[ child ] ) {
		node = node[ child ];

		while (
			node.nodeType === node.TEXT_NODE &&
			/^[ \t\n]*$/.test( node.data ) &&
			node[ sibling ]
		) {
			node = node[ sibling ];
		}
	}

	return node;
}

function selector( select ) {
	const {
		isMultiSelecting,
		getMultiSelectedBlockClientIds,
		hasMultiSelection,
		getSelectedBlockClientId,
	} = select( blockEditorStore );

	return {
		isMultiSelecting: isMultiSelecting(),
		multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
		hasMultiSelection: hasMultiSelection(),
		selectedBlockClientId: getSelectedBlockClientId(),
	};
}

export default function useMultiSelection() {
	const ref = useRef();
	const {
		isMultiSelecting,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		selectedBlockClientId,
	} = useSelect( selector, [] );
	const { selectBlock } = useDispatch( blockEditorStore );
	const selectedRef = useBlockRef( selectedBlockClientId );
	// These must be in the right DOM order.
	const startRef = useBlockRef( first( multiSelectedBlockClientIds ) );
	const endRef = useBlockRef( last( multiSelectedBlockClientIds ) );

	/**
	 * When the component updates, and there is multi selection, we need to
	 * select the entire block contents.
	 */
	useEffect( () => {
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;

		if ( ! hasMultiSelection || isMultiSelecting ) {
			if ( ! selectedBlockClientId || isMultiSelecting ) {
				return;
			}

			const selection = defaultView.getSelection();

			if ( selection.rangeCount && ! selection.isCollapsed ) {
				const blockNode = selectedRef.current;
				const { startContainer, endContainer } = selection.getRangeAt(
					0
				);

				if (
					!! blockNode &&
					( ! blockNode.contains( startContainer ) ||
						! blockNode.contains( endContainer ) )
				) {
					selection.removeAllRanges();
				}
			}

			return;
		}

		const { length } = multiSelectedBlockClientIds;

		if ( length < 2 ) {
			return;
		}

		// For some browsers, like Safari, it is important that focus happens
		// BEFORE selection.
		ref.current.focus();

		const selection = defaultView.getSelection();
		const range = ownerDocument.createRange();

		// These must be in the right DOM order.
		// The most stable way to select the whole block contents is to start
		// and end at the deepest points.
		const startNode = getDeepestNode( startRef.current, 'start' );
		const endNode = getDeepestNode( endRef.current, 'end' );

		// While rich text will be disabled with a delay when there is a multi
		// selection, we must do it immediately because it's not possible to set
		// selection across editable hosts.
		toggleRichText( ref.current, false );

		range.setStartBefore( startNode );
		range.setEndAfter( endNode );

		selection.removeAllRanges();
		selection.addRange( range );
	}, [
		hasMultiSelection,
		isMultiSelecting,
		multiSelectedBlockClientIds,
		selectBlock,
		selectedBlockClientId,
	] );

	return ref;
}
