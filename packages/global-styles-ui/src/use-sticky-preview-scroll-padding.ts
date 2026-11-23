import { useCallback, useRef } from '@wordpress/element';

function getScroller( node: HTMLElement ): HTMLElement | null {
	let parent = node.parentElement;
	while ( parent ) {
		const { overflowY } =
			parent.ownerDocument.defaultView!.getComputedStyle( parent );
		if ( /auto|scroll/.test( overflowY ) ) {
			return parent;
		}
		parent = parent.parentElement;
	}
	return null;
}

/**
 * Keeps controls from being focused underneath a sticky preview.
 *
 * Moving focus backwards scrolls a control only just into view, which can leave
 * it behind the opaque sticky preview. This reserves the space the preview
 * covers on the scroller with `scroll-padding-top`, and follows the preview
 * when its height changes.
 *
 * @return A ref callback for the sticky preview element.
 */
export default function useStickyPreviewScrollPadding() {
	const cleanupRef = useRef< ( () => void ) | undefined >( undefined );

	return useCallback( ( node: HTMLElement | null ) => {
		cleanupRef.current?.();
		cleanupRef.current = undefined;

		const scroller = node ? getScroller( node ) : null;
		if ( ! node || ! scroller ) {
			return;
		}

		const previous = scroller.style.scrollPaddingTop;
		const update = () => {
			const { position, top } =
				node.ownerDocument.defaultView!.getComputedStyle( node );
			// The preview does not stick on short viewports.
			if ( position !== 'sticky' ) {
				scroller.style.scrollPaddingTop = previous;
				return;
			}
			const offset = Math.max( parseFloat( top ) || 0, 0 );
			scroller.style.scrollPaddingTop = `${
				offset + node.offsetHeight
			}px`;
		};

		update();
		const ResizeObserverImpl =
			node.ownerDocument.defaultView?.ResizeObserver;
		const observer = ResizeObserverImpl
			? new ResizeObserverImpl( update )
			: undefined;
		observer?.observe( node );
		node.ownerDocument.defaultView?.addEventListener( 'resize', update );

		cleanupRef.current = () => {
			observer?.disconnect();
			node.ownerDocument.defaultView?.removeEventListener(
				'resize',
				update
			);
			scroller.style.scrollPaddingTop = previous;
		};
	}, [] );
}
