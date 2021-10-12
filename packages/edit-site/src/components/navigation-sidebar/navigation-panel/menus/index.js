/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MENU_TEMPLATES,
	MENU_TEMPLATE_PARTS,
	MENU_CONTENT_CATEGORIES,
	MENU_CONTENT_PAGES,
	MENU_CONTENT_POSTS,
} from '../constants';
import ContentPagesMenu from './content-pages';
import ContentCategoriesMenu from './content-categories';
import ContentPostsMenu from './content-posts';
import TemplatesMenu from './templates';
import TemplatePartsMenu from './template-parts';

export default function SiteMenu() {
	return (
		<NavigationMenu>
			<NavigationGroup title={ __( 'Theme' ) }>
				<NavigationItem
					title={ __( 'Templates' ) }
					navigateToMenu={ MENU_TEMPLATES }
				/>
				<NavigationItem
					title={ __( 'Template Parts' ) }
					navigateToMenu={ MENU_TEMPLATE_PARTS }
				/>
			</NavigationGroup>
			<NavigationGroup title={ __( 'Content' ) }>
				<NavigationItem
					title={ __( 'Pages' ) }
					navigateToMenu={ MENU_CONTENT_PAGES }
				/>
				<NavigationItem
					title={ __( 'Categories' ) }
					navigateToMenu={ MENU_CONTENT_CATEGORIES }
				/>
				<NavigationItem
					title={ __( 'Posts' ) }
					navigateToMenu={ MENU_CONTENT_POSTS }
				/>
			</NavigationGroup>
			<TemplatesMenu />
			<TemplatePartsMenu />
			<ContentPagesMenu />
			<ContentCategoriesMenu />
			<ContentPostsMenu />
		</NavigationMenu>
	);
}
