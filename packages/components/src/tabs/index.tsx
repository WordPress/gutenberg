/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import cx from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { TabPanelProps } from '../tab-panel/types';
import { usePrevious } from '@wordpress/compose';

/**
 * Tabs is an ARIA-compliant tabpanel.
 *
 * Tabs organizes content across different screens, data sets, and interactions.
 * It has two sections: a list of tabs, and the view to show when tabs are chosen.
 *
 * ```jsx
 * import { Tabs } from '@wordpress/components';
 *
 * const onSelect = ( tabName ) => {
 *   console.log( 'Selecting tab', tabName );
 * };
 *
 * const MyTabs = () => (
 *   <Tabs
 *     className="my-tabs"
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
 *   </Tabs>
 * );
 * ```
 */

export const Tabs = ( props: TabPanelProps ) => {
	const {
		tabs,
		children,
		onSelect,
		className,
		orientation = 'horizontal',
		selectOnMove = true,
		initialTabName,
		activeClass = 'is-active',
	} = props;

	const tabStore = Ariakit.useTabStore( {
		setSelectedId: ( newTabValue ) => {
			if ( typeof newTabValue === 'undefined' || newTabValue === null ) {
				return;
			}

			const newTab = tabs.find( ( t ) => t.name === newTabValue );
			if ( newTab?.disabled || newTab === selectedTab ) {
				return;
			}

			onSelect?.( newTabValue );
		},
		orientation,
		selectOnMove,
		defaultSelectedId: initialTabName,
	} );

	const selectedTabName = tabStore.useState( 'selectedId' );
	const setTabStoreState = tabStore.setState;

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
			setTabStoreState( 'selectedId', initialTab.name );
		} else {
			// Fallback to the first enabled tab when the initial tab is
			// disabled or it can't be found.
			const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );
			if ( firstEnabledTab ) {
				setTabStoreState( 'selectedId', firstEnabledTab.name );
			}
		}
	}, [ tabs, selectedTab, initialTabName, setTabStoreState ] );

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
			setTabStoreState( 'selectedId', firstEnabledTab.name );
		}
	}, [ tabs, selectedTab?.disabled, setTabStoreState ] );

	return (
		<div className={ className }>
			<Ariakit.TabList store={ tabStore }>
				{ tabs.map( ( tab ) => {
					return (
						<Ariakit.Tab
							key={ tab.name }
							id={ tab.name }
							className={ cx(
								'components-tab-panel__tabs-item',
								tab.className,
								{
									[ activeClass ]:
										tab.name === selectedTabName,
								}
							) }
							disabled={ tab.disabled }
							render={
								<Button
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
			{ tabs.map( ( tab ) => (
				<Ariakit.TabPanel
					store={ tabStore }
					key={ tab.name }
					tabId={ tab.name }
					className={ 'components-tab-panel__tab-content' }
				>
					{ children( tab ) }
				</Ariakit.TabPanel>
			) ) }
		</div>
	);
};

export default Tabs;
