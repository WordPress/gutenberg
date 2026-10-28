import clsx from 'clsx';
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useState,
} from '@wordpress/element';
import styles from '../style.module.scss';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type {
	PrivateToolsPanelProps,
	RegisteredToolsPanelItem,
	ToolsPanelItemState,
	ToolsPanelMenuItemKey,
	ToolsPanelMenuItems,
	ToolsPanelProps,
	ResetAllFilter,
} from '../types';

type PanelItemsState = {
	panelItems: RegisteredToolsPanelItem[];
	menuItemOrder: string[];
	/**
	 * Menu state that can't be read back off the items: an optional item the
	 * user has shown, or a default item flagged as customized. Anything absent
	 * here falls back to whether the item currently holds a value.
	 */
	menuItemValues: Record< string, boolean >;
	/**
	 * Whether each item holds a value or an inherited value, as last reported
	 * by the item. Only tracked in `inheritanceMode`.
	 */
	itemStates: Record< string, ToolsPanelItemState >;
};

type PanelItemsAction =
	| { type: 'REGISTER_PANEL'; item: RegisteredToolsPanelItem }
	| {
			type: 'UNREGISTER_PANEL';
			label: string;
			item?: RegisteredToolsPanelItem;
	  }
	| { type: 'UPDATE_VALUE'; label: string; value: boolean }
	| { type: 'UPDATE_ITEM_STATE'; label: string; state: ToolsPanelItemState }
	| { type: 'TOGGLE_VALUE'; label: string }
	| { type: 'RESET_ALL' };

function emptyState(): PanelItemsState {
	return {
		panelItems: [],
		menuItemOrder: [],
		menuItemValues: {},
		itemStates: {},
	};
}

// An item is always shown while it has a value. `defaultShown` only opts an
// optional item in when it has none.
const getSeedValue = ( item: RegisteredToolsPanelItem ) =>
	item.hasValue() || ( ! item.isShownByDefault && !! item.defaultShown );

const getMenuGroup = (
	item: RegisteredToolsPanelItem
): ToolsPanelMenuItemKey => ( item.isShownByDefault ? 'default' : 'optional' );

function panelItemsReducer(
	panelItems: RegisteredToolsPanelItem[],
	action: PanelItemsAction
) {
	switch ( action.type ) {
		case 'REGISTER_PANEL': {
			// An existing registration is replaced rather than appended, so
			// that an item moving between the default and optional groups
			// doesn't end up in the list twice.
			const existingIndex = panelItems.findIndex(
				( item ) => item.label === action.item.label
			);

			const newItems = [ ...panelItems ];
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
			if ( index === -1 ) {
				return panelItems;
			}
			// A replacement may already hold this label, in which case this is
			// a late cleanup for a registration that is no longer current.
			if ( action.item && panelItems[ index ] !== action.item ) {
				return panelItems;
			}
			const newItems = [ ...panelItems ];
			newItems.splice( index, 1 );
			return newItems;
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
			// Append-only: an item that unregisters and comes back keeps its
			// original place in the menu.
			if ( menuItemOrder.includes( action.item.label ) ) {
				return menuItemOrder;
			}
			return [ ...menuItemOrder, action.item.label ];
		}
		default:
			return menuItemOrder;
	}
}

function menuItemValuesReducer(
	state: PanelItemsState,
	action: PanelItemsAction
) {
	const values = state.menuItemValues;

	switch ( action.type ) {
		case 'REGISTER_PANEL': {
			// A new registration starts from its own value rather than
			// inheriting what an item it replaces recorded under the same
			// label. Clearing here rather than on deregistration covers both
			// orderings, since the two are not guaranteed to arrive in one.
			// Relies on re-registering also re-reporting the value.
			if ( ! values.hasOwnProperty( action.item.label ) ) {
				return values;
			}
			const { [ action.item.label ]: unusedValue, ...rest } = values;
			return rest;
		}
		case 'UPDATE_VALUE': {
			if ( values[ action.label ] === action.value ) {
				return values;
			}
			return { ...values, [ action.label ]: action.value };
		}
		case 'TOGGLE_VALUE': {
			const item = state.panelItems.find(
				( { label } ) => label === action.label
			);
			if ( ! item ) {
				return values;
			}
			const current = values[ action.label ] ?? getSeedValue( item );
			return { ...values, [ action.label ]: ! current };
		}
		case 'RESET_ALL': {
			// Optional items are set to false so they hide right away.
			// Default items are left alone: a reset can leave a value in
			// place, since `onDeselect` and `resetAllFilter` are optional and
			// `resetAll` need not cover every attribute. Each item reports its
			// value again if the reset changed it.
			const hidden = state.panelItems.filter(
				( item ) =>
					! item.isShownByDefault && values[ item.label ] !== false
			);

			if ( ! hidden.length ) {
				return values;
			}

			const next = { ...values };
			hidden.forEach( ( { label } ) => {
				next[ label ] = false;
			} );
			return next;
		}
		default:
			return values;
	}
}

