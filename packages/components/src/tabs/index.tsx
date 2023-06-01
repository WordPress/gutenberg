/**
 * External dependencies
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import cx from 'classnames';

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
import Button from '../button';
import type {
	TabsProps,
	TabProps,
	TabsListProps,
	TabPanelProps,
} from './types';
import type { TabPanelProps as LegacyTabPanelProps } from '../tab-panel/types';

export const TabsList = ( { className, children }: TabsListProps ) => (
	<RadixTabs.TabsList
		className={ cx( 'components-tabs__tabs-list', className ) }
	>
		{ children }
	</RadixTabs.TabsList>
);

export const Tab = ( {
	value,
	title,
	disabled = false,
	className,
	children,
	icon,
}: TabProps ) => (
	<RadixTabs.Trigger
		value={ value }
		disabled={ disabled }
		className={ cx( 'components-tabs__tab', className ) }
		asChild
	>
		<Button
			icon={ icon }
			label={ icon && title }
			showTooltip={ !! icon }
			disabled={ disabled }
			__experimentalIsFocusable
		>
			{ ! icon && children }
		</Button>
	</RadixTabs.Trigger>
);

export const TabPanel = ( { value, className, children }: TabPanelProps ) => (
	<RadixTabs.Content className={ className } value={ value }>
		{ children }
	</RadixTabs.Content>
);

export function Tabs( {
	defaultValue,
	value,
	onValueChange,
	className,
	children,
	orientation = 'horizontal',
}: TabsProps ) {
	return (
		<RadixTabs.Root
			defaultValue={ defaultValue }
			value={ value }
			onValueChange={ onValueChange }
			className={ className }
			orientation={ orientation }
		>
			{ children }
		</RadixTabs.Root>
	);
}

const TabPanelV2 = ( props: LegacyTabPanelProps ) => {
	const {
		tabs,
		children,
		onSelect,
		className,
		orientation = 'horizontal',
		selectOnMove,
		initialTabName,
		activeClass = 'is-active',
	} = props;

	const [ selected, setSelected ] = useState< string >();

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
			onValueChange={ ( value ) => onSelect?.( value ) }
			orientation={ orientation }
			defaultValue={ initialTabName }
			activationMode={ selectOnMove ? 'automatic' : 'manual' }
		>
			<TabsList>
				{ tabs.map( ( tab ) => (
					<Tab
						key={ tab.name }
						value={ tab.name }
						title={ tab.title }
						icon={ tab.icon }
						className={ cx(
							'components-tab-panel__tabs-item',
							tab.className,
							{ [ activeClass ]: tab.name === selected }
						) }
					>
						{ tab.title }
					</Tab>
				) ) }
			</TabsList>
			{ selectedTab && (
				<RadixTabs.Content value={ selectedTab.name }>
					{ children( selectedTab ) }
				</RadixTabs.Content>
			) }
			{ /* { tabs.map( ( tab ) => (
				<TabPanel key={ tab.name } value={ tab.name }>
					{ children( tab ) }
				</TabPanel>
			) ) } */ }
		</RadixTabs.Root>
	);
};

export default TabPanelV2;
