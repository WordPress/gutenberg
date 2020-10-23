/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';
import TemplateNavigationItems from '../template-navigation-items';
import TemplatePostsMenu from './templates-posts';
import {
	MENU_ROOT,
	MENU_TEMPLATES,
	MENU_TEMPLATES_ALL,
	MENU_TEMPLATES_PAGES,
	MENU_TEMPLATES_POSTS,
	TEMPLATES_GENERAL,
} from '../constants';
import { useSelect } from '@wordpress/data';
import TemplatesAllMenu from './templates-all';
import NewTemplateDropdown from '../new-template-dropdown';

export default function TemplatesMenu( { onActivateItem } ) {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			} ),
		[]
	);

	const generalTemplates = templates?.filter( ( { slug } ) =>
		TEMPLATES_GENERAL.includes( slug )
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES }
			title={ __( 'Templates' ) }
			titleAction={ <NewTemplateDropdown /> }
			parentMenu={ MENU_ROOT }
		>
			<NavigationItem
				navigateToMenu={ MENU_TEMPLATES_ALL }
				title={ _x( 'All', 'all templates' ) }
			/>
			<NavigationItem
				navigateToMenu={ MENU_TEMPLATES_PAGES }
				title={ __( 'Pages' ) }
			/>
			<NavigationItem
				navigateToMenu={ MENU_TEMPLATES_POSTS }
				title={ __( 'Posts' ) }
			/>

			<TemplateNavigationItems
				templates={ generalTemplates }
				onActivateItem={ onActivateItem }
			/>

			<TemplatePostsMenu
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>

			<TemplatesPagesMenu
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>

			<TemplatesAllMenu
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>
		</NavigationMenu>
	);
}
