/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItems from '../template-navigation-items';

export default function TemplatesAllMenu( { templates, onActivateItem } ) {
	return (
		<NavigationMenu
			menu="templates-all"
			title="All templates"
			parentMenu="templates"
		>
			<TemplateNavigationItems
				templates={ templates }
				onActivateItem={ onActivateItem }
			/>
		</NavigationMenu>
	);
}
