import '@wordpress/jest-console';

let registerMoreMenuItem, getMoreMenuItems, registerSidebar;
function requireAll() {
	jest.resetModules();
	const sidebar = require( '../sidebar' );
	registerSidebar = sidebar.registerSidebar;
	const moreMenuItem = require( '../more-menu-item' );
	registerMoreMenuItem = moreMenuItem.registerMoreMenuItem;
	getMoreMenuItems = moreMenuItem.getMoreMenuItems;
}

requireAll();

describe( 'registerMoreMenuItem', () => {
	beforeEach( requireAll );

	it( 'successfully registers a more menu item', () => {
		registerSidebar( 'plugins/sidebar', {
			title: 'Plugin Title',
			render: () => 'Component',
		} );
		registerMoreMenuItem( 'gutenberg/plugin', {
			title: 'Plugin',
			target: 'gutenberg/plugin',
		} );
		expect( getMoreMenuItems()[ 'gutenberg/plugin' ] ).toBeDefined();
	} );
} );
