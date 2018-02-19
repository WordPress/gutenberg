import '@wordpress/jest-console';

let registerEditorMenuItem, getEditorMenuItems;
function requireAll() {
	const core = require( '../editor-menu-item' );
	registerEditorMenuItem = core.registerEditorMenuItem;
	getEditorMenuItems = core.getEditorMenuItems;
}

requireAll();

describe( 'registerEditorMenuItem', () => {
} );

describe( 'getEditorMenuItems', () => {
} );
