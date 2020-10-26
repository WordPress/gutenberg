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
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_TEMPLATES, MENU_TEMPLATES_PAGES } from '../constants';

export default function TemplatesPagesMenu() {
	const { defaultTemplate, specificTemplates } = useSelect( ( select ) => {
		const templates = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template',
			{
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
				_fields: 'id,slug',
			}
		);
		return {
			defaultTemplate: templates?.find( ( { slug } ) => slug === 'page' ),
			specificTemplates: templates?.filter( ( { slug } ) =>
				slug.startsWith( 'page-' )
			),
		};
	}, [] );

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			<NavigationGroup title={ _x( 'Specific', 'specific templates' ) }>
				{ map( specificTemplates, ( template ) => (
					<TemplateNavigationItem
						itemId={ template.id }
						itemType="wp_template"
						key={ `wp_template-${ template.id }` }
					/>
				) ) }
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title={ _x( 'General', 'general templates' ) }>
					<TemplateNavigationItem
						itemId={ defaultTemplate.id }
						itemType="wp_template"
						key={ `wp_template-${ defaultTemplate.id }` }
					/>
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
