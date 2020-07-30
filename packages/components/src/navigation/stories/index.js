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
						<NavigationMenu
							activeId={ active }
							items={ currentItems.filter(
								( item ) => item.menu !== 'secondary'
							) }
							onSelect={ ( item ) => setActive( item.id ) }
						/>
						<br />
						<NavigationMenu
							activeId={ active }
							items={ currentItems.filter(
								( item ) => item.menu === 'secondary'
							) }
							onSelect={ ( item ) => setActive( item.id ) }
						/>
					</NavigationPane>
				);
			} }
		</Navigation>
	);
}

export const _default = () => {
	return <Example />;
};
