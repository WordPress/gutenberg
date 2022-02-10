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
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import type {
	ToolsPanelItem,
	ToolsPanelMenuItemKey,
	ToolsPanelMenuItems,
	ToolsPanelMenuItemsConfig,
	ToolsPanelProps,
} from '../types';

const DEFAULT_COLUMNS = 2;

const generateMenuItems = ( {
	panelItems,
	shouldReset,
	currentMenuItems,
}: ToolsPanelMenuItemsConfig ) => {
	const menuItems: ToolsPanelMenuItems = { default: {}, optional: {} };

	panelItems.forEach( ( { hasValue, isShownByDefault, label } ) => {
		const group = isShownByDefault ? 'default' : 'optional';

		// If a menu item for this label already exists, do not overwrite its value.
		// This can cause default controls that have been flagged as customized to
		// lose their value.
		const existingItemValue = currentMenuItems?.[ group ]?.[ label ];
		const value =
			existingItemValue !== undefined ? existingItemValue : hasValue();

		menuItems[ group ][ label ] = shouldReset ? false : value;
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
		resetAll,
		panelId,
		hasInnerWrapper,
		shouldRenderPlaceholderItems,
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

	const registerPanelItem = useCallback(
		( item: ToolsPanelItem ) => {
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
		},
		[ setPanelItems ]
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
			} );
			return items;
		} );
	}, [ generateMenuItems, panelItems, setMenuItems ] );

	// Force a menu item to be checked.
	// This is intended for use with default panel items. They are displayed
	// separately to optional items and have different display states,
	// we need to update that when their value is customized.
	const flagItemCustomization = useCallback(
		( label: string, group: ToolsPanelMenuItemKey = 'default' ) => {
			setMenuItems( ( items ) => {
				const newState = {
					...items,
					[ group ]: {
						...items[ group ],
						[ label ]: true,
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
	const [
		areAllOptionalControlsHidden,
		setAreAllOptionalControlsHidden,
	] = useState( false );

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

		return cx( styles.ToolsPanel, wrapperStyle, emptyStyle, className );
	}, [
		areAllOptionalControlsHidden,
		className,
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

			// Collect available reset filters from panel items.
			const filters: Array< () => void > = [];
			panelItems.forEach( ( item ) => {
				if ( item.resetAllFilter ) {
					filters.push( item.resetAllFilter );
				}
			} );

			resetAll( filters );
		}

		// Turn off display of all non-default items.
		const resetMenuItems = generateMenuItems( {
			panelItems,
			shouldReset: true,
		} );
		setMenuItems( resetMenuItems );
	}, [
		generateMenuItems,
		isResetting.current,
		panelItems,
		resetAll,
		setMenuItems,
	] );

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
			firstDisplayedItem,
			flagItemCustomization,
			hasMenuItems: !! panelItems.length,
			isResetting: isResetting.current,
			lastDisplayedItem,
			menuItems,
			panelId,
			registerPanelItem,
			shouldRenderPlaceholderItems,
			__experimentalFirstVisibleItemClass,
			__experimentalLastVisibleItemClass,
		} ),
		[
			areAllOptionalControlsHidden,
			deregisterPanelItem,
			firstDisplayedItem,
			flagItemCustomization,
			isResetting.current,
			lastDisplayedItem,
			menuItems,
			panelId,
			panelItems,
			registerPanelItem,
			shouldRenderPlaceholderItems,
			__experimentalFirstVisibleItemClass,
			__experimentalLastVisibleItemClass,
		]
	);

	return {
		...otherProps,
		panelContext,
		resetAllItems,
		toggleItem,
		className: classes,
	};
}
