/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
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

const generateMenuItems = ( {
	panelItems,
	shouldReset,
	currentMenuItems,
	menuItemOrder,
}: ToolsPanelMenuItemsConfig ) => {
	const newMenuItems: ToolsPanelMenuItems = { default: {}, optional: {} };
	const menuItems: ToolsPanelMenuItems = { default: {}, optional: {} };

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

const isMenuItemTypeEmpty = (
	obj?: ToolsPanelMenuItems[ ToolsPanelMenuItemKey ]
) => obj && Object.keys( obj ).length === 0;

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

	const isResetting = useRef( false );
	const wasResetting = isResetting.current;

	// `isResetting` is cleared via this hook to effectively batch together
	// the resetAll task. Without this, the flag is cleared after the first
	// control updates and forces a rerender with subsequent controls then
	// believing they need to reset, unfortunately using stale data.
	useEffect( () => {
		if ( wasResetting ) {
			isResetting.current = false;
		}
	}, [ wasResetting ] );

	// Allow panel items to register themselves.
	const [ panelItems, setPanelItems ] = useState< ToolsPanelItem[] >( [] );
	const [ menuItemOrder, setMenuItemOrder ] = useState< string[] >( [] );
	const [ resetAllFilters, setResetAllFilters ] = useState<
		ResetAllFilter[]
	>( [] );

	const registerPanelItem = useCallback(
		( item: ToolsPanelItem ) => {
			// Add item to panel items.
			setPanelItems( ( items ) => {
				const newItems = [ ...items ];
				// If an item with this label has already been registered, remove it
				// first. This can happen when an item is moved between the default
				// and optional groups.
				const existingIndex = newItems.findIndex(
					( oldItem ) => oldItem.label === item.label
				);
				if ( existingIndex !== -1 ) {
					newItems.splice( existingIndex, 1 );
				}
				return [ ...newItems, item ];
			} );

			// Track the initial order of item registration. This is used for
			// maintaining menu item order later.
			setMenuItemOrder( ( items ) => {
				if ( items.includes( item.label ) ) {
					return items;
				}

				return [ ...items, item.label ];
			} );
		},
		[ setPanelItems, setMenuItemOrder ]
	);

	// Panels need to deregister on unmount to avoid orphans in menu state.
	// This is an issue when panel items are being injected via SlotFills.
	const deregisterPanelItem = useCallback(
		( label: string ) => {
			// When switching selections between components injecting matching
			// controls, e.g. both panels have a "padding" control, the
			// deregistration of the first panel doesn't occur until after the
			// registration of the next.
			setPanelItems( ( items ) => {
				const newItems = [ ...items ];
				const index = newItems.findIndex(
					( item ) => item.label === label
				);
				if ( index !== -1 ) {
					newItems.splice( index, 1 );
				}
				return newItems;
			} );
		},
		[ setPanelItems ]
	);

	const registerResetAllFilter = useCallback(
		( newFilter: ResetAllFilter ) => {
			setResetAllFilters( ( filters ) => {
				return [ ...filters, newFilter ];
			} );
		},
		[ setResetAllFilters ]
	);

	const deregisterResetAllFilter = useCallback(
		( filterToRemove: ResetAllFilter ) => {
			setResetAllFilters( ( filters ) => {
				return filters.filter(
					( filter ) => filter !== filterToRemove
				);
			} );
		},
		[ setResetAllFilters ]
	);

	// Manage and share display state of menu items representing child controls.
	const [ menuItems, setMenuItems ] = useState< ToolsPanelMenuItems >( {
		default: {},
		optional: {},
	} );

	// Setup menuItems state as panel items register themselves.
	useEffect( () => {
		setMenuItems( ( prevState ) => {
			const items = generateMenuItems( {
				panelItems,
				shouldReset: false,
				currentMenuItems: prevState,
				menuItemOrder,
			} );
			return items;
		} );
	}, [ panelItems, setMenuItems, menuItemOrder ] );

	// Updates the status of the panel’s menu items. For default items the
	// value represents whether it differs from the default and for optional
	// items whether the item is shown.
	const flagItemCustomization = useCallback(
		(
			value: boolean,
			label: string,
			group: ToolsPanelMenuItemKey = 'default'
		) => {
			setMenuItems( ( items ) => {
				const newState = {
					...items,
					[ group ]: {
						...items[ group ],
						[ label ]: value,
					},
				};
				return newState;
			} );
		},
		[ setMenuItems ]
	);

	// Whether all optional menu items are hidden or not must be tracked
	// in order to later determine if the panel display is empty and handle
	// conditional display of a plus icon to indicate the presence of further
	// menu items.
	const [ areAllOptionalControlsHidden, setAreAllOptionalControlsHidden ] =
		useState( false );

	useEffect( () => {
		if (
			isMenuItemTypeEmpty( menuItems?.default ) &&
			! isMenuItemTypeEmpty( menuItems?.optional )
		) {
			const allControlsHidden = ! Object.entries(
				menuItems.optional
			).some( ( [ , isSelected ] ) => isSelected );
			setAreAllOptionalControlsHidden( allControlsHidden );
		}
	}, [ menuItems, setAreAllOptionalControlsHidden ] );

	const cx = useCx();
	const classes = useMemo( () => {
		const wrapperStyle =
			hasInnerWrapper &&
			styles.ToolsPanelWithInnerWrapper( DEFAULT_COLUMNS );
		const emptyStyle =
			isMenuItemTypeEmpty( menuItems?.default ) &&
			areAllOptionalControlsHidden &&
			styles.ToolsPanelHiddenInnerWrapper;

		return cx(
			styles.ToolsPanel( DEFAULT_COLUMNS ),
			wrapperStyle,
			emptyStyle,
			className
		);
	}, [
		areAllOptionalControlsHidden,
		className,
		cx,
		hasInnerWrapper,
		menuItems,
	] );

	// Toggle the checked state of a menu item which is then used to determine
	// display of the item within the panel.
	const toggleItem = useCallback(
		( label: string ) => {
			const currentItem = panelItems.find(
				( item ) => item.label === label
			);

			if ( ! currentItem ) {
				return;
			}

			const menuGroup = currentItem.isShownByDefault
				? 'default'
				: 'optional';

			const newMenuItems = {
				...menuItems,
				[ menuGroup ]: {
					...menuItems[ menuGroup ],
					[ label ]: ! menuItems[ menuGroup ][ label ],
				},
			};

			setMenuItems( newMenuItems );
		},
		[ menuItems, panelItems, setMenuItems ]
	);

	// Resets display of children and executes resetAll callback if available.
	const resetAllItems = useCallback( () => {
		if ( typeof resetAll === 'function' ) {
			isResetting.current = true;
			resetAll( resetAllFilters );
		}

		// Turn off display of all non-default items.
		const resetMenuItems = generateMenuItems( {
			panelItems,
			menuItemOrder,
			shouldReset: true,
		} );
		setMenuItems( resetMenuItems );
	}, [ panelItems, resetAllFilters, resetAll, setMenuItems, menuItemOrder ] );

	// Assist ItemGroup styling when there are potentially hidden placeholder
	// items by identifying first & last items that are toggled on for display.
	const getFirstVisibleItemLabel = ( items: ToolsPanelItem[] ) => {
		const optionalItems = menuItems.optional || {};
		const firstItem = items.find(
			( item ) => item.isShownByDefault || !! optionalItems[ item.label ]
		);

		return firstItem?.label;
	};

	const firstDisplayedItem = getFirstVisibleItemLabel( panelItems );
	const lastDisplayedItem = getFirstVisibleItemLabel(
		[ ...panelItems ].reverse()
	);

	const panelContext = useMemo(
		() => ( {
			areAllOptionalControlsHidden,
			deregisterPanelItem,
			deregisterResetAllFilter,
			firstDisplayedItem,
			flagItemCustomization,
			hasMenuItems: !! panelItems.length,
			isResetting: isResetting.current,
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
			panelItems,
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
