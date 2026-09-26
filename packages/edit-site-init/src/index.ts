import {
	home,
	siteLogo,
	styles,
	navigation,
	page,
	symbol,
	symbolFilled,
	layout,
} from '@wordpress/icons';
import { dispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Initialize edit-site menu items with icons.
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	// Define icons for menu items
	const menuIcons: Record< string, { icon: React.ReactElement } > = {
		home: { icon: home },
		identity: { icon: siteLogo },
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

	/*
	 * Where the canvas sends you to edit an entity, and where it returns you
	 * once one is gone. Every post type is edited at the same generic route;
	 * only the design post types are listed somewhere of their own, at the
	 * redirects that pick the default view.
	 *
	 * A plugin adding its own post type registers the same way, from a script
	 * module enqueued on this page.
	 */
	const entityLinks: Record< string, { list: string; edit?: string } > = {
		default: { list: '/types/{type}', edit: '/types/{type}/edit/{id}' },
		wp_template: { list: '/templates' },
		wp_template_part: { list: '/template-parts' },
		wp_block: { list: '/patterns' },
		wp_navigation: { list: '/navigation' },
	};

	Object.entries( entityLinks ).forEach( ( [ postType, links ] ) => {
		dispatch( bootStore ).registerEntityLinks( postType, {
			...entityLinks.default,
			...links,
		} );
	} );

	// Read without a fallback where they are used, so they are off unless seeded.
	dispatch( preferencesStore ).setDefaults( 'core', {
		allowRightClickOverrides: true,
		enableChoosePatternModal: true,
		showBlockBreadcrumbs: true,
	} );
}
