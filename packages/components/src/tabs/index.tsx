/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';

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

	const { items, activeId } = Ariakit.useStoreState( store );
	const { setActiveId } = store;

	useEffect( () => {
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
	}, [ activeId, items, setActiveId ] );

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
