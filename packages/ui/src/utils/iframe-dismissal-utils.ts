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

export function getNodeDocument( node: Node | null ) {
	return node?.nodeType === Node.DOCUMENT_NODE
		? ( node as Document )
		: ( node?.ownerDocument ?? null );
}

export function isInsideCurrentPopup( event: Event, trigger: Element ) {
	const popupId = trigger.getAttribute( 'aria-controls' );
	if ( ! popupId ) {
		return false;
	}

	let target = event.target as Node | null;
	while ( target ) {
		const targetDocument = getNodeDocument( target );
		const targetElement =
			target.nodeType === Node.ELEMENT_NODE
				? ( target as Element )
				: target.parentElement;
		const popup = targetDocument?.getElementById( popupId );
		if ( popup && targetElement ) {
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

		if ( targetDocument === trigger.ownerDocument ) {
			break;
		}
		target = targetDocument?.defaultView?.frameElement ?? null;
	}

	return false;
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
