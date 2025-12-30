/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import Button from '../button';
import type { TabPanelProps } from './types';
import type { WordPressComponentProps } from '../context';

// Separate the actual tab name from the instance ID. This is
// necessary because Ariakit internally uses the element ID when
// a new tab is selected, but our implementation looks specifically
// for the tab name to be passed to the `onSelect` callback.
const extractTabName = ( id: string | undefined | null ) => {
	if ( typeof id === 'undefined' || id === null ) {
		return;
	}
	return id.match( /^tab-panel-[0-9]*-(.*)/ )?.[ 1 ];
};

/**
 * TabPanel is an ARIA-compliant tabpanel.
 *
 * TabPanels organize content across different screens, data sets, and interactions.
 * It has two sections: a list of tabs, and the view to show when tabs are chosen.
 *
 * ```jsx
 * import { TabPanel } from '@wordpress/components';
 *
 * const onSelect = ( tabName ) => {
 *   console.log( 'Selecting tab', tabName );
 * };
 *
 * const MyTabPanel = () => (
 *   <TabPanel
 *     className="my-tab-panel"
 *     activeClass="active-tab"
 *     onSelect={ onSelect }
 *     tabs={ [
 *       {
 *         name: 'tab1',
 *         title: 'Tab 1',
 *         className: 'tab-one',
 *       },
 *       {
 *         name: 'tab2',
 *         title: 'Tab 2',
 *         className: 'tab-two',
 *       },
 *     ] }
 *   >
 *     { ( tab ) => <p>{ tab.title }</p> }
 *   </TabPanel>
 * );
 * ```
 */
const UnforwardedTabPanel = (
	{
		className,
		children,
		tabs,
		selectOnMove = true,
		initialTabName,
		orientation = 'horizontal',
		activeClass = 'is-active',
		onSelect,
	}: WordPressComponentProps< TabPanelProps, 'div', false >,
	ref: ForwardedRef< any >
) => {
	const instanceId = useInstanceId( TabPanel, 'tab-panel' );

	const prependInstanceId = useCallback(
		( tabName: string | undefined ) => {
			if ( typeof tabName === 'undefined' ) {
				return;
			}
			return `${ instanceId }-${ tabName }`;
		},
		[ instanceId ]
	);

	const tabStore = Ariakit.useTabStore( {
		setSelectedId: ( newTabValue ) => {
			if ( typeof newTabValue === 'undefined' || newTabValue === null ) {
				return;
			}

			const newTab = tabs.find(
				( t ) => prependInstanceId( t.name ) === newTabValue
			);
			if ( newTab?.disabled || newTab === selectedTab ) {
				return;
			}

			const simplifiedTabName = extractTabName( newTabValue );
			if ( typeof simplifiedTabName === 'undefined' ) {
				return;
			}

			onSelect?.( simplifiedTabName );
		},
		orientation,
		selectOnMove,
		defaultSelectedId: prependInstanceId( initialTabName ),
		rtl: isRTL(),
	} );

	const selectedTabName = extractTabName(
		Ariakit.useStoreState( tabStore, 'selectedId' )
	);

	const setTabStoreSelectedId = useCallback(
		( tabName: string ) => {
			tabStore.setState( 'selectedId', prependInstanceId( tabName ) );
		},
		[ prependInstanceId, tabStore ]
	);

	const selectedTab = tabs.find( ( { name } ) => name === selectedTabName );

	const previousSelectedTabName = usePrevious( selectedTabName );

	// Ensure `onSelect` is called when the initial tab is selected.
	useEffect( () => {
		if (
			previousSelectedTabName !== selectedTabName &&
			selectedTabName === initialTabName &&
			!! selectedTabName
		) {
			onSelect?.( selectedTabName );
		}
	}, [ selectedTabName, initialTabName, onSelect, previousSelectedTabName ] );

	// Handle selecting the initial tab.
	useLayoutEffect( () => {
		// If there's a selected tab, don't override it.
		if ( selectedTab ) {
			return;
		}
		const initialTab = tabs.find( ( tab ) => tab.name === initialTabName );
		// Wait for the denoted initial tab to be declared before making a
		// selection. This ensures that if a tab is declared lazily it can
		// still receive initial selection.
		if ( initialTabName && ! initialTab ) {
			return;
		}
		if ( initialTab && ! initialTab.disabled ) {
			// Select the initial tab if it's not disabled.
			setTabStoreSelectedId( initialTab.name );
		} else {
			// Fallback to the first enabled tab when the initial tab is
			// disabled or it can't be found.
			const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );
			if ( firstEnabledTab ) {
				setTabStoreSelectedId( firstEnabledTab.name );
			}
		}
	}, [
		tabs,
		selectedTab,
		initialTabName,
		instanceId,
		setTabStoreSelectedId,
	] );

	// Handle the currently selected tab becoming disabled.
	useEffect( () => {
		// This effect only runs when the selected tab is defined and becomes disabled.
		if ( ! selectedTab?.disabled ) {
			return;
		}
		const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );
		// If the currently selected tab becomes disabled, select the first enabled tab.
		// (if there is one).
		if ( firstEnabledTab ) {
			setTabStoreSelectedId( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab?.disabled, setTabStoreSelectedId, instanceId ] );
	return (
		<div className={ className } ref={ ref }>
			<Ariakit.TabList
				store={ tabStore }
				className="components-tab-panel__tabs"
			>
				{ tabs.map( ( tab ) => {
					return (
						<Ariakit.Tab
							key={ tab.name }
							id={ prependInstanceId( tab.name ) }
							className={ clsx(
								'components-tab-panel__tabs-item',
								tab.className,
								{
									[ activeClass ]:
										tab.name === selectedTabName,
								}
							) }
							disabled={ tab.disabled }
							aria-controls={ `${ prependInstanceId(
								tab.name
							) }-view` }
							render={
								<Button
									__next40pxDefaultSize
									icon={ tab.icon }
									label={ tab.icon && tab.title }
									showTooltip={ !! tab.icon }
								/>
							}
						>
							{ ! tab.icon && tab.title }
						</Ariakit.Tab>
					);
				} ) }
			</Ariakit.TabList>
			{ selectedTab && (
				<Ariakit.TabPanel
					id={ `${ prependInstanceId( selectedTab.name ) }-view` }
					store={ tabStore }
					tabId={ prependInstanceId( selectedTab.name ) }
					className="components-tab-panel__tab-content"
				>
					{ children( selectedTab ) }
				</Ariakit.TabPanel>
			) }
		</div>
	);
};

export const TabPanel = forwardRef( UnforwardedTabPanel );
export default TabPanel;
