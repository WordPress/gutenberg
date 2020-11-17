/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_TEMPLATES, MENU_TEMPLATES_ALL } from '../constants';

export default function TemplatesAllMenu( { templates } ) {
	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_ALL }
			title={ __( 'All Templates' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			{ map( templates, ( template ) => (
				<TemplateNavigationItem
					item={ template }
					key={ `wp_template-${ template.id }` }
				/>
			) ) }
		</NavigationMenu>
	);
}
