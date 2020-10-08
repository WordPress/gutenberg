/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItems from '../template-navigation-items';

export default function TemplatesAllMenu( { templates, onActivateItem } ) {
	return (
		<NavigationMenu
			menu="templates-all"
			title={ __( 'All Templates' ) }
			parentMenu="templates"
		>
			<TemplateNavigationItems
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>
		</NavigationMenu>
	);
}
