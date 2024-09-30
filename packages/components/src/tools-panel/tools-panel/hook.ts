/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import type {
	ToolsPanelItem,
	ToolsPanelMenuItemKey,
	ToolsPanelMenuItems,
	ToolsPanelMenuItemsConfig,
	ToolsPanelProps,
	ResetAllFilter,
} from '../types';

const DEFAULT_COLUMNS = 2;

type PanelItemsState = {
	panelItems: ToolsPanelItem[];
	menuItemOrder: string[];
	menuItems: ToolsPanelMenuItems;
};

type PanelItemsAction =
	| { type: 'REGISTER_PANEL'; item: ToolsPanelItem }
	| { type: 'UNREGISTER_PANEL'; label: string }
	| {
			type: 'UPDATE_VALUE';
			group: ToolsPanelMenuItemKey;
			label: string;
			value: boolean;
	  }
	| { type: 'TOGGLE_VALUE'; label: string }
	| { type: 'RESET_ALL' };

function emptyMenuItems(): ToolsPanelMenuItems {
	return { default: {}, optional: {} };
}

function emptyState(): PanelItemsState {
	return { panelItems: [], menuItemOrder: [], menuItems: emptyMenuItems() };
}

const generateMenuItems = ( {
	panelItems,
	shouldReset,
	currentMenuItems,
	menuItemOrder,
}: ToolsPanelMenuItemsConfig ) => {
	const newMenuItems: ToolsPanelMenuItems = emptyMenuItems();
	const menuItems: ToolsPanelMenuItems = emptyMenuItems();

	panelItems.forEach( ( { hasValue, isShownByDefault, label } ) => {
		const group = isShownByDefault ? 'default' : 'optional';

		// If a menu item for this label has already been flagged as customized
		// (for default controls), or toggled on (for optional controls), do not
		// overwrite its value as those controls would lose that state.
		const existingItemValue = currentMenuItems?.[ group ]?.[ label ];
		const value = existingItemValue ? existingItemValue : hasValue();

		newMenuItems[ group ][ label ] = shouldReset ? false : value;
	} );

	// Loop the known, previously registered items first to maintain menu order.
	menuItemOrder.forEach( ( key ) => {
		if ( newMenuItems.default.hasOwnProperty( key ) ) {
			menuItems.default[ key ] = newMenuItems.default[ key ];
		}

		if ( newMenuItems.optional.hasOwnProperty( key ) ) {
			menuItems.optional[ key ] = newMenuItems.optional[ key ];
		}
	} );

	// Loop newMenuItems object adding any that aren't in the known items order.
	Object.keys( newMenuItems.default ).forEach( ( key ) => {
		if ( ! menuItems.default.hasOwnProperty( key ) ) {
			menuItems.default[ key ] = newMenuItems.default[ key ];
		}
	} );

	Object.keys( newMenuItems.optional ).forEach( ( key ) => {
		if ( ! menuItems.optional.hasOwnProperty( key ) ) {
			menuItems.optional[ key ] = newMenuItems.optional[ key ];
		}
	} );

	return menuItems;
};

function panelItemsReducer(
	panelItems: ToolsPanelItem[],
	action: PanelItemsAction
) {
	switch ( action.type ) {
		case 'REGISTER_PANEL': {
			const newItems = [ ...panelItems ];
			// If an item with this label has already been registered, remove it
			// first. This can happen when an item is moved between the default
			// and optional groups.
			const existingIndex = newItems.findIndex(
				( oldItem ) => oldItem.label === action.item.label
			);
			if ( existingIndex !== -1 ) {
				newItems.splice( existingIndex, 1 );
			}
			newItems.push( action.item );
			return newItems;
		}
		case 'UNREGISTER_PANEL': {
			const index = panelItems.findIndex(
				( item ) => item.label === action.label
			);
			if ( index !== -1 ) {
				const newItems = [ ...panelItems ];
				newItems.splice( index, 1 );
				return newItems;
			}
			return panelItems;
		}
		default:
			return panelItems;
	}
}

function menuItemOrderReducer(
	menuItemOrder: string[],
	action: PanelItemsAction
) {
	switch ( action.type ) {
		case 'REGISTER_PANEL': {
			// Track the initial order of item registration. This is used for
			// maintaining menu item order later.
			if ( menuItemOrder.includes( action.item.label ) ) {
				return menuItemOrder;
			}

			return [ ...menuItemOrder, action.item.label ];
		}
		default:
			return menuItemOrder;
	}
}

