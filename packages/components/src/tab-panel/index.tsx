/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';
import Button from '../button';
import type { TabButtonProps, TabPanelProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

const TabButton = ( {
	tabId,
	children,
	selected,
	...rest
}: TabButtonProps ) => (
	<Button
		role="tab"
		tabIndex={ selected ? undefined : -1 }
		aria-selected={ selected }
		id={ tabId }
		__experimentalIsFocusable
		{ ...rest }
	>
		{ children }
	</Button>
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
export function TabPanel( {
	className,
	children,
	tabs,
	selectOnMove = true,
	initialTabName,
	orientation = 'horizontal',
	activeClass = 'is-active',
	onSelect,
}: WordPressComponentProps< TabPanelProps, 'div', false > ) {
	const instanceId = useInstanceId( TabPanel, 'tab-panel' );
	const [ selected, setSelected ] = useState< string >();

	const handleTabSelection = useCallback(
		( tabKey: string ) => {
			setSelected( tabKey );
			onSelect?.( tabKey );
		},
		[ onSelect ]
	);

	// Simulate a click on the newly focused tab, which causes the component
	// to show the `tab-panel` associated with the clicked tab.
	const activateTabAutomatically = (
		_childIndex: number,
		child: HTMLButtonElement
	) => {
		child.click();
	};
	const selectedTab = tabs.find( ( { name } ) => name === selected );
	const selectedId = `${ instanceId }-${ selectedTab?.name ?? 'none' }`;

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
			handleTabSelection( firstEnabledTab.name );
		}
	}, [ tabs, selectedTab?.disabled, handleTabSelection ] );

	return (
		<div className={ className }>
			<NavigableMenu
				role="tablist"
				orientation={ orientation }
				onNavigate={
					selectOnMove ? activateTabAutomatically : undefined
				}
				className="components-tab-panel__tabs"
			>
				{ tabs.map( ( tab ) => (
					<TabButton
						className={ classnames(
							'components-tab-panel__tabs-item',
							tab.className,
							{
								[ activeClass ]: tab.name === selected,
							}
						) }
						tabId={ `${ instanceId }-${ tab.name }` }
						aria-controls={ `${ instanceId }-${ tab.name }-view` }
						selected={ tab.name === selected }
						key={ tab.name }
						onClick={ () => handleTabSelection( tab.name ) }
						disabled={ tab.disabled }
						label={ tab.icon && tab.title }
						icon={ tab.icon }
						showTooltip={ !! tab.icon }
					>
						{ ! tab.icon && tab.title }
					</TabButton>
				) ) }
			</NavigableMenu>
			{ selectedTab && (
				<div
					key={ selectedId }
					aria-labelledby={ selectedId }
					role="tabpanel"
					id={ `${ selectedId }-view` }
					className="components-tab-panel__tab-content"
				>
					{ children( selectedTab ) }
				</div>
			) }
		</div>
	);
}

export default TabPanel;
