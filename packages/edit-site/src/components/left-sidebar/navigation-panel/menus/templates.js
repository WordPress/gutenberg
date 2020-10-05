/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';
import useTemplates from '../use-templates';
import TemplateNavigationItems from '../template-navigation-items';
import TemplatePostsMenu from './templates-posts';

const GENERAL_TEMPLATE_SLUGS = [
	'front-page',
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

export default function TemplatesMenu( { onActiveIdChange } ) {
	const templates = useTemplates();
	const generalTemplates = templates?.filter( ( { slug } ) =>
		GENERAL_TEMPLATE_SLUGS.includes( slug )
	);

	return (
		<NavigationMenu menu="templates" title="Templates" parentMenu="root">
			<NavigationItem navigateToMenu="templates-pages" title="Pages" />
			<NavigationItem navigateToMenu="templates-posts" title="Posts" />

			<TemplateNavigationItems
				templates={ generalTemplates }
				onActivate={ onActiveIdChange }
			/>

			<TemplatePostsMenu
				templates={ templates }
				onActiveIdChange={ onActiveIdChange }
			/>

			<TemplatesPagesMenu
				templates={ templates }
				onActiveIdChange={ onActiveIdChange }
			/>
		</NavigationMenu>
	);
}
