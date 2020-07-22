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
	{ title: 'Home', slug: 'home', parent: 'root' },
	{
		title: 'Analytics',
		slug: 'analytics',
		parent: 'root',
		back: 'WooCommerce Home',
	},
	{
		title: 'Orders',
		slug: 'orders',
		parent: 'root',
		back: 'WooCommerce Home',
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
];

function Example() {
	return <Navigation data={ data } initial="home" />;
}

export const _default = () => {
	return <Example />;
};
