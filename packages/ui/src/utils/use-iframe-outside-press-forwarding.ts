import { useCallback, useState } from '@wordpress/element';
import {
	getNodeDocument,
	isInsideCurrentPopup,
	useIframePressListeners,
} from './iframe-dismissal-utils';

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

	if ( ! frameElement ) {
		return;
	}

	const EventConstructor =
		event.type === 'mousedown'
			? ownerDocument.defaultView?.MouseEvent
			: ownerDocument.defaultView?.PointerEvent;
	if ( ! EventConstructor ) {
		return;
	}

	const pointerEvent = event as PointerEvent;
	frameElement.dispatchEvent(
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
 * Dispatches pointer and mouse presses on the containing iframe for Base UI dismissal.
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
	const open = openProp ?? uncontrolledOpen;
	const handleIframePress = useCallback(
		( event: Event ) => {
			if ( trigger && ! isInsideCurrentPopup( event, trigger ) ) {
				dispatchOutsidePress( event, trigger.ownerDocument );
			}
		},
		[ trigger ]
	);
	useIframePressListeners( {
		enabled: open && modal === false && ! disabled && trigger !== null,
		onClick: handleIframePress,
		onMouseDown: handleIframePress,
		onPointerDown: handleIframePress,
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
