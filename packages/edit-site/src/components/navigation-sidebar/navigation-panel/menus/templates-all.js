/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItems from '../template-navigation-items';
import { MENU_TEMPLATES, MENU_TEMPLATES_ALL } from '../constants';

export default function TemplatesAllMenu( { templates, onActivateItem } ) {
	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_ALL }
			title={ __( 'All Templates' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			<TemplateNavigationItems
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>
		</NavigationMenu>
	);
}
