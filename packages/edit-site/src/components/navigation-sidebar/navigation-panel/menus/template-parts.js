/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_ROOT, MENU_TEMPLATE_PARTS } from '../constants';

export default function TemplatePartsMenu() {
	const templateParts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			}
		);
	}, [] );

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATE_PARTS }
			title={ __( 'Template Parts' ) }
			parentMenu={ MENU_ROOT }
		>
			{ map( templateParts, ( templatePart ) => (
				<TemplateNavigationItem
					item={ templatePart }
					key={ `wp_template_part-${ templatePart.id }` }
				/>
			) ) }

			{ ! templateParts && <NavigationItem title={ __( 'Loading…' ) } /> }
		</NavigationMenu>
	);
}
