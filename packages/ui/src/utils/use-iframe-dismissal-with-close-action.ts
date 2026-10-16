import type { RefObject } from 'react';
import { useCallback, useRef, useState } from '@wordpress/element';
import {
	isInsideCurrentPopup,
	useIframePressListeners,
} from './iframe-dismissal-utils';

type Actions = { close: () => void };

type OpenChangeHandler< EventDetails > = (
	open: boolean,
	eventDetails: EventDetails
) => void;

type IframeDismissalWithCloseActionOptions< TActions, TEventDetails > = {
	actionsRef?: RefObject< TActions | null >;
	defaultOpen?: boolean;
	disabled?: boolean;
	modal?: boolean | 'trap-focus';
	onOpenChange: OpenChangeHandler< TEventDetails >;
	open?: boolean;
};

/**
 * Dismisses non-modal Menu and Popover popups on outside same-origin iframe presses.
 * Uses actionsRef.close() and a trigger captured by an opening onOpenChange.
 *
 * Workaround for Base UI's document-scoped outside-press listeners.
 * @see https://github.com/mui/base-ui/issues/5410#issuecomment-5376507925
 * @param options Popup state, close action, and open-change handler.
 */
export function useIframeDismissalWithCloseAction<
	TActions extends Actions,
	TEventDetails extends {
		isCanceled: boolean;
		trigger: Element | undefined;
	},
>( options: IframeDismissalWithCloseActionOptions< TActions, TEventDetails > ) {
	const {
		actionsRef,
		defaultOpen,
		disabled,
		modal,
		onOpenChange,
		open: openProp,
	} = options;
	const fallbackActionsRef = useRef< TActions | null >( null );
	const resolvedActionsRef = actionsRef ?? fallbackActionsRef;
	const [ uncontrolledOpen, setUncontrolledOpen ] = useState(
		defaultOpen ?? false
	);
	const [ trigger, setTrigger ] = useState< Element | null >( null );
	const open = openProp ?? uncontrolledOpen;
	const handleIframePointerDown = useCallback(
		( event: Event ) => {
			if ( trigger && ! isInsideCurrentPopup( event, trigger ) ) {
				resolvedActionsRef.current?.close();
			}
		},
		[ resolvedActionsRef, trigger ]
	);

	useIframePressListeners( {
		enabled: open && modal === false && ! disabled && trigger !== null,
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
		setTrigger( nextOpen ? ( eventDetails.trigger ?? null ) : null );
	};

	return {
		actionsRef: resolvedActionsRef,
		onOpenChange: handleOpenChange,
	};
}
