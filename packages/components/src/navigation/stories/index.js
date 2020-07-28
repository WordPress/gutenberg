/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '../';
import NavigationBackButton from '../back-button';
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
	const items = data.map( ( item ) => {
		item.onClick = () => setActive( item.id );
		return item;
	} );

	return (
		<Navigation active={ active } items={ items }>
			<NavigationBackButton
				nullText="Dashboard"
				rootText="WooCommerce Home"
				onClick={ ( item ) => ( item ? setActive( item.id ) : null ) }
			/>
			<NavigationTitle rootText="WooCommerce Home" />
			<NavigationMenu />
			<br />
			<NavigationMenu id={ 'secondary' } />
		</Navigation>
	);
}

export const _default = () => {
	return <Example />;
};
