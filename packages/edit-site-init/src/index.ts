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
	cog,
	siteLogo,
	color,
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
		customize: { icon: cog },
		'customize-identity': { icon: siteLogo },
		'customize-colors': { icon: color },
		'customize-typography': { icon: typography },
		'customize-navigation': { icon: navigation },
		styles: { icon: styles },
		navigation: { icon: navigation },
		pages: { icon: page },
		templateParts: { icon: symbolFilled },
		patterns: { icon: symbol },
		templates: { icon: layout },
	};

	// Update each menu item with its icon
	Object.entries( menuIcons ).forEach( ( [ id, { icon } ] ) => {
		dispatch( bootStore ).updateMenuItem( id, { icon } );
	} );

	// Mark the Customize item as a drilldown so clicking it reveals sub-items.
	dispatch( bootStore ).updateMenuItem( 'customize', {
		parent_type: 'drilldown',
	} );
}
