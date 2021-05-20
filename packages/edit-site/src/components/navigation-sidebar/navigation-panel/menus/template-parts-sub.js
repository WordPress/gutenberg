/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_TEMPLATE_PARTS } from '../constants';

export default function TemplatePartsSubMenu( { menu, title, templateParts } ) {
	return (
		<NavigationMenu
			menu={ menu }
			title={ title }
			parentMenu={ MENU_TEMPLATE_PARTS }
			isEmpty={ ! templateParts || templateParts.length === 0 }
		>
			{ map( templateParts, ( templatePart ) => (
				<TemplateNavigationItem
					item={ templatePart }
					key={ `wp_template_part-${ templatePart.id }` }
				/>
			) ) }
		</NavigationMenu>
	);
}
