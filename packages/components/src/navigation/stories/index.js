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
	const activeItem = data.find( ( item ) => item.id === active );
	const parentItem =
		activeItem && activeItem.parent
			? data.find( ( item ) => item.id === activeItem.parent )
			: null;
	const title = parentItem ? parentItem.title : 'WooCommerce Home';
	const items = data.map( ( item ) => {
		item.onClick = () => setActive( item.id );
		return item;
	} );

	return (
		<Navigation active={ active } items={ items }>
			{ activeItem && activeItem.parent && (
				<NavigationBackButton
					onClick={ () => setActive( activeItem.parent ) }
				>
					{ title }
				</NavigationBackButton>
			) }
			<NavigationTitle>{ title }</NavigationTitle>
			<NavigationMenu />
			<NavigationMenu id={ 'secondary' } />
		</Navigation>
	);
}

export const _default = () => {
	return <Example />;
};
