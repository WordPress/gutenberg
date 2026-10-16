import { createContext, useCallback, useState } from '@wordpress/element';
import {
	getNodeDocument,
	isInsideCurrentPopup,
	useIframePressListeners,
} from './iframe-dismissal-utils';

export const IframeOutsidePressContext = createContext<
	( ( popup: HTMLDivElement | null ) => void ) | null
>( null );

function getCommonDocument( first: Document, second: Document ) {
	const ancestors = new Set< Document >();
	let current: Document | undefined = first;
	while ( current ) {
		ancestors.add( current );
		current = current.defaultView?.frameElement?.ownerDocument;
	}
	current = second;
	while ( current && ! ancestors.has( current ) ) {
		current = current.defaultView?.frameElement?.ownerDocument;
	}
	return current ?? first;
}

type OpenChangeHandler< EventDetails > = (
	open: boolean,
	eventDetails: EventDetails
) => void;

function dispatchOutsidePress( event: Event, ownerDocument: Document ) {
	let frameElement = getNodeDocument( event.target as Node | null )
		?.defaultView?.frameElement;
	while ( frameElement && frameElement.ownerDocument !== ownerDocument ) {
		frameElement = frameElement.ownerDocument.defaultView?.frameElement;
	}

	const target = frameElement ?? ownerDocument.body;

	const EventConstructor =
		event.type === 'mousedown'
			? ownerDocument.defaultView?.MouseEvent
			: ownerDocument.defaultView?.PointerEvent;
	if ( ! EventConstructor ) {
		return;
	}

	const pointerEvent = event as PointerEvent;
	target.dispatchEvent(
		new EventConstructor( event.type, {
			bubbles: true,
			button: pointerEvent.button,
			detail: pointerEvent.detail,
			pointerType: pointerEvent.pointerType,
		} )
	);
}

type IframeOutsidePressForwardingOptions< TEventDetails > = {
	defaultOpen?: boolean;
	disabled?: boolean;
	modal?: boolean;
	onOpenChange: OpenChangeHandler< TEventDetails >;
	open?: boolean;
};

/**
 * Forwards outside same-origin iframe presses for non-modal form popups.
 * Forwards events into the popup document for Base UI dismissal.
 * Requires a trigger captured from an opening onOpenChange notification.
 *
 * @param options Popup state and open-change handler.
 */
export function useIframeOutsidePressForwarding<
	TEventDetails extends {
		isCanceled: boolean;
		trigger: Element | undefined;
		event: Event;
	},
>( options: IframeOutsidePressForwardingOptions< TEventDetails > ) {
	const {
		defaultOpen,
		disabled,
		modal,
		onOpenChange,
		open: openProp,
	} = options;
	const [ uncontrolledOpen, setUncontrolledOpen ] = useState(
		defaultOpen ?? false
	);
	const [ trigger, setTrigger ] = useState< Element | null >( null );
	const [ popup, setPopup ] = useState< HTMLDivElement | null >( null );
	const open = openProp ?? uncontrolledOpen;
	const handleIframePress = useCallback(
		( event: Event ) => {
			const eventTarget = event.target as Node | null;
			if (
				trigger &&
				popup &&
				getNodeDocument( eventTarget ) !== popup.ownerDocument &&
				! trigger.contains( eventTarget ) &&
				! isInsideCurrentPopup( event, trigger )
			) {
				dispatchOutsidePress( event, popup.ownerDocument );
			}
		},
		[ popup, trigger ]
	);
	useIframePressListeners( {
		enabled: open && modal === false && ! disabled && trigger !== null,
		onClick: handleIframePress,
		onMouseDown: handleIframePress,
		onPointerDown: handleIframePress,
		ownerDocument:
			trigger && popup
				? getCommonDocument(
						trigger.ownerDocument,
						popup.ownerDocument
					)
				: null,
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
		const eventTarget = eventDetails.event.target as Node | null;
		const ElementConstructor =
			getNodeDocument( eventTarget )?.defaultView?.Element;
		setTrigger(
			nextOpen
				? ( eventDetails.trigger ??
						( ElementConstructor &&
						eventTarget instanceof ElementConstructor
							? eventTarget
							: null ) )
				: null
		);
	};

	return { onOpenChange: handleOpenChange, popupRef: setPopup };
}
