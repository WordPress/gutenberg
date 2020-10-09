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
import TemplateNavigationItems from '../template-navigation-items';

export default function TemplatePartsMenu( { onActivateItem } ) {
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
			menu="template-parts"
			title={ __( 'Template Parts' ) }
			parentMenu="root"
		>
			<TemplateNavigationItems
				entityType="wp_template_part"
				templates={ templateParts }
				onActivateItem={ onActivateItem }
			/>

			{ ! templateParts && <NavigationItem title={ __( 'Loading…' ) } /> }
		</NavigationMenu>
	);
}
