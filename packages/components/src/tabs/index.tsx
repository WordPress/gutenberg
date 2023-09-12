/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	TabListProps,
	TabPanelProps,
	TabProps,
	TabsContextProps,
	TabsProps,
} from './types';
import Button from '../button';
import warning from '@wordpress/warning';

const TabsContext = createContext< TabsContextProps >( undefined );

/**
 * Tabs is a collection of React components that combine to render an
 * ARIA-compliant TabPanel.
 *
 * Tabs organizes content across different screens, data sets, and interactions.
 * It has two sections: a list of tabs, and the view to show when tabs are chosen.
 *
 * ```jsx
 * import { Tabs } from '@wordpress/components';
 *
 * const onSelect = ( tabName ) => {
 * 	console.log( 'Selecting tab', tabName );
 * };
 *
 * const MyUncontrolledTabs = () => (
 * 		<Tabs onSelect={onSelect} initialTab="tab2">
 * 			<Tabs.TabList >
 * 				<Tabs.Tab id={ 'tab1' } title={ 'Tab 1' }>
 * 					Tab 1
 * 				</Tabs.Tab>
 * 				<Tabs.Tab id={ 'tab2' } title={ 'Tab 2' }>
 * 					Tab 2
 * 				</Tabs.Tab>
 * 				<Tabs.Tab id={ 'tab3' } title={ 'Tab 3' }>
 * 					Tab 3
 * 				</Tabs.Tab>
 * 			</Tabs.TabList>
 * 			<Tabs.TabPanel id={ 'tab1' }>
 * 				<p>Selected tab: Tab 1</p>
 * 			</Tabs.TabPanel>
 * 			<Tabs.TabPanel id={ 'tab2' }>
 * 				<p>Selected tab: Tab 2</p>
 * 			</Tabs.TabPanel>
 * 			<Tabs.TabPanel id={ 'tab3' }>
 * 				<p>Selected tab: Tab 3</p>
 * 			</Tabs.TabPanel>
 * 		</Tabs>
 * 	);
 * ```
 *
 */

function Tabs( {
	activeClass = 'is-active',
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

	// Handle selecting the initial tab.
	useLayoutEffect( () => {
		if ( isControlled ) {
			return;
		}

		const initialTab = items.find(
			( item ) => item.id === `${ instanceId }-${ initialTabId }`
		);

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
		initialTabId,
		instanceId,
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

		// If the currently selected tab becomes disabled, select the first
		// enabled tab (if there is one).
		if ( firstEnabledTab ) {
			setSelectedId( firstEnabledTab?.id );
		}
	}, [ firstEnabledTab, isControlled, selectedTab?.dimmed, setSelectedId ] );

	return (
		<TabsContext.Provider value={ { store, instanceId, activeClass } }>
			{ children }
		</TabsContext.Provider>
	);
}

function TabList( { children, className, style }: TabListProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store } = context;
	return (
		<Ariakit.TabList
			style={ style }
			store={ store }
			className={ classnames( 'components-tabs__tabs-item', className ) }
		>
			{ children }
		</Ariakit.TabList>
	);
}

function Tab( {
	children,
	id,
	className,
	disabled,
	icon,
	title,
	style,
}: TabProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId, activeClass } = context;
	const instancedTabId = `${ instanceId }-${ id }`;
	return (
		<Ariakit.Tab
			store={ store }
			id={ instancedTabId }
			className={ classnames( 'components-tabs__tabs-item', className, {
				[ activeClass ]: instancedTabId === store.useState().activeId,
			} ) }
			style={ style }
			disabled={ disabled }
			render={
				<Button
					icon={ icon }
					label={ icon && title }
					showTooltip={ true }
				/>
			}
		>
			{ children }
		</Ariakit.Tab>
	);
}

function TabPanel( { children, id, className, style }: TabPanelProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;

	return (
		<Ariakit.TabPanel
			style={ style }
			store={ store }
			id={ `${ instanceId }-${ id }-view` }
			className={ classnames(
				'components-tabs__tab-content',
				className
			) }
		>
			{ children }
		</Ariakit.TabPanel>
	);
}

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;
export default Tabs;