function menuItemsReducer( state: PanelItemsState, action: PanelItemsAction ) {
	switch ( action.type ) {
		case 'REGISTER_PANEL':
		case 'UNREGISTER_PANEL':
			// generate new menu items from original `menuItems` and updated `panelItems` and `menuItemOrder`
			return generateMenuItems( {
				currentMenuItems: state.menuItems,
				panelItems: state.panelItems,
				menuItemOrder: state.menuItemOrder,
				shouldReset: false,
			} );
		case 'RESET_ALL':
			return generateMenuItems( {
				panelItems: state.panelItems,
				menuItemOrder: state.menuItemOrder,
				shouldReset: true,
			} );
		case 'UPDATE_VALUE': {
			const oldValue = state.menuItems[ action.group ][ action.label ];
			if ( action.value === oldValue ) {
				return state.menuItems;
			}
			return {
				...state.menuItems,
				[ action.group ]: {
					...state.menuItems[ action.group ],
					[ action.label ]: action.value,
				},
			};
		}
		case 'TOGGLE_VALUE': {
			const currentItem = state.panelItems.find(
				( item ) => item.label === action.label
			);

			if ( ! currentItem ) {
				return state.menuItems;
			}

			const menuGroup = currentItem.isShownByDefault
				? 'default'
				: 'optional';

			const newMenuItems = {
				...state.menuItems,
				[ menuGroup ]: {
					...state.menuItems[ menuGroup ],
					[ action.label ]:
						! state.menuItems[ menuGroup ][ action.label ],
				},
			};
			return newMenuItems;
		}

		default:
			return state.menuItems;
	}
}

function panelReducer( state: PanelItemsState, action: PanelItemsAction ) {
	const panelItems = panelItemsReducer( state.panelItems, action );
	const menuItemOrder = menuItemOrderReducer( state.menuItemOrder, action );
	// `menuItemsReducer` is a bit unusual because it generates new state from original `menuItems`
	// and the updated `panelItems` and `menuItemOrder`.
	const menuItems = menuItemsReducer(
		{ panelItems, menuItemOrder, menuItems: state.menuItems },
		action
	);

	return { panelItems, menuItemOrder, menuItems };
}

function resetAllFiltersReducer(
	filters: ResetAllFilter[],
	action: { type: 'REGISTER' | 'UNREGISTER'; filter: ResetAllFilter }
) {
	switch ( action.type ) {
		case 'REGISTER':
			return [ ...filters, action.filter ];
		case 'UNREGISTER':
			return filters.filter( ( f ) => f !== action.filter );
		default:
			return filters;
	}
}

const isMenuItemTypeEmpty = (
	obj: ToolsPanelMenuItems[ ToolsPanelMenuItemKey ]
) => Object.keys( obj ).length === 0;

