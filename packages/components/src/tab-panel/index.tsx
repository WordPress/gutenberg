// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';
import * as RadixTabs from '@radix-ui/react-tabs';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabButtonProps, TabPanelProps } from './types';
import Button from '../button';

export const Tab = ( {
	value,
	disabled = false,
	children,
	...rest
}: TabButtonProps ) => (
	<RadixTabs.Trigger disabled={ disabled } value={ value } asChild>
		<Button disabled={ disabled } __experimentalIsFocusable { ...rest }>
			{ children }
		</Button>
	</RadixTabs.Trigger>
);

export const TabList = ( { children } ) => (
	<RadixTabs.TabsList className="components-tab-panel__tabs">
		{ children }
	</RadixTabs.TabsList>
);

export const TabPanel = ( { value, children } ) => (
	<RadixTabs.Content
		value={ value }
		className="components-tab-panel__tab-content"
	>
		{ children }
	</RadixTabs.Content>
);

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
export function Tabs( {
	className,
	children,
	tabs,
	selectOnMove = true,
	initialTabName,
	orientation = 'horizontal',
	activeClass = 'is-active',
	onSelect,
}: TabPanelProps ) {
	const [ selected, setSelected ] = useState< string >( initialTabName );

	const handleTabSelection = useCallback(
		( tabValue: string ) => {
			setSelected( tabValue );
			onSelect?.( tabValue );
		},
		[ onSelect ]
	);

	const selectedTab = tabs.find( ( { name } ) => name === selected );

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
			handleTabSelection( initialTab.name );
		} else {
			// Fallback to the first enabled tab when the initial is disabled.
			const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );
			if ( firstEnabledTab ) handleTabSelection( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab, initialTabName, handleTabSelection ] );

	// // Handle the currently selected tab becoming disabled.
	useEffect( () => {
		// This effect only runs when the selected tab is defined and becomes disabled.
		if ( ! selectedTab?.disabled ) {
			return;
		}

		const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );

		// If the currently selected tab becomes disabled, select the first enabled tab.
		// (if there is one).
		if ( firstEnabledTab ) {
			handleTabSelection( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab?.disabled, handleTabSelection ] );

	return (
		<RadixTabs.Root
			className={ className }
			value={ selected }
			onValueChange={ handleTabSelection }
			activationMode={ selectOnMove ? 'automatic' : 'manual' }
		>
			<TabList>
				{ tabs.map( ( tab ) => (
					<Tab
						key={ tab.name }
						value={ tab.name }
						className={ classnames(
							'components-tab-panel__tabs-item',
							tab.className,
							{ [ activeClass ]: tab.name === selected }
						) }
						disabled={ tab.disabled }
						icon={ tab.icon }
						label={ tab.icon && tab.title }
						showTooltip={ !! tab.icon }
					>
						{ ! tab.icon && tab.title }
					</Tab>
				) ) }
			</TabList>

			{ selectedTab && (
				<TabPanel value={ selectedTab.name }>
					{ children( selectedTab ) }
				</TabPanel>
			) }
		</RadixTabs.Root>
	);
}

export default Tabs;