function itemStatesReducer(
	itemStates: PanelItemsState[ 'itemStates' ],
	action: PanelItemsAction
) {
	if ( action.type !== 'UPDATE_ITEM_STATE' ) {
		return itemStates;
	}
	const current = itemStates[ action.label ];
	if (
		current?.hasValue === action.state.hasValue &&
		current?.isInherited === action.state.isInherited
	) {
		return itemStates;
	}
	return { ...itemStates, [ action.label ]: action.state };
}

function panelReducer( state: PanelItemsState, action: PanelItemsAction ) {
	const panelItems = panelItemsReducer( state.panelItems, action );
	const menuItemOrder = menuItemOrderReducer( state.menuItemOrder, action );
	const menuItemValues = menuItemValuesReducer(
		{ ...state, panelItems },
		action
	);
	const itemStates = itemStatesReducer( state.itemStates, action );

	// Items dispatch far more often than they change anything. Holding onto
	// the existing state lets React skip the render.
	if (
		panelItems === state.panelItems &&
		menuItemOrder === state.menuItemOrder &&
		menuItemValues === state.menuItemValues &&
		itemStates === state.itemStates
	) {
		return state;
	}

	return { panelItems, menuItemOrder, menuItemValues, itemStates };
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
	props: WordPressComponentProps<
		ToolsPanelProps & PrivateToolsPanelProps,
		'div'
	>
) {
	const {
		className,
		headingLevel = 2,
		resetAll,
		panelId,
		hasInnerWrapper = false,
		inheritanceMode = false,
		shouldRenderPlaceholderItems = false,
		__experimentalFirstVisibleItemClass,
		__experimentalLastVisibleItemClass,
		...otherProps
	} = useContextSystem( props, 'ToolsPanel' );

	// Marks the render that follows a reset so items can tell a reset apart
	// from the user switching them off. Clearing it from an effect rather than
	// as each control updates keeps the whole reset within one pass; otherwise
	// later controls see it already cleared and reset themselves again from
	// stale data.
	const [ isResetting, setIsResetting ] = useState( false );

	useEffect( () => {
		if ( isResetting ) {
			setIsResetting( false );
		}
	}, [ isResetting ] );

	const [
		{ panelItems, menuItemOrder, menuItemValues, itemStates },
		panelDispatch,
	] = useReducer( panelReducer, undefined, emptyState );

	// Reset all filters registered against the context directly, by consumers
	// that aren't themselves a panel item. Items supply theirs when they
	// register.
	const [ externalResetAllFilters, dispatchResetAllFilters ] = useReducer(
		resetAllFiltersReducer,
		[]
	);

	const registerPanelItem = useCallback(
		( item: RegisteredToolsPanelItem ) => {
			panelDispatch( { type: 'REGISTER_PANEL', item } );
		},
		[]
	);

	const deregisterPanelItem = useCallback(
		( label: string, item?: RegisteredToolsPanelItem ) => {
			panelDispatch( { type: 'UNREGISTER_PANEL', label, item } );
		},
		[]
	);

	const registerResetAllFilter = useCallback( ( filter: ResetAllFilter ) => {
		dispatchResetAllFilters( { type: 'REGISTER', filter } );
	}, [] );

	const deregisterResetAllFilter = useCallback(
		( filter: ResetAllFilter ) => {
			dispatchResetAllFilters( { type: 'UNREGISTER', filter } );
		},
		[]
	);

	// Argument order is unchanged from before this hook derived the menu; only
	// the group argument is gone, since it follows from `isShownByDefault`.
	const flagItemCustomization = useCallback(
		( value: boolean, label: string ) => {
			panelDispatch( { type: 'UPDATE_VALUE', label, value } );
		},
		[]
	);

	const flagItemState = useCallback(
		( label: string, state: ToolsPanelItemState ) => {
			panelDispatch( { type: 'UPDATE_ITEM_STATE', label, state } );
		},
		[]
	);

	const inheritedItems = useMemo( () => {
		const result: Record< string, boolean > = {};
		if ( ! inheritanceMode ) {
			return result;
		}
		Object.entries( itemStates ).forEach( ( [ label, state ] ) => {
			if ( state.isInherited ) {
				result[ label ] = true;
			}
		} );
		return result;
	}, [ inheritanceMode, itemStates ] );

	// Derived during render so the panel can never paint a half-built menu.
	// See: https://github.com/WordPress/gutenberg/pull/65564
	const menuItems = useMemo( () => {
		const result: ToolsPanelMenuItems = { default: {}, optional: {} };
		const byLabel = new Map(
			panelItems.map( ( item ) => [ item.label, item ] )
		);

		// `menuItemOrder` holds every registered label, so it alone drives
		// the menu.
		menuItemOrder.forEach( ( label ) => {
			const item = byLabel.get( label );
			if ( ! item ) {
				return;
			}
			// An inherited item stays shown whatever the menu recorded, so it
			// comes back once a reset clears the local value it overrode.
			result[ getMenuGroup( item ) ][ label ] =
				!! inheritedItems[ label ] ||
				( menuItemValues[ label ] ?? getSeedValue( item ) );
		} );

		return result;
	}, [ panelItems, menuItemOrder, menuItemValues, inheritedItems ] );

	const itemsWithValue = useMemo( () => {
		if ( ! inheritanceMode ) {
			return [];
		}
		const registeredLabels = new Set(
			panelItems.map( ( item ) => item.label )
		);
		return menuItemOrder.filter(
			( label ) =>
				registeredLabels.has( label ) && itemStates[ label ]?.hasValue
		);
	}, [ inheritanceMode, panelItems, menuItemOrder, itemStates ] );

	// Drives the plus icon and the empty panel styling.
	const areAllOptionalControlsHidden = useMemo( () => {
		return (
			isMenuItemTypeEmpty( menuItems.default ) &&
			! isMenuItemTypeEmpty( menuItems.optional ) &&
			Object.values( menuItems.optional ).every(
				( isSelected ) => ! isSelected
			)
		);
	}, [ menuItems ] );

	const classes = clsx(
		styles[ 'tools-panel' ],
		hasInnerWrapper && styles[ 'tools-panel-with-inner-wrapper' ],
		areAllOptionalControlsHidden &&
			styles[ 'tools-panel-hidden-inner-wrapper' ],
		className
	);

	// `onShownChange` is invoked from here rather than in response to the
	// resulting state change, so that it only ever reports an explicit menu
	// action by the user.
	const toggleItem = useCallback(
		( label: string ) => {
			const currentItem = panelItems.find(
				( item ) => item.label === label
			);

			// An inherited item can't be removed from the panel.
			if ( ! currentItem || inheritedItems[ label ] ) {
				return;
			}

			panelDispatch( { type: 'TOGGLE_VALUE', label } );

			// Default items stay visible when toggled off, which resets them
			// instead of hiding them. Only optional items have a show or hide
			// transition to report.
			if ( currentItem.isShownByDefault ) {
				return;
			}

			currentItem.onShownChange?.( ! menuItems.optional[ label ] );
		},
		[ inheritedItems, menuItems, panelItems ]
	);

	// Resets one item from the reset menu. Unlike toggling it off in the panel
	// menu, the item stays registered as shown only while it is inherited:
	// with neither a local nor an inherited value left, it hides.
	const resetItem = useCallback(
		( label: string ) => {
			const currentItem = panelItems.find(
				( item ) => item.label === label
			);

			if ( ! currentItem ) {
				return;
			}

			// Stops the item resetting itself a second time when it sees its
			// menu entry switch off while it still holds a value.
			setIsResetting( true );
			currentItem.onDeselect?.();

			if ( ! currentItem.isShownByDefault ) {
				panelDispatch( { type: 'UPDATE_VALUE', label, value: false } );
			}
		},
		[ panelItems ]
	);

	const resetAllFilters = useMemo( () => {
		const itemFilters = panelItems
			.map( ( item ) => item.resetAllFilter )
			.filter( ( filter ): filter is ResetAllFilter => !! filter );

		return [ ...itemFilters, ...externalResetAllFilters ];
	}, [ panelItems, externalResetAllFilters ] );

	const resetAllItems = useCallback( () => {
		if ( typeof resetAll === 'function' ) {
			setIsResetting( true );
			resetAll( resetAllFilters );
		}

		panelDispatch( { type: 'RESET_ALL' } );
	}, [ resetAllFilters, resetAll ] );

	// Lets `ItemGroup` style the visible ends of the panel when hidden
	// placeholder items sit among the children.
	const getFirstVisibleItemLabel = ( items: RegisteredToolsPanelItem[] ) => {
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
			flagItemState,
			hasMenuItems,
			inheritanceMode,
			inheritedItems,
			isResetting,
			itemsWithValue,
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
			flagItemState,
			inheritanceMode,
			inheritedItems,
			isResetting,
			itemsWithValue,
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
		resetItem,
		toggleItem,
		className: classes,
	};
}
