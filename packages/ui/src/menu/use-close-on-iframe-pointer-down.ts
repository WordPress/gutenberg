import { useEffect } from '@wordpress/element';

function getIframeDocument( iframe: HTMLIFrameElement ) {
	try {
		return iframe.contentDocument;
	} catch {
		return null;
	}
}

function forEachIframe(
	node: Node,
	callback: ( iframe: HTMLIFrameElement ) => void
) {
	if ( node.nodeType !== Node.ELEMENT_NODE ) {
		return;
	}

	const element = node as Element;
	if ( element.tagName === 'IFRAME' ) {
		callback( element as HTMLIFrameElement );
	}
	element.querySelectorAll( 'iframe' ).forEach( callback );
}

/*
 * Base UI listens for outside presses only in the menu's owner document.
 * Pointer events do not cross document boundaries, so listen in same-origin
 * iframe documents without redispatching or consuming the original event.
 */
export function useCloseOnIframePointerDown( {
	enabled,
	onPointerDown,
	ownerDocument,
}: {
	enabled: boolean;
	onPointerDown: () => void;
	ownerDocument: Document | null;
} ) {
	useEffect( () => {
		if ( ! enabled || ! ownerDocument ) {
			return;
		}

		const iframeCleanups = new Map< HTMLIFrameElement, () => void >();
		const addIframe = ( iframe: HTMLIFrameElement ) => {
			if ( iframeCleanups.has( iframe ) ) {
				return;
			}

			let iframeDocument: Document | null = null;
			const updateIframeDocument = () => {
				const nextIframeDocument = getIframeDocument( iframe );
				if ( nextIframeDocument === iframeDocument ) {
					return;
				}

				iframeDocument?.removeEventListener(
					'pointerdown',
					onPointerDown,
					true
				);
				iframeDocument = nextIframeDocument;
				iframeDocument?.addEventListener(
					'pointerdown',
					onPointerDown,
					true
				);
			};

			iframe.addEventListener( 'load', updateIframeDocument );
			updateIframeDocument();
			iframeCleanups.set( iframe, () => {
				iframe.removeEventListener( 'load', updateIframeDocument );
				iframeDocument?.removeEventListener(
					'pointerdown',
					onPointerDown,
					true
				);
			} );
		};
		const removeIframe = ( iframe: HTMLIFrameElement ) => {
			iframeCleanups.get( iframe )?.();
			iframeCleanups.delete( iframe );
		};

		ownerDocument.querySelectorAll( 'iframe' ).forEach( addIframe );

		const MutationObserverConstructor =
			ownerDocument.defaultView?.MutationObserver;
		const observer = MutationObserverConstructor
			? new MutationObserverConstructor( ( records ) => {
					records.forEach( ( record ) => {
						record.removedNodes.forEach( ( node ) =>
							forEachIframe( node, removeIframe )
						);
						record.addedNodes.forEach( ( node ) =>
							forEachIframe( node, addIframe )
						);
					} );
			  } )
			: null;
		observer?.observe( ownerDocument.documentElement, {
			childList: true,
			subtree: true,
		} );

		return () => {
			observer?.disconnect();
			iframeCleanups.forEach( ( cleanup ) => cleanup() );
		};
	}, [ enabled, onPointerDown, ownerDocument ] );
}
