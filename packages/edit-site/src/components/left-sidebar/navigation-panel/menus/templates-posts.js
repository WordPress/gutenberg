/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItems from '../template-navigation-items';

const GENERAL_TEMPLATES = [ 'single-post', 'archive-post', 'home' ];

export default function TemplatePostsMenu( { templates, onActiveIdChange } ) {
	const generalTemplates = templates?.find( ( { slug } ) =>
		GENERAL_TEMPLATES.includes( slug )
	);
	const specificTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'post-' )
	);

	return (
		<NavigationMenu
			menu="templates-posts"
			title="Posts"
			parentMenu="templates"
		>
			<NavigationGroup title="Specific">
				<TemplateNavigationItems
					templates={ specificTemplates }
					onActivate={ onActiveIdChange }
				/>
			</NavigationGroup>

			<NavigationGroup title="General">
				<TemplateNavigationItems
					templates={ generalTemplates }
					onActivate={ onActiveIdChange }
				/>
			</NavigationGroup>
		</NavigationMenu>
	);
}
