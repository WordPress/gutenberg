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
import { MENU_TEMPLATES, MENU_TEMPLATES_POSTS } from '../constants';

export default function TemplatesPostsMenu( { templates } ) {
	const specificTemplates =
		templates?.filter( ( { slug } ) => slug.startsWith( 'post-' ) ) ?? [];

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_POSTS }
			title={ __( 'Posts' ) }
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
