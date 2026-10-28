import {
	comment,
	dashboard,
	layout,
	media,
	navigation,
	page,
	people,
	plugins,
	post,
	settings,
	styles,
	symbol,
	symbolFilled,
} from '@wordpress/icons';
import { dispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';

/**
 * Switch boot to the shell layout, and give the application menu its icons.
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	dispatch( bootStore ).setLayout( 'shell' );

	const menuIcons: Record< string, React.ReactElement > = {
		dashboard,
		posts: post,
		pages: page,
		media,
		comments: comment,
		styles,
		templates: layout,
		templateParts: symbolFilled,
		patterns: symbol,
		navigation,
		plugins,
		users: people,
		settings,
	};

	Object.entries( menuIcons ).forEach( ( [ id, icon ] ) => {
		dispatch( bootStore ).updateMenuItem( id, { icon } );
	} );

	// Where the bar sends you to edit what the site frame shows. Matches the
	// extensible site editor, whose edit routes this page shares.
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
}
