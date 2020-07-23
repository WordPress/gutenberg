/**
 * Internal dependencies
 */
import Navigation from '../';

export default {
	title: 'Components/Navigation',
	component: Navigation,
};

const data = [
	{ title: 'WooCommerce', slug: 'root', back: 'Dashboard' },
	{ title: 'Home', slug: 'home', parent: 'root', menu: 'primary' },
	{
		title: 'Analytics',
		slug: 'analytics',
		parent: 'root',
		back: 'WooCommerce Home',
		menu: 'primary',
	},
	{
		title: 'Orders',
		slug: 'orders',
		parent: 'root',
		back: 'WooCommerce Home',
		menu: 'primary',
	},
	{
		title: 'Overview',
		slug: 'overview',
		parent: 'analytics',
	},
	{
		title: 'Products report',
		slug: 'products',
		parent: 'analytics',
	},
	{
		title: 'All orders',
		slug: 'all_orders',
		parent: 'orders',
	},
	{
		title: 'Payouts',
		slug: 'payouts',
		parent: 'orders',
	},
	{
		title: 'Settings',
		slug: 'settings',
		parent: 'root',
		back: 'WooCommerce Home',
		menu: 'secondary',
	},
	{
		title: 'Extensions',
		slug: 'extensions',
		parent: 'root',
		back: 'WooCommerce Home',
		menu: 'secondary',
	},
	{
		title: 'General',
		slug: 'general',
		parent: 'settings',
	},
	{
		title: 'Tax',
		slug: 'tax',
		parent: 'settings',
	},
	{
		title: 'My extensions',
		slug: 'my_extensions',
		parent: 'extensions',
	},
	{
		title: 'Marketplace',
		slug: 'marketplace',
		parent: 'extensions',
	},
];

function Example() {
	return <Navigation data={ data } initial="home" />;
}

export const _default = () => {
	return <Example />;
};
