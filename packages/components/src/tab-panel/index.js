/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';
import Button from '../button';

const TabButton = ( { tabId, onClick, children, selected, ...rest } ) => (
	<Button role="tab"
		tabIndex={ selected ? null : -1 }
		aria-selected={ selected }
		id={ tabId }
		onClick={ onClick }
		{ ...rest }
	>
		{ children }
	</Button>
);

const TabPanel = ( { tabs, initialTabName, controlledTabName, className, onSelect = noop, activeClass = 'is-active', orientation = 'horizontal', instanceId, children } ) => {
	const [ selectedTabName, setSelectedTabName ] = useState( initialTabName || controlledTabName || tabs[ 0 ].name );
	const selectedTab = find( tabs, { name: selectedTabName } );
	const selectedId = selectedTab ? instanceId + '-' + selectedTab.name : '';

	const onClick = ( tabName ) => {
		setSelectedTabName( tabName );
		onSelect( tabName );
	};

	const onNavigate = ( childIndex, child ) => {
		child.click();
	};

	useEffect(
		() => {
			if ( controlledTabName ) {
				setSelectedTabName( controlledTabName );
			}
		}, [ controlledTabName ]
	);

	return (
		<div className={ className }>
			<NavigableMenu
				role="tablist"
				orientation={ orientation }
				onNavigate={ onNavigate }
				className="components-tab-panel__tabs"
			>
				{ tabs.map( ( tab ) => (
					<TabButton className={ classnames( 'components-tab-panel__tabs-item', tab.className, { [ activeClass ]: tab.name === selectedTabName } ) }
						tabId={ instanceId + '-' + tab.name }
						aria-controls={ instanceId + '-' + tab.name + '-view' }
						aria-label={ tab.ariaLabel }
						selected={ tab.name === selectedTabName }
						key={ tab.name }
						onClick={ () => onClick( tab.name ) }
					>
						{ tab.title }
					</TabButton>
				) ) }
			</NavigableMenu>
			{ children && selectedTab && (
				<div aria-labelledby={ selectedId }
					role="tabpanel"
					id={ selectedId + '-view' }
					className="components-tab-panel__tab-content"
					tabIndex="0"
				>
					{ children( selectedTab ) }
				</div>
			) }
		</div>
	);
};

export default withInstanceId( TabPanel );
