/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockList } from '../';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';

/** @typedef {import('react').ReactNode} ReactNode */

/**
 * Underlay is a bit like a Popover, but is inline so only requires half the code.
 *
 * @param {Object}    props
 * @param {string}    props.className       A classname to apply to the underlay.
 * @param {string}    props.focusedClientId The client id of the block being interacted with.
 * @param {ReactNode} props.children        Child elements.
 */
export default function Underlay( { className, focusedClientId, children } ) {
	const [ underlayStyle, setUnderlayStyle ] = useState( null );
	const focusedBlockElement = useBlockElement( focusedClientId );

	// useBlockElement is unable to return the document's root block list.
	// __unstableElementContext seems to provide this.
	const rootBlockListElement = useContext(
		BlockList.__unstableElementContext
	);

	useEffect( () => {
		if ( ! focusedBlockElement || ! rootBlockListElement ) {
			return;
		}

		const { ownerDocument } = focusedBlockElement;
		const { defaultView } = ownerDocument;

		const update = () => {
			const layoutRect = rootBlockListElement.getBoundingClientRect();
			const focusedBlockRect =
				focusedBlockElement.getBoundingClientRect();

			// The 'underlay' has the width and horizontal positioning of the root block list,
			// and the height and vertical positioning of the edited block.
			// Note: using the root block list is a naive implementation here, ideally the parent
			// block that provides the layout should be used.
			setUnderlayStyle( {
				position: 'absolute',
				left: layoutRect.x - focusedBlockRect.x,
				top: 0,
				width: Math.floor( layoutRect.width ),
				height: Math.floor( focusedBlockRect.height ),
				zIndex: 0,
			} );
		};

		// Observe any resizes of both the layout and focused elements.
		const resizeObserver = defaultView.ResizeObserver
			? new defaultView.ResizeObserver( update )
			: undefined;
		resizeObserver?.observe( rootBlockListElement );
		resizeObserver?.observe( focusedBlockElement );
		update();

		return () => {
			resizeObserver?.disconnect();
		};
	}, [ focusedBlockElement, rootBlockListElement ] );

	return (
		<div className={ className } style={ underlayStyle }>
			{ children }
		</div>
	);
}
