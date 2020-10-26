/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_TEMPLATES, MENU_TEMPLATES_ALL } from '../constants';

export default function TemplatesAllMenu() {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
				_fields: 'id,slug',
			} ),
		[]
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATES_ALL }
			title={ __( 'All Templates' ) }
			parentMenu={ MENU_TEMPLATES }
		>
			{ map( templates, ( template ) => (
				<TemplateNavigationItem
					itemId={ template.id }
					itemType="wp_template"
					key={ `wp_template-${ template.id }` }
				/>
			) ) }
		</NavigationMenu>
	);
}
