/**
 * External dependencies
 */
import classnames from 'classnames';
import { partial, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';
import Button from '../button';
import type { TabButtonProps, TabPanelProps } from './types';
import { contextConnect, WordPressComponentProps } from '../ui/context';
import type { ForwardedRef } from 'react';

const TabButton = ( {
	tabId,
	onClick,
	children,
	selected,
	...rest
}: TabButtonProps ) => (
	<Button
		role="tab"
		tabIndex={ selected ? null : -1 }
		aria-selected={ selected }
		id={ tabId }
		onClick={ onClick }
		{ ...rest }
	>
		{ children }
	</Button>
);

function UnconnectedTabPanel(
	{
		className,
		children,
		tabs,
		initialTabName,
		orientation = 'horizontal',
		activeClass = 'is-active',
		onSelect,
	}: WordPressComponentProps< TabPanelProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const instanceId = useInstanceId( TabPanel, 'tab-panel' );
	const [ selected, setSelected ] = useState< string >();

	const handleClick = ( tabKey: string ) => {
		setSelected( tabKey );
		onSelect?.( tabKey );
	};

	const onNavigate = ( _childIndex: number, child: HTMLButtonElement ) => {
		child.click();
	};
	const selectedTab = find( tabs, { name: selected } );
	const selectedId = `${ instanceId }-${ selectedTab?.name ?? 'none' }`;

	useEffect( () => {
		const newSelectedTab = find( tabs, { name: selected } );
		if ( ! newSelectedTab ) {
			setSelected(
				initialTabName ||
					( tabs.length > 0 ? tabs[ 0 ].name : undefined )
			);
		}
	}, [ tabs ] );

	return (
		<div className={ className }>
			<NavigableMenu
				ref={ forwardedRef }
				role="tablist"
				orientation={ orientation }
				onNavigate={ onNavigate }
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
						onClick={ partial( handleClick, tab.name ) }
					>
						{ tab.title }
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
export const TabPanel = contextConnect( UnconnectedTabPanel, 'TabPanel' );

export default TabPanel;
