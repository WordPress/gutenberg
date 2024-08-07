/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';

/** @typedef {import('react').ReactNode} ReactNode */

/**
 * Underlay is a bit like a Popover, but is inline so only requires half the code.
 *
 * @param {Object}    props
 * @param {string}    props.clientId  The client id of the block being interacted with.
 * @param {string}    props.className A classname to add to the grid underlay.
 * @param {ReactNode} props.children  Child elements.
 */
export default function Underlay( { clientId, className, children } ) {
	const [ underlayStyle, setUnderlayStyle ] = useState( { display: 'none' } );
	const rootClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockRootClientId( clientId ),
		[ clientId ]
	);
	const rootElement = useBlockElement( rootClientId );
	const gridElement = useBlockElement( clientId );

	useEffect( () => {
		if ( ! gridElement || ! rootElement ) {
			return;
		}

		const { ownerDocument } = gridElement;
		const { defaultView } = ownerDocument;

		const update = () => {
			const rootRect = rootElement.getBoundingClientRect();
			const gridRect = gridElement.getBoundingClientRect();

			setUnderlayStyle( {
				position: 'absolute',
				left: Math.floor( gridRect.left - rootRect.left ),
				top: Math.floor( gridRect.top - rootRect.top ),
				width: Math.floor( gridRect.width ),
				height: Math.floor( gridRect.height ),
				margin: 0,
				padding: 0,
				zIndex: 0,
			} );
		};

		// Observe any resizes of both the layout and focused elements.
		const resizeObserver = defaultView.ResizeObserver
			? new defaultView.ResizeObserver( update )
			: undefined;
		resizeObserver?.observe( gridElement );
		resizeObserver?.observe( rootElement );
		// defaultView?.addEventListener( 'resize', update );
		update();

		return () => {
			resizeObserver?.disconnect();
			// defaultView?.removeEventListener( 'resize', update );
		};
	}, [ gridElement, rootElement ] );

	return (
		<div className={ className } style={ underlayStyle }>
			{ children }
		</div>
	);
}
