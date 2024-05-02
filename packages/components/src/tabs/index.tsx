/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabsProps } from './types';
import { TabsContext } from './context';
import { Tab } from './tab';
import { TabList } from './tablist';
import { TabPanel } from './tabpanel';

function Tabs( {
	selectOnMove = true,
	defaultTabId,
	orientation = 'horizontal',
	onSelect,
	children,
	selectedTabId,
}: TabsProps ) {
	const instanceId = useInstanceId( Tabs, 'tabs' );
	const store = Ariakit.useTabStore( {
		selectOnMove,
		orientation,
		defaultSelectedId: defaultTabId && `${ instanceId }-${ defaultTabId }`,
		setSelectedId: ( selectedId ) => {
			const strippedDownId =
				typeof selectedId === 'string'
					? selectedId.replace( `${ instanceId }-`, '' )
					: selectedId;
			onSelect?.( strippedDownId );
		},
		selectedId: selectedTabId && `${ instanceId }-${ selectedTabId }`,
	} );

	const isControlled = selectedTabId !== undefined;

	const { items, selectedId, activeId } = store.useState();
	const { setSelectedId, setActiveId } = store;

	// Keep track of whether tabs have been populated. This is used to prevent
	// certain effects from firing too early while tab data and relevant
	// variables are undefined during the initial render.
	const tabsHavePopulated = useRef( false );
	if ( items.length > 0 ) {
		tabsHavePopulated.current = true;
	}

	const selectedTab = items.find( ( item ) => item.id === selectedId );
	const firstEnabledTab = items.find( ( item ) => {
		// Ariakit internally refers to disabled tabs as `dimmed`.
		return ! item.dimmed;
	} );
	const initialTab = items.find(
		( item ) => item.id === `${ instanceId }-${ defaultTabId }`
	);

	// Handle selecting the initial tab.
	useLayoutEffect( () => {
		if ( isControlled ) {
			return;
		}

		// Wait for the denoted initial tab to be declared before making a
		// selection. This ensures that if a tab is declared lazily it can
		// still receive initial selection, as well as ensuring no tab is
		// selected if an invalid `defaultTabId` is provided.
		if ( defaultTabId && ! initialTab ) {
			return;
		}

		// If the currently selected tab is missing (i.e. removed from the DOM),
		// fall back to the initial tab or the first enabled tab if there is
		// one. Otherwise, no tab should be selected.
		if ( ! items.find( ( item ) => item.id === selectedId ) ) {
			if ( initialTab && ! initialTab.dimmed ) {
				setSelectedId( initialTab?.id );
				return;
			}

			if ( firstEnabledTab ) {
				setSelectedId( firstEnabledTab.id );
			} else if ( tabsHavePopulated.current ) {
				setSelectedId( null );
			}
		}
	}, [
		firstEnabledTab,
		initialTab,
		defaultTabId,
		isControlled,
		items,
		selectedId,
		setSelectedId,
	] );

	// Handle the currently selected tab becoming disabled.
	useLayoutEffect( () => {
		if ( ! selectedTab?.dimmed ) {
			return;
		}

		// In controlled mode, we trust that disabling tabs is done
		// intentionally, and don't select a new tab automatically.
		if ( isControlled ) {
			setSelectedId( null );
			return;
		}

		// If the currently selected tab becomes disabled, fall back to the
		// `defaultTabId` if possible. Otherwise select the first
		// enabled tab (if there is one).
		if ( initialTab && ! initialTab.dimmed ) {
			setSelectedId( initialTab.id );
			return;
		}

		if ( firstEnabledTab ) {
			setSelectedId( firstEnabledTab.id );
		}
	}, [
		firstEnabledTab,
		initialTab,
		isControlled,
		selectedTab?.dimmed,
		setSelectedId,
	] );

	// Clear `selectedId` if the active tab is removed from the DOM in controlled mode.
	useLayoutEffect( () => {
		if ( ! isControlled ) {
			return;
		}

		// Once the tabs have populated, if the `selectedTabId` still can't be
		// found, clear the selection.
		if ( tabsHavePopulated.current && !! selectedTabId && ! selectedTab ) {
			setSelectedId( null );
		}
	}, [ isControlled, selectedTab, selectedTabId, setSelectedId ] );

	useEffect( () => {
		// If there is no active tab, fallback to place focus on the first enabled tab
		// so there is always an active element
		if ( selectedTabId === null && ! activeId && firstEnabledTab?.id ) {
			setActiveId( firstEnabledTab.id );
		}
	}, [ selectedTabId, activeId, firstEnabledTab?.id, setActiveId ] );

	useEffect( () => {
		if ( ! isControlled ) {
			return;
		}

		requestAnimationFrame( () => {
			const focusedElement =
				items?.[ 0 ]?.element?.ownerDocument.activeElement;

			if (
				! focusedElement ||
				! items.some( ( item ) => focusedElement === item.element )
			) {
				return; // Return early if no tabs are focused.
			}

			// If, after ariakit re-computes the active tab, that tab doesn't match
			// the currently focused tab, then we force an update to ariakit to avoid
			// any mismatches, especially when navigating to previous/next tab with
			// arrow keys.
			if ( activeId !== focusedElement.id ) {
				setActiveId( focusedElement.id );
			}
		} );
	}, [ activeId, isControlled, items, setActiveId ] );

	const contextValue = useMemo(
		() => ( {
			store,
			instanceId,
		} ),
		[ store, instanceId ]
	);

	return (
		<TabsContext.Provider value={ contextValue }>
			{ children }
		</TabsContext.Provider>
	);
}

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;
Tabs.Context = TabsContext;

export default Tabs;
