/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItems from '../template-navigation-items';
import {
	MENU_TEMPLATES,
	MENU_TEMPLATES_POSTS,
	TEMPLATES_POSTS,
} from '../constants';

export default function TemplatePostsMenu( { templates, onActivateItem } ) {
	const generalTemplates = templates?.find( ( { slug } ) =>
		TEMPLATES_POSTS.includes( slug )
	);
	const specificTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'post-' )
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_POSTS }
			title={ __( 'Posts' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			<NavigationGroup title={ _x( 'Specific', 'specific templates' ) }>
				<TemplateNavigationItems
					templates={ specificTemplates }
					onActivateItem={ onActivateItem }
				/>
			</NavigationGroup>

			<NavigationGroup title={ _x( 'General', 'general templates' ) }>
				<TemplateNavigationItems
					templates={ generalTemplates }
					onActivateItem={ onActivateItem }
				/>
			</NavigationGroup>
		</NavigationMenu>
	);
}
