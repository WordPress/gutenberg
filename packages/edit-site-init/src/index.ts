/**
 * WordPress dependencies
 */
import {
	brush,
	cog,
	home,
	layout,
	navigation,
	page,
	post,
	postList,
	siteLogo,
	styles,
	symbol,
	symbolFilled,
} from '@wordpress/icons';
import { dispatch, select } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';

/**
 * Initialize edit-site menu items with icons.
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	// Define icons for menu items
	const menuIcons: Record< string, { icon: React.ReactElement } > = {
		home: { icon: home },
		pages: { icon: page },
		content: { icon: postList },
		navigation: { icon: navigation },
		design: { icon: brush },
		styles: { icon: styles },
		identity: { icon: siteLogo },
		advanced: { icon: cog },
		patterns: { icon: symbol },
		templateParts: { icon: symbolFilled },
		templates: { icon: layout },
	};

	// Update each menu item with its icon
	Object.entries( menuIcons ).forEach( ( [ id, { icon } ] ) => {
		dispatch( bootStore ).updateMenuItem( id, { icon } );
	} );

	( select( bootStore ).getMenuItems() as Array< { id: string } > ).forEach(
		( menuItem ) => {
			if ( menuItem.id.startsWith( 'content-' ) ) {
				dispatch( bootStore ).updateMenuItem( menuItem.id, {
					icon: post,
				} );
			}
		}
	);
}
