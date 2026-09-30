import { useCallback, useState } from '@wordpress/element';
import {
	isInsideCurrentPopup,
	useObserveIframePresses,
} from './iframe-dismissal-utils';

type OpenChangeHandler< EventDetails > = (
	open: boolean,
	eventDetails: EventDetails
) => void;

function getNodeDocument( node: Node | null ) {
	return node?.nodeType === Node.DOCUMENT_NODE
		? ( node as Document )
		: ( node?.ownerDocument ?? null );
}

function dispatchOutsidePress( event: Event, ownerDocument: Document ) {
	let frameElement = getNodeDocument( event.target as Node | null )
		?.defaultView?.frameElement;
	while ( frameElement && frameElement.ownerDocument !== ownerDocument ) {
		frameElement = frameElement.ownerDocument.defaultView?.frameElement;
	}

	if ( ! frameElement ) {
		return;
	}

	const PointerEventConstructor = ownerDocument.defaultView?.PointerEvent;
	if ( ! PointerEventConstructor ) {
		return;
	}

	const pointerEvent = event as PointerEvent;
	frameElement.dispatchEvent(
		new PointerEventConstructor( event.type, {
			bubbles: true,
			button: pointerEvent.button,
			detail: pointerEvent.detail,
			pointerType: pointerEvent.pointerType,
		} )
	);
}

export function useIframeOutsidePressBridge<
	TEventDetails extends {
		isCanceled: boolean;
		trigger: Element | undefined;
		event: Event;
	},
>( {
	defaultOpen,
	disabled,
	modal,
	onOpenChange,
	open: openProp,
}: {
	defaultOpen?: boolean;
	disabled?: boolean;
	modal?: boolean;
	onOpenChange: OpenChangeHandler< TEventDetails >;
	open?: boolean;
} ) {
	const [ uncontrolledOpen, setUncontrolledOpen ] = useState(
		defaultOpen ?? false
	);
	const [ trigger, setTrigger ] = useState< Element | null >( null );
	const open = openProp ?? uncontrolledOpen;
	const handleIframePointerDown = useCallback(
		( event: Event ) => {
			if ( trigger && ! isInsideCurrentPopup( event, trigger ) ) {
				dispatchOutsidePress( event, trigger.ownerDocument );
			}
		},
		[ trigger ]
	);
	useObserveIframePresses( {
		enabled: open && modal === false && ! disabled && trigger !== null,
		onClick: handleIframePointerDown,
		onPointerDown: handleIframePointerDown,
		ownerDocument: trigger?.ownerDocument ?? null,
	} );

	const handleOpenChange: OpenChangeHandler< TEventDetails > = (
		nextOpen,
		eventDetails
	) => {
		onOpenChange( nextOpen, eventDetails );

		if ( eventDetails.isCanceled ) {
			return;
		}

		setUncontrolledOpen( nextOpen );
		const eventTarget = eventDetails.event.target;
		setTrigger(
			nextOpen
				? ( eventDetails.trigger ??
						( eventTarget instanceof Element
							? eventTarget
							: null ) )
				: null
		);
	};

	return { onOpenChange: handleOpenChange };
}
