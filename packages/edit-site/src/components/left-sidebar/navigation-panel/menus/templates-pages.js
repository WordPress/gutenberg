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

export default function TemplatesPagesMenu( { templates, onActiveIdChange } ) {
	const defaultTemplate = templates?.find( ( { slug } ) => slug === 'page' );
	const specificPageTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'page-' )
	);

	if (
		! defaultTemplate &&
		( ! specificPageTemplates || specificPageTemplates.length === 0 )
	) {
		return null;
	}

	return (
		<NavigationMenu
			menu="templates-pages"
			title="Pages"
			parentMenu="templates"
		>
			<NavigationGroup title="Specific">
				<TemplateNavigationItems
					templates={ specificPageTemplates }
					onActivate={ onActiveIdChange }
				/>
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title="General">
					<TemplateNavigationItems
						templates={ defaultTemplate }
						onActivate={ onActiveIdChange }
					/>
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
