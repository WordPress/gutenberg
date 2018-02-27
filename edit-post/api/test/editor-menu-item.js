import '@wordpress/jest-console';

let registerEditorMenuItem, getEditorMenuItems, registerSidebar;
function requireAll() {
	jest.resetModules();
	const sidebar = require( '../sidebar' );
	registerSidebar = sidebar.registerSidebar;
	const editorMenuItem = require( '../editor-menu-item' );
	registerEditorMenuItem = editorMenuItem.registerEditorMenuItem;
	getEditorMenuItems = editorMenuItem.getEditorMenuItems;
}

requireAll();

describe( 'registerEditorMenuItem', () => {
	beforeEach( requireAll );

	it( 'successfully registers a editor menu item', () => {
		registerSidebar( 'plugins/sidebar', {
			title: 'Plugin Title',
			render: () => 'Component',
		} );
		registerEditorMenuItem( 'gutenberg/plugin', {
			title: 'Plugin',
			target: 'gutenberg/plugin',
		} );
		expect( getEditorMenuItems()[ 'gutenberg/plugin' ] ).toBeDefined();
	} );
} );
