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
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { TabPanelProps } from '../tab-panel/types';

type Tab = TabPanelProps[ 'tabs' ][ number ];

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

const getTab = (
	tabs: TabPanelProps[ 'tabs' ],
	currentTab: Tab,
	offset: 1 | -1
) => {
	const currentIndex = tabs.indexOf( currentTab );
	if ( currentIndex === -1 ) {
		return;
	}
	const nextIndex = ( tabs.length + currentIndex + offset ) % tabs.length;

	return tabs[ nextIndex ];
};
const getNextTab = ( tabs: TabPanelProps[ 'tabs' ], currentTab: Tab ) => {
	return getTab( tabs, currentTab, 1 );
};
const getPreviousTab = ( tabs: TabPanelProps[ 'tabs' ], currentTab: Tab ) => {
	return getTab( tabs, currentTab, -1 );
};

const keyToGetTab: Record< string, typeof getPreviousTab | typeof getNextTab > =
	{
		ArrowLeft: getPreviousTab,
		ArrowUp: getPreviousTab,
		ArrowRight: getNextTab,
		ArrowDown: getNextTab,
	};

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

	const [ selectedTabName, setSelectedTabName ] = useState< string >();

	const selectedTab = tabs.find( ( { name } ) => name === selectedTabName );

	const selectTab = useCallback(
		( tabValue: string ) => {
			const newTab = tabs.find( ( t ) => t.name === tabValue );
			if ( newTab?.disabled || newTab === selectedTab ) {
				return;
			}

			setSelectedTabName( tabValue );
			onSelect?.( tabValue );
		},
		[ onSelect, tabs, selectedTab ]
	);

	const nextTabToBeAutomaticallyActivated = useRef< Tab >();

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
			activationMode={ 'manual' }
		>
			<RadixTabs.TabsList
				className={ 'components-tab-panel__tabs' }
				tabIndex={ undefined }
			>
				{ tabs.map( ( tab ) => (
					<RadixTabs.Trigger
						key={ tab.name }
						value={ tab.name }
						className={ cx(
							'components-tab-panel__tabs-item',
							tab.className,
							{ [ activeClass ]: tab.name === selectedTabName }
						) }
						tabIndex={
							selectedTab?.name === tab.name ? undefined : -1
						}
						asChild
						onKeyDown={ ( event ) => {
							const getTabFunction = keyToGetTab[ event.key ];

							if ( ! getTabFunction ) {
								nextTabToBeAutomaticallyActivated.current =
									undefined;
								return;
							}

							nextTabToBeAutomaticallyActivated.current =
								getTabFunction( tabs, tab );
						} }
						onFocus={ () => {
							if (
								selectOnMove &&
								tab ===
									nextTabToBeAutomaticallyActivated.current
							) {
								selectTab(
									nextTabToBeAutomaticallyActivated.current
										.name
								);
								nextTabToBeAutomaticallyActivated.current =
									undefined;
							}
						} }
						{ ...( tab.disabled ? disabledTabProps : null ) }
					>
						<Button
							icon={ tab.icon }
							label={ tab.icon && tab.title }
							showTooltip={ !! tab.icon }
						>
							{ ! tab.icon && tab.title }
						</Button>
					</RadixTabs.Trigger>
				) ) }
			</RadixTabs.TabsList>
			{ tabs.map( ( tab ) => (
				<RadixTabs.Content
					key={ tab.name }
					className={ 'components-tab-panel__tab-content' }
					value={ tab.name }
					tabIndex={ undefined }
				>
					{ children( tab ) }
				</RadixTabs.Content>
			) ) }
		</RadixTabs.Root>
	);
};

export default Tabs;
