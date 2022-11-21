/**
 * External dependencies
 */
import classnames from 'classnames';
import { partial, noop, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';
import Button from '../button';

const TabButton = ( { tabId, onClick, children, selected, ...rest } ) => (
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

export default function TabPanel( {
	className,
	children,
	tabs,
	initialTabName,
	orientation = 'horizontal',
	activeClass = 'is-active',
	onSelect = noop,
} ) {
	const instanceId = useInstanceId( TabPanel, 'tab-panel' );
	const [ selected, setSelected ] = useState( null );
	const [ direction, setDirection ] = useState( null );

	const handleClick = ( tabKey ) => {
		setSelected( tabKey );
		onSelect( tabKey );
	};

	const onNavigate = ( childIndex, child ) => {
		child.click();
	};
	const onKeyDown = ( evt ) => {
		const hKey = direction === 'rtl' ? LEFT : RIGHT;
		const key = orientation === 'vertical' ? hKey : DOWN;

		if ( evt.keyCode === key ) {
			panelRef.current?.focus();
		}
	};

	const tabRef = useRef();
	const panelRef = useRef();
	const selectedTab = find( tabs, { name: selected } );
	const selectedId = `${ instanceId }-${ selectedTab?.name ?? 'none' }`;

	useEffect( () => {
		if ( tabRef.current ) {
			const dir = window.getComputedStyle( tabRef.current ).direction;

			if ( dir ) {
				setDirection( dir );
			}
		}
	}, [ tabRef ] );

	useEffect( () => {
		const newSelectedTab = find( tabs, { name: selected } );
		if ( ! newSelectedTab ) {
			setSelected(
				initialTabName || ( tabs.length > 0 ? tabs[ 0 ].name : null )
			);
		}
	}, [ tabs ] );

	return (
		<div className={ className }>
			<NavigableMenu
				role="tablist"
				orientation={ orientation }
				onNavigate={ onNavigate }
				className="components-tab-panel__tabs"
				onKeyDown={ onKeyDown }
				ref={ tabRef }
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
					tabIndex="-1"
					ref={ panelRef }
				>
					{ children( selectedTab ) }
				</div>
			) }
		</div>
	);
}
