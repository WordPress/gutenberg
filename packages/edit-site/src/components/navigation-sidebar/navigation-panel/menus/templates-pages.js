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
import { MENU_TEMPLATES, MENU_TEMPLATES_PAGES } from '../constants';

export default function TemplatesPagesMenu( { templates, onActivateItem } ) {
	const defaultTemplate = templates?.find( ( { slug } ) => slug === 'page' );
	const specificPageTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'page-' )
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			<NavigationGroup title={ _x( 'Specific', 'specific templates' ) }>
				<TemplateNavigationItems
					templates={ specificPageTemplates }
					onActivateItem={ onActivateItem }
				/>
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title={ _x( 'General', 'general templates' ) }>
					<TemplateNavigationItems
						templates={ defaultTemplate }
						onActivateItem={ onActivateItem }
					/>
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
