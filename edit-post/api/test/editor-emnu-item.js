import '@wordpress/jest-console';

let registerEditorMenuItem, getEditorMenuItems, registerPlugin;
function requireAll() {
	jest.resetModules();
	const editorMenuItem = require( '../editor-menu-item' );
	registerEditorMenuItem = editorMenuItem.registerEditorMenuItem;
	getEditorMenuItems = editorMenuItem.getEditorMenuItems;
	const core = require( '../plugins-core' );
	registerPlugin = core.registerPlugin;
}

requireAll();

describe( 'registerEditorMenuItem', () => {
	beforeEach( requireAll );

	it( 'successfully registers a editor menu item', () => {
		registerPlugin( 'gutenberg/plugin', () => {} );
		registerEditorMenuItem( 'gutenberg/plugin', {
			title: 'Plugin',
			target: 'gutenberg/plugin',
		} );
		expect( getEditorMenuItems()[ 'gutenberg/plugin' ] ).toBeDefined();
	} );
} );
