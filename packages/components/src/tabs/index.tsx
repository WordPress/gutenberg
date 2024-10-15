/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { TabsProps } from './types';
import { TabsContext } from './context';
import { Tab } from './tab';
import { TabList } from './tablist';
import { TabPanel } from './tabpanel';

function externalToInternalTabId(
	externalId: string | undefined | null,
	instanceId: string
) {
	return externalId && `${ instanceId }-${ externalId }`;
}

function internalToExternalTabId(
	internalId: string | undefined | null,
	instanceId: string
) {
	return typeof internalId === 'string'
		? internalId.replace( `${ instanceId }-`, '' )
		: internalId;
}

/**
 * Display one panel of content at a time with a tabbed interface, based on the
 * WAI-ARIA Tabs Pattern⁠.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 * ```
 */
export const Tabs = Object.assign(
	function Tabs( {
		selectOnMove = true,
		defaultTabId,
		orientation = 'horizontal',
		onSelect,
		children,
		selectedTabId,
		activeTabId,
		defaultActiveTabId,
		onActiveTabIdChange,
	}: TabsProps ) {
		const instanceId = useInstanceId( Tabs, 'tabs' );
		const store = Ariakit.useTabStore( {
			selectOnMove,
			orientation,
			defaultSelectedId: externalToInternalTabId(
				defaultTabId,
				instanceId
			),
			setSelectedId: ( newSelectedId ) => {
				onSelect?.(
					internalToExternalTabId( newSelectedId, instanceId )
				);
			},
			selectedId: externalToInternalTabId( selectedTabId, instanceId ),
			defaultActiveId: externalToInternalTabId(
				defaultActiveTabId,
				instanceId
			),
			setActiveId: ( newActiveId ) => {
				onActiveTabIdChange?.(
					internalToExternalTabId( newActiveId, instanceId )
				);
			},
			activeId: externalToInternalTabId( activeTabId, instanceId ),
			rtl: isRTL(),
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
	},
	{
		Tab: Object.assign( Tab, {
			displayName: 'Tabs.Tab',
		} ),
		TabList: Object.assign( TabList, {
			displayName: 'Tabs.TabList',
		} ),
		TabPanel: Object.assign( TabPanel, {
			displayName: 'Tabs.TabPanel',
		} ),
		Context: Object.assign( TabsContext, {
			displayName: 'Tabs.Context',
		} ),
	}
);
