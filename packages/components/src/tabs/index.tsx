/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { useStoreState } from '@ariakit/react';

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
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { TabsProps } from './types';
import { TabsContext } from './context';
import { Tab } from './tab';
import { TabList } from './tablist';
import { TabPanel } from './tabpanel';

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
	}: TabsProps ) {
		const instanceId = useInstanceId( Tabs, 'tabs' );
		const store = Ariakit.useTabStore( {
			selectOnMove,
			orientation,
			defaultSelectedId:
				defaultTabId && `${ instanceId }-${ defaultTabId }`,
			setSelectedId: ( selectedId ) => {
				const strippedDownId =
					typeof selectedId === 'string'
						? selectedId.replace( `${ instanceId }-`, '' )
						: selectedId;
				onSelect?.( strippedDownId );
			},
			selectedId: selectedTabId && `${ instanceId }-${ selectedTabId }`,
			rtl: isRTL(),
		} );

		const isControlled = selectedTabId !== undefined;

		const { items, selectedId, activeId } = useStoreState( store );
		const { setSelectedId, setActiveId } = store;

		// Keep track of whether tabs have been populated. This is used to prevent
		// certain effects from firing too early while tab data and relevant
		// variables are undefined during the initial render.
		const tabsHavePopulatedRef = useRef( false );
		if ( items.length > 0 ) {
			tabsHavePopulatedRef.current = true;
		}

		const selectedTab = items.find( ( item ) => item.id === selectedId );
		const firstEnabledTab = items.find( ( item ) => {
			// Ariakit internally refers to disabled tabs as `dimmed`.
			return ! item.dimmed;
		} );

		// Clear `selectedId` if the active tab is removed from the DOM in controlled mode.
		useLayoutEffect( () => {
			if ( ! isControlled ) {
				return;
			}

			// Once the tabs have populated, if the `selectedTabId` still can't be
			// found, clear the selection.
			if (
				tabsHavePopulatedRef.current &&
				!! selectedTabId &&
				! selectedTab
			) {
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
