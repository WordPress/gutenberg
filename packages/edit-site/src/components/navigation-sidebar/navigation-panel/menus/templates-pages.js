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
import { MENU_TEMPLATES, MENU_TEMPLATES_PAGES } from '../constants';

export default function TemplatesPagesMenu( { templates } ) {
	const specificTemplates =
		templates?.filter( ( { slug } ) => slug.startsWith( 'page-' ) ) ?? [];

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_TEMPLATES }
			isEmpty={ specificTemplates.length === 0 }
		>
			{ map( specificTemplates, ( template ) => (
				<TemplateNavigationItem
					item={ template }
					key={ `wp_template-${ template.id }` }
				/>
			) ) }
		</NavigationMenu>
	);
}
