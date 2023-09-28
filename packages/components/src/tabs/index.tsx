/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { useEffect, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabsProps } from './types';
import { TabsContext } from './context';
import Tab from './tab';
import TabList from './tablist';
import TabPanel from './tabpanel';

function Tabs( {
	selectOnMove = true,
	initialTabId,
	orientation = 'horizontal',
	onSelect,
	children,
	selectedTabId,
}: TabsProps ) {
	const instanceId = useInstanceId( Tabs, 'tabs' );
	const store = Ariakit.useTabStore( {
		selectOnMove,
		orientation,
		defaultSelectedId: initialTabId && `${ instanceId }-${ initialTabId }`,
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

	const { items, selectedId } = store.useState();
	const { setSelectedId } = store;

	const selectedTab = items.find( ( item ) => item.id === selectedId );
	const firstEnabledTab = items.find( ( item ) => {
		// Ariakit internally refers to disabled tabs as `dimmed`.
		return ! item.dimmed;
	} );
	const initialTab = items.find(
		( item ) => item.id === `${ instanceId }-${ initialTabId }`
	);

	// Handle selecting the initial tab.
	useLayoutEffect( () => {
		if ( isControlled ) {
			return;
		}

		// Wait for the denoted initial tab to be declared before making a
		// selection. This ensures that if a tab is declared lazily it can
		// still receive initial selection, as well as ensuring no tab is
		// selected if an invalid `initialTabId` is provided.
		if ( initialTabId && ! initialTab ) {
			return;
		}

		// If the currently selected tab is missing (i.e. removed from the DOM),
		// fall back to the initial tab or the first enabled tab.
		if ( ! items.find( ( item ) => item.id === selectedId ) ) {
			if ( initialTab && ! initialTab.dimmed ) {
				setSelectedId( initialTab?.id );
			} else {
				setSelectedId( firstEnabledTab?.id );
			}
		}
	}, [
		firstEnabledTab?.id,
		initialTab,
		initialTabId,
		isControlled,
		items,
		selectedId,
		setSelectedId,
	] );

	// Handle the currently selected tab becoming disabled.
	useEffect( () => {
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
		// `initialTabId` if possible. Otherwise select the first
		// enabled tab (if there is one).

		if ( initialTab && ! initialTab.dimmed ) {
			setSelectedId( initialTab?.id );
			return;
		}

		if ( firstEnabledTab ) {
			setSelectedId( firstEnabledTab?.id );
		}
	}, [
		firstEnabledTab,
		initialTab,
		isControlled,
		selectedTab?.dimmed,
		setSelectedId,
	] );

	const previousSelectedId = usePrevious( selectedId );
	// Clear `selectedId` if the active tab is removed from the DOM in controlled mode.
	useEffect( () => {
		if ( ! isControlled ) {
			return;
		}

		// If there was a previously selected tab (i.e. not 'undefined' as on the
		// first render), and the `selectedTabId` can't be found, clear the
		// selection.
		if ( !! previousSelectedId && !! selectedTabId && ! selectedTab ) {
			setSelectedId( null );
		}
	}, [
		isControlled,
		previousSelectedId,
		selectedId,
		selectedTab,
		selectedTabId,
		setSelectedId,
	] );

	return (
		<TabsContext.Provider value={ { store, instanceId } }>
			{ children }
		</TabsContext.Provider>
	);
}

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;
export default Tabs;
