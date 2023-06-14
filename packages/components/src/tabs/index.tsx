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

const disabledTabProps = {
	'aria-disabled': true,
	onClick: ( event: React.MouseEvent ) => {
		event.preventDefault();
		event.stopPropagation();
	},
	onMouseDown: ( event: React.MouseEvent ) => {
		event.preventDefault();
		event.stopPropagation();
	},
};

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
		className={ cx( 'components-tabs__tab', className ) }
		asChild
		{ ...( disabled ? disabledTabProps : null ) }
	>
		<Button icon={ icon } label={ icon && title } showTooltip={ !! icon }>
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
		selectOnMove = true,
		initialTabName,
		activeClass = 'is-active',
	} = props;

	const [ selectedTabName, setSelectedTabName ] = useState< string >();

	const selectTab = useCallback(
		( tabValue: string ) => {
			const newTab = tabs.find( ( t ) => t.name === tabValue );
			if ( newTab?.disabled ) {
				return;
			}

			setSelectedTabName( tabValue );
			onSelect?.( tabValue );
		},
		[ onSelect, tabs ]
	);

	const selectedTab = tabs.find( ( { name } ) => name === selectedTabName );

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
			selectTab( initialTab.name );
		} else {
			// Fallback to the first enabled tab when the initial tab is
			// disabled or it can't be found.
			const firstEnabledTab = tabs.find( ( tab ) => ! tab.disabled );
			if ( firstEnabledTab ) selectTab( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab, initialTabName, selectTab ] );

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
			selectTab( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab?.disabled, selectTab ] );

	return (
		<RadixTabs.Root
			className={ className }
			value={ selectedTab?.name }
			onValueChange={ selectTab }
			orientation={ orientation }
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
							{ [ activeClass ]: tab.name === selectedTabName }
						) }
						disabled={ tab.disabled }
					>
						{ tab.title }
					</Tab>
				) ) }
			</TabsList>
			{ tabs.map( ( tab ) => (
				<TabPanel key={ tab.name } value={ tab.name }>
					{ children( tab ) }
				</TabPanel>
			) ) }
		</RadixTabs.Root>
	);
};

export default TabPanelV2;
