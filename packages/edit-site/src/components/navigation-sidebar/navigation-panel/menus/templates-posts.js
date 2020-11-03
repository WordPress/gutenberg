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
import {
	MENU_TEMPLATES,
	MENU_TEMPLATES_POSTS,
	TEMPLATES_POSTS,
} from '../constants';

export default function TemplatesPostsMenu( { templates } ) {
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
				{ map( specificTemplates, ( template ) => (
					<TemplateNavigationItem
						item={ template }
						key={ `wp_template-${ template.id }` }
					/>
				) ) }
			</NavigationGroup>

			<NavigationGroup title={ _x( 'General', 'general templates' ) }>
				{ map( generalTemplates, ( template ) => (
					<TemplateNavigationItem
						item={ template }
						key={ `wp_template-${ template.id }` }
					/>
				) ) }
			</NavigationGroup>
		</NavigationMenu>
	);
}
