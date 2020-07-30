/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '../';
import NavigationBackButton from '../back-button';
import NavigationPane from '../pane';
import NavigationMenu from '../menu';
import NavigationTitle from '../title';
import NavigationMenuItem from '../menu-item';

export default {
	title: 'Components/Navigation',
	component: Navigation,
};

const data = [
	{ title: 'Home', id: 'home' },
	{
		title: 'Analytics',
		id: 'analytics',
	},
	{
		title: 'Orders',
		id: 'orders',
	},
	{
		title: 'Overview',
		id: 'overview',
		parent: 'analytics',
	},
	{
		title: 'Products report',
		id: 'products',
		parent: 'analytics',
	},
	{
		title: 'All orders',
		id: 'all_orders',
		parent: 'orders',
	},
	{
		title: 'Payouts',
		id: 'payouts',
		parent: 'orders',
	},
	{
		title: 'Settings',
		id: 'settings',
		menu: 'secondary',
	},
	{
		title: 'Extensions',
		id: 'extensions',
		menu: 'secondary',
	},
	{
		title: 'General',
		id: 'general',
		parent: 'settings',
	},
	{
		title: 'Tax',
		id: 'tax',
		parent: 'settings',
	},
	{
		title: 'My extensions',
		id: 'my_extensions',
		parent: 'extensions',
	},
	{
		title: 'Marketplace',
		id: 'marketplace',
		parent: 'extensions',
	},
];

function Example() {
	const [ active, setActive ] = useState( 'home' );

	return (
		<Navigation
			activeId={ active }
			items={ data }
			rootTitle="WooCommerce Home"
		>
			{ ( { currentItems, currentLevel, parentItems, parentLevel } ) => {
				return (
					<NavigationPane>
						<NavigationBackButton
							onClick={ () =>
								parentLevel
									? setActive( parentItems[ 0 ].id )
									: ( window.location =
											'https://wordpress.com' )
							}
						>
							{ ! parentLevel ? 'Dashboard' : parentLevel.title }
						</NavigationBackButton>
						<NavigationTitle>
							{ currentLevel.id === 'root'
								? 'WooCommerce'
								: currentLevel.title }
						</NavigationTitle>
						<NavigationMenu>
							{ currentItems
								.filter( ( item ) => item.menu !== 'secondary' )
								.map( ( item ) => (
									<NavigationMenuItem
										hasChildren={ item.children.length > 0 }
										isActive={ item.id === active }
										key={ item.id }
										onClick={ () =>
											item.children.length
												? setActive(
														item.children[ 0 ].id
												  )
												: setActive( item.id )
										}
									>
										{ item.title }
									</NavigationMenuItem>
								) ) }
						</NavigationMenu>
						<br />
						<NavigationMenu>
							{ currentItems
								.filter( ( item ) => item.menu === 'secondary' )
								.map( ( item ) => (
									<NavigationMenuItem
										hasChildren={ item.children.length > 0 }
										isActive={ item.id === active }
										key={ item.id }
										onClick={ () =>
											item.children.length
												? setActive(
														item.children[ 0 ].id
												  )
												: setActive( item.id )
										}
									>
										{ item.title }
									</NavigationMenuItem>
								) ) }
						</NavigationMenu>
					</NavigationPane>
				);
			} }
		</Navigation>
	);
}

export const _default = () => {
	return <Example />;
};
