import { Menu as _Menu } from '@base-ui/react/menu';
import {
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { DirectionProvider } from '../utils/direction-provider';
import { MenuContext } from './context';
import type { RootProps } from './types';
import { useCloseOnIframePointerDown } from './use-close-on-iframe-pointer-down';

/**
 * Groups all parts of a menu.
 *
 * `Menu.Root` manages the open state and provides context for menu triggers,
 * popups, and items. Compose it with `Menu.Trigger` and `Menu.Popup` to build
 * a menu button, and with `Menu.SubmenuRoot` / `Menu.SubmenuTrigger` to build
 * nested menus.
 *
 * ```jsx
 * <Menu.Root>
 *   <Menu.Trigger>Open menu</Menu.Trigger>
 *   <Menu.Popup>
 *     <Menu.Item>
 *       <Menu.ItemLabel>Action</Menu.ItemLabel>
 *     </Menu.Item>
 *   </Menu.Popup>
 * </Menu.Root>
 * ```
 */
function Root( props: RootProps ) {
	const {
		actionsRef,
		defaultOpen,
		modal,
		onOpenChange,
		open: openProp,
		...rootProps
	} = props;
	const internalActionsRef = useRef< _Menu.Root.Actions | null >( null );
	const [ uncontrolledOpen, setUncontrolledOpen ] = useState(
		defaultOpen ?? false
	);
	const [ ownerDocument, setOwnerDocument ] = useState< Document | null >(
		() => ( typeof document === 'undefined' ? null : document )
	);
	const open = openProp ?? uncontrolledOpen;
	const close = useCallback( () => {
		internalActionsRef.current?.close();
	}, [] );

	useImperativeHandle(
		actionsRef,
		() => ( {
			close,
			unmount: () => internalActionsRef.current?.unmount(),
		} ),
		[ close ]
	);
	useCloseOnIframePointerDown( {
		enabled: open && modal === false,
		onPointerDown: close,
		ownerDocument,
	} );

	const handleOpenChange: NonNullable< RootProps[ 'onOpenChange' ] > = (
		nextOpen,
		eventDetails
	) => {
		const trigger = eventDetails.trigger;
		const TriggerElement = trigger?.ownerDocument.defaultView?.HTMLElement;
		const EventTargetElement = trigger?.ownerDocument.defaultView?.Element;
		const activeElementBeforeOpenChange =
			trigger?.ownerDocument.activeElement;
		const eventTarget = eventDetails.event.target;
		const menuElement =
			EventTargetElement && eventTarget instanceof EventTargetElement
				? eventTarget.closest( '[role="menu"]' )
				: null;

		onOpenChange?.( nextOpen, eventDetails );

		if ( ! eventDetails.isCanceled ) {
			setUncontrolledOpen( nextOpen );
			if ( nextOpen && trigger ) {
				setOwnerDocument( trigger.ownerDocument );
			}
		}

		if (
			! nextOpen &&
			eventDetails.reason === 'item-press' &&
			! eventDetails.isCanceled &&
			TriggerElement &&
			trigger instanceof TriggerElement &&
			menuElement?.contains( activeElementBeforeOpenChange ?? null ) &&
			trigger.ownerDocument.activeElement ===
				activeElementBeforeOpenChange
		) {
			/*
			 * Move focus before the item's click handler can mount another overlay.
			 * This lets that overlay capture the menu trigger, rather than the menu
			 * item that is about to be unmounted, as its focus return target. Do not
			 * override focus moved explicitly by the consumer's onOpenChange handler.
			 */
			trigger.focus();
		}
	};

	return (
		<DirectionProvider>
			<MenuContext.Provider value={ { isSubmenu: false } }>
				<_Menu.Root
					{ ...rootProps }
					actionsRef={ internalActionsRef }
					defaultOpen={ defaultOpen }
					modal={ modal }
					onOpenChange={ handleOpenChange }
					open={ openProp }
				/>
			</MenuContext.Provider>
		</DirectionProvider>
	);
}

export { Root };
