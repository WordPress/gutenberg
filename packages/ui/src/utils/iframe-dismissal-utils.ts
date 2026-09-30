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

export function isInsideCurrentPopup( event: Event, trigger: Element ) {
	const target = event.target as Node | null;
	const targetElement =
		target?.nodeType === Node.ELEMENT_NODE
			? ( target as Element )
			: target?.parentElement;
	const popupId = trigger.getAttribute( 'aria-controls' );

	if ( ! targetElement || ! popupId ) {
		return false;
	}

	const popup = targetElement.ownerDocument.getElementById( popupId );
	if ( ! popup ) {
		return false;
	}

	const rootOwnerId = popup.getAttribute( 'data-rootownerid' );
	if ( ! rootOwnerId ) {
		return popup.contains( targetElement );
	}

	return (
		targetElement
			.closest( '[data-rootownerid]' )
			?.getAttribute( 'data-rootownerid' ) === rootOwnerId
	);
}

export function useObserveIframePresses( {
	enabled,
	onClick,
	onPointerDown,
	ownerDocument,
}: {
	enabled: boolean;
	onClick?: ( event: Event ) => void;
	onPointerDown: ( event: Event ) => void;
	ownerDocument: Document | null;
} ) {
	useEffect( () => {
		if ( ! enabled || ! ownerDocument ) {
			return;
		}

		const observeDocument = (
			document: Document,
			listenForPointerDown: boolean
		): ( () => void ) => {
			if ( listenForPointerDown ) {
				document.addEventListener( 'pointerdown', onPointerDown, true );
				if ( onClick ) {
					document.addEventListener( 'click', onClick, true );
				}
			}

			const iframeCleanups = new Map< HTMLIFrameElement, () => void >();
			const addIframe = ( iframe: HTMLIFrameElement ) => {
				if ( iframeCleanups.has( iframe ) ) {
					return;
				}

				let iframeDocument: Document | null = null;
				let iframeDocumentCleanup: ( () => void ) | undefined;
				const updateIframeDocument = () => {
					const nextIframeDocument = getIframeDocument( iframe );
					if ( nextIframeDocument === iframeDocument ) {
						return;
					}

					iframeDocumentCleanup?.();
					iframeDocument = nextIframeDocument;
					iframeDocumentCleanup = iframeDocument
						? observeDocument( iframeDocument, true )
						: undefined;
				};

				iframe.addEventListener( 'load', updateIframeDocument );
				updateIframeDocument();
				iframeCleanups.set( iframe, () => {
					iframe.removeEventListener( 'load', updateIframeDocument );
					iframeDocumentCleanup?.();
				} );
			};
			const removeIframe = ( iframe: HTMLIFrameElement ) => {
				iframeCleanups.get( iframe )?.();
				iframeCleanups.delete( iframe );
			};

			document.querySelectorAll( 'iframe' ).forEach( addIframe );

			const MutationObserverConstructor =
				document.defaultView?.MutationObserver;
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
			observer?.observe( document.documentElement, {
				childList: true,
				subtree: true,
			} );

			return () => {
				observer?.disconnect();
				iframeCleanups.forEach( ( cleanup ) => cleanup() );
				if ( listenForPointerDown ) {
					document.removeEventListener(
						'pointerdown',
						onPointerDown,
						true
					);
					if ( onClick ) {
						document.removeEventListener( 'click', onClick, true );
					}
				}
			};
		};

		return observeDocument( ownerDocument, false );
	}, [ enabled, onClick, onPointerDown, ownerDocument ] );
}
