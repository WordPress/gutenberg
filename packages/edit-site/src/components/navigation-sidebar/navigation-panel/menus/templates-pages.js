/**
 * External dependencies
 */
import { map } from 'lodash';

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
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_TEMPLATES, MENU_TEMPLATES_PAGES } from '../constants';

export default function TemplatesPagesMenu( { templates } ) {
	const defaultTemplate = templates?.find( ( { slug } ) => slug === 'page' );
	const specificTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'page-' )
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			<NavigationGroup title={ _x( 'Specific', 'specific templates' ) }>
				{ map( specificTemplates, ( template ) => (
					<TemplateNavigationItem
						item={ template }
						key={ `wp_template-${ template.id }` }
					/>
				) ) }
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title={ _x( 'General', 'general templates' ) }>
					<TemplateNavigationItem item={ defaultTemplate } />
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
