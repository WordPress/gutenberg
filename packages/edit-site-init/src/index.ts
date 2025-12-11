/**
 * WordPress dependencies
 */
import {
	home,
	styles,
	navigation,
	page,
	symbol,
	symbolFilled,
	layout,
	typography,
} from '@wordpress/icons';
import { dispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';

/**
 * Initialize edit-site menu items with icons.
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	// Define icons for menu items
	const menuIcons: Record< string, { icon: React.ReactElement } > = {
		home: { icon: home },
		styles: { icon: styles },
		navigation: { icon: navigation },
		pages: { icon: page },
		templateParts: { icon: symbolFilled },
		patterns: { icon: symbol },
		templates: { icon: layout },
		fontList: { icon: typography },
	};

	// Update each menu item with its icon
	Object.entries( menuIcons ).forEach( ( [ id, { icon } ] ) => {
		dispatch( bootStore ).updateMenuItem( id, { icon } );
	} );
}