export function useToolsPanel(
	props: WordPressComponentProps< ToolsPanelProps, 'div' >
) {
	const {
		className,
		headingLevel = 2,
		resetAll,
		panelId,
		hasInnerWrapper = false,
		shouldRenderPlaceholderItems = false,
		__experimentalFirstVisibleItemClass,
		__experimentalLastVisibleItemClass,
		...otherProps
	} = useContextSystem( props, 'ToolsPanel' );

	const isResettingRef = useRef( false );
	const wasResetting = isResettingRef.current;

	// `isResettingRef` is cleared via this hook to effectively batch together
	// the resetAll task. Without this, the flag is cleared after the first
	// control updates and forces a rerender with subsequent controls then
	// believing they need to reset, unfortunately using stale data.
	useEffect( () => {
		if ( wasResetting ) {
			isResettingRef.current = false;
		}
	}, [ wasResetting ] );

	// Allow panel items to register themselves.
	const [ { panelItems, menuItems }, panelDispatch ] = useReducer(
		panelReducer,
		undefined,
		emptyState
	);

	const [ resetAllFilters, dispatchResetAllFilters ] = useReducer(
		resetAllFiltersReducer,
		[]
	);

	const registerPanelItem = useCallback( ( item: ToolsPanelItem ) => {
		// Add item to panel items.
		panelDispatch( { type: 'REGISTER_PANEL', item } );
	}, [] );

	// Panels need to deregister on unmount to avoid orphans in menu state.
	// This is an issue when panel items are being injected via SlotFills.
	const deregisterPanelItem = useCallback( ( label: string ) => {
		// When switching selections between components injecting matching
		// controls, e.g. both panels have a "padding" control, the
		// deregistration of the first panel doesn't occur until after the
		// registration of the next.
		panelDispatch( { type: 'UNREGISTER_PANEL', label } );
	}, [] );

	const registerResetAllFilter = useCallback( ( filter: ResetAllFilter ) => {
		dispatchResetAllFilters( { type: 'REGISTER', filter } );
	}, [] );

	const deregisterResetAllFilter = useCallback(
		( filter: ResetAllFilter ) => {
			dispatchResetAllFilters( { type: 'UNREGISTER', filter } );
		},
		[]
	);

	// Updates the status of the panel’s menu items. For default items the
	// value represents whether it differs from the default and for optional
	// items whether the item is shown.
	const flagItemCustomization = useCallback(
		(
			value: boolean,
			label: string,
			group: ToolsPanelMenuItemKey = 'default'
		) => {
			panelDispatch( { type: 'UPDATE_VALUE', group, label, value } );
		},
		[]
	);

	// Whether all optional menu items are hidden or not must be tracked
	// in order to later determine if the panel display is empty and handle
	// conditional display of a plus icon to indicate the presence of further
	// menu items.
	const areAllOptionalControlsHidden = useMemo( () => {
		return (
			isMenuItemTypeEmpty( menuItems.default ) &&
			! isMenuItemTypeEmpty( menuItems.optional ) &&
			Object.values( menuItems.optional ).every(
				( isSelected ) => ! isSelected
			)
		);
	}, [ menuItems ] );

	const cx = useCx();
	const classes = useMemo( () => {
		const wrapperStyle =
			hasInnerWrapper &&
			styles.ToolsPanelWithInnerWrapper( DEFAULT_COLUMNS );
		const emptyStyle =
			areAllOptionalControlsHidden && styles.ToolsPanelHiddenInnerWrapper;

		return cx(
			styles.ToolsPanel( DEFAULT_COLUMNS ),
			wrapperStyle,
			emptyStyle,
			className
		);
	}, [ areAllOptionalControlsHidden, className, cx, hasInnerWrapper ] );

	// Toggle the checked state of a menu item which is then used to determine
	// display of the item within the panel.
	const toggleItem = useCallback( ( label: string ) => {
		panelDispatch( { type: 'TOGGLE_VALUE', label } );
	}, [] );

	// Resets display of children and executes resetAll callback if available.
	const resetAllItems = useCallback( () => {
		if ( typeof resetAll === 'function' ) {
			isResettingRef.current = true;
			resetAll( resetAllFilters );
		}

		// Turn off display of all non-default items.
		panelDispatch( { type: 'RESET_ALL' } );
	}, [ resetAllFilters, resetAll ] );

	// Assist ItemGroup styling when there are potentially hidden placeholder
	// items by identifying first & last items that are toggled on for display.
	const getFirstVisibleItemLabel = ( items: ToolsPanelItem[] ) => {
		const optionalItems = menuItems.optional || {};
		const firstItem = items.find(
			( item ) => item.isShownByDefault || optionalItems[ item.label ]
		);

		return firstItem?.label;
	};

	const firstDisplayedItem = getFirstVisibleItemLabel( panelItems );
	const lastDisplayedItem = getFirstVisibleItemLabel(
		[ ...panelItems ].reverse()
	);

	const hasMenuItems = panelItems.length > 0;

	const panelContext = useMemo(
		() => ( {
			areAllOptionalControlsHidden,
			deregisterPanelItem,
			deregisterResetAllFilter,
			firstDisplayedItem,
			flagItemCustomization,
			hasMenuItems,
			isResetting: isResettingRef.current,
			lastDisplayedItem,
			menuItems,
			panelId,
			registerPanelItem,
			registerResetAllFilter,
			shouldRenderPlaceholderItems,
			__experimentalFirstVisibleItemClass,
			__experimentalLastVisibleItemClass,
		} ),
		[
			areAllOptionalControlsHidden,
			deregisterPanelItem,
			deregisterResetAllFilter,
			firstDisplayedItem,
			flagItemCustomization,
			lastDisplayedItem,
			menuItems,
			panelId,
			hasMenuItems,
			registerResetAllFilter,
			registerPanelItem,
			shouldRenderPlaceholderItems,
			__experimentalFirstVisibleItemClass,
			__experimentalLastVisibleItemClass,
		]
	);

	return {
		...otherProps,
		headingLevel,
		panelContext,
		resetAllItems,
		toggleItem,
		className: classes,
	};
}
