import {
	createPortal,
	forwardRef,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import type { RefCallback } from 'react';

/**
 * Tracks the dimensions of a DOM element via ResizeObserver.
 * Returns a ref callback to attach to the element and its current size.
 *
 * The ref callback performs a synchronous `getBoundingClientRect` read so
 * the first render already has accurate dimensions (avoids a 0×0 flash).
 */
export function useMeasure< TRef extends HTMLElement >() {
	const [ element, setElement ] = useState< TRef | null >( null );
	const [ elementSize, setElementSize ] = useState( {
		width: 0,
		height: 0,
	} );

	useLayoutEffect( () => {
		if ( ! element ) {
			return;
		}

		const resizeObserver = new ResizeObserver( () => {
			const bcr = element.getBoundingClientRect();
			setElementSize( { width: bcr.width, height: bcr.height } );
		} );
		resizeObserver.observe( element );

		return () => {
			resizeObserver.disconnect();
		};
	}, [ element ] );

	const elementRef: RefCallback< TRef > = useCallback( ( node ) => {
		if ( node ) {
			const bcr = node.getBoundingClientRect();
			setElementSize( { width: bcr.width, height: bcr.height } );
		}
		setElement( node );
	}, [] );

	return [ elementRef, elementSize ] as const;
}

/**
 * Renders an iframe and portals its `children` into the iframe's body.
 * Forwards a ref to the underlying `<iframe>` element.
 *
 * Waits for the iframe's `load` event before portaling to ensure
 * compatibility with Firefox.
 * See https://github.com/facebook/react/issues/22847#issuecomment-991394558
 */
export const GenericIframe = forwardRef<
	HTMLIFrameElement,
	GenericIframeProps
>( function GenericIframe( { children, ...props }, ref ) {
	const [ containerNode, setContainerNode ] = useState< HTMLElement | null >(
		null
	);
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const mergedRef = useMergeRefs( [ ref, iframeRef ] );

	return (
		<iframe
			title="Iframe"
			{ ...props }
			ref={ mergedRef }
			srcDoc="<!doctype html><html><body></body></html>"
			onLoad={ ( event ) => {
				const doc = event.currentTarget.contentDocument;
				if ( doc ) {
					setContainerNode( doc.body );
				}
			} }
		>
			{ containerNode && createPortal( children, containerNode ) }
		</iframe>
	);
} );

export type GenericIframeProps = React.ComponentProps< 'iframe' > & {
	children: React.ReactNode;
};
