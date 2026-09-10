import type { Menu as _Menu } from '@base-ui/react/menu';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import type { RootProps } from './types';

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

function isInsideCurrentMenu( event: Event, trigger: Element ) {
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

function useCloseOnIframePointerDown( {
	enabled,
	onPointerDown,
	ownerDocument,
}: {
	enabled: boolean;
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
				}
			};
		};

		return observeDocument( ownerDocument, false );
	}, [ enabled, onPointerDown, ownerDocument ] );
}

/*
 * Temporary bridge for https://github.com/mui/base-ui/issues/5410#issuecomment-5376507925.
 * Base UI 1.7.0 listens for outside presses only in the menu's owner document,
 * but pointer events do not cross document boundaries. Once the minimum Base
 * UI version fixes this, delete this hook's import, call, and prop spread from
 * `Root`, then pass `handleOpenChange` directly to `_Menu.Root` again.
 */
export function useIframeDismissalBridge( {
	actionsRef,
	defaultOpen,
	disabled,
	modal,
	onOpenChange,
	open: openProp,
}: Pick<
	RootProps,
	'actionsRef' | 'defaultOpen' | 'disabled' | 'modal' | 'open'
> & {
	onOpenChange: NonNullable< RootProps[ 'onOpenChange' ] >;
} ) {
	const fallbackActionsRef = useRef< _Menu.Root.Actions | null >( null );
	const resolvedActionsRef = actionsRef ?? fallbackActionsRef;
	const [ uncontrolledOpen, setUncontrolledOpen ] = useState(
		defaultOpen ?? false
	);
	const [ trigger, setTrigger ] = useState< Element | null >( null );
	const open = openProp ?? uncontrolledOpen;
	const handleIframePointerDown = useCallback(
		( event: Event ) => {
			if ( trigger && ! isInsideCurrentMenu( event, trigger ) ) {
				resolvedActionsRef.current?.close();
			}
		},
		[ resolvedActionsRef, trigger ]
	);

	useCloseOnIframePointerDown( {
		enabled: open && modal === false && ! disabled && trigger !== null,
		onPointerDown: handleIframePointerDown,
		ownerDocument: trigger?.ownerDocument ?? null,
	} );

	const handleOpenChange: NonNullable< RootProps[ 'onOpenChange' ] > = (
		nextOpen,
		eventDetails
	) => {
		onOpenChange( nextOpen, eventDetails );

		if ( eventDetails.isCanceled ) {
			return;
		}

		setUncontrolledOpen( nextOpen );
		setTrigger( nextOpen ? eventDetails.trigger ?? null : null );
	};

	return {
		actionsRef: resolvedActionsRef,
		onOpenChange: handleOpenChange,
	};
}
